import { ClipLoopClient } from "../src/index";

const client = new ClipLoopClient({
  // apiKey: "your api key"
});

async function main() {
  const result = await client.generateWeeklyPromo({
    appName: "FounderOS",
    appWebsiteUrl: "https://founderos.com",
    weeklyUpdate: "Launched AI reminders.",
    targetAudience: "Indie founders",
    callToAction: "Try the beta",
    channel: "x",
    tone: "Professional"
  });

  console.log({
    artifactId: result.artifactId,
    downloadUrl: result.downloadUrl,
    creditsCharged: result.creditsCharged
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Unexpected error");
  process.exit(1);
});
