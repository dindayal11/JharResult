import SiteHeader from "@/components/SiteHeader";
import type { ReactNode } from "react";

export default function InfoPage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <>
      <SiteHeader />

      <main className="container" style={{ paddingTop: 24, paddingBottom: 35 }}>
        <div
          style={{
            background: "#173f70",
            color: "#fff",
            padding: "25px 22px",
            borderTop: "4px solid #e87920",
            borderRadius: 7,
            marginBottom: 22,
          }}
        >
          <h1 style={{ margin: "0 0 8px", fontSize: 27 }}>{title}</h1>
          <p style={{ margin: 0, color: "#e2eaf3", lineHeight: 1.6 }}>
            {description}
          </p>
        </div>

        <article
          style={{
            background: "#fff",
            border: "1px solid #dce3ec",
            borderRadius: 7,
            padding: "24px",
            color: "#253247",
            lineHeight: 1.8,
            fontSize: 15,
          }}
        >
          {children}
        </article>
      </main>
    </>
  );
}

export function InfoSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section style={{ marginBottom: 25 }}>
      <h2
        style={{
          color: "#173f70",
          fontSize: 19,
          borderBottom: "2px solid #e87920",
          paddingBottom: 7,
          marginBottom: 10,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}