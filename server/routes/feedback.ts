import fp from 'fastify-plugin';
import * as Sentry from '@sentry/node';

const VALID_RATINGS = ['1', '2', '3', '4', '5'];
const MAX_MESSAGE_LENGTH = 2000; // keep in sync with FeedbackButton.tsx

// @ts-ignore
async function feedbackRoute(fastify) {
  const { FEEDBACK_SLACK_URL } = fastify.config;

  fastify.post('/feedback', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: 60_000,
        // @ts-ignore
        keyGenerator: (req) => req.encryptedSession.get('onboarding_accessToken') ?? req.ip,
      },
    },
  // @ts-ignore
  }, async (request, reply) => {
    const accessToken = request.encryptedSession.get('onboarding_accessToken');
    if (!accessToken) {
      return reply.unauthorized('Authentication required.');
    }

    const userInfo = request.encryptedSession.get('onboarding_userInfo');
    const user = userInfo?.email ?? 'unknown';

    const environment =
      fastify.config.FRONTEND_SENTRY_ENVIRONMENT ||
      fastify.config.NODE_ENV ||
      'unknown';

    const body = request.body;
    if (!body || typeof body !== 'object') {
      return reply.badRequest('Invalid feedback data.');
    }

    const { message, rating } = body;

    if (typeof message !== 'string' || message.length > MAX_MESSAGE_LENGTH) {
      return reply.badRequest('Invalid feedback data.');
    }

    if (!VALID_RATINGS.includes(rating)) {
      return reply.badRequest('Invalid feedback data.');
    }

    if (!FEEDBACK_SLACK_URL) {
      fastify.log.error('FEEDBACK_SLACK_URL is not configured.');
      return reply.status(503).send({ error: 'Feedback is currently unavailable.' });
    }

    try {
      const res = await fetch(FEEDBACK_SLACK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          rating,
          user,
          environment,
        }),
      });

      if (!res.ok) {
        const error = new Error(`Slack API error: ${res.status} ${res.statusText}`);
        Sentry.captureException(error, {
          extra: {
            status: res.status,
            statusText: res.statusText,
            user,
            environment,
          },
        });

        return reply.status(500).send({
          error: `Slack API error. Status: ${res.status}`,
        });
      }

      return reply.send({ message: 'Feedback sent.' });
    } catch (err) {
      Sentry.captureException(err, {
        extra: {
          user,
          environment,
        },
      });
      fastify.log.error('Slack error:', err);
      return reply.status(500).send({ error: 'Request failed' });
    }
  });
}

export default fp(feedbackRoute);
