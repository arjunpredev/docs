# Architect API Documentation - Mintlify Structure

> This is the outline structure for the Architect API documentation. Each section will be filled with actual content.

---

## 📁 Documentation Structure

### Navigation Structure
```
docs/
├── introduction.mdx                 # Hero section & overview
├── why-architect-api.mdx           # Value proposition
├── quickstart.mdx                  # Get started in <5 minutes
├── api-reference/
│   ├── overview.mdx                # API basics & authentication
│   ├── fast-spec.mdx               # POST /api/fast-spec endpoint
│   ├── deep-spec.mdx               # POST /api/deep-spec endpoint
│   ├── spec-status.mdx             # GET /api/spec-status/:requestId
│   └── trial-status.mdx            # GET /api/fast-api-trial-status
├── mcp-integration/
│   ├── overview.mdx                # What is MCP & why use it
│   ├── setup.mdx                   # Installation & configuration
│   └── usage.mdx                   # Using MCP with agents
├── guides/
│   ├── use-cases.mdx               # Real-world scenarios
│   ├── integration-patterns.mdx    # Common integration patterns
│   ├── best-practices.mdx          # Getting maximum value
│   └── choosing-spec-level.mdx     # Fast vs Deep decision guide
├── examples/
│   ├── new-project.mdx             # Starting from scratch
│   ├── feature-addition.mdx        # Adding to existing project
│   └── sample-output.mdx           # Example generated specs
├── pricing.mdx                     # Costs, limits, & tiers
└── faq.mdx                         # Common questions
```

---

## 📄 Content Outline by File

---

### **introduction.mdx**

```markdown
# Architect API

> Research Preview: State-of-the-art project specifications for AI coding agents

## Before you build, pre.dev it.

[Hero section with key value propositions]

### The Problem
- AI agents drift off scope without structured context
- Missing critical features due to vague requirements
- Poor architectural decisions from lack of planning
- Agents hallucinate when context is unstructured
- No way to constrain agent behavior effectively

### The Solution: Context Engineering as a Service
- **Pre-engineered context:** Structured specs eliminate ambiguity
- **Constraint boundaries:** Task tracking keeps agents within scope
- **Architectural grounding:** System diagrams prevent hallucination
- **Progressive disclosure:** Milestones → Stories → Subtasks for optimal context hierarchy
- **Universal compatibility:** Works with all coding tools

**The shift:** From manually crafting prompts → Automatically engineered, production-ready context

### What You Get
- Complete feature breakdown
- Technical architecture recommendations
- Implementation milestones with effort estimates
- User stories and acceptance criteria
- **Task tracking system with progress checkboxes**
- Markdown format ready for any agent

### Active Progress Management
Each spec includes a built-in task tracking legend:
- `[ ]` To Do → `[→]` In Progress → `[✓]` Complete → `[\]` Skipped

Track your agent's progress as it implements features. Update task statuses to maintain a living document that keeps both you and your AI aligned.

### Your Spec Lives on pre.dev
Every API request automatically creates a synced project on pre.dev where you can:
- **Visualize Architecture** - Interactive system diagrams and component relationships
- **Revise & Iterate** - Continue refining your spec through the web UI
- **Track Progress** - Monitor implementation status across your team
- **Version History** - See how your spec evolved over time

Access your project via the returned URL or your pre.dev dashboard.

[CTA: Get Started | View Example Spec]
```

---

### **why-architect-api.mdx**

```markdown
# Why Use Architect API?

## The Paradigm Shift

### Traditional Approach
Idea → Immediate Coding → Scope Drift → Rework → More Drift → Eventually Ship

### Architect API Approach
Idea → Comprehensive Spec → Guided Development → On-Target Delivery

## Problems Solved

### 1. Unstructured Context = Agent Hallucination

**The Problem:**
Conversational context with AI agents is inherently unstructured. Agents receive:
- Scattered requirements across chat messages
- No clear hierarchy of tasks
- Ambiguous acceptance criteria
- No architectural constraints

This leads to hallucination, scope drift, and wasted implementation effort.

**The Solution:**
Architect API provides **engineered context** with clear structure:
```
Milestones (What phases)
  └─> User Stories (What features)
      └─> Subtasks (What implementation steps)
          └─> Acceptance Criteria (What success looks like)
```

Agents receive a **bounded, hierarchical context** that eliminates ambiguity.

### 2. Context Window Inefficiency

**The Problem:**
Raw conversation consumes massive context windows:
- Verbose back-and-forth discussions
- Redundant clarifications
- Lost requirements in chat history
- No structured navigation

**The Solution:**
Compressed, structured specs maximize context efficiency:
- Dense information encoding (milestones → stories → subtasks)
- Clear navigation markers (task IDs, phase numbers)
- Architectural diagrams reduce verbal explanations
- Agents can reference specific sections without re-reading everything

### 3. No Constraint Boundaries

**The Problem:**
Without clear boundaries, agents:
- Add features not requested (scope creep)
- Skip critical requirements (gaps)
- Make architectural decisions without constraints
- Have no way to "stay in bounds"

**The Solution:**
Specs provide explicit constraint boundaries:
- ✅ Task tracking: Clear todo/done boundaries
- ✅ Acceptance criteria: Definition of success
- ✅ Architecture diagrams: System boundaries
- ✅ Technical stack: Technology constraints
- ✅ Milestones: Phase boundaries

### 4. Context Engineering is Manual & Error-Prone

**The Problem:**
Manually engineering good agent context requires:
- Writing detailed PRDs (hours of work)
- Creating architectural diagrams (expertise required)
- Breaking down into tasks (PM skills needed)
- Maintaining consistency across documents

Most developers aren't trained in context engineering.

**The Solution:**
Architect API automates professional context engineering:
- 30-40 seconds → production-quality context
- Automatic task decomposition
- Architecture visualization included
- Consistent structure every time

**You become a context engineer, not a prompt engineer.**

### 5. Lost Progress & Context Switching

**The Problem:**
When agents lose context (new session, memory limits):
- Progress tracking is lost
- Architecture understanding resets
- Requirements must be re-explained
- Implementation starts from scratch

**The Solution:**
Persistent pre.dev projects maintain context:
- Architecture always visible
- Progress checkboxes persist
- Requirements never lost
- Multiple agents can share context
- Resume work anytime, anywhere

## What Makes It Different

### vs. Manual PRD Writing
- 100x faster generation
- More comprehensive analysis
- Technical architecture included
- Effort estimates built-in

### vs. Direct Agent Building
- No scope drift
- Better architectural decisions
- Complete feature set from day one
- Clear progress milestones

### vs. Other Planning Tools
- Agent-optimized output format
- Fast and Deep spec options
- Universal markdown compatibility
- Flexible API + MCP access

## The Competitive Edge

### vs. Claude Code Planning
**Claude Code:** Completely unstructured - relies on conversation without formal specs

**Context Engineering Perspective:**
- ❌ Unstructured conversational context (hallucination risk)
- ❌ No hierarchy (agent can't navigate requirements)
- ❌ No boundaries (scope drift inevitable)
- ❌ Plans lost in chat history (context lost on new session)
- ❌ Manual prompt engineering required

**Architect API:**
- ✅ Engineered hierarchical context (milestones → stories → subtasks)
- ✅ Clear navigation markers (task IDs, phase numbers)
- ✅ Explicit constraint boundaries (acceptance criteria)
- ✅ Persistent, retrievable context (pre.dev project)
- ✅ Automatic context engineering (**30-40 seconds** for Fast Spec)

### vs. Factory AI Specification Mode
**Factory AI:** Less detailed, slower generation ([Source](https://docs.factory.ai/cli/user-guides/specification-mode))
- Requires Shift+Tab manual activation
- Less granular task breakdown
- Slower generation times
- No persistent project visualization

**Architect API:**
- ✅ More fine-grained subtask decomposition
- ✅ Faster generation (30-40s vs minutes)
- ✅ Automatic project creation on pre.dev
- ✅ Rich architectural visualization
- ✅ Simple API call - no CLI required

### The Speed Advantage

> "While others wait for specs, you're already building."

- **Fast Spec:** 30-40 seconds → comprehensive roadmap
- **Deep Spec:** 2-3 minutes → complete implementation plan with subtasks
- **Factory AI:** Several minutes for comparable depth
- **Claude Code:** No structured spec at all

### The Structure Advantage

| Feature | Architect API | Factory AI | Claude Code |
|---------|--------------|------------|-------------|
| Milestones | ✅ | ✅ | ❌ |
| User Stories | ✅ | ✅ | ❌ |
| Granular Subtasks | ✅ (Deep) | Basic | ❌ |
| Acceptance Criteria | ✅ Detailed | Basic | ❌ |
| Architecture Viz | ✅ | ❌ | ❌ |
| Progress Tracking | ✅ | Limited | ❌ |
| Persistent Project | ✅ | ❌ | ❌ |
| Generation Speed | ⚡ 30s-3min | 🐌 Minutes+ | N/A |
```

