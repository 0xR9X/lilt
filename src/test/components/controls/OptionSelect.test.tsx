import { useState } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { OptionSelect } from "@/components/controls/OptionSelect";
import { press } from "@/test/dom";

const options = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
];

function Example({ onChange = () => {} }: { onChange?: (value: string) => void }) {
  const [value, setValue] = useState("apple");
  return (
    <OptionSelect
      aria-label="Fruit"
      value={value}
      options={options}
      onValueChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

function selectedLabel() {
  return screen.getByRole("combobox").querySelector("[data-slot=select-value]")?.textContent;
}

afterEach(cleanup);

describe("option select", () => {
  test("shows the selected label and commits a pointer selection", () => {
    const onChange = vi.fn();
    render(<Example onChange={onChange} />);
    const trigger = screen.getByRole("combobox", { name: "Fruit" });
    expect(selectedLabel()).toBe("Apple");
    fireEvent.click(trigger);
    expect(screen.getByRole("option", { name: "Apple", selected: true })).toBeTruthy();
    press(screen.getByRole("option", { name: "Banana" }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith("banana");
    expect(selectedLabel()).toBe("Banana");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  test("commits from the keyboard and ignores reselecting the current value", () => {
    const onChange = vi.fn();
    render(<Example onChange={onChange} />);
    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);
    press(screen.getByRole("option", { name: "Apple" }));
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(trigger);
    fireEvent.keyDown(screen.getByRole("option", { name: "Cherry" }), { key: "Enter" });
    expect(onChange).toHaveBeenCalledExactlyOnceWith("cherry");
  });

  test("reflects controlled changes and disables an empty list", () => {
    const props = { "aria-label": "Fruit", options, onValueChange: vi.fn() };
    const view = render(<OptionSelect {...props} value="apple" />);
    view.rerender(<OptionSelect {...props} value="cherry" />);
    expect(selectedLabel()).toBe("Cherry");
    view.rerender(<OptionSelect {...props} options={[]} value="cherry" />);
    act(() => fireEvent.click(screen.getByRole("combobox")));
    expect(screen.queryByRole("listbox")).toBeNull();
  });
});
