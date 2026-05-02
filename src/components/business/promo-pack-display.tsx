import type { PromoPack } from "@/lib/business/schemas";
import { CopyButton } from "./copy-button";

export function PromoPackDisplay({ pack }: { pack: PromoPack }) {
  return <section className="space-y-5"><div className="cl-card p-5"><h2 className="text-xl font-semibold">Campaign overview</h2><p className="mt-2 text-sm"><b>Campaign title:</b> {pack.campaignTitle}</p><p className="mt-1 text-sm"><b>Positioning angle:</b> {pack.positioningAngle}</p></div>
    <Block title="Short-form video ideas">{pack.shortFormVideoIdeas.map((idea,i)=><div key={i} className="rounded-xl border p-4 space-y-2"><div className="flex justify-between"><p className="font-semibold">{idea.title}</p><CopyButton text={`${idea.title}\n${idea.hook}\n${idea.script}\n${idea.caption}\n${idea.cta}`} /></div><p><b>Hook:</b> {idea.hook}</p><p><b>Script:</b> {idea.script}</p><p><b>Caption:</b> {idea.caption}</p><p><b>CTA:</b> {idea.cta}</p></div>)}</Block>
    <TextBlock title="X posts" items={pack.xPosts} /><TextBlock title="Instagram captions" items={pack.instagramCaptions} /><TextBlock title="TikTok/Reels captions" items={pack.tiktokCaptions} /><TextBlock title="Ad copy variants" items={pack.adCopyVariants} />
    <Block title="7-day content calendar">{pack.contentCalendar.map((row,i)=><div key={i} className="rounded-xl border p-4"><div className="flex justify-between"><p className="font-semibold">{row.day} · {row.postType}</p><CopyButton text={`${row.day}\n${row.postType}\n${row.idea}\n${row.caption}\n${row.cta}`} /></div><p className="text-sm mt-1"><b>Idea:</b> {row.idea}</p><p className="text-sm"><b>Caption:</b> {row.caption}</p><p className="text-sm"><b>CTA:</b> {row.cta}</p></div>)}</Block>
  </section>;
}
function Block({title,children}:{title:string;children:React.ReactNode}){return <div className="cl-card p-5"><h3 className="text-lg font-semibold">{title}</h3><div className="mt-3 space-y-3">{children}</div></div>}
function TextBlock({title,items}:{title:string;items:string[]}){return <Block title={title}>{items.map((item,i)=><div key={i} className="rounded-xl border p-4"><div className="mb-2 flex justify-end"><CopyButton text={item} /></div><p className="text-sm whitespace-pre-wrap">{item}</p></div>)}</Block>}
