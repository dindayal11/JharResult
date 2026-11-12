import InfoPage, { InfoSection } from "@/components/InfoPage";

export const metadata = {
  alternates: { canonical: "/about" },
  title: "About Us",
  description:
    "JharResult is an independent information portal providing information about Jharkhand government jobs, recruitment notifications, results and educational updates.",
};

export default function AboutPage() {
  return (
    <InfoPage
      title="About Us"
      description="Know more about JharResult, also searched as Jhar Result, and the Jharkhand information we provide."
    >
      <InfoSection title="Welcome to JharResult">
        <p>
          <strong>JharResult</strong> is an independent information portal
          also known as Jhar Result, is an independent information portal providing information regarding government jobs in Jharkhand along
          with recruitment notifications, results, admit cards, answer keys,
          admissions and educational news.
        </p>
        <p>
          We strive to simplify the search for important information related
          to <strong>education and careers</strong>.
        </p>
      </InfoSection>

      <InfoSection title="Information we provide">
        <ul>
          <li><strong>Government / Other Recruitment Notifications</strong></li>
          <li><strong>Admit Card Announcements.</strong></li>
          <li><strong>Board / University / Recruitment Examination Results.</strong></li>
          <li><strong>Answer Keys / Syllabus / Previous Papers.</strong></li>
          <li><strong>Admissions / Scholarships / Educational News.</strong></li>
        </ul>
      </InfoSection>

      <InfoSection title="How we do it">
        <p>
          We aim to deliver information in a <strong>clear and concise</strong>{" "}
          manner. Where possible we provide direct links to official
          notifications / sites.
        </p>
        <p>
          You should always refer to the <strong>official notice</strong>{" "}
          before applying, paying fees or making any important decisions.
        </p>
      </InfoSection>

      <InfoSection title="Independent Informational Website">
        <p>
          This is an <strong>independent information source</strong>. We are
          <strong> not a government site</strong> and have no affiliation with
          any Government Departments, Recruitment Boards, Universities or
          Examining Bodies.
        </p>
      </InfoSection>
    </InfoPage>
  );
}