"""Run guide snippets with the published SDK and mocked HTTP; never submit work."""
import contextlib
import io
import json
import os
from pathlib import Path
import re
import tempfile
from unittest.mock import patch
from urllib.parse import urlparse

import requests

ROOT = Path(__file__).resolve().parent.parent
IDENTIFIER = "507f1f77bcf86cd799439011"
SPEC = {"_id": IDENTIFIER, "status": "completed", "codingAgentSpecMarkdown": "# Plan"}
BATCH = {
    "id": IDENTIFIER, "status": "completed", "total": 1, "completed": 1,
    "results": [{"status": "SUCCESS", "data": {"heading": "Example Domain"}, "creditsUsed": 0.1}],
    "totalCreditsUsed": 0.1,
}
calls = []
uploads = []
streams = []


def response(value):
    result = requests.Response()
    result.status_code = 200
    result._content = json.dumps(value).encode()
    result.headers["Content-Type"] = "application/json"
    return result


def send(method, url, **kwargs):
    parsed = urlparse(url)
    assert parsed.scheme == "https" and parsed.netloc == "api.pre.dev"
    assert kwargs["headers"]["Authorization"] == "Bearer docs-test-key"
    calls.append((method, parsed.path))
    if method == "POST":
        if kwargs.get("files"):
            file = kwargs["files"]["file"]
            assert len(file) == 3 and file[2] == "application/pdf"
            assert isinstance(json.loads(kwargs["data"]["docURLs"]), list)
            assert kwargs["data"]["async"] == "true"
            uploads.append(True)
            return response({"specId": IDENTIFIER, "status": "pending"})
        body = kwargs["json"]
        if parsed.path == "/fast-spec":
            assert body["input"]
            return response({"specId": IDENTIFIER, "status": "pending"} if body.get("async") else SPEC)
        assert parsed.path == "/browser-agent"
        assert body["tasks"][0]["url"] == "https://example.com"
        if body.get("stream"):
            streams.append(True)
            result = response({})
            result.iter_lines = lambda **unused: iter([
                "event: task_event", 'data: {"taskIndex":0,"type":"navigation","timestamp":1}', "",
                "event: done", "data: " + json.dumps(BATCH), "",
            ])
            return result
        return response({"id": IDENTIFIER, "status": "processing"} if body.get("async") else BATCH)
    if parsed.path.startswith("/spec-status/"):
        return response(SPEC)
    if parsed.path in ("/list-specs", "/find-specs"):
        return response({"specs": [SPEC], "total": 1, "hasMore": False})
    if parsed.path == "/credits-balance":
        return response({"success": True, "creditsRemaining": 42.5})
    if parsed.path == "/browser-agent-status":
        return response({"total": 0, "cap": 25})
    if parsed.path == "/list-browser-agents":
        return response({"batches": [BATCH], "total": 1, "hasMore": False})
    if parsed.path.startswith("/browser-agent/"):
        return response(BATCH)
    raise AssertionError(f"Unmocked SDK request: {method} {parsed.path}")


def post(url, **kwargs):
    return send("POST", url, **kwargs)


def get(url, **kwargs):
    return send("GET", url, **kwargs)


def reject_network(*args, **kwargs):
    raise AssertionError("Unmocked network access is forbidden in documentation tests")


guides = ["architect-agent/sdks/python", "browser-agents/sdks/python", "browser-agents/quickstart"]
with tempfile.TemporaryDirectory(prefix="predev-docs-python-") as directory:
    pdf = Path(directory) / "requirements.pdf"
    pdf.write_bytes(b"%PDF-1.4\nExample fixture\n")
    with patch.dict(os.environ, {"PREDEV_API_KEY": "docs-test-key"}), \
         patch("requests.post", post), patch("requests.get", get), \
         patch("requests.sessions.Session.request", reject_network):
        for guide in guides:
            text = (ROOT / (guide + ".mdx")).read_text()
            blocks = re.findall(r"```python[^\n]*\n([\s\S]*?)\n\s*```", text)
            assert blocks, guide
            code = "\n".join(blocks).replace('open("requirements.pdf",', f"open({str(pdf)!r},")
            with contextlib.redirect_stdout(io.StringIO()):
                exec(compile(code, guide, "exec"), {})
assert len(uploads) == 1
assert len(streams) == 1
print(f"Python guide checks passed: {len(guides)} guides, {len(calls)} mocked requests, dictionary responses, MIME and SSE verified")
