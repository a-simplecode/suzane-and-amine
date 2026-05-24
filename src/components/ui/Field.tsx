import type { LabelHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type FieldProps = LabelHTMLAttributes<HTMLLabelElement> & {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
};

export function Field({ label, hint, error, children, className, ...rest }: FieldProps) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)} {...rest}>
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error ? (
        <span className="text-xs text-red-500">{error}</span>
      ) : hint ? (
        <span className="text-xs opacity-60">{hint}</span>
      ) : null}
    </label>
  );
}
