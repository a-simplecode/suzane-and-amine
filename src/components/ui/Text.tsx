import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type TextProps = HTMLAttributes<HTMLParagraphElement> & {
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  tone?: "default" | "muted";
};

const sizeMap: Record<NonNullable<TextProps["size"]>, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg sm:text-xl",
};

const toneMap: Record<NonNullable<TextProps["tone"]>, string> = {
  default: "",
  muted: "opacity-70",
};

export function Text({ children, size = "md", tone = "default", className, ...rest }: TextProps) {
  return (
    <p className={cn(sizeMap[size], toneMap[tone], "leading-relaxed", className)} {...rest}>
      {children}
    </p>
  );
}
