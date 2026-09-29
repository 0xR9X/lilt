import { useId, type ReactNode } from "react";
import { ChevronRightIcon } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

/** Closed panels unmount so hidden sections do not run hooks or expensive tools. */
export function Disclosure({
  title,
  children,
  compact = false,
  description,
}: {
  title: string;
  children: ReactNode;
  compact?: boolean;
  description?: string;
}) {
  const id = useId();
  return (
    <Collapsible className={cn("min-w-0", !compact && "border-t")}>
      <CollapsibleTrigger
        aria-label={title}
        aria-describedby={description ? `${id}-description` : undefined}
        className={cn(
          "group flex w-full cursor-pointer items-center justify-between gap-2 rounded-sm py-3 text-left text-sm font-medium outline-none hover:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
          compact && "w-fit py-1 text-xs font-normal text-muted-foreground hover:text-foreground",
        )}
      >
        <span className="flex flex-col gap-1">
          {title}
          {description && (
            <span id={`${id}-description`} className="text-xs leading-normal font-normal text-muted-foreground">
              {description}
            </span>
          )}
        </span>
        <ChevronRightIcon className="size-3.5 shrink-0 text-muted-foreground transition-transform group-data-panel-open:rotate-90" />
      </CollapsibleTrigger>
      <CollapsibleContent
        className={cn("flex flex-col gap-6 pt-1 pb-6", compact && "gap-2 pt-3 pb-0 text-xs text-muted-foreground")}
      >
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
