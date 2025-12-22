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
  await run('a { color: blue; }', 'a { color: blue; }');
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
  await run('a:hover::after { content: "→"; }', '@media (any-hover: hover) {a:hover::after { content: "→"; } }');
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
  // Current behavior doesn't change even when passing options (testing for future extensibility)
  await run('a:hover { color: orange; }', '@media (any-hover: hover) {a:hover { color: orange; } }', {
    /* Example of future options */
  });
});

test('processes hover selector already inside @media (any-hover: hover)', async () => {
  await run(
    '@media (any-hover: hover) { a:hover { color: purple; } }',
    '@media (any-hover: hover) { a:hover { color: purple; } }',
  );
});

test('supports mediaFeature option', async () => {
  await run('a:hover { color: green; }', '@media (hover: hover) {a:hover { color: green; } }', {
    mediaFeature: 'hover',
  });
});

test('ignores transformNestedMedia option (removed in v0.5.0)', async () => {
  // The transformNestedMedia option is silently ignored (no warning issued)
  // to maintain backward compatibility for users who still have it in their config
  await run(
    '@media (any-hover: hover) { a:hover { color: purple; } }',
    '@media (any-hover: hover) { a:hover { color: purple; } }',
    { transformNestedMedia: true }, // Option is silently ignored
  );
});

test('supports excludeSelectors option', async () => {
  await run(
    '.special:hover { color: red; } a:hover { color: blue; }',
    '.special:hover { color: red; } @media (any-hover: hover) { a:hover { color: blue; } }',
    { excludeSelectors: ['.special:hover'] },
  );
});

// Edge case tests for :hover detection
test('handles :hover::before pseudo-element', async () => {
  await run('a:hover::before { content: "→"; }', '@media (any-hover: hover) {a:hover::before { content: "→"; } }');
});

test('handles :hover::after pseudo-element', async () => {
  await run('button:hover::after { opacity: 1; }', '@media (any-hover: hover) {button:hover::after { opacity: 1; } }');
});

test('handles :hover[href] attribute selector', async () => {
  await run('a:hover[href] { color: blue; }', '@media (any-hover: hover) {a:hover[href] { color: blue; } }');
});

test('handles :hover#id ID selector', async () => {
  await run(
    'button:hover#submit { background: green; }',
    '@media (any-hover: hover) {button:hover#submit { background: green; } }',
  );
});

test('handles :hover.class class selector', async () => {
  await run(
    'a:hover.active { font-weight: bold; }',
    '@media (any-hover: hover) {a:hover.active { font-weight: bold; } }',
  );
});

test('handles :hover with general sibling combinator', async () => {
  await run(
    'button:hover ~ .tooltip { opacity: 1; }',
    '@media (any-hover: hover) {button:hover ~ .tooltip { opacity: 1; } }',
  );
});

// Modern CSS pseudo-class tests
test('handles :is() with :hover', async () => {
  await run(
    ':is(a, button):hover { color: blue; }',
    '@media (any-hover: hover) {:is(a, button):hover { color: blue; } }',
  );
});

test('does not transform :not(:hover)', async () => {
  await run('a:not(:hover) { opacity: 0.5; }', 'a:not(:hover) { opacity: 0.5; }');
});

test('handles :where() with :hover', async () => {
  await run(
    ':where(a, button):hover { opacity: 0.8; }',
    '@media (any-hover: hover) {:where(a, button):hover { opacity: 0.8; } }',
  );
});

test('handles :not() before :hover', async () => {
  await run(
    'a:not(.disabled):hover { color: green; }',
    '@media (any-hover: hover) {a:not(.disabled):hover { color: green; } }',
  );
});

test('does not transform :has() with :hover child (no hover on parent)', async () => {
  await run('div:has(> a:hover) { background: yellow; }', 'div:has(> a:hover) { background: yellow; }');
});

test('handles :has() selector itself with :hover', async () => {
  await run(
    'div:has(> a):hover { background: gray; }',
    '@media (any-hover: hover) {div:has(> a):hover { background: gray; } }',
  );
});

// Attribute selector tests
test('handles attribute selector before :hover', async () => {
  await run(
    'a[href]:hover { text-decoration: underline; }',
    '@media (any-hover: hover) {a[href]:hover { text-decoration: underline; } }',
  );
});

