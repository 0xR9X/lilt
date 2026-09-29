import { LUTE_TECHNIQUE_NAMES, type MusicLuteLineupEntry } from "@/audio/composition/lineup";
import { getLuteStyle } from "@/audio/composition/roots";

export function LuteLineup({ lineup }: { lineup: readonly MusicLuteLineupEntry[] }) {
  return (
    <ul>
      {lineup.map((entry) => (
        <li key={entry.part}>
          {entry.part === "strings" ? "Melody" : "Accompaniment"} · {getLuteStyle(entry.style).name} ·{" "}
          {LUTE_TECHNIQUE_NAMES[entry.technique]}
        </li>
      ))}
    </ul>
  );
}
