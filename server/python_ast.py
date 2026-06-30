"""
Python AST Parser — Extracts structural annotations from Python code.

Reads code from stdin, parses it with ast.parse(), walks the tree,
and outputs a JSON object to stdout with the extracted annotations.

Usage:
    echo "def hello(): pass" | python python_ast.py
"""

import ast
import json
import sys


def extract_annotations(code: str) -> list[dict]:
    """Parse Python code and extract structural annotations."""
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        return {"error": f"SyntaxError: {e.msg} (line {e.lineno})"}

    annotations = []

    for node in ast.walk(tree):
        # Function definitions
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            is_async = isinstance(node, ast.AsyncFunctionDef)
            params = [arg.arg for arg in node.args.args]
            decorators = [_get_decorator_name(d) for d in node.decorator_list]

            details = f"{'Async function' if is_async else 'Function'} \"{node.name}\" with {len(params)} parameter(s)"
            if params:
                details += f": ({', '.join(params)})"
            if decorators:
                details += f" [decorators: {', '.join(decorators)}]"

            annotations.append({
                "type": "function",
                "name": node.name,
                "startLine": node.lineno,
                "endLine": node.end_lineno or node.lineno,
                "details": details,
            })

        # Class definitions
        elif isinstance(node, ast.ClassDef):
            methods = [
                n.name for n in node.body
                if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))
            ]
            bases = [_get_name(b) for b in node.bases]

            details = f'Class "{node.name}"'
            if methods:
                details += f" with methods: [{', '.join(methods)}]"
            if bases:
                details += f", inherits from: [{', '.join(bases)}]"

            annotations.append({
                "type": "class",
                "name": node.name,
                "startLine": node.lineno,
                "endLine": node.end_lineno or node.lineno,
                "details": details,
            })

        # For loops
        elif isinstance(node, ast.For):
            target = _get_name(node.target)
            annotations.append({
                "type": "loop",
                "name": "for",
                "startLine": node.lineno,
                "endLine": node.end_lineno or node.lineno,
                "details": f"For loop iterating with variable '{target}'",
            })

        # While loops
        elif isinstance(node, ast.While):
            annotations.append({
                "type": "loop",
                "name": "while",
                "startLine": node.lineno,
                "endLine": node.end_lineno or node.lineno,
                "details": "While loop",
            })

        # If statements (only top-level, not elif)
        elif isinstance(node, ast.If):
            has_else = bool(node.orelse)
            has_elif = has_else and len(node.orelse) == 1 and isinstance(node.orelse[0], ast.If)
            
            details = "If statement"
            if has_elif:
                details += " with elif branch(es)"
            elif has_else:
                details += " with else branch"

            annotations.append({
                "type": "conditional",
                "name": "if",
                "startLine": node.lineno,
                "endLine": node.end_lineno or node.lineno,
                "details": details,
            })

        # Try-except
        elif isinstance(node, ast.Try):
            handler_types = []
            for handler in node.handlers:
                if handler.type:
                    handler_types.append(_get_name(handler.type))
                else:
                    handler_types.append("bare except")

            details = f"Try-except block catching: [{', '.join(handler_types)}]"
            if node.finalbody:
                details += " with finally"

            annotations.append({
                "type": "error_handling",
                "name": "try-except",
                "startLine": node.lineno,
                "endLine": node.end_lineno or node.lineno,
                "details": details,
            })

        # List/dict/set comprehensions
        elif isinstance(node, ast.ListComp):
            annotations.append({
                "type": "comprehension",
                "name": "list comprehension",
                "startLine": node.lineno,
                "endLine": node.end_lineno or node.lineno,
                "details": "List comprehension",
            })

        elif isinstance(node, ast.DictComp):
            annotations.append({
                "type": "comprehension",
                "name": "dict comprehension",
                "startLine": node.lineno,
                "endLine": node.end_lineno or node.lineno,
                "details": "Dictionary comprehension",
            })

        # With statements (context managers)
        elif isinstance(node, ast.With):
            annotations.append({
                "type": "context_manager",
                "name": "with",
                "startLine": node.lineno,
                "endLine": node.end_lineno or node.lineno,
                "details": "Context manager (with statement)",
            })

        # Import statements
        elif isinstance(node, (ast.Import, ast.ImportFrom)):
            if isinstance(node, ast.ImportFrom):
                names = [alias.name for alias in node.names]
                details = f"from {node.module} import {', '.join(names)}"
            else:
                names = [alias.name for alias in node.names]
                details = f"import {', '.join(names)}"

            annotations.append({
                "type": "import",
                "name": "import",
                "startLine": node.lineno,
                "endLine": node.end_lineno or node.lineno,
                "details": details,
            })

    # Sort by line number
    annotations.sort(key=lambda a: a["startLine"])
    return annotations


def _get_name(node) -> str:
    """Extract a human-readable name from an AST node."""
    if isinstance(node, ast.Name):
        return node.id
    elif isinstance(node, ast.Attribute):
        return f"{_get_name(node.value)}.{node.attr}"
    elif isinstance(node, ast.Tuple):
        return f"({', '.join(_get_name(e) for e in node.elts)})"
    elif isinstance(node, ast.Starred):
        return f"*{_get_name(node.value)}"
    elif isinstance(node, ast.Constant):
        return repr(node.value)
    return "<expr>"


def _get_decorator_name(node) -> str:
    """Extract decorator name from an AST node."""
    if isinstance(node, ast.Name):
        return f"@{node.id}"
    elif isinstance(node, ast.Attribute):
        return f"@{_get_name(node)}"
    elif isinstance(node, ast.Call):
        return f"@{_get_name(node.func)}(...)"
    return "@<expr>"


if __name__ == "__main__":
    code = sys.stdin.read()
    result = extract_annotations(code)

    if isinstance(result, dict) and "error" in result:
        json.dump(result, sys.stdout)
    else:
        json.dump({"annotations": result}, sys.stdout)
