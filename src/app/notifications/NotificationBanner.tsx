import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { dismissNotification, useNotification } from "./store";
export function NotificationBanner() {
  const notice = useNotification();
  return (
    <div
      className="fixed right-6 bottom-6 z-100 max-w-[min(440px,calc(100vw-48px))]"
      aria-live="polite"
      aria-atomic="true"
    >
      {notice && (
        <div
          className={cn(
            "flex items-center gap-4 rounded-lg border bg-popover px-4 py-2 text-sm text-popover-foreground shadow-md",
            notice.tone === "error" && "text-destructive",
          )}
        >
          <p>{notice.message}</p>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            aria-label="Dismiss notification"
            onClick={dismissNotification}
          >
            Dismiss
          </Button>
        </div>
      )}
    </div>
  );
}
