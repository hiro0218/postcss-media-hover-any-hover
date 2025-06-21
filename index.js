/**
 * @typedef {Object} PluginOptions
 * @property {'any-hover' | 'hover'} [mediaFeature='any-hover'] - Type of media feature ('any-hover' or 'hover')
 * @property {boolean} [transformNestedMedia=false] - Whether to transform :hover within existing media queries
 * @property {string[]} [excludeSelectors=[]] - List of selector patterns to exclude from transformation
 */

/**
 * @type {import('postcss').PluginCreator<PluginOptions>}
 */
module.exports = (options = {}) => {
  // Initialize options with default values
  const { mediaFeature = 'any-hover', transformNestedMedia = false, excludeSelectors = [] } = options;

  // Media query parameter
  const mediaParams = `(${mediaFeature}: hover)`;

  // Optimized regular expression to detect hover pseudo-class - removed capture groups
  const HOVER_REGEX = /:hover(?:\s|$|:|\.|\[|#)/;

  // Pre-compiled regular expression to detect hover media query
  const HOVER_MEDIA_REGEX = /\((any-)?hover:\s*hover\)/;

  // Map for excluded selectors (for fast lookup)
  const excludeSelectorsMap = new Map();
  const excludeRegexps = [];

  // Optimize excluded selectors: separate string and regexp patterns
  if (excludeSelectors.length > 0) {
    excludeSelectors.forEach((pattern, index) => {
      if (pattern instanceof RegExp) {
        excludeRegexps.push(pattern);
      } else {
        excludeSelectorsMap.set(pattern, index);
      }
    });
  }

  /**
   * Check if a selector matches any exclude pattern - optimized version
   * @param {string} selector - The selector to check
   * @returns {boolean} - Whether the selector should be excluded
   */
  const isExcludedSelector = (selector) => {
    // Early return
    if (excludeSelectors.length === 0) return false;

    // Fast lookup using map
    if (excludeSelectorsMap.size > 0) {
      for (const [pattern] of excludeSelectorsMap) {
        if (selector.includes(pattern)) return true;
      }
    }

    // Process regular expressions only if there are few of them
    return excludeRegexps.length > 0 && excludeRegexps.some((regex) => regex.test(selector));
  };

  /**
   * Check if a selector has hover pseudo-class - optimized version
   * @param {string} selector - The selector to check
   * @returns {boolean} - Whether the selector has hover pseudo-class
   */
  const hasHoverPseudo = (selector) => {
    // Early return for the most common case
    if (selector.indexOf(':hover') === -1) return false;

    return HOVER_REGEX.test(selector) && !isExcludedSelector(selector);
  };

  /**
   * Check if a rule is already inside a hover-related media query - optimized version
   * @param {import('postcss').Rule} rule - The rule to check
   * @returns {boolean} - Whether the rule is inside a hover media query
   */
  const isAlreadyInHoverMedia = (rule) => {
    let parent = rule.parent;
    // Set maximum search depth to prevent infinite loops
    let depth = 0;
    const MAX_DEPTH = 10;

    while (parent && depth < MAX_DEPTH) {
      if (parent.type === 'atrule' && parent.name === 'media' && HOVER_MEDIA_REGEX.test(parent.params)) {
        return true;
      }
      parent = parent.parent;
      depth++;
    }
    return false;
  };

  return {
    postcssPlugin: 'postcss-media-hover-any-hover',
    /**
     * @param {import('postcss').Root} root - PostCSS root node.
     * @param {import('postcss').Result} result - PostCSS result object.
     */
    Once(root, { AtRule }) {
      /** @param {import('postcss').Rule} rule - PostCSS rule node. */
      root.walkRules((rule) => {
        // Early check: skip if selector doesn't exist or doesn't contain :hover
        if (!rule.selector || rule.selector.indexOf(':hover') === -1) {
          return;
        }

        // Classify selectors in a single pass
        const selectors = rule.selectors;
        const selectorsLength = selectors.length;

        // Use optimized arrays for small selector lists
        const hoverSelectors = [];
        const nonHoverSelectors = [];
        let hasHoverSelector = false;

        // Optimize selector traversal
        for (let i = 0; i < selectorsLength; i++) {
          const selector = selectors[i];
          if (hasHoverPseudo(selector)) {
            hasHoverSelector = true;
            hoverSelectors.push(selector);
          } else {
            nonHoverSelectors.push(selector);
          }
        }

        // Early return
        if (!hasHoverSelector) {
          return;
        }

        // Reference parent element only once
        const parent = rule.parent;

        // Skip if already inside @media (hover-related) based on options
        if (!transformNestedMedia && isAlreadyInHoverMedia(rule)) {
          return;
        }

        // Create @media rule to wrap hover selectors
        const atRule = new AtRule({ name: 'media', params: mediaParams });

        if (nonHoverSelectors.length > 0) {
          // When there are non-hover selectors
          const hoverRule = rule.clone();
          hoverRule.selectors = hoverSelectors;
          rule.selectors = nonHoverSelectors;

          atRule.append(hoverRule);
          parent.insertBefore(rule, atRule);
        } else {
          // When there are only hover selectors
          atRule.append(rule.clone());
          rule.replaceWith(atRule);
        }
      });
    },
  };
};

module.exports.postcss = true;
