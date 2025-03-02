'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface EditableCellProps {
  value: string | number;
  onSave: (value: string | number) => Promise<void>;
  type?: 'text' | 'number' | 'date' | 'currency';
  className?: string;
  placeholder?: string;
  validator?: (value: string | number) => boolean;
  formatter?: (value: string | number) => string | number;
  parser?: (value: string | number) => string | number;
}

export function EditableCell({
  value,
  onSave,
  type = 'text',
  className,
  placeholder,
  validator = () => true,
  formatter = (v) => v,
  parser = (v) => v,
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<string | number>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Format the display value
  const displayValue = formatter(value);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (typeof editValue === 'string') {
        inputRef.current.select();
      }
    }
  }, [isEditing, editValue]);

  const handleStartEdit = useCallback(() => {
    setEditValue(value);
    setIsEditing(true);
    setError(null);
  }, [value]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setError(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    try {
      // Validate the input
      if (!validator(editValue)) {
        setError('Invalid value');
        return;
      }

      setIsSubmitting(true);
      setError(null);

      // Parse the value before saving
      const parsedValue = parser(editValue);

      // Save the value
      await onSave(parsedValue);

      // Exit edit mode
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  }, [editValue, onSave, parser, validator]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  }, [handleCancel, handleSubmit]);

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 w-full">
        <Input
          ref={inputRef}
          type={type === 'currency' ? 'text' : type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className={cn('h-8 font-mono', className)}
          placeholder={placeholder}
          disabled={isSubmitting}
          aria-invalid={error ? 'true' : 'false'}
        />
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {error && (
          <p className="text-red-500 text-xs absolute bottom-0 left-0 translate-y-full">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={handleStartEdit}
      className={cn(
        'cursor-pointer p-1 -m-1 rounded hover:bg-secondary/30 transition-colors',
        className,
      )}
    >
      {displayValue}
    </div>
  );
}
