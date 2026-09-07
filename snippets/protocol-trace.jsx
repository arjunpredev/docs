export const ProtocolTrace = ({ kind = "browser" }) => {
  const browser = [
    { from: "Your app", direction: "→", message: "POST /browser-agent", detail: "Submit with async: true. Save the returned run id." },
    { from: "Your app", direction: "→", message: "GET /browser-agent/{id}/stream", detail: "Attach a stream to the saved run." },
    { from: "pre.dev", direction: "←", message: "snapshot", detail: "The current run and available timelines arrive first." },
    { from: "pre.dev", direction: "←", message: "task_event / task_result", detail: "Observe live activity and individual task outcomes, when emitted." },
    { from: "pre.dev", direction: "←", message: "done: { status }", detail: "Terminal status only. This event does not contain the final run data.", terminal: true },
    { from: "Your app", direction: "→", message: "GET /browser-agent/{id}", detail: "Fetch the saved run for final results and credit usage." }
  ];
  const mcp = [
    { from: "MCP client", direction: "→", message: "Authenticate", detail: "Use a browser OAuth token or a supported API-key header." },
    { from: "MCP client", direction: "→", message: "initialize", detail: "pre.dev responds with capabilities and a negotiated protocol version." },
    { from: "MCP client", direction: "→", message: "notifications/initialized", detail: "Confirm initialization, then discover available tools." },
    { from: "MCP client", direction: "→", message: "tools/list", detail: "Receive tool names and their input schemas." },
    { from: "MCP client", direction: "→", message: "tools/call", detail: "Call a tool with its arguments. Optional progress arrives on the active response." },
    { from: "pre.dev", direction: "←", message: "Tool result", detail: "Read the result. Save any async ID and retrieve the completed work.", terminal: true }
  ];
  const isMcp = kind === "mcp";
  return (
    <figure className="pd-visual not-prose" aria-label={isMcp ? "MCP connection and tool-call exchange" : "Submit a browser run, stream updates, and fetch final results"}>
      <div className="pd-panel">
        <div className="pd-bar"><strong>{isMcp ? "MCP client ↔ pre.dev" : "Your application ↔ pre.dev"}</strong><span>{isMcp ? "Streamable HTTP" : "Async submission + SSE"}</span></div>
        <ol className="pd-trace">
          {(isMcp ? mcp : browser).map(item => (
            <li key={item.message} data-terminal={item.terminal || undefined}>
              <div className="pd-trace-direction">{item.from}<span aria-hidden="true">{item.direction}</span></div>
              <div><code>{item.message}</code><p>{item.detail}</p></div>
            </li>
          ))}
        </ol>
      </div>
    </figure>
  );
};
