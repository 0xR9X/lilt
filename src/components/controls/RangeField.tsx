import { useId } from "react";
import { Slider } from "@/components/ui/slider";

export function RangeField({
  label,
  ariaLabel,
  value,
  min = 0,
  max = 100,
  step = 1,
  display,
  disabled,
  description,
  onChange,
}: {
  label: string;
  ariaLabel?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  display: string;
  disabled?: boolean;
  description?: string;
  onChange: (value: number) => void;
}) {
  const id = useId();
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span>{label}</span>
        <output className="text-[11px] whitespace-nowrap text-muted-foreground tabular-nums">{display}</output>
      </div>
      <Slider
        aria-label={ariaLabel ?? label}
        aria-valuetext={display}
        aria-describedby={description ? `${id}-hint` : undefined}
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onValueChange={onChange}
      />
      {description && (
        <p id={`${id}-hint`} className="text-xs leading-normal text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}
