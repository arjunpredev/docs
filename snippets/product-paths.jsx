export const ProductPaths = () => (
  <div className="pd-visual not-prose pd-products" aria-label="Choose a pre.dev product">
    <section className="pd-product pd-product-featured">
      <div className="pd-product-copy">
        <span className="pd-product-kind">Coding Agent</span>
        <h2>Build and maintain software</h2>
        <p>Build a new app or work on an existing codebase. Plan, implement, and inspect the result in the web workspace or your terminal.</p>
        <div className="pd-links">
          <a href="/coding-agent/quickstart">Start in the web</a>
          <a href="/cli/overview">Install the CLI</a>
        </div>
      </div>
      <div className="pd-product-artifact" aria-label="Coding Agent workflow">
        <dl className="pd-product-details">
          <div><dt>Plan</dt><dd>Shape requirements and architecture.</dd></div>
          <div><dt>Build</dt><dd>Implement changes in your project.</dd></div>
          <div><dt>Review</dt><dd>Inspect code, checks, and previews.</dd></div>
        </dl>
      </div>
    </section>
    <section className="pd-product">
      <div className="pd-product-copy">
        <span className="pd-product-kind">Architect API</span>
        <h2>Generate a specification</h2>
        <p>Generate specifications your team and coding agents can use, with structured stories and architecture.</p>
        <div className="pd-links"><a href="/architect-agent/quickstart">Generate a specification</a></div>
      </div>
      <div className="pd-product-artifact" aria-label="Architect API outputs">
        <dl className="pd-product-details">
          <div><dt>Plans</dt><dd>Milestones, stories, and acceptance criteria.</dd></div>
          <div><dt>Formats</dt><dd>Markdown, structured JSON, and available graphs.</dd></div>
        </dl>
      </div>
    </section>
    <section className="pd-product">
      <div className="pd-product-copy">
        <span className="pd-product-kind">Browser Agents</span>
        <h2>Automate browser tasks</h2>
        <p>Read a page, extract structured data, or complete a workflow. Retrieve each task’s outcome and evidence.</p>
        <div className="pd-links"><a href="/browser-agents/quickstart">Run a browser task</a></div>
      </div>
      <div className="pd-product-artifact" aria-label="Browser Agents capabilities">
        <dl className="pd-product-details">
          <div><dt>Tasks</dt><dd>Extract data, navigate pages, and complete workflows.</dd></div>
          <div><dt>Results</dt><dd>Structured output, task status, and available timelines.</dd></div>
        </dl>
      </div>
    </section>
  </div>
);
