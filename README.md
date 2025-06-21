## Install

```bash
npm i -D postcss-media-hover-any-hover
```

### PostCSS Config

`postcss.config.js`:

```js
module.exports = {
  plugins: [require('postcss-media-hover-any-hover')()],
};
```

### JavaScript API

```js
const fs = require('fs');
const postcss = require('postcss');
const postcssMediaHoverAnyHover = require('postcss-media-hover-any-hover');

const css = fs.readFileSync('input.css', 'utf8');

const output = postcss().use(postcssMediaHoverAnyHover()).process(css).css;
```

## Usage

This plugin automatically wraps rules containing `:hover` selectors with `@media (any-hover: hover)`.
This ensures hover effects only apply on devices that support hover functionality.

### Basic Example

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

### Multiple Selectors Example

```css
// Input
a:hover, button:hover {
  color: red;
}

// Output
@media (any-hover: hover) {
  a:hover,
  button:hover {
    color: red;
  }
}
```

### Mixed Selectors Example

```css
// Input
a {
  color: blue;
  &:hover {
    color: red;
  }
}

// Output
a {
  color: blue;
  @media (any-hover: hover) {
    &:hover {
      color: red;
    }
  }
}
```

### Nested Selectors Example

```css
// Input
.container {
  .button:hover {
    color: blue;
  }
}

// Output
.container {
  @media (any-hover: hover) {
    .button:hover {
      color: blue;
    }
  }
}
```

### Combining with Existing Media Queries

```css
// Input
@media (min-width: 768px) {
  a:hover {
    color: purple;
  }
}

// Output
@media (min-width: 768px) {
  @media (any-hover: hover) {
    a:hover {
      color: purple;
    }
  }
}
```

### Plugin Options

This plugin accepts the following options:

```js
postcssMediaHoverAnyHover({
  // 'any-hover' or 'hover', default: 'any-hover'
  mediaFeature: 'any-hover',

  // Whether to transform :hover within existing media queries, default: false
  transformNestedMedia: false,

  // Exclude specific selector patterns, default: []
  excludeSelectors: ['.no-transform:hover'],
});
```

#### `mediaFeature` Option

Choose between `'any-hover'` (default) and `'hover'`:

- `'any-hover'`: Uses `@media (any-hover: hover)` which checks if any input device supports hover
- `'hover'`: Uses `@media (hover: hover)` which only checks if the primary input device supports hover

```js
// Using hover instead of any-hover
postcss().use(postcssMediaHoverAnyHover({ mediaFeature: 'hover' }));
```

#### `transformNestedMedia` Option

Controls whether to transform `:hover` selectors that are already inside a media query:

```js
// Transform :hover even when already inside media queries
postcss().use(postcssMediaHoverAnyHover({ transformNestedMedia: true }));
```

#### `excludeSelectors` Option

Specify selectors that should not be transformed:

```js
// Exclude specific selectors from transformation
postcss().use(
  postcssMediaHoverAnyHover({
    excludeSelectors: ['.no-transform:hover', '.special-button:hover'],
  }),
);
```
