import {
  CATEGORY_LABELS,
  formatINR,
  type CatalogueItem,
} from "@/lib/catalogue";

type RecommendationCardProps = {
  readonly item: CatalogueItem;
  readonly why: string;
  readonly tradeOff: string;
  readonly topPick: boolean;
};

export function RecommendationCard({
  item,
  why,
  tradeOff,
  topPick,
}: RecommendationCardProps) {
  return (
    <a
      href={item.source_url}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={`${item.name} on Bewakoof`}
      className={[
        "group block rounded-[6px] border border-border bg-card p-4 transition-colors duration-150 ease-[cubic-bezier(0.2,0,0,1)] hover:border-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        topPick ? "border-l-[3px] border-l-primary" : "",
      ].join(" ")}
    >
      {topPick ? (
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Top pick
        </p>
      ) : null}

      <div className="mt-1.5 flex items-start justify-between gap-4">
        <h3 className="line-clamp-2 text-[17px] font-semibold leading-6 tracking-[-0.01em]">
          {item.name}
        </h3>
        <p className="shrink-0 font-mono text-[15px] font-semibold tabular-nums">
          {formatINR(item.price_inr)}
        </p>
      </div>

      <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
        {CATEGORY_LABELS[item.category]} · {item.colour} · {item.fit}
      </p>

      <p className="mt-3 text-[15px] leading-6">{why}</p>

      <p className="mt-3 rounded-[4px] bg-accent px-3 py-2 text-[13px] leading-5 text-accent-foreground">
        <span className="font-semibold">Trade-off — </span>
        {tradeOff}
      </p>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-2.5">
        <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground group-hover:underline">
          View on Bewakoof
        </span>
        <span className="font-mono text-[10.5px] tabular-nums text-muted-foreground">
          {item.item_id}
        </span>
      </div>
    </a>
  );
}
