"""Build an initialized app and serve its SPA on disposable loopback Docker ports."""

import http.client
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import time
import unittest
import uuid

ROOT = Path(__file__).resolve().parents[1]


def run(*args, cwd=ROOT, timeout=300):
    result = subprocess.run(
        args, cwd=cwd, capture_output=True, text=True, timeout=timeout
    )
    if result.returncode:
        raise AssertionError(result.stdout[-4000:] + result.stderr[-4000:])
    return result.stdout.strip()


class GeneratedFrontendContainerTests(unittest.TestCase):
    def test_generated_frontend_image_serves_assets_and_history_fallback(self):
        identity = "template-frontend-" + uuid.uuid4().hex[:12]
        image = identity + ":test"
        with tempfile.TemporaryDirectory(prefix="template-container-") as directory:
            root = Path(directory)
            self.assertTrue(
                root.resolve().is_relative_to(Path(tempfile.gettempdir()).resolve())
            )
            files = run("git", "ls-files", "-z").split("\0")
            for name in filter(None, files):
                target = root / name
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(ROOT / name, target)
            run(
                "pwsh",
                "-NoProfile",
                "-File",
                str(root / "scripts/initialize-template.ps1"),
                "-ApplicationName",
                "SampleAtlas",
                "-ApplicationSlug",
                "sample-atlas",
                "-ProductionHost",
                "sample-atlas.example.net",
                "-GitHubOwner",
                "ExampleOwner",
                cwd=root,
            )
            try:
                run("docker", "build", "-t", image, str(root / "frontend"), timeout=600)
                run(
                    "docker",
                    "run",
                    "-d",
                    "--name",
                    identity,
                    "-p",
                    "127.0.0.1::80",
                    image,
                )
                port = int(
                    json.loads(run("docker", "inspect", identity))[0][
                        "NetworkSettings"
                    ]["Ports"]["80/tcp"][0]["HostPort"]
                )
                deadline = time.monotonic() + 30
                while True:
                    try:
                        connection = http.client.HTTPConnection(
                            "127.0.0.1", port, timeout=2
                        )
                        connection.request("GET", "/")
                        response = connection.getresponse()
                        body = response.read().decode()
                        connection.close()
                        if response.status == 200:
                            break
                    except OSError:
                        pass
                    if time.monotonic() >= deadline:
                        self.fail("Disposable frontend did not become ready")
                    time.sleep(0.2)
                self.assertIn("SampleAtlas", body)
                self.assertNotIn("@vite/client", body)
                for route in (
                    "/login",
                    "/reset-password?uid=sample",
                    "/sample-atlas-mark.svg",
                ):
                    connection = http.client.HTTPConnection(
                        "127.0.0.1", port, timeout=5
                    )
                    connection.request("GET", route)
                    response = connection.getresponse()
                    content = response.read()
                    connection.close()
                    self.assertEqual(response.status, 200, route)
                    if route.endswith(".svg"):
                        self.assertIn(b"<svg", content)
                    else:
                        self.assertIn(b"SampleAtlas", content)
            finally:
                # Only resources named with this test's random identity are removed.
                subprocess.run(["docker", "rm", "-f", identity], capture_output=True)
                subprocess.run(["docker", "image", "rm", image], capture_output=True)


if __name__ == "__main__":
    unittest.main(verbosity=2)
