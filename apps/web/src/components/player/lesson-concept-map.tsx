type Props = {
  lessonId: string;
  title: string;
  objectives: string[];
  language: "en" | "ne";
};

function shortLabel(value: string, max = 38) {
  const clean = value.replace(/[.:;]+$/, "").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trim()}…` : clean;
}

export function LessonConceptMap({ lessonId, title, objectives, language }: Props) {
  const points = objectives.slice(0, 3);
  if (points.length === 0) return null;
  const slug = `concept-${lessonId}`;
  const nodeWidth = 216;
  const gap = 32;
  const totalWidth = points.length * nodeWidth + (points.length - 1) * gap;
  const startX = (840 - totalWidth) / 2;
  const mainX = 300;
  const mainWidth = 240;
  const simple = language === "ne"
    ? `सरल भाषामा: यस पाठले ${points.map((item) => shortLabel(item, 54)).join("; ")} सिकाउँछ।`
    : `In simple words: this lesson helps you ${points.map((item) => shortLabel(item, 54).replace(/^./, (c) => c.toLowerCase())).join("; ")}.`;

  return (
    <aside className="mt-6 rounded-md border border-line bg-surface p-5 sm:p-6" aria-labelledby={`${slug}-heading`}>
      <p className="editorial-kicker text-sm">{language === "ne" ? "अवधारणा सजिलो बनाऔँ" : "Make the concept simple"}</p>
      <h2 id={`${slug}-heading`} className="mt-1 text-xl font-semibold">{language === "ne" ? "यो विषय कसरी बुझ्ने" : "How this idea fits together"}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{simple}</p>
      <div className="mt-5 overflow-x-auto pb-2">
        <svg viewBox="0 0 840 300" style={{ minWidth: 760 }} className="h-auto w-full" role="img" aria-labelledby={`${slug}-title ${slug}-desc`}>
          <title id={`${slug}-title`}>{title} concept map</title>
          <desc id={`${slug}-desc`}>The lesson topic branches into its key learning points and then leads to practical understanding.</desc>
          <defs>
            <marker id={`${slug}-arrow`} markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#686760" /></marker>
            <marker id={`${slug}-accent`} markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#9a452c" /></marker>
            <marker id={`${slug}-link`} markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#4e6538" /></marker>
          </defs>
          <rect width="840" height="300" fill="#fcfbf7" />
          {points.map((point, index) => {
            const targetX = startX + index * (nodeWidth + gap) + nodeWidth / 2;
            const sourceX = mainX + (mainWidth * (index + 1)) / (points.length + 1);
            const corridorY = 110 + index * 8;
            return <path key={`${point}-line`} d={`M ${sourceX} 88 V ${corridorY} H ${targetX} V 154`} fill="none" stroke={index === 0 ? "#9a452c" : "#686760"} strokeWidth="1.4" markerEnd={index === 0 ? `url(#${slug}-accent)` : `url(#${slug}-arrow)`} />;
          })}
          <rect x={mainX} y="24" width={mainWidth} height="64" rx="6" fill="#f7e8e0" stroke="#9a452c" />
          <text x="420" y="42" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="8" letterSpacing=".14em" fill="#843820">MAIN IDEA</text>
          <text x="420" y="67" textAnchor="middle" fontFamily="var(--font-sans-display), var(--font-devanagari), sans-serif" fontSize="14" fontWeight="650" fill="#191918">{shortLabel(title, 31)}</text>
          {points.map((point, index) => {
            const x = startX + index * (nodeWidth + gap);
            const words = shortLabel(point, 54).split(" ");
            const split = words.length > 5 ? Math.ceil(words.length / 2) : words.length;
            return (
              <g key={point}>
                <rect x={x} y="154" width={nodeWidth} height="82" rx="6" fill="#f7f6f2" stroke="#9f9c92" />
                <rect x={x + 12} y="166" width="28" height="16" rx="2" fill={index === 0 ? "#9a452c" : "#e4e7dc"} />
                <text x={x + 26} y="177.5" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="8" fontWeight="700" fill={index === 0 ? "#fff" : "#3d4a33"}>{String(index + 1).padStart(2, "0")}</text>
                <text x={x + 12} y="200" fontFamily="var(--font-sans-display), var(--font-devanagari), sans-serif" fontSize="11" fontWeight="600" fill="#191918">
                  <tspan x={x + 12}>{words.slice(0, split).join(" ")}</tspan>
                  {split < words.length ? <tspan x={x + 12} dy="16">{words.slice(split).join(" ")}</tspan> : null}
                </text>
              </g>
            );
          })}
          <line x1="40" y1="266" x2="800" y2="266" stroke="#dcd9cf" />
          <text x="40" y="286" fontFamily="ui-monospace, monospace" fontSize="8" letterSpacing=".14em" fill="#686760">CONCEPT → KEY IDEAS → PRACTICE</text>
        </svg>
      </div>
    </aside>
  );
}
