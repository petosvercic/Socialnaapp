import * as React from "react";

type Side = "top" | "bottom" | "left" | "right";

const POS: Record<Side, { bubble: string; arrow: string }> = {
  top: {
    bubble: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    arrow: "bottom-[-4px] left-1/2 -translate-x-1/2 rotate-45",
  },
  bottom: {
    bubble: "top-full left-1/2 -translate-x-1/2 mt-2",
    arrow: "top-[-4px] left-1/2 -translate-x-1/2 rotate-45",
  },
  left: {
    bubble: "right-full top-1/2 -translate-y-1/2 mr-2",
    arrow: "right-[-4px] top-1/2 -translate-y-1/2 rotate-45",
  },
  right: {
    bubble: "left-full top-1/2 -translate-y-1/2 ml-2",
    arrow: "left-[-4px] top-1/2 -translate-y-1/2 rotate-45",
  },
};

export function Tooltip({
  label,
  children,
  side = "top",
}: {
  label: string;
  children: React.ReactNode;
  side?: Side;
}) {
  const pos = POS[side];

  return (
    <span className="group relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={[
          "pointer-events-none absolute z-50",
          pos.bubble,
          "opacity-0 transition-opacity duration-150",
          "group-hover:opacity-100 group-focus-within:opacity-100",
        ].join(" ")}
      >
        <span className="relative block max-w-[220px] rounded-lg bg-black px-2.5 py-1.5 text-xs font-medium text-white shadow-lg">
          {label}
          <span
            aria-hidden="true"
            className={["absolute h-2 w-2 bg-black", pos.arrow].join(" ")}
          />
        </span>
      </span>
    </span>
  );
}