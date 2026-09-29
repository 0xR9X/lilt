import { describe, expect, test } from "vitest";
import {
  luteStringDecay,
  ProceduralLuteRenderPool,
  renderLuteString,
  type LuteCourseRenderOptions,
} from "@/audio/synthesis/procedural-lute";

const sampleRate = 48_000;
const styles = ["renaissance-lute", "gittern", "oud"] as const;
const techniques = ["melody", "rhythm", "drone"] as const;
const COURSE_DETUNE_CENTS = { "renaissance-lute": 1.4, gittern: 2.2, oud: 1.8 } as const;

function midiFrequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

function stringOptions(overrides: Partial<LuteCourseRenderOptions> = {}): LuteCourseRenderOptions {
  return {
    style: "renaissance-lute",
    technique: "melody",
    midi: 57,
    sampleRate,
    durationSeconds: 1,
    seed: 7,
    ...overrides,
  };
}

/** Hann-windowed DFT bin at `frequency`, phased against absolute time so that
 * windows at different offsets can be compared. */
function spectrumAt(samples: Float32Array, start: number, size: number, frequency: number) {
  const omega = (2 * Math.PI * frequency) / sampleRate;
  let real = 0;
  let imaginary = 0;
  for (let index = 0; index < size; index += 1) {
    const weight = 0.5 - 0.5 * Math.cos((2 * Math.PI * index) / (size - 1));
    const sample = samples[start + index]! * weight;
    const phase = omega * (start + index);
    real += sample * Math.cos(phase);
    imaginary -= sample * Math.sin(phase);
  }
  return { magnitude: Math.hypot(real, imaginary), phase: Math.atan2(imaginary, real) };
}

function wrapPhase(phase: number): number {
  return phase - 2 * Math.PI * Math.round(phase / (2 * Math.PI));
}

/** Frequency of the partial near `guess`, from how its phase advances between
 * windows: first a short hop to get within range, then a long one for precision. */
function measureFrequency(samples: Float32Array, guess: number, startSeconds = 0.15): number {
  const size = Math.round(Math.max(0.1, 8 / guess) * sampleRate);
  const start = Math.round(startSeconds * sampleRate);
  let estimate = guess;
  for (const hopSeconds of [0.01, 0.05, 0.3]) {
    const hop = Math.round(hopSeconds * sampleRate);
    const early = spectrumAt(samples, start, size, estimate);
    const late = spectrumAt(samples, start + hop, size, estimate);
    estimate += (wrapPhase(late.phase - early.phase) * sampleRate) / (2 * Math.PI * hop);
  }
  return estimate;
}

function cents(measured: number, expected: number): number {
  return 1200 * Math.log2(measured / expected);
}

/** T60 of the partial at `frequency`, from a line fitted to its dB envelope. */
function measureT60(samples: Float32Array, frequency: number, fromSeconds: number, toSeconds: number): number {
  const size = Math.round(Math.max(0.05, 8 / frequency) * sampleRate);
  const times: number[] = [];
  const levels: number[] = [];
  for (let start = Math.round(fromSeconds * sampleRate); start + size <= toSeconds * sampleRate; start += size / 2) {
    times.push((start + size / 2) / sampleRate);
    levels.push(20 * Math.log10(spectrumAt(samples, Math.round(start), size, frequency).magnitude));
  }
  const meanTime = times.reduce((sum, time) => sum + time, 0) / times.length;
  const meanLevel = levels.reduce((sum, level) => sum + level, 0) / levels.length;
  let covariance = 0;
  let variance = 0;
  for (const [index, time] of times.entries()) {
    covariance += (time - meanTime) * (levels[index]! - meanLevel);
    variance += (time - meanTime) ** 2;
  }
  return -60 / (covariance / variance);
}

