import path, { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import AutoLoad from "@fastify/autoload";
import envPlugin from "./config/env.js";
import encryptedSession from "./encrypted-session.js";

export const options = {};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default async function (fastify, opts) {
  await fastify.register(envPlugin);
  await fastify.register(testRoute)

  //   await fastify.register(AutoLoad, {
  //     dir: join(__dirname, "plugins"),
  //     options: { ...opts },
  //   });

  //   await fastify.register(AutoLoad, {
  //     dir: join(__dirname, "routes"),
  //     options: { ...opts },
  //   });
}

function testRoute(fastify, opts) {
  fastify.register(encryptedSession, {
    ...opts,
  });

  // this route basically stores the query parameter test in the encrypted session store and reads it on subequent requests
  fastify.get("/test", async (request, reply) => {
    // read query param
    const { query } = request;

    // we use the encrypted session api with get/set like the normal session api
    const previousValue = request.encryptedSession.get("testFromClient");

    console.log("value stored before request is processed:", request.encryptedSession.data());

    if (query.test) {
      request.encryptedSession.set("testFromClient", query.test);
    }

    request.encryptedSession.set("testKey", "testValue");

    return { message: "Test route works!", previousValue: previousValue || "not set", currentValue: request.encryptedSession.get("testFromClient") || "not set" };
  });
}