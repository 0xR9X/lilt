import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { getMusicApplication } from "@/audio/application";
import { getMusicSettings, setMusicControlMode } from "@/audio/musicSettings";
import { getMusicRoot } from "@/audio/composition/roots";
import { reloadMusicSettingsFromStorage } from "@/test/music-settings";
import { MusicControls } from "@/components/music/controls/MusicControls";
import { press, settle } from "@/test/dom";

function choose(label: string, option: string) {
  fireEvent.click(screen.getByRole("combobox", { name: label }));
  press(screen.getByRole("option", { name: option }));
}

async function renderControls() {
  render(<MusicControls />);
  await settle();
}

async function openSection(title: string) {
  fireEvent.click(screen.getByRole("button", { name: title }));
  await settle();
}

describe("music settings", () => {
  beforeEach(() => {
    localStorage.clear();
    reloadMusicSettingsFromStorage();
    getMusicApplication().session.reset();
  });
  afterEach(cleanup);

  test("shows one style selector and tempo, with detailed settings closed", async () => {
    await renderControls();
    expect(screen.getAllByRole("combobox")).toHaveLength(1);
    expect(screen.getAllByRole("slider")).toHaveLength(1);
    expect(screen.getByRole("slider", { name: "Tempo" })).toBeTruthy();
    for (const title of ["Melody", "Accompaniment", "Effects", "Playback"]) {
      expect(screen.getByRole("button", { name: title }).getAttribute("aria-expanded")).toBe("false");
    }
    await openSection("Effects");
    expect(screen.getByRole("switch", { name: "Effects enabled" })).toBeTruthy();
    expect(getMusicSettings().controlMode).toBe("auto");
  });

  test("selecting a style fixes it for later tracks; automatic resumes without changing this track", async () => {
    await renderControls();
    const controller = getMusicApplication().session;
    choose("Style", "Upbeat");
    expect(getMusicSettings().controlMode).toBe("override");
    expect(controller.getState().rootId).toBe("road");
    expect(controller.getState().bpm).toBe(getMusicRoot("road").tempo.default);
    fireEvent.change(screen.getByRole("slider", { name: "Tempo" }), { target: { value: "100" } });
    expect(controller.getState().bpm).toBe(100);
    act(() => controller.directNextPiece());
    expect(controller.getState().rootId).toBe("road");
    const before = controller.getState();
    choose("Style", "Automatic · changes each track");
    expect(getMusicSettings().controlMode).toBe("auto");
    expect(controller.getState()).toBe(before);
    act(() => controller.directNextPiece());
    expect(controller.getState().rootId).not.toBe("road");
  });

  test("keeping the current automatic style preserves its tempo and musical choices", async () => {
    const controller = getMusicApplication().session;
    controller.setRoot("hearth");
    controller.setBpm(86);
    controller.setFormOverride("strophic");
    await renderControls();
    const before = controller.getState();
    choose("Style", "Gentle");
    expect(getMusicSettings().controlMode).toBe("override");
    expect(controller.getState()).toBe(before);
  });

  test("edits melody choices and hides settings that have no effect", async () => {
    setMusicControlMode("override");
    getMusicApplication().session.setRoot("hearth");
    await renderControls();
    const controller = getMusicApplication().session;
    await openSection("Melody");
    choose("Song structure", "Verse with return");
    choose("Key", "D dorian");
    expect(controller.getState().formOverride).toBe("strophic");
    expect(controller.getState().tonicOverride).toBe(50);
    choose("Melody chord size", "Up to 2 notes");
    expect(controller.getState().chords.maxCourses).toBe(2);
    fireEvent.change(screen.getByRole("slider", { name: "Added harmony" }), { target: { value: "0" } });
    expect(screen.queryByRole("combobox", { name: "Melody chord size" })).toBeNull();
    expect(screen.queryByRole("slider", { name: "Melody strum spacing" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Reset melody harmony" }));
    await settle();
    expect(screen.getByRole("combobox", { name: "Melody chord size" })).toBeTruthy();
    choose("Style", "Upbeat");
    expect(screen.queryByRole("combobox", { name: "Song structure" })).toBeNull();
    expect(controller.getState().formOverride).toBeNull();
    fireEvent.click(screen.getByRole("switch", { name: "Play melody" }));
    expect(controller.getState().mutedParts.strings).toBe(true);
    expect(screen.queryByRole("slider", { name: "Added harmony" })).toBeNull();
  });

  test("accompaniment edits survive muting and closing the section", async () => {
    await renderControls();
    const controller = getMusicApplication().session;
    await openSection("Accompaniment");
    fireEvent.change(screen.getByRole("slider", { name: "Accompaniment volume" }), { target: { value: "27" } });
    choose("Accompaniment chord size", "Up to 2 notes");
    const configured = controller.getState().rhythmLute;
    expect(configured.level).toBe(0.27);
    expect(configured.maxCourses).toBe(2);
    fireEvent.click(screen.getByRole("switch", { name: "Play accompaniment" }));
    expect(controller.getState().mutedParts.rhythm).toBe(true);
    expect(screen.queryByRole("slider", { name: "Accompaniment volume" })).toBeNull();
    await openSection("Accompaniment");
    await openSection("Accompaniment");
    fireEvent.click(screen.getByRole("switch", { name: "Play accompaniment" }));
    await settle();
    expect(controller.getState().rhythmLute).toEqual(configured);
    expect((screen.getByRole("slider", { name: "Accompaniment volume" }) as HTMLInputElement).valueAsNumber).toBe(27);
  });

  test("playback preferences are available with automatic style and do not change the seed", async () => {
    await renderControls();
    const controller = getMusicApplication().session;
    const before = controller.getState();
    await openSection("Playback");
    fireEvent.click(screen.getByRole("switch", { name: "Keep playing" }));
    fireEvent.change(screen.getByRole("slider", { name: "Natural timing" }), { target: { value: "72" } });
    expect(controller.getState().autoAdvance).toBe(!before.autoAdvance);
    expect(controller.getState().humanization).toBe(0.72);
    expect(controller.getState().masterSeed).toBe(before.masterSeed);
    expect(getMusicSettings().controlMode).toBe("auto");
    fireEvent.click(screen.getByRole("combobox", { name: "Style" }));
    const options = within(screen.getByRole("listbox")).getAllByRole("option");
    expect(options).toHaveLength(10);
  });
});
