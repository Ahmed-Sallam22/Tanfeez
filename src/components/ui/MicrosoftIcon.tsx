export function MicrosoftIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg 
      width="22" 
      height="21" 
      viewBox="0 0 22 21" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M10.5 1H1.5V10H10.5V1Z" fill="#F25022"/>
      <path d="M10.5 11H1.5V20H10.5V11Z" fill="#00A4EF"/>
      <path d="M20.5 1H11.5V10H20.5V1Z" fill="#7FBA00"/>
      <path d="M20.5 11H11.5V20H20.5V11Z" fill="#FFB900"/>
    </svg>
  );
}
