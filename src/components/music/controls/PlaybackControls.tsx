import { useMusicSession, useMusicSessionController } from "@/audio/playback/react";
import { SwitchField } from "@/components/controls/SwitchField";
import { PercentSlider } from "../PercentSlider";

export function PlaybackControls() {
  const session = useMusicSession();
  const controller = useMusicSessionController();
  return (
    <div className="grid grid-cols-2 items-start gap-6 max-[540px]:grid-cols-1">
      <div>
        <SwitchField
          label="Keep playing"
          checked={session.autoAdvance}
          onCheckedChange={(value) => controller.setAutoAdvance(value)}
        />
        <p className="text-xs leading-normal text-muted-foreground">Generate another track when this one ends.</p>
      </div>
      <PercentSlider
        label="Natural timing"
        value={session.humanization}
        description="Small variations in timing, note length, and touch."
        onChange={(value) => controller.setHumanization(value)}
      />
    </div>
  );
}
