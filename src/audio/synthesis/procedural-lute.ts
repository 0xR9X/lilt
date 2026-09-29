import { createMusicRandom, mixMusicSeed } from "../composition/random";
import type { LuteStyleId, LuteTechnique } from "../composition/lute";

interface LutePhysicalProfile {
  courseDetuneCents: number;
  dampingSeconds: number;
  brightness: number;
  excitationBrightness: number;
  pluckPosition: number;
  bodyFrequencies: readonly [number, number];
  bodyAmount: number;
}

const PHYSICAL_PROFILES: Readonly<Record<LuteStyleId, LutePhysicalProfile>> = {
  "renaissance-lute": {
    courseDetuneCents: 1.4,
    dampingSeconds: 5.2,
    brightness: 0.68,
    excitationBrightness: 0.74,
    pluckPosition: 0.22,
    bodyFrequencies: [188, 372],
    bodyAmount: 0.18,
  },
  gittern: {
    courseDetuneCents: 2.2,
    dampingSeconds: 4.2,
    brightness: 0.82,
    excitationBrightness: 0.86,
    pluckPosition: 0.17,
    bodyFrequencies: [226, 448],
    bodyAmount: 0.14,
  },
  oud: {
    courseDetuneCents: 1.8,
    dampingSeconds: 5.8,
    brightness: 0.58,
    excitationBrightness: 0.66,
    pluckPosition: 0.27,
    bodyFrequencies: [164, 326],
    bodyAmount: 0.22,
  },
};

const TECHNIQUE_TONE: Readonly<Record<LuteTechnique, number>> = {
  melody: 1,
  rhythm: 0.82,
  // Sustained support wants the darkest, slowest-decaying courses of the three.
  drone: 0.72,
};

export interface LuteCourseRenderOptions {
  style: LuteStyleId;
  technique: LuteTechnique;
  midi: number;
  sampleRate: number;
  durationSeconds: number;
  seed: number;
}

function midiFrequency(midi: number, cents = 0): number {
  return 440 * 2 ** ((midi - 69 + cents / 100) / 12);
}

function normalize(samples: Float32Array, ceiling = 0.92): Float32Array {
  let peak = 0;
  for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
  if (peak === 0) return samples;
  const scale = ceiling / peak;
  for (let index = 0; index < samples.length; index += 1) samples[index] = (samples[index] ?? 0) * scale;
  return samples;
}

/** Frequency at which a string's brightness is specified as a decay time. */
const BRIGHTNESS_FREQUENCY = 2_500;
/** Courses at or below this pitch keep the profile's full sustain. */
const DECAY_REFERENCE_FREQUENCY = 110;
/** High notes ring shorter, but only gently: T60 scales with (reference / f)^0.45. */
const DECAY_PITCH_EXPONENT = 0.45;
const MIN_DECAY_PITCH_SCALE = 0.3;
/** Keeps the loop filter's pole well inside the unit circle. */
const MAX_LOOP_POLE = 0.97;
/** The loop's DC gain must stay below one or its DC mode would grow. */
const MAX_LOOP_DC_GAIN = 0.9999;

/** Sixty-decibel decay targets for one string of a course. */
export interface LuteStringDecay {
  /** T60 of the fundamental, in seconds. */
  fundamentalSeconds: number;
  /** T60 of a partial at `brightnessFrequency`, in seconds. */
  brightnessSeconds: number;
  brightnessFrequency: number;
}

function stringDecay(frequency: number, profile: LutePhysicalProfile, tone: number): LuteStringDecay {
  const pitchScale = Math.min(
    1,
    Math.max(MIN_DECAY_PITCH_SCALE, (DECAY_REFERENCE_FREQUENCY / frequency) ** DECAY_PITCH_EXPONENT),
  );
  // dampingSeconds describes a 40 dB fall; low courses have always rung for
  // about 1.5 times that to reach -60 dB.
  const fortyDecibelSeconds = Math.max(0.2, profile.dampingSeconds * (0.72 + 0.38 * tone));
  const fundamentalSeconds = 1.5 * fortyDecibelSeconds * pitchScale;
  // Fitted to the high-frequency ring of the earlier two-point/one-pole loop
  // at the reference pitch, so low courses keep their familiar colour.
  const brightness = Math.min(0.96, Math.max(0.08, profile.brightness * tone));
  const brightnessSeconds = Math.min(0.8 * fundamentalSeconds, 0.058 * Math.exp(4.5 * brightness) * pitchScale);
  return { fundamentalSeconds, brightnessSeconds, brightnessFrequency: BRIGHTNESS_FREQUENCY };
}

/** Decay targets for the course's first string, exposed for analysis and tests. */
export function luteStringDecay(style: LuteStyleId, technique: LuteTechnique, frequency: number): LuteStringDecay {
  return stringDecay(frequency, PHYSICAL_PROFILES[style], TECHNIQUE_TONE[technique]);
}

