import secureSession from '@fastify/secure-session';
import fp from 'fastify-plugin';
import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';
import crypto from 'node:crypto';

// name of the request decorator this plugin exposes. Using request.encryptedSession can be used with set, get, clear delete
// functions and the encryption will then be handled in this plugin.
export const REQUEST_DECORATOR = 'encryptedSession';
// name of the request decorator of the secure-session library that stores its session data in an encrypted cookie on user side.
export const ENCRYPTED_COOKIE_REQUEST_DECORATOR = 'encryptedSessionInternal';
// name of the request decorator of the session library that is used as underlying store for this library.
export const UNDERLYING_SESSION_NAME_REQUEST_DECORATOR = 'underlyingSessionNotPerUserEncrypted';

// name of the secure-session cookie that stores the encryption key on user side.
export const ENCRYPTION_KEY_COOKIE_NAME = 'session-encryption-key';
// the key used to store the encryption key in the secure-session cookie on user side.
export const ENCRYPTED_COOKIE_KEY_ENCRYPTION_KEY = 'encryptionKey';
// name of the cookie that stores the session identifier on user side.
export const SESSION_COOKIE_NAME = 'session';

// @ts-ignore
async function encryptedSession(fastify) {
  const { COOKIE_SECRET, SESSION_SECRET } = fastify.config;

  await fastify.register(fastifyCookie);

  fastify.register(secureSession, {
    secret: Buffer.from(COOKIE_SECRET, 'hex'),
    cookieName: ENCRYPTION_KEY_COOKIE_NAME,
    sessionName: ENCRYPTED_COOKIE_REQUEST_DECORATOR,
    cookie: {
      path: '/',
      httpOnly: true,
      sameSite: 'None', // cross-site cookies are needed for the session to work when embedded. By setting CORS to None and CSP.frame-anchestors we restrict the api calls from the browser that contain the cookies to originating from our site only.
      partitioned: true, // use for modern isolation of third party cookies when embedded, every embedded iframe (or not embedded) gets its own cookie partition
      secure: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  });
  fastify.register(fastifySession, {
    secret: SESSION_SECRET,
    cookieName: SESSION_COOKIE_NAME,
    // sessionName: UNDERLYING_SESSION_NAME, //NOT POSSIBLE to change the name it is decorated on the request object
    cookie: {
      path: '/',
      httpOnly: true,
      sameSite: 'None', // see secureSession cookie for explanation
      partitioned: true, // see secureSession cookie for explanation
      secure: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  });

  await fastify.decorateRequest(REQUEST_DECORATOR, {
    getter() {
      return createStore(this);
    },
  });
}

export default fp(encryptedSession);

// @ts-ignore
function createStore(request) {
  let unencryptedStore = {}; // Private variable

  //read previous values
  let userEncryptionKey = getUserEncryptionKeyFromUserCookie(request);
  if (!userEncryptionKey) {
    request.log.info({ plugin: 'encrypted-session' }, 'user-side encryption key not found, creating new one');

    userEncryptionKey = generateSecureEncryptionKey().toString('base64');
    setUserEncryptionKeyIntoUserCookie(request, userEncryptionKey);
  }

  const loadedEncryptionKey = Buffer.from(userEncryptionKey, 'base64');
  const encryptedStore = request.session.get('encryptedStore');
  if (encryptedStore) {
    try {
      const { cipherText, iv, tag } = encryptedStore;

      const decryptedCypherText = decryptSymetric(cipherText, iv, tag, loadedEncryptionKey);
      const decryptedStore = JSON.parse(decryptedCypherText);
      unencryptedStore = decryptedStore;
    } catch (error) {
      request.log.error({ plugin: 'encrypted-session' }, 'Failed to parse encrypted session store', error);
    }
  } else {
    // we could not parse the encrypted store, so we create a new one and it would overwrite the previously stored store.
    request.log.info({ plugin: 'encrypted-session' }, 'No encrypted store found, creating new empty store');
  }

  async function save() {
    const stringifiedData = JSON.stringify(unencryptedStore);
    const { cipherText, iv, tag } = encryptSymetric(stringifiedData, loadedEncryptionKey);

    request.session.set('encryptedStore', {
      cipherText,
      iv,
      tag,
    });
    await request.session.save();
    request.log.info('store encrypted and set into request.session.encryptedStore');
  }

  return {
    // @ts-ignore
    async set(key, value) {
      // @ts-ignore
      unencryptedStore[key] = value;
      await save();
    },
    // @ts-ignore
    get(key) {
      // @ts-ignore
      return unencryptedStore[key];
    },
    // @ts-ignore
    async delete(key) {
      // @ts-ignore
      delete unencryptedStore[key];
      await save();
    },
    async clear() {
      unencryptedStore = {}; // Clear all data
      await save();
    },
  };
}

// @ts-ignore
function getUserEncryptionKeyFromUserCookie(request) {
  return request[ENCRYPTED_COOKIE_REQUEST_DECORATOR].get(ENCRYPTED_COOKIE_KEY_ENCRYPTION_KEY);
}

// @ts-ignore
function setUserEncryptionKeyIntoUserCookie(request, key) {
  request[ENCRYPTED_COOKIE_REQUEST_DECORATOR].set(ENCRYPTED_COOKIE_KEY_ENCRYPTION_KEY, key.toString('base64'));
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
// @ts-ignore
function encryptSymetric(plaintext, key) {
  if (key == undefined) {
    throw new Error('Key must be provided');
  }
  if (key.length < 32) {
    throw new Error('Key must be at least 32 byte = 256 bits long');
  }

  if (!(key instanceof Buffer)) {
    throw new Error('Key must be a Buffer');
  }

  if (plaintext == undefined) {
    throw new Error('Plaintext must be provided');
  }

  if (typeof plaintext !== 'string') {
    throw new Error('Plaintext must be a string utf8 encoded');
  }

  if (!crypto.getCiphers().includes('aes-256-gcm')) {
    throw new Error('Cipher suite aes-256-gcm is not available');
  }

  // initialisation vector. Needs to be stored along the cipherText.
  // MUST NOT be reused and MUST be randomly generated for EVERY encryption operation. Otherwise using the same key would be insecure.
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let cipherText = cipher.update(plaintext, 'utf8', 'base64');
  cipherText += cipher.final('base64');

  // the authentication tag is used to verify the integrity of the ciphertext (that it has not been tampered with).
  // stored alongside the ciphertext and iv as it can only be changed with the secret key
  const tag = cipher.getAuthTag();

  return {
    cipherText,
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
  };
}

// uses authenticated symetric encryption (aes-256-gcm) to decrypt the ciphertext with the key.
// requires the ciphertext, the initialisation vector (iv)(hex string), the authentication tag (tag) (hex string)  and the key (buffer) to be provided.
//it thows an error if the decryption or tag verification fails
// @ts-ignore
function decryptSymetric(cipherText, iv, tag, key) {
  if (key == undefined) {
    throw new Error('Key must be provided');
  }
  if (key.length < 32) {
    throw new Error('Key must be at least 32 byte = 256 bits long');
  }

  if (!(key instanceof Buffer)) {
    throw new Error('Key must be a Buffer');
  }

  if (cipherText == undefined) {
    throw new Error('Ciphertext must be provided');
  }

  if (typeof cipherText !== 'string') {
    throw new Error('Ciphertext must be a string utf8 encoded');
  }

  if (!crypto.getCiphers().includes('aes-256-gcm')) {
    throw new Error('Cipher suite aes-256-gcm is not available');
  }

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));

  let decrypted = decipher.update(cipherText, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
