const footerLinks = [
  {
    title: "Important Links",
    links: [
      { name: "Latest Jobs", href: "/category/latest-jobs" },
      { name: "Admit Cards", href: "/category/admit-card" },
      { name: "Results", href: "/category/results" },
      { name: "Answer Keys", href: "/category/answer-key" },
      { name: "Admissions", href: "/category/admissions" },
    ],
  },
  
  {
    title: "Useful Information",
    links: [
      { name: "About Us", href: "/about" },
      { name: "Contact Us", href: "/contact" },
      { name: "Privacy Policy", href: "/privacy-policy" },
      { name: "Terms & Conditions", href: "/terms" },
      { name: "Disclaimer", href: "/disclaimer" },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-main">
          <div className="footer-about">
            <a href="/" className="footer-logo">
              Jhar<span>Result</span>
            </a>

            <p>
              JharResult is an information portal providing updates about
              Jharkhand government jobs, exam results, admit cards,
              admissions, answer keys and scholarships.
            </p>

            <p>
              Always check the official notification before applying
              or making any decision.
            </p>
          </div>

          {footerLinks.map((group) => (
            <div className="footer-column" key={group.title}>
              <h3>{group.title}</h3>

              <ul>
                {group.links.map((link) => (
                  <li key={link.name}>
                    <a href={link.href}>{link.name}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()} JharResult. All Rights Reserved.
          </p>

          <p>
            JharResult is not affiliated with any government department.
          </p>
        </div>
      </div>
    </footer>
  );
}