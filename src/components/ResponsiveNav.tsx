
"use client";

import { useState } from "react";

type Category = {
  name: string;
  slug: string;
};

export default function ResponsiveNav({
  primary,
  more,
}: {
  primary: Category[];
  more: Category[];
}) {
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <nav className="desktop-nav">
        <a href="/">Home</a>
        {primary.map((c) => (
          <a key={c.slug} href={`/category/${c.slug}`}>
            {c.name}
          </a>
        ))}
        {more.length > 0 && (
          <details className="nav-more">
            <summary>More ▾</summary>
            <div className="nav-dropdown">
              {more.map((c) => (
                <a key={c.slug} href={`/category/${c.slug}`}>
                  {c.name}
                </a>
              ))}
            </div>
          </details>
        )}
      </nav>

      <div className="mobile-nav">
        <button
          type="button"
          className="mobile-menu-button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        >
          <span>{open ? "✕" : "☰"}</span>
          <span>{open ? "Close" : "Menu"}</span>
        </button>

        {open && (
          <div className="mobile-menu-panel">
            <a href="/" onClick={() => setOpen(false)}>Home</a>

            {primary.map((c) => (
              <a
                key={c.slug}
                href={`/category/${c.slug}`}
                onClick={() => setOpen(false)}
              >
                {c.name}
              </a>
            ))}

            {more.length > 0 && (
              <>
                <button
                  type="button"
                  className="mobile-more-button"
                  onClick={() => setMoreOpen(!moreOpen)}
                >
                  More Categories {moreOpen ? "−" : "+"}
                </button>

                {moreOpen &&
                  more.map((c) => (
                    <a
                      className="mobile-sub-link"
                      key={c.slug}
                      href={`/category/${c.slug}`}
                      onClick={() => setOpen(false)}
                    >
                      {c.name}
                    </a>
                  ))}
              </>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .desktop-nav {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0;
          margin-top: 16px;
          background: #173f68;
        }

        .desktop-nav > a,
        .desktop-nav :global(.nav-more > summary) {
          display: block;
          padding: 12px 15px;
          color: white;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
        }

        .desktop-nav > a:hover,
        .desktop-nav :global(.nav-more > summary:hover) {
          background: #245783;
        }

        .desktop-nav :global(.nav-more) {
          position: relative;
        }

        .desktop-nav :global(.nav-dropdown) {
          position: absolute;
          top: 100%;
          right: 0;
          min-width: 190px;
          z-index: 100;
          background: white;
          box-shadow: 0 5px 15px #0002;
          border: 1px solid #e2e8f0;
        }

        .desktop-nav :global(.nav-dropdown a) {
          display: block;
          padding: 11px 14px;
          color: #173f68;
          text-decoration: none;
          border-bottom: 1px solid #edf0f4;
          font-size: 14px;
        }

        .desktop-nav :global(.nav-dropdown a:hover) {
          background: #f1f5f9;
        }

        .mobile-nav {
          display: none;
        }

        @media (max-width: 900px) {
          .desktop-nav {
            display: none;
          }

          .mobile-nav {
            display: block;
            margin-top: 14px;
            position: relative;
          }

          .mobile-menu-button {
            display: flex;
            align-items: center;
            gap: 9px;
            padding: 11px 16px;
            border: 0;
            border-radius: 4px;
            background: #173f68;
            color: white;
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
          }

          .mobile-menu-panel {
            display: flex;
            flex-direction: column;
            margin-top: 7px;
            border: 1px solid #dce3eb;
            background: white;
            box-shadow: 0 5px 14px #0002;
            max-height: 70vh;
            overflow-y: auto;
          }

          .mobile-menu-panel a,
          .mobile-more-button {
            display: block;
            width: 100%;
            padding: 12px 15px;
            border: 0;
            border-bottom: 1px solid #edf0f4;
            background: white;
            color: #173f68;
            text-align: left;
            text-decoration: none;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
          }

          .mobile-menu-panel a:hover,
          .mobile-more-button:hover {
            background: #f1f5f9;
          }

          .mobile-menu-panel .mobile-sub-link {
            padding-left: 30px;
            background: #f8fafc;
            font-weight: 500;
          }
        }
      `}</style>
    </>
  );
}
