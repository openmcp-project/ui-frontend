import secureSession from "@fastify/secure-session";
import fp from "fastify-plugin";
import fastifyCookie from "@fastify/cookie";


export const COOKIE_NAME_ONBOARDING = "onboarding";

async function secureSessionPlugin(fastify) {
  const { COOKIE_SECRET, NODE_ENV } = fastify.config;

  await fastify.register(fastifyCookie);

  fastify.register(secureSession, {
    secret: Buffer.from(COOKIE_SECRET, "hex"),
    cookieName: COOKIE_NAME_ONBOARDING,
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
