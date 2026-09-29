import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import { cn } from "cn";

type ThumbAria = Pick<SliderPrimitive.Thumb.Props, "aria-label" | "aria-describedby" | "aria-valuetext">;

function Slider<Value extends number | readonly number[]>({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
  "aria-valuetext": ariaValueText,
  ...props
}: SliderPrimitive.Root.Props<Value> & ThumbAria) {
  // A scalar value has one thumb; only an array (or no value at all) describes a range.
  const current = value ?? defaultValue;
  const thumbs = Array.isArray(current) ? current.length : current === undefined ? 2 : 1;

  return (
    <SliderPrimitive.Root
      className={cn("data-horizontal:w-full data-vertical:h-full", className)}
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      thumbAlignment="edge"
      {...props}
    >
      <SliderPrimitive.Control className="relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-horizontal:h-7 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col">
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative grow overflow-hidden rounded-full bg-muted select-none data-horizontal:h-1 data-horizontal:w-full data-vertical:h-full data-vertical:w-1"
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="bg-primary select-none data-horizontal:h-full data-vertical:w-full"
          />
        </SliderPrimitive.Track>
        {Array.from({ length: thumbs }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            aria-label={ariaLabel}
            aria-describedby={ariaDescribedBy}
            aria-valuetext={ariaValueText}
            className="relative block size-3 shrink-0 rounded-full border border-ring bg-white ring-ring/50 transition-[color,box-shadow] select-none after:absolute after:-inset-2 hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden active:ring-3 disabled:pointer-events-none disabled:opacity-50"
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider };
