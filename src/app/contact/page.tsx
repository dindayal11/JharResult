import InfoPage, { InfoSection } from "@/components/InfoPage";

export const metadata = {
  title: "Contact Us",
  description:
    "Contact JharResult for feedback, corrections, suggestions and website-related queries.",
};

export default function ContactPage() {
  return (
    <InfoPage
      title="Contact Us"
      description="We welcome your feedback, suggestions and correction requests."
    >
      <InfoSection title="Get in Touch">
        <p>
          If you have a question about the information published on
          JharResult, notice a factual error, or want to share a suggestion
          about the website, you can contact our team.
        </p>
      </InfoSection>

      <InfoSection title="For These Queries">
        <ul>
          <li>Report incorrect or outdated information.</li>
          <li>Report a broken official notification link.</li>
          <li>Share suggestions about website content or usability.</li>
          <li>Ask questions about website-related matters.</li>
          <li>Report a copyright or content concern.</li>
        </ul>
      </InfoSection>

      <InfoSection title="Email">
        <p>
          For contact, please email us at:
        </p>

        <p>
          <strong style={{ color: "#173f70" }}>
            dindayal8456@gmail.com
          </strong>
        </p>

        <p style={{ color: "#64748b", fontSize: 13 }}>
          Website owner: dindayal8456@gmail.com
        </p>
      </InfoSection>

      <InfoSection title="Important Note">
        <p>
          JharResult is an independent information portal. For application
          status, examination schedules, admit card issues, fee refunds or
          recruitment-related grievances, please contact the concerned
          official department or examination authority directly.
        </p>
      </InfoSection>
    </InfoPage>
  );
}