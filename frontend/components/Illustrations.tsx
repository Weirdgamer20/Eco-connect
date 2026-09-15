/**
 * Civic 2D SVG Illustration set for EcoConnect.
 * Clean flat line art — civic world aesthetic.
 * No copyrighted characters, no glassmorphism, no 3D.
 */

interface IllustrationProps {
  className?: string;
  width?: number;
  height?: number;
}

/** Home screen hero — civic scene with buildings and green trees */
export function HomeIllustration({ width = 320, height = 200, className }: IllustrationProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 320 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      role="img"
    >
      {/* Sky */}
      <rect width="320" height="200" rx="16" fill="#EAF1F6" />
      {/* Sun */}
      <circle cx="270" cy="50" r="28" fill="#F4D03F" opacity="0.6" />
      {/* Cloud 1 */}
      <ellipse cx="80" cy="40" rx="35" ry="15" fill="white" opacity="0.8" />
      <ellipse cx="55" cy="45" rx="22" ry="14" fill="white" opacity="0.8" />
      <ellipse cx="100" cy="45" rx="22" ry="12" fill="white" opacity="0.8" />
      {/* Cloud 2 */}
      <ellipse cx="230" cy="30" rx="28" ry="12" fill="white" opacity="0.6" />
      <ellipse cx="210" cy="35" rx="18" ry="11" fill="white" opacity="0.6" />
      {/* Ground */}
      <rect x="0" y="148" width="320" height="52" rx="0" fill="#5D806A" opacity="0.25" />
      {/* Road */}
      <rect x="100" y="152" width="120" height="48" fill="#8B8D8B" opacity="0.3" />
      <rect x="155" y="155" width="10" height="8" rx="1" fill="white" opacity="0.6" />
      <rect x="155" y="168" width="10" height="8" rx="1" fill="white" opacity="0.6" />
      {/* Building 1 - Government blue */}
      <rect x="30" y="80" width="70" height="90" rx="4" fill="#315A78" />
      <rect x="40" y="70" width="50" height="14" rx="2" fill="#264B65" />
      {/* Windows bldg 1 */}
      <rect x="40" y="92" width="16" height="12" rx="2" fill="#EAF1F6" opacity="0.7" />
      <rect x="62" y="92" width="16" height="12" rx="2" fill="#EAF1F6" opacity="0.7" />
      <rect x="40" y="112" width="16" height="12" rx="2" fill="#EAF1F6" opacity="0.7" />
      <rect x="62" y="112" width="16" height="12" rx="2" fill="#EAF1F6" opacity="0.7" />
      <rect x="40" y="132" width="16" height="12" rx="2" fill="#EAF1F6" opacity="0.5" />
      <rect x="62" y="132" width="16" height="12" rx="2" fill="#EAF1F6" opacity="0.8" />
      {/* Door */}
      <rect x="55" y="158" width="20" height="12" rx="2" fill="#EAF1F6" opacity="0.6" />
      {/* Building 2 - Taller */}
      <rect x="220" y="60" width="80" height="110" rx="4" fill="#4A7A9B" />
      <rect x="225" y="50" width="70" height="14" rx="2" fill="#315A78" />
      {/* Windows bldg 2 */}
      {[0, 1, 2, 3].map(row => (
        [0, 1, 2].map(col => (
          <rect
            key={`w2-${row}-${col}`}
            x={232 + col * 22}
            y={70 + row * 20}
            width={14}
            height={12}
            rx={2}
            fill="#EAF1F6"
            opacity={0.6 + Math.random() * 0.3}
          />
        ))
      ))}
      {/* Trees */}
      {/* Tree 1 */}
      <rect x="118" y="140" width="8" height="30" rx="2" fill="#7A6B52" />
      <ellipse cx="122" cy="126" rx="20" ry="22" fill="#5D806A" />
      <ellipse cx="122" cy="118" rx="14" ry="16" fill="#7DA08C" />
      {/* Tree 2 */}
      <rect x="180" y="145" width="6" height="25" rx="2" fill="#7A6B52" />
      <ellipse cx="183" cy="132" rx="16" ry="18" fill="#5D806A" />
      <ellipse cx="183" cy="124" rx="11" ry="13" fill="#7DA08C" />
      {/* Person walking */}
      <circle cx="155" cy="152" r="8" fill="#315A78" />
      <line x1="155" y1="160" x2="155" y2="175" stroke="#315A78" strokeWidth="3" strokeLinecap="round" />
      <line x1="155" y1="165" x2="148" y2="173" stroke="#315A78" strokeWidth="2" strokeLinecap="round" />
      <line x1="155" y1="165" x2="162" y2="173" stroke="#315A78" strokeWidth="2" strokeLinecap="round" />
      {/* EcoConnect marker */}
      <circle cx="155" cy="105" r="16" fill="#5D806A" />
      <circle cx="155" cy="105" r="10" fill="white" opacity="0.9" />
      <text x="155" y="109" textAnchor="middle" fontSize="10" fill="#5D806A" fontWeight="bold">🌿</text>
    </svg>
  );
}

