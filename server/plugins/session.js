import fastifySession from "@fastify/session";
import fp from "fastify-plugin";
import fastifyCookie from "@fastify/cookie";


async function secureSessionPlugin(fastify) {
  const { COOKIE_SECRET, NODE_ENV } = fastify.config;

  await fastify.register(fastifyCookie);

  fastify.register(fastifySession, {
    secret: COOKIE_SECRET,
    cookie: {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  });
}

export default fp(secureSessionPlugin);
