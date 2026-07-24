[![REUSE status](https://api.reuse.software/badge/github.com/openmcp-project/ui-frontend)](https://api.reuse.software/info/github.com/openmcp-project/ui-frontend)

# ui-frontend

The Control Plane UI for the [OpenControlPlane project](https://github.com/openmcp-project). Manage Projects, Workspaces, and Managed Control Planes — and explore the Kubernetes resources running inside them — without installing any additional tooling.

→ **[Full Documentation](docs/index.md)**

| I am a… | Start here |
|---|---|
| **End User** — exploring what the UI can do | [End User Guide](docs/end-user/index.md) |
| **Operator** — deploying this in my org | [Operator Guide](docs/operator/index.md) |
| **Contributor** — extending or improving the codebase | [Contributor Guide](docs/contributor/index.md) |

---

## Quick Start (Development)

```bash
npm i
cp frontend-config.json public/frontend-config.json   # edit backendUrl
cp .env.template .env                                  # fill OIDC values
npm run dev                                            # http://localhost:5173
```

See the [Contributor Guide](docs/contributor/index.md) for full setup, build, and testing instructions.

## Generating GraphQL Types

```bash
npm run generate-graphql-types -- <token>
```

Types are generated from the [kubernetes-graphql-gateway](https://github.com/platform-mesh/kubernetes-graphql-gateway) schema. The token is prefixed with `Bearer` automatically. See [Which access token](docs/contributor/new-api-request.md#graphql--apollo-onboarding-space) for how to obtain one.

### Which access token

The schema is fetched from the [kubernetes-graphql-gateway](https://github.com/platform-mesh/kubernetes-graphql-gateway). Getting the required access token depends on how you [deploy your platform](docs/operator/index.md). For OIDC setups, use [kubelogin](https://github.com/int128/kubelogin) (`kubectl oidc-login`) to obtain the token — this is an example of an IDP-centered setup. More guidance coming soon.

```
kubectl oidc-login get-token \
  --oidc-issuer-url=<according to your setup> \
  --oidc-client-id=<according to your setup> \
  --oidc-extra-scope=offline_access \
  --oidc-extra-scope=email \
  --oidc-extra-scope=profile \
  --oidc-use-pkce \
  --grant-type=auto | jq .status.token -r
```

## Safari Support

The frontend is currently incompatible with Safari on `localhost`. To develop locally with Safari:

1. In [`server/encrypted-session.ts`](server/encrypted-session.ts), set `secure: false` in both cookie occurrences.
2. In [`server.ts`](server.ts), comment out the `helmet` registration.

Do not commit these changes.

---

#### Which access token

The schema is fetched from the [kubernetes-graphql-gateway](https://github.com/platform-mesh/kubernetes-graphql-gateway). Getting the required access token depends on how you [deploy your platform](#deploy-platform-service). For OIDC setups, use [kubelogin](https://github.com/int128/kubelogin) (`kubectl oidc-login`) to obtain the token — this is an example of an IDP-centered setup. More guidance coming soon.

```
kubectl oidc-login get-token 
  --oidc-issuer-url=<according to your setup>
  --oidc-client-id=<according to your setup> --oidc-extra-scope=offline_access 
  --oidc-extra-scope=email 
  --oidc-extra-scope=profile 
  --oidc-use-pkce 
  --grant-type=auto | jq .status.token -r
```

## Support & Contributing

Issues and feature requests: [GitHub Issues](https://github.com/openmcp-project/ui-frontend/issues)  
Contribution guidelines: [CONTRIBUTING.md](CONTRIBUTING.md) — DCO required, open an issue first.  
Security vulnerabilities: [Security Policy](https://github.com/openmcp-project/ui-frontend/security/policy) — do not open a public issue.

## Code of Conduct

By participating in this project you agree to the [Code of Conduct](https://github.com/openmcp-project/.github/blob/main/CODE_OF_CONDUCT.md).

## Licensing

Copyright OpenControlPlane contributors. [LICENSE](LICENSE). Detailed third-party information: [REUSE tool](https://api.reuse.software/info/github.com/openmcp-project/ui-frontend).

---

<p align="center">
  <a href="https://apeirora.eu/content/projects/">
    <img alt="BMWK-EU funding logo" src="https://apeirora.eu/assets/img/BMWK-EU.png" width="300"/>
  </a>
</p>

<p align="center">
  OpenControlPlane is part of <a href="https://apeirora.eu/content/projects/">ApeiroRA</a>, an EU Important Project of Common European Interest (IPCEI-CIS).
</p>

<p align="center">
  Copyright Linux Foundation Europe. For web site terms of use, trademark policy and other project policies please see <a href="https://linuxfoundation.eu/en/policies">https://linuxfoundation.eu/en/policies</a>.
</p>
