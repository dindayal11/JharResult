import type { Metadata, Viewport } from "next";
import "./globals.css";
import SiteFooter from "@/components/SiteFooter";

const siteUrl = "https://jharresult.in";
const siteName = "JharResult";
const siteDescription =
  "Jhar Result (JharResult) brings Jharkhand government job notifications, JAC and JSSC results, admit cards, answer keys, admissions and scholarships in one place.";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#173f68",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Jhar Result (JharResult) – Jharkhand Jobs & Results",
    template: "%s | JharResult",
  },
  description: siteDescription,
  applicationName: siteName,
  verification: {
    google: "PxlkVYCLEJp4mkNLHtivxzgPZxHr7yamxHfvAH08jaE",
  },
  keywords: [
    "Jhar Result",
    "JharResult",
    "Jhar Result Jharkhand",
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
    title: "Jhar Result (JharResult) – Jharkhand Jobs & Results",
    description: siteDescription,
  },
  twitter: {
    card: "summary",
    title: "Jhar Result (JharResult) – Jharkhand Jobs & Results",
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
                alternateName: ["Jhar Result"],
                url: "https://jharresult.in/",
                description: siteDescription,
                email: "dindayal8456@gmail.com",
                sameAs: ["https://t.me/+_hj11IZ9nktjOWM1", "https://whatsapp.com/channel/0029VbEFu6NJuyAHGXVzvS0n"],
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
                alternateName: ["Jhar Result"],
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
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
              const register = () => {
                const modelContext = navigator.modelContext;
                if (!modelContext || typeof modelContext.registerTool !== "function") return;
                if (window.__jharResultAgentToolRegistered) return;
                window.__jharResultAgentToolRegistered = true;
                modelContext.registerTool({
                  name: "search_jharresult_updates",
                  description: "Search publicly published Jharkhand jobs, results, admit cards, answer keys, admissions and education updates on JharResult.",
                  inputSchema: {
                    type: "object",
                    properties: { query: { type: "string", description: "Words or phrase to search for." } },
                    required: ["query"],
                    additionalProperties: false
                  },
                  execute: async ({ query }) => {
                    const term = String(query || "").trim().slice(0, 100);
                    if (term.length < 2) return { error: "Enter at least two characters." };
                    const response = await fetch("/api/agent-search?q=" + encodeURIComponent(term), {
                      headers: { "Accept": "application/json" }
                    });
                    if (!response.ok) throw new Error("JharResult search is temporarily unavailable.");
                    return await response.json();
                  }
                });
              };
              if (document.readyState === "loading") {
                document.addEventListener("DOMContentLoaded", register, { once: true });
              } else {
                register();
              }
            })();`
          }}
        />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
