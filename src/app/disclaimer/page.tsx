import InfoPage, { InfoSection } from "@/components/InfoPage";

export const metadata = {
  title: "Disclaimer",
  description:
    "Read the JharResult disclaimer about independent information, official notifications, accuracy and external links.",
};

export default function DisclaimerPage() {
  return (
    <InfoPage
      title="Disclaimer"
      description=""
    >
      <InfoSection title="1. Independent Website">
        <p>
          This is an <strong>independent website</strong> and not owned, run,
          sponsored or affiliated to the Government of India, Government of
          Jharkhand or any government department, recruitment board,
          university or exam authority.
        </p>
      </InfoSection>

      <InfoSection title="2. Informational Content">
        <p>
          All the information provided on this website is for
          <strong> informational purposes only</strong>. We provide updates
          regarding government jobs, recruitment, results, admit cards,
          answer key, admissions and scholarships.
        </p>
        <p>
          All the content should not be considered as any official government
          notification. The content provided cannot make any guarantees
          regarding your <strong>eligibility, selection or admission</strong>.
        </p>
      </InfoSection>

      <InfoSection title="3. Check Official Notification">
        <p>
          Always visit the <strong>official website</strong> and read the
          original notification for:
        </p>
        <ul>
          <li>Applying for the vacancy</li>
          <li>Paying any examination or application fee</li>
          <li>Checking your eligibility and age criteria</li>
          <li>Exam dates and deadlines</li>
          <li>Decisions regarding recruitment/admission</li>
        </ul>
      </InfoSection>

      <InfoSection title="4. Errors and Changes">
        <p>
          We endeavour to provide accurate and up to date information.
          However, there may be <strong>inaccuracies, omissions and delays</strong>.
          The recruitment authorities and educational institutions may make
          last minute changes to their schedule, eligibility, vacancies and
          more.
        </p>
      </InfoSection>

      <InfoSection title="5. Hyperlinks">
        <p>
          Some pages contain links to official portals and third party
          websites. These are provided for ease of access and we cannot
          control the <strong>content, availability or service</strong>{" "}
          provided by them.
        </p>
      </InfoSection>

      <InfoSection title="6. No Guarantees">
        <p>
          We cannot guarantee you will receive a <strong>job, exam result,
          selection, admission, scholarship</strong> or any other outcome.
          All decisions are made by the relevant official authorities.
        </p>
      </InfoSection>

      <InfoSection title="7. Incorrect Information/Links">
        <p>
          If you have found incorrect information or a broken link please
          let us know using our <strong>Contact Us</strong> page so we can
          look into it.
        </p>
      </InfoSection>
    </InfoPage>
  );
}