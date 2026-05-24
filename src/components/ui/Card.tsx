import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  padding?: "sm" | "md" | "lg";
};

const paddingMap: Record<NonNullable<CardProps["padding"]>, string> = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function Card({ children, padding = "md", className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-foreground/10 bg-background/40 backdrop-blur-sm",
        paddingMap[padding],
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
