import path, { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import AutoLoad from "@fastify/autoload";
import encryptedSession from "./encrypted-session.js";

export const options = {};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default async function (fastify, opts) {
  fastify.register(encryptedSession, {
    ...opts,
  });

  await fastify.register(AutoLoad, {
    dir: join(__dirname, "plugins"),
    options: { ...opts },
  });

  await fastify.register(AutoLoad, {
    dir: join(__dirname, "routes"),
    options: { ...opts },
  });


}