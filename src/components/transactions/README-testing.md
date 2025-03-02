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
