"use client";

import type {
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
} from "react";
import { useEffect, useRef } from "react";

import { useRecommendation } from "@/lib/use-recommendation";
import { AskComposer } from "@/components/ask-composer";
import { AskHero } from "@/components/ask-hero";
import { AskResult } from "@/components/ask-result";

export function Recommender() {
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

  useEffect(() => {
    if (!result && !error) return;
    const element = resultRef.current;
    if (!element) return;

    const frame = requestAnimationFrame(() => {
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      element.scrollIntoView({
        behavior: reduce ? "auto" : "smooth",
        block: "start",
      });
      element.focus({ preventScroll: true });
    });

    return () => cancelAnimationFrame(frame);
  }, [result, error]);

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

  const composerPinned = loading || error !== null || result !== null;

  return (
    <main className="mx-auto flex w-full max-w-[768px] flex-1 flex-col px-6">
      <AskHero
        showExamples={!loading && !result}
        onExample={fillExample}
      />
      <AskResult
        loading={loading}
        error={error}
        result={result}
        lastAsked={lastAsked}
        resultRef={resultRef}
        onRetry={retry}
      />
      {hasPrior ? (
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            onClick={reset}
            className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            New chat
          </button>
        </div>
      ) : null}
      <AskComposer
        message={message}
        loading={loading}
        pinned={composerPinned}
        textareaRef={textareaRef}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onSubmit={handleSubmit}
      />
    </main>
  );
}
