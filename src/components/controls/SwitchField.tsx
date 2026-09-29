import { useId, type ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function SwitchField({
  label,
  checked,
  disabled,
  ariaLabel,
  onCheckedChange,
}: {
  label: ReactNode;
  checked: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex min-h-9 items-center gap-2">
      <Switch
        id={id}
        aria-label={ariaLabel}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(next) => onCheckedChange(next)}
      />
      <Label htmlFor={id} className="font-normal">
        {label}
      </Label>
    </div>
  );
}
