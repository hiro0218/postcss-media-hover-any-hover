## Install

```bash
npm i -D postcss-media-hover-any-hover
```

### PostCSS Config

`postcss.config.js`:

```js
module.exports = {
  plugins: [
    require('postcss-media-hover-any-hover')()
  ]
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
  a:hover, button:hover {
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
