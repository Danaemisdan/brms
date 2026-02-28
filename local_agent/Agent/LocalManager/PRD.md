# Local Manager Agent (macOS) PRD

## Overview
Local AI manager that accepts Telegram commands and autonomously executes tasks on the macOS host. It performs web search + scraping and automates Slack/WhatsApp with AppleScript UI scripting and a visible cursor fallback.

## Goals
- Privacy-first local inference with GGUF.
- Telegram conversational interface with async status updates.
- Autonomous multi-step execution with clear visibility.
- Stealthy UI automation via AppleScript/Accessibility, fallback to keyboard/mouse only when needed.
- High reliability for WhatsApp and Slack messaging.

## Non-Goals
- Multi-user access beyond whitelist.
- Cloud LLMs or third-party orchestration.
- Full RPA for arbitrary apps outside targeted support in v1.

## Personas
- Single trusted user with local admin access.

## User Stories
- "Search X and summarize top sources."
- "Message John on WhatsApp that I am 10 minutes late."
- "Post status update in Slack #team channel."

## Functional Requirements
- Telegram bot input and async progress updates.
- Strict user ID whitelist.
- Local LLM reasoning and tool selection.
- Web search + content scraping + summarization.
- macOS UI automation for WhatsApp and Slack.
- Confirmation gate for external message send.

## Non-Functional Requirements
- Local inference only.
- Minimal latency with fast GGUF models.
- Stealth: no cursor movement unless fallback.
- Reliability: retries and error surfaced in Telegram.

## Security & Privacy
- No third-party LLM APIs.
- Logs must avoid storing full message bodies by default.
- Secrets stored in `.env`.

## Permissions
- macOS Accessibility permission required.
- Automation permission for `osascript`.
- Optional Screen Recording if OCR fallback is enabled.

## Risks
- UI layout changes, OCR errors, LLM hallucinated tool args, Telegram disconnects.

## Milestones
- Phase 1: LLM backend and Telegram orchestration.
- Phase 2: Web search + scrape tool.
- Phase 3: WhatsApp/Slack AppleScript automation with fallback.
- Phase 4: Full agent loop + confirmation gating.

## Architecture Decisions
### LLM Backend
- `llama.cpp` server with GGUF model.
- OpenAI-compatible HTTP endpoint at `http://127.0.0.1:8080/v1/chat/completions`.

### Tool Invocation Protocol
- Strict JSON output from the model:
  - `{ "type": "tool_call", "tool_name": "web_search", "arguments": { ... } }`
  - `{ "type": "final", "content": "..." }`

### Stealth Automation
- Primary: AppleScript UI scripting and keystrokes.
- Fallback: keyboard/mouse automation via `pyautogui`.
- Always notify in Telegram when fallback is used.

### Confirmation Policy
- Any external messaging action requires explicit approval.
