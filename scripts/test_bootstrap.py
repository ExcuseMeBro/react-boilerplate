"""Run only against temporary copies; no changes to the source checkout."""

import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest


SOURCE = Path(__file__).resolve().parent.parent
FILES = (
    "scripts/bootstrap.py", "package.json", "package-lock.json", "index.html",
    "src/locales/en.json", "src/locales/uz.json", "src/locales/ru.json", ".env.example",
)


class BootstrapTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name) / "project"
        for relative in FILES:
            target = self.root / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(SOURCE / relative, target)

    def run_bootstrap(self, *arguments):
        return subprocess.run(
            [sys.executable, str(self.root / "scripts/bootstrap.py"), *arguments],
            cwd=self.temporary.name, capture_output=True, text=True, timeout=10,
        )

    def snapshot(self):
        return {str(path.relative_to(self.root)): path.read_bytes()
                for path in self.root.rglob("*") if path.is_file()}

    def test_valid_name_and_idempotence(self):
        result = self.run_bootstrap("--name", "my-app-42")
        self.assertEqual(result.returncode, 0, result.stderr)
        for relative in ("package.json", "package-lock.json"):
            self.assertEqual(json.loads((self.root / relative).read_text())["name"], "my-app-42")
        lock = json.loads((self.root / "package-lock.json").read_text())
        self.assertEqual(lock["packages"][""]["name"], "my-app-42")
        for locale in ("en", "uz", "ru"):
            data = json.loads((self.root / f"src/locales/{locale}.json").read_text())
            self.assertEqual(data["app"]["name"], "my-app-42")
        self.assertIn("<title>my-app-42</title>", (self.root / "index.html").read_text())
        self.assertEqual((self.root / ".env").read_bytes(), (self.root / ".env.example").read_bytes())
        self.assertEqual((self.root / ".env").stat().st_mode & 0o777, 0o600)
        before = self.snapshot()
        times = {relative: (self.root / relative).stat().st_mtime_ns for relative in before}
        again = self.run_bootstrap("--name", "my-app-42")
        self.assertEqual(again.returncode, 0, again.stderr)
        self.assertIn("Already configured", again.stdout)
        self.assertEqual(before, self.snapshot())
        self.assertEqual(times, {relative: (self.root / relative).stat().st_mtime_ns for relative in before})

    def test_dry_run_writes_nothing_and_does_not_print_values(self):
        before = self.snapshot()
        result = self.run_bootstrap("--name", "example", "--dry-run")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("Would update package.json", result.stdout)
        self.assertIn("Would update .env", result.stdout)
        self.assertNotIn("VITE_API_URL", result.stdout)
        self.assertEqual(before, self.snapshot())

    def test_invalid_names_do_not_write(self):
        before = self.snapshot()
        for name in ("", "../escape", "a/b", "Uppercase", "two words", "<script>",
                     "x;touch-pwned", "-option", "a--b", "a-", "2app", "a" * 65,
                     "con", "lpt1", "éclair", "a\nb"):
            with self.subTest(name=name):
                self.assertNotEqual(self.run_bootstrap("--name=" + name).returncode, 0)
                self.assertEqual(before, self.snapshot())
        self.assertNotEqual(self.run_bootstrap().returncode, 0)

    def test_environment_and_credentials_are_preserved(self):
        fixtures = {".env": b"PRIVATE=dummy-fixture\n", ".env.local": b"LOCAL=dummy\n",
                    "credentials.json": b'{"fixture": "not-a-real-secret"}\n'}
        for relative, content in fixtures.items():
            (self.root / relative).write_bytes(content)
        result = self.run_bootstrap("--name", "example")
        self.assertEqual(result.returncode, 0, result.stderr)
        for relative, content in fixtures.items():
            self.assertEqual((self.root / relative).read_bytes(), content)
        self.assertNotIn("dummy-fixture", result.stdout + result.stderr)

    def test_env_symlink_is_preserved_without_reading(self):
        destination = Path(self.temporary.name) / "missing-env"
        (self.root / ".env").symlink_to(destination)
        result = self.run_bootstrap("--name", "example")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertTrue((self.root / ".env").is_symlink())
        self.assertFalse(destination.exists())

    def test_linked_config_is_rejected_before_any_write(self):
        for hardlink in (False, True):
            with self.subTest(hardlink=hardlink):
                target = self.root / "index.html"
                outside = Path(self.temporary.name) / f"outside-{hardlink}"
                target.rename(outside)
                if hardlink:
                    os.link(outside, target)
                else:
                    target.symlink_to(outside)
                before = self.snapshot()
                result = self.run_bootstrap("--name", "example")
                self.assertNotEqual(result.returncode, 0)
                self.assertEqual(before, self.snapshot())
                target.unlink()
                outside.rename(target)

    def test_symlink_parent_is_rejected(self):
        outside = Path(self.temporary.name) / "locales"
        (self.root / "src/locales").rename(outside)
        (self.root / "src/locales").symlink_to(outside, target_is_directory=True)
        before = (self.root / "package.json").read_bytes()
        self.assertNotEqual(self.run_bootstrap("--name", "example").returncode, 0)
        self.assertEqual(before, (self.root / "package.json").read_bytes())
        self.assertFalse((self.root / ".env").exists())

    def test_malformed_config_fails_before_writes_without_leaking_content(self):
        (self.root / "src/locales/ru.json").write_text("private-dummy-marker")
        before = self.snapshot()
        result = self.run_bootstrap("--name", "example")
        self.assertNotEqual(result.returncode, 0)
        self.assertNotIn("private-dummy-marker", result.stderr)
        self.assertEqual(before, self.snapshot())


if __name__ == "__main__":
    unittest.main()
