import type { PlasmoConfig } from "plasmo"

export const config: PlasmoConfig = {
  permissions: ["scripting"],
  host_permissions: [
    "https://github.com/*",
    "https://gitlab.com/*",
    "https://gitee.com/*",
    "https://bitbucket.org/*",
    "https://dev.azure.com/*",
    "https://*.github.dev/*",
    "https://*.gitpod.io/*"
  ],
  content_scripts: [
    {
      matches: [
        "https://github.com/*",
        "https://gitlab.com/*",
        "https://gitee.com/*",
        "https://bitbucket.org/*",
        "https://dev.azure.com/*",
        "https://*.github.dev/*",
        "https://*.gitpod.io/*"
      ],
      js: ["content"],
      css: ["styles/global"]
    }
  ]
}
