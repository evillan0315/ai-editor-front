// Textarea.tsx
import React, { forwardRef, TextareaHTMLAttributes } from 'react';
import clsx from 'clsx';

export type ResizeOption = 'none' | 'vertical' | 'horizontal' | 'both';

export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  className?: string;
  border?: boolean; // keep border toggle if desired
  resize?: ResizeOption; // tailwind resize behaviour
  overflowScroll?: boolean; // enable scrollbar when maxHeight reached
  maxHeight?: number; // px
  minHeight?: number; // px
}

const resizeMap: Record<ResizeOption, string> = {
  none: 'resize-none',
  vertical: 'resize-y',
  horizontal: 'resize-x',
  both: 'resize',
};

const TextArea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      border = true,
      resize = 'vertical',
      overflowScroll = false,
      maxHeight = 200,
      minHeight,
      rows = 4,
      disabled = false,
      placeholder,
      id,
      name,
      style,
      ...rest
    },
    ref,
  ) => {
    const baseClasses = clsx(
      'w-full text-sm leading-5 px-3 py-2 placeholder:text-gray-400 disabled:opacity-60',
      border ? 'border border-gray-300' : 'border-0',
      // ✨ removed focus ring/border styling
      'focus:outline-none focus:ring-0 focus:border-0',
      // ✨ removed radius
      'rounded-none',
      resizeMap[resize],
      overflowScroll ? 'overflow-auto' : '',
      className,
    );

    const inlineStyle: React.CSSProperties = {
      ...(minHeight ? { minHeight } : {}),
      ...(overflowScroll ? { maxHeight } : {}),
      ...style,
    };

    return (
      <textarea
        id={id}
        name={name}
        ref={ref}
        className={baseClasses}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        style={inlineStyle}
        {...rest}
      />
    );
  },
);

Textarea.displayName = 'Textarea';

export default Textarea;
