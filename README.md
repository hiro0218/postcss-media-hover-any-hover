## Install

```bash
npm i -D postcss-media-hover-any-hover
```

## Usage

Wrap `:hover` block with `@media (any-hover: hover)`.

```css
// Input
a {
  &:hover {
    text-decoration: underline;
  }
}

// Output
a {
  @media (any-hover: hover) {
    &:hover {
      text-decoration: underline;
    }
  }
}
```

`postcss.config.js`:

```js
const fs = require('fs');
const postcss = require('postcss');
const postcssMediaHoverAnyHover = require('postcss-media-hover-any-hover');

const css = fs.readFileSync('input.css', 'utf8');

const output = postcss().use(postcssMediaHoverAnyHover()).process(css).css;
```
