import { Link } from "react-router-dom";
import { ClipLoopLogo } from "@/components/ui/ClipLoopLogo";

const features = [
  {
    title: "Local-first workflow",
    body: "Generate scripts, storyboard data, and launch copy without an API key.",
  },
  {
    title: "Optional hosted API",
    body: "Connect an API key when you want hosted rendering and managed execution.",
  },
  {
    title: "Built for teams",
    body: "Use the SDK inside apps, dashboards, agents, and internal tools.",
  },
];

const codeLines = [
  'npm install @talocode/cliploop-sdk',
  '',
  'import { ClipLoopLocal } from "@talocode/cliploop-sdk";',
  '',
  'const cliploop = new ClipLoopLocal();',
  'const script = await cliploop.createScript({',
  '  update: "We shipped ClipLoop SDK v0.1.0",',
  '  product: "ClipLoop",',
  '  audience: "builders",',
  '});',
];

export default function LandingPage() {
  return (
    <div className="space-y-8 md:space-y-10">
      <section className="overflow-hidden rounded-3xl border border-[#202020] bg-[#090909] px-5 py-6 shadow-[0_30px_120px_rgba(0,0,0,0.35)] md:px-8 md:py-8">
        <div className="flex items-center justify-between gap-4 border-b border-[#1B1B1B] pb-5">
          <ClipLoopLogo href="/" />
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/talocode/cliploop"
              className="rounded-full border border-[#272727] px-3 py-1.5 text-xs font-medium text-[#D4D4D4] transition hover:border-[#3A3A3A] hover:text-white"
            >
              GitHub
            </a>
            <Link
              to="/pricing"
              className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-neutral-200"
            >
              Pricing
            </Link>
          </div>
        </div>

        <div className="grid gap-8 py-8 md:grid-cols-[1.1fr_0.9fr] md:py-10">
          <div className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8B8B8B]">
              Talocode / ClipLoop
            </p>
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white md:text-6xl">
              Simple video workflow tooling for modern products.
            </h1>
            <p className="max-w-xl text-base leading-7 text-[#A3A3A3] md:text-lg">
              ClipLoop is an open-source SDK for turning product updates into
              scripts, storyboards, and launch copy with a clean local-first
              workflow.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://app.cliploop.site/app"
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200"
              >
                Open workspace
              </a>
              <a
                href="https://github.com/talocode/cliploop/releases/tag/cliploop-sdk-v0.1.0"
                className="rounded-full border border-[#272727] px-5 py-3 text-sm font-semibold text-white transition hover:border-[#3A3A3A] hover:bg-[#111111]"
              >
                View release
              </a>
            </div>
            <div className="grid gap-3 pt-2 text-sm text-[#8B8B8B] sm:grid-cols-2">
              <div className="rounded-2xl border border-[#1F1F1F] bg-[#0D0D0D] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[#555]">Package</p>
                <p className="mt-2 font-medium text-white">@talocode/cliploop-sdk</p>
              </div>
              <div className="rounded-2xl border border-[#1F1F1F] bg-[#0D0D0D] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[#555]">Version</p>
                <p className="mt-2 font-medium text-white">0.1.0</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[#1F1F1F] bg-[#0D0D0D] p-5">
            <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3">
              <p className="text-sm font-semibold text-white">Quick start</p>
              <span className="rounded-full border border-[#242424] px-2.5 py-1 text-[11px] font-medium text-[#A3A3A3]">
                Local-first
              </span>
            </div>
            <pre className="mt-4 overflow-x-auto rounded-2xl border border-[#232323] bg-black p-4 text-[12px] leading-6 text-[#EDEDED]">
              <code>{codeLines.join("\n")}</code>
            </pre>
            <p className="mt-4 text-sm leading-6 text-[#8B8B8B]">
              Local mode works without an API key. Hosted rendering is
              optional.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {features.map((feature) => (
          <article
            key={feature.title}
            className="rounded-2xl border border-[#1E1E1E] bg-[#0B0B0B] p-5"
          >
            <h2 className="text-base font-semibold text-white">{feature.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[#A3A3A3]">{feature.body}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 rounded-3xl border border-[#1E1E1E] bg-[#090909] p-5 md:grid-cols-[0.9fr_1.1fr] md:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8B8B8B]">
            What shipped
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white md:text-3xl">
            Open workflow. Open CLI. Open SDK. Optional hosted API.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-[#A3A3A3]">
            ClipLoop v0.1.0 ships the developer SDK release and a demo video
            workflow for GitHub Releases and product launches.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {[
            "ClipLoop",
            "ClipLoopLocal",
            "createScript()",
            "createStoryboard()",
            "exportForX()",
            "Hosted API client support",
          ].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-[#202020] bg-[#0D0D0D] px-4 py-3 text-sm font-medium text-white"
            >
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
