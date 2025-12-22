# Changelog

All notable changes to this project will be documented in this file.

## [0.5.0] - Unreleased

### Breaking Changes

#### excludeSelectors Now Uses Exact Matching

Previously, `excludeSelectors` used substring matching, which could lead to unintended exclusions.

**Before v0.5.0** (incorrect behavior):

```javascript
postcssMediaHoverAnyHover({
  excludeSelectors: [':hover'],
});
// Incorrectly excluded 'a:not(:hover)' because it contains ':hover'
```

**v0.5.0+** (correct behavior):

```javascript
postcssMediaHoverAnyHover({
  excludeSelectors: [':hover'],
});
// Only excludes exact selector ':hover'

// To exclude patterns, use RegExp:
postcssMediaHoverAnyHover({
  excludeSelectors: [/:hover/],
});
```

#### CSS Cascade Order Fixed

Mixed selectors now output in the correct order to preserve CSS cascade:

```css
/* Input */
a,
button:hover {
  color: red;
}

/* Before v0.5.0 (incorrect order) */
@media (any-hover: hover) {
  button:hover {
    color: red;
  }
}
a {
  color: red;
}

/* v0.5.0+ (correct order) */
a {
  color: red;
}
@media (any-hover: hover) {
  button:hover {
    color: red;
  }
}
```

#### transformNestedMedia Option Removed

The `transformNestedMedia` option has been removed. The plugin now always prevents double-wrapping of `:hover` selectors already inside `@media (any-hover: hover)` or `@media (hover: hover)`.

**Migration**: Remove this option from your configuration. If still present, it will be silently ignored.

### Added

- RegExp pattern support for `excludeSelectors` option
- Comprehensive options validation with helpful warning messages
- Performance optimizations for large CSS files

### Fixed

- Fixed excludeSelectors partial matching bug
- Fixed CSS cascade order for mixed selectors
- Improved `:not(:hover)` detection to handle nested parentheses
- Enhanced HOVER_REGEX to properly detect combinators

## [0.4.0] - 2024-03-XX

Initial release with basic functionality.
