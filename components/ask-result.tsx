import type { RefObject } from "react";

import type { RecommendResponse, RecommendState } from "@/lib/recommend-types";
import { RecommendationCard } from "./recommendation-card";
import { StateBlock } from "./state-block";

const STATE_LABELS: Record<Exclude<RecommendState, "recommend">, string> = {
  clarify: "Need one thing",
  decline: "Can't help",
  no_match: "Nothing in budget",
  error: "Something broke",
};

function TypingDots() {
  return (
    <span className="flex items-center gap-1" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="typing-dot h-1 w-1 rounded-full bg-muted-foreground"
          style={{ animationDelay: `${index * 120}ms` }}
        />
      ))}
    </span>
  );
}

type AskResultProps = {
  readonly loading: boolean;
  readonly error: string | null;
  readonly result: RecommendResponse | null;
  readonly lastAsked: string;
  readonly compact?: boolean;
  readonly showRequest?: boolean;
  readonly resultRef: RefObject<HTMLDivElement | null>;
  readonly onRetry: () => void;
};

export function AskResult({
  loading,
  error,
  result,
  lastAsked,
  compact = false,
  showRequest = true,
  resultRef,
  onRetry,
}: AskResultProps) {
  return (
    <div
      ref={resultRef}
      tabIndex={-1}
      aria-live="polite"
      aria-busy={loading}
      className={[
        "outline-none",
        compact ? "mt-4" : "mt-10 scroll-mt-6",
      ].join(" ")}
    >
      {loading ? (
        <div className="flex items-center gap-2.5 py-2">
          <TypingDots />
          <p className="text-[13px] leading-5 text-muted-foreground">
            Looking through 300 pieces…
          </p>
        </div>
      ) : null}

      {!loading && error ? (
        <StateBlock label="Something broke" message={error}>
          <button
            type="button"
            onClick={onRetry}
            className="h-9 rounded-[4px] border border-border bg-card px-3 text-[12px] font-medium transition-colors duration-150 hover:border-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Try again
          </button>
        </StateBlock>
      ) : null}

      {!loading && !error && result ? (
        <div>
          {showRequest ? (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                You asked
              </p>
              <p className="mt-1 border-l border-border pl-3 text-[13px] leading-5 text-muted-foreground">
                {lastAsked}
              </p>
            </>
          ) : null}

          <div className={compact ? "mt-0" : "mt-5"}>
            {result.state === "recommend" ? (
              <>
                <p className="text-[15px] leading-6">{result.message}</p>
                <div
                  className={
                    compact
                      ? "mt-3 flex flex-col gap-3"
                      : "mt-4 flex flex-col gap-4"
                  }
                >
                  {result.items.map((entry, index) => (
                    <RecommendationCard
                      key={entry.item.item_id}
                      item={entry.item}
                      why={entry.why}
                      tradeOff={entry.trade_off}
                      topPick={index === 0}
                    />
                  ))}
                </div>
              </>
            ) : (
              <StateBlock
                label={STATE_LABELS[result.state]}
                message={result.message}
                tone={result.state === "decline" ? "brick" : "default"}
              />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