---

### **quickstart.mdx**

```markdown
# Quick Start

Get your first specification in under 5 minutes.

## 1. Get Your API Key

### Solo Users
[Instructions for getting solo API key]

### Enterprise Organizations
[Instructions for getting enterprise API key]

## 2. Make Your First Request

### cURL Example
```bash
curl -X POST https://api.pre.dev/api/fast-spec \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Build a task management app with team collaboration",
    "outputFormat": "url"
  }'
```

### Python Example
```python
import requests

response = requests.post(
    'https://api.pre.dev/api/fast-spec',
    headers={'x-api-key': 'YOUR_API_KEY'},
    json={
        'input': 'Build a task management app with team collaboration',
        'outputFormat': 'url'
    }
)

result = response.json()
print(f"Spec URL: {result['url']}")
```

### JavaScript Example
```javascript
const response = await fetch('https://api.pre.dev/api/fast-spec', {
  method: 'POST',
  headers: {
    'x-api-key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    input: 'Build a task management app with team collaboration',
    outputFormat: 'url'
  })
});

const result = await response.json();
console.log(`Spec URL: ${result.url}`);
```

## 3. View Your Specification

Your spec is delivered as a comprehensive markdown file that includes:
- Executive summary and feature breakdown
- Technical architecture recommendations
- Implementation phases with task checklists
- User stories with acceptance criteria
- **Built-in task tracking system**

### Understanding Task Tracking

Every spec includes a progress tracking legend:

```markdown
# Task Status Legend
- [ ] To Do
- [→] In Progress  
- [✓] Complete
- [\] Skipped (with reason)
```

Update task statuses as your agent implements features to track progress.

## 4. Use with Your Favorite Agent

### Cursor
Click the "Open in Cursor" button on your spec page or use the deep link:
```
cursor://file?url=https://pre.dev/s/abc123
```
The spec automatically opens in Cursor - no manual pasting needed.

### Lovable
Click "Open in Lovable" or use the deep link:
```
https://lovable.dev/projects/create?template=https://pre.dev/s/abc123
```
Your spec loads as the project context automatically.

### Bolt / v0
These tools also support deep links - check your spec page for the "Open in..." buttons.

### Claude Desktop (via MCP)
1. Once MCP is configured, just ask Claude to generate a spec
2. Claude will use the Architect API automatically
3. Spec opens in your browser with deep link options

## Next Steps

- [Read full API Reference](#)
- [Setup MCP Integration](#)
- [Explore Use Cases](#)
- [Join our Discord Community](#)
```

---

### **api-reference/overview.mdx**

```markdown
# API Reference Overview

## Base URL

```
https://api.pre.dev/api
```

## Authentication

The Architect API supports two authentication methods:

### Solo Authentication
Use `x-api-key` header with your user ID

```bash
x-api-key: YOUR_USER_ID
```

**Where to get your API key:**
1. Log in to [pre.dev](https://pre.dev)
2. Go to Settings → API Keys
3. Copy your User ID (this is your API key)

**Format:** Your user ID is a string like `user_2abc123def456`

### Enterprise Authentication
Use `x-enterprise-api-key` header with your organization's API key

```bash
x-enterprise-api-key: YOUR_ORG_API_KEY
```

**Where to get enterprise API key:**
1. Log in to [pre.dev](https://pre.dev)
2. Go to Organization Settings → API Keys
3. Generate or copy enterprise API key
4. **Note:** Requires active enterprise subscription

**Format:** Enterprise keys are 32+ character strings like `ek_prod_abc123...`

### Authentication Differences

| Feature | Solo | Enterprise |
|---------|------|------------|
| API Key Location | User settings | Organization settings |
| Cost Tracking | Per user | Per organization |
| Access Control | Individual | All org members |
| Subscription | Individual plan | Org-wide plan |

## Endpoints Overview

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/fast-spec` | POST | Generate quick comprehensive spec | ✅ |
| `/deep-spec` | POST | Generate ultra-detailed spec | ✅ |
| `/spec-status/:id` | GET | Check async generation status | ✅ |
| `/fast-api-trial-status` | GET | Check free trial eligibility | ✅ |

## Request Modes

### Synchronous (Default)
Request waits for completion, returns spec immediately

```json
{
  "async": false
}
```

### Asynchronous
Request returns immediately with request ID, poll for status

```json
{
  "async": true
}
```

## Output Formats

### URL Format (Default)
Returns a hosted URL to the specification file

```json
{
  "outputFormat": "url"
}
```

### Markdown Format
Returns the raw markdown content in the response

```json
{
  "outputFormat": "markdown"
}
```

## Generation Costs

| Endpoint | Cost | What You Pay For |
|----------|------|------------------|
| Fast Spec | 10 generations | Deducted immediately when request starts |
| Deep Spec | 50 generations | Deducted immediately when request starts |

### What is a "Generation"?

A generation = one AI model inference call. Specs require multiple LLM calls for:
- Architecture analysis
- Feature breakdown
- Milestone planning
- Story generation
- Risk assessment

**Cost is per spec request, not per feature.** Generate as many features in one spec as needed.

### Generation Sources (Priority Order)

1. **Prototype Credits** - Used first if available
2. **Daily Allocation** - Based on subscription tier
3. **Rollover Credits** - Unused daily credits (if applicable)

Check remaining generations:
```bash
GET /api/generation-usage
```

## Rate Limits

### Generation Limits by Tier

| Tier | Daily Limit | Monthly Limit | Price (Monthly) |
|------|-------------|---------------|-----------------|
| Trial | 1 | 1 | Free |
| Solo Plus | 20 | 200 | $25/mo |
| Solo Premium | Unlimited daily | 500/month | $49/mo |
| Enterprise Premium | Unlimited daily | 1,000/month | $99/mo |
| Enterprise Advanced | Unlimited daily | 2,500/month | From $249/mo |
| Lead Gen Pro | Unlimited daily | 10,000/month | Custom |

**Important:** "Unlimited daily" means no daily cap, but monthly limits still apply.

### Fair Use Policy

- Concurrent requests: Based on tier (1-10 concurrent)
- No burst limits on request rate
- Exceeding monthly limit: Purchase additional prototype credits or upgrade tier

Exceeding limits returns `402 Payment Required` with details on remaining generations.

