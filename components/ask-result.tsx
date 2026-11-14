import type { RefObject } from "react";
import { AlertCircle, Loader2, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { RecommendResponse } from "@/lib/recommend-types";
import { AskTurn } from "./ask-turn";
import { StateBlock } from "./state-block";

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
        compact ? "mt-4" : "mt-8 scroll-mt-6",
      ].join(" ")}
    >
      {loading ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-[13px] leading-5 text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            <span>Looking through 300 pieces…</span>
          </div>
          {!compact ? (
            <div className="flex flex-col gap-3">
              {[0, 1].map((index) => (
                <Card
                  key={index}
                  size="sm"
                  className="rounded-[6px] border border-border bg-card py-4 ring-0"
                >
                  <CardContent className="flex flex-col gap-2.5 px-4">
                    <div className="flex items-center justify-between gap-4">
                      <Skeleton className="h-5 w-2/3" />
                      <Skeleton className="h-5 w-14" />
                    </div>
                    <div className="flex gap-1.5">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-14" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {!loading && error ? (
        <StateBlock
          label="Something broke"
          message={error}
          icon={<AlertCircle className="size-4" aria-hidden="true" />}
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="rounded-[4px]"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Try again
          </Button>
        </StateBlock>
      ) : null}

      {!loading && !error && result ? (
        <AskTurn
          asked={lastAsked}
          result={result}
          compact={compact}
          showRequest={showRequest}
        />
      ) : null}
    </div>
  );
}
