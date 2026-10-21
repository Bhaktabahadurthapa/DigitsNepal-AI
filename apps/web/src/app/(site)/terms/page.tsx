import { ProsePage } from "@/components/site/prose-page";

export const metadata = { title: "Terms" };

export default function Terms() {
  return (
    <ProsePage title="Terms of use (draft)" lead="Draft terms for the pilot. Not yet reviewed by a lawyer." updated="2026-10-21">
      <ul>
        <li>Use DigitsNepal for lawful educational purposes.</li>
        <li>Only upload material you have the right to use. You keep ownership of your uploads.</li>
        <li>AI output can be wrong. Educators are responsible for reviewing content they publish.</li>
        <li>Do not attempt to access other users&apos; or organizations&apos; data, or to misuse the AI features.</li>
        <li>Fair-use limits apply to AI features so the free pilot stays sustainable.</li>
        <li>We may remove content that is harmful, infringing or misleading.</li>
      </ul>
    </ProsePage>
  );
}
