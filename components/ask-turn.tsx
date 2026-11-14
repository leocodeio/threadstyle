import type { ReactNode } from "react";
import {
  AlertCircle,
  Ban,
  HelpCircle,
  SearchX,
  Shirt,
  User,
} from "lucide-react";

import type { RecommendResponse, RecommendState } from "@/lib/recommend-types";
import { RecommendationCard } from "./recommendation-card";
import { StateBlock } from "./state-block";

const STATE_LABELS: Record<Exclude<RecommendState, "recommend">, string> = {
  clarify: "Need one thing",
  decline: "Can't help",
  no_match: "Nothing in budget",
  error: "Something broke",
};

const STATE_ICONS: Record<Exclude<RecommendState, "recommend">, ReactNode> = {
  clarify: <HelpCircle className="size-4" aria-hidden="true" />,
  decline: <Ban className="size-4" aria-hidden="true" />,
  no_match: <SearchX className="size-4" aria-hidden="true" />,
  error: <AlertCircle className="size-4" aria-hidden="true" />,
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
        <div className="flex items-start gap-2.5">
          <span
            aria-hidden="true"
            className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-[4px] border border-border bg-secondary text-secondary-foreground"
          >
            <User className="size-3.5" />
          </span>
          <div className="min-w-0 flex-1 rounded-[6px] border border-border bg-secondary/60 px-3.5 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              You
            </p>
            <p className="mt-0.5 text-[14px] leading-5 text-foreground">
              {asked}
            </p>
          </div>
        </div>
      ) : null}

      <div className={compact ? "mt-0" : "mt-5"}>
        {result.state === "recommend" ? (
          <>
            <div className="flex items-start gap-2.5">
              {!compact ? (
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-[4px] bg-primary text-primary-foreground"
                >
                  <Shirt className="size-3.5" />
                </span>
              ) : null}
              <p className="text-[15px] leading-6 text-foreground">
                {result.message}
              </p>
            </div>
            <div
              className={
                compact
                  ? "mt-3 flex flex-col gap-3"
                  : "mt-4 flex flex-col gap-4 pl-8"
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
            icon={STATE_ICONS[result.state]}
          />
        )}
      </div>
    </div>
  );
}
