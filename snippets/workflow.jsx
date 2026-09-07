export const Workflow = ({ label, steps, note }) => (
  <figure className="pd-visual not-prose" aria-label={label}>
    <ol className="pd-workflow">
      {steps.map((step, index) => (
        <li key={step.title}>
          <span className="pd-step-number" aria-hidden="true">{index + 1}</span>
          <strong className="pd-figure-title">{step.title}</strong>
          <p>{step.description}</p>
        </li>
      ))}
    </ol>
    {note && <p className="pd-workflow-note">{note}</p>}
  </figure>
);

export const SessionBranches = () => (
  <figure className="pd-visual not-prose pd-panel pd-branches" aria-label="Two sessions branch from shared code, are reviewed independently, and then merge">
    <div className="pd-branch-origin"><span className="pd-branch-dot" aria-hidden="true" />Shared project code</div>
    <ul className="pd-branch-lanes">
      <li>
        <code>session / invoice-export</code>
        <strong className="pd-figure-title">Build the CSV export</strong>
        <p>Own conversation, branch, and changes.</p>
        <span className="pd-chip">Review diff and checks</span>
      </li>
      <li>
        <code>session / regression-tests</code>
        <strong className="pd-figure-title">Cover invoice permissions</strong>
        <p>Independent work from the same starting point.</p>
        <span className="pd-chip">Review diff and checks</span>
      </li>
    </ul>
    <div className="pd-branch-origin"><span className="pd-branch-dot" aria-hidden="true" />Merge reviewed changes</div>
    <figcaption>Resolve overlapping edits during integration. Promoting a session to Main does not merge its code.</figcaption>
  </figure>
);

export const ConnectionScope = () => (
  <figure className="pd-visual not-prose pd-panel" aria-label="A project uses a pinned provider account or its workspace default">
    <div className="pd-bar"><strong>Project → personal or team workspace</strong><span>Account selection</span></div>
    <div className="pd-scope">
      <div><span className="pd-chip">No account pinned</span><strong className="pd-figure-title">Use the workspace default</strong><p>The project follows the default account for this provider in its own workspace.</p></div>
      <div><span className="pd-chip" data-tone="active">Account pinned</span><strong className="pd-figure-title">Use the selected account</strong><p>An explicit project selection takes precedence over the workspace default.</p></div>
    </div>
    <div className="pd-state-help">In either case, connect or reauthorize the account if the connection is missing or expired.</div>
  </figure>
);
