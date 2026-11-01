import InfoPage, { InfoSection } from "@/components/InfoPage";

export const metadata = {
  title: "Privacy Policy",
  description:
    "Read the JharResult Privacy Policy and understand how website information and user data are handled.",
};

export default function PrivacyPolicyPage() {
  return (
    <InfoPage
      title="Privacy Policy"
      description="This page explains our approach to privacy and information."
    >
      <p>
        Your privacy is important to us. This Privacy Policy explains what
        information may be collected when you visit JharResult and how that
        information may be used.
      </p>

      <InfoSection title="1. Information We Collect">
        <p>
          When you visit the website, certain technical information may be
          collected automatically by the hosting server or service providers.
          This may include browser type, device information, IP address,
          pages visited and access time.
        </p>
        <p>
          If you contact us by email, we may receive your email address and
          the information you choose to include in your message.
        </p>
      </InfoSection>

      <InfoSection title="2. How We Use Information">
        <p>Information may be used to:</p>
        <ul>
          <li>Maintain and operate the website.</li>
          <li>Improve website performance and user experience.</li>
          <li>Respond to questions and correction requests.</li>
          <li>Protect the website against spam, misuse and security threats.</li>
          <li>Understand general website traffic and usage.</li>
        </ul>
      </InfoSection>

      <InfoSection title="3. Cookies">
        <p>
          JharResult or its service providers may use cookies or similar
          technologies for website functionality, preferences, analytics or
          advertising, where enabled.
        </p>
        <p>
          You can manage or disable cookies through your browser settings.
          Some website features may not work as expected if cookies are
          disabled.
        </p>
      </InfoSection>

      <InfoSection title="4. Third-Party Services and Links">
        <p>
          Our website may contain links to official government websites,
          examination portals, advertisers and other third-party services.
          Those websites have their own privacy policies and practices.
          We are not responsible for their content or privacy practices.
        </p>
      </InfoSection>

      <InfoSection title="5. Advertising">
        <p>
          If advertising services such as Google AdSense are used, those
          services may use cookies or similar technologies to display,
          measure or personalise advertisements, subject to their own
          policies and applicable settings.
        </p>
      </InfoSection>

      <InfoSection title="6. Data Security">
        <p>
          We take reasonable steps to protect information handled through
          the website. However, no method of transmission or electronic
          storage can be guaranteed to be completely secure.
        </p>
      </InfoSection>

      <InfoSection title="7. Children's Privacy">
        <p>
          JharResult is an informational website and is not intended to
          knowingly collect personal information from children through
          dedicated child accounts.
        </p>
      </InfoSection>

      <InfoSection title="8. Changes to This Policy">
        <p>
          We may update this Privacy Policy when website features, services
          or legal requirements change. Updated information will be
          published on this page.
        </p>
      </InfoSection>

      <InfoSection title="9. Contact">
        <p>
          For privacy-related questions, contact us using the details on
          our Contact Us page.
        </p>
      </InfoSection>
    </InfoPage>
  );
}