"use client";

type Category = { name: string; slug: string };

export default function ResponsiveNav({ primary, more }: { primary: Category[]; more: Category[] }) {
  return (
    <>
      <nav className="desktop-nav" aria-label="Main navigation">
        <a href="/">Home</a>
        <a href="/quiz" className="quiz-nav-link">Quiz</a>
        {primary.map((c) => <a key={c.slug} href={`/category/${c.slug}`}>{c.name}</a>)}
        {more.length > 0 && (
          <details className="nav-more">
            <summary>More ▾</summary>
            <div className="nav-dropdown">
              {more.map((c) => <a key={c.slug} href={`/category/${c.slug}`}>{c.name}</a>)}
            </div>
          </details>
        )}
      </nav>

      <details className="mobile-nav">
        <summary className="mobile-menu-button" aria-label="Open navigation menu">
          <span aria-hidden="true">☰</span>
          <span className="mobile-nav-title">Jharkhand Latest Jobs, Results &amp; Education Updates</span>
        </summary>
        <div className="mobile-menu-panel">
          <a href="/">Home</a>
          <a href="/quiz" className="quiz-mobile-link">Quiz</a>
          {primary.map((c) => <a key={c.slug} href={`/category/${c.slug}`}>{c.name}</a>)}
          {more.length > 0 && (
            <details className="mobile-more-details">
              <summary>More Categories</summary>
              {more.map((c) => <a className="mobile-sub-link" key={c.slug} href={`/category/${c.slug}`}>{c.name}</a>)}
            </details>
          )}
        </div>
      </details>

      <style jsx>{`
        .desktop-nav{display:flex;align-items:center;flex-wrap:wrap;gap:0;margin-top:16px;background:#173f68}
        .desktop-nav>a,.desktop-nav :global(.nav-more>summary){display:block;padding:12px 15px;color:#fff;font-size:14px;font-weight:700;text-decoration:none;cursor:pointer;list-style:none}
        .desktop-nav>a:hover,.desktop-nav>a.quiz-nav-link{background:#f28c28;color:#fff}
        .desktop-nav :global(.nav-more){position:relative}
        .desktop-nav :global(.nav-dropdown){position:absolute;top:100%;right:0;min-width:190px;z-index:100;background:#fff;box-shadow:0 5px 15px #0002;border:1px solid #e2e8f0}
        .desktop-nav :global(.nav-dropdown a){display:block;padding:11px 14px;color:#173f68;text-decoration:none;border-bottom:1px solid #edf0f4;font-size:14px}
        .desktop-nav :global(.nav-dropdown a:hover){background:#f1f5f9}
        .mobile-nav{display:none}
        @media(max-width:900px){
          .desktop-nav{display:none}
          .mobile-nav{display:block;margin-top:14px;position:relative}
          .mobile-nav>summary{display:flex;align-items:center;gap:12px;list-style:none;cursor:pointer}
          .mobile-nav>summary::-webkit-details-marker{display:none}
          .mobile-menu-button{width:100%;min-height:44px;padding:0;border:0;background:transparent;color:inherit;text-align:left}
          .mobile-menu-button>span:first-child{display:flex;align-items:center;justify-content:center;flex:0 0 44px;height:42px;border-radius:4px;background:#173f68;color:#fff;font-size:22px}
          .mobile-nav-title{margin:0;color:#17365d;font-size:clamp(15px,4.1vw,20px);line-height:1.2;font-weight:700}
          .mobile-menu-panel{display:flex;flex-direction:column;margin-top:7px;border:1px solid #dce3eb;background:#fff;box-shadow:0 5px 14px #0002;max-height:70vh;overflow-y:auto}
          .mobile-menu-panel>a,.mobile-more-details>summary{display:block;width:100%;padding:12px 15px;border:0;border-bottom:1px solid #edf0f4;background:#fff;color:#173f68;text-align:left;text-decoration:none;font-size:14px;font-weight:600;cursor:pointer;list-style:none}
          .mobile-menu-panel>a.quiz-mobile-link{background:#fff2e4;color:#9a4d00;font-weight:800}
          .mobile-menu-panel>a:hover,.mobile-more-details>summary:hover{background:#f1f5f9}
          .mobile-menu-panel .mobile-sub-link{padding-left:30px;background:#f8fafc;font-weight:500}
        }
      `}</style>
    </>
  );
}
