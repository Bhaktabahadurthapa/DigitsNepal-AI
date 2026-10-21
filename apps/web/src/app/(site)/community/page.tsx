import { GITHUB_URL } from "@/components/site/footer";
import { ProsePage } from "@/components/site/prose-page";

export const metadata = { title: "Community" };

export default function Community() {
  return (
    <ProsePage title="Community & impact" lead="DigitsNepal grows through volunteers, educators and learners. We publish only verified impact data.">
      <h2>Ways to contribute</h2>
      <ul>
        <li><strong>Educators:</strong> build a course from your own materials and share it in the Academy.</li>
        <li><strong>Translators:</strong> review Nepali interface text and starter courses (currently machine-assisted and pending native review).</li>
        <li><strong>Developers:</strong> improve the platform, the evaluation suite, or an Agent Lab project.</li>
        <li><strong>Reviewers:</strong> fact-check starter courses and report problems with the Report button.</li>
      </ul>
      <h2 id="open-source">Open source</h2>
      <p>The platform code is intended to be published under an open-source licence. Repository: <a href={GITHUB_URL}>{GITHUB_URL.startsWith("http") ? GITHUB_URL : "to be announced"}</a>.</p>
      <h2>Impact reporting</h2>
      <p>We have no impact numbers yet. When the pilot starts we will report enrolments, completions and learner feedback, with the method used to count them.</p>
    </ProsePage>
  );
}
