import type { Metadata, Viewport } from "next";
import "./globals.css";
import SiteFooter from "@/components/SiteFooter";

const siteUrl = "https://jharresult.in";
const siteName = "JharResult";
const siteDescription =
  "Jharkhand government job notifications, JAC and JSSC results, admit cards, answer keys, admissions and scholarships in one place.";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#173f68",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "JharResult – Jharkhand Jobs, Results & Admit Cards",
    template: "%s | JharResult",
  },
  description: siteDescription,
  applicationName: siteName,
  verification: {
    google: "PxlkVYCLEJp4mkNLHtivxzgPZxHr7yamxHfvAH08jaE",
  },
  keywords: [
    "Jharkhand government jobs",
    "Jharkhand latest jobs",
    "JAC result",
    "JSSC recruitment",
    "JPSC vacancy",
    "Jharkhand admit card",
    "Jharkhand answer key",
    "Jharkhand scholarship",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName,
    title: "JharResult – Jharkhand Jobs, Results & Admit Cards",
    description: siteDescription,
  },
  twitter: {
    card: "summary",
    title: "JharResult – Jharkhand Jobs, Results & Admit Cards",
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                "@id": "https://jharresult.in/#organization",
                name: "JharResult",
                url: "https://jharresult.in/",
                description: siteDescription,
                email: "dindayal8456@gmail.com",
                sameAs: ["https://t.me/+_hj11IZ9nktjOWM1"],
                contactPoint: [{
                  "@type": "ContactPoint",
                  contactType: "customer support",
                  email: "dindayal8456@gmail.com",
                  availableLanguage: ["English", "Hindi"]
                }]
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                "@id": "https://jharresult.in/#website",
                name: "JharResult",
                url: "https://jharresult.in/",
                publisher: { "@id": "https://jharresult.in/#organization" },
                inLanguage: "en-IN",
                potentialAction: {
                  "@type": "SearchAction",
                  target: {
                    "@type": "EntryPoint",
                    urlTemplate: "https://jharresult.in/search?q={search_term_string}"
                  },
                  "query-input": "required name=search_term_string"
                }
              },
              {
                "@context": "https://schema.org",
                "@type": "WebPage",
                "@id": "https://jharresult.in/#webpage",
                url: "https://jharresult.in/",
                name: "JharResult – Jharkhand Jobs, Results & Admit Cards",
                description: siteDescription,
                isPartOf: { "@id": "https://jharresult.in/#website" },
                about: { "@id": "https://jharresult.in/#organization" },
                inLanguage: "en-IN"
              }
            ]).replace(/</g, "\\u003c"),
          }}
        />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
