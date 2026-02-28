import time
import uuid
from dataclasses import dataclass, field
from typing import Dict, Optional


@dataclass
class PendingTask:
    task_id: str
    user_id: int
    chat_id: int
    tool_name: str
    arguments: dict
    preview: str
    created_at: float
    meta: dict = field(default_factory=dict)


@dataclass
class ComposeState:
    user_id: int
    app_name: Optional[str] = None
    contact_name: Optional[str] = None
    message: Optional[str] = None


_PENDING: Dict[str, PendingTask] = {}
_COMPOSE: Dict[int, ComposeState] = {}
_LAST_CONTACT: Dict[int, str] = {}
_LAST_APP: Dict[int, str] = {}
_LAST_MESSAGE: Dict[int, str] = {}


def create_pending(user_id: int, chat_id: int, tool_name: str, arguments: dict, preview: str, meta: Optional[dict] = None) -> PendingTask:
    task_id = uuid.uuid4().hex[:8]
    task = PendingTask(
        task_id=task_id,
        user_id=user_id,
        chat_id=chat_id,
        tool_name=tool_name,
        arguments=arguments,
        preview=preview,
        created_at=time.time(),
        meta=meta or {},
    )
    _PENDING[task_id] = task
    return task


def get_pending(task_id: str) -> Optional[PendingTask]:
    return _PENDING.get(task_id)


def remove_pending(task_id: str) -> None:
    _PENDING.pop(task_id, None)


def get_compose(user_id: int) -> Optional[ComposeState]:
    return _COMPOSE.get(user_id)


def set_compose(state: ComposeState) -> None:
    _COMPOSE[state.user_id] = state


def clear_compose(user_id: int) -> None:
    _COMPOSE.pop(user_id, None)


def set_last_contact(user_id: int, contact_name: str) -> None:
    if contact_name:
        _LAST_CONTACT[user_id] = contact_name


def get_last_contact(user_id: int) -> Optional[str]:
    return _LAST_CONTACT.get(user_id)


def set_last_app(user_id: int, app_name: str) -> None:
    if app_name:
        _LAST_APP[user_id] = app_name


def get_last_app(user_id: int) -> Optional[str]:
    return _LAST_APP.get(user_id)


def set_last_message(user_id: int, message: str) -> None:
    if message:
        _LAST_MESSAGE[user_id] = message


def get_last_message(user_id: int) -> Optional[str]:
    return _LAST_MESSAGE.get(user_id)


def get_latest_pending_for_user(user_id: int, tool_name: Optional[str] = None) -> Optional[PendingTask]:
    tasks = [
        t for t in _PENDING.values()
        if t.user_id == user_id and (tool_name is None or t.tool_name == tool_name)
    ]
    if not tasks:
        return None
    return max(tasks, key=lambda t: t.created_at)
