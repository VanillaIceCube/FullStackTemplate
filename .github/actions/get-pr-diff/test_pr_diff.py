"""Exercise the real composite action against isolated Git histories."""

import json
import os
from pathlib import Path
import subprocess
import tempfile
import textwrap
import unittest

ACTION = Path(__file__).with_name("action.yml")


class ReviewDiffTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory(prefix="review-diff-")
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        self.git("init", "-q")
        self.git("config", "user.email", "fixture@example.test")
        self.git("config", "user.name", "Diff fixture")
        self.git("config", "core.autocrlf", "false")
        self.write("frontend/package-lock.json", '{"lockfileVersion":3}\n')
        self.write("frontend/package.json", '{"name":"fixture"}\n')
        self.write("src/example.js", "first\nold\nthird\n")
        self.base = self.commit()

    def git(self, *args):
        return subprocess.run(
            ["git", *args], cwd=self.root, check=True, capture_output=True, text=True
        ).stdout.strip()

    def write(self, name, content):
        target = self.root / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8")

    def commit(self):
        self.git("add", "-A")
        self.git("commit", "-qm", "fixture")
        return self.git("rev-parse", "HEAD")

    def action(self, head, budget=524288, base=None, check=True):
        # Execute the action's Bash body, rather than duplicating its filtering.
        script = textwrap.dedent(
            ACTION.read_text(encoding="utf-8").split("      run: |\n", 1)[1]
        )
        for name, value in {
            "base_sha": base or self.base,
            "head_sha": head,
            "max_bytes": str(budget),
        }.items():
            script = script.replace("${{ inputs." + name + " }}", value)
        output = self.root / "outputs"
        output.write_text("", encoding="utf-8")
        summary = self.root / "summary"
        result = subprocess.run(
            ["bash", "-c", script],
            cwd=self.root,
            env={
                **os.environ,
                "GITHUB_OUTPUT": str(output),
                "GITHUB_STEP_SUMMARY": str(summary),
            },
            capture_output=True,
            text=True,
        )
        if check:
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        outputs = dict(line.split("=", 1) for line in output.read_text().splitlines())
        return result, outputs

    def test_large_generated_lockfile_preserves_source_and_right_side_lines(self):
        self.write("frontend/package-lock.json", json.dumps({"padding": "x" * 700000}))
        self.write("frontend/package.json", '{"name":"updated"}\n')
        self.write("src/example.js", "first\nnew\nthird\n")
        _, outputs = self.action(self.commit())
        self.assertEqual(outputs["truncated"], "false")
        self.assertGreater(int(outputs["full_diff_bytes"]), 524288)
        self.assertLess(int(outputs["diff_bytes"]), 524288)
        self.assertEqual(outputs["excluded_files"], "frontend/package-lock.json")
        diff = (self.root / "pr.diff").read_text()
        self.assertNotIn("package-lock.json", diff)
        self.assertIn("frontend/package.json", diff)
        lined = (self.root / "pr_lines.diff").read_text()
        for expected in ("A2: new", "R1: first", "D: old", "R3: third", "DIFF LEGEND"):
            self.assertIn(expected, lined)
        self.assertIn(
            'Generated lockfile payloads excluded: ["frontend/package-lock.json"]',
            lined,
        )
        self.assertIn("have NOT been inspected", lined)
        self.assertIn("Dependency Review and npm malware review", lined)
        self.assertIn(
            "Generated lockfile payloads excluded", (self.root / "summary").read_text()
        )

        # The auxiliary full-file context must not reintroduce the lock payload.
        workflow = ACTION.parents[2] / "workflows/review-code.yml"
        block = (
            workflow.read_text(encoding="utf-8")
            .split("      - name: Build code review context\n", 1)[1]
            .split("      - name: Call Obi-Wan Code-nobi\n", 1)[0]
        )
        script = textwrap.dedent(block.split("        run: |\n", 1)[1])
        prior = self.root / "prior.json"
        prior.write_text("[]", encoding="utf-8")
        context = self.root / "context.txt"
        result = subprocess.run(
            ["bash", "-c", script],
            cwd=self.root,
            env={
                **os.environ,
                "BASE_SHA": self.base,
                "HEAD_SHA": self.git("rev-parse", "HEAD"),
                "EXCLUDED_FILES": outputs["excluded_files"],
                "CONTEXT_PATH": str(context),
                "PRIOR_REVIEWS_PATH": str(prior),
                "DIFF_PATH": str(self.root / "pr_lines.diff"),
                "DEPENDABOT_UPDATE_TYPE": "",
            },
            capture_output=True,
            text=True,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertNotIn("x" * 100, context.read_text())
        self.assertIn("generated lockfile payload excluded", context.read_text())
        self.assertIn("A2: new", context.read_text())

    def test_lockfile_only_change_has_explicit_evidence_policy(self):
        self.write(
            "frontend/package-lock.json", '{"lockfileVersion":3,"packages":{}}\n'
        )
        _, outputs = self.action(self.commit())
        self.assertEqual(outputs["diff_bytes"], "0")
        self.assertEqual(outputs["truncated"], "false")
        self.assertIn(
            "No source diff remains", (self.root / "pr_lines.diff").read_text()
        )
        self.assertIn(
            "Do not infer dependency safety", (self.root / "summary").read_text()
        )

    def test_other_lockfiles_remain_within_the_source_budget(self):
        self.write("package-lock.json", "root-lockfile\n" + "x" * 3000)
        self.write("frontend/yarn.lock", "other-lockfile\n")
        _, outputs = self.action(self.commit(), budget=512)
        self.assertEqual(outputs["excluded_files"], "")
        self.assertEqual(outputs["truncated"], "true")
        self.assertEqual((self.root / "pr.diff").stat().st_size, 512)
        self.assertIn("yarn.lock", (self.root / "pr_full.diff").read_text())

    def test_source_over_budget_remains_incomplete(self):
        self.write("src/example.js", "source line\n" * 1000)
        result, outputs = self.action(self.commit(), budget=1024)
        self.assertEqual(outputs["truncated"], "true")
        self.assertGreater(int(outputs["diff_bytes"]), 1024)
        self.assertEqual((self.root / "pr.diff").stat().st_size, 1024)
        self.assertIn("Truncated to 1024 bytes", result.stdout)

    def test_symlink_at_generated_path_is_never_excluded(self):
        lockfile = self.root / "frontend/package-lock.json"
        lockfile.unlink()
        lockfile.symlink_to("source.js")
        _, outputs = self.action(self.commit())
        self.assertEqual(outputs["excluded_files"], "")
        self.assertIn("120000", (self.root / "pr.diff").read_text())

    def test_rename_from_lockfile_to_source_retains_new_source(self):
        self.git("mv", "frontend/package-lock.json", "src/former-lock.js")
        _, outputs = self.action(self.commit())
        self.assertIn("src/former-lock.js", (self.root / "pr.diff").read_text())
        self.assertIn(
            'A1: {"lockfileVersion":3}', (self.root / "pr_lines.diff").read_text()
        )

    def test_git_failure_never_publishes_a_complete_diff(self):
        result, outputs = self.action(self.base, base="invalid-commit", check=False)
        self.assertNotEqual(result.returncode, 0)
        self.assertNotIn("truncated", outputs)


if __name__ == "__main__":
    unittest.main(verbosity=2)
