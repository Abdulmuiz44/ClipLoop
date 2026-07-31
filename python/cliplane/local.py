"""Local JSON schedule plans. No network or credentials are used."""
from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4
import json

@dataclass
class ScheduleJob:
    id: str
    run_at: str
    status: str
    content_id: str | None = None
    title: str | None = None
    created_at: str = ""
    cancelled_at: str | None = None

class LocalScheduleClient:
    def __init__(self, store_path: str | Path = ".cliplane/schedules.json") -> None:
        self.store_path = Path(store_path)

    def _load(self) -> list[ScheduleJob]:
        if not self.store_path.exists(): return []
        data = json.loads(self.store_path.read_text())
        return [ScheduleJob(job["id"], job["runAt"], job["status"], job.get("contentId"), job.get("title"), job.get("createdAt", ""), job.get("cancelledAt")) for job in data.get("jobs", [])]

    def _save(self, jobs: list[ScheduleJob]) -> None:
        self.store_path.parent.mkdir(parents=True, exist_ok=True)
        records = [{"id": job.id, "runAt": job.run_at, "status": job.status, "contentId": job.content_id, "title": job.title, "createdAt": job.created_at, "cancelledAt": job.cancelled_at} for job in jobs]
        self.store_path.write_text(json.dumps({"version": 1, "jobs": records}, indent=2) + "\n")

    def create_schedule(self, run_at: str, content_id: str | None = None, title: str | None = None) -> ScheduleJob:
        parsed = datetime.fromisoformat(run_at.replace("Z", "+00:00"))
        if parsed.tzinfo is None or parsed <= datetime.now(timezone.utc): raise ValueError("run_at must be a future ISO-8601 timestamp with an offset")
        job = ScheduleJob(f"schedule_{uuid4()}", parsed.astimezone(timezone.utc).isoformat().replace("+00:00", "Z"), "scheduled", content_id, title, datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"))
        jobs = self._load(); jobs.append(job); self._save(jobs); return job

    def list_schedules(self) -> list[ScheduleJob]:
        return sorted(self._load(), key=lambda job: job.run_at)

    def cancel_schedule(self, schedule_id: str) -> ScheduleJob:
        jobs = self._load()
        for job in jobs:
            if job.id == schedule_id:
                if job.status != "cancelled": job.status, job.cancelled_at = "cancelled", datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"); self._save(jobs)
                return job
        raise ValueError(f"Local schedule not found: {schedule_id}")
