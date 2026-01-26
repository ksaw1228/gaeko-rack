export default function GeckoLogo({ size = 40, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 몸통 */}
      <ellipse cx="50" cy="55" rx="25" ry="30" fill="#7DD3A0" />

      {/* 배 */}
      <ellipse cx="50" cy="60" rx="15" ry="18" fill="#B8F0D0" />

      {/* 머리 */}
      <ellipse cx="50" cy="25" rx="20" ry="18" fill="#7DD3A0" />

      {/* 볼터치 왼쪽 */}
      <circle cx="35" cy="28" r="5" fill="#FFB8C9" opacity="0.7" />

      {/* 볼터치 오른쪽 */}
      <circle cx="65" cy="28" r="5" fill="#FFB8C9" opacity="0.7" />

      {/* 눈 왼쪽 */}
      <ellipse cx="42" cy="22" rx="6" ry="7" fill="white" />
      <circle cx="43" cy="23" r="4" fill="#2D3748" />
      <circle cx="44" cy="21" r="1.5" fill="white" />

      {/* 눈 오른쪽 */}
      <ellipse cx="58" cy="22" rx="6" ry="7" fill="white" />
      <circle cx="57" cy="23" r="4" fill="#2D3748" />
      <circle cx="58" cy="21" r="1.5" fill="white" />

      {/* 입 (미소) */}
      <path
        d="M 44 32 Q 50 37 56 32"
        stroke="#2D3748"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      {/* 크레스트 (머리 장식) */}
      <path
        d="M 35 12 Q 40 5 50 10 Q 60 5 65 12"
        stroke="#5EBD8A"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />

      {/* 앞발 왼쪽 */}
      <ellipse cx="28" cy="50" rx="8" ry="5" fill="#7DD3A0" transform="rotate(-30 28 50)" />
      <circle cx="22" cy="48" r="2" fill="#5EBD8A" />
      <circle cx="20" cy="51" r="2" fill="#5EBD8A" />
      <circle cx="21" cy="54" r="2" fill="#5EBD8A" />

      {/* 앞발 오른쪽 */}
      <ellipse cx="72" cy="50" rx="8" ry="5" fill="#7DD3A0" transform="rotate(30 72 50)" />
      <circle cx="78" cy="48" r="2" fill="#5EBD8A" />
      <circle cx="80" cy="51" r="2" fill="#5EBD8A" />
      <circle cx="79" cy="54" r="2" fill="#5EBD8A" />

      {/* 뒷발 왼쪽 */}
      <ellipse cx="30" cy="75" rx="7" ry="5" fill="#7DD3A0" transform="rotate(-20 30 75)" />
      <circle cx="24" cy="74" r="2" fill="#5EBD8A" />
      <circle cx="23" cy="77" r="2" fill="#5EBD8A" />
      <circle cx="25" cy="80" r="2" fill="#5EBD8A" />

      {/* 뒷발 오른쪽 */}
      <ellipse cx="70" cy="75" rx="7" ry="5" fill="#7DD3A0" transform="rotate(20 70 75)" />
      <circle cx="76" cy="74" r="2" fill="#5EBD8A" />
      <circle cx="77" cy="77" r="2" fill="#5EBD8A" />
      <circle cx="75" cy="80" r="2" fill="#5EBD8A" />

      {/* 꼬리 */}
      <path
        d="M 50 85 Q 55 95 65 92 Q 75 90 78 95"
        stroke="#7DD3A0"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
