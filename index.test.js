const postcss = require('postcss');
const { equal } = require('node:assert');
const { test } = require('node:test');

const plugin = require('./');

async function run(input, output, opts = {}) {
  let result = await postcss([plugin(opts)]).process(input, {
    from: undefined,
  });
  equal(result.css, output);
  equal(result.warnings().length, 0);
}

test('wraps hover selector with @media', async () => {
  await run(
    'a { &:hover{ text-decoration: underline } }',
    'a { @media (any-hover: hover) { &:hover{ text-decoration: underline } } }',
  );
});

test('does not modify CSS without hover selectors', async () => {
  await run(
    'a { color: blue; }',
    'a { color: blue; }',
  );
});

test('handles mixed hover and non-hover selectors', async () => {
  await run(
    'a { color: blue; &:hover { color: red; } }',
    'a { color: blue; @media (any-hover: hover) { &:hover { color: red; } } }',
  );
});

test('handles multiple hover selectors', async () => {
  await run(
    'a:hover, button:hover { color: red; }',
    '@media (any-hover: hover) {a:hover, button:hover { color: red; } }',
  );
});

test('handles nested hover selectors', async () => {
  await run(
    '.container { .button:hover { color: blue; } }',
    '.container { @media (any-hover: hover) { .button:hover { color: blue; } } }',
  );
});

test('handles complex selectors with hover', async () => {
  await run(
    'ul li > a.link:hover + span { color: green; }',
    '@media (any-hover: hover) {ul li > a.link:hover + span { color: green; } }',
  );
});

test('preserves existing media queries', async () => {
  await run(
    '@media (min-width: 768px) { a:hover { color: purple; } }',
    '@media (min-width: 768px) { @media (any-hover: hover) { a:hover { color: purple; } } }',
  );
});

test('handles hover pseudo classes in combination with other pseudo classes', async () => {
  await run(
    'a:focus:hover { outline: none; border-bottom: 1px solid; }',
    '@media (any-hover: hover) {a:focus:hover { outline: none; border-bottom: 1px solid; } }',
  );
});

test('handles multiple rules with some containing hover selectors', async () => {
  await run(
    'p { color: black; } a:hover { color: blue; } button { padding: 8px; }',
    'p { color: black; } @media (any-hover: hover) { a:hover { color: blue; } } button { padding: 8px; }',
  );
});

test('handles hover with pseudo elements', async () => {
  await run(
    'a:hover::after { content: "→"; }',
    '@media (any-hover: hover) {a:hover::after { content: "→"; } }',
  );
});

test('handles hover with animation properties', async () => {
  await run(
    'button:hover { transition: all 0.3s ease; transform: scale(1.1); }',
    '@media (any-hover: hover) {button:hover { transition: all 0.3s ease; transform: scale(1.1); } }',
  );
});

test('handles multiple nested layers of hover selectors', async () => {
  await run(
    '.dropdown { .menu { .item:hover { background: #eee; } } }',
    '.dropdown { .menu { @media (any-hover: hover) { .item:hover { background: #eee; } } } }',
  );
});

test('handles future options compatibility', async () => {
  // オプションを渡しても現状の動作は変わらない（将来的な拡張性のテスト）
  await run(
    'a:hover { color: orange; }',
    '@media (any-hover: hover) {a:hover { color: orange; } }',
    { /* 将来的なオプションの例 */ }
  );
});

test('processes hover selector already inside @media (any-hover: hover)', async () => {
  await run(
    '@media (any-hover: hover) { a:hover { color: purple; } }',
    '@media (any-hover: hover) { a:hover { color: purple; } }',
  );
});