interface StringLoop {
  delayLength: number;
  /** One-pole low-pass `gain / (1 - pole·z⁻¹)`: all of the loop's loss. */
  gain: number;
  pole: number;
  /** First-order all-pass `(C + z⁻¹) / (1 + C·z⁻¹)`: the fractional delay. */
  allPass: number;
}

function onePoleMagnitude(pole: number, omega: number): number {
  return (1 - pole) / Math.sqrt(1 - 2 * pole * Math.cos(omega) + pole * pole);
}

/**
 * Solves the loop filter so the fundamental and the brightness frequency
 * decay at their target rates, then splits the remaining period between the
 * integer delay line and an all-pass so the loop's phase delay at f0 is exact.
 */
function designStringLoop(frequency: number, sampleRate: number, decay: LuteStringDecay): StringLoop {
  const omega = (2 * Math.PI * frequency) / sampleRate;
  const brightOmega = (2 * Math.PI * Math.min(decay.brightnessFrequency, sampleRate * 0.45)) / sampleRate;
  const fundamentalGain = 10 ** (-3 / (frequency * decay.fundamentalSeconds));
  const wantedRatio = Math.min(1, 10 ** (-3 / (frequency * decay.brightnessSeconds)) / fundamentalGain);

  // Both the bright/fundamental ratio and the gain at f0 fall as the pole rises.
  // A one-pole cannot darken a high, long-ringing note much without lifting its
  // DC gain past one, so there the darkest stable pole wins and Tb runs long.
  let low = 0;
  let high = brightOmega > omega ? MAX_LOOP_POLE : 0;
  for (let iteration = 0; iteration < 40; iteration += 1) {
    const middle = (low + high) / 2;
    const fundamentalMagnitude = onePoleMagnitude(middle, omega);
    const tooDark = onePoleMagnitude(middle, brightOmega) / fundamentalMagnitude < wantedRatio;
    const unstable = fundamentalGain / fundamentalMagnitude > MAX_LOOP_DC_GAIN;
    if (tooDark || unstable) high = middle;
    else low = middle;
  }
  const pole = low;
  const gain = (fundamentalGain / onePoleMagnitude(pole, omega)) * (1 - pole);

  const onePoleDelay = Math.atan2(pole * Math.sin(omega), 1 - pole * Math.cos(omega)) / omega;
  const rest = sampleRate / frequency - onePoleDelay;
  const delayLength = Math.max(2, Math.floor(rest - 0.5));
  const fraction = rest - delayLength;
  const ratio = Math.tan((omega * fraction) / 2) / Math.tan(omega / 2);
  return { delayLength, gain, pole, allPass: (1 - ratio) / (1 + ratio) };
}

/**
 * One deterministic extended Karplus–Strong string. The excitation is combed
 * at the virtual plucking point, then recirculated through a solved one-pole
 * loss filter and a tuning all-pass.
 * This is an original implementation of the published algorithm, not source
 * derived from the unlicensed JavaScript reference project.
 */
function renderString(
  frequency: number,
  sampleRate: number,
  length: number,
  profile: LutePhysicalProfile,
  tone: number,
  seed: number,
  samples: Float32Array = new Float32Array(length),
  workspace?: StringRenderWorkspace,
): Float32Array {
  const loop = designStringLoop(frequency, sampleRate, stringDecay(frequency, profile, tone));
  const { delayLength, gain, pole, allPass } = loop;
  const delay = workspace ? resizeBuffer(workspace.delay, delayLength) : new Float32Array(delayLength);
  const noise = workspace ? resizeBuffer(workspace.noise, delayLength) : new Float32Array(delayLength);
  if (workspace) {
    workspace.delay = delay;
    workspace.noise = noise;
  }
  const activeDelay = delay.subarray(0, delayLength);
  const activeNoise = noise.subarray(0, delayLength);
  const random = createMusicRandom(seed);
  let roundedNoise = 0;
  for (let index = 0; index < delayLength; index += 1) {
    const rawNoise = random() * 2 - 1;
    roundedNoise += (rawNoise - roundedNoise) * profile.excitationBrightness;
    activeNoise[index] = roundedNoise;
  }

  const pluckOffset = Math.max(1, Math.round(delayLength * profile.pluckPosition));
  let excitationSum = 0;
  for (let index = 0; index < delayLength; index += 1) {
    const excitation = (activeNoise[index] ?? 0) - (activeNoise[(index + pluckOffset) % delayLength] ?? 0) * 0.52;
    activeDelay[index] = excitation;
    excitationSum += excitation;
  }
  // The loop's DC gain can sit just below one, so start it with no DC to hold.
  const excitationMean = excitationSum / delayLength;
  for (let index = 0; index < delayLength; index += 1) activeDelay[index] = (activeDelay[index] ?? 0) - excitationMean;

  const activeSamples = samples.subarray(0, length);
  let lowPassed = 0;
  let allPassInput = 0;
  let allPassOutput = 0;
  for (let index = 0; index < length; index += 1) {
    const cursor = index % delayLength;
    const current = activeDelay[cursor] ?? 0;
    lowPassed = gain * current + pole * lowPassed;
    allPassOutput = allPass * lowPassed + allPassInput - allPass * allPassOutput;
    allPassInput = lowPassed;
    activeDelay[cursor] = allPassOutput;
    const attack = Math.min(1, index / Math.max(1, sampleRate * 0.0035));
    activeSamples[index] = current * attack;
  }
  return activeSamples;
}

