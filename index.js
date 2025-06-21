/**
 * @typedef {Object} PluginOptions
 * @property {'any-hover' | 'hover'} [mediaFeature='any-hover'] - メディア機能の種類 ('any-hover' または 'hover')
 * @property {boolean} [transformNestedMedia=false] - 既存のメディアクエリ内の :hover を変換するかどうか
 * @property {string[]} [excludeSelectors=[]] - 変換から除外するセレクタパターンのリスト
 */

/**
 * @type {import('postcss').PluginCreator<PluginOptions>}
 */
module.exports = (options = {}) => {
  // オプションの初期化とデフォルト値の設定
  const { mediaFeature = 'any-hover', transformNestedMedia = false, excludeSelectors = [] } = options;

  // メディアクエリのパラメータ
  const mediaParams = `(${mediaFeature}: hover)`;

  // hover疑似クラスを検出する正規表現
  const HOVER_REGEX = /:(hover)(\s|$|:|\.|\[|#)/;

  /**
   * セレクタが除外パターンに一致するかチェック
   * @param {string} selector - チェックするセレクタ
   * @returns {boolean} - 除外対象かどうか
   */
  const isExcludedSelector = (selector) => {
    if (!excludeSelectors.length) return false;
    return excludeSelectors.some((pattern) => {
      // 単純な文字列比較または正規表現としてマッチング
      if (pattern instanceof RegExp) {
        return pattern.test(selector);
      }
      return selector.includes(pattern);
    });
  };

  /**
   * セレクタがhover疑似クラスを持つかチェック
   * @param {string} selector - チェックするセレクタ
   * @returns {boolean} - hover疑似クラスを持つかどうか
   */
  const hasHoverPseudo = (selector) => {
    return HOVER_REGEX.test(selector) && !isExcludedSelector(selector);
  };

  /**
   * ルールが既にホバー関連のメディアクエリ内にあるかチェック
   * @param {import('postcss').Rule} rule - チェックするルール
   * @returns {boolean} - ホバーメディアクエリ内にあるかどうか
   */
  const isAlreadyInHoverMedia = (rule) => {
    let parent = rule.parent;
    while (parent) {
      if (parent.type === 'atrule' && parent.name === 'media' && /\((any-)?hover:\s*hover\)/.test(parent.params)) {
        return true;
      }
      parent = parent.parent;
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
          if (hasHoverPseudo(selector)) {
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

        // 既に親要素が@media (hover関連)なら処理をスキップ（オプションによる）
        if (!transformNestedMedia && isAlreadyInHoverMedia(rule)) {
          return;
        }

        // hoverセレクタをラップする@mediaルールを作成
        const atRule = new AtRule({ name: 'media', params: mediaParams });

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
