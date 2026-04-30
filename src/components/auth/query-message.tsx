"use client";

import { useSearchParams } from "next/navigation";
import { CircleAlert, CircleCheck } from "lucide-react";

import { cn } from "@/lib/utils";

export function QueryMessage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const message = searchParams.get("message");

  if (!error && !message) {
    return null;
  }

  return (
    <div
      role={error ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm leading-6 shadow-sm",
        error
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-primary/25 bg-primary/10 text-foreground",
      )}
    >
      <span className="mt-0.5 shrink-0">
        {error ? <CircleAlert className="size-4" /> : <CircleCheck className="size-4 text-primary" />}
      </span>
      <div className="space-y-1">
        <p className="font-medium">{error ? "Hay algo que revisar" : "Todo correcto"}</p>
        <p>{error ?? message}</p>
      </div>
    </div>
  );
}
