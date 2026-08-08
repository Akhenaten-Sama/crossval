export function DocumentListSkeleton() {
  return (
    <section className="panel content-panel">
      <div className="section-heading">
        <div className="skeleton-block skeleton-title" />
        <div className="skeleton-block skeleton-button" />
      </div>
      <div className="skeleton-table">
        {Array.from({ length: 6 }).map((_, index) => (
            <div className="skeleton-row document-list-skeleton-row" key={index}>
              <div className="skeleton-block" />
              <div className="skeleton-block" />
              <div className="skeleton-block" />
              <div className="skeleton-block" />
              <div className="skeleton-block" />
              <div className="skeleton-block" />
            </div>
        ))}
      </div>
    </section>
  );
}

export function DocumentDetailSkeleton() {
  return (
    <>
      <header className="page-header">
        <div className="skeleton-stack">
          <div className="skeleton-block skeleton-eyebrow" />
          <div className="skeleton-block skeleton-heading" />
          <div className="skeleton-block skeleton-copy" />
        </div>
        <div className="header-actions">
          <div className="skeleton-block skeleton-button" />
          <div className="skeleton-block skeleton-button" />
          <div className="skeleton-block skeleton-button" />
        </div>
      </header>

      <div className="document-workspace">
        <section className="panel document-overview-panel">
          <div className="overview-header">
            <div className="skeleton-stack">
              <div className="skeleton-block skeleton-title" />
              <div className="skeleton-block skeleton-copy" />
            </div>
            <div className="skeleton-block skeleton-pill" />
          </div>
          <div className="totals">
            {Array.from({ length: 4 }).map((_, index) => (
              <div className="total-box skeleton-card" key={index}>
                <div className="skeleton-block skeleton-label" />
                <div className="skeleton-block skeleton-value" />
              </div>
            ))}
          </div>
          <div className="document-facts">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index}>
                <div className="skeleton-block skeleton-label" />
                <div className="skeleton-block skeleton-copy short" />
              </div>
            ))}
          </div>
        </section>

        <section className="panel metadata-panel">
          <div className="section-heading">
            <div className="skeleton-stack">
              <div className="skeleton-block skeleton-title" />
              <div className="skeleton-block skeleton-copy" />
            </div>
            <div className="skeleton-block skeleton-button" />
          </div>
          <div className="field-row">
            {Array.from({ length: 3 }).map((_, index) => (
              <div className="skeleton-field" key={index}>
                <div className="skeleton-block skeleton-label" />
                <div className="skeleton-block skeleton-input" />
              </div>
            ))}
          </div>
        </section>

        <section className="panel content-panel line-items-panel">
          <div className="section-heading">
            <div className="skeleton-stack">
              <div className="skeleton-block skeleton-title" />
              <div className="skeleton-block skeleton-copy" />
            </div>
            <div className="skeleton-block skeleton-button" />
          </div>
          <div className="skeleton-table attached">
            {Array.from({ length: 5 }).map((_, index) => (
              <div className="skeleton-row" key={index}>
                {Array.from({ length: 7 }).map((__, cellIndex) => (
                  <div className="skeleton-block" key={cellIndex} />
                ))}
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
