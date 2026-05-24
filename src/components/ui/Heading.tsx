import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type HeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  children: ReactNode;
  level?: 1 | 2 | 3 | 4;
  align?: "left" | "center" | "right";
};

const levelMap: Record<NonNullable<HeadingProps["level"]>, string> = {
  1: "text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight",
  2: "text-3xl sm:text-4xl font-semibold tracking-tight",
  3: "text-2xl sm:text-3xl font-semibold",
  4: "text-xl sm:text-2xl font-medium",
};

const alignMap: Record<NonNullable<HeadingProps["align"]>, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export function Heading({ children, level = 2, align = "left", className, ...rest }: HeadingProps) {
  const Tag = `h${level}` as const;
  return (
    <Tag className={cn(levelMap[level], alignMap[align], className)} {...rest}>
      {children}
    </Tag>
  );
}
