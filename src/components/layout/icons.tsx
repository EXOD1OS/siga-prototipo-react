import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, className = 'h-[18px] w-[18px]', ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconHome = (p: IconProps) => (
  <Base {...p}>
    <path d="M3.5 10.5 12 4l8.5 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-6V20H4.5a1 1 0 0 1-1-1z" />
  </Base>
);

export const IconDocs = (p: IconProps) => (
  <Base {...p}>
    <path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 7 20z" />
    <path d="M14 3.5V8h4M10 12h5M10 15.5h5" />
    <path d="M4.5 7v13.5h9" opacity={0.5} />
  </Base>
);

export const IconUserDoc = (p: IconProps) => (
  <Base {...p}>
    <rect x="4" y="3.5" width="16" height="17" rx="2" />
    <circle cx="12" cy="10" r="2.6" />
    <path d="M7.5 17c.8-2 2.5-3 4.5-3s3.7 1 4.5 3" />
  </Base>
);

export const IconInbox = (p: IconProps) => (
  <Base {...p}>
    <path d="M3.5 13.5 6 5.5h12l2.5 8V19a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1z" />
    <path d="M3.5 13.5H8l1.5 2.5h5l1.5-2.5h4.5" />
  </Base>
);

export const IconSeal = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="10" r="5.5" />
    <path d="m9.6 10 1.7 1.7 3.2-3.4M8.5 14.5 7 20.5l5-2.5 5 2.5-1.5-6" />
  </Base>
);

export const IconStructure = (p: IconProps) => (
  <Base {...p}>
    <rect x="9" y="3.5" width="6" height="4.5" rx="1" />
    <rect x="3.5" y="16" width="6" height="4.5" rx="1" />
    <rect x="14.5" y="16" width="6" height="4.5" rx="1" />
    <path d="M12 8v4M6.5 16v-2.5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1V16" />
  </Base>
);

export const IconUsers = (p: IconProps) => (
  <Base {...p}>
    <circle cx="9" cy="8.5" r="3" />
    <path d="M3.5 19c.6-3 2.8-4.5 5.5-4.5s4.9 1.5 5.5 4.5" />
    <path d="M15.5 5.8a3 3 0 0 1 0 5.4M17.5 14.8c1.6.6 2.6 2 3 4.2" />
  </Base>
);

export const IconCollapse = (p: IconProps) => (
  <Base {...p}>
    <rect x="3.5" y="4" width="17" height="16" rx="2.5" />
    <path d="M9 4v16M15.5 10 13.5 12l2 2" />
  </Base>
);

export const IconBell = (p: IconProps) => (
  <Base {...p}>
    <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z" />
    <path d="M10 20.5a2.2 2.2 0 0 0 4 0" />
  </Base>
);

export const IconSun = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
  </Base>
);

export const IconMoon = (p: IconProps) => (
  <Base {...p}>
    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
  </Base>
);

export const IconAlert = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 4 2.8 19.5h18.4z" />
    <path d="M12 10v4M12 17v.01" />
  </Base>
);

export const IconCheck = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m8.5 12 2.5 2.5 4.5-5" />
  </Base>
);

export const IconClock = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Base>
);

export const IconChevronRight = (p: IconProps) => (
  <Base {...p}>
    <path d="m9.5 6 6 6-6 6" />
  </Base>
);

export const IconChevronDown = (p: IconProps) => (
  <Base {...p}>
    <path d="m6 9.5 6 6 6-6" />
  </Base>
);

export const IconKey = (p: IconProps) => (
  <Base {...p}>
    <circle cx="8" cy="15" r="4" />
    <path d="m11 12 8.5-8.5M16.5 6.5l2 2M14.5 8.5l1.5 1.5" />
  </Base>
);

export const IconLogout = (p: IconProps) => (
  <Base {...p}>
    <path d="M14 4.5H6a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h8M10 12h10M17 8.5l3.5 3.5-3.5 3.5" />
  </Base>
);

export const IconLock = (p: IconProps) => (
  <Base {...p}>
    <rect x="5" y="10.5" width="14" height="10" rx="2" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3M12 14.5v2" />
  </Base>
);

export const IconSend = (p: IconProps) => (
  <Base {...p}>
    <path d="M20.5 3.5 10 14M20.5 3.5 14 20.5l-4-6.5-6.5-4z" />
  </Base>
);

export const IconReturn = (p: IconProps) => (
  <Base {...p}>
    <path d="M9 14.5 4.5 10 9 5.5" />
    <path d="M4.5 10H15a4.5 4.5 0 0 1 0 9h-3" />
  </Base>
);

export const IconEye = (p: IconProps) => (
  <Base {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="2.8" />
  </Base>
);

export const IconClose = (p: IconProps) => (
  <Base {...p}>
    <path d="m6.5 6.5 11 11M17.5 6.5l-11 11" />
  </Base>
);
