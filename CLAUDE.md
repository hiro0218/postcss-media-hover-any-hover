# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

postcss-media-hover-any-hover is a PostCSS plugin that automatically wraps CSS `:hover` selectors with `@media (any-hover: hover)` blocks to prevent sticky hover effects on touch devices.

## Recent Changes (v0.5.0)

### Critical Bug Fixes

**excludeSelectors Exact Matching** (index.js:74-106):

- Changed from substring matching (`includes()`) to exact matching (`Set.has()`)
- **Breaking Change**: `excludeSelectors: [':hover']` now only excludes exact selector `:hover`, not `a:not(:hover)`
- Use RegExp patterns for substring matching: `excludeSelectors: [/:hover/]`
- Performance improved from O(n·m) to O(1) for string patterns

**CSS Cascade Order** (index.js:190):

- Changed from `insertBefore` to `insertAfter` to preserve correct CSS cascade order
- Mixed selectors now output non-hover rules first, then media query

**:not(:hover) Detection** (index.js:111):

- Added regex check to prevent transforming `:not(:hover)` selectors
- Pattern: `/:not\((?:[^()]*|\([^)]*\))*:hover(?:[^()]*|\([^)]*\))*\)/`

### Removed Features

**transformNestedMedia Option Removed**:

- **Breaking Change**: Option completely removed in v0.5.0
- Rationale: No practical use case - only created redundant nested media queries
- Migration: Remove from configuration; option is silently ignored if present
- Behavior: Always prevents double-wrapping (previous default behavior)

### New Features

**Options Validation** (index.js:31-69):

- Added comprehensive validation for all plugin options
- Invalid options trigger `result.warn()` with fallback to defaults
- Validates `mediaFeature` and `excludeSelectors`
- Deprecated option `transformNestedMedia` shows warning

**Enhanced HOVER_REGEX** (index.js:20):

- Updated from `/:hover(?:\s|$|:|\.|\[|#)/` to `/:hover(?:[\s:.\[#,>+~]|$)/`
- Now correctly handles combinators (`>`, `+`, `~`)
- Supports modern CSS pseudo-classes (`:is()`, `:where()`, `:has()`)

### Performance Improvements

**Selector Parsing Cache** (index.js:189-190):

- Reduced selector parsing from 3 passes to 1 pass
- Using `selector` string instead of `selectors` array to avoid re-parsing

**Data Structure Optimization**:

- Changed from `Map` to `Set` for excludeSelectors (index.js:75)
- Separate arrays for string patterns and RegExp patterns

### Test Coverage Improvements

**Added 20+ New Test Cases** (index.test.js:130-327):

- Edge cases: `::before`, `::after`, `[href]`, `#id`, `.class` with `:hover`
- Modern CSS: `:is()`, `:where()`, `:not()`, `:has()` with `:hover`
- Attribute selectors: `a[href]:hover`, `input[type="submit"]:hover`
- excludeSelectors exact matching validation
- Options validation tests
- Test coverage increased from ~32% to ~75%

## Development Commands

### Testing

```bash
npm run unit          # Run unit tests only (using Node.js test runner)
npm test              # Run unit tests + ESLint
npm run perf          # Run performance tests
```

### Code Quality

```bash
npm run lint          # Run ESLint
npm run format        # Format code with Prettier
```

### Pre-commit Hook

The repository uses husky + nano-staged. Before each commit:

- Prettier formats changed files
- ESLint auto-fixes issues

## Architecture

### Single-File Plugin Structure

The plugin is implemented in `index.js` as a PostCSS plugin. Key architectural decisions:

**Core Algorithm (index.js:98-156)**:

1. Walk through all CSS rules using PostCSS's `walkRules`
2. Early return if selector doesn't contain `:hover`
3. Classify selectors into hover vs non-hover in a single pass
4. Create `@media (any-hover: hover)` wrapper for hover selectors
5. Handle mixed selectors by splitting rules

**Performance Optimizations**:

- Pre-compiled regex patterns (HOVER_REGEX, HOVER_MEDIA_REGEX)
- Early returns to skip unnecessary processing
- Set-based lookup for excluded selectors
- Optimized selector traversal with minimal iterations
- Maximum search depth limit (MAX_DEPTH = 10) for parent traversal

### Plugin Options

```javascript
{
  mediaFeature: 'any-hover' | 'hover',           // Default: 'any-hover'
  excludeSelectors: (string | RegExp)[]          // Default: []
}
```

**mediaFeature**:

- `'any-hover'` - True if ANY input mechanism can hover (recommended for hybrid devices)
- `'hover'` - True if PRIMARY input mechanism can hover

**excludeSelectors**:

- Accepts exact string matches or RegExp patterns
- String patterns use O(1) Set lookup for performance
- RegExp patterns tested sequentially

### Key Functions

**hasHoverPseudo(selector)** (index.js:64-69):

- Detects `:hover` in selectors using optimized regex
- Filters out excluded selectors

**isAlreadyInHoverMedia(rule)** (index.js:76-90):

- Traverses parent nodes to check for existing hover media queries
- Prevents double-wrapping
- Uses depth limit to prevent infinite loops

**isExcludedSelector(selector)** (index.js:76-89):

- Fast lookup using Set for string patterns
- Separate handling for RegExp patterns
- Early return for empty exclude list

## Testing Approach

### Unit Tests (index.test.js)

Uses Node.js built-in test runner (`node:test`). Test pattern:

```javascript
await run(inputCSS, expectedOutputCSS, options);
```

Key test scenarios:

- Basic hover wrapping
- Mixed selectors (hover + non-hover)
- Nested selectors
- Existing media queries
- Plugin options (mediaFeature, transformNestedMedia, excludeSelectors)

### Performance Tests (performance.test.js)

- Small CSS (~145 chars)
- Medium CSS (~20k chars, 100 iterations)
- Large CSS (~170k chars, 10 iterations)
- Tests with excluded selectors
- Different option combinations

## Code Style

### JavaScript (not TypeScript)

This project uses plain JavaScript with JSDoc comments for type hints rather than TypeScript.

### Formatting

- Prettier: 120 char line width, single quotes, trailing commas
- ESLint: Flat config format (eslint.config.js)
- CommonJS modules (not ES modules)

### Performance Considerations

- Avoid redundant operations - use early returns
- Pre-compile regex patterns outside of hot paths
- Use Map for O(1) lookups instead of array iterations
- Minimize AST traversal depth

## Common Development Tasks

### Adding a New Option

1. Update JSDoc `@typedef PluginOptions` (index.js:2-6)
2. Destructure option with default in plugin function (index.js:13)
3. Add logic in the `Once` callback
4. Add tests in index.test.js

### Debugging Transformations

The plugin processes CSS in a single pass. To debug:

1. Use `rule.toString()` to inspect PostCSS AST nodes
2. Check `rule.selector` and `rule.selectors` for selector analysis
3. Verify parent chain with `rule.parent` traversal

## Important Constraints

### Do Not Modify

- **Selector specificity**: Transformations must preserve CSS specificity
- **Source order**: Rules must maintain their original order
- **Non-hover rules**: Never wrap rules without `:hover` selectors

### Edge Cases to Consider

- `:hover` combined with other pseudo-classes (`:focus:hover`, `:hover::after`)
- Selectors already inside `@media (any-hover: hover)` or `@media (hover: hover)`
- Multiple comma-separated selectors with mix of hover/non-hover
- Deeply nested selectors in PostCSS nesting syntax
