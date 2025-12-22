/**
 * @typedef {Object} PluginOptions
 * @property {'any-hover' | 'hover'} [mediaFeature='any-hover'] - Type of media feature ('any-hover' or 'hover')
 * @property {(string|RegExp)[]} [excludeSelectors=[]] - List of selector patterns to exclude from transformation
 */

/**
 * @type {import('postcss').PluginCreator<PluginOptions>}
 */
module.exports = (options = {}) => {
  // Initialize options with default values (validation will happen in Once callback)
  const { mediaFeature: rawMediaFeature = 'any-hover', excludeSelectors: rawExcludeSelectors = [] } = options;

  // Optimized regular expression to detect hover pseudo-class - includes combinators
  const HOVER_REGEX = /:hover(?:[\s:.[#,>+~]|$)/;

  // Pre-compiled regular expression to detect hover media query
  const HOVER_MEDIA_REGEX = /\((any-)?hover:\s*hover\)/;

  return {
    postcssPlugin: 'postcss-media-hover-any-hover',
    /**
     * @param {import('postcss').Root} root - PostCSS root node.
     * @param {import('postcss').Result} result - PostCSS result object.
     */
    Once(root, { AtRule, result }) {
      // Validate options
      let mediaFeature = rawMediaFeature;
      let excludeSelectors = rawExcludeSelectors;

      // Validate mediaFeature
      if (mediaFeature !== 'any-hover' && mediaFeature !== 'hover') {
        result.warn(`Invalid mediaFeature: "${mediaFeature}". Expected 'any-hover' or 'hover'. Using 'any-hover'.`);
        mediaFeature = 'any-hover';
      }

      // Validate excludeSelectors
      if (!Array.isArray(excludeSelectors)) {
        result.warn(`Invalid excludeSelectors: expected array, got ${typeof excludeSelectors}. Using [].`);
        excludeSelectors = [];
      } else {
        // Filter valid patterns
        excludeSelectors = excludeSelectors.filter((pattern, index) => {
          const isValid = typeof pattern === 'string' || pattern instanceof RegExp;
          if (!isValid) {
            result.warn(`Invalid pattern in excludeSelectors[${index}]: expected string or RegExp. Pattern ignored.`);
          }
          return isValid;
        });
      }

      // Media query parameter
      const mediaParams = `(${mediaFeature}: hover)`;

      // Set for excluded selectors (for O(1) exact match lookup)
      const excludeSelectorsSet = new Set();
      const excludeRegexps = [];

      // Optimize excluded selectors: separate string and regexp patterns
      if (excludeSelectors.length > 0) {
        excludeSelectors.forEach((pattern) => {
          if (pattern instanceof RegExp) {
            excludeRegexps.push(pattern);
          } else {
            // Store exact string patterns in Set for O(1) lookup
            excludeSelectorsSet.add(pattern);
          }
        });
      }

      /**
       * Check if a selector matches any exclude pattern - optimized O(1) for exact strings
       * @param {string} selector - The selector to check
       * @returns {boolean} - Whether the selector should be excluded
       */
      const isExcludedSelector = (selector) => {
        // Early return - check actual processed patterns, not original array
        if (excludeSelectorsSet.size === 0 && excludeRegexps.length === 0) {
          return false;
        }

        // O(1) exact match for string patterns
        if (excludeSelectorsSet.size > 0 && excludeSelectorsSet.has(selector)) {
          return true;
        }

        // O(m) for RegExp patterns (m = number of RegExp patterns)
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

        // Check if :hover is inside :not() and ignore those selectors.
        // The pattern below allows **one level of parentheses nesting per group inside the :not(...) argument**
        // around :hover (e.g. :not(:is(.foo):hover)), and supports multiple such single-level
        // parenthesis groups, but does not allow deeper nested parenthesis levels inside :not(...).
        // Supported examples (single-level groups inside :not(...)):
        //   :not(:hover)                     [supported]
        //   :not(.foo:hover)                 [supported]
        //   :not(:is(.foo):hover)            [supported]  // :hover is wrapped once by :is(...)
        //   :not(:is(.a):is(.b):hover)       [supported]  // multiple single-level :is() groups
        // Not supported (deeper nested parenthesis levels inside :not(...)):
        //   :not(:is(:where(.foo)):hover)    [not supported] (extremely rare in practice)
        if (/:not\((?:[^()]*|\([^)]*\))*:hover(?:[^()]*|\([^)]*\))*\)/.test(selector)) {
          return false;
        }

        return HOVER_REGEX.test(selector) && !isExcludedSelector(selector);
      };

      /**
       * Check if a rule is already inside a hover-related media query - optimized version
       * @param {import('postcss').Rule} rule - The rule to check
       * @returns {boolean} - Whether the rule is inside a hover media query
       */
      const isAlreadyInHoverMedia = (rule) => {
        let parent = rule.parent;
        let depth = 0;
        // Maximum search depth to prevent infinite loops
        // 11+ levels of nesting is extremely rare in practice and acceptable trade-off
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
      /** @param {import('postcss').Rule} rule - PostCSS rule node. */
      root.walkRules((rule) => {
        // Early check: skip if selector doesn't exist or doesn't contain :hover
        if (!rule.selector || rule.selector.indexOf(':hover') === -1) {
          return;
        }

        // Skip if already inside @media (hover-related) to prevent double-wrapping
        // Check early to avoid unnecessary selector classification
        if (isAlreadyInHoverMedia(rule)) {
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

        // Create @media rule to wrap hover selectors
        const atRule = new AtRule({ name: 'media', params: mediaParams });

        if (nonHoverSelectors.length > 0) {
          // When there are non-hover selectors
          const hoverRule = rule.clone();
          // NOTE: Assign to `selector` string instead of `selectors` array for performance.
          // Updating `selectors` forces PostCSS to re-parse and re-serialize the selector list
          // multiple times, while assigning a joined string to `selector` does it in one pass.
          // This optimization reduces selector parsing from ~3 passes to 1 pass. In practice, this
          // difference is most noticeable for rules with many comma-separated selectors; for a single
          // selector the performance impact is negligible, but this approach keeps behavior equivalent.
          hoverRule.selector = hoverSelectors.join(', ');
          rule.selector = nonHoverSelectors.join(', ');

          atRule.append(hoverRule);
          parent.insertAfter(rule, atRule);
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
