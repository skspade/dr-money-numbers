# Component Testing with Playwright

This directory contains Playwright Component Tests (.ct.tsx files) for testing React components in isolation.

## Running the Tests

To run all component tests:

```bash
npm run test-ct
# or with pnpm
pnpm test-ct
```

To run tests in a specific file:

```bash
pnpm test-ct src/components/transactions/EditableCells.ct.tsx
```

To run tests in UI mode (with a visual interface):

```bash
pnpm test-ct --ui
```

## Running Tests in CI Mode

The project includes a special command to run component tests in CI mode:

```bash
pnpm test-ct:ci
```

In CI mode:

- Only the Chromium browser is used (not Firefox or WebKit)
- Interactive tests are skipped
- The dot reporter is used instead of HTML
- Fewer workers are used to avoid race conditions
- Tests get retried on failure

This mode is optimized for continuous integration environments but can also be used locally for faster testing when you only need to verify basic rendering functionality.

## Test Files

- `EditableCells.ct.tsx`: Tests for the editable cell components used in transaction tables

## Component Test Structure

Each component test file follows this structure:

1. Import the components and Playwright testing utilities
2. Set up any necessary mocks/fixtures
3. Group tests by component using `test.describe()`
4. Write individual test cases that:
   - Mount the component
   - Interact with it (click, type, etc.)
   - Assert expected behaviors

## Writing New Tests

When writing new component tests:

1. Create a new `.ct.tsx` file in the same directory as the component
2. Import the component and test utilities
3. Use the `mount` fixture to render the component
4. Use `page` methods to interact with the component
5. Use `expect` assertions to verify behavior

For examples, see the existing test files in this directory.

## CI Compatibility

When writing tests that should work in CI mode:

1. Use `test.skip(!!process.env.CI, 'Skipping in CI mode')` for interactive tests that might be flaky in CI
2. Keep render tests separate from interaction tests
3. Avoid multiple component mounts in a single test
4. Test DOM interactions in non-CI tests, focus on rendering in CI-compatible tests
