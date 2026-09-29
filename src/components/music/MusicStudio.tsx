import { getMusicRoot } from "@/audio/composition/roots";
import { useMusicRuntime } from "@/audio/playback/react";
import { useMusicSettings } from "@/audio/musicSettings";
import { NowPlayingCard } from "./now-playing/NowPlayingCard";
import { MusicControls } from "./controls/MusicControls";

export function MusicStudio() {
  const settings = useMusicSettings();
  const runtime = useMusicRuntime();
  return (
    <div className="mx-auto max-w-220 px-8 pt-4 pb-12 max-sm:px-6 max-[380px]:px-4">
      <NowPlayingCard
        root={getMusicRoot(runtime.rootId)}
        runtime={runtime}
        enabled={settings.enabled}
        volume={settings.volume}
      />
      <MusicControls />
    </div>
  );
}
