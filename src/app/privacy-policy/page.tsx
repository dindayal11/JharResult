import InfoPage, { InfoSection } from "@/components/InfoPage";

export const metadata = {
  title: "Privacy Policy",
  description:
    "Read the JharResult Privacy Policy to understand what information may be collected and how it may be used.",
};

export default function PrivacyPolicyPage() {
  return (
    <InfoPage
      title="Privacy Policy"
      description=""
    >
      <InfoSection title="Introduction">
        <p>
          We value your <strong>privacy</strong>. This Privacy Policy describes
          what information we may collect about you when you visit the
          <strong> JharResult website</strong>.
        </p>
      </InfoSection>

      <InfoSection title="Information Collected">
        <p>
          When visiting the site some technical information may be
          automatically recorded by our hosting server and/or service
          providers. This information may include your <strong>web browser
          type, device information, IP Address, Web Pages viewed and time of
          access</strong>.
        </p>
        <p>
          If you contact us via email, we may collect your <strong>email
          address</strong> and any information you wish to include in your
          message.
        </p>
      </InfoSection>

      <InfoSection title="Use of Information">
        <p>The information may be used to:</p>
        <ul>
          <li>Ensure the proper functioning of the website</li>
          <li>Improve our website</li>
          <li>Answer your questions and make corrections.</li>
          <li>Prevent spam, abuse and potential security issues with the website.</li>
          <li>Gain a general understanding of how our website is being used.</li>
        </ul>
      </InfoSection>

      <InfoSection title="Cookies">
        <p>
          JharResult or our service providers may use <strong>cookies or
          similar technology</strong> to ensure our website functions
          correctly, to understand your preferences, to analyse our website
          or for advertising purposes.
        </p>
        <p>
          You can adjust or turn off cookies through your browser settings.
          If you choose to turn cookies off some features may not function
          as expected.
        </p>
      </InfoSection>

      <InfoSection title="Links to other websites">
        <p>
          Our website may contain links to official government sites,
          examination sites, advertisers and other third party services.
          These websites will have their own privacy policies in place.
          We cannot be held responsible for the content or privacy of these
          sites.
        </p>
      </InfoSection>

      <InfoSection title="Advertising">
        <p>
          If we are using advertising services such as <strong>Google
          AdSense</strong>, they may use cookies or similar technology to
          show adverts, analyse them or personalise them.
        </p>
      </InfoSection>

      <InfoSection title="Data Protection">
        <p>
          We make every effort to ensure your information is safe however
          there is no guarantee that information transmitted or stored
          electronically can be <strong>100% secure</strong>.
        </p>
      </InfoSection>

      <InfoSection title="Children's Privacy">
        <p>
          JharResult is an information website and is not intended to
          knowingly collect personal information from children through
          specific child accounts.
        </p>
      </InfoSection>

      <InfoSection title="Policy Updates">
        <p>
          We reserve the right to update this Privacy Policy. We will
          publish any new information on this page.
        </p>
      </InfoSection>

      <InfoSection title="Contact Us">
        <p>
          If you have any questions regarding our privacy policy please
          contact us using the details on our <strong>Contact Us</strong>{" "}
          page.
        </p>
      </InfoSection>
    </InfoPage>
  );
}