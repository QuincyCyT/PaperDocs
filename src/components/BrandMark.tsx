interface BrandMarkProps {
  className?: string;
}

export function BrandMark({ className = 'w-7 h-7' }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="7" fill="#0B3D91" />
      <path
        d="M9.5 8.5H18L22.5 13V23.5H9.5V8.5Z"
        stroke="white"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M17.5 8.5V13.5H22.5"
        stroke="white"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M12.5 17H19.5M12.5 20H17"
        stroke="#93C5FD"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
