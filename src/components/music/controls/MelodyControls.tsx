import { getMusicRoot, MUSIC_FORM_LABELS, type MusicPieceForm } from "@/audio/composition/roots";
import { useMusicSession, useMusicSessionController } from "@/audio/playback/react";
import { Field } from "@/components/controls/Field";
import { OptionSelect } from "@/components/controls/OptionSelect";
import { SwitchField } from "@/components/controls/SwitchField";
import { Button } from "@/components/ui/button";
import { PercentSlider } from "../PercentSlider";
import { noteName } from "../music-labels";
import { ChordControls } from "./ChordControls";

export function MelodyControls() {
  const session = useMusicSession();
  const controller = useMusicSessionController();
  const preset = getMusicRoot(session.rootId);
  return (
    <div className="flex flex-col gap-6">
      <SwitchField
        label="Play melody"
        checked={!session.mutedParts.strings}
        onCheckedChange={(enabled) => controller.setPartMuted("strings", !enabled)}
      />
      {!session.mutedParts.strings && (
        <div className="grid grid-cols-2 items-start gap-6 max-[540px]:grid-cols-1">
          {preset.forms.length > 1 && (
            <Field label="Song structure">
              <OptionSelect
                aria-label="Song structure"
                value={session.formOverride ?? "auto"}
                options={[
                  { value: "auto", label: "Choose for each track" },
                  ...preset.forms.map((form) => ({ value: form, label: MUSIC_FORM_LABELS[form] })),
                ]}
                onValueChange={(value) =>
                  controller.setFormOverride(value === "auto" ? null : (value as MusicPieceForm))
                }
              />
            </Field>
          )}
          <Field label="Key">
            <OptionSelect
              aria-label="Key"
              value={session.tonicOverride?.toString() ?? "auto"}
              options={[
                { value: "auto", label: "Choose for each track" },
                ...preset.safeTonics.map((tonic) => ({
                  value: String(tonic),
                  label: `${noteName(tonic)} ${preset.mode}`,
                })),
              ]}
              onValueChange={(value) => controller.setTonicOverride(value === "auto" ? null : Number(value))}
            />
          </Field>
          <PercentSlider
            label="Melodic variation"
            value={session.novelty}
            description="Adds changes when musical phrases repeat."
            onChange={(value) => controller.setNovelty(value)}
          />
          <PercentSlider
            label="Added harmony"
            value={session.chords.amount}
            description="How often the melody plays extra chord notes."
            onChange={(amount) => controller.setChords({ amount })}
          />
          {session.chords.amount > 0 && (
            <ChordControls
              part="Melody"
              maxNotes={session.chords.maxCourses}
              strumMs={session.chords.strumMs}
              onMaxNotesChange={(maxCourses) => controller.setChords({ maxCourses })}
              onStrumChange={(strumMs) => controller.setChords({ strumMs })}
            />
          )}
          <div className="col-span-full">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => controller.resetChords()}
            >
              Reset melody harmony
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
