# Licensing & Legal

## License

This project is licensed under **Apache-2.0**. See [`LICENSE`](../../LICENSE).

Copyright OpenControlPlane contributors.

## REUSE Compliance

This project follows the [REUSE specification](https://reuse.software). `REUSE.toml` sets a repo-wide default:

```toml
SPDX-FileCopyrightText = "Copyright OpenControlPlane contributors."
SPDX-License-Identifier = "Apache-2.0"
```

With `precedence = "aggregate"`, most new files inherit these headers automatically.

**If you add a file in a directory that uses explicit per-file headers**, match the style of its neighbours.

Third-party files go under `LICENSES/`.

You can check compliance locally with the [reuse tool](https://reuse.readthedocs.io):

```bash
pip install reuse
reuse lint
```

## DCO (Developer Certificate of Origin)

All commits require a DCO sign-off:

```bash
git commit -s -m "feat: my change"
```

This adds `Signed-off-by: Your Name <your@email.com>` to the commit message, certifying you have the right to submit the contribution under the project's license.

## Contributing

Before opening a PR, please read [`CONTRIBUTING.md`](../../CONTRIBUTING.md). Key points:

- Contributions need a linked GitHub issue first.
- DCO sign-off is required on every commit.
- Follow the [Code of Conduct](https://github.com/openmcp-project/.github/blob/main/CODE_OF_CONDUCT.md).

## Security

If you find a security vulnerability, **do not open a GitHub issue**. Follow the instructions in the [Security Policy](https://github.com/openmcp-project/ui-frontend/security/policy).

---

- [Contributor Guide](index.md)
- [Static Analysis](static-analysis.md)
