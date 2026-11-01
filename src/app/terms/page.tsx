import InfoPage, { InfoSection } from "@/components/InfoPage";

export const metadata = {
  title: "Terms & Conditions",
  description:
    "Read the terms and conditions for using the JharResult website.",
};

export default function TermsPage() {
  return (
    <InfoPage
      title="Terms & Conditions"
      description="Please read these terms before using JharResult."
    >
      <p>
        By accessing or using JharResult, you agree to follow these Terms
        and Conditions. If you do not agree with these terms, please
        discontinue using the website.
      </p>

      <InfoSection title="1. Purpose of the Website">
        <p>
          JharResult provides informational updates about jobs, recruitment,
          results, admit cards, answer keys, admissions, scholarships and
          other education-related announcements.
        </p>
        <p>
          The website is intended to help readers find relevant information.
          It does not conduct recruitment, examinations or admissions.
        </p>
      </InfoSection>

      <InfoSection title="2. Accuracy of Information">
        <p>
          We make reasonable efforts to publish useful and accurate
          information. However, notifications, dates, eligibility
          conditions, fees and other details may change.
        </p>
        <p>
          Users must verify all important details through the official
          notification or concerned authority before taking action.
        </p>
      </InfoSection>

      <InfoSection title="3. User Responsibilities">
        <p>While using this website, you agree not to:</p>
        <ul>
          <li>Use the website for unlawful activities.</li>
          <li>Attempt to damage, disrupt or gain unauthorised access to the website.</li>
          <li>Upload malicious code or harmful content.</li>
          <li>Copy or republish website content in a misleading manner.</li>
          <li>Misuse the website or interfere with other users.</li>
        </ul>
      </InfoSection>

      <InfoSection title="4. External Websites">
        <p>
          JharResult may provide links to third-party and official websites.
          These links are provided for convenience. We do not control or
          guarantee the content, availability, accuracy or policies of
          external websites.
        </p>
      </InfoSection>

      <InfoSection title="5. Intellectual Property">
        <p>
          Website design, original text, branding and other original
          materials published by JharResult may be protected by applicable
          intellectual property laws.
        </p>
        <p>
          Government notices, logos and documents may belong to their
          respective departments or owners. Their appearance on this
          website does not imply ownership or affiliation.
        </p>
      </InfoSection>

      <InfoSection title="6. Limitation of Liability">
        <p>
          JharResult is provided for general informational purposes. We
          shall not be responsible for losses arising from reliance on
          information published on the website, errors in third-party
          information, changes made by official authorities or temporary
          website interruptions, to the extent permitted by applicable law.
        </p>
      </InfoSection>

      <InfoSection title="7. Changes to These Terms">
        <p>
          We may revise these Terms and Conditions from time to time.
          Changes will be published on this page. Continued use of the
          website after changes are published means you accept the revised
          terms.
        </p>
      </InfoSection>

      <InfoSection title="8. Contact">
        <p>
          If you have questions about these terms, please visit our
          Contact Us page.
        </p>
      </InfoSection>
    </InfoPage>
  );
}