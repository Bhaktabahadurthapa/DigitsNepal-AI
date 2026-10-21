import { Code2 } from "lucide-react";
import { GITHUB_URL } from "@/components/site/footer";
import { Badge } from "@/components/ui/feedback";

export const metadata = { title: "Agent Lab" };

const projects = [
  {
    name: "Nepali AI Learning Assistant",
    goal: "A bilingual tutor that answers only from approved course material and cites its sources.",
    prereq: "Introduction to AI; basic Python",
    status: "In this repository",
    detail: "The DigitsNepal AI Tutor itself is the reference implementation (services/ai). Evaluation results are published in docs/evaluation.md.",
    tone: "green" as const,
  },
  { name: "NGO Report Agent", goal: "Turn project records into a report draft that a human reviews and approves before export.", prereq: "AI agents course (coming soon)", status: "Planned", detail: "Design only. No code yet.", tone: "amber" as const },
  { name: "AI Teacher Assistant", goal: "Help teachers draft lesson plans and practice questions from the national curriculum.", prereq: "Prompt engineering", status: "Planned", detail: "Design only. No code yet.", tone: "amber" as const },
  { name: "Community Knowledge Agent", goal: "Answer community questions from local, approved documents (e.g. ward notices) in Nepali.", prereq: "Retrieval basics", status: "Planned", detail: "Design only. No code yet.", tone: "amber" as const },
];

export default function AgentLabPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-bold text-navy sm:text-4xl">Agent Lab</h1>
      <p className="mt-3 max-w-3xl text-lg text-muted">Open-source, project-based AI agent education. Projects are listed with their real status: only what exists is marked as available.</p>
      <section className="mt-10" aria-labelledby="arch">
        <h2 id="arch" className="text-xl font-semibold">How a supervised learning agent works</h2>
        <svg viewBox="0 0 760 160" role="img" aria-labelledby="arch-desc" className="mt-4 w-full rounded-xl border border-line bg-surface p-4">
          <title id="arch-desc">Learner question flows to retrieval over approved sources, then to a language model with safety rules, then to an answer with citations, which a human can review.</title>
          {[["Learner question", 20], ["Retrieve approved sources", 200], ["Model + safety rules", 390], ["Answer with citations", 570]].map(([label, x]) => (
            <g key={label as string}>
              <rect x={x as number} y={50} width={160} height={60} rx={10} fill="#F0FDFA" stroke="#0D9488" />
              <text x={(x as number) + 80} y={85} textAnchor="middle" fontSize="13" fill="#0F172A">{label}</text>
            </g>
          ))}
          {[180, 360, 550].map((x) => <path key={x} d={`M${x} 80 h18`} stroke="#0D2338" strokeWidth="2" markerEnd="url(#a)" />)}
          <defs><marker id="a" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#0D2338" /></marker></defs>
          <text x={650} y={140} textAnchor="middle" fontSize="12" fill="#64748B">Human review for consequential outputs</text>
        </svg>
      </section>
      <section className="mt-10" aria-labelledby="dir">
        <h2 id="dir" className="text-xl font-semibold">Project directory</h2>
        <ul className="mt-4 grid gap-4 md:grid-cols-2">
          {projects.map((p) => (
            <li key={p.name} className="rounded-xl border border-line bg-surface p-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold">{p.name}</h3>
                <Badge tone={p.tone}>{p.status}</Badge>
              </div>
              <p className="mt-2 text-sm">{p.goal}</p>
              <p className="mt-2 text-xs text-muted">Prerequisites: {p.prereq}</p>
              <p className="mt-1 text-xs text-muted">{p.detail}</p>
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-10 rounded-xl border border-line bg-surface p-6" aria-labelledby="contrib">
        <h2 id="contrib" className="text-xl font-semibold">Contribute</h2>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">
          <li>Read the architecture and safety rules in the repository docs.</li>
          <li>Pick a planned project and open a design proposal issue before writing code.</li>
          <li>Every agent must use approved sources, cite them, and keep a human approval step for consequential actions.</li>
          <li>Include evaluation cases in English and Nepali with your pull request.</li>
        </ol>
        <a href={GITHUB_URL} className="mt-4 inline-flex items-center gap-2 font-semibold text-teal-700 underline"><Code2 className="size-4" aria-hidden /> Source code</a>
      </section>
    </div>
  );
}
