"use client";

export function Logo({
  size,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <img
      src="/smartsim-logo-final.png"
      alt="Smart Sim"
      className={className ?? "h-auto w-[190px] object-contain"}
      style={className ? undefined : size ? { width: size } : undefined}
    />
  );
}
