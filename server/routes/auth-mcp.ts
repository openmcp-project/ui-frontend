import fp from 'fastify-plugin';
import {
  AuthConfigurationError,
  AuthUpstreamError,
  ExpectedAuthError,
  createMcpConfigurationFetchError,
  isExpiredSessionError,
} from '../auth/errors.js';

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
  const fetchCustomIdpConfig = async (req, namespace, mcpName, idpName, version) => {
    const isV2 = version === 'v2';
    const url = isV2
      ? `/api/onboarding/apis/core.open-control-plane.io/v2alpha1/namespaces/${namespace}/controlplanes/${mcpName}`
      : `/api/onboarding/apis/core.openmcp.cloud/v1alpha1/namespaces/${namespace}/managedcontrolplanes/${mcpName}`;

    let proxyResponse;
    try {
      proxyResponse = await fastify.inject({
        method: 'GET',
        url,
        headers: {
          ...req.headers, // passing the original headers (cookies), so the proxy can read the session
          'x-use-crate': 'true',
        },
      });
    } catch (cause) {
      throw new AuthUpstreamError('MCP configuration request failed.', {
        code: 'mcp_configuration_request_failed',
        statusCode: 503,
        publicMessage: 'Unable to load MCP configuration.',
        cause,
      });
    }

    if (proxyResponse.statusCode !== 200) {
      throw createMcpConfigurationFetchError(proxyResponse.statusCode);
    }

    let mcpDetails;
    try {
      mcpDetails = proxyResponse.json();
    } catch (cause) {
      throw new AuthUpstreamError('MCP configuration response contained invalid JSON.', {
        code: 'invalid_mcp_configuration_response',
        publicMessage: 'Unable to load MCP configuration.',
        context: { upstreamStatus: proxyResponse.statusCode },
        cause,
      });
    }

    if (isV2) {
      // @ts-ignore
      const idpConfig = mcpDetails.spec?.iam?.oidc?.extraProviders?.find((config) => config.name === idpName);
      if (!idpConfig) {
        throw new ExpectedAuthError(`Identity provider '${idpName}' was not found in MCP configuration.`, {
          code: 'identity_provider_not_found',
          statusCode: 404,
          publicMessage: 'Identity provider not found.',
          context: { idpName },
        });
      }
      if (!idpConfig.issuer || !idpConfig.clientID) {
        throw new AuthConfigurationError(`Identity provider '${idpName}' is incompletely configured.`, {
          code: 'incomplete_identity_provider_configuration',
          context: { idpName },
        });
      }
      const issuerConfiguration = await fastify.discoverIssuerConfiguration(idpConfig.issuer);

      return {
        clientId: idpConfig.clientID,
        extraScopes: idpConfig.extraScopes ?? [],
        issuerConfiguration,
      };
    }

    // @ts-ignore
    const idpConfig = mcpDetails.spec.authentication.identityProviders?.find((config) => config.name === idpName);
    if (!idpConfig) {
      throw new ExpectedAuthError(`Identity provider '${idpName}' was not found in MCP configuration.`, {
        code: 'identity_provider_not_found',
        statusCode: 404,
        publicMessage: 'Identity provider not found.',
        context: { idpName },
      });
    }
    if (!idpConfig.issuerURL || !idpConfig.clientID) {
      throw new AuthConfigurationError(`Identity provider '${idpName}' is incompletely configured.`, {
        code: 'incomplete_identity_provider_configuration',
        context: { idpName },
      });
    }
    const issuerConfiguration = await fastify.discoverIssuerConfiguration(idpConfig.issuerURL);

    return {
      clientId: idpConfig.clientID,
      extraScopes: idpConfig.clientConfig?.extraConfig?.['oidc-extra-scope']?.values ?? [],
      issuerConfiguration,
    };
  };

  /**
   * Resolves the IdP configuration (system IdP or a custom IdP).
   */
  // @ts-ignore
  const resolveIdpConfig = async (req, { namespace, mcpName, idpName, version }) => {
    const isCustomIdp = !isSystemIdpRequest(idpName);
    if (isCustomIdp) {
      const customIdpConfig = await fetchCustomIdpConfig(req, namespace, mcpName, idpName, version);

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

  const authRateLimit = {
    rateLimit: {
      max: 20,
      timeWindow: '1 minute',
      // @ts-ignore
      keyGenerator: (req) =>
        req.encryptedSession?.get('mcp_accessToken') ?? req.encryptedSession?.get('onboarding_accessToken') ?? req.ip,
    },
  };

  // @ts-ignore
  fastify.get('/auth/mcp/login', { config: authRateLimit }, async function (req, reply) {
    const { namespace, mcp: mcpName, idp: idpName, version } = req.query;

    const { clientId, issuerConfiguration, scopes } = await resolveIdpConfig(req, {
      namespace,
      mcpName,
      idpName,
      version,
    });

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
  });

  // @ts-ignore
  fastify.get('/auth/mcp/callback', { config: authRateLimit }, async function (req, reply) {
    const { namespace, mcp: mcpName, idp: idpName, version } = req.query;

    const { clientId, issuerConfiguration } = await resolveIdpConfig(req, { namespace, mcpName, idpName, version });

    const callbackResult = await fastify.handleOidcCallback(
      req,
      {
        clientId: clientId,
        redirectUri: OIDC_REDIRECT_URI,
      },
      issuerConfiguration.tokenEndpoint,
      stateSessionKey,
    );

    // Regenerate session ID and encryption key to prevent session fixation (CWE-384)
    await req.encryptedSession.regenerate();

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
  });

  // @ts-expect-error - Fastify plugin route handler typing needs refinement
  fastify.get('/auth/mcp/me', { config: authRateLimit }, async function (req, reply) {
    const { namespace, mcp, idp } = req.query;

    const sessionAccessToken = req.encryptedSession.get('mcp_accessToken');
    const tokenExpiresAt = req.encryptedSession.get('mcp_tokenExpiresAt');
    const sessionNamespace = req.encryptedSession.get('mcp_namespace');
    const sessionMcp = req.encryptedSession.get('mcp_name');
    const sessionIdp = req.encryptedSession.get('mcp_idp');

    const isSystemIdp = isSystemIdpRequest(idp);
    const isAuthenticated = isSystemIdp
      ? // For system IdP, we do not compare namespace and mcp because the access token is valid for all MCPs in the cluster
        !sessionNamespace && !sessionMcp && !sessionIdp && Boolean(sessionAccessToken)
      : sessionNamespace === namespace && sessionMcp === mcp && sessionIdp === idp && Boolean(sessionAccessToken);

    return reply.send({ isAuthenticated, tokenExpiresAt: tokenExpiresAt ?? null });
  });

  // @ts-expect-error - Fastify plugin route handler typing needs refinement
  fastify.post('/auth/mcp/refresh', { config: authRateLimit }, async function (req, reply) {
    const { namespace, mcp, idp, version } = req.query;

    const refreshToken = req.encryptedSession.get('mcp_refreshToken');
    if (!refreshToken) {
      await req.encryptedSession.clear();
      return reply.unauthorized('Session expired without token refresh capability.');
    }

    const isSystemIdp = isSystemIdpRequest(idp);
    if (!isSystemIdp && (!namespace || !mcp)) {
      return reply.badRequest('Missing required query parameters for custom IdP');
    }

    req.log.info({ namespace, mcp, idp }, 'Attempting MCP token refresh');

    const { clientId, issuerConfiguration, scopes } = await resolveIdpConfig(req, {
      namespace,
      mcpName: mcp,
      idpName: idp,
      version,
    });

    let refreshedTokenData;
    try {
      refreshedTokenData = await fastify.refreshAuthTokens(
        refreshToken,
        {
          clientId,
          scopes,
        },
        issuerConfiguration.tokenEndpoint,
      );
    } catch (error) {
      if (isExpiredSessionError(error)) {
        await req.encryptedSession.clear();
      }
      throw error;
    }

    req.log.info('Token refresh successful; updating the session.');

    await req.encryptedSession.set('mcp_accessToken', refreshedTokenData.accessToken);
    if (refreshedTokenData.refreshToken) {
      await req.encryptedSession.set('mcp_refreshToken', refreshedTokenData.refreshToken);
    } else {
      await req.encryptedSession.delete('mcp_refreshToken');
    }
    if (refreshedTokenData.expiresIn) {
      const newExpiresAt = Date.now() + refreshedTokenData.expiresIn * 1000;
      await req.encryptedSession.set('mcp_tokenExpiresAt', newExpiresAt);
    } else {
      await req.encryptedSession.delete('mcp_tokenExpiresAt');
    }

    req.log.info('Token refresh successful and session updated; continuing with the HTTP request.');

    return reply.send({ success: true });
  });
}

export default fp(authPlugin);
