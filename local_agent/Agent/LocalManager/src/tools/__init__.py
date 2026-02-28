from .search import TOOLS_SCHEMA as SEARCH_SCHEMA, AVAILABLE_TOOLS as SEARCH_TOOLS
from .macos_ui import TOOLS_SCHEMA as MACOS_SCHEMA, AVAILABLE_TOOLS as MACOS_TOOLS
from .amazon_ui import TOOLS_SCHEMA as AMAZON_SCHEMA, AVAILABLE_TOOLS as AMAZON_TOOLS

# Combine all tool schemas
ALL_TOOLS_SCHEMA = SEARCH_SCHEMA + MACOS_SCHEMA + AMAZON_SCHEMA

# Combine all actual tool functions into a single dispatcher dictionary
ALL_TOOLS = {
    **SEARCH_TOOLS,
    **MACOS_TOOLS,
    **AMAZON_TOOLS
}
