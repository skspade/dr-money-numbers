import { test, expect } from '@playwright/experimental-ct-react';
import {
  EditableAmountCell,
  EditableDateCell,
  EditableDescriptionCell,
  EditableNotesCell,
} from './EditableCells';

// Mock function for the onSave prop
const mockSave = async (id: string, value: any) => {
  // This is intentionally empty for testing
};

// Helper to create a mock function that tracks calls
const createMockSaveFn = () => {
  const calls: Array<[string, any]> = [];
  const mockFn = async (id: string, value: any) => {
    calls.push([id, value]);
  };
  mockFn.mock = { calls };
  mockFn.toHaveBeenCalledWith = (id: string, value: any) => calls.some((call) => call[0] === id && call[1] === value);
  mockFn.toHaveBeenCalledTimes = (times: number) => calls.length === times;
  return mockFn;
};

// EditableAmountCell Tests
test.describe('EditableAmountCell', () => {
  test('renders with correct formatted value', async ({ mount }) => {
    // 1099 cents = $10.99
    const component = await mount(
      <EditableAmountCell
        id="test-id"
        value={1099}
        onSave={mockSave}
      />,
    );

    // Check that the value is formatted as dollars with $ sign
    await expect(component).toContainText('$10.99');
  });

  test('allows editing and handles currency format', async ({ mount, page }) => {
    const saveMock = createMockSaveFn();

    const component = await mount(
      <EditableAmountCell
        id="test-id"
        value={1099}
        onSave={saveMock}
      />,
    );

    // Click to start editing
    await component.click();

    // Input new value
    await page.fill('input', '25.50');

    // Click the check button to save
    await page.getByRole('button').filter({ hasText: '' }).first().click();

    // Verify the save was called with correct values
    // 25.50 dollars = 2550 cents
    expect(saveMock.toHaveBeenCalledWith('test-id', 2550)).toBeTruthy();
  });
});

// EditableDateCell Tests
test.describe('EditableDateCell', () => {
  test('renders with correct formatted date', async ({ mount }) => {
    const dateString = '2023-05-15T00:00:00.000Z';

    const component = await mount(
      <EditableDateCell
        id="test-id"
        value={dateString}
        onSave={mockSave}
      />,
    );

    // Get today's date to compare with the localized format (depends on system locale)
    const testDate = new Date('2023-05-15');
    const expectedDateText = testDate.toLocaleDateString();

    await expect(component).toContainText(expectedDateText);
  });

  test('allows editing and handles date values', async ({ mount, page }) => {
    const saveMock = createMockSaveFn();
    const dateString = '2023-05-15T00:00:00.000Z';

    const component = await mount(
      <EditableDateCell
        id="test-id"
        value={dateString}
        onSave={saveMock}
      />,
    );

    // Click to start editing
    await component.click();

    // Enter a new date
    await page.fill('input[type="date"]', '2023-06-20');

    // Click the check button to save
    await page.getByRole('button').filter({ hasText: '' }).first().click();

    // Verify save was called with the correct format
    // The exact format might vary, so we just check that it was called with a string containing the date
    expect(saveMock.toHaveBeenCalledTimes(1)).toBeTruthy();
    const callArg = saveMock.mock.calls[0][1];
    expect(callArg).toContain('2023-06-20');
  });
});

// EditableDescriptionCell Tests
test.describe('EditableDescriptionCell', () => {
  test('renders with the correct text value', async ({ mount }) => {
    const component = await mount(
      <EditableDescriptionCell
        id="test-id"
        value="Grocery shopping"
        onSave={mockSave}
      />,
    );

    await expect(component).toContainText('Grocery shopping');
  });

  test('allows editing text values', async ({ mount, page }) => {
    const saveMock = createMockSaveFn();

    const component = await mount(
      <EditableDescriptionCell
        id="test-id"
        value="Grocery shopping"
        onSave={saveMock}
      />,
    );

    // Click to start editing
    await component.click();

    // Enter new text
    await page.fill('input', 'Restaurant dinner');

    // Click the check button to save
    await page.getByRole('button').filter({ hasText: '' }).first().click();

    // Verify save was called with the correct text
    expect(saveMock.toHaveBeenCalledWith('test-id', 'Restaurant dinner')).toBeTruthy();
  });
});

// EditableNotesCell Tests
test.describe('EditableNotesCell', () => {
  test('renders with the correct text value or placeholder', async ({ mount }) => {
    // With value
    const componentWithValue = await mount(
      <EditableNotesCell
        id="test-id"
        value="These are notes"
        onSave={mockSave}
      />,
    );

    await expect(componentWithValue).toContainText('These are notes');

    // With null value (should show placeholder)
    const componentWithNull = await mount(
      <EditableNotesCell
        id="test-id"
        value={null}
        onSave={mockSave}
      />,
    );

    // The placeholder should be shown but we can't easily verify that in the test
    // as it's only visible on focus, so we just check it renders without error
    await expect(componentWithNull).toBeVisible();
  });

  test('allows editing notes and handles null values', async ({ mount, page }) => {
    const saveMock = createMockSaveFn();

    const component = await mount(
      <EditableNotesCell
        id="test-id"
        value={null}
        onSave={saveMock}
      />,
    );

    // Click to start editing
    await component.click();

    // Enter new text
    await page.fill('input', 'Important note');

    // Click the check button to save
    await page.getByRole('button').filter({ hasText: '' }).first().click();

    // Verify save was called with the correct text
    expect(saveMock.toHaveBeenCalledWith('test-id', 'Important note')).toBeTruthy();
  });
});
