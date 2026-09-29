import { Disclosure } from "@/components/controls/Disclosure";
import { EffectsControls } from "../effects/EffectsControls";
import { StyleControls } from "./StyleControls";
import { MelodyControls } from "./MelodyControls";
import { AccompanimentControls } from "./AccompanimentControls";
import { PlaybackControls } from "./PlaybackControls";

export function MusicControls() {
  return (
    <section aria-label="Music settings" className="mt-6 border-b">
      <StyleControls />
      <Disclosure title="Melody" description="Shape, variation, and harmony">
        <MelodyControls />
      </Disclosure>
      <Disclosure title="Accompaniment" description="The second lute supporting the melody">
        <AccompanimentControls />
      </Disclosure>
      <Disclosure title="Effects" description="Tone, texture, and space">
        <EffectsControls />
      </Disclosure>
      <Disclosure title="Playback" description="Continuous listening and playing feel">
        <PlaybackControls />
      </Disclosure>
    </section>
  );
}
