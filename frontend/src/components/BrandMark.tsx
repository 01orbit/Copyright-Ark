type BrandMarkProps = {
  className?: string;
};

export default function BrandMark({ className = "size-9" }: BrandMarkProps) {
  return (
    <span
      className={`grid place-items-center rounded-xl bg-foreground text-white shadow-sm ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 32 32" className="size-[68%]" fill="none">
        <circle
          cx="16"
          cy="16"
          r="10.5"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path
          d="M20.7 12.3a5.7 5.7 0 1 0 0 7.4M20.7 16h4.4"
          stroke="#9abcf6"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="7.1" cy="7.1" r="1.2" fill="#9abcf6" />
      </svg>
    </span>
  );
}