## Error Handling

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response |
| 400 | Bad Request | Check request parameters |
| 401 | Unauthorized | Verify API key |
| 402 | Insufficient Generations | Purchase credits or upgrade |
| 403 | Forbidden | Check subscription status |
| 429 | Rate Limited | Wait and retry |
| 500 | Server Error | Contact support |

### Common Error Responses

**Insufficient Generations:**
```json
{
  "error": "Insufficient generations available",
  "message": "Fast Spec requires 10 generations. You have 5 remaining.",
  "generationsRequired": 10,
  "generationsAvailable": 5
}
```

**Free Trial Exhausted:**
```json
{
  "error": "Free trial already used",
  "message": "You have already used your free Fast API trial. Please subscribe to Solo Premium to continue.",
  "requiresSubscription": true
}
```

**Invalid Input:**
```json
{
  "error": "Invalid input",
  "message": "Please provide a valid input string describing your spec"
}
```

**Authentication Failed:**
```json
{
  "error": "Invalid enterprise API key",
  "message": "The provided enterprise API key is not valid"
}
```
```

---

### **api-reference/fast-spec.mdx**

```markdown
# POST /api/fast-spec

Generate a quick, comprehensive project specification.

## Overview

- **Cost:** 10 generations
- **Use Cases:** MVPs, prototypes, rapid iteration
- **Generation Time:** ~30-40 seconds (sync) or instant return (async)
- **Output:** Milestones → User Stories (no subtasks)
- **Creates:** Synced pre.dev project for revision & visualization

## Endpoint

```
POST https://api.pre.dev/api/fast-spec
```

## Headers

```
x-api-key: YOUR_API_KEY
Content-Type: application/json
```

Or for enterprise:

```
x-enterprise-api-key: YOUR_ORG_API_KEY
Content-Type: application/json
```

## Request Body

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `input` | string | ✅ | Description of what you want to build |
| `outputFormat` | string | ❌ | `"url"` (default) - returns hosted URL, or `"markdown"` - returns raw markdown in response |
| `currentContext` | string | ❌ | **CRITICAL:** Existing project/codebase context. When provided, generates feature addition spec. When omitted, generates full new project spec with setup, deployment, docs, maintenance |
| `async` | boolean | ❌ | `false` (default) - wait for completion, or `true` - return immediately with requestId for status polling |

### Understanding `currentContext` (isNewBuild behavior)

**Omit `currentContext` (New Project - isNewBuild: true):**
```json
{
  "input": "Build a task management SaaS"
}
```
**Generates:** Complete new project including:
- Initial setup and scaffolding
- Deployment configuration
- Documentation structure
- Support and maintenance guidelines
- Infrastructure setup
- CI/CD pipelines
- Monitoring and logging

**Provide `currentContext` (Feature Addition - isNewBuild: false):**
```json
{
  "input": "Add real-time notifications and activity feed",
  "currentContext": "Existing Next.js task management app with Supabase, has auth, task CRUD, team features"
}
```
**Generates:** Incremental feature spec including:
- New features only (respects existing architecture)
- Integration points with current codebase
- Migration considerations
- No redundant setup/deployment (already exists)

**Response includes `isNewBuild` flag:**
```json
{
  "output": "https://pre.dev/s/abc123",
  "isNewBuild": true,  // or false if currentContext provided
  "fileUrl": "https://pre.dev/s/abc123"
}
```

### Example: New Project

```json
{
  "input": "Build a SaaS project management tool with team collaboration, real-time updates, task tracking, and time logging. Include user authentication and role-based permissions.",
  "outputFormat": "url"
}
```

### Example: Feature Addition

```json
{
  "input": "Add a calendar view and Gantt chart visualization to the existing project management tool",
  "currentContext": "We have a task management system with list and board views, user auth, and basic team features",
  "outputFormat": "url"
}
```

### Example: Async Request

```json
{
  "input": "Build a comprehensive e-commerce platform with inventory management",
  "outputFormat": "url",
  "async": true
}
```

## Response

### Success Response (Sync Mode)

