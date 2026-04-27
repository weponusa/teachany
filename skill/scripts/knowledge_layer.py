#!/usr/bin/env python3
"""Wrapper for TeachAny knowledge_layer.py.

This skill folder is embedded in the teachany-opensource repo. The real
knowledge-layer tool lives at ../../scripts/knowledge_layer.py so it can access
repo-level data/ and examples/ directories. This wrapper keeps the SKILL_CN.md
command `python3 scripts/knowledge_layer.py ...` working when executed from
skill/.
"""
from __future__ import annotations

import runpy
import sys
from pathlib import Path

repo_root = Path(__file__).resolve().parents[2]
target = repo_root / "scripts" / "knowledge_layer.py"

if not target.exists():
    sys.stderr.write(f"knowledge_layer.py not found: {target}\n")
    sys.exit(1)

sys.path.insert(0, str(repo_root / "scripts"))
runpy.run_path(str(target), run_name="__main__")
