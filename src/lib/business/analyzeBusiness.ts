import { getChatProvider } from "@/lib/llm/provider";
import { businessProfileSchema } from "./schemas";

export async function analyzeBusiness(input:{websiteUrl:string;extractedText:string}){const llm=getChatProvider();const raw=await llm.generateText({messages:[{role:"system",content:"Return strict JSON only."},{role:"user",content:`Analyze this website text and return this JSON schema exactly with practical claims only: ${JSON.stringify({websiteUrl:"",businessName:"",industry:"",targetAudience:"",mainOffer:"",productsOrServices:[],keyBenefits:[],painPointsSolved:[],brandTone:"",contentAngles:[],ctaIdeas:[],oneLineSummary:"",longSummary:""})}\nWebsite URL: ${input.websiteUrl}\nText:\n${input.extractedText}`}],temperature:0.2,maxTokens:1400});
try{return businessProfileSchema.parse(JSON.parse(raw));}catch{throw new Error("AI returned invalid business profile JSON.");}}
