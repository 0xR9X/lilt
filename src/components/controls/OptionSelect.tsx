import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface SelectOption {
  value: string;
  label: string;
}

/** A select-only combobox over a flat list of labelled string values. */
export function OptionSelect({
  "aria-label": label,
  value,
  options,
  onValueChange,
  disabled,
  className,
}: {
  "aria-label": string;
  value: string;
  options: readonly SelectOption[];
  onValueChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Select
      items={options}
      value={value}
      disabled={disabled || !options.length}
      onValueChange={(next) => {
        if (next !== null && next !== value) onValueChange(next);
      }}
    >
      <SelectTrigger aria-label={label} className={cn("h-9 w-full min-w-0", className)}>
        <SelectValue className="truncate" />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
