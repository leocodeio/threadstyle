"use client";

import type {
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  RefObject,
} from "react";
import { useEffect } from "react";

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
      className={[
        "mt-auto pb-[max(16px,env(safe-area-inset-bottom))]",
        compact ? "bg-card pt-3" : "bg-background pt-6",
        pinned ? "sticky bottom-0 z-10" : "",
      ].join(" ")}
    >
      <form
        onSubmit={onSubmit}
        className={[
          "rounded-[6px] border border-border bg-card",
          compact ? "p-2.5" : "p-3",
        ].join(" ")}
      >
        <label htmlFor={compact ? "shop-ask" : "ask-request"} className="sr-only">
          Describe what you need
        </label>
        <textarea
          id={compact ? "shop-ask" : "ask-request"}
          ref={textareaRef}
          rows={2}
          maxLength={300}
          value={message}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder={
            compact ? "What do you need?" : "Describe the day, budget, and occasion…"
          }
          className={[
            "max-h-28 w-full resize-none rounded-[4px] bg-transparent outline-none placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            compact
              ? "min-h-10 text-[14px] leading-5"
              : "min-h-11 text-[15px] leading-6",
          ].join(" ")}
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="font-mono text-[10.5px] tabular-nums text-muted-foreground">
            {message.length}/300
          </p>
          <button
            type="submit"
            disabled={loading || message.trim().length < 3}
            className={[
              "rounded-[6px] bg-primary font-semibold text-primary-foreground transition-opacity duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50",
              compact ? "h-9 px-3 text-[12px]" : "h-11 px-4 text-[13px]",
            ].join(" ")}
          >
            {loading ? "Finding…" : "Find pieces"}
          </button>
        </div>
      </form>
      {compact ? null : (
        <p className="mt-2 text-center text-[10.5px] leading-4 text-muted-foreground">
          Real Bewakoof catalogue · prices are a 11 Nov 2026 snapshot
        </p>
      )}
    </div>
  );
}
