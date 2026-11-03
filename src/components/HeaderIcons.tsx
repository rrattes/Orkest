import type { ReactNode } from "react";

function Ico({ children, size = 16 }: { children: ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export const BrandIcon = () => (
  <Ico><rect x="2" y="3" width="12" height="10" rx="2" /><path d="M5 7l2 1.5L5 10M9 10h2" /></Ico>
);
export const GearIcon = () => (
  <Ico>
    <circle cx="8" cy="8" r="2" />
    <path d="M8 1.8v1.6M8 12.6v1.6M1.8 8h1.6M12.6 8h1.6M3.6 3.6l1.1 1.1M11.3 11.3l1.1 1.1M12.4 3.6l-1.1 1.1M4.7 11.3l-1.1 1.1" />
  </Ico>
);
export const BellIcon = () => (
  <Ico><path d="M4 11V7.5a4 4 0 0 1 8 0V11l1 1.5H3L4 11zM6.5 14h3" /></Ico>
);
export const KeyboardIcon = () => (
  <Ico><rect x="1.5" y="4" width="13" height="8" rx="1.5" /><path d="M4 7h.01M6.5 7h.01M9 7h.01M11.5 7h.01M5 9.5h6" /></Ico>
);
export const PulseIcon = () => (
  <Ico><path d="M1.5 8h3l1.5-4 3 8 1.5-4h4" /></Ico>
);
export const InfoIcon = () => (
  <Ico><circle cx="8" cy="8" r="6" /><path d="M8 7.5V11M8 5.2h.01" /></Ico>
);
export const MinusIcon = ({ size = 12 }: { size?: number }) => (
  <Ico size={size}><path d="M3.5 8h9" /></Ico>
);
export const PlusSmallIcon = ({ size = 12 }: { size?: number }) => (
  <Ico size={size}><path d="M3.5 8h9M8 3.5v9" /></Ico>
);
