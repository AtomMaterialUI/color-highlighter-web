import type { PlasmoCSConfig } from "plasmo";

export const config: PlasmoCSConfig = {
  matches: [
    "https://github.com/*",
    "https://gitlab.com/*",
    "https://gitee.com/*",
    "https://bitbucket.org/*",
    "https://dev.azure.com/*",
    "https://*.github.dev/*",
    "https://*.gitpod.io/*",
  ],
  all_frames: true,
  world: "MAIN",
  // content_scripts: [
  //   {
  //     matches: [
  //       "https://github.com/*",
  //       "https://gitlab.com/*",
  //       "https://gitee.com/*",
  //       "https://bitbucket.org/*",
  //       "https://dev.azure.com/*",
  //       "https://*.github.dev/*",
  //       "https://*.gitpod.io/*",
  //     ],
  //     js: ["content"],
  //     css: ["styles/global"],
  //   },
  // ],
};
