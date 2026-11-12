"use client";

import type {
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
} from "react";
import { useEffect, useRef, useState } from "react";

import { useRecommendation } from "@/lib/use-recommendation";
import { AskComposer } from "./ask-composer";
import { AskResult } from "./ask-result";

const EXAMPLES = [
  "Smart shirt for a presentation, under ₹1,500",
  "Gym and classes both, joggers, ₹2,000",
  "Hoodie for cold mornings, under ₹1,800",
] as const;

export function ShopChat() {
  const [open, setOpen] = useState(false);
  const {
    message,
    setMessage,
    lastAsked,
    result,
    error,
    loading,
    hasPrior,
    submit,
    retry,
    reset,
  } = useRecommendation();

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => textareaRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open || (!result && !error)) return;
    const frame = requestAnimationFrame(() => {
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      bodyRef.current?.scrollTo({
        top: 0,
        behavior: reduce ? "auto" : "smooth",
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [open, result, error]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit(message);
  }

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setMessage(event.target.value);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      void submit(message);
    }
  }

  function fillExample(example: string) {
    setMessage(example);
    requestAnimationFrame(() => {
      const element = textareaRef.current;
      element?.focus();
      element?.setSelectionRange(example.length, example.length);
    });
  }

  const hasContent = Boolean(lastAsked || result || error || loading);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="fixed right-5 bottom-[max(20px,env(safe-area-inset-bottom))] z-40 h-11 rounded-[6px] bg-primary px-4 text-[13px] font-semibold text-primary-foreground transition-opacity duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Ask the stylist
      </button>
    );
  }

  return (
    <section
      role="dialog"
      aria-modal="false"
      aria-label="Thread stylist"
      className="fixed right-5 bottom-[max(20px,env(safe-area-inset-bottom))] z-50 flex max-h-[min(75vh,640px)] w-[min(420px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-[6px] border border-border bg-card"
    >
      <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <p className="font-heading text-[16px] font-semibold leading-none tracking-[-0.02em]">
            Thread stylist
          </p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            300 real Bewakoof pieces
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasPrior ? (
            <button
              type="button"
              onClick={reset}
              className="h-8 rounded-[4px] px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              New
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close stylist"
            className="h-8 rounded-[4px] px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Close
          </button>
        </div>
      </header>

      <div ref={bodyRef} className="flex-1 overflow-y-auto px-4 py-4">
        {hasContent ? (
          <>
            {lastAsked ? (
              <div className="ml-auto max-w-[85%] rounded-[4px] bg-secondary px-3 py-2 text-[13px] leading-5 text-secondary-foreground">
                {lastAsked}
              </div>
            ) : null}
            <AskResult
              compact
              showRequest={false}
              loading={loading}
              error={error}
              result={result}
              lastAsked={lastAsked}
              resultRef={resultRef}
              onRetry={retry}
            />
          </>
        ) : (
          <div>
            <p className="text-[13px] leading-5 text-muted-foreground">
              Budget, weather, occasion. I&apos;ll pick up to three real pieces
              and tell you why.
            </p>
            <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Try one
            </p>
            <div className="mt-2 flex flex-col gap-2">
              {EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => fillExample(example)}
                  className="rounded-[4px] border border-border bg-background px-2.5 py-2 text-left text-[12px] leading-5 transition-colors duration-150 hover:border-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-4">
        <AskComposer
          compact
          message={message}
          loading={loading}
          pinned={false}
          textareaRef={textareaRef}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onSubmit={handleSubmit}
        />
      </div>
    </section>
  );
}
