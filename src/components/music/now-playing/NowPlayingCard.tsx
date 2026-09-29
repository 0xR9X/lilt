import { Disclosure } from "@/components/controls/Disclosure";
import { MUSIC_FORM_LABELS, type MusicRoot } from "@/audio/composition/roots";
import type { MusicRuntimeSnapshot } from "@/audio/playback/types";
import { MusicCoverArt } from "../MusicCoverArt";
import { LuteLineup } from "../LuteLineup";
import { musicStatusLabel } from "../format";
import { noteName } from "../music-labels";
import { MusicTransport } from "./MusicTransport";
import { TrackProgress } from "./TrackProgress";

export function NowPlayingCard({
  root,
  runtime,
  enabled,
  volume,
}: {
  root: MusicRoot;
  runtime: MusicRuntimeSnapshot;
  enabled: boolean;
  volume: number;
}) {
  const sounding = enabled && (runtime.status === "playing" || runtime.status === "gap");
  return (
    <section
      className="grid grid-cols-[minmax(0,1fr)_300px] items-center gap-6 max-sm:grid-cols-1 max-sm:gap-4"
      aria-label="Music player"
    >
      <div className="flex min-w-0 items-center gap-4">
        <MusicCoverArt subject={runtime} size={64} label={`Cover of ${runtime.name}`} />
        <div className="min-w-0">
          <p className="text-[11px] text-muted-foreground">
            {sounding ? musicStatusLabel(runtime.status) : runtime.status === "error" ? "Audio unavailable" : "Paused"}
          </p>
          <h2 className="my-1 text-xl leading-snug font-medium tracking-[-0.5px] wrap-anywhere">{runtime.name}</h2>
          <p className="text-xs text-muted-foreground">
            {root.name} · {runtime.piece.bpm} BPM
          </p>
        </div>
      </div>
      <MusicTransport enabled={enabled} volume={volume} />
      <TrackProgress duration={runtime.durationSeconds} />
      <div className="col-span-full -mt-3">
        <Disclosure title="Track details" compact>
          <p>
            {MUSIC_FORM_LABELS[runtime.form]} · {root.meter} · {noteName(runtime.tonicMidi)} {root.mode}
          </p>
          <LuteLineup lineup={runtime.lineup} />
        </Disclosure>
      </div>
      {runtime.status === "error" && (
        <p role="alert" className="col-span-full text-destructive">
          Audio unavailable. Press Play to retry.
        </p>
      )}
    </section>
  );
}
