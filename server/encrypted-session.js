import secureSession from "@fastify/secure-session";
import fp from "fastify-plugin";
import fastifyCookie from "@fastify/cookie";
import fastifySession from '@fastify/session';
import crypto from "node:crypto"



export const COOKIE_NAME_ENCRYPTION_KEY = "session_encrpytion_key";
export const COOKIE_NAME_SESSION = "session-cookie";

export const SECURE_SESSION_NAME = "encryptedSessionInternal";
export const UNDERLYING_SESSION_NAME = "underlyingSessionNotPerUserEncrypted";

// This is the key used to store the encryption key in the secure session cookie
export const SECURE_COOKIE_KEY_ENCRYPTION_KEY = "encryptionKey";

export const REQUEST_DECORATOR = "encryptedSession";

async function encryptedSession(fastify) {
  const { COOKIE_SECRET, SESSION_SECRET, NODE_ENV } = fastify.config;

  await fastify.register(fastifyCookie);

  fastify.register(secureSession, {
    secret: Buffer.from(COOKIE_SECRET, "hex"),
    cookieName: COOKIE_NAME_ENCRYPTION_KEY,
    sessionName: SECURE_SESSION_NAME,
    cookie: {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  });


  fastify.register(fastifySession, {
    secret: SESSION_SECRET,
    cookieName: COOKIE_NAME_SESSION,
    // sessionName: UNDERLYING_SESSION_NAME, //NOT POSSIBLE to change the name it is decorated on the request object
    cookie: {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  });

  fastify.addHook('onRequest', (request, _reply, next) => {
    //we use secure-session cookie to get the encryption key and decrypt the store
    if (!request[SECURE_SESSION_NAME].get(SECURE_COOKIE_KEY_ENCRYPTION_KEY)) {
      request.log.info({ "plugin": "encrypted-session" }, "user-side encryption key not found, creating new one");

      let newEncryptionKey = generateSecureEncryptionKey();
      request[SECURE_SESSION_NAME].set(SECURE_COOKIE_KEY_ENCRYPTION_KEY, newEncryptionKey.toString('base64'));
      request[REQUEST_DECORATOR] = createStore()
      newEncryptionKey = undefined
    } else {
      request.log.info({ "plugin": "encrypted-session" }, "user-side encryption key found, using existing one");

      const loadedEncryptionKey = Buffer.from(request[SECURE_SESSION_NAME].get(SECURE_COOKIE_KEY_ENCRYPTION_KEY), "base64");

      const encryptedStore = request.session.get("encryptedStore");
      if (encryptedStore) {
        try {
          const { cipherText, iv, tag } = encryptedStore;

          const decryptedCypherText = decryptSymetric(cipherText, iv, tag, loadedEncryptionKey);
          const decryptedStore = JSON.parse(decryptedCypherText);
          request[REQUEST_DECORATOR] = createStore(decryptedStore);
        } catch (error) {
          request.log.error({ "plugin": "encrypted-session" }, "Failed to parse encrypted session store", error);
          request[REQUEST_DECORATOR] = createStore();
        }
      } else {
        // we could not parse the encrypted store, so we create a new one and it would overwrite the previously stored store.
        request.log.info({ "plugin": "encrypted-session" }, "No encrypted store found, creating new empty store");
        request[REQUEST_DECORATOR] = createStore();
      }
    }

    next()
  })

  //TODO maybe move to onResponse after res is send. Lifecycle Doc https://fastify.dev/docs/latest/Reference/Lifecycle/
  // onSend is called before the response is send. Here we take encrypt the Session object and store it in the fastify-session.
  // Then we also want to make sure the unencrypted object is removed from memory
  fastify.addHook('onSend', (request, reply, _payload, next) => {
    const encryptionKey = Buffer.from(request[SECURE_SESSION_NAME].get(SECURE_COOKIE_KEY_ENCRYPTION_KEY), "base64");
    if (!encryptionKey) {
      // if no encryption key is found in the secure session, we cannot encrypt the store. This should not happen since an encrption key is generated when the request arrived
      request.log.error({ "plugin": "encrypted-session" }, "No encryption key found in secure session, cannot encrypt store");
      throw new Error("No encryption key found in secure session, cannot encrypt store");
    }

    //we store everything in one value in the session, that might be problematic for future redis with expiration times per key. we might want to split this
    const stringifiedData = request[REQUEST_DECORATOR].stringify();
    const { cipherText, iv, tag } = encryptSymetric(stringifiedData, encryptionKey);

    //remove unencrypted data from memory
    delete request[REQUEST_DECORATOR];
    request[REQUEST_DECORATOR] = null;

    request.session.set("encryptedStore", {
      cipherText,
      iv,
      tag,
    });
    request.log.info("store encrypted and set into request.session.encryptedStore");
    next()
  })


}

export default fp(encryptedSession);

// use a closure to encapsulate the session data so noone can reference it and we are the only ones keeping a reference
function createStore(previousValue) {
  let unencryptedStore = {}; // Private variable
  if (previousValue) {
    unencryptedStore = previousValue;
  }
  return {
    set(key, value) {
      unencryptedStore[key] = value;
    },
    get(key) {
      return unencryptedStore[key];
    },
    delete(key) {
      delete unencryptedStore[key];
    },
    stringify() {
      return JSON.stringify(unencryptedStore);
    },
    clear() {
      unencryptedStore = {}; // Clear all data
    },
  };
}

// generates a secure encryption key for aes-256-gcm.
// Returns a buffer of 32 bytes (256 bits).
function generateSecureEncryptionKey() {
  // Generates a secure random encryption key of 32 bytes (256 bits)
  return crypto.randomBytes(32);
}

// uses authenticated symetric encryption (aes-256-gcm) to encrypt the plaintext with the key.
// If no adequate key is given, it throws an error
// The key needs to be 32bytes (256bits) as type buffer. Needs to be cryptographically secure random generated e.g. with `crypto.randomBytes(32)`
// it outputs cipherText (bas64 encoded string), the initialisation vector (iv) (hex string) and the authentication tag (hex string).
function encryptSymetric(plaintext, key) {
  if (key == undefined) {
    throw new Error("Key must be provided");
  }
  if (key.length < 32) {
    throw new Error("Key must be at least 32bye = 256 bits long");
  }

  if (!(key instanceof Buffer)) {
    throw new Error("Key must be a Buffer");
  }

  if (plaintext == undefined) {
    throw new Error("Plaintext must be provided");
  }

  if (typeof plaintext !== "string") {
    throw new Error("Plaintext must be a string utf8 encoded");
  }

  if (!crypto.getCiphers().includes("aes-256-gcm")) {
    throw new Error("Cipher suite aes-256-gcm is not available");
  }

  // initialisation vector. Needs to be stored along the cipherText.
  // MUST NOT be reused and MUST be randomly generated for EVERY encryption operation. Otherwise using the same key would be insecure.
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  let cipherText = cipher.update(plaintext, 'utf8', 'base64');
  cipherText += cipher.final('base64');

  // the authentication tag is used to verify the integrity of the ciphertext (that it has not been tampered with).
  // stored alongside the ciphertext and iv as it can only be changed with the secret key
  const tag = cipher.getAuthTag();

  return {
    cipherText,
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
  }
}

// uses authenticated symetric encryption (aes-256-gcm) to decrypt the ciphertext with the key.
// requires the ciphertext, the initialisation vector (iv)(hex string), the authentication tag (tag) (hex string)  and the key (buffer) to be provided.
//it thows an error if the decryption or tag verification fails
function decryptSymetric(cipherText, iv, tag, key) {
  if (key == undefined) {
    throw new Error("Key must be provided");
  }
  if (key.length < 32) {
    throw new Error("Key must be at least 32bye = 256 bits long");
  }

  if (!(key instanceof Buffer)) {
    throw new Error("Key must be a Buffer");
  }

  if (cipherText == undefined) {
    throw new Error("Ciphertext must be provided");
  }

  if (typeof cipherText !== "string") {
    throw new Error("Ciphertext must be a string utf8 encoded");
  }

  if (!crypto.getCiphers().includes("aes-256-gcm")) {
    throw new Error("Cipher suite aes-256-gcm is not available");
  }

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));

  let decrypted = decipher.update(cipherText, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}