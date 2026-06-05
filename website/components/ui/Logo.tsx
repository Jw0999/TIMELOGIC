import Image from "next/image";
import type { CSSProperties } from "react";

/**
 * Brand mark: the real TimeLogic clock logo (cropped from the company logo)
 * shown in a white rounded badge so it reads cleanly on the dark UI.
 */
export function Logo({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <span
      className={`inline-grid flex-shrink-0 place-items-center overflow-hidden rounded-xl bg-white ring-1 ring-white/10 ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      <Image
        src="/logo-mark.png"
        alt="TimeLogic"
        width={size}
        height={size}
        className="h-[86%] w-[86%] object-contain"
      />
    </span>
  );
}

export function Wordmark({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span className={className} style={{ letterSpacing: "-0.02em", ...style }}>
      <span className="text-fg">Time</span>
      <span className="text-sky">Logic</span>
    </span>
  );
}

export function BrandLockup({
  size = 36,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <Logo size={size} />
      <Wordmark className="text-[18px] font-bold" />
    </span>
  );
}
