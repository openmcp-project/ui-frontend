[![REUSE status](https://api.reuse.software/badge/github.com/openmcp-project/ui-frontend)](https://api.reuse.software/info/github.com/openmcp-project/ui-frontend)

# ui-frontend

## About This Project

This repository contains code relevant for the frontend component required in the Managed Control Plane UI (MCP UI), which is part of the @openmcp-project, more info [here](https://github.com/openmcp-project).

The MCP UI enables endusers to work with Managed Control Planes, without having to use kubectl. Note that the current focus of the UI is on displaying information about the various managed resources, as well as the MCP instances themselves. It is also possible to check the status of the resources, and display / copy their YAML representations.

Overall, the UI provides an easy jump-start for everyone interested in checking the status of Managed Control Planes, without having to use kubectl.

## Getting Started

### Development Setup

#### Install Dependencies

```bash
npm i
```

#### Configure Frontend

- Copy `frontend-config.json` to `public/frontend-config.json` and adapt the `backendUrl` according to your setup (see section Dynamic Frontend Config).
- Copy `.env.template` to `.env` and fill in the missing values.

#### Run the Application

```bash
npm run dev
```

The UI will be served on http://localhost:5173.

#### Headlamp (local dev cluster)

The UI embeds [Headlamp](https://headlamp.dev) for Kubernetes resource inspection. For local development a kind cluster is used.

**Prerequisites:** `kind`, `kubectl`, `helm`, `task` ([Taskfile](https://taskfile.dev))

**One-time setup** — creates the kind cluster, installs Headlamp with the latest plugin releases from ArtifactHub, and port-forwards to `http://localhost:8090`:

```bash
task headlamp:dev
```

Then set `HEADLAMP_UPSTREAM_URL=http://localhost:8090` in your `.env` and start the app:

```bash
npm run dev
```

**Iterating on a plugin** — if you have `crossplane-headlamp-plugin` or `kiosk-headlamp-plugin` checked out as siblings of this repo, build and hot-sync them into the running pod (no restart needed):

```bash
task headlamp:update
```

Then hard-refresh the browser (`Cmd+Shift+R`).

#### Safari Support

**Note:** The frontend is currently incompatible with Safari when running locally on `localhost`.

To enable local development with Safari, follow these steps on your local machine:

1. **Update Cookie Settings:**  
   In [`server/encrypted-session.js`](server/encrypted-session.ts), set the `secure` property to `false` in both occurrences.

2. **Disable Helmet Registration:**  
   In [`server.js`](server.ts), comment out or remove the registration of `helmet`.


### Build & Production

#### Build the Application

```bash
npm run build
```

#### Serve the Production Build Locally

```bash
npm run preview
```

#### Production Deployment

Use the docker image which uses nginx for best performance and small bundle size.

```bash
docker build -t my-label .
```

#### Coming Soon: Deploy on Open Control Plane {#deploy-platform-service}

We plan to ship this component as a [PlatformService](https://open-control-plane.io/users/concepts/providers#platform-services) of Open Control Plane.

### Dynamic FrontendConfig

The frontend loads a `frontend-config.json` file from the root folder containing dynamic config like the backend url. For development, the file `frontend-config.json` can be copied to `public/frontend-config.json`. For production, NGINX will serve the content from the environment variable `BACKEND_CONFIG`.

An example docker run command would be 
```
docker run -p 5001:80 -e BACKEND_CONFIG="$(cat frontend-config.json)"  -t ui-test
```

### Generating GraphQL Types

GraphQL types can be generated from the remote schema using the `generate-graphql-types` script. Pass your access token as a positional argument directly after the script name:

```bash
npm run generate-graphql-types -- myaccesstokenhere
```

To run in watch mode (re-generates on file changes):

```bash
npm run generate-graphql-types:watch -- myaccesstokenhere
```

The token is automatically prefixed with `Bearer` and passed as the `Authorization` header when fetching the remote GraphQL schema.

#### Which access token

Getting the required access token depends on how you you [deploy your platform](#deploy-platform-service). This is an example of an IDP-centered setup. More guidance coming soon.

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

This project is open to feature requests/suggestions, bug reports etc. via [GitHub issues](https://github.com/openmcp-project/ui-frontend/issues). Contribution and feedback are encouraged and always welcome. For more information about how to contribute, the project structure, as well as additional contribution information, see our [Contribution Guidelines](CONTRIBUTING.md).

## Security & Disclosure
If you find any bug that may be a security problem, please follow our instructions at [in our security policy](https://github.com/openmcp-project/ui-frontend/security/policy) on how to report it. Please do not create GitHub issues for security-related doubts or problems.

## Code of Conduct

We as members, contributors, and leaders pledge to make participation in our community a harassment-free experience for everyone. By participating in this project, you agree to abide by its [Code of Conduct](https://github.com/openmcp-project/.github/blob/main/CODE_OF_CONDUCT.md) at all times.

## Licensing

Copyright OpenControlPlane contributors. Please see our [LICENSE](LICENSE) for copyright and license information. Detailed information including third-party components and their licensing/copyright information is available [via the REUSE tool](https://api.reuse.software/info/github.com/openmcp-project/ui-frontend).

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
