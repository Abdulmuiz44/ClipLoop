"use client";
import { useState } from "react";
export function CopyButton({ text }: { text: string }) {const [done,setDone]=useState(false);return <button className="rounded-lg border px-2 py-1 text-xs hover:bg-slate-50" onClick={async()=>{await navigator.clipboard.writeText(text);setDone(true);setTimeout(()=>setDone(false),1000);}}>{done?"Copied":"Copy"}</button>;}
