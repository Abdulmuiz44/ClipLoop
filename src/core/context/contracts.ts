import type { CoreChannel } from "@/core/types/channels";

export type ContextDocumentShape = {
  sourceUrl: string;
  title: string | null;
  contentText: string;
  contentHash: string;
  metadataJson: Record<string, unknown>;
};

export type WebsiteCrawlPage = {
  url: string;
  title: string | null;
  text: string;
  metadata: Record<string, unknown>;
};

export type WebsiteContextCrawler = (input: {
  websiteUrl: string;
  maxPages?: number;
  maxCharsPerPage?: number;
}) => Promise<WebsiteCrawlPage[]>;

export type CoreOnboardingContextInput = {
  businessName: string;
  businessCategory: string;
  businessDescription: string;
  targetAudience: string;
  primaryOffer: string;
  tone?: string | null;
  callToAction?: string | null;
  websiteUrl?: string | null;
  websiteLabel?: string | null;
  languageStyle?: "english" | "pidgin" | "mixed" | null;
  preferredChannels: CoreChannel[];
};

export function toContextDocumentShape(page: WebsiteCrawlPage, contentHash: string): ContextDocumentShape {
  return {
    sourceUrl: page.url,
    title: page.title,
    contentText: page.text,
    contentHash,
    metadataJson: page.metadata,
  };
}

