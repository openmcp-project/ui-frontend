import fp from 'fastify-plugin';
import { AuthenticationError } from '../plugins/auth-utils.js';

const stateSessionKey = 'oauthStateMCP';

// @ts-ignore
async function authPlugin(fastify) {
  const { OIDC_ISSUER, OIDC_CLIENT_ID_MCP, OIDC_REDIRECT_URI, OIDC_SCOPES, POST_LOGIN_REDIRECT } = fastify.config;

  // Make MCP issuer configuration globally available
  // TODO: This is a temporary solution until we have a proper way to manage multiple issuers
  const mcpIssuerConfiguration = await fastify.discoverIssuerConfiguration(OIDC_ISSUER);
  fastify.decorate('mcpIssuerConfiguration', mcpIssuerConfiguration);

  /*
   * Helper function to determine if the request is for the system IdP (in contrast to a custom IdP).
   * An undefined idpName indicates a system IdP request.
   */
  const isSystemIdpRequest = (idpName: string | undefined) => !idpName;

  /**
   * Helper function to fetch custom IdP configuration via internal proxy.
   */
  // @ts-ignore
  const fetchCustomIdpConfig = async (req, namespace, mcpName, idpName) => {
    const proxyResponse = await fastify.inject({
      method: 'GET',
      url: `/api/onboarding/apis/core.openmcp.cloud/v1alpha1/namespaces/${namespace}/managedcontrolplanes/${mcpName}`,
      headers: {
        ...req.headers, // passing the original headers (cookies), so the proxy can read the session
        'x-use-crate': 'true',
      },
    });

    if (proxyResponse.statusCode !== 200) {
      req.log.error(`Failed to fetch MCP details: ${proxyResponse.statusCode}`);
      throw new Error('Could not fetch MCP configuration');
    }

    const mcpDetails = proxyResponse.json();
    // @ts-ignore
    const idpConfig = mcpDetails.spec.authentication.identityProviders?.find((config) => config.name === idpName);
    if (!idpConfig) {
      throw new Error(`Identity Provider '${idpName}' not found in MCP configuration`);
    }
    const issuerConfiguration = await fastify.discoverIssuerConfiguration(idpConfig.issuerURL);

    return {
      clientId: idpConfig.clientID,
      extraScopes: idpConfig.clientConfig?.extraConfig?.['oidc-extra-scope'].values || [],
      issuerConfiguration,
    };
  };

  /**
   * Resolves the IdP configuration (system IdP or a custom IdP).
   */
  // @ts-ignore
  const resolveIdpConfig = async (req, { namespace, mcpName, idpName }) => {
    const isCustomIdp = !isSystemIdpRequest(idpName);
    if (isCustomIdp) {
      const customIdpConfig = await fetchCustomIdpConfig(req, namespace, mcpName, idpName);

      // Merge default scopes with any extra scopes from custom IdP config
      const defaultScopes = OIDC_SCOPES.split(' ');
      const mergedScopes = Array.from(new Set([...defaultScopes, ...customIdpConfig.extraScopes]));

      return {
        clientId: customIdpConfig.clientId,
        issuerConfiguration: customIdpConfig.issuerConfiguration,
        scopes: mergedScopes.join(' '),
      };
    } else {
      // Return config of system identity provider
      return {
        clientId: OIDC_CLIENT_ID_MCP,
        issuerConfiguration: mcpIssuerConfiguration,
        scopes: OIDC_SCOPES,
      };
    }
  };

  // @ts-ignore
  fastify.get('/auth/mcp/login', async function (req, reply) {
    try {
      const { namespace, mcp: mcpName, idp: idpName } = req.query;

      const { clientId, issuerConfiguration, scopes } = await resolveIdpConfig(req, { namespace, mcpName, idpName });

      const redirectUri = await fastify.prepareOidcLoginRedirect(
        req,
        {
          clientId: clientId,
          redirectUri: OIDC_REDIRECT_URI,
          scopes,
        },
        issuerConfiguration.authorizationEndpoint,
        stateSessionKey,
      );

      return reply.redirect(redirectUri);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        req.log.error(`Login failed: ${error?.message}`);
        return reply.badRequest(`Login failed: ${error?.message}`);
      } else {
        throw error;
      }
    }
  });

  // @ts-ignore
  fastify.get('/auth/mcp/callback', async function (req, reply) {
    const { namespace, mcp: mcpName, idp: idpName } = req.query;

    try {
      const { clientId, issuerConfiguration } = await resolveIdpConfig(req, { namespace, mcpName, idpName });

      const callbackResult = await fastify.handleOidcCallback(
        req,
        {
          clientId: clientId,
          redirectUri: OIDC_REDIRECT_URI,
        },
        issuerConfiguration.tokenEndpoint,
        stateSessionKey,
      );

      await req.encryptedSession.set('mcp_accessToken', callbackResult.accessToken);
      await req.encryptedSession.set('mcp_refreshToken', callbackResult.refreshToken);

      // Ensure session keys are deleted if values are undefined (system IdP flow).
      // This prevents stale custom IdP values from remaining in the session.
      const updateSessionKey = async (key: string, value: string | undefined) => {
        if (value) {
          await req.encryptedSession.set(key, value);
        } else {
          await req.encryptedSession.delete(key);
        }
      };
      await updateSessionKey('mcp_namespace', namespace);
      await updateSessionKey('mcp_name', mcpName);
      await updateSessionKey('mcp_idp', idpName);

      if (callbackResult.expiresAt) {
        await req.encryptedSession.set('mcp_tokenExpiresAt', callbackResult.expiresAt);
      } else {
        await req.encryptedSession.delete('mcp_tokenExpiresAt');
      }

      return reply.redirect(POST_LOGIN_REDIRECT + callbackResult.postLoginRedirectRoute);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        req.log.error('AuthenticationError during OIDC callback: %s', error);
        return reply.serviceUnavailable('Error during OIDC callback.');
      } else {
        throw error;
      }
    }
  });

  // @ts-ignore
  fastify.get('/auth/mcp/me', async function (req, reply) {
    const { namespace, mcp, idp } = req.query;

    const sessionAccessToken = req.encryptedSession.get('mcp_accessToken');
    const sessionNamespace = req.encryptedSession.get('mcp_namespace');
    const sessionMcp = req.encryptedSession.get('mcp_name');
    const sessionIdp = req.encryptedSession.get('mcp_idp');

    const isSystemIdp = isSystemIdpRequest(idp);
    const isAuthenticated = isSystemIdp
      ? // For system IdP, we do not compare namespace and mcp because the access token is valid for all MCPs in the cluster
        !sessionNamespace && !sessionMcp && !sessionIdp && Boolean(sessionAccessToken)
      : sessionNamespace === namespace && sessionMcp === mcp && sessionIdp === idp && Boolean(sessionAccessToken);

    return reply.send({ isAuthenticated });
  });
}

export default fp(authPlugin);
