from typing import List, Dict, Any
import json
import httpx
from bs4 import BeautifulSoup
from duckduckgo_search import DDGS
from src.config import SEARCH_MAX_RESULTS

def web_search(query: str, max_results: int = None) -> str:
    """
    Search the web using DuckDuckGo.
    
    Args:
        query: The search query.
        max_results: The maximum number of results to return.
        
    Returns:
        A formatted string of search results.
    """
    try:
        if max_results is None:
            max_results = SEARCH_MAX_RESULTS
        results = DDGS().text(query, max_results=max_results)
        if not results:
            return "No results found."
            
        formatted_results = []
        for res in results:
            formatted_results.append({
                "title": res.get("title"),
                "url": res.get("href"),
                "snippet": res.get("body"),
            })

        return json.dumps(formatted_results, indent=2)
    except Exception as e:
        return f"Error performing web search: {e}"


def fetch_url(url: str, max_chars: int = 4000) -> str:
    try:
        response = httpx.get(url, timeout=20.0, follow_redirects=True)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        for tag in soup(["script", "style", "noscript"]):
            tag.decompose()
        text = " ".join(soup.stripped_strings)
        if len(text) > max_chars:
            text = text[:max_chars] + "..."
        title = soup.title.string.strip() if soup.title and soup.title.string else ""
        payload = {"title": title, "url": url, "content": text}
        return json.dumps(payload, indent=2)
    except Exception as e:
        return f"Error fetching URL: {e}"

TOOLS_SCHEMA = [
    {
        "type": "function",
        "function": {
            "name": "web_search",
            "description": "Search the web for current information, news, or facts using DuckDuckGo.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The specific search query."
                    },
                    "max_results": {
                        "type": "integer",
                        "description": "Number of results to return (default 3, max 5)."
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "fetch_url",
            "description": "Fetch a URL and extract readable text content.",
            "parameters": {
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "The URL to fetch."
                    },
                    "max_chars": {
                        "type": "integer",
                        "description": "Maximum characters to return (default 4000)."
                    }
                },
                "required": ["url"]
            }
        }
    },
]

AVAILABLE_TOOLS = {
    "web_search": web_search,
    "fetch_url": fetch_url,
}