describe("procedural lute string tuning and decay", () => {
  test("tunes every string within a cent across the lute's range", () => {
    for (const style of styles) {
      for (const technique of techniques) {
        for (let midi = 40; midi <= 88; midi += 1) {
          const target = midiFrequency(midi);
          const samples = renderLuteString(stringOptions({ style, technique, midi, durationSeconds: 0.7 }));
          const error = cents(measureFrequency(samples, target), target);
          expect(Math.abs(error), `${style} ${technique} MIDI ${midi}: ${error.toFixed(2)} cents`).toBeLessThan(1);
        }
      }
    }
  });

  test("honours a requested string detune", () => {
    const target = midiFrequency(57);
    for (const offset of [-5, 3]) {
      const samples = renderLuteString(stringOptions({ durationSeconds: 0.7 }), offset);
      expect(cents(measureFrequency(samples, target), target)).toBeCloseTo(offset, 0);
    }
  });

  test("keeps a whole course, detuned pair and body, centred on its note", () => {
    const pool = new ProceduralLuteRenderPool();
    for (const style of styles) {
      for (const midi of [40, 52, 64, 76, 88]) {
        const target = midiFrequency(midi);
        const samples = pool.renderCourse(stringOptions({ style, midi, durationSeconds: 0.7 }));
        const error = cents(measureFrequency(samples, target), target);
        expect(Math.abs(error), `${style} MIDI ${midi}`).toBeLessThan(COURSE_DETUNE_CENTS[style] / 2 + 1);
      }
    }
  });

  test("rings the fundamental for its target decay time, low and high", () => {
    for (const style of styles) {
      for (const technique of ["melody", "drone"] as const) {
        for (const midi of [40, 52, 64, 76, 88]) {
          const frequency = midiFrequency(midi);
          const target = luteStringDecay(style, technique, frequency).fundamentalSeconds;
          const samples = renderLuteString(stringOptions({ style, technique, midi, durationSeconds: 2.6 }));
          const measured = measureT60(samples, frequency, 0.3, 2.6);
          expect(measured / target, `${style} ${technique} MIDI ${midi}`).toBeGreaterThan(0.9);
          expect(measured / target, `${style} ${technique} MIDI ${midi}`).toBeLessThan(1.1);
        }
      }
    }
  });

  test("keeps sustain even across the range rather than collapsing at high notes", () => {
    const low = luteStringDecay("renaissance-lute", "melody", midiFrequency(40)).fundamentalSeconds;
    const high = luteStringDecay("renaissance-lute", "melody", midiFrequency(88)).fundamentalSeconds;
    expect(low).toBeCloseTo(1.5 * 5.2 * 1.1, 6);
    expect(high / low).toBeGreaterThan(0.3);
    expect(high / low).toBeLessThan(0.4);
  });

  test("stays stable and free of DC where the loop filter is at its darkest", () => {
    const samples = renderLuteString(stringOptions({ style: "oud", technique: "drone", midi: 88, durationSeconds: 3 }));
    const peakOf = (values: Float32Array) => values.reduce((peak, sample) => Math.max(peak, Math.abs(sample)), 0);
    const peak = peakOf(samples);
    const tail = samples.slice(-sampleRate);
    const tailMean = tail.reduce((sum, sample) => sum + sample, 0) / tail.length;
    expect(peakOf(tail)).toBeLessThan(peak * 0.5);
    expect(Math.abs(tailMean)).toBeLessThan(peak * 1e-3);
  });

  test("lets brighter strings ring longer near the brightness frequency", () => {
    const midi = 57;
    const frequency = midiFrequency(midi);
    const partial =
      frequency * Math.round(luteStringDecay("gittern", "melody", frequency).brightnessFrequency / frequency);
    const brightRing = (style: (typeof styles)[number], technique: (typeof techniques)[number]) => {
      const samples = renderLuteString(stringOptions({ style, technique, midi, durationSeconds: 1.2 }));
      return measureT60(samples, measureFrequency(samples, partial, 0.05), 0.05, 0.6);
    };
    // Profile brightness: oud 0.58 < renaissance 0.68 < gittern 0.82.
    const oud = brightRing("oud", "melody");
    const renaissance = brightRing("renaissance-lute", "melody");
    const gittern = brightRing("gittern", "melody");
    expect(renaissance).toBeGreaterThan(oud * 1.2);
    expect(gittern).toBeGreaterThan(renaissance * 1.2);
    expect(brightRing("renaissance-lute", "drone")).toBeLessThan(renaissance / 1.2);

    const target = luteStringDecay("renaissance-lute", "melody", frequency).brightnessSeconds;
    expect(renaissance / target).toBeGreaterThan(0.85);
    expect(renaissance / target).toBeLessThan(1.15);
  });
});
