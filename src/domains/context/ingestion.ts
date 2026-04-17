import crypto from "node:crypto";

type CrawledPage = {
  url: string;
  title: string | null;
  text: string;
  metadata: Record<string, unknown>;
};

function normalizeUrl(value: string) {
  const parsed = new URL(value);
  parsed.hash = "";
  return parsed.toString();
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? match[1].replace(/\s+/g, " ").trim() : null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<\/(p|div|h1|h2|h3|h4|h5|h6|li|section|article|br)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function extractSameOriginLinks(html: string, baseUrl: URL) {
  const links = new Set<string>();
  const hrefRegex = /href=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null = hrefRegex.exec(html);
  while (match) {
    const href = match[1]?.trim();
    if (href) {
      try {
        const resolved = new URL(href, baseUrl);
        if (resolved.origin === baseUrl.origin && (resolved.protocol === "http:" || resolved.protocol === "https:")) {
          links.add(normalizeUrl(resolved.toString()));
        }
      } catch {
        // ignore invalid links
      }
    }
    match = hrefRegex.exec(html);
  }
  return Array.from(links);
}

async function fetchPage(url: string, timeoutMs = 7000): Promise<{ html: string; finalUrl: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "ClipLoopBot/1.0 (+https://cliploop.app)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url} (${response.status})`);
    }
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      throw new Error(`Skipping non-HTML content at ${url}`);
    }
    const html = await response.text();
    return { html, finalUrl: response.url || url };
  } finally {
    clearTimeout(timeout);
  }
}

export async function crawlWebsiteContext(input: { websiteUrl: string; maxPages?: number; maxCharsPerPage?: number }): Promise<CrawledPage[]> {
  const maxPages = input.maxPages ?? 3;
  const maxCharsPerPage = input.maxCharsPerPage ?? 12000;
  const startUrl = normalizeUrl(input.websiteUrl);
  const queue: string[] = [startUrl];
  const visited = new Set<string>();
  const pages: CrawledPage[] = [];
  const startOrigin = new URL(startUrl).origin;

  while (queue.length > 0 && pages.length < maxPages) {
    const next = queue.shift()!;
    if (visited.has(next)) continue;
    visited.add(next);

    try {
      const { html, finalUrl } = await fetchPage(next);
      const final = normalizeUrl(finalUrl);
      if (new URL(final).origin !== startOrigin) continue;

      const title = extractTitle(html);
      const text = stripHtml(html).slice(0, maxCharsPerPage);
      if (text.length > 100) {
        pages.push({
          url: final,
          title,
          text,
          metadata: {
            charCount: text.length,
            source: "website_crawl",
          },
        });
      }

      for (const link of extractSameOriginLinks(html, new URL(final))) {
        if (!visited.has(link) && queue.length + pages.length < maxPages * 3) {
          queue.push(link);
        }
      }
    } catch {
      // Best-effort ingestion for MVP.
    }
  }

  return pages;
}

export function hashContent(text: string) {
  return crypto.createHash("sha256").update(text).digest("hex");
}
