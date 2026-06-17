import ast
import re
from pathlib import Path
from typing import Any


CODE_EXTENSIONS = {
    ".py",
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".html",
    ".css",
}


IMPORT_RE = re.compile(
    r"""(?:import\s+(?:type\s+)?(?:[\w*{}\s,]+?\s+from\s+)?["']([^"']+)["']|from\s+["']([^"']+)["'])"""
)
CLASS_RE = re.compile(r"\bclass\s+([A-Z][A-Za-z0-9_]*)")
INTERFACE_RE = re.compile(r"\binterface\s+([A-Z][A-Za-z0-9_]*)")
FUNCTION_RE = re.compile(
    r"\b(?:function\s+([A-Za-z_][A-Za-z0-9_]*)|const\s+([A-Z][A-Za-z0-9_]*)\s*=\s*(?:\([^)]*\)|[A-Za-z_][A-Za-z0-9_]*)\s*=>)"
)
COMPONENT_RE = re.compile(
    r"\b(?:function|const)\s+([A-Z][A-Za-z0-9_]*)\b"
)
HTML_TAG_RE = re.compile(r"<([a-zA-Z][A-Za-z0-9-]*)\b")


def _symbol(
    name: str,
    symbol_type: str,
    line: int | None = None,
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    data: dict[str, Any] = {
        "name": name,
        "type": symbol_type,
    }
    if line is not None:
        data["line"] = line
    if metadata:
        data.update(metadata)
    return data


def _line_number(content: str, index: int) -> int:
    return content.count("\n", 0, index) + 1


def _analyze_python(content: str) -> list[dict[str, Any]]:
    symbols: list[dict[str, Any]] = []
    tree = ast.parse(content)

    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                symbols.append(_symbol(alias.name, "import", node.lineno))
        elif isinstance(node, ast.ImportFrom):
            module = node.module or ""
            for alias in node.names:
                imported = f"{module}.{alias.name}" if module else alias.name
                symbols.append(_symbol(imported, "import", node.lineno))
        elif isinstance(node, ast.ClassDef):
            symbols.append(_symbol(node.name, "class", node.lineno))
        elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            symbols.append(_symbol(node.name, "method", node.lineno))

    return symbols


def _analyze_script(content: str, extension: str) -> list[dict[str, Any]]:
    symbols: list[dict[str, Any]] = []

    for match in IMPORT_RE.finditer(content):
        name = match.group(1) or match.group(2)
        if name:
            symbols.append(_symbol(name, "import", _line_number(content, match.start())))

    for match in CLASS_RE.finditer(content):
        symbols.append(_symbol(match.group(1), "class", _line_number(content, match.start())))

    for match in INTERFACE_RE.finditer(content):
        symbols.append(_symbol(match.group(1), "interface", _line_number(content, match.start())))

    for match in FUNCTION_RE.finditer(content):
        name = match.group(1) or match.group(2)
        if not name:
            continue
        symbol_type = "component" if extension in {".tsx", ".jsx"} and name[0].isupper() else "method"
        symbols.append(_symbol(name, symbol_type, _line_number(content, match.start())))

    for match in COMPONENT_RE.finditer(content):
        name = match.group(1)
        if extension in {".tsx", ".jsx"} and not any(
            s["name"] == name and s["type"] == "component" for s in symbols
        ):
            symbols.append(_symbol(name, "component", _line_number(content, match.start())))

    return symbols


def _analyze_html(content: str) -> list[dict[str, Any]]:
    seen: set[str] = set()
    symbols: list[dict[str, Any]] = []

    for match in HTML_TAG_RE.finditer(content):
        tag = match.group(1).lower()
        if tag in seen:
            continue
        seen.add(tag)
        symbols.append(_symbol(tag, "component", _line_number(content, match.start()), {"html_tag": True}))

    return symbols


def analyze_file(path: Path, relative_path: str) -> dict[str, Any]:
    extension = path.suffix.lower()
    analysis = {
        "path": relative_path,
        "extension": extension.lstrip(".") or "unknown",
        "symbols": [],
        "parser": "none",
    }

    if extension not in CODE_EXTENSIONS or not path.is_file():
        return analysis

    content = path.read_text(encoding="utf-8", errors="ignore")

    try:
        if extension == ".py":
            analysis["symbols"] = _analyze_python(content)
            analysis["parser"] = "python-ast"
        elif extension in {".js", ".jsx", ".ts", ".tsx"}:
            analysis["symbols"] = _analyze_script(content, extension)
            analysis["parser"] = "structured-regex"
        elif extension == ".html":
            analysis["symbols"] = _analyze_html(content)
            analysis["parser"] = "structured-regex"
        elif extension == ".css":
            selectors = sorted(set(re.findall(r"([.#][A-Za-z0-9_-]+)\s*[{,]", content)))
            analysis["symbols"] = [_symbol(selector, "component") for selector in selectors]
            analysis["parser"] = "structured-regex"
    except SyntaxError as exc:
        analysis["parser"] = "parse-error"
        analysis["error"] = str(exc)

    return analysis


def analyze_project(project_path: str | Path) -> list[dict[str, Any]]:
    root = Path(project_path)
    analyses: list[dict[str, Any]] = []

    for path in root.rglob("*"):
        if not path.is_file():
            continue
        relative_path = path.relative_to(root).as_posix()
        analyses.append(analyze_file(path, relative_path))

    return analyses
