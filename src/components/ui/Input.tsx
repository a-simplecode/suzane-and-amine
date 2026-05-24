import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, type = "text", ...rest }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        "h-11 w-full rounded-full border border-foreground/15 bg-transparent px-4 text-base outline-none transition placeholder:opacity-50 focus:border-foreground/40",
        className
      )}
      {...rest}
    />
  );
}
