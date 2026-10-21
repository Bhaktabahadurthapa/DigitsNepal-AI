import { ProsePage } from "@/components/site/prose-page";

export const metadata = { title: "Privacy" };

export default function Privacy() {
  return (
    <ProsePage title="Privacy notice (draft)" lead="This draft describes how the software handles data. It has not been reviewed by a lawyer and must be finalized before public launch." updated="2026-10-21">
      <h2>What we collect</h2>
      <ul>
        <li>Account: name, email, password hash, optional “under 18” flag.</li>
        <li>Learning records: enrolments, lessons completed, quiz answers and scores.</li>
        <li>AI Tutor: your questions and the answers, used to show your history and improve quality.</li>
        <li>Educator uploads: documents you upload, stored privately.</li>
        <li>Security logs: sign-in events and administrative actions.</li>
      </ul>
      <h2>What we do not do</h2>
      <ul>
        <li>We do not sell data or show advertising.</li>
        <li>We do not publish learners&apos; identities or personal learning records.</li>
        <li>Educators see learner names and progress in their own courses, not contact details.</li>
      </ul>
      <h2>AI providers</h2>
      <p>When an external AI model is enabled, the relevant course passages and your question are sent to that provider to produce an answer. Your name and email are not sent.</p>
      <h2>Children</h2>
      <p>Learners under 18 cannot use AI features until consent from a guardian or educator has been recorded.</p>
      <h2>Retention and deletion</h2>
      <p>Uploaded source documents are retained for a configurable period (default 365 days) and can be deleted by their owner at any time.</p>
    </ProsePage>
  );
}
