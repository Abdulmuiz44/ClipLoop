import argparse
import json
from dataclasses import asdict
from .local import LocalScheduleClient

def main() -> None:
    parser = argparse.ArgumentParser(prog="cliplane")
    parser.add_argument("--store", default=".cliplane/schedules.json")
    commands = parser.add_subparsers(dest="command", required=True)
    create = commands.add_parser("schedule-create"); create.add_argument("--at", required=True); create.add_argument("--content"); create.add_argument("--title")
    commands.add_parser("schedule-list")
    cancel = commands.add_parser("schedule-cancel"); cancel.add_argument("id")
    args = parser.parse_args(); client = LocalScheduleClient(args.store)
    if args.command == "schedule-create": result = client.create_schedule(args.at, args.content, args.title)
    elif args.command == "schedule-list": result = [asdict(job) for job in client.list_schedules()]
    else: result = client.cancel_schedule(args.id)
    print(json.dumps(asdict(result) if hasattr(result, "__dataclass_fields__") else result, indent=2))