test('handles complex attribute selector with :hover', async () => {
  await run(
    'input[type="submit"]:hover { cursor: pointer; }',
    '@media (any-hover: hover) {input[type="submit"]:hover { cursor: pointer; } }',
  );
});

test('handles multiple attribute selectors with :hover', async () => {
  await run(
    'a[href][target="_blank"]:hover { color: orange; }',
    '@media (any-hover: hover) {a[href][target="_blank"]:hover { color: orange; } }',
  );
});

test('handles attribute selector with operator variations', async () => {
  await run(
    'a[class^="btn"]:hover { transform: scale(1.05); }',
    '@media (any-hover: hover) {a[class^="btn"]:hover { transform: scale(1.05); } }',
  );
});

// excludeSelectors substring collision tests (these will fail with current implementation)
test('excludeSelectors should not match substrings - :hover pattern', async () => {
  await run(
    'a:not(:hover) { color: gray; } a:hover { color: blue; }',
    'a:not(:hover) { color: gray; } @media (any-hover: hover) { a:hover { color: blue; } }',
    { excludeSelectors: [':hover'] },
  );
});

test('excludeSelectors should not match substrings - class pattern', async () => {
  await run(
    '.my-button:hover { background: red; } .button:hover { background: blue; }',
    '@media (any-hover: hover) {.my-button:hover { background: red; } } @media (any-hover: hover) { .button:hover { background: blue; } }',
    { excludeSelectors: ['button'] },
  );
});

test('excludeSelectors exact match should work correctly', async () => {
  await run(
    '.exact-match:hover { color: red; } a:hover { color: blue; }',
    '.exact-match:hover { color: red; } @media (any-hover: hover) { a:hover { color: blue; } }',
    { excludeSelectors: ['.exact-match:hover'] },
  );
});

test('excludeSelectors with RegExp should work', async () => {
  await run(
    '.no-transform-1:hover { color: red; } .no-transform-2:hover { color: green; } a:hover { color: blue; }',
    '.no-transform-1:hover { color: red; } .no-transform-2:hover { color: green; } @media (any-hover: hover) { a:hover { color: blue; } }',
    { excludeSelectors: [/^\.no-transform-/] },
  );
});

test('excludeSelectors with multiple RegExp patterns', async () => {
  await run(
    '.exclude-a:hover { color: red; } .exclude-b:hover { color: green; } a:hover { color: blue; }',
    '.exclude-a:hover { color: red; } .exclude-b:hover { color: green; } @media (any-hover: hover) { a:hover { color: blue; } }',
    { excludeSelectors: [/\.exclude-a:hover/, /\.exclude-b:hover/] },
  );
});

// Options validation tests
test('warns on invalid mediaFeature option', async () => {
  const result = await postcss([plugin({ mediaFeature: 'invalid' })]).process('a:hover { color: red; }', {
    from: undefined,
  });

  equal(result.warnings().length, 1);
  equal(result.warnings()[0].text.includes('Invalid mediaFeature'), true);
  // Should still work with default
  equal(result.css, '@media (any-hover: hover) {a:hover { color: red; } }');
});

test('warns on invalid excludeSelectors type', async () => {
  const result = await postcss([plugin({ excludeSelectors: 'not-an-array' })]).process('a:hover { color: red; }', {
    from: undefined,
  });

  equal(result.warnings().length, 1);
  equal(result.warnings()[0].text.includes('excludeSelectors'), true);
});

test('filters out invalid patterns in excludeSelectors', async () => {
  const result = await postcss([
    plugin({
      excludeSelectors: ['.valid:hover', 123, null, /pattern/, undefined],
    }),
  ]).process('.valid:hover { color: red; } a:hover { color: blue; }', { from: undefined });

  // Should warn about invalid patterns
  const warnings = result.warnings();
  equal(
    warnings.some((w) => w.text.includes('excludeSelectors[1]')),
    true,
  );
  equal(
    warnings.some((w) => w.text.includes('excludeSelectors[2]')),
    true,
  );

  // Should still work with valid patterns
  equal(result.css, '.valid:hover { color: red; } @media (any-hover: hover) { a:hover { color: blue; } }');
});
