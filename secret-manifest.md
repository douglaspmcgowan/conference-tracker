# Secret manifest

Project: conference-tracker

This generated view contains variable names and operating metadata only. Secret values, vault session keys, recovery keys, and access tokens are forbidden.

| Variable | Purpose | Provider | Trust boundary | Owner | Rotation | Consumers | Status |
|---|---|---|---|---|---|---|---|
| `PROJECT_DATA_ROOT` | Base directory for external project data declared by data-manifest.yaml; this project currently declares no external assets. | Local harness project-data configuration | local path configuration | Douglas | not applicable; update when the project-data root moves |  | non-secret |

Canonical source: `secret-manifest.json`
Refresh: `C:\Users\dougl\.agents\tools\Update-SecretManifest.cmd -Repository <repo>`
