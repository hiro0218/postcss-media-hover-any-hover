// Performance test file
const postcss = require('postcss');
const { test } = require('node:test');
const { performance } = require('node:perf_hooks');

const plugin = require('./');

/**
 * Run performance test
 * @param {string} name - Test name
 * @param {string} input - Input CSS
 * @param {Object} opts - Plugin options
 * @param {number} iterations - Number of iterations
 */
async function runPerformanceTest(name, input, opts = {}, iterations = 100) {
  // console.log(`\n### Performance Test: ${name} ###`);

  // Warm-up run
  await postcss([plugin(opts)]).process(input, { from: undefined });

  // Actual measurement
  const startTime = performance.now();

  for (let i = 0; i < iterations; i++) {
    await postcss([plugin(opts)]).process(input, { from: undefined });
  }

  const endTime = performance.now();
  const duration = endTime - startTime;
  const average = duration / iterations;

  // console.log(`Total execution time: ${duration.toFixed(2)}ms`);
  // console.log(`Average execution time: ${average.toFixed(2)}ms/iteration`);
  // console.log(`Input size: ${input.length} characters`);

  return { name, duration, average, inputSize: input.length };
}

// Small CSS test
test('Small CSS Performance', async () => {
  const smallCss = `
    a { color: blue; }
    a:hover { color: red; }
    .button:hover { background: green; }
    .container .item:hover { border: 1px solid; }
  `;

  await runPerformanceTest('Small CSS', smallCss);
});

// Medium CSS test
test('Medium CSS Performance', async () => {
  let mediumCss = '';
  // Generate CSS with many selectors
  for (let i = 0; i < 100; i++) {
    mediumCss += `
      .item-${i} { padding: 10px; }
      .item-${i}:hover { background: #f0f0f0; }
      .container-${i} .button:hover { color: blue; }
      @media (min-width: 768px) {
        .responsive-${i}:hover { transform: scale(1.1); }
      }
    `;
  }

  await runPerformanceTest('Medium CSS', mediumCss);
});

// Large CSS test
test('Large CSS Performance', async () => {
  let largeCss = '';
  // Generate CSS with many more selectors
  for (let i = 0; i < 500; i++) {
    largeCss += `
      .item-${i} { padding: 10px; }
      .item-${i}:hover { background: #f0f0f0; }
      #header-${i} .nav:hover .dropdown { display: block; }
      .container-${i} .button:hover { color: blue; }
      @media (min-width: 768px) {
        .responsive-${i}:hover { transform: scale(1.1); }
      }
      .complex-${i}:hover::after { content: "→"; }
    `;
  }

  await runPerformanceTest('Large CSS', largeCss, {}, 10); // Reduce number of iterations for large CSS
});

// Test impact of excluded selectors on performance
test('Excluded Selectors Performance', async () => {
  // Generate CSS with many selectors (including ones to be excluded)
  let cssWithExcludes = '';
  for (let i = 0; i < 100; i++) {
    cssWithExcludes += `
      .exclude-${i}:hover { color: red; }
      .normal-${i}:hover { color: blue; }
    `;
  }

  // Generate array of excluded selectors
  const excludeSelectors = [];
  for (let i = 0; i < 50; i++) {
    excludeSelectors.push(`.exclude-${i}:hover`);
  }

  await runPerformanceTest('With excluded selectors', cssWithExcludes, { excludeSelectors });
  await runPerformanceTest('Without excluded selectors', cssWithExcludes, {});
});

// Impact of different option settings on performance
test('Different Options Performance', async () => {
  // Generate CSS with nested media queries
  let nestedCss = '';
  for (let i = 0; i < 100; i++) {
    nestedCss += `
      @media (min-width: 768px) {
        .item-${i}:hover { background: #f0f0f0; }
      }
    `;
  }

  await runPerformanceTest('transformNestedMedia: false', nestedCss, { transformNestedMedia: false });
  await runPerformanceTest('transformNestedMedia: true', nestedCss, { transformNestedMedia: true });
});
