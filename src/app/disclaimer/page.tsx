import InfoPage, { InfoSection } from "@/components/InfoPage";

export const metadata = {
  title: "Disclaimer",
  description:
    "Read the JharResult disclaimer regarding government jobs, results, admit cards and educational information.",
};

export default function DisclaimerPage() {
  return (
    <InfoPage
      title="Disclaimer"
      description="Important information about the content and services provided by JharResult."
    >
      <InfoSection title="1. No Government Affiliation">
        <p>
          JharResult is an independent informational website. It is not
          owned, operated, sponsored or officially affiliated with the
          Government of India, Government of Jharkhand, or any government
          department, recruitment board, university or examination
          authority.
        </p>
      </InfoSection>

      <InfoSection title="2. Information Purpose Only">
        <p>
          The information published on JharResult is provided for general
          informational and educational purposes. We share updates related
          to government jobs, recruitment, results, admit cards, answer
          keys, admissions and scholarships.
        </p>
        <p>
          Our content should not be treated as an official government
          notification or a guarantee of eligibility, selection or
          admission.
        </p>
      </InfoSection>

      <InfoSection title="3. Verify Official Notifications">
        <p>
          Readers should always visit the official website and carefully
          read the original notification before:
        </p>
        <ul>
          <li>Submitting an application.</li>
          <li>Paying an examination or application fee.</li>
          <li>Checking eligibility and age requirements.</li>
          <li>Following examination dates or deadlines.</li>
          <li>Making decisions related to recruitment or admission.</li>
        </ul>
      </InfoSection>

      <InfoSection title="4. Accuracy and Updates">
        <p>
          We try to keep published information useful and up to date.
          However, information may contain errors, omissions or delays.
          Recruitment authorities and educational institutions may change
          their schedules, eligibility conditions, vacancies and other
          details without notice to us.
        </p>
      </InfoSection>

      <InfoSection title="5. External Links">
        <p>
          Some pages may link to official portals and third-party websites.
          We provide these links for convenience and do not control their
          content, availability or services.
        </p>
      </InfoSection>

      <InfoSection title="6. No Guarantee">
        <p>
          JharResult does not guarantee a job, examination result, selection,
          admission, scholarship or any other outcome. Final decisions are
          made by the respective official authorities.
        </p>
      </InfoSection>

      <InfoSection title="7. Contact and Corrections">
        <p>
          If you find incorrect information or a broken link, please inform
          us through our Contact Us page so that we can review it.
        </p>
      </InfoSection>
    </InfoPage>
  );
}