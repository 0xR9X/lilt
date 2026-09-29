import { Slider } from "@/components/ui/slider";
import { useState } from "react";
import { useMusicPosition, useMusicRuntime, useMusicSessionController } from "@/audio/playback/react";
import { durationLabel } from "../format";

export function TrackProgress({ duration }: { duration: number }) {
  const livePosition = useMusicPosition();
  const runtime = useMusicRuntime();
  const controller = useMusicSessionController();
  // Dragging previews a position; the slider commits on release, or at once for keyboard input.
  const [scrubPosition, setScrubPosition] = useState<number | null>(null);
  const position = Math.min(duration, Math.max(0, scrubPosition ?? livePosition));
  const canSeek = runtime.status === "playing" || runtime.status === "gap";
  return (
    <div className="col-span-full flex items-center gap-3">
      <span className="text-[11px] text-muted-foreground tabular-nums">{durationLabel(position)}</span>
      <Slider
        aria-label="Music position"
        aria-valuetext={`${durationLabel(position)} of ${durationLabel(duration)}`}
        min={0}
        max={duration || 1}
        step={0.5}
        value={position}
        disabled={!canSeek}
        onValueChange={setScrubPosition}
        onValueCommitted={(value) => {
          setScrubPosition(null);
          controller.seek(value);
        }}
      />
      <span className="text-[11px] text-muted-foreground tabular-nums">{durationLabel(duration)}</span>
    </div>
  );
}
