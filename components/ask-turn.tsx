import type { RecommendResponse, RecommendState } from "@/lib/recommend-types";
import { RecommendationCard } from "./recommendation-card";
import { StateBlock } from "./state-block";

const STATE_LABELS: Record<Exclude<RecommendState, "recommend">, string> = {
  clarify: "Need one thing",
  decline: "Can't help",
  no_match: "Nothing in budget",
  error: "Something broke",
};

type AskTurnProps = {
  readonly asked: string;
  readonly result: RecommendResponse;
  readonly compact?: boolean;
  readonly showRequest?: boolean;
};

export function AskTurn({
  asked,
  result,
  compact = false,
  showRequest = true,
}: AskTurnProps) {
  return (
    <div>
      {showRequest ? (
        <>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            You asked
          </p>
          <p className="mt-1 border-l border-border pl-3 text-[13px] leading-5 text-muted-foreground">
            {asked}
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
  );
}
