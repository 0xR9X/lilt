import { OptionSelect } from "@/components/controls/OptionSelect";
import { Field } from "@/components/controls/Field";
import { getAppearanceStore, useAppearance } from "./browser";

export function AppearanceControl() {
  const { preference } = useAppearance();
  return (
    <Field label="Appearance" inline compact>
      <OptionSelect
        aria-label="Appearance"
        className="w-28"
        value={preference}
        onValueChange={(next) => {
          if (next === "light" || next === "dark" || next === "system") getAppearanceStore().setPreference(next);
        }}
        options={[
          { value: "system", label: "System" },
          { value: "light", label: "Light" },
          { value: "dark", label: "Dark" },
        ]}
      />
    </Field>
  );
}
