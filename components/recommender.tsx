"use client";

import type {
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
} from "react";
import { useEffect, useRef } from "react";
import { SquarePen } from "lucide-react";

import { AskComposer } from "@/components/ask-composer";
import { AskHero } from "@/components/ask-hero";
import { AskHistory } from "@/components/ask-history";
import { AskResult } from "@/components/ask-result";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { pastTurns } from "@/lib/turns";
import { useRecommendation } from "@/lib/use-recommendation";

export function Recommender() {
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

  const composerPinned =
    loading || error !== null || result !== null || turns.length > 0;
  const showingLatest = !loading && error === null && result !== null;
  const history = pastTurns(turns, showingLatest);

  return (
    <main className="mx-auto flex w-full max-w-[768px] flex-1 flex-col px-6">
      <AskHero
        showExamples={!loading && !result && turns.length === 0}
        onExample={fillExample}
      />
      <AskHistory turns={history} />
      <AskResult
        loading={loading}
        error={error}
        result={result}
        lastAsked={lastAsked}
        resultRef={resultRef}
        onRetry={retry}
      />
      {hasPrior || turns.length > 0 ? (
        <div className="mt-4 flex items-center justify-between gap-2">
          {turns.length > 0 ? (
            <Badge
              variant="secondary"
              className="h-5 rounded-[4px] px-1.5 font-mono text-[10px] tabular-nums text-muted-foreground"
            >
              {turns.length} {turns.length === 1 ? "turn" : "turns"}
            </Badge>
          ) : (
            <span />
          )}
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
