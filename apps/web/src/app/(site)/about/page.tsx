import { ProsePage } from "@/components/site/prose-page";

export const metadata = { title: "About" };

export default function About() {
  return (
    <ProsePage title="About DigitsNepal AI" lead="Learn AI. Build Agents. Transform Nepal.">
      <p lang="ne"><strong>एआई सिकौँ। एआई एजेन्ट बनाऔँ। नेपाललाई डिजिटल बनाऔँ।</strong></p>
      <h2>Mission</h2>
      <p>Democratize AI education and practical digital innovation for Nepal through free bilingual learning, supervised AI tools, and an open community.</p>
      <h2>Status</h2>
      <p>DigitsNepal is a community initiative in its pilot stage. It is <strong>not</strong> a registered charity or tax-exempt organization, and we do not accept donations at this time.</p>
      <h2>Principles</h2>
      <ul>
        <li>Learning is free for individuals.</li>
        <li>AI drafts; people decide. Educators approve every published course.</li>
        <li>Answers cite their sources, and say when information is missing.</li>
        <li>We collect as little personal data as possible, especially about children.</li>
        <li>We report only verified numbers.</li>
      </ul>
    </ProsePage>
  );
}
