from __future__ import annotations

import hashlib
import json
from pathlib import Path


PROVENANCE_HASH_SCHEME = "combat-provenance-sha256-v2"
TEXT_EXTENSIONS = {".bat", ".css", ".html", ".js", ".md", ".mjs", ".ps1", ".py", ".sh", ".txt"}


def provenance_bytes(path: Path) -> bytes:
    suffix = path.suffix.lower()
    if suffix == ".json":
        value = json.loads(path.read_text(encoding="utf-8-sig"))
        return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    if suffix in TEXT_EXTENSIONS:
        text = path.read_text(encoding="utf-8-sig").replace("\r\n", "\n").replace("\r", "\n")
        return text.encode("utf-8")
    return path.read_bytes()


def provenance_sha256(path: Path) -> str:
    return hashlib.sha256(provenance_bytes(path)).hexdigest()
