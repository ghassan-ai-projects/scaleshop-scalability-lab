const repositoryUrl = "https://github.com/ghassan-ai-projects/scaleshop-scalability-lab";
const authorUrl = "https://ghassan-alhamoud.com";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-identity">
          <span className="brand-mark footer-mark" aria-hidden="true">S</span>
          <div>
            <p className="eyebrow">Open source workshop</p>
            <strong>ScaleShop Scalability Lab</strong>
            <span>Practice evidence-led architecture decisions without risking production.</span>
          </div>
        </div>

        <div className="footer-attribution">
          <p>Designed and authored by <a href={authorUrl}>Ghassan Al Hamoud</a>.</p>
          <nav className="footer-links" aria-label="Project links">
            <a href={repositoryUrl}>Repository <span aria-hidden="true">↗</span></a>
            <a href={authorUrl}>Author website <span aria-hidden="true">↗</span></a>
          </nav>
          <small>MIT licensed · Built for engineering teams that learn by investigating.</small>
        </div>
      </div>
    </footer>
  );
}
