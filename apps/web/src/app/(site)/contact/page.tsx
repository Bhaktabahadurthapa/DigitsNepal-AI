import { ProsePage } from "@/components/site/prose-page";

export const metadata = { title: "Contact" };

export default function Contact() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  return (
    <ProsePage title="Contact">
      {email ? <p>Email us at <a href={`mailto:${email}`}>{email}</a>.</p> : <p>A public contact address has not been configured yet. Signed-in users can send feedback with the Report button on any course page.</p>}
      <p>For security issues, please follow the responsible disclosure steps in the repository&apos;s SECURITY.md.</p>
    </ProsePage>
  );
}
