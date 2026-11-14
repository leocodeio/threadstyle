"use client";

import type {
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
} from "react";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, MessageSquare, SquarePen, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { pastTurns } from "@/lib/turns";
import { useRecommendation } from "@/lib/use-recommendation";
import { AskComposer } from "./ask-composer";
import { AskHistory } from "./ask-history";
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
    turns,
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
      // Bring the newest question and its answer into view, with the earlier
      // turns scrolled out above it.
      bodyRef.current?.scrollTo({
        top: bodyRef.current.scrollHeight,
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

  const hasContent = Boolean(
    lastAsked || result || error || loading || turns.length > 0,
  );
  const showingLatest = !loading && error === null && result !== null;
  const history = pastTurns(turns, showingLatest);

  if (!open) {
    return (
      <div className="fixed right-5 bottom-[max(20px,env(safe-area-inset-bottom))] z-40">
        {/* Top scribble */}
        <svg
          aria-hidden="true"
          viewBox="0 0 40 44"
          fill="none"
          className="pointer-events-none absolute -top-11 right-8 h-11 w-10 text-foreground"
        >
          <path
            d="M23 4C16 11 19 18 25 17C29 16 27 10 21 13C15 16 16 26 18 37"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 31.5L18.2 38.5L24 31"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {/* Left scribble */}
        <svg
          aria-hidden="true"
          viewBox="0 0 56 32"
          fill="none"
          className="pointer-events-none absolute top-1/2 -left-15 h-8 w-14 -translate-y-1/2 text-foreground"
        >
          <path
            d="M4 19C12 10 21 11 19 18C18 23 13 21 16 15C19 9 32 13 48 16"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M42.5 10.5L49.5 16.2L42 21.5"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <Button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className="h-11 gap-2 rounded-[6px] px-4 text-[13px] font-semibold"
        >
          <MessageSquare className="size-4" aria-hidden="true" />
          Ask the stylist
        </Button>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={() => setOpen(false)}
        className="fixed inset-0 z-40 cursor-default bg-background/25 backdrop-blur-[2px] animate-in fade-in duration-150"
      />
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
          <div className="flex items-center gap-1">
            {hasPrior || turns.length > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={reset}
                aria-label="New chat"
                title="New chat"
                className="text-muted-foreground hover:text-foreground"
              >
                <SquarePen className="size-3.5" aria-hidden="true" />
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setOpen(false)}
              aria-label="Close stylist"
              title="Close stylist"
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </header>

        <div ref={bodyRef} className="flex-1 overflow-y-auto px-4 py-4">
          {hasContent ? (
            <>
              <AskHistory compact turns={history} />
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
                  <Button
                    key={example}
                    type="button"
                    variant="outline"
                    onClick={() => fillExample(example)}
                    className="h-auto justify-between gap-2 rounded-[4px] border-border bg-background px-2.5 py-2 text-left text-[12px] font-normal leading-5 whitespace-normal hover:border-foreground hover:bg-background"
                  >
                    <span>{example}</span>
                    <ArrowUpRight
                      className="size-3.5 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </Button>
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
    </>
  );
}
