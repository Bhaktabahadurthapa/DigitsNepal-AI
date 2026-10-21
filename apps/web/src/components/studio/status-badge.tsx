import { Badge } from "@/components/ui/feedback";

const map = {
  draft: { tone: "neutral", label: "Draft" },
  generating: { tone: "amber", label: "Generating" },
  in_review: { tone: "teal", label: "In review" },
  published: { tone: "green", label: "Published" },
  archived: { tone: "red", label: "Archived" },
} as const;

export function CourseStatusBadge({ status }: { status: keyof typeof map }) {
  const m = map[status];
  return <Badge tone={m.tone}>{m.label}</Badge>;
}
