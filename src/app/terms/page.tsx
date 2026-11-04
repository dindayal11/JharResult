import InfoPage, { InfoSection } from "@/components/InfoPage";

export const metadata = {
  title: "Terms & Conditions",
  description:
    "Read the Terms & Conditions for using the JharResult website.",
};

export default function TermsPage() {
  return (
    <InfoPage
      title="Terms & Conditions"
      description=""
    >
      <p>
        By using <strong>JharResult</strong> you agree to be bound by these
        terms and conditions. If you do not agree to these terms, please stop
        using this website.
      </p>

      <InfoSection title="1. About this Website">
        <p>
          This website contains informative updates about jobs, recruitment,
          results, admit cards, answer keys, admissions, scholarships &amp;
          other educational news.
        </p>
        <p>
          This website is for <strong>informing the readers</strong>, and does
          not perform any recruitment, exams or admissions.
        </p>
      </InfoSection>

      <InfoSection title="2. Information Accuracy">
        <p>
          We try to provide useful and accurate information. However, there
          may be changes to notifications, dates, eligibility, fees etc.
        </p>
        <p>
          You should always confirm key information from the
          <strong> official notification and concerned authority</strong>.
        </p>
      </InfoSection>

      <InfoSection title="3. User Agreement">
        <p>By using this website you agree:</p>
        <ul>
          <li>Not to use the website for any illegal activity.</li>
          <li>To not try to harm, disrupt or gain access to the website.</li>
          <li>To not upload any malicious code or harmful content.</li>
          <li>To not copy or publish content from the website in a misleading way.</li>
          <li>To not misuse the website or interfere with other users.</li>
        </ul>
      </InfoSection>

      <InfoSection title="4. Links">
        <p>
          We may provide links to third party and official websites. These
          links are provided for your convenience however we can not be held
          responsible for the content, availability, accuracy or policies of
          external websites.
        </p>
      </InfoSection>

      <InfoSection title="5. Copyright">
        <p>
          The design, original content, brand and other original content
          published on this website may be protected by copyright laws.
        </p>
        <p>
          Government notices, logos &amp; documents may belong to the relevant
          department/owners. This does not mean they are owned by us.
        </p>
      </InfoSection>

      <InfoSection title="6. Limitations of Liability">
        <p>
          This website is provided for general information only. We shall not
          be liable for any loss that may occur due to relying on information
          provided on this website, errors in third party information,
          changes made by official authorities or any temporary issues with
          the website. To the maximum extent permitted by applicable law.
        </p>
      </InfoSection>

      <InfoSection title="7. Amendments">
        <p>
          We reserve the right to amend these terms and conditions. Any
          amendments will be posted on this page. By continuing to use this
          website you agree to the amended terms.
        </p>
      </InfoSection>

      <InfoSection title="8. Contact">
        <p>
          If you have any questions regarding these terms please visit our
          <strong> Contact Us</strong> page.
        </p>
      </InfoSection>
    </InfoPage>
  );
}