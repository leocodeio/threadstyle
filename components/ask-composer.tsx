"use client";

import type {
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  RefObject,
} from "react";
import { useEffect } from "react";
import { ArrowUp, CornerDownLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "cn";

type AskComposerProps = {
  readonly message: string;
  readonly loading: boolean;
  readonly pinned: boolean;
  readonly compact?: boolean;
  readonly textareaRef: RefObject<HTMLTextAreaElement | null>;
  readonly onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  readonly onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  readonly onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function AskComposer({
  message,
  loading,
  pinned,
  compact = false,
  textareaRef,
  onChange,
  onKeyDown,
  onSubmit,
}: AskComposerProps) {
  useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, compact ? 96 : 112)}px`;
  }, [message, textareaRef, compact]);

  return (
    <div
      className={cn(
        "mt-auto pb-[max(16px,env(safe-area-inset-bottom))]",
        compact ? "bg-card pt-3" : "bg-background pt-6",
        pinned && "sticky bottom-0 z-10",
      )}
    >
      <Card
        size="sm"
        className={cn(
          "gap-0 rounded-[6px] border border-border bg-card py-0 ring-0 transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40",
          compact ? "p-2.5" : "p-3",
        )}
      >
        <form onSubmit={onSubmit}>
          <label
            htmlFor={compact ? "shop-ask" : "ask-request"}
            className="sr-only"
          >
            Describe what you need
          </label>
          <Textarea
            id={compact ? "shop-ask" : "ask-request"}
            ref={textareaRef}
            rows={2}
            maxLength={300}
            value={message}
            onChange={onChange}
            onKeyDown={onKeyDown}
            placeholder={
              compact
                ? "What do you need?"
                : "Describe the day, budget, and occasion…"
            }
            className={cn(
              "max-h-28 w-full resize-none rounded-none border-0 bg-transparent px-0 py-0 shadow-none focus-visible:ring-0 dark:bg-transparent",
              compact
                ? "min-h-10 text-[14px] leading-5"
                : "min-h-11 text-[15px] leading-6",
            )}
          />
          <div className="mt-2 flex items-center justify-between gap-3 border-t border-border/60 pt-2">
            <div className="flex items-center gap-3 text-[10.5px] text-muted-foreground">
              <span className="font-mono tabular-nums">
                {message.length}/300
              </span>
              {!compact ? (
                <span className="hidden items-center gap-1 sm:inline-flex">
                  <CornerDownLeft className="size-3" aria-hidden="true" />
                  Enter to send
                </span>
              ) : null}
            </div>
            <Button
              type="submit"
              disabled={loading || message.trim().length < 3}
              className={cn(
                "rounded-[6px] font-semibold",
                compact ? "h-8 px-3 text-[12px]" : "h-9 px-3.5 text-[13px]",
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  Finding…
                </>
              ) : (
                <>
                  Find pieces
                  <ArrowUp className="size-3.5" aria-hidden="true" />
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
      {compact ? null : (
        <p className="mt-2 text-center text-[10.5px] leading-4 text-muted-foreground">
          Real Bewakoof catalogue · prices are a 11 Nov 2026 snapshot
        </p>
      )}
    </div>
  );
}
