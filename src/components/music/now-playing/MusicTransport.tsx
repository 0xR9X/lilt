import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { getMusicApplication } from "@/audio/application";
import { notify } from "@/app/notifications/store";
import { useMusicRuntime, useMusicSessionController } from "@/audio/playback/react";
import { setMusicEnabled, setMusicVolume } from "@/audio/musicSettings";

export function MusicTransport({ enabled, volume }: { enabled: boolean; volume: number }) {
  const controller = useMusicSessionController();
  const runtime = useMusicRuntime();
  const playing = enabled && (runtime.status === "playing" || runtime.status === "gap");
  const togglePlayback = async () => {
    if (playing) {
      setMusicEnabled(false);
      return;
    }
    setMusicEnabled(true);
    try {
      if (!(await getMusicApplication().unlock())) notify("error", "Audio could not start. Press Play to try again.");
    } catch {
      notify("error", "Audio could not start. Press Play to try again.");
    }
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <Button
          size="lg"
          className="min-w-19"
          aria-label={playing ? "Pause music" : "Play music"}
          onClick={() => void togglePlayback()}
        >
          {playing ? "Pause" : "Play"}
        </Button>
        <div className="flex w-39 items-center gap-3 text-[11px] text-muted-foreground">
          Volume
          <Slider
            aria-label="Music volume"
            aria-valuetext={`${Math.round(volume * 100)}%`}
            min={0}
            max={100}
            step={1}
            value={volume * 100}
            onValueChange={(next) => setMusicVolume(next / 100)}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <CompositionButton
          description="New style & sound"
          aria-label="Randomize song"
          title="Generate a new track with a different style and effects. Reset tempo, song structure, and key choices."
          onClick={() => controller.randomize()}
        >
          Randomize
        </CompositionButton>
        <CompositionButton
          description="Keep style & sound"
          aria-label="New track"
          title="Generate a new track with the current style, effects, tempo, song structure, and key choices."
          onClick={() => controller.newComposition()}
        >
          New track
        </CompositionButton>
      </div>
    </div>
  );
}

function CompositionButton({
  description,
  children,
  ...props
}: { description: string; children: string } & Pick<
  ComponentProps<typeof Button>,
  "aria-label" | "title" | "onClick"
>) {
  return (
    <Button {...props} variant="outline" className="h-auto flex-col gap-0.5 py-2">
      {children}
      <span className="text-[11px] font-normal text-muted-foreground">{description}</span>
    </Button>
  );
}
