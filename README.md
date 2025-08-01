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

### Dynamic FrontendConfig

The frontend loads a `frontend-config.json` file from the root folder containing dynamic config like the backend url. For development, the file `frontend-config.json` can be copied to `public/frontend-config.json`. For production, NGINX will serve the content from the environment variable `BACKEND_CONFIG`.

An example docker run command would be 
```
docker run -p 5001:80 -e BACKEND_CONFIG="$(cat frontend-config.json)"  -t ui-test
```

## Support & Contributing

This project is open to feature requests/suggestions, bug reports etc. via [GitHub issues](https://github.com/openmcp-project/ui-frontend/issues). Contribution and feedback are encouraged and always welcome. For more information about how to contribute, the project structure, as well as additional contribution information, see our [Contribution Guidelines](CONTRIBUTING.md).

## Security & Disclosure
If you find any bug that may be a security problem, please follow our instructions at [in our security policy](https://github.com/openmcp-project/ui-frontend/security/policy) on how to report it. Please do not create GitHub issues for security-related doubts or problems.

## Code of Conduct

We as members, contributors, and leaders pledge to make participation in our community a harassment-free experience for everyone. By participating in this project, you agree to abide by its [Code of Conduct](https://github.com/SAP/.github/blob/main/CODE_OF_CONDUCT.md) at all times.

## Licensing

Copyright 2025 SAP SE or an SAP affiliate company and ui-frontend contributors. Please see our [LICENSE](LICENSE) for copyright and license information. Detailed information including third-party components and their licensing/copyright information is available [via the REUSE tool](https://api.reuse.software/info/github.com/openmcp-project/ui-frontend).

---

**Happy contributing! 🚀**