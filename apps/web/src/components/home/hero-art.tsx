/** Original illustration: Himalayan ridgeline built from a neural-network graph. Decorative. */
export function HeroArt() {
  const nodes = [
    [60, 250], [130, 170], [200, 210], [270, 110], [340, 180], [410, 90], [480, 160], [540, 230],
    [170, 280], [300, 260], [430, 270],
  ];
  const edges = [
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [1, 8], [2, 8], [3, 9], [4, 9], [5, 10], [6, 10], [8, 9], [9, 10],
  ];
  return (
    <svg viewBox="0 0 600 340" role="presentation" aria-hidden className="h-auto w-full">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#163452" />
          <stop offset="1" stopColor="#0D2338" />
        </linearGradient>
      </defs>
      <rect width="600" height="340" rx="24" fill="url(#sky)" />
      <path d="M0 300 L130 170 L200 210 L270 110 L340 180 L410 90 L480 160 L600 280 L600 340 L0 340 Z" fill="#0D9488" opacity="0.25" />
      <path d="M270 110 L292 140 L270 132 L250 142 Z M410 90 L432 120 L410 112 L390 122 Z" fill="#fff" opacity="0.85" />
      {edges.map(([a, b], i) => (
        <line key={i} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} stroke="#5eead4" strokeWidth="1.5" opacity="0.6" />
      ))}
      {nodes.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === 5 ? 9 : 6} fill={i === 5 ? "#DC2626" : "#F8FAFC"} stroke="#0D9488" strokeWidth="2" />
      ))}
      <g fontFamily="var(--font-devanagari), sans-serif" fill="#E2E8F0" fontSize="18" fontWeight="600">
        <text x="40" y="60">अ  आ  इ</text>
        <text x="470" y="60" fontFamily="var(--font-inter), sans-serif">A I</text>
      </g>
    </svg>
  );
}
