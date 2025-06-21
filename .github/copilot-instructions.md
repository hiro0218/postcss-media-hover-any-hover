# GitHub Copilot Instructions

## Project Overview

This project is the `postcss-media-hover-any-hover` PostCSS plugin. It wraps `:hover` selectors with `@media (any-hover: hover)` blocks to solve hover effect issues on touch devices.

## any-hover Media Query Specification

### W3C Specification

The any-hover media feature was added in CSS Media Queries Level 4. The any-hover feature is used to test whether any of the available input mechanisms can hover over elements.

### Value Definitions

- **`none`**: None of the available input mechanisms can hover conveniently, or there is no pointing input mechanism
- **`hover`**: One or more of the available input mechanisms can conveniently hover over elements

### Difference between hover and any-hover

- **`hover`**: Tests whether the user's primary input mechanism can hover over elements
- **`any-hover`**: Tests whether **any** of the available input mechanisms can hover

### Real-world Behavior Examples

- **Desktop (mouse)**: Both `hover: hover` and `any-hover: hover` are true
- **Touch devices (smartphones)**: Both `hover: none` and `any-hover: none` are true
- **Hybrid devices (Surface, etc.)**: `hover: none` (touch is primary), `any-hover: hover` (mouse also available)

### Purpose

@media (hover: hover) solves the sticky hover state problem. The main issue with the hover pseudo-class is the vast number of devices that can be used to browse the web: mobile phones, tablets, smart TVs, etc.

### Browser Support

Widely supported in modern browsers. The hover and pointer features are actually part of the Level 4 Media Queries specification.

## Tech Stack

- **Language**: TypeScript (default for JavaScript code)
- **Framework**: PostCSS plugin
- **Testing**: Jest or Vitest
- **Build**: TypeScript Compiler + PostCSS

## Plugin Behavior Specification

### Basic Transformation

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

### Target Selectors

- `:hover` pseudo-class
- Compound selectors containing `:hover` (e.g., `.button:hover`, `a:hover:focus`)
- Nested `:hover` selectors

### Exclusions

- `:hover` already within `@media (any-hover: hover)` or `@media (hover: hover)`
- `:hover` in comments
- `:hover` in strings

### Plugin Options (Expected)

```typescript
type PluginOptions = {
  // 'any-hover' | 'hover' - Default: 'any-hover'
  mediaFeature?: 'any-hover' | 'hover';
  // Whether to transform :hover within existing media queries
  transformNestedMedia?: boolean;
  // Exclude specific selector patterns
  excludeSelectors?: string[];
};
```

## Coding Conventions

### TypeScript

- Explicitly declare type definitions
- Prefer `type` over `interface`
- Explicitly declare function return types
- Utilize PostCSS type definitions (`postcss`, `postcss/lib/types`)

### PostCSS Plugin Development

- Specify plugin name with `postcssPlugin` property
- Use appropriate types for `Rule`, `AtRule`, `Declaration`
- Use methods like `walkRules`, `walkAtRules` for AST traversal
- Create new nodes and replace instead of modifying original nodes

### File Structure

```
src/
├── index.ts          # Main plugin file
├── types.ts          # Type definitions
├── utils.ts          # Utility functions
└── __tests__/        # Test files
    ├── index.test.ts
    └── fixtures/     # Test CSS files
```

### Testing

- Create test cases for each transformation pattern
- Test with input CSS and expected output CSS pairs
- Test edge cases (already within media queries, etc.)
- Use PostCSS's `process` method for test execution
- Test hover vs any-hover options
- Test cases for hybrid device support

### Real-world Test Scenarios

- Verify behavior on desktop browsers
- Confirm sticky hover problem resolution on mobile devices
- Verify proper behavior on hybrid devices like Surface

### Error Handling

- Appropriate error messages for invalid CSS syntax
- Validation of plugin options
- Utilize PostCSS warning system (`result.warn`)

## Recommended Code Examples

### Basic Plugin Structure

```typescript
import type { Plugin, Rule, AtRule } from 'postcss';

type PluginOptions = {
  // Option definitions
};

const plugin = (options: PluginOptions = {}): Plugin => {
  return {
    postcssPlugin: 'postcss-media-hover-any-hover',
    Rule(rule: Rule) {
      // Process rules containing :hover
    },
  };
};

plugin.postcss = true;
export default plugin;
```

### Selector Detection Examples

```typescript
const hasHoverPseudo = (selector: string): boolean => {
  return /:(hover)(\s|$|:|\[|\.|\#)/.test(selector);
};

const isAlreadyInHoverMedia = (rule: Rule): boolean => {
  let parent = rule.parent;
  while (parent) {
    if (parent.type === 'atrule' && parent.name === 'media' && /\((?:any-)?hover:\s*hover\)/.test(parent.params)) {
      return true;
    }
    parent = parent.parent;
  }
  return false;
};
```

### Media Query Generation Example

```typescript
const createHoverMediaQuery = (mediaFeature: 'hover' | 'any-hover' = 'any-hover'): AtRule => {
  return postcss.atRule({
    name: 'media',
    params: `(${mediaFeature}: hover)`,
  });
};
```

## Development Considerations

- Understand PostCSS AST structure for code generation
- Maintain CSS specificity
- Consider source map support
- Performance-conscious implementation (fast operation even with large CSS files)
- Avoid conflicts with existing media queries
- Clear distinction between any-hover and hover usage
- Consider hybrid devices (touch + mouse)
- Aim for complete resolution of sticky hover problems

## Debugging & Troubleshooting

- Use PostCSS's `result.warn` instead of `console.log`
- Output detailed logs with `--verbose` option during test execution
- Use `rule.toString()` to examine AST structure
