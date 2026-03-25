// @ts-ignore
import fetch from 'node-fetch';
import fp from 'fastify-plugin';
import * as Sentry from '@sentry/node';

// TODO: After merging PR #466, remove the local @fastify/rate-limit registration
// that PR #466 adds here (fastify.register(rateLimit, { max: 5, ... })).
// Instead, use a route-level config override on the POST /feedback route:
//
//   fastify.post('/feedback', {
//     config: {
//       rateLimit: {
//         max: 5,
//         timeWindow: 60_000,
//         keyGenerator: (req) => req.encryptedSession.get('onboarding_accessToken') ?? req.ip,
//       },
//     },
//   }, async (request, reply) => { ... });
//
// The global rate-limit plugin (server/plugins/rate-limit.ts) handles registration.

// @ts-ignore
async function feedbackRoute(fastify) {
  const { FEEDBACK_SLACK_URL } = fastify.config;

  // @ts-ignore
  fastify.post('/feedback', async (request, reply) => {
    const { message, rating, user, environment } = request.body;

    if (!message || !rating || !user || !environment) {
      return reply.status(400).send({ error: 'Missing required fields' });
    }

    try {
      const res = await fetch(FEEDBACK_SLACK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, rating, user, environment }),
      });

      if (!res.ok) {
        const error = new Error(`Slack API error: ${res.status} ${res.statusText}`);
        Sentry.captureException(error, {
          extra: {
            status: res.status,
            statusText: res.statusText,
            user,
            environment
          }
        });

        return reply.status(500).send({
          error: `Slack API error. Status: ${res.status}${res.message ? ` | Message: ${res.message}` : ''}${res.error ? ` | Error: ${res.error}` : ''}`,
        });
      }
      return reply.send({ message: res });
    } catch (err) {
      Sentry.captureException(err, {
        extra: {
          user,
          environment
        }
      });
      fastify.log.error('Slack error:', err);
      return reply.status(500).send({ error: 'Request failed' });
    }
  });
}


export default fp(feedbackRoute);
