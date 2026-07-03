/**
 * Site-specific selectors for code containers, elements to skip, and main content areas.
 */

export interface SiteSelectors {
  codeContainers: string[];
  skip: string[];
  mainAreas: string[];
  navSelectors: string[];
}

/**
 * Common selectors that might apply to multiple sites or generic code views
 */
const COMMON_SELECTORS: SiteSelectors = {
  codeContainers: [
    ".CodeMirror",
    ".ace_editor",
    ".monaco-editor",
    "[id*='editor']",
    ".hljs",
    ".highlight",
    ".syntax-highlighted",
  ],
  skip: [".line-numbers", ".line-number", ".ln", "[data-line-number]"],
  mainAreas: ["main", "[role='main']"],
  navSelectors: [],
};

/**
 * GitHub specific selectors
 */
const GITHUB_SELECTORS: SiteSelectors = {
  codeContainers: [
    ".blob-code",
    ".blob-code-inner",
    ".blob-wrapper",
    ".react-file-line-contents",
    ".react-line-contents",
    ".react-code-text",
    "[data-testid='code-cell']",
  ],
  skip: [
    ".blob-num",
    ".js-line-number",
    ".react-line-number",
    ".diff-line-num",
    ".js-file-line-number",
    ".diff-line-num-prev",
    ".diff-line-num-next",
    ".blob-num-expandable",
  ],
  mainAreas: [
    ".repository-content",
    "#js-repo-pjax-container",
    "#repository-container-react",
  ],
  navSelectors: [".js-navigation-open", "[data-tab-panel]", ".file-navigation"],
};

/**
 * GitLab specific selectors
 */
const GITLAB_SELECTORS: SiteSelectors = {
  codeContainers: [".file-content", ".js-syntax-highlight"],
  skip: [".td-line-number", ".line-numbers", ".diff-line-num"],
  mainAreas: [
    ".content-wrapper",
    ".tree-content-holder",
    ".blob-content-holder",
  ],
  navSelectors: [".tree-item-file-name", ".file-title-name", ".nav-link"],
};

/**
 * Bitbucket specific selectors
 */
const BITBUCKET_SELECTORS: SiteSelectors = {
  codeContainers: [
    ".bitbucket-textarea-wrapper",
    ".file-content",
    ".CodeMirror",
  ],
  skip: [".line-numbers", ".line-number-wrapper"],
  mainAreas: ["#source-view", "#repo-content"],
  navSelectors: [".file-link", ".aui-nav-item"],
};

/**
 * Registry of site selectors by hostname
 */
const SITE_REGISTRY: Record<string, Partial<SiteSelectors>> = {
  "github.com": GITHUB_SELECTORS,
  "github.dev": GITHUB_SELECTORS,
  "gitlab.com": GITLAB_SELECTORS,
  "bitbucket.org": BITBUCKET_SELECTORS,
  "gitee.com": {
    codeContainers: [".code-area", ".highlight"],
    mainAreas: [".repository-content"],
  },
};

/**
 * Get merged selectors for the current site
 */
export function getSelectorsForCurrentSite(): SiteSelectors {
  const hostname = window.location.hostname;

  // Find the best match in the registry
  let siteKey = Object.keys(SITE_REGISTRY).find((key) =>
    hostname.endsWith(key),
  );
  const siteSpecific = siteKey ? SITE_REGISTRY[siteKey] : {};

  // Merge common and site-specific selectors, removing duplicates
  return {
    codeContainers: Array.from(
      new Set([
        ...COMMON_SELECTORS.codeContainers,
        ...(siteSpecific.codeContainers || []),
      ]),
    ),
    skip: Array.from(
      new Set([...COMMON_SELECTORS.skip, ...(siteSpecific.skip || [])]),
    ),
    mainAreas: Array.from(
      new Set([
        ...COMMON_SELECTORS.mainAreas,
        ...(siteSpecific.mainAreas || []),
      ]),
    ),
    navSelectors: Array.from(
      new Set([
        ...COMMON_SELECTORS.navSelectors,
        ...(siteSpecific.navSelectors || []),
      ]),
    ),
  };
}

/**
 * Site detection helpers
 */
export const isGitHub = () =>
  window.location.hostname.endsWith("github.com") ||
  window.location.hostname.endsWith("github.dev");

export const isGitLab = () => window.location.hostname.endsWith("gitlab.com");

export const isBitbucket = () =>
  window.location.hostname.endsWith("bitbucket.org");
