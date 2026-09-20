// Self-contained SVG hero graphic for the login/signup screens. Deliberately
// not a photo: no external asset pipeline, no next.config remote-image
// config needed, and it scales crisply at any size/density — the way a
// native app's launch-screen artwork would.
export function AuthIllustration({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 300"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="auth-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1F5F3F" />
          <stop offset="100%" stopColor="#14422B" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#auth-bg)" />

      {/* route line */}
      <path
        d="M40 220 C 120 220, 120 120, 200 120 S 300 60, 360 60"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="3"
        strokeDasharray="2 10"
        strokeLinecap="round"
        fill="none"
      />

      {/* pickup pin */}
      <circle cx="40" cy="220" r="7" fill="#fff" />
      <circle cx="40" cy="220" r="7" fill="none" stroke="#fff" strokeWidth="2" opacity="0.5">
        <animate attributeName="r" values="7;16;7" dur="2.4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.5;0;0.5" dur="2.4s" repeatCount="indefinite" />
      </circle>

      {/* drop-off pin */}
      <path
        d="M360 60c0 10-13 24-13 24s-13-14-13-24a13 13 0 1 1 26 0Z"
        fill="#fff"
      />
      <circle cx="347" cy="60" r="4.5" fill="#1F5F3F" />

      {/* vehicle mark riding the route */}
      <g transform="translate(178,96)">
        <rect x="0" y="10" width="34" height="18" rx="5" fill="#fff" />
        <rect x="22" y="4" width="16" height="14" rx="3" fill="#fff" />
        <circle cx="9" cy="30" r="5" fill="#14422B" />
        <circle cx="29" cy="30" r="5" fill="#14422B" />
      </g>

      {/* soft dot texture */}
      <circle cx="330" cy="210" r="2" fill="rgba(255,255,255,0.4)" />
      <circle cx="310" cy="230" r="2" fill="rgba(255,255,255,0.25)" />
      <circle cx="350" cy="180" r="2" fill="rgba(255,255,255,0.3)" />
      <circle cx="70" cy="90" r="2" fill="rgba(255,255,255,0.3)" />
      <circle cx="100" cy="60" r="2" fill="rgba(255,255,255,0.25)" />
    </svg>
  );
}
