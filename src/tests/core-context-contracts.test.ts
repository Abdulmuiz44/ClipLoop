import test from "node:test";
import assert from "node:assert/strict";
import { toContextDocumentShape } from "@/core/context/contracts";

test("context document shaping keeps normalized core fields", () => {
  const shaped = toContextDocumentShape(
    {
      url: "https://example.com",
      title: "Example",
      text: "hello world",
      metadata: { source: "website_crawl" },
    },
    "abc123",
  );

  assert.equal(shaped.sourceUrl, "https://example.com");
  assert.equal(shaped.title, "Example");
  assert.equal(shaped.contentText, "hello world");
  assert.equal(shaped.contentHash, "abc123");
  assert.deepEqual(shaped.metadataJson, { source: "website_crawl" });
});

