// components/ui/DividerWithText.tsx
import React from 'react';

type DividerProps = {
  /** النص بالمنتصف. تقدر تمرّر i18n: <DividerWithText>{t('or')}</DividerWithText> */
  children?: React.ReactNode;
  /** نص افتراضي لو ما في children */
  text?: string;
  /** كلاسات إضافية للعنصر الرئيسي */
  className?: string;
  /** كلاسات إضافية للخطين */
  lineClassName?: string;
  /** كلاسات إضافية للنص */
  textClassName?: string;
};

export default function DividerWithText({
  children,
  text,
  className = '',
  lineClassName = '',
  textClassName = '',
}: DividerProps) {
  const label = children ?? text ?? 'or';

  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      className={`w-[75%] mx-auto py-3 flex items-center ${className}`}
    >
      <span
        aria-hidden
        className={`h-px flex-1 bg-[#BBBBBB]  ${lineClassName}`}
      />
      <span className={`mx-4 text-sm text-[#BBBBBB] select-none ${textClassName}`}>
        {label}
      </span>
      <span
        aria-hidden
        className={`h-px flex-1 bg-[#BBBBBB]  ${lineClassName}`}
      />
    </div>
  );
}
