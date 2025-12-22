# postcss-media-hover-any-hover

[![npm version](https://img.shields.io/npm/v/postcss-media-hover-any-hover.svg?style=flat-square)](https://www.npmjs.com/package/postcss-media-hover-any-hover)
[![npm downloads](https://img.shields.io/npm/dm/postcss-media-hover-any-hover.svg?style=flat-square)](https://www.npmjs.com/package/postcss-media-hover-any-hover)

A PostCSS plugin that automatically wraps `:hover` selectors with `@media (any-hover: hover)` to prevent unintended hover effects on touch devices.

## Why Use This Plugin?

On touch devices, tapping an element with `:hover` styles can cause "sticky hover" effects where the hover state persists until another element is tapped. This plugin solves this by wrapping hover styles in a media query that only applies when a pointing device capable of hovering is available.

**Device Behavior:**

- Desktop (with mouse): Hover effects enabled
- Smartphones/Tablets: Hover effects disabled
- Hybrid devices (e.g., Surface): Hover effects enabled only when mouse is connected

## Installation

```bash
npm install -D postcss-media-hover-any-hover
```

## Usage

### PostCSS Config

Add the plugin to your `postcss.config.js`:

```js
module.exports = {
  plugins: [require('postcss-media-hover-any-hover')()],
};
```

### JavaScript API

```js
const postcss = require('postcss');
const postcssMediaHoverAnyHover = require('postcss-media-hover-any-hover');

const result = await postcss([postcssMediaHoverAnyHover()]).process(css, { from: 'input.css' });
```

## How It Works

The plugin automatically wraps rules containing `:hover` selectors with `@media (any-hover: hover)`.

### Basic Example

```css
/* Input */
a:hover {
  color: blue;
}

/* Output */
@media (any-hover: hover) {
  a:hover {
    color: blue;
  }
}
```

### Nested Syntax

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

### Mixed Selectors

When a rule contains both hover and non-hover selectors, the plugin automatically splits them:

```css
/* Input */
a,
button:hover {
  color: red;
}

/* Output */
a {
  color: red;
}
@media (any-hover: hover) {
  button:hover {
    color: red;
  }
}
```

### Existing Media Queries

The plugin works with existing media queries by nesting the hover condition:

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

## Options

### `mediaFeature`

Choose between `'any-hover'` (default) or `'hover'`:

```js
postcssMediaHoverAnyHover({
  mediaFeature: 'any-hover', // or 'hover'
});
```

**Difference:**

- `'any-hover'`: Checks if **any** input device supports hover (recommended)
- `'hover'`: Checks if the **primary** input device supports hover

### `excludeSelectors`

Exclude specific selectors from transformation using exact matches or RegExp patterns:

```js
postcssMediaHoverAnyHover({
  excludeSelectors: [
    '.no-transform:hover', // Exact match
    /^\.special-/, // RegExp pattern
  ],
});
```

**Example:**

```css
/* Input */
.no-transform:hover {
  color: red;
}
a:hover {
  color: blue;
}

/* Output with excludeSelectors: ['.no-transform:hover'] */
.no-transform:hover {
  color: red;
}
@media (any-hover: hover) {
  a:hover {
    color: blue;
  }
}
```

## License

MIT
