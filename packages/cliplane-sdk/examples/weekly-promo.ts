import { ClipLaneLocal } from "../src/index";

const client = new ClipLaneLocal();

async function main() {
  const result = await client.createScript({
    update: "Launched AI reminders.",
    product: "FounderOS",
    audience: "Indie founders",
    tone: "launch",
  });

  console.log({
    hook: result.hook,
    fullScript: result.fullScript,
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Unexpected error");
  process.exit(1);
});