**When `outputFormat: "url"` (default):**
```json
{
  "output": "https://pre.dev/s/abc123",
  "outputFormat": "url",
  "isNewBuild": true,
  "fileUrl": "https://pre.dev/s/abc123"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `output` | string | Primary output - the hosted spec URL |
| `outputFormat` | string | Confirms format used (`"url"` or `"markdown"`) |
| `isNewBuild` | boolean | `true` = new project, `false` = feature addition |
| `fileUrl` | string | Always the hosted URL (even if outputFormat is markdown) |

**Important:** The `output`/`fileUrl` is not just a static file - it's a **live pre.dev project** where you can:
- Visualize system architecture with interactive diagrams
- Continue refining the spec through the web UI
- Track implementation progress
- Collaborate with your team
- View version history

**When `outputFormat: "markdown"`:**
```json
{
  "markdown": "# Project Specification\n\n## Executive Summary...",
  "outputFormat": "markdown",
  "isNewBuild": false,
  "fileUrl": "https://pre.dev/s/abc123"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `markdown` | string | Full markdown content (can be very large) |
| `outputFormat` | string | Confirms `"markdown"` |
| `isNewBuild` | boolean | Context flag |
| `fileUrl` | string | URL to live pre.dev project (not just static file) |

**Note:** Even with `outputFormat: "markdown"`, you still get a `fileUrl` pointing to your live project on pre.dev for visualization and collaboration.

### Success Response (Async Mode)

**Immediate response when `async: true`:**
```json
{
  "requestId": "507f1f77bcf86cd799439011",
  "status": "pending",
  "message": "Request queued for processing. Use /api/spec-status/:requestId to check status."
}
```

| Field | Type | Description |
|-------|------|-------------|
| `requestId` | string | MongoDB ObjectId to poll for status |
| `status` | string | `"pending"` initially |
| `message` | string | Instructions for polling |

**Poll `/api/spec-status/:requestId` to check progress.**

### Async Status Flow

1. **Pending** → Initial queue state
2. **Processing** → Actively generating spec
3. **Completed** → Success, output available
4. **Failed** → Error occurred

**Typical generation times:**
- Fast Spec: 30-40 seconds
- Deep Spec: 2-3 minutes

Poll every 5-10 seconds for best UX.

### Error Response Examples

**Insufficient Credits:**
```json
{
  "error": "Insufficient generations available",
  "message": "Fast Spec requires 10 generations. You have 5 remaining.",
  "generationsRequired": 10,
  "generationsAvailable": 5
}
```

**Free Trial Used:**
```json
{
  "error": "Free trial already used",
  "message": "You have already used your free Fast API trial. Please subscribe to Solo Premium to continue.",
  "requiresSubscription": true
}
```

**Invalid Input:**
```json
{
  "error": "Invalid input",
  "message": "Please provide a valid input string describing your spec"
}
```

**Rate Limited:**
```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please wait before making another request.",
  "retryAfter": 5
}
```

## Free Trial

Solo users get **one free Fast Spec trial** before requiring a subscription.

### How It Works

1. **First Request:** Free (no subscription needed)
2. **Completion:** Email sent congratulating you + showcasing results
3. **Subsequent Requests:** Require Solo Premium subscription

### Check Trial Status

```bash
curl https://api.pre.dev/api/fast-api-trial-status \
  -H "x-api-key: YOUR_API_KEY"
```

**Response:**
```json
{
  "hasUsedTrial": false,
  "usedAt": null
}
```

or

```json
{
  "hasUsedTrial": true,
  "usedAt": "2025-10-01T14:30:00Z"
}
```

### Trial Completion Email

After your free spec completes, you'll receive an email with:
- Link to your generated specification
- Highlights of what was included
- Upgrade options for unlimited access
- Examples of what you can build next

## Code Examples

### cURL - Complete Flow

**Synchronous Request:**
```bash
curl -X POST https://api.pre.dev/api/fast-spec \
  -H "x-api-key: YOUR_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Build a real-time collaborative whiteboard with drawing tools, shapes, text, and team presence indicators",
    "outputFormat": "url"
  }'
```

**Asynchronous Request with Polling:**
```bash
# Step 1: Start async generation
RESPONSE=$(curl -X POST https://api.pre.dev/api/fast-spec \
  -H "x-api-key: YOUR_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Build a CRM with contact management, deal pipeline, and email integration",
    "async": true
  }')

REQUEST_ID=$(echo $RESPONSE | jq -r '.requestId')

# Step 2: Poll for status
while true; do
  STATUS=$(curl https://api.pre.dev/api/spec-status/$REQUEST_ID \
    -H "x-api-key: YOUR_USER_ID")
  
  STATE=$(echo $STATUS | jq -r '.status')
  
  if [ "$STATE" = "completed" ]; then
    echo "Spec ready!"
    echo $STATUS | jq -r '.output'
    break
  elif [ "$STATE" = "failed" ]; then
    echo "Generation failed"
    echo $STATUS | jq -r '.errorMessage'
    break
  fi
  
  echo "Status: $STATE - $(echo $STATUS | jq -r '.progress')"
  sleep 10
done
```

### Python - Complete Implementation

```python
import requests
import time
from typing import Dict, Any

class ArchitectAPI:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.pre.dev/api"
    
    def generate_spec(
        self,
        input_text: str,
        current_context: str = None,
        output_format: str = "url",
        async_mode: bool = False
    ) -> Dict[str, Any]:
        """Generate a fast spec."""
        headers = {
            "x-api-key": self.api_key,
            "Content-Type": "application/json"
        }
        
        payload = {
            "input": input_text,
            "outputFormat": output_format,
            "async": async_mode
        }
        
        if current_context:
            payload["currentContext"] = current_context
        
        response = requests.post(
            f"{self.base_url}/fast-spec",
            headers=headers,
            json=payload
        )
        
        response.raise_for_status()
        return response.json()
    
    def check_status(self, request_id: str) -> Dict[str, Any]:
        """Check async generation status."""
        headers = {"x-api-key": self.api_key}
        
        response = requests.get(
            f"{self.base_url}/spec-status/{request_id}",
            headers=headers
        )
        
        response.raise_for_status()
        return response.json()
    
    def wait_for_completion(self, request_id: str, poll_interval: int = 10) -> Dict[str, Any]:
        """Wait for async generation to complete."""
        while True:
            status = self.check_status(request_id)
            
            if status["status"] == "completed":
                return status
            elif status["status"] == "failed":
                raise Exception(f"Generation failed: {status.get('errorMessage')}")
            
            print(f"Status: {status['status']} - {status.get('progress', 'Processing...')}")
            time.sleep(poll_interval)

# Usage
api = ArchitectAPI(api_key="YOUR_USER_ID")

# Synchronous (wait for result)
result = api.generate_spec(
    input_text="Build a fitness tracking app with workout logging, progress charts, and social features",
    output_format="url"
)
print(f"Spec URL: {result['output']}")

# Asynchronous (poll for result)
response = api.generate_spec(
    input_text="Add AI meal planning and nutrition tracking to existing fitness app",
    current_context="Existing app has workout logging, user profiles, and basic social features built with React Native and Firebase",
    async_mode=True
)

result = api.wait_for_completion(response["requestId"])
print(f"Spec ready: {result['output']}")
```

### JavaScript/Node.js - Complete Implementation

```javascript
const fetch = require('node-fetch');

class ArchitectAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.pre.dev/api';
  }

  async generateSpec({
    input,
    currentContext = null,
    outputFormat = 'url',
    async = false
  }) {
    const headers = {
      'x-api-key': this.apiKey,
      'Content-Type': 'application/json'
    };

    const payload = {
      input,
      outputFormat,
      async
    };

    if (currentContext) {
      payload.currentContext = currentContext;
    }

    const response = await fetch(`${this.baseUrl}/fast-spec`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }

    return response.json();
  }

  async checkStatus(requestId) {
    const headers = { 'x-api-key': this.apiKey };

    const response = await fetch(
      `${this.baseUrl}/spec-status/${requestId}`,
      { headers }
    );

    if (!response.ok) {
      throw new Error('Failed to check status');
    }

    return response.json();
  }

  async waitForCompletion(requestId, pollInterval = 10000) {
    while (true) {
      const status = await this.checkStatus(requestId);

      if (status.status === 'completed') {
        return status;
      } else if (status.status === 'failed') {
        throw new Error(`Generation failed: ${status.errorMessage}`);
      }

      console.log(`Status: ${status.status} - ${status.progress || 'Processing...'}`);
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }
}

// Usage Examples

// Synchronous
(async () => {
  const api = new ArchitectAPI('YOUR_USER_ID');

  try {
    const result = await api.generateSpec({
      input: 'Build an e-learning platform with video courses, quizzes, certificates, and student progress tracking'
    });

    console.log('Spec URL:', result.output);
    console.log('Is new build:', result.isNewBuild);
  } catch (error) {
    console.error('Error:', error.message);
  }
})();

// Asynchronous with polling
(async () => {
  const api = new ArchitectAPI('YOUR_USER_ID');

  try {
    // Start generation
    const response = await api.generateSpec({
      input: 'Add gamification with points, badges, and leaderboards',
      currentContext: 'Existing e-learning platform with courses and progress tracking',
      async: true
    });

    console.log('Request ID:', response.requestId);

    // Wait for completion
    const result = await api.waitForCompletion(response.requestId);
    console.log('Spec ready:', result.output);
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
```

### TypeScript - Type-Safe Implementation

```typescript
interface SpecRequest {
  input: string;
  currentContext?: string;
  outputFormat?: 'url' | 'markdown';
  async?: boolean;
}

interface SpecResponse {
  output?: string;
  markdown?: string;
  outputFormat: 'url' | 'markdown';
  isNewBuild: boolean;
  fileUrl: string;
}

interface AsyncResponse {
  requestId: string;
  status: 'pending';
  message: string;
}

interface StatusResponse {
  requestId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: string;
  output?: string;
  outputFormat?: string;
  fileUrl?: string;
  errorMessage?: string;
  executionTimeMs?: number;
}

class ArchitectAPI {
  private apiKey: string;
  private baseUrl: string = 'https://api.pre.dev/api';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateSpec(request: SpecRequest): Promise<SpecResponse | AsyncResponse> {
    const response = await fetch(`${this.baseUrl}/fast-spec`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }

    return response.json();
  }

  async checkStatus(requestId: string): Promise<StatusResponse> {
    const response = await fetch(`${this.baseUrl}/spec-status/${requestId}`, {
      headers: { 'x-api-key': this.apiKey }
    });

    if (!response.ok) {
      throw new Error('Failed to check status');
    }

    return response.json();
  }

  async waitForCompletion(requestId: string, pollInterval: number = 10000): Promise<StatusResponse> {
    while (true) {
      const status = await this.checkStatus(requestId);

      if (status.status === 'completed') {
        return status;
      } else if (status.status === 'failed') {
        throw new Error(`Generation failed: ${status.errorMessage}`);
      }

      console.log(`${status.status}: ${status.progress || 'Processing...'}`);
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }
}
```

## What You Get

The generated specification includes:

- ✅ Executive summary
- ✅ Feature breakdown by category
- ✅ Technical architecture recommendations
- ✅ Implementation milestones with effort estimates
- ✅ User stories and acceptance criteria
- ✅ **Task checklist with progress tracking**
  - Task status legend: `[ ]` → `[→]` → `[✓]` → `[\]`
  - Update as your agent completes work
  - Keep both you and AI aligned on progress
- ✅ Risk analysis and considerations
- ✅ Markdown formatted for direct agent use

## Using Task Tracking

As your agent implements features, actively manage progress:

1. **Mark tasks in progress:** Change `[ ]` to `[→]` when starting
2. **Mark complete:** Change `[→]` to `[✓]` when done
3. **Mark skipped:** Change `[ ]` to `[\]` if skipping (with reason)

**Pro Tip:** Don't let your agent skip tasks without questioning why. This keeps implementation comprehensive and on-track.

## Best Practices

### Writing Effective Input
- Be specific about core features
- Include business context and constraints
- Mention technical preferences if any

### Managing Your Agent
- Actively interrupt to ensure tasks are checked off
- Question every skipped task
- Verify acceptance criteria before marking complete
- Triple check that tests are written

[See full Best Practices guide for detailed agent management strategies]
```

---

### **api-reference/deep-spec.mdx**

```markdown
# POST /api/deep-spec

Generate an ultra-detailed, comprehensive project specification.

## Overview

- **Cost:** 50 generations
- **Use Cases:** Complex systems, enterprise applications, critical projects
- **Generation Time:** ~2-3 minutes (sync) or instant return (async)
- **Output:** Milestones → User Stories with Acceptance Criteria → Granular Subtasks
- **Creates:** Synced pre.dev project for revision & visualization

## Endpoint

```
POST https://api.pre.dev/api/deep-spec
```

## Subscription Required

Deep Spec requires **Solo Premium** or **Enterprise** subscription.

[Rest similar to fast-spec but highlighting the additional depth and detail]

## Deep Spec vs Fast Spec

| Feature | Fast Spec | Deep Spec |
|---------|-----------|-----------|
| Cost | 10 generations | 50 generations |
| Generation Time | 2-5 min | 5-15 min |
| Structure | Milestones → Stories | Milestones → Stories → Subtasks |
| Acceptance Criteria | Basic | ✅ Detailed per story |
| Granular Subtasks | ❌ | ✅ Implementation tasks |
| Best For | MVPs, prototypes | Enterprise, complex systems |
| Detail Level | Comprehensive | Ultra-detailed |
| Architecture Depth | ✅ | ✅✅✅ |
| Risk Analysis | ✅ | ✅✅✅ |

[Full documentation similar to fast-spec]
```

---

### **api-reference/spec-status.mdx**

```markdown
# GET /api/spec-status/:requestId

Check the status of an asynchronous specification generation request.

## Overview

When you make an async request (`"async": true`), use this endpoint to poll for completion status.

## Endpoint

```
GET https://api.pre.dev/api/spec-status/:requestId
```

## Parameters

| Parameter | Location | Required | Description |
|-----------|----------|----------|-------------|
| `requestId` | Path | ✅ | Request ID returned from async spec generation |

## Example Request

```bash
curl https://api.pre.dev/api/spec-status/507f1f77bcf86cd799439011 \
  -H "x-api-key: YOUR_API_KEY"
```

## Response

### Pending

```json
{
  "requestId": "507f1f77bcf86cd799439011",
  "status": "pending",
  "progress": "Initializing...",
  "endpoint": "fast_spec",
  "timestamp": "2025-10-03T10:00:00Z"
}
```

### Processing

```json
{
  "requestId": "507f1f77bcf86cd799439011",
  "status": "processing",
  "progress": "Generating specification...",
  "endpoint": "fast_spec",
  "timestamp": "2025-10-03T10:00:00Z"
}
```

### Completed

```json
{
  "requestId": "507f1f77bcf86cd799439011",
  "status": "completed",
  "progress": "Completed successfully",
  "endpoint": "fast_spec",
  "timestamp": "2025-10-03T10:00:00Z",
  "completedAt": "2025-10-03T10:03:45Z",
  "output": "https://pre.dev/s/abc123",
  "outputFormat": "url",
  "fileUrl": "https://pre.dev/s/abc123",
  "executionTimeMs": 225000
}
```

### Failed

```json
{
  "requestId": "507f1f77bcf86cd799439011",
  "status": "failed",
  "progress": "Failed to generate specification",
  "endpoint": "fast_spec",
  "timestamp": "2025-10-03T10:00:00Z",
  "completedAt": "2025-10-03T10:02:15Z",
  "errorMessage": "Invalid input format",
  "executionTimeMs": 135000
}
```

## Polling Best Practices

[Recommendations for polling intervals, timeouts, etc.]
```

---

### **api-reference/trial-status.mdx**

```markdown
# GET /api/fast-api-trial-status

Check if the authenticated user has used their free Fast Spec trial.

## Overview

Solo users get one free Fast Spec generation before requiring a subscription. Use this endpoint to check trial eligibility.

[Full documentation]
```

---

### **mcp-integration/overview.mdx**

```markdown
# MCP Integration Overview

## What is MCP?

The **Model Context Protocol (MCP)** is a universal plugin system that allows AI agents to access external tools and APIs seamlessly.

With MCP, you can:
- Generate specs directly from Claude Desktop, Cursor, or other MCP-enabled agents
- Have natural conversations that trigger spec generation
- No need to leave your development environment

## Why Use MCP?

### Interactive Development
Have a conversation with your AI agent about your project, and generate specs on the fly.

### Seamless Integration
Once configured, spec generation is just a natural part of your conversation.

### Universal Compatibility
Works with any MCP-enabled agent:
- Claude Desktop
- Cursor
- [Other supported agents]

## MCP vs Direct API

| Feature | MCP Integration | Direct API |
|---------|----------------|------------|
| Best For | Interactive, exploratory | Programmatic, batch, CI/CD |
| Setup | One-time config file | Per-request authentication |
| Use Case | Development workflow | Automation, scripts |
| Natural Language | ✅ Conversational | ❌ Structured requests |

## Next Steps

- [Setup MCP Integration](#)
- [Learn MCP Usage Patterns](#)
```

---

### **mcp-integration/setup.mdx**

```markdown
# MCP Setup Guide

Get MCP integration running in under 5 minutes.

## Prerequisites

- An MCP-enabled AI agent (Claude Desktop, Cursor, etc.)
- Your pre.dev API key

## Installation Steps

### 1. Locate Your MCP Configuration

[Instructions for finding the config file for different agents]

### 2. Add Architect API Server

[Configuration snippets for different MCP implementations]

### 3. Restart Your Agent

[Instructions]

### 4. Verify Installation

[How to test that it's working]

## Configuration Examples

### Claude Desktop

```json
{
  "mcpServers": {
    "predev-architect": {
      "command": "npx",
      "args": ["-y", "@predev/architect-mcp-server"],
      "env": {
        "PREDEV_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Cursor

[Configuration for Cursor]

## Troubleshooting

[Common issues and solutions]
```

---

### **mcp-integration/usage.mdx**

```markdown
# Using MCP with AI Agents

## Basic Usage

Once configured, you can generate specs through natural conversation:

### Example Conversations

**User:** "I want to build a social media app for book lovers. Can you generate a detailed spec for this?"

**Agent:** *Uses Architect API via MCP*

"I've generated a comprehensive specification for your book-focused social network. The spec includes..."

### Triggering Spec Generation

You can naturally request specs with phrases like:
- "Generate a spec for..."
- "Create a detailed plan for..."
- "I need a specification for..."
- "Plan out an architecture for..."

## Advanced Usage Patterns

### Iterative Refinement

**User:** "Generate a fast spec for a recipe sharing app"

*Reviews output*

**User:** "Now generate a deep spec that includes meal planning and grocery list integration"

### Feature Addition

**User:** "I have an existing recipe app. Generate a spec for adding social features like comments and ratings."

## Best Practices

[Tips for effective MCP usage]
```

---

### **guides/use-cases.mdx**

```markdown
# Use Cases

## Use Case 1: Starting a New Project

### The Scenario
You have an idea for a SaaS application but aren't sure about all the features needed or the technical architecture.

### Without Architect API
1. Start coding directly in Cursor/Lovable
2. Realize you're missing features halfway through
3. Refactor multiple times
4. End up with technical debt

### With Architect API
1. Describe your idea to Architect API
2. Get comprehensive spec with all necessary features
3. Paste spec into your agent
4. Agent builds with complete context from day one

### Example
[Detailed walkthrough]

---

## Use Case 2: Adding Features to Existing Projects

[Similar structure for each use case]

---

## Use Case 3: Team Collaboration

## Use Case 4: CI/CD Integration

## Use Case 5: Multi-Agent Workflows
```

---

### **guides/integration-patterns.mdx**

```markdown
# Integration Patterns

## Pattern 1: Cursor Rules Generation

### Overview
Generate specs and extract them as Cursor rules to constrain your agent throughout development.

### Implementation
[Step-by-step guide]

---

## Pattern 2: Lovable/Bolt Direct Paste

## Pattern 3: v0 Component Extraction

## Pattern 4: Programmatic Spec Management
```

---

### **guides/best-practices.mdx**

```markdown
# Best Practices

## Writing Effective Input

### Be Specific About Core Features
❌ "Build a social media app"
✅ "Build a social media app for photographers with portfolio galleries, image tagging, follow system, and commenting"

### Include Business Context
❌ "Build an e-commerce site"
✅ "Build an e-commerce site for handmade crafts with artist profiles, custom product options, and commission tracking for a marketplace model"

### Mention Technical Preferences
If you have specific tech stack requirements, mention them:
✅ "Build a real-time chat app using Next.js, Socket.io, and PostgreSQL"

---

## Using Current Context

### When to Use `currentContext`

Use the `currentContext` parameter when:
- Adding features to an existing codebase
- Expanding on a previous spec
- Building on top of established architecture

### How to Provide Context

```json
{
  "input": "Add AI-powered search and recommendations",
  "currentContext": "We have an existing e-commerce platform built with Next.js and MongoDB. Current features include product listings, shopping cart, and user authentication with Clerk."
}
```

The spec will now treat this as a **feature addition** and respect your existing architecture.

---

## Choosing Fast vs Deep Spec

### Fast Spec (10 gen) - Use When:
- Building MVPs or prototypes
- Personal or side projects
- Small to medium complexity
- Rapid iteration needed
- Don't need granular subtasks
- **Output:** Milestones → Stories

### Deep Spec (50 gen) - Use When:
- Enterprise applications
- Complex system architectures
- Large team coordination needed
- Mission-critical features
- Need implementation-level subtasks
- Need detailed acceptance criteria
- **Output:** Milestones → Stories with Acceptance Criteria → Subtasks

---

## Managing Your Agent with the Spec

> **This is the most important section for getting real value from your specifications.**

### The Spec is a Living Document

Your generated spec isn't just a planning document—it's an **active management tool** for keeping your AI agent on track.

### Core Principle: You're the Context Engineer, Agent is the Implementer

With Architect API, you shift from:
- ~~Prompt engineering~~ → **Context engineering**
- ~~Vibe coding~~ → **Vibe PM'ing**
- ~~Managing code changes~~ → **Managing agent constraints**

**The spec IS your engineered context.** Everything the agent needs to stay on track is encoded in the structured hierarchy.

### Why Structured Context Matters

**Unstructured context (conversation):**
```
User: "Build a task manager"
Agent: "What features?" 
User: "The usual ones"
Agent: *implements random features*
```
❌ Ambiguous, leads to hallucination

**Engineered context (Architect API):**
```
Milestone 1: Core Task Management
  └─ Story 1.1: Task CRUD Operations
     ├─ Subtask: Create task endpoint
     ├─ Subtask: Update task endpoint
     └─ Acceptance: All CRUD operations return proper status codes
```
✅ Bounded, hierarchical, verifiable

---

## ⚠️ Critical Best Practices for Agent Management

### 1. **Don't Be Afraid to Interrupt**

**Most Important Rule:** Actively interrupt your agent to ensure it's checking off tasks.

```
You: "Before you continue, mark that authentication task as complete 
     in the spec with [✓]. Show me the updated checklist."
```

**Why This Matters:**
- Prevents agents from drifting off scope
- Keeps you both aligned on progress
- Makes it immediately obvious if tasks are being skipped
- Forces the agent to acknowledge completion

### 2. **Question Every Skipped Task**

If your agent skips a task, **always ask why**:

```
You: "I notice you skipped the JWT token refresh implementation. 
     Why was that skipped?"
```

**Good Reasons to Skip:**
- "We're using Clerk which handles token refresh automatically"
- "This was already implemented in the existing codebase"
- "After analysis, this feature isn't needed for MVP scope"

**Bad Reasons (Means Agent Got Distracted):**
- "I thought it wasn't necessary"
- "I'll come back to it later"
- No clear answer

If the reason isn't compelling, **redirect the agent back to the task**.

### 3. **Enforce Acceptance Criteria Checks**

Before marking anything complete, make the agent **double-check acceptance criteria**:

```
You: "Before marking this complete, go through each acceptance 
     criterion for the user authentication story and confirm 
     it's met. List each one."
```

**Pro Tip:** Make this a habit for every major feature. Don't trust "it's done" without verification.

### 4. **Triple Check Tests**

Both user tests and unit tests are non-negotiable:

```
You: "Show me:
     1. The unit tests for this authentication module
     2. The user flow test covering login/signup
     
     If either is missing, they need to be written before 
     we mark this task complete."
```

**Testing Hierarchy:**
1. Unit tests for core logic
2. Integration tests for API endpoints
3. E2E tests for critical user flows

Don't let the agent skip testing. Quality > Speed.

### 5. **Know When to Start Fresh**

If your agent starts degrading in performance:
- Giving vague answers
- Skipping important steps
- Making sloppy mistakes
- Losing context of the spec

**Solution:** Spin up a new chat/tab with a fresh context window.

```
New Chat: "I'm working on [project name]. Here's the spec: 
          [paste spec]. I've completed Phase 1 and 2. 
          Let's continue with Phase 3: [specific section]."
```

---

## Practical Workflow Pattern

### Recommended Agent Management Flow:

1. **Start of Session**
   ```
   "Here's our spec: [paste/link]. We're currently on Phase 2, 
    Task 3. Let's work on the next unchecked item."
   ```

2. **Before Starting Each Task**
   ```
   "Mark this task as [→] in progress. Show me the updated 
    checklist so we're aligned."
   ```

3. **During Implementation**
   - Check in regularly
   - Ask agent to summarize what it's building
   - Verify it matches the spec requirements

4. **Before Marking Complete**
   ```
   "Before we check this off:
    1. Review each acceptance criterion
    2. Show me the tests
    3. Confirm no shortcuts were taken
    
    Then mark it [✓] and update the checklist."
   ```

5. **Every 5-10 Tasks**
   ```
   "Show me the full updated spec with all our progress 
    marked. Let's make sure nothing was missed."
   ```

---

## Working with Generated Specs

### Reading the Output

Specs are organized hierarchically:
1. **Executive Summary** - Project overview
2. **Features** - Organized by category
3. **Milestones** - Grouped implementation phases
4. **User Stories** - Detailed requirements with acceptance criteria
5. **Tasks** - Granular checklist items

### Opening Specs in Agents

**All agents support deep links** - click the "Open in [Agent]" button on your spec page.

**For Cursor:**
```
cursor://file?url=YOUR_SPEC_URL
```
Opens spec directly in Cursor - no manual paste needed.

**For Lovable:**
```
https://lovable.dev/projects/create?template=YOUR_SPEC_URL
```
Creates new project with your spec as context.

**For Bolt/v0:**
Similar deep link support - buttons available on spec page.

**For Claude Desktop (MCP):**
Spec URL is automatically accessible through MCP integration.

### Iterating on Specs

You can regenerate specs with updates:

```json
{
  "input": "Add OAuth social login with Google and GitHub",
  "currentContext": "[paste previous spec or describe existing features]"
}
```

This generates an **incremental spec** for the new features.

---

## Agent-Specific Tips

### Cursor Tips
- **Deep Link:** Use `cursor://file?url=SPEC_URL` for instant opening
- Keep spec panel open while developing
- Reference specific task IDs when asking questions
- Use spec sections as cursor rules

### Lovable Tips
- **Deep Link:** `https://lovable.dev/projects/create?template=SPEC_URL`
- Spec automatically loads as project context
- Break large specs into phases
- Focus on one milestone at a time

### Bolt Tips
- Use "Open in Bolt" button from spec page
- Works best with smaller, focused feature sets
- Reference spec sections for specific features

### Claude Desktop (MCP) Tips
- Spec access is automatic through MCP
- Leverage Claude's long context window
- Ask for implementation strategy before coding
- Use spec to keep agent aligned

### v0 Tips
- Extract UI/component sections from spec
- Use deep link from spec page
- Generate components matching overall design system

---

## Common Pitfalls to Avoid

### ❌ Treating Spec as Static
Don't generate once and forget. Actively use it to manage progress.

### ❌ Letting Agent Run Unsupervised
Check in frequently. Agents drift without human oversight.

### ❌ Skipping the "Why" Conversation
If tasks are skipped, understand why. Don't assume agent knows best.

### ❌ Ignoring Test Requirements
Testing is in the spec for a reason. Don't let agent skip it.

### ❌ Not Updating Progress
Keep the checklist current. It's your source of truth.

---

## Success Metrics

You're using the spec effectively when:
- ✅ Every task has a clear status marker
- ✅ Agent asks permission before skipping tasks
- ✅ Acceptance criteria are verified before completion
- ✅ Tests exist for all major features
- ✅ You can see progress at a glance
- ✅ Scope creep is caught early
- ✅ Nothing falls through the cracks

---

## Context Engineering Principles

### The Spec as Optimal Agent Context

Your generated spec is professionally engineered context that:

1. **Hierarchical Structure** - Agents can navigate from high-level (milestones) to granular (subtasks)
2. **Clear Boundaries** - Acceptance criteria define success, task tracking defines scope
3. **Architectural Grounding** - Diagrams prevent agents from inventing non-existent systems
4. **Progressive Disclosure** - Agents receive exactly the context depth they need
5. **Verifiable Checkpoints** - Task completion is objectively verifiable

### How to Maximize Context Quality

**Load the entire spec at session start:**
```
"Here's our complete specification: [paste/link]
We're implementing Phase 2, Story 2.3. 
Let's start with the first unchecked subtask."
```

This gives the agent:
- Full architectural context
- Phase relationships
- Technical constraints
- Success criteria

**Reference specific sections:**
```
"According to Story 1.2, Task 3 in the spec, implement the JWT 
authentication middleware with the acceptance criteria listed."
```

Specific references anchor the agent to engineered context.

**Use task IDs as context anchors:**
```
"Before we continue, reference Task 2.1.4 in the spec. 
Does your implementation match the acceptance criteria?"
```

Task IDs provide unambiguous context pointers.

### Context Engineering vs. Prompt Engineering

| Prompt Engineering | Context Engineering |
|-------------------|---------------------|
| Craft perfect prompts | Generate perfect structure |
| Iterative refinement | Automated professional quality |
| Lost in chat history | Persistent, navigable |
| No verification system | Built-in acceptance criteria |
| Manual task breakdown | Automatic decomposition |
| Tribal knowledge | Documented, shareable |

**With Architect API, you engineer context once, use it forever.**

---

## The Bottom Line

> **The spec makes you a better context engineer, not a better coder.**

Your job shifts from:
- ~~Writing code~~ → Engineering agent context
- ~~Debugging syntax~~ → Ensuring requirements are met
- ~~Crafting prompts~~ → Managing structured constraints
- ~~Architecture decisions~~ → Following engineered architecture
- ~~Feature planning~~ → Feature verification

This is the paradigm shift: **Context Engineering > Prompt Engineering**.

Let the agent handle the code. You handle the context boundaries and quality control.
```

---

### **guides/choosing-spec-level.mdx**

```markdown
# Choosing Between Fast Spec and Deep Spec

## Quick Decision Matrix

| Your Project | Recommended | Why |
|--------------|-------------|-----|
| MVP or prototype | **Fast Spec** | Milestones + Stories sufficient |
| Personal project | **Fast Spec** | No need for granular subtasks |
| Small team (<5) | **Fast Spec** | Stories provide enough detail |
| Enterprise application | **Deep Spec** | Need subtasks for team coordination |
| Complex system | **Deep Spec** | Detailed acceptance criteria required |
| Mission-critical | **Deep Spec** | Subtask-level planning critical |
| Large team (5+) | **Deep Spec** | Subtasks enable better task distribution |

## Fast Spec: When to Use

**Structure:** Milestones → User Stories

**Best for:**
- MVPs and prototypes
- Personal/side projects
- Rapid iteration workflows
- Solo developers
- When you'll figure out implementation details as you go

**What you get:**
- High-level milestones
- User stories for each feature
- Basic acceptance criteria
- No granular subtasks

**Cost:** 10 generations

## Deep Spec: When to Use

**Structure:** Milestones → User Stories with Acceptance Criteria → Granular Subtasks

**Best for:**
- Enterprise applications
- Complex architectures
- Team coordination
- Mission-critical systems
- When you need implementation-level planning

**What you get:**
- Detailed milestones
- User stories with comprehensive acceptance criteria
- **Granular implementation subtasks**
- Task-level breakdown for delegation

**Cost:** 50 generations

## Can I Upgrade?

[Guidance on generating deep spec after fast spec]
```

---

### **examples/new-project.mdx**

```markdown
# Example: Starting a New Project

## Input

```json
{
  "input": "Build a SaaS project management tool with kanban boards, sprint planning, time tracking, team collaboration, and integrations with Slack and GitHub. Include user authentication with teams and roles.",
  "outputFormat": "url"
}
```

## Generated Output Preview

[Excerpt from actual generated spec showing structure]

## Using with Agents

### With Cursor
[Instructions and screenshot]

### With Lovable
[Instructions and screenshot]

### With Bolt
[Instructions and screenshot]
```

---

### **examples/feature-addition.mdx**

```markdown
# Example: Adding Features to Existing Project

[Similar structure to new-project]
```

---

### **examples/sample-output.mdx**

```markdown
# Sample Generated Specifications

## Understanding the Spec Output

### File Format
All specifications are generated as comprehensive markdown files that include:
- Executive summary
- Feature breakdown
- Technical architecture
- Implementation tasks with checkboxes
- Milestones and estimates
- User stories with acceptance criteria

### Task Tracking System

Every spec includes a **task tracking legend** at the top:

```markdown
# Task Status Legend
- [ ] To Do
- [→] In Progress
- [✓] Complete
- [\] Skipped (with reason)
```

This allows you to track progress as your agent implements features.

### Example Task Structure

```markdown
## Phase 1: Core Authentication

- [ ] Set up user authentication system
  - [ ] Implement JWT token generation
  - [ ] Create login/signup endpoints
  - [ ] Add password hashing with bcrypt
  
- [ ] Implement role-based access control
  - [ ] Create user roles table
  - [ ] Add middleware for permission checking
```

As your agent completes tasks, update the status:
- `[ ]` → `[→]` when starting
- `[→]` → `[✓]` when complete
- `[ ]` → `[\]` if skipping (add reason why)

---

## Example 1: E-Commerce Platform (Fast Spec)

[Full or substantial excerpt from real spec]

---

## Example 2: Healthcare App (Deep Spec)

[Full or substantial excerpt from real spec]

---

## Spec Structure Breakdown

### 1. Executive Summary
High-level overview of the project scope and objectives.

### 2. Feature Categories
Organized breakdown of all features by domain (Auth, Core Features, Admin, etc.)

### 3. Technical Stack Recommendations
Suggested technologies based on project requirements.

### 4. Implementation Phases
Logical grouping of features into development milestones with effort estimates.

### 5. User Stories
Detailed user stories with acceptance criteria for each major feature.

### 6. Task Checklist
Granular, actionable tasks organized by phase with checkbox tracking.

### 7. Risk Analysis
Potential technical challenges and mitigation strategies.
```

---

### **pricing.mdx**

```markdown
# Pricing & Limits

## Generation Costs

### Fast Spec
- **Cost:** 10 generations per request
- **Generation Time:** ~30-45 seconds
- **Best For:** MVPs, prototypes, rapid iteration

### Deep Spec
- **Cost:** 50 generations per request
- **Generation Time:** ~5-15 minutes
- **Best For:** Complex systems, enterprise applications

## What is a "Generation"?

[Explanation of generation system]

## Subscription Tiers

### Trial (Free)
- **1 total generation** (daily and monthly)
- One free Fast Spec to try
- No credit card required

### Solo Plus ($25/month)
- **20 generations/day**
- **200 generations/month**
- Access to Fast Spec
- Individual API key

### Solo Premium ($49/month) **← Recommended**
- **Unlimited daily generations**
- **500 generations/month**
- Access to Fast Spec & Deep Spec
- Full API and MCP access

### Enterprise Premium ($99/month)
- **Unlimited daily generations**
- **1,000 generations/month**
- Organization-wide API keys
- Team collaboration
- Priority support

### Enterprise Advanced (Custom)
- **Unlimited daily generations**
- **2,500+ generations/month**
- Everything in Enterprise Premium
- Dedicated support
- Custom integrations

**Note:** All "unlimited daily" tiers still have monthly caps. Purchase prototype credits for additional capacity.

## Rate Limits

[Information on daily limits, async mode, etc.]

## Fair Use Policy

[Guidelines for appropriate usage]
```

---

### **faq.mdx**

```markdown
# Frequently Asked Questions

## General

### Why generate a spec instead of just building?

**The Context Engineering Problem:**

AI agents work best with structured, bounded context. Conversational context is:
- Unstructured (scattered across messages)
- Ambiguous (no clear acceptance criteria)
- Inefficient (verbose, redundant)
- Ephemeral (lost when session ends)

**Architect API solves this by providing engineered context:**
- ✅ Structured hierarchy (milestones → stories → subtasks)
- ✅ Clear boundaries (acceptance criteria, task tracking)
- ✅ Efficient encoding (dense, navigable)
- ✅ Persistent (synced to pre.dev)

A comprehensive spec ensures your agent:
- Knows all required features upfront
- Makes better architectural decisions
- Stays within defined boundaries
- Delivers exactly what's specified

**You're not just generating docs - you're engineering optimal agent context.**

### How detailed are the specifications?

**Fast Spec:** Milestones → User Stories with basic acceptance criteria
**Deep Spec:** Milestones → User Stories with detailed Acceptance Criteria → Granular implementation Subtasks

Deep Spec provides task-level breakdown suitable for delegating work across large teams.

### What happens when I generate a spec?

Each API request creates a **synced project on pre.dev** where you can:
- Visualize system architecture with interactive diagrams
- Continue refining your spec through the web UI
- Track implementation progress with team members
- View version history of changes

The returned URL is not just a static markdown file - it's a live project workspace.

### Can I edit the generated spec?

Yes! Edit the markdown locally OR log into pre.dev and refine your spec through the web UI. All changes sync to your project.

### What if my project requirements change?

Use the `currentContext` parameter to generate incremental specs for new features that respect your existing architecture. Your pre.dev project will be updated with the new features added to the existing spec.

## Choosing Spec Levels

### Which spec level should I choose?

- **Fast Spec (10 gen):** MVPs, prototypes, small-medium projects
- **Deep Spec (50 gen):** Complex systems, enterprise apps, large teams

[More details]

### Can I upgrade from Fast to Deep Spec?

[Answer]

## Integration

### Can I use this with [Agent Name]?

Yes! Output is universal markdown that works with:
- Cursor
- Lovable
- Bolt
- v0
- Claude Desktop
- Any agent that accepts text context

### How do I integrate with my CI/CD pipeline?

[Answer with examples]

### Does this replace writing PRDs?

[Answer about complementary nature]

## Technical

### What format is the output?

Comprehensive markdown files that include:
- Feature breakdown
- Technical architecture
- Milestones with effort estimates
- User stories
- Risk analysis

### How long do specs take to generate?

- Fast Spec: 30-40 seconds (sync), instant (async)
- Deep Spec: 2-3 minutes (sync), instant (async)

**Significantly faster than competitors:**
- Factory AI Specification Mode: Several minutes for comparable depth
- Claude Code: No structured spec generation

### What happens if generation fails?

[Error handling and retry information]

## Pricing & Access

### Is there a free trial?

Yes! New solo users get 1 free Fast Spec.

### What's included in Solo Premium?

[Detailed tier information]

### Do I need a subscription for MCP?

[Answer about MCP access]

## API & MCP

### What's the difference between API and MCP?

- **API:** Programmatic access, batch processing, CI/CD integration
- **MCP:** Interactive, conversational, seamless agent integration

Both use the same underlying spec generation.

### Is the API stable?

This is a research preview. Core functionality is stable, but expect improvements and enhancements over time.

## Privacy & Security

### What happens to my project data?

[Privacy policy specifics]

### Can I delete my generated specs?

[Data retention and deletion policy]

## Support

### How do I get help?

- [Documentation](/)
- [Discord Community](#)
- [Support Email](#)
- [Status Page](#)

### How do I report bugs or request features?

[Information on feedback channels]
```

---

## 🎨 Styling Notes

### Code Blocks
- Use syntax highlighting
- Include copy buttons
- Show both request and response

### Callouts
Use Mintlify callout components:
- `<Tip>` for best practices
- `<Warning>` for important notes
- `<Note>` for additional context
- `<Info>` for general information

### Examples
- Always include working, copy-paste ready examples
- Show multiple languages (cURL, Python, JavaScript)
- Include both success and error cases

### Navigation
- Clear next steps at bottom of each page
- Related pages sidebar
- Searchable content

---

## ✅ Content Completion Checklist

- [ ] All code examples tested and working
- [ ] Consistent tone and voice throughout
- [ ] All CTAs present and compelling
- [ ] Screenshots/diagrams for visual sections
- [ ] Internal links all working
- [ ] SEO optimization (titles, descriptions)
- [ ] Mobile-responsive formatting
- [ ] Accessibility compliance
- [ ] Real example specs included
- [ ] User testing completed

---

This outline provides the complete structure. Next step: Fill in each section with actual content.

