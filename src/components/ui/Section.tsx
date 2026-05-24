import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type SectionProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  spacing?: "sm" | "md" | "lg";
};

const spacingMap: Record<NonNullable<SectionProps["spacing"]>, string> = {
  sm: "py-8 sm:py-12",
  md: "py-16 sm:py-24",
  lg: "py-24 sm:py-32",
};

export function Section({ children, spacing = "md", className, ...rest }: SectionProps) {
  return (
    <section className={cn(spacingMap[spacing], className)} {...rest}>
      {children}
    </section>
  );
}
