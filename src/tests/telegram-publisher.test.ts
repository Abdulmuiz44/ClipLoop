import assert from "node:assert/strict";
import test from "node:test";
import { createTelegramPublisher } from "@/lib/publisher/telegram";

const readyItem = {
  caption: "A concise update",
  destinationUrl: "https://talocode.site/products/cliplane/post",
  approvedAt: new Date("2026-01-01T00:00:00.000Z"),
  scheduledFor: new Date("2026-01-01T00:00:00.000Z"),
};

test("Telegram publisher sends content text and returns a public message URL", async () => {
  const originalFetch = globalThis.fetch;
  let request: Request | undefined;
  globalThis.fetch = async (input, init) => {
    request = new Request(input, init);
    return new Response(JSON.stringify({ ok: true, result: { message_id: 42 } }), { status: 200 });
  };

  try {
    const publisher = createTelegramPublisher({ botToken: "test-token", channelId: "@cliplane_news" });
    const result = await publisher.publishContentItem(readyItem as any, null);
    assert.equal(request?.url, "https://api.telegram.org/bottest-token/sendMessage");
    assert.deepEqual(await request?.json(), {
      chat_id: "@cliplane_news",
      text: "A concise update\n\nhttps://talocode.site/products/cliplane/post",
      disable_web_page_preview: false,
    });
    assert.equal(result.externalPostId, "42");
    assert.equal(result.externalPostUrl, "https://t.me/cliplane_news/42");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Telegram publisher rejects invalid channel configuration and oversized text before fetch", async () => {
  const publisher = createTelegramPublisher({ botToken: "test-token", channelId: "invalid" });
  await assert.rejects(() => publisher.publishContentItem(readyItem as any, null), /Telegram channel/);

  const oversized = createTelegramPublisher({ botToken: "test-token", channelId: "@cliplane_news" });
  await assert.rejects(
    () => oversized.publishContentItem({ ...readyItem, caption: "a".repeat(4097) } as any, null),
    /4096-character limit/,
  );
});
