import type { ReactNode } from "react";
import { SwitchField } from "@/components/controls/SwitchField";
import { RangeField } from "@/components/controls/RangeField";

export function EffectSlider({
  label,
  ariaLabel,
  value,
  minimum,
  maximum,
  step,
  unit,
  disabled,
  onChange,
}: {
  label: string;
  ariaLabel?: string;
  value: number;
  minimum: number;
  maximum: number;
  step: number;
  unit: string;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  const precision = Number.isInteger(step) ? 0 : step < 0.1 ? 2 : 1;
  return (
    <RangeField
      label={label}
      ariaLabel={ariaLabel ?? label}
      value={value}
      min={minimum}
      max={maximum}
      step={step}
      display={`${value.toFixed(precision)} ${unit}`}
      disabled={disabled}
      onChange={onChange}
    />
  );
}

export function EffectBlock({
  name,
  enabled,
  bypassed,
  onEnabledChange,
  children,
}: {
  name: string;
  enabled: boolean;
  bypassed: boolean;
  onEnabledChange: (enabled: boolean) => void;
  children: ReactNode;
}) {
  return (
    <div
      role="group"
      aria-label={`${name} effect`}
      className="grid grid-cols-[128px_minmax(0,1fr)] items-start gap-x-6 gap-y-2 py-2 max-sm:grid-cols-1"
    >
      <SwitchField
        label={name}
        ariaLabel={name}
        checked={enabled}
        disabled={bypassed}
        onCheckedChange={onEnabledChange}
      />
      {enabled && !bypassed && (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(110px,1fr))] gap-4 py-1 max-sm:grid-cols-2 max-sm:pl-9">
          {children}
        </div>
      )}
    </div>
  );
}
