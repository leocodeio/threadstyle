import type { Turn } from "@/lib/turns";
import { AskTurn } from "./ask-turn";

type AskHistoryProps = {
  readonly turns: readonly Turn[];
  readonly compact?: boolean;
};

export function AskHistory({ turns, compact = false }: AskHistoryProps) {
  if (turns.length === 0) return null;

  return (
    <ol
      aria-label="Earlier in this chat"
      className={
        compact ? "mb-5 flex flex-col gap-5" : "mt-10 flex flex-col gap-10"
      }
    >
      {turns.map((turn) => (
        <li
          key={turn.id}
          className={compact ? "" : "border-b border-border pb-10"}
        >
          {compact ? (
            <div className="mb-3 ml-auto max-w-[85%] rounded-[4px] bg-secondary px-3 py-2 text-[13px] leading-5 text-secondary-foreground">
              {turn.asked}
            </div>
          ) : null}
          <AskTurn
            asked={turn.asked}
            result={turn.result}
            compact={compact}
            showRequest={!compact}
          />
        </li>
      ))}
    </ol>
  );
}
