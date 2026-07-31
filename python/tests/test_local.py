import tempfile
import unittest
from pathlib import Path
from cliplane import LocalScheduleClient

class LocalScheduleTests(unittest.TestCase):
    def test_create_list_and_cancel(self):
        with tempfile.TemporaryDirectory() as directory:
            client = LocalScheduleClient(Path(directory) / "schedules.json")
            job = client.create_schedule("2027-01-01T00:00:00Z", content_id="video_1")
            self.assertEqual(client.list_schedules()[0].id, job.id)
            self.assertEqual(client.cancel_schedule(job.id).status, "cancelled")

if __name__ == "__main__":
    unittest.main()
