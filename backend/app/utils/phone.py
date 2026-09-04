import re


PHONE_PATTERN = re.compile(r"^\+?[1-9]\d{6,14}$")


def normalize_phone(value):
    raw = str(value or "").strip()
    compact = re.sub(r"[\s().-]", "", raw)
    if not re.fullmatch(r"\+?\d+", compact):
        return None
    normalized = compact if compact.startswith("+") else f"+{compact}"
    return normalized if PHONE_PATTERN.fullmatch(normalized) else None
