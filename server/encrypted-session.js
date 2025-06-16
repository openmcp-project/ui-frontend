import secureSession from "@fastify/secure-session";
import fp from "fastify-plugin";
import fastifyCookie from "@fastify/cookie";
import fastifySession from '@fastify/session';



export const COOKIE_NAME_ENCRYPTION_KEY = "session_encrpytion_key";
export const COOKIE_NAME_SESSION = "session-cookie";

export const SECURE_SESSION_NAME = "encryptedSessionInternal";
export const UNDERLYING_SESSION_NAME = "underlyingSessionNotPerUserEncrypted";

// This is the key used to store the encryption key in the secure session cookie
export const SECURE_COOKIE_KEY_ENCRYPTION_KEY = "encryptionKey";

export const REQUEST_DECORATOR = "encryptedSession";

async function encryptedSession(fastify) {
  const { COOKIE_SECRET, NODE_ENV } = fastify.config;

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
    secret: "test-secret-32-char-or-longerasdasdasdasdasdasdasdasdasdasd",
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
    if (request[SECURE_SESSION_NAME].get(SECURE_COOKIE_KEY_ENCRYPTION_KEY) === undefined) {
      console.log("encryption key not found, creating new one");

      //TODO: create a new encrpytion key and set it in the secure session cookie
      request[SECURE_SESSION_NAME].set(SECURE_COOKIE_KEY_ENCRYPTION_KEY, "TODO_SHOULD_BE_RANDOM");
      request[REQUEST_DECORATOR] = new Session()
    } else {
      console.log("encryption key found, using existing one");
      const encryptedStore = request.session.get("encryptedStore");
      if (encryptedStore) {
        try {
          //TODO: add decrypted step
          const decryptedStore = JSON.parse(encryptedStore);
          request[REQUEST_DECORATOR] = new Session(decryptedStore);
        } catch (error) {
          console.error("Failed to parse encrypted store:", error);
          request[REQUEST_DECORATOR] = new Session();
        }
      } else {
        // we could not parse the encrypted store, so we create a new one and it would overwrite the previously stored store.
        console.log("No encrypted store found, creating new session");
        request[REQUEST_DECORATOR] = new Session();
      }
    }

    next()
  })

  //TODO maybe move to onResponse after res is send. Lifecycle Doc https://fastify.dev/docs/latest/Reference/Lifecycle/
  // onSend is called before the response is send. Here we take encrypt the Session object and store it in the fastify-session.
  // Then we also want to make sure the unencrypted object is removed from memory
  fastify.addHook('onSend', (request, reply, _payload, next) => {
    console.log("onSend hook called", request[REQUEST_DECORATOR].data());

    //on send we will encrypt the store and set it in the backend-side session store
    console.log("Encrypted store that will be set in session:", JSON.stringify(request[REQUEST_DECORATOR].data()));

    //TODO: encrypt the data here. 
    //we store everything in one value in the session, that might be problematic for future redis with expiration times per key. we might want to split this
    const encryptedData = JSON.stringify(request[REQUEST_DECORATOR].data())

    //remove unencrypted data from memory
    delete request[REQUEST_DECORATOR];
    request[REQUEST_DECORATOR] = null;

    request.session.encryptedStore = encryptedData;
    next()
  })


}

export default fp(encryptedSession);

// maybe use a closure to encapsulate the session data so noone can reference it and we are the only ones keeping a reference
function createEncryptedSession(previousValue) {
  let encryptedStore = {}; // Private variable
  if (previousValue) {
    encryptedStore = previousValue;
  }
  return {
    set(key, value) {
      encryptedStore[key] = value;
    },
    get(key) {
      return encryptedStore[key];
    },
    delete(key) {
      delete encryptedStore[key];
    },
    clear() {
      encryptedStore = {}; // Clear all data
    },
  };
}

class Session {
  #data;

  constructor(obj) {
    this.#data = obj || {}
  }

  get(key) {
    return this.#data[key]
  }

  set(key, value) {
    this.#data[key] = value
  }

  delete(key) {
    this.#data[key] = undefined
  }

  data() {
    const copy = {
      ...this.#data
    }

    return copy
  }
}
