type Module = {
  id: string;
  title: string;
  summary: string;
  lessons: { id: string; title: string; estimatedMinutes: number }[];
};

export function CourseRoadmap({ title, modules }: { title: string; modules: Module[] }) {
  const nodes = modules.length === 1
    ? modules[0].lessons.slice(0, 7).map((item) => ({ id: item.id, title: item.title, detail: `${item.estimatedMinutes} min` }))
    : modules.map((item) => ({ id: item.id, title: item.title, detail: `${item.lessons.length} lesson${item.lessons.length === 1 ? "" : "s"}` }));
  if (nodes.length < 2) return null;
  const width = Math.max(760, nodes.length * 196 + 56);
  const nodeWidth = 156;
  const gap = (width - 80 - nodeWidth * nodes.length) / (nodes.length - 1);
  const y = 64;
  return (
    <figure className="mt-10 border-y border-line py-8" aria-labelledby="course-map-heading">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="editorial-kicker text-sm">A guided path, not a content dump</p>
          <h2 id="course-map-heading" className="mt-1 text-xl font-semibold">Course roadmap</h2>
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Start → Finish</span>
      </div>
      <div className="overflow-x-auto pb-2">
        <svg viewBox={`0 0 ${width} 196`} style={{ minWidth: width }} className="h-auto w-full" role="img" aria-labelledby="course-map-title course-map-desc">
          <title id="course-map-title">{title} roadmap</title>
          <desc id="course-map-desc">A sequential roadmap of the modules or lessons in this course.</desc>
          <defs>
            <marker id="course-map-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#686760" /></marker>
            <marker id="course-map-arrow-accent" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#9a452c" /></marker>
            <marker id="course-map-arrow-link" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#4e6538" /></marker>
          </defs>
          <rect width="100%" height="100%" fill="#f7f6f2" />
          {nodes.slice(0, -1).map((node, index) => {
            const x = 40 + index * (nodeWidth + gap);
            const nextX = 40 + (index + 1) * (nodeWidth + gap);
            return <line key={`${node.id}-path`} x1={x + nodeWidth} y1={y + 44} x2={nextX - 10} y2={y + 44} stroke={index === nodes.length - 2 ? "#9a452c" : "#686760"} strokeWidth="1.5" markerEnd={index === nodes.length - 2 ? "url(#course-map-arrow-accent)" : "url(#course-map-arrow)"} />;
          })}
          {nodes.map((node, index) => {
            const x = 40 + index * (nodeWidth + gap);
            const focal = index === nodes.length - 1;
            const words = node.title.split(" ");
            const split = words.length > 3 ? Math.ceil(words.length / 2) : words.length;
            return (
              <g key={node.id}>
                <rect x={x} y={y} width={nodeWidth} height="88" rx="6" fill={focal ? "#f7e8e0" : "#fcfbf7"} stroke={focal ? "#9a452c" : "#9f9c92"} />
                <rect x={x + 10} y={y + 9} width="24" height="16" rx="2" fill={focal ? "#9a452c" : "#e7e4dc"} />
                <text x={x + 22} y={y + 20.5} textAnchor="middle" fontFamily="var(--font-sans-display), sans-serif" fontSize="8" fontWeight="700" fill={focal ? "#fff" : "#191918"}>{String(index + 1).padStart(2, "0")}</text>
                <text x={x + 12} y={y + 44} fontFamily="var(--font-sans-display), sans-serif" fontSize="11" fontWeight="650" fill="#191918">
                  <tspan x={x + 12}>{words.slice(0, split).join(" ").slice(0, 24)}</tspan>
                  {split < words.length && <tspan x={x + 12} dy="15">{words.slice(split).join(" ").slice(0, 24)}</tspan>}
                </text>
                <text x={x + 12} y={y + 76} fontFamily="ui-monospace, monospace" fontSize="8" letterSpacing=".08em" fill="#686760">{node.detail.toUpperCase()}</text>
              </g>
            );
          })}
          <line x1="40" y1="174" x2={width - 40} y2="174" stroke="#dcd9cf" />
          <text x="40" y="190" fontFamily="ui-monospace, monospace" fontSize="8" letterSpacing=".14em" fill="#686760">LEARNING SEQUENCE</text>
          <text x={width - 40} y="190" textAnchor="end" fontFamily="ui-monospace, monospace" fontSize="8" fill="#686760">{nodes.length} STAGES</text>
        </svg>
      </div>
    </figure>
  );
}
