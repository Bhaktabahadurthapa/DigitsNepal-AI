import { ProsePage } from "@/components/site/prose-page";

export const metadata = { title: "Accessibility" };

export default function Accessibility() {
  return (
    <ProsePage title="Accessibility statement" updated="2026-10-21">
      <p>We aim to meet WCAG 2.2 level AA. This is a goal, not a certification.</p>
      <h2>What we do</h2>
      <ul>
        <li>Keyboard navigation, visible focus, and a “Skip to main content” link.</li>
        <li>Text and controls designed for at least 4.5:1 contrast, and touch targets of at least 44 pixels.</li>
        <li>Lessons are text-first; essential information never depends on video.</li>
        <li>Nepali text is marked with <code>lang=&quot;ne&quot;</code> so screen readers pronounce it correctly.</li>
        <li>Automated axe checks run in our end-to-end tests.</li>
      </ul>
      <h2>Known limitations</h2>
      <ul>
        <li>No manual screen-reader audit has been completed yet.</li>
        <li>Nepali screen-reader support depends on your device&apos;s voices.</li>
      </ul>
      <p>Please report barriers using the Report button or the contact page.</p>
    </ProsePage>
  );
}
