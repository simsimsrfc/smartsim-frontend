import { twMerge } from "tailwind-merge";
import clsx from "clsx";
import type { HTMLAttributes } from "react";

export function Card({
  className,
  hover = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <div
      {...props}
      className={twMerge(
        clsx(
          "bg-gradient-card border border-soft rounded-lg shadow-card backdrop-blur-md",
          hover && "transition-all hover:shadow-card-hover hover:border-medium",
          className
        )
      )}
    />
  );
}
