import json
import os
import shutil
import subprocess
import tempfile
from typing import Optional, Tuple, List

from src.config import VLM_ENABLED, VLM_CLI_PATH, VLM_MODEL, VLM_MMPROJ, VLM_MAX_DIM


def _extract_json(text: str) -> Optional[dict]:
    if not text:
        return None
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None
    snippet = text[start : end + 1]
    try:
        return json.loads(snippet)
    except Exception:
        return None


def _image_size(path: str) -> Optional[Tuple[int, int]]:
    try:
        result = subprocess.run(
            ["sips", "-g", "pixelWidth", "-g", "pixelHeight", path],
            capture_output=True,
            text=True,
            check=True,
        )
        width = None
        height = None
        for line in result.stdout.splitlines():
            if "pixelWidth" in line:
                width = int(line.split(":")[-1].strip())
            if "pixelHeight" in line:
                height = int(line.split(":")[-1].strip())
        if width and height:
            return width, height
    except Exception:
        return None
    return None


def _resize_image(path: str) -> str:
    if not VLM_MAX_DIM:
        return path
    resized = os.path.join(tempfile.gettempdir(), f"lmgr-vlm-{os.path.basename(path)}")
    try:
        subprocess.run(["sips", "-Z", str(VLM_MAX_DIM), path, "--out", resized], capture_output=True, check=True)
        return resized if os.path.exists(resized) else path
    except Exception:
        return path


def _run_vlm(image_path: str, prompt: str) -> Tuple[Optional[dict], str]:
    cmd = [
        VLM_CLI_PATH,
        "-m", VLM_MODEL,
        "--mmproj", VLM_MMPROJ,
        "--image", image_path,
        "-p", prompt,
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True, timeout=20)
        output = result.stdout.strip()
    except Exception as exc:
        return None, f"VLM execution failed: {exc}"
    data = _extract_json(output)
    return data, output


def _scale_bbox(bbox: Tuple[int, int, int, int], scale_x: float, scale_y: float) -> Tuple[int, int, int, int]:
    x, y, w, h = bbox
    return (
        int(round(x * scale_x)),
        int(round(y * scale_y)),
        int(round(w * scale_x)),
        int(round(h * scale_y)),
    )


def locate_contact_bbox(image_path: str, target_text: str, context_hint: str = "") -> Tuple[Optional[Tuple[int, int, int, int]], float, str]:
    if not VLM_ENABLED:
        return None, 0.0, "VLM not enabled"
    if not image_path or not os.path.exists(image_path):
        return None, 0.0, "Image not found"
    if not VLM_MODEL or not VLM_MMPROJ:
        return None, 0.0, "VLM model or mmproj not configured"
    if not shutil.which(VLM_CLI_PATH):
        return None, 0.0, f"VLM CLI not found: {VLM_CLI_PATH}"

    hint = f" Context: {context_hint}." if context_hint else ""
    prompt = (
        "You are given a screenshot of a chat list UI."
        f"{hint} "
        f"Find the row for contact named '{target_text}'. "
        "Return JSON only with keys: bbox and confidence. "
        "bbox is [x,y,w,h] in pixels relative to the image. "
        "If not found, return {\"bbox\": null, \"confidence\": 0}."
    )

    resized = _resize_image(image_path)
    data, output = _run_vlm(resized, prompt)
    if not data:
        return None, 0.0, output

    bbox = data.get("bbox")
    confidence = float(data.get("confidence", 0.0) or 0.0)
    if not bbox or not isinstance(bbox, list) or len(bbox) != 4:
        return None, confidence, output

    try:
        x, y, w, h = [int(round(float(v))) for v in bbox]
    except Exception:
        return None, confidence, output

    scaled = (x, y, w, h)
    if resized != image_path:
        orig_size = _image_size(image_path)
        resized_size = _image_size(resized)
        if orig_size and resized_size and resized_size[0] and resized_size[1]:
            scale_x = orig_size[0] / resized_size[0]
            scale_y = orig_size[1] / resized_size[1]
            scaled = _scale_bbox((x, y, w, h), scale_x, scale_y)

    return scaled, confidence, output


