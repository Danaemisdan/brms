import httpx


class LlamaCppClient:
    def __init__(self, base_url: str, model: str, temperature: float = 0.2, max_tokens: int = 512, timeout: float = 60.0):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.timeout = timeout

    def chat(self, messages):
        url = f"{self.base_url}/v1/chat/completions"
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
        }
        try:
            response = httpx.post(url, json=payload, timeout=self.timeout)
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]
        except Exception as exc:
            return f"Error communicating with llama.cpp: {exc}"
