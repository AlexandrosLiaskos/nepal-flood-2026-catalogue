"""Tests of the visit counter of the server (deployment/visit_counter.py)."""

from __future__ import annotations

import json
import sys
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from functools import partial
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "deployment"))

import visit_counter  # noqa: E402


class VisitCounterTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.folder = tempfile.TemporaryDirectory()
        cls.count_file = Path(cls.folder.name) / "data" / "visits.json"
        counter = visit_counter.VisitCounter(cls.count_file)
        handler = partial(visit_counter.VisitRequestHandler, counter=counter)
        cls.httpd = visit_counter.ReusableThreadingHTTPServer(("127.0.0.1", 0), handler)
        cls.base = f"http://127.0.0.1:{cls.httpd.server_address[1]}"
        cls.thread = threading.Thread(target=cls.httpd.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.httpd.shutdown()
        cls.httpd.server_close()
        cls.thread.join(timeout=5)
        cls.folder.cleanup()

    def request(self, path: str, method: str = "GET") -> tuple[int, dict[str, str], dict]:
        data = b"" if method == "POST" else None
        request = urllib.request.Request(self.base + path, data=data, method=method)
        try:
            with urllib.request.urlopen(request, timeout=5) as response:
                return response.status, dict(response.headers), json.loads(response.read())
        except urllib.error.HTTPError as error:
            return error.code, dict(error.headers), json.loads(error.read())

    def test_count(self) -> None:
        status, headers, body = self.request("/api/visit")
        self.assertEqual(status, 200)
        self.assertEqual(headers["Cache-Control"], "no-store")
        start = body["count"]
        _, _, body = self.request("/api/visit", method="POST")
        self.assertEqual(body, {"count": start + 1, "metric": "recorded_page_visits"})
        _, _, body = self.request("/api/visit")
        self.assertEqual(body["count"], start + 1)
        self.assertEqual(json.loads(self.count_file.read_text(encoding="utf-8")), {"count": start + 1})

    def test_unknown_path(self) -> None:
        for method in ("GET", "POST"):
            status, _, body = self.request("/api/other", method=method)
            self.assertEqual(status, 404)
            self.assertEqual(body, {"error": "Not found"})


if __name__ == "__main__":
    unittest.main()
