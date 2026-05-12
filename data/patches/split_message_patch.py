#!/usr/bin/env python3
"""
Monkey-patch nanobot's split_message to split by double newlines.
This allows the bot to send multiple short messages instead of one long message.
"""
import importlib
import sys


def patched_split_message(content: str, max_len: int = 2000) -> list[str]:
    """Split content into chunks, first by double newlines, then by max_len."""
    if not content:
        return []

    # First split by double newlines (paragraph breaks)
    paragraphs = content.split("\n\n")
    chunks: list[str] = []

    for para in paragraphs:
        para = para.strip()
        if not para:
            continue

        # Replace single newlines with spaces within a paragraph
        para = para.replace("\n", " ").strip()
        if not para:
            continue

        if len(para) <= max_len:
            chunks.append(para)
        else:
            # For long paragraphs, split by max_len at word boundaries
            while para:
                if len(para) <= max_len:
                    chunks.append(para)
                    break
                cut = para[:max_len]
                pos = cut.rfind(" ")
                if pos <= 0:
                    pos = max_len
                chunks.append(para[:pos].strip())
                para = para[pos:].strip()

    return chunks if chunks else [content.strip()]


def apply_patch():
    """Apply the monkey-patch to nanobot's split_message function."""
    try:
        from nanobot.utils import helpers
        helpers.split_message = patched_split_message
        print("[patch] split_message patched: splitting by double newlines")

        # Also patch in modules that imported it directly
        for mod_name in list(sys.modules.keys()):
            mod = sys.modules.get(mod_name)
            if mod and hasattr(mod, "split_message"):
                if getattr(mod, "split_message") is not patched_split_message:
                    try:
                        mod.split_message = patched_split_message
                    except (AttributeError, TypeError):
                        pass
    except ImportError:
        print("[patch] nanobot not importable yet, will retry on gateway start")


# Apply patch immediately if nanobot is already imported
apply_patch()