/** Renders the course's first string alone at `cents` from the note, for analysis and tests. */
export function renderLuteString(options: LuteCourseRenderOptions, cents = 0): Float32Array {
  const length = courseLength(options);
  return renderString(
    midiFrequency(options.midi, cents),
    options.sampleRate,
    length,
    PHYSICAL_PROFILES[options.style],
    TECHNIQUE_TONE[options.technique],
    mixMusicSeed(options.seed, 0, 0x434f5552),
    new Float32Array(length),
  );
}

interface StringRenderWorkspace {
  delay: Float32Array;
  noise: Float32Array;
}

function resizeBuffer(buffer: Float32Array, minimumLength: number): Float32Array {
  return buffer.length >= minimumLength ? buffer : new Float32Array(minimumLength);
}

function courseLength(options: LuteCourseRenderOptions): number {
  return Math.max(1, Math.ceil(Math.max(0.08, options.durationSeconds) * options.sampleRate));
}

function renderLuteCourseInto(
  options: LuteCourseRenderOptions,
  firstBuffer: Float32Array,
  secondBuffer: Float32Array,
  workspaces?: readonly [StringRenderWorkspace, StringRenderWorkspace],
): Float32Array {
  const profile = PHYSICAL_PROFILES[options.style];
  const tone = TECHNIQUE_TONE[options.technique];
  const length = courseLength(options);
  const first = renderString(
    midiFrequency(options.midi, -profile.courseDetuneCents / 2),
    options.sampleRate,
    length,
    profile,
    tone,
    mixMusicSeed(options.seed, 0, 0x434f5552),
    firstBuffer,
    workspaces?.[0],
  );
  const second = renderString(
    midiFrequency(options.midi, profile.courseDetuneCents / 2),
    options.sampleRate,
    length,
    profile,
    tone * 0.96,
    mixMusicSeed(options.seed, 1, 0x434f5552),
    secondBuffer,
    workspaces?.[1],
  );
  for (let index = 0; index < length; index += 1) {
    first[index] = (first[index] ?? 0) * 0.58 + (second[index] ?? 0) * 0.42;
  }
  addBodyResonance(first, options.sampleRate, profile);
  return normalize(first);
}

function addBodyResonance(samples: Float32Array, sampleRate: number, profile: LutePhysicalProfile): void {
  for (const [resonanceIndex, frequency] of profile.bodyFrequencies.entries()) {
    const amount = profile.bodyAmount * (resonanceIndex === 0 ? 1 : 0.62);
    const radius = resonanceIndex === 0 ? 0.992 : 0.987;
    const coefficient = 2 * radius * Math.cos((2 * Math.PI * frequency) / sampleRate);
    const radiusSquared = radius * radius;
    let previous = 0;
    let previousPrevious = 0;
    for (let index = 0; index < samples.length; index += 1) {
      const sample = samples[index] ?? 0;
      const resonated = sample * (1 - radius) + coefficient * previous - radiusSquared * previousPrevious;
      samples[index] = sample + resonated * amount;
      previousPrevious = previous;
      previous = resonated;
    }
  }
}

/**
 * Reuses the renderer's PCM and delay-line storage across scheduled notes.
 * Callers must consume or copy each returned view before the next render.
 */
export class ProceduralLuteRenderPool {
  private firstCourse: Float32Array<ArrayBufferLike> = new Float32Array(0);
  private secondCourse: Float32Array<ArrayBufferLike> = new Float32Array(0);
  private readonly stringWorkspaces: [StringRenderWorkspace, StringRenderWorkspace] = [
    { delay: new Float32Array(0), noise: new Float32Array(0) },
    { delay: new Float32Array(0), noise: new Float32Array(0) },
  ];

  renderCourse(options: LuteCourseRenderOptions): Float32Array {
    const length = courseLength(options);
    this.firstCourse = resizeBuffer(this.firstCourse, length);
    this.secondCourse = resizeBuffer(this.secondCourse, length);
    return renderLuteCourseInto(options, this.firstCourse, this.secondCourse, this.stringWorkspaces);
  }
}
