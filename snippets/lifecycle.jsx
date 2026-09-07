export const LifecycleExplorer = ({ kind = "spec" }) => {
  const [selected, setSelected] = useState(0);
  const specExamples = [
    {
      label: "pending", tone: "active", badge: "Keep polling", title: "The request is saved.",
      body: "The submission returns specId. Save it before starting your polling loop.",
      next: "Request GET /spec-status/{specId} every few seconds, with a deadline.",
      endpoint: "POST /fast-spec · async: true",
      response: { specId: "507f1f77bcf86cd799439011", status: "pending" }
    },
    {
      label: "processing", tone: "active", badge: "Keep polling", title: "The specification is being generated.",
      body: "Progress fields help you display activity. Full artifacts may still be absent or null.",
      next: "Keep polling the same ID. Do not submit another specification to check progress.",
      endpoint: "GET /spec-status/{specId}",
      response: { status: "processing", progress: 45, progressMessage: "Generating architecture..." }
    },
    {
      label: "completed", tone: "success", badge: "Stop polling", title: "Read the generated artifacts.",
      body: "Use the Markdown or structured JSON for your reader. Check optional graphs and download URLs before using them.",
      next: "Review the specification against your requirements before building.",
      endpoint: "GET /spec-status/{specId}",
      response: { status: "completed", codingAgentSpecMarkdown: "# Team task manager\n...", creditsUsed: 7.2 }
    },
    {
      label: "failed", tone: "warning", badge: "Stop polling", title: "Generation did not complete.",
      body: "Read errorMessage and decide how to recover. A request may fail while pending or processing.",
      next: "An HTTP 200 status response does not mean generation succeeded.",
      endpoint: "GET /spec-status/{specId}",
      response: { status: "failed", errorMessage: "Specification generation failed." }
    }
  ];
  const browserExamples = [
    {
      label: "Queued", tone: "active", badge: "Keep polling", title: "The run exists; a task is waiting.",
      body: "The run status is processing, even when its tasks are still PENDING. Use the saved run id to retrieve progress.",
      next: "Poll the run or attach to its existing-run stream.",
      response: { status: "processing", results: [{ status: "PENDING", queuePosition: 2 }] }
    },
    {
      label: "Running", tone: "active", badge: "Keep polling", title: "Check status, not the counters.",
      body: "Result slots can already be counted in completed while tasks are still RUNNING. The run is not finished until its status is terminal.",
      next: "Treat missing data and null result slots as in-progress possibilities.",
      response: { status: "processing", total: 1, completed: 1, results: [{ status: "RUNNING", queuePosition: 0 }] }
    },
    {
      label: "Completed", tone: "success", badge: "Stop polling; inspect tasks", title: "Finished does not mean every task succeeded.",
      body: "This completed run contains a SUCCESS and a BLOCKED task. Read each task’s status before using its data.",
      next: "Use successful results. Inspect error on unsuccessful tasks before deciding to retry.",
      response: { status: "completed", results: [{ status: "SUCCESS", data: { heading: "Example Domain" } }, { status: "BLOCKED", error: "The site blocked this task." }] }
    },
    {
      label: "Failed", tone: "warning", badge: "Stop polling", title: "The run reached a failure state.",
      body: "Inspect the run error and any available task outcomes. Partial results may still be present.",
      next: "Keep the run ID when investigating or recovering from a failure.",
      response: { status: "failed", error: "Run execution failed.", results: [] }
    }
  ];
  const isBrowser = kind === "browser";
  const examples = isBrowser ? browserExamples : specExamples;
  const example = examples[selected];
  const panelId = isBrowser ? "browser-lifecycle-response" : "spec-lifecycle-response";
  return (
    <figure className="pd-visual not-prose" aria-label={isBrowser ? "Explore browser run and task states" : "Explore specification states"}>
      <div className="pd-panel">
        <div className="pd-bar"><strong>{isBrowser ? "One run. Individual task outcomes." : "From saved request to specification."}</strong><span>Interactive example</span></div>
        <div className="pd-state-controls" role="group" aria-label="Choose an example state">
          {examples.map((item, index) => (
            <button key={item.label} type="button" className="pd-state-button" aria-pressed={selected === index} aria-controls={panelId} onClick={() => setSelected(index)}>{item.label}</button>
          ))}
        </div>
        <div id={panelId} aria-live="polite" aria-atomic="true">
          <div className="pd-bar"><code>{isBrowser ? "GET /browser-agent/{id}" : example.endpoint}</code><span>Response excerpt</span></div>
          <div className="pd-response">
            <div className="pd-response-code"><pre><code>{JSON.stringify(example.response, null, 2)}</code></pre></div>
            <div className="pd-response-explanation">
              <span className="pd-chip" data-tone={example.tone}>{example.badge}</span>
              <strong className="pd-figure-title">{example.title}</strong>
              <p>{example.body}</p>
              <p className="pd-response-next">{example.next}</p>
            </div>
          </div>
        </div>
      </div>
      <figcaption>Select a state to see example response fields and what to do next.</figcaption>
    </figure>
  );
};