/** Empty state — no issues found */
export function EmptyIssuesIllustration({ width = 200, height = 160, className }: IllustrationProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="200" height="160" rx="16" fill="#ECEDEA" />
      <circle cx="100" cy="70" r="40" fill="#D7DBD8" />
      <circle cx="100" cy="70" r="28" fill="#F4F5F2" />
      <text x="100" y="78" textAnchor="middle" fontSize="24">✓</text>
      <text x="100" y="125" textAnchor="middle" fontSize="12" fill="#68706C" fontFamily="Inter, sans-serif">
        All clear!
      </text>
    </svg>
  );
}

/** Report success illustration */
export function ReportSuccessIllustration({ width = 220, height = 180, className }: IllustrationProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 220 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="220" height="180" rx="16" fill="#EBF2EE" />
      {/* Check circle */}
      <circle cx="110" cy="80" r="50" fill="#5D806A" opacity="0.15" />
      <circle cx="110" cy="80" r="38" fill="#5D806A" />
      {/* Check mark */}
      <path d="M92 80 L105 93 L128 66" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Confetti */}
      <rect x="40" y="30" width="8" height="8" rx="2" fill="#B8873D" transform="rotate(20 40 30)" />
      <rect x="170" y="25" width="6" height="6" rx="1" fill="#315A78" transform="rotate(-15 170 25)" />
      <rect x="60" y="140" width="7" height="7" rx="2" fill="#A84F4F" transform="rotate(10 60 140)" />
      <rect x="155" y="145" width="8" height="5" rx="1" fill="#5D806A" transform="rotate(-20 155 145)" />
      <circle cx="35" cy="90" r="5" fill="#B8873D" opacity="0.6" />
      <circle cx="180" cy="100" r="4" fill="#315A78" opacity="0.6" />
      {/* Text */}
      <text x="110" y="145" textAnchor="middle" fontSize="13" fill="#5D806A" fontFamily="Inter, sans-serif" fontWeight="600">
        Report Submitted!
      </text>
    </svg>
  );
}

/** Error state illustration */
export function ErrorIllustration({ width = 200, height = 160, className }: IllustrationProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="200" height="160" rx="16" fill="#F9EDED" />
      <circle cx="100" cy="70" r="40" fill="#A84F4F" opacity="0.15" />
      <circle cx="100" cy="70" r="28" fill="#A84F4F" />
      <text x="100" y="79" textAnchor="middle" fontSize="22" fill="white">!</text>
      <text x="100" y="125" textAnchor="middle" fontSize="12" fill="#A84F4F" fontFamily="Inter, sans-serif" fontWeight="500">
        Something went wrong
      </text>
    </svg>
  );
}
