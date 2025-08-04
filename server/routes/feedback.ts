// @ts-ignore
import fetch from 'node-fetch';
import fp from 'fastify-plugin';

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
        return reply.status(500).send({
          error: `Slack API error. Status: ${res.status}${res.message ? ` | Message: ${res.message}` : ''}${res.error ? ` | Error: ${res.error}` : ''}`,
        });
      }
      return reply.send({ message: res });
    } catch (err) {
      fastify.log.error('Slack error:', err);
      return reply.status(500).send({ error: 'Request failed' });
    }
  });
}

export default fp(feedbackRoute);
