from src.config import LLM_BACKEND, LLAMA_CPP_BASE_URL, LLAMA_CPP_MODEL, LLM_TEMPERATURE, LLM_MAX_TOKENS
from src.llm.llama_cpp_client import LlamaCppClient

_client = None

def get_client():
    global _client
    if _client is not None:
        return _client
    if LLM_BACKEND != "llama_cpp":
        raise ValueError(f"Unsupported LLM_BACKEND: {LLM_BACKEND}")
    _client = LlamaCppClient(
        base_url=LLAMA_CPP_BASE_URL,
        model=LLAMA_CPP_MODEL,
        temperature=LLM_TEMPERATURE,
        max_tokens=LLM_MAX_TOKENS,
    )
    return _client

def chat(messages):
    client = get_client()
    return client.chat(messages)
