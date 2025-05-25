/**
 * @type {import('postcss').PluginCreator}
 */
module.exports = () => {
  return {
    postcssPlugin: 'postcss-media-hover-any-hover',
    /**
     * @param {import('postcss').Root} root - PostCSS root node.
     * @param {import('postcss').Result} postcss - PostCSS result object.
     */
    Once(root, { AtRule }) {
      // 文字列検索
      const HOVER_STRING = ':hover';

      /** @param {import('postcss').Rule} rule - PostCSS rule node. */
      root.walkRules((rule) => {
        // セレクタを一度の走査で分類
        const selectors = rule.selectors;
        const hoverSelectors = [];
        const nonHoverSelectors = [];

        // ローカル変数にキャッシング
        const selectorsLength = selectors.length;
        let hasHoverSelector = false;

        // 一度の走査で分類
        for (let i = 0; i < selectorsLength; i++) {
          const selector = selectors[i];
          if (selector.indexOf(HOVER_STRING) !== -1) {
            hasHoverSelector = true;
            hoverSelectors.push(selector);
          } else {
            nonHoverSelectors.push(selector);
          }
        }

        // 早期リターン
        if (!hasHoverSelector) {
          return;
        }

        // 親要素を一度だけ参照
        const parent = rule.parent;

        // 既に親要素が@media (any-hover: hover)なら処理をスキップ
        if (parent && parent.type === 'atrule' && parent.name === 'media' && parent.params === '(any-hover: hover)') {
          return;
        }

        // hoverセレクタをラップする@mediaルールを作成
        const atRule = new AtRule({ name: 'media', params: '(any-hover: hover)' });

        if (nonHoverSelectors.length > 0) {
          // 非hoverセレクタがある場合
          const hoverRule = rule.clone();
          hoverRule.selectors = hoverSelectors;
          rule.selectors = nonHoverSelectors;

          atRule.append(hoverRule);
          parent.insertBefore(rule, atRule);
        } else {
          // hoverセレクタのみの場合
          atRule.append(rule.clone());
          rule.replaceWith(atRule);
        }
      });
    },
  };
};

module.exports.postcss = true;
