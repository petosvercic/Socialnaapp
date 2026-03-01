import * as React from "react";

type Props = {
  className?: string;
  title?: string;
};

/**
 * Lightweight brand mark inspired by the Viora "airflow" yin/yang shapes.
 * Inline SVG = no asset pipeline drama.
 */
export function VioraMark({ className, title = "Viora" }: Props) {
  const id = React.useId();
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label={title}
      className={className}
    >
      <defs>
        <linearGradient id={`${id}-g1`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#60a5fa" stopOpacity="0.95" />
          <stop offset="1" stopColor="#a855f7" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id={`${id}-g2`} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a855f7" stopOpacity="0.9" />
          <stop offset="1" stopColor="#c084fc" stopOpacity="0.9" />
        </linearGradient>
      </defs>

      {/* Outer swoosh */}
      <path
        d="M50.6 18.1c-3.8-6-11-9.8-18.8-9.8C18.2 8.3 7.8 18.7 7.8 32.3c0 11 6.9 20.5 16.7 24.1 1.6.6 3.3-.7 3.2-2.4-.2-2.9.2-5.7 1.1-8.5 2.2-6.9 8.5-12.1 15.6-12.9 3.4-.4 6.7.1 9.7 1.4 1.7.7 3.5-.6 3.4-2.4-.1-5.1-1.6-9.8-4.1-13.5z"
        fill={`url(#${id}-g1)`}
      />

      {/* Inner swoosh */}
      <path
        d="M13.4 46c3.8 6 11 9.8 18.8 9.8 13.6 0 24-10.4 24-24 0-11-6.9-20.5-16.7-24.1-1.6-.6-3.3.7-3.2 2.4.2 2.9-.2 5.7-1.1 8.5-2.2 6.9-8.5 12.1-15.6 12.9-3.4.4-6.7-.1-9.7-1.4-1.7-.7-3.5.6-3.4 2.4.1 5.1 1.6 9.8 4.1 13.5z"
        fill={`url(#${id}-g2)`}
      />
    </svg>
  );
}
