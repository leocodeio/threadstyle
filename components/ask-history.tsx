import { Separator } from "@/components/ui/separator";
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
        compact ? "mb-5 flex flex-col gap-5" : "mt-8 flex flex-col gap-8"
      }
    >
      {turns.map((turn, index) => (
        <li key={turn.id} className="flex flex-col gap-8">
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
          {!compact && index < turns.length - 1 ? <Separator /> : null}
        </li>
      ))}
      {!compact ? <Separator /> : null}
    </ol>
  );
}
