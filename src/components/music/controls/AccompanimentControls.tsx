import { useMusicSession, useMusicSessionController } from "@/audio/playback/react";
import { Button } from "@/components/ui/button";
import { SwitchField } from "@/components/controls/SwitchField";
import { PercentSlider } from "../PercentSlider";
import { ChordControls } from "./ChordControls";

export function AccompanimentControls() {
  const session = useMusicSession();
  const controller = useMusicSessionController();
  return (
    <div className="flex flex-col gap-6">
      <SwitchField
        label="Play accompaniment"
        checked={!session.mutedParts.rhythm}
        onCheckedChange={(enabled) => controller.setPartMuted("rhythm", !enabled)}
      />
      {!session.mutedParts.rhythm && (
        <div className="grid grid-cols-2 items-start gap-6 max-[540px]:grid-cols-1">
          <PercentSlider
            label="Volume"
            ariaLabel="Accompaniment volume"
            value={session.rhythmLute.level}
            onChange={(level) => controller.setRhythmLute({ level })}
          />
          <PercentSlider
            label="Rhythmic activity"
            value={session.rhythmLute.density}
            description="Higher values add more chord gestures."
            onChange={(density) => controller.setRhythmLute({ density })}
          />
          <ChordControls
            part="Accompaniment"
            maxNotes={session.rhythmLute.maxCourses}
            strumMs={session.rhythmLute.strumMs}
            onMaxNotesChange={(maxCourses) => controller.setRhythmLute({ maxCourses })}
            onStrumChange={(strumMs) => controller.setRhythmLute({ strumMs })}
          />
          <div className="col-span-full">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => controller.resetRhythmLute()}
            >
              Reset accompaniment
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
