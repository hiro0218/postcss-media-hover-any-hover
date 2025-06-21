const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  // eslint:recommended の設定をインポート
  js.configs.recommended,
  // プロジェクト固有の設定
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      // Node.jsとES6のグローバル変数を追加
      globals: {
        ...globals.node,
        ...globals.es2021,
        // カスタムグローバル変数があれば追加
      },
    },
    files: ['**/*.js'],
    ignores: ['node_modules/**'],
    rules: {},
  },
];
