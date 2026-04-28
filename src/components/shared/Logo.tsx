import { cn } from "@/lib/utils";

type LogoVariant = "full" | "compact" | "wordmark";
type LogoSize = "sm" | "md" | "lg";

interface LogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  className?: string;
  /** Animate the pulse line inside the shield mark */
  animated?: boolean;
}

const sizeMap = {
  sm: { mark: 24, text: "text-sm", gap: "gap-2" },
  md: { mark: 32, text: "text-base", gap: "gap-2.5" },
  lg: { mark: 44, text: "text-xl", gap: "gap-3" },
} satisfies Record<LogoSize, { mark: number; text: string; gap: string }>;

/** SVG shield mark with a signal-pulse line inside */
function ShieldMark({
  size,
  animated,
  className,
}: {
  size: number;
  animated?: boolean;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {/* Shield outline */}
      <path
        d="M16 2.5L4 7.5V16C4 21.8 9.2 27 16 29.5C22.8 27 28 21.8 28 16V7.5L16 2.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
        fill="none"
        opacity="0.9"
      />
      {/* Signal pulse line — a compact ECG-style waveform */}
      <path
        d="M8 16H11.5L13 12.5L15.5 19.5L17.5 14L19 17H24"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={animated ? "animate-pulse-glow" : undefined}
        style={
          animated
            ? {
                filter: "drop-shadow(0 0 3px currentColor)",
              }
            : undefined
        }
      />
    </svg>
  );
}

export function Logo({
  variant = "full",
  size = "md",
  className,
  animated = false,
}: LogoProps) {
  const { mark, text, gap } = sizeMap[size];

  if (variant === "compact") {
    return (
      <span
        className={cn("inline-flex items-center text-primary", className)}
        aria-label="API Sentinel"
      >
        <ShieldMark size={mark} animated={animated} />
      </span>
    );
  }

  if (variant === "wordmark") {
    return (
      <span
        className={cn(
          "inline-flex items-center font-semibold tracking-tight",
          text,
          className,
        )}
        aria-label="API Sentinel"
      >
        <span className="text-primary">API</span>
        <span className="text-foreground/80 ml-1">Sentinel</span>
      </span>
    );
  }

  // variant === "full"
  return (
    <span
      className={cn(
        "inline-flex items-center text-primary",
        gap,
        className,
      )}
      aria-label="API Sentinel"
    >
      <ShieldMark size={mark} animated={animated} />
      <span
        className={cn(
          "font-semibold tracking-tight leading-none",
          text,
        )}
      >
        <span className="text-foreground">API</span>
        <span className="text-primary"> Sentinel</span>
      </span>
    </span>
  );
}
