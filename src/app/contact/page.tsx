import InfoPage, { InfoSection } from "@/components/InfoPage";

export const metadata = {
  title: "Contact Us",
  description:
    "Contact JharResult for information queries, corrections, suggestions, copyright concerns and website-related inquiries.",
};

export default function ContactPage() {
  return (
    <InfoPage
      title="Contact Us"
      description="We love hearing from you."
    >
      <InfoSection title="Get in touch">
        <p>
          Please get in touch if you have any queries regarding information on
          <strong> JharResult</strong>. If you notice any factual errors, or
          have any suggestions regarding the site please get in touch.
        </p>
      </InfoSection>

      <InfoSection title="Queries">
        <ul>
          <li><strong>Incorrect or outdated information</strong></li>
          <li><strong>A broken official notification link</strong></li>
          <li><strong>Suggestions regarding content or usability of the site</strong></li>
          <li><strong>Inquiries regarding the site</strong></li>
          <li><strong>Copyright or content concerns</strong></li>
        </ul>
      </InfoSection>

      <InfoSection title="Email">
        <p>Please contact us via email:</p>
        <p>
          <strong>
            <a href="mailto:dindayal8456@gmail.com">dindayal8456@gmail.com</a>
          </strong>
        </p>
        <p>
          <strong>Website owner:</strong>{" "}
          <a href="mailto:dindayal8456@gmail.com">dindayal8456@gmail.com</a>
        </p>
      </InfoSection>

      <InfoSection title="Important">
        <p>
          <strong>JharResult is an independent information site.</strong>{" "}
          Please get in touch with the relevant official department/examination
          body regarding any issues with your application, exam dates, admit
          card, refund of fees and recruitment related concerns.
        </p>
      </InfoSection>
    </InfoPage>
  );
}