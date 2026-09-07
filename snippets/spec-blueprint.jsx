export const SpecBlueprint = () => {
  const [deep, setDeep] = useState(false);
  return (
    <figure className="pd-visual not-prose" aria-label="Example specification structure and output formats">
      <div className="pd-panel">
        <div className="pd-bar"><strong>A plan you can read and build from</strong><span>Illustrative structure</span></div>
        <div className="pd-state-controls" role="group" aria-label="Compare specification depth">
          <button type="button" className="pd-state-button" aria-pressed={!deep} aria-controls="spec-blueprint-document" onClick={() => setDeep(false)}>Fast Spec</button>
          <button type="button" className="pd-state-button" aria-pressed={deep} aria-controls="spec-blueprint-document" onClick={() => setDeep(true)}>Deep Spec</button>
        </div>
        <div className="pd-blueprint">
          <div className="pd-blueprint-document" id="spec-blueprint-document" aria-live="polite" aria-atomic="true">
            <span className="pd-chip" data-tone="active">{deep ? "With implementation subtasks" : "Milestones and stories"}</span>
            <strong className="pd-figure-title">Team issue tracker</strong>
            <ul className="pd-blueprint-tree">
              <li><span>Goal</span><strong>Keep a small team’s work visible</strong></li>
              <li><span>Architecture</span><strong>Web app, API, and project data</strong></li>
              <li>
                <span>Milestone</span><strong>A working issue board</strong>
                <ul>
                  <li><span>User story</span><strong>Filter issues by assignee</strong></li>
                  <li><span>Acceptance criteria</span><strong>Only matching issues appear; an empty view explains why.</strong></li>
                  {deep && <li className="pd-subtasks"><span>Subtasks</span><strong>Add the filter control.<br />Apply the assignee predicate.<br />Check matching and empty states.</strong></li>}
                </ul>
              </li>
            </ul>
          </div>
          <div className="pd-blueprint-outputs">
            <strong className="pd-figure-title">Choose an output</strong>
            <dl>
              <div><dt>For a coding agent</dt><dd>Requirements and implementation structure, in Markdown and JSON.</dd></div>
              <div><dt>For your team</dt><dd>A human specification with personas, roles, and effort estimates.</dd></div>
              <div><dt>For a visual view</dt><dd>User-flow and architecture graphs, when available.</dd></div>
            </dl>
          </div>
        </div>
      </div>
      <figcaption>Both depths describe the project and its architecture. Deep Spec adds a finer breakdown; actual content and optional artifacts vary.</figcaption>
    </figure>
  );
};

export const GraphExample = () => (
  <figure className="pd-visual not-prose" aria-label="The web node sends HTTPS requests to the API node">
    <div className="pd-panel pd-edge-example">
      <div className="pd-edge-node"><strong>Web app</strong><code>id: web</code></div>
      <div className="pd-edge-line">HTTPS requests<span aria-hidden="true" /><code>source → target</code></div>
      <div className="pd-edge-node"><strong>API</strong><code>id: api</code></div>
    </div>
    <figcaption>The edge resolves <code>source: "web"</code> and <code>target: "api"</code> against the node IDs. Labels supply the readable names.</figcaption>
  </figure>
);
