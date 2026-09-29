import { AppearanceControl } from "@/appearance/AppearanceControl";
import { ProceduralMusic } from "@/audio/ProceduralMusic";
import { MusicStudio } from "@/components/music/MusicStudio";
import { NotificationBanner } from "./notifications/NotificationBanner";
import { useSystemMediaArtwork } from "./useSystemMediaArtwork";
export function App() {
  useSystemMediaArtwork();
  return (
    <>
      <a
        className="fixed top-2 left-2 z-100 -translate-y-[180%] rounded-sm bg-primary px-3 py-2 text-primary-foreground outline-none focus:translate-y-0 focus-visible:ring-3 focus-visible:ring-ring/50"
        href="#studio"
      >
        Skip to controls
      </a>
      <ProceduralMusic />
      <header className="mx-auto flex max-w-220 items-center justify-between gap-4 px-8 py-4 max-sm:px-6 max-[380px]:px-4">
        <h1 className="flex items-center gap-2 text-xl font-medium tracking-[-0.6px]">
          <svg
            className="size-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M3 12h2m3-5v10m4-14v18m4-15v12m4-8v4" />
          </svg>
          Lilt
        </h1>
        <AppearanceControl />
      </header>
      <main id="studio" tabIndex={-1} className="outline-none">
        <MusicStudio />
      </main>
      <NotificationBanner />
    </>
  );
}
