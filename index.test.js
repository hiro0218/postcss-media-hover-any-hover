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
