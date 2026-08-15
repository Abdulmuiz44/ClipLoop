import type { CreativeBrief } from "./types"; // Assuming types.ts is in the same directory
import type { SceneBlock } from "./types";   // Import SceneBlock type

export function generateScenePlan(brief: CreativeBrief): SceneBlock[] {
  const scenePlan: SceneBlock[] = [];
  const totalDurationMs = brief.durationSec * 1000;
  let currentTimeMs = 0;

  // --- Basic Scene Planning Logic ---
  // This logic is a starting point and can be significantly enhanced.
  // It attempts to parse the sceneOutline and assign basic properties.

  // Parse scene outline if available
  const sceneLines = brief.sceneOutline?.split("\n").map((line) => line.trim()).filter((line) => line);

  if (sceneLines && sceneLines.length > 0) {
    sceneLines.forEach((line, index) => {
      // Attempt to extract basic scene info (e.g., "1. Hook scene: Introduce product.")
      const match = line.match(/^(\d+)\.\s*([\w\s-]+)[:\s]*(.*)$/);
      const sceneType = match ? match[2].toLowerCase().includes('hook') ? 'hook' : 
                         match[2].toLowerCase().includes('feature') ? 'feature' :
                         match[2].toLowerCase().includes('cta') ? 'cta' :
                         'generic' : 'generic';
      const scenePurpose = match ? match[3] || line : line;

      const remainingScenes = sceneLines.length - index;
      const sceneDurationMs = Math.max(1000, Math.floor((totalDurationMs - currentTimeMs) / remainingScenes));

      const newScene: SceneBlock = {
        type: sceneType,
        purpose: scenePurpose,
        timing: {
          startMs: currentTimeMs,
          durationMs: sceneDurationMs,
        },
        primaryText: scenePurpose, // Simple assignment, could be more refined
        cta: brief.cta, // Use overall CTA, can be scene-specific if detailed in outline
        assetHints: [], // Placeholder, would need more logic to infer from brief/outline
      };
      
      // Add specific hints based on type
      if (sceneType === 'hook') newScene.assetHints?.push('dynamic_visual');
      if (sceneType === 'feature') newScene.assetHints?.push('product_shot');
      if (sceneType === 'cta') newScene.assetHints?.push('brand_logo');

      scenePlan.push(newScene);
      currentTimeMs += sceneDurationMs;
    });
  } else {
    // Fallback if no scene outline is provided - create a default scene structure
    const fallbackDuration = Math.max(1000, Math.floor(totalDurationMs / 2));
    scenePlan.push({
      type: "intro",
      purpose: brief.concept || "Video Introduction",
      timing: { startMs: 0, durationMs: fallbackDuration },
      primaryText: brief.concept || "Discover Something New",
      cta: brief.cta,
      assetHints: ["logo", "product_visual"],
    });
    // Add a placeholder for a CTA scene if duration allows
    if (totalDurationMs > fallbackDuration + 1000) {
        scenePlan.push({
            type: "cta",
            purpose: "Call to Action",
            timing: { startMs: fallbackDuration, durationMs: totalDurationMs - fallbackDuration },
            primaryText: brief.cta,
            cta: brief.cta,
            assetHints: ["brand_logo", "cta_button"],
        });
    }
  }

  // Distribute remaining time or ensure total duration is met, or adjust durations
  // For simplicity, this example doesn't re-allocate time perfectly but ensures basic structure.
  // A real implementation would refine timing and potentially adjust scene durations.

  return scenePlan;
}