def locate_candidates(image_path: str, target_text: str, context_hint: str = "", max_candidates: int = 3):
    if not VLM_ENABLED:
        return [], "VLM not enabled"
    if not image_path or not os.path.exists(image_path):
        return [], "Image not found"
    if not VLM_MODEL or not VLM_MMPROJ:
        return [], "VLM model or mmproj not configured"
    if not shutil.which(VLM_CLI_PATH):
        return [], f"VLM CLI not found: {VLM_CLI_PATH}"

    hint = f" Context: {context_hint}." if context_hint else ""
    prompt = (
        "You are given a screenshot of a chat list UI."
        f"{hint} "
        f"Find up to {max_candidates} candidate rows that could match '{target_text}'. "
        "Return JSON only with key candidates which is a list of objects with keys bbox, label, confidence. "
        "bbox is [x,y,w,h] in pixels relative to the image. "
        "If none, return {\"candidates\": []}."
    )

    resized = _resize_image(image_path)
    data, output = _run_vlm(resized, prompt)
    if not data:
        return [], output

    orig_size = _image_size(image_path)
    resized_size = _image_size(resized) if resized != image_path else orig_size
    scale_x = 1.0
    scale_y = 1.0
    if orig_size and resized_size and resized_size[0] and resized_size[1]:
        scale_x = orig_size[0] / resized_size[0]
        scale_y = orig_size[1] / resized_size[1]

    candidates = []
    seen = set()
    for item in data.get("candidates", []) or []:
        bbox = item.get("bbox")
        label = item.get("label") or ""
        confidence = float(item.get("confidence", 0.0) or 0.0)
        if not bbox or not isinstance(bbox, list) or len(bbox) != 4:
            continue
        try:
            x, y, w, h = [int(round(float(v))) for v in bbox]
        except Exception:
            continue
        scaled = _scale_bbox((x, y, w, h), scale_x, scale_y) if (scale_x != 1.0 or scale_y != 1.0) else (x, y, w, h)
        key = tuple(scaled)
        if key in seen:
            continue
        seen.add(key)
        candidates.append({"bbox": scaled, "label": label, "confidence": confidence})

    return candidates, output


def locate_ui_element_bbox(image_path: str, description: str):
    if not VLM_ENABLED:
        return None, 0.0, "VLM not enabled"
    if not image_path or not os.path.exists(image_path):
        return None, 0.0, "Image not found"
    if not VLM_MODEL or not VLM_MMPROJ:
        return None, 0.0, "VLM model or mmproj not configured"
    if not shutil.which(VLM_CLI_PATH):
        return None, 0.0, f"VLM CLI not found: {VLM_CLI_PATH}"

    prompt = (
        "You are given a screenshot of an app UI. "
        f"Find the UI element: {description}. "
        "Return JSON only with keys: bbox and confidence. "
        "bbox is [x,y,w,h] in pixels relative to the image. "
        "If not found, return {\"bbox\": null, \"confidence\": 0}."
    )

    resized = _resize_image(image_path)
    data, output = _run_vlm(resized, prompt)
    if not data:
        return None, 0.0, output

    bbox = data.get("bbox")
    confidence = float(data.get("confidence", 0.0) or 0.0)
    if not bbox or not isinstance(bbox, list) or len(bbox) != 4:
        return None, confidence, output

    try:
        x, y, w, h = [int(round(float(v))) for v in bbox]
    except Exception:
        return None, confidence, output

    scaled = (x, y, w, h)
    if resized != image_path:
        orig_size = _image_size(image_path)
        resized_size = _image_size(resized)
        if orig_size and resized_size and resized_size[0] and resized_size[1]:
            scale_x = orig_size[0] / resized_size[0]
            scale_y = orig_size[1] / resized_size[1]
            scaled = _scale_bbox((x, y, w, h), scale_x, scale_y)

    return scaled, confidence, output
