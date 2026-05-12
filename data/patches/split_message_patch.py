"""
Monkey-patch nanobot's split_message to split by double newlines.
"""
import sys


def patched_split_message(content: str, max_len: int = 2000) -> list[str]:
    if not content:
        return []
    paragraphs = content.split("\n\n")
    chunks: list[str] = []
    for para in paragraphs:
        para = para.replace("\n", " ").strip()
        if not para:
            continue
        if len(para) <= max_len:
            chunks.append(para)
        else:
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
    try:
        from nanobot.utils import helpers
        helpers.split_message = patched_split_message
        print("[patch] split_message patched: splitting by double newlines")
        for mod_name in list(sys.modules.keys()):
            mod = sys.modules.get(mod_name)
            if mod and hasattr(mod, "split_message"):
                if getattr(mod, "split_message") is not patched_split_message:
                    try:
                        mod.split_message = patched_split_message
                    except (AttributeError, TypeError):
                        pass
    except ImportError:
        pass


apply_patch()
