[![REUSE status](https://api.reuse.software/badge/github.com/openmcp-project/ui-frontend)](https://api.reuse.software/info/github.com/openmcp-project/ui-frontend)

# ui-frontend

## About this project

UI frontend for @openmcp-project

## Requirements and Setup

### Development

1. install dependencies (can also use npm): `bun i`

1. Copy the `frontend-config.json` to `public/frontend-config.json` and adapt the `backendUrl` according to your setup (see section Dynamic Frontend Config).

1. Connect to the ui-backend server
   **Run it locally**:
    - See `https://github.com/openmcp-project/ui-backend`

1. Start the application:

   Run `bun run dev`

### Build

1. Build the application:

   Run `bun run build`

2. Serve the application locally:

   Run `bun run preview`

3. For production:

   Use the docker image which uses nginx for best performance and small bundle size.
   `docker build -t my-label .`

### Dynamic FrontendConfig

The frontend loads a `frontend-config.json` file from the root folder containing dynamic config like the backend url. For development, the file `frontend-config.json` can be copied to `public/frontend-config.json`. For production, NGINX will serve the content from the environment variable `BACKEND_CONFIG`.

An example docker run command would be 
```
docker run -p 5001:80 -e BACKEND_CONFIG="$(cat frontend-config.json)"  -t ui-test
```

## Support, Feedback, Contributing

This project is open to feature requests/suggestions, bug reports etc. via [GitHub issues](https://github.com/openmcp-project/ui-frontend/issues). Contribution and feedback are encouraged and always welcome. For more information about how to contribute, the project structure, as well as additional contribution information, see our [Contribution Guidelines](CONTRIBUTING.md).

## Security / Disclosure
If you find any bug that may be a security problem, please follow our instructions at [in our security policy](https://github.com/openmcp-project/ui-frontend/security/policy) on how to report it. Please do not create GitHub issues for security-related doubts or problems.

## Code of Conduct

We as members, contributors, and leaders pledge to make participation in our community a harassment-free experience for everyone. By participating in this project, you agree to abide by its [Code of Conduct](https://github.com/SAP/.github/blob/main/CODE_OF_CONDUCT.md) at all times.

## Licensing

Copyright 2025 SAP SE or an SAP affiliate company and ui-frontend contributors. Please see our [LICENSE](LICENSE) for copyright and license information. Detailed information including third-party components and their licensing/copyright information is available [via the REUSE tool](https://api.reuse.software/info/github.com/openmcp-project/ui-frontend).