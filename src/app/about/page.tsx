import InfoPage, { InfoSection } from "@/components/InfoPage";

export const metadata = {
  title: "About Us",
  description:
    "Learn about JharResult, an information portal for Jharkhand jobs, results, admit cards and education updates.",
};

export default function AboutPage() {
  return (
    <InfoPage
      title="About Us"
      description="Know more about JharResult and the information we provide."
    >
      <InfoSection title="Welcome to JharResult">
        <p>
          JharResult is an independent information portal focused on
          Jharkhand government jobs, recruitment notifications, examination
          results, admit cards, answer keys, admissions and educational
          updates.
        </p>
        <p>
          Our aim is to make important education and career-related
          information easier to find and understand, especially for students
          and job seekers in Jharkhand.
        </p>
      </InfoSection>

      <InfoSection title="What We Publish">
        <ul>
          <li>Jharkhand government and other recruitment updates.</li>
          <li>Admit card and examination-related announcements.</li>
          <li>Board, university and recruitment examination results.</li>
          <li>Answer keys, syllabuses and previous question papers.</li>
          <li>Admission, scholarship and education-related information.</li>
        </ul>
      </InfoSection>

      <InfoSection title="Our Approach">
        <p>
          We aim to present information in a clear and organised format.
          Wherever possible, we provide links to official notifications and
          websites so that readers can verify the original information.
        </p>
        <p>
          Readers should always check the official notice before submitting
          an application, paying a fee or making an important decision.
        </p>
      </InfoSection>

      <InfoSection title="Independent Information Portal">
        <p>
          JharResult is an independent informational website. It is not a
          government website and is not affiliated with any government
          department, recruitment board, university or examination authority.
        </p>
      </InfoSection>
    </InfoPage>
  );
}