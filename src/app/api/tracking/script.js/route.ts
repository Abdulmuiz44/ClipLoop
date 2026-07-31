import { NextResponse } from "next/server";

const script = `(() => {
  try {
    const params = new URLSearchParams(window.location.search);
    const clickId = params.get('clp_click');
    if (clickId) {
      localStorage.setItem('cliplane_click_id', clickId);
      document.cookie = 'cliplane_click_id=' + encodeURIComponent(clickId) + ';path=/;max-age=' + 60*60*24*30;
    }
    window.ClipLaneTracking = {
      getClickId: () => localStorage.getItem('cliplane_click_id') || null
    };
  } catch (e) {}
})();`;

export async function GET() {
  return new NextResponse(script, {
    headers: {
      "content-type": "application/javascript; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}
