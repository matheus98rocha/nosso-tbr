import React, { useId } from "react";

const LogoIcon = React.forwardRef<
  SVGSVGElement,
  React.SVGProps<SVGSVGElement>
>(function LogoIcon(
  { className, "aria-hidden": ariaHidden = true, focusable = false, ...props },
  ref,
) {
  const uid = useId().replace(/:/g, "");
  const g1 = `${uid}-bookColor1`;
  const g2 = `${uid}-bookColor2`;
  const g3 = `${uid}-bookColor3`;

  return (
    <svg
      ref={ref}
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden={ariaHidden}
      focusable={focusable}
      {...props}
    >
      <defs>
        <linearGradient
          id={g1}
          x1="8"
          y1="14"
          x2="8"
          y2="38"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#6C5CE7" />
          <stop offset="1" stopColor="#8E7DFF" />
        </linearGradient>
        <linearGradient
          id={g2}
          x1="18"
          y1="10"
          x2="18"
          y2="38"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00B894" />
          <stop offset="1" stopColor="#30E6BF" />
        </linearGradient>
        <linearGradient
          id={g3}
          x1="28"
          y1="16"
          x2="28"
          y2="38"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FF79A8" />
          <stop offset="1" stopColor="#FF9BCC" />
        </linearGradient>
      </defs>

      <rect x="8" y="14" width="8" height="24" rx="1" fill={`url(#${g1})`} />
      <path d="M8 14V38H16V14H8Z" fill="white" fillOpacity="0.1" />
      <path
        d="M8 15.5H16"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="0.5"
        strokeLinecap="round"
      />

      <rect x="18" y="10" width="8" height="28" rx="1" fill={`url(#${g2})`} />
      <path d="M18 10V38H26V10H18Z" fill="white" fillOpacity="0.1" />
      <path
        d="M18 11.5H26"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="0.5"
        strokeLinecap="round"
      />

      <rect x="28" y="16" width="8" height="22" rx="1" fill={`url(#${g3})`} />
      <path d="M28 16V38H36V16H28Z" fill="white" fillOpacity="0.1" />
      <path
        d="M28 17.5H36"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="0.5"
        strokeLinecap="round"
      />
    </svg>
  );
});

LogoIcon.displayName = "LogoIcon";

export default LogoIcon;
