import { getMusicRoot, MUSIC_ROOTS, type MusicRootId } from "@/audio/composition/roots";
import { setMusicControlMode, useMusicSettings } from "@/audio/musicSettings";
import { useMusicSession, useMusicSessionController } from "@/audio/playback/react";
import { Field } from "@/components/controls/Field";
import { OptionSelect } from "@/components/controls/OptionSelect";
import { RangeField } from "@/components/controls/RangeField";

export function StyleControls() {
  const settings = useMusicSettings();
  const session = useMusicSession();
  const controller = useMusicSessionController();
  const preset = getMusicRoot(session.rootId);
  const automatic = settings.controlMode === "auto";
  return (
    <div className="border-t py-5 grid grid-cols-2 items-start gap-6 max-[540px]:grid-cols-1">
      <div>
        <Field label="Style">
          <OptionSelect
            aria-label="Style"
            value={automatic ? "auto" : session.rootId}
            onValueChange={(value) => {
              if (value === "auto") {
                setMusicControlMode("auto");
              } else {
                setMusicControlMode("override");
                if (value !== session.rootId) controller.setRoot(value as MusicRootId);
              }
            }}
            options={[
              { value: "auto", label: "Automatic · changes each track" },
              ...MUSIC_ROOTS.map((entry) => ({ value: entry.id, label: entry.name })),
            ]}
          />
        </Field>
        <p className="mt-2 text-xs leading-normal text-muted-foreground">
          {automatic && `Now: ${preset.name}. `}
          {preset.description}
        </p>
      </div>
      <RangeField
        label="Tempo"
        value={session.bpm}
        min={preset.tempo.min}
        max={preset.tempo.max}
        display={`${session.bpm} BPM`}
        description={automatic ? "Automatic style picks a new tempo for each track." : "Sets the pace of the music."}
        onChange={(bpm) => controller.setBpm(bpm)}
      />
    </div>
  );
}
