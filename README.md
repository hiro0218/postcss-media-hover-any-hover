# postcss-media-hover-any-hover

[![npm version](https://img.shields.io/npm/v/postcss-media-hover-any-hover.svg?style=flat-square)](https://www.npmjs.com/package/postcss-media-hover-any-hover)
[![npm downloads](https://img.shields.io/npm/dm/postcss-media-hover-any-hover.svg?style=flat-square)](https://www.npmjs.com/package/postcss-media-hover-any-hover)

postcss-media-hover-any-hover is a PostCSS plugin that automatically wraps CSS `:hover` selectors with `@media (any-hover: hover)` blocks.
This prevents unintended hover effects (the so-called "sticky hover" problem) on touch and hybrid devices, ensuring that hover styles are only applied on devices where a pointing device (like a mouse) is available.

- Desktop (with mouse): Hover effects are enabled
- Smartphones/Tablets: Hover effects are disabled
- Hybrid devices (e.g., Surface): Hover effects are enabled only when a mouse is connected

By using this plugin, you can achieve optimal hover behavior for each device type without sacrificing CSS maintainability.

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
/* Input */
a {
  &:hover {
    text-decoration: underline;
  }
}

/* Output */
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
/* Input */
a:hover,
button:hover {
  color: red;
}

/* Output */
@media (any-hover: hover) {
  a:hover,
  button:hover {
    color: red;
  }
}
```

### Mixed Selectors Example

```css
/* Input */
a {
  color: blue;
  &:hover {
    color: red;
  }
}

/* Output */
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
/* Input */
.container {
  .button:hover {
    color: blue;
  }
}

/* Output */
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
/* Input */
@media (min-width: 768px) {
  a:hover {
    color: purple;
  }
}

/* Output */
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

## Performance

This plugin is optimized to work fast and efficiently:

- Early returns to avoid unnecessary processing
- Optimized regular expression patterns
- Data structures for fast lookups
- Memory usage optimization

The plugin performs well even with large CSS files. To run performance tests:

```bash
npm run perf
```

### Performance Test Results Example

```
# Small CSS (145 characters)
Average execution time: 0.15ms/iteration

# Medium CSS (about 20k characters)
Average execution time: 1.81ms/iteration

# Large CSS (about 170k characters)
Average execution time: 19.99ms/iteration
```
