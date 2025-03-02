'use client';

import { EditableCell } from './EditableCell';
import { dollarsToCents, centsToDollars } from '@/lib/utils/money';

interface EditableCellBaseProps {
  id: string;
  onSave: (id: string, value: any) => Promise<void>;
}

// EditableAmountCell for handling currency values
export function EditableAmountCell({
  id,
  value,
  onSave,
}: EditableCellBaseProps & { value: number }) {
  const handleSave = async (newValue: string | number) => {
    // Convert the string dollar amount to cents for storage
    const amountInCents = typeof newValue === 'string'
      ? dollarsToCents(parseFloat(newValue))
      : dollarsToCents(newValue as number);

    await onSave(id, amountInCents);
  };

  return (
    <EditableCell
      value={centsToDollars(value)}
      onSave={handleSave}
      type="currency"
      className="text-right"
      formatter={(val) => `$${val}`}
      parser={(val) => typeof val === 'string' ? val.replace('$', '') : val}
      validator={(val) => {
        const numVal = typeof val === 'string' ? parseFloat(val.replace('$', '')) : val;
        return !isNaN(numVal as number);
      }}
    />
  );
}

// EditableDateCell for handling date values
export function EditableDateCell({
  id,
  value,
  onSave,
}: EditableCellBaseProps & { value: string }) {
  const dateValue = new Date(value).toISOString().split('T')[0];

  const handleSave = async (newValue: string | number) => {
    const dateStr = typeof newValue === 'string' ? newValue : String(newValue);
    await onSave(id, new Date(dateStr).toISOString());
  };

  return (
    <EditableCell
      value={dateValue}
      onSave={handleSave}
      type="date"
      validator={(val) => {
        const date = new Date(val as string);
        return !isNaN(date.getTime());
      }}
      formatter={(val) => {
        const date = new Date(val as string);
        return date.toLocaleDateString();
      }}
    />
  );
}

// EditableDescriptionCell for handling text descriptions
export function EditableDescriptionCell({
  id,
  value,
  onSave,
}: EditableCellBaseProps & { value: string }) {
  const handleSave = async (newValue: string | number) => {
    await onSave(id, String(newValue));
  };

  return (
    <EditableCell
      value={value}
      onSave={handleSave}
      type="text"
      validator={(val) => String(val).length > 0}
    />
  );
}

// EditableNotesCell for handling optional notes
export function EditableNotesCell({
  id,
  value,
  onSave,
}: EditableCellBaseProps & { value: string | null }) {
  const handleSave = async (newValue: string | number) => {
    await onSave(id, String(newValue) || null);
  };

  return (
    <EditableCell
      value={value || ''}
      onSave={handleSave}
      type="text"
      placeholder="Add notes..."
    />
  );
}
