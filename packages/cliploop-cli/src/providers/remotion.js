export function buildRemotionStoryboard(storyboard) {
  return {
    provider: "remotion",
    title: storyboard.title,
    duration: storyboard.duration,
    scenes: storyboard.scenes,
  };
}
