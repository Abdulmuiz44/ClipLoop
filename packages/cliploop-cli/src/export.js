export function exportForX({ storyboard, renderPath }) {
  const title = storyboard?.title || "ClipLoop v0.1.0";
  const post = [
    `${title}`,
    "",
    "ClipLoop is the open-source, local-first workflow layer for turning product updates into short-form promo videos.",
    "",
    `Video: ${renderPath}`,
    "",
    "No login. No hosted service. No model training. Just script, storyboard, render, export.",
  ].join("\n");
  return {
    recommendedPost: post,
    videoFilename: renderPath,
    releaseDemoChecklist: [
      "Confirm the script reads clearly",
      "Confirm storyboard scenes match the update",
      "Render the MP4 locally",
      "Review the final video file",
      "Attach the MP4 manually if you are publishing a release",
      "Do not commit large MP4 files unless intentional",
    ],
  };
}
