# End User Guide

The Control Plane UI empowers you to create and manage cloud landscapes using the Kubernetes Resource Model — no `kubectl` required.

![[current_view.png]]

## What can I do?

| Area                       | Actions                                                                                                                                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Projects**               | Create, view, and manage projects                                                                                                                                                                               |
| **Workspaces**             | Create and organise workspaces within a project                                                                                                                                                                 |
| **Control Planes**         | Create, configure, and monitor both Managed Control Planes (v1) and Open Control Planes (v2)                                                                                                                    |
| **Members**                | Add and manage users, groups and service-account access                                                                                                                                                         |
| **Platform Components**    | Install, configure, and manage platform components within a Control Plane like [Flux](https://fluxcd.io), [Crossplane](https://www.crossplane.io), and [External Secrets Operator](https://external-secrets.io) |
| **Kubernetes Resources**   | Observe managed resources, preview and copy their YAML                                                                                                                                                          |
| **Control Plane Explorer** | Browse and inspect live Kubernetes resources orchestrated inside a ControlPlane, powered by [Headlamp](https://headlamp.dev), embedded directly in the UI                                                       |

## Further Reading

The OpenControlPlane project documentation covers concepts, architecture, and end-user workflows in detail:

→ [openmcp-project on GitHub](https://github.com/openmcp-project)

---

- [Operator Guide](../operator/index.md) — deploying and running the UI in your org
- [Contributor Guide](../contributor/index.md) — extending or improving the codebase
