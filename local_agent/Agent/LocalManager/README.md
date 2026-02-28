# Local Manager Agent (macOS)

Local, privacy-first manager agent controlled via Telegram. It uses a GGUF model running on `llama.cpp`, can perform web search + scraping, and automates Slack/WhatsApp via AppleScript with a cursor fallback.

## Setup

### 1) Python environment
```bash
python3 -m venv venv
source venv/bin/activate
pip install python-telegram-bot httpx duckduckgo-search beautifulsoup4 pyautogui python-dotenv
```

### 2) Configure environment
Copy `.env.example` to `.env` and fill in your values.

### 3) Run llama.cpp server
Example (using your model path):
```bash
./server -m /Users/sanjeevn/Downloads/Agent/Models/Qwen2.5-1.5B-Instruct-Q4_0.gguf --host 127.0.0.1 --port 8080
```

### 4) macOS permissions
- Enable Accessibility for your Python app/terminal.
- Allow Automation for `osascript` if prompted.
- For OCR contact verification, install Tesseract: `brew install tesseract`
- For vision grounding (preferred), install a multimodal model + mmproj and set `VLM_*` env vars.

### 5) Start the bot
```bash
python /Users/sanjeevn/Downloads/Agent/LocalManager/main.py
```

## Usage
- Send a message in Telegram to request a task.
- For external messages, approve with `/approve <task_id>` or cancel with `/cancel <task_id>`.

## Notes
- Cursor fallback uses `pyautogui` and may move the mouse.
- Keep the target app open and logged in for best reliability.
