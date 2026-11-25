import React from "react";

interface MailMindLogoProps {
  className?: string;
}

export const MailMindLogo: React.FC<MailMindLogoProps> = ({
  className = "w-7 h-7",
}) => {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle
        cx="18"
        cy="18"
        r="16.5"
        fill="#111111"
        stroke="#22C55E"
        strokeWidth="2"
      />
      <path
        d="M11 24.5V11.5L18 19L25 11.5V24.5"
        stroke="#F4F4F5"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
