#!/usr/bin/env python3
"""Configure this checkout without installing packages or generating credentials."""

import argparse
import json
import os
from pathlib import Path
import re
import stat
import tempfile


ROOT = Path(__file__).resolve().parent.parent


def project_name(value):
    if not re.fullmatch(r"[a-z][a-z0-9]*(?:-[a-z0-9]+)*", value) or len(value) > 64:
        raise argparse.ArgumentTypeError(
            "name must be 1-64 lowercase letters/digits separated by single hyphens, "
            "starting with a letter"
        )
    if value in {"node_modules", "favicon.ico", "con", "prn", "aux", "nul"} or re.fullmatch(
        r"(?:com|lpt)[0-9]", value
    ):
        raise argparse.ArgumentTypeError("name is reserved; choose another name")
    return value


def read_regular(relative):
    path = ROOT / relative
    # Never follow a link in an input or write target, including its parents.
    for part in (path, *path.parents):
        if part == ROOT:
            break
        if part.is_symlink():
            raise ValueError(f"refusing symbolic link: {relative}")
    info = path.stat()
    if not stat.S_ISREG(info.st_mode) or info.st_nlink != 1 or info.st_size > 2_000_000:
        raise ValueError(f"expected a small, regular, unlinked file: {relative}")
    return path.read_text(encoding="utf-8")


def plan(name):
    changes = {}
    for relative in ("package.json", "package-lock.json"):
        before = read_regular(relative)
        data = json.loads(before)
        data["name"] = name
        if relative == "package-lock.json":
            data["packages"][""]["name"] = name
        after = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
        if after != before:
            changes[relative] = after
    for locale in ("en", "uz", "ru"):
        relative = f"src/locales/{locale}.json"
        before = read_regular(relative)
        data = json.loads(before)
        data["app"]["name"] = name
        after = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
        if after != before:
            changes[relative] = after
    before = read_regular("index.html")
    after, count = re.subn(r"<title>[^<]*</title>", f"<title>{name}</title>", before)
    if count != 1:
        raise ValueError("expected exactly one plain title in index.html")
    if after != before:
        changes["index.html"] = after
    # lexists also preserves dangling symlinks and never reads an existing .env.
    if not os.path.lexists(ROOT / ".env"):
        changes[".env"] = read_regular(".env.example")
    return changes


def apply(changes):
    for relative, content in changes.items():
        target = ROOT / relative
        if relative == ".env":
            try:
                descriptor = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
            except FileExistsError:
                continue  # Preserve a file created after planning, too.
            with os.fdopen(descriptor, "w", encoding="utf-8") as stream:
                stream.write(content)
            continue
        read_regular(relative)  # Revalidate immediately before replacing a file.
        descriptor, temporary = tempfile.mkstemp(prefix=".bootstrap-", dir=target.parent)
        try:
            with os.fdopen(descriptor, "w", encoding="utf-8") as stream:
                stream.write(content)
            os.chmod(temporary, stat.S_IMODE(target.stat().st_mode))
            os.replace(temporary, target)
        finally:
            if os.path.exists(temporary):
                os.unlink(temporary)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--name", required=True, type=project_name, help="lowercase project slug")
    parser.add_argument("--dry-run", action="store_true", help="show filenames only; write nothing")
    args = parser.parse_args()
    try:
        changes = plan(args.name)
        if not args.dry_run:
            apply(changes)
    except (OSError, ValueError, KeyError, TypeError) as error:
        # Do not print parsed content: malformed config files may contain secrets.
        parser.exit(1, f"Bootstrap refused ({type(error).__name__}); check file shapes and permissions.\n")
    for relative in changes:
        print(f"{'Would update' if args.dry_run else 'Updated'} {relative}")
    if not changes:
        print("Already configured; no changes.")
    print("Existing environment files and credentials are preserved. No dependencies installed.")


if __name__ == "__main__":
    main()
