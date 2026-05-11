import { getChatProvider } from "@/lib/llm/provider";
import { type BusinessProfile, promoPackSchema } from "./schemas";
export async function generatePromoPack(profile: BusinessProfile){const llm=getChatProvider();const raw=await llm.generateText({messages:[{role:"system",content:"Return strict JSON only."},{role:"user",content:`Generate a promo pack JSON using only this business context: ${JSON.stringify(profile)}. Must include 5 shortFormVideoIdeas, 5 xPosts, 5 instagramCaptions, 5 tiktokCaptions, 3 adCopyVariants, 7 contentCalendar items. Avoid fake claims.`}],temperature:0.4,maxTokens:2200});
try{return promoPackSchema.parse(JSON.parse(raw));}catch{throw new Error("AI returned invalid promo pack JSON.");}}
