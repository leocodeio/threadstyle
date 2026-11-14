import { ExternalLink, Scale, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  CATEGORY_LABELS,
  formatINR,
  type CatalogueItem,
} from "@/lib/catalogue";
import { cn } from "cn";

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
  const tags = [CATEGORY_LABELS[item.category], item.colour, item.fit].filter(
    Boolean,
  );

  return (
    <a
      href={item.source_url}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={`${item.name} on Bewakoof`}
      className="group block rounded-[6px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <Card
        size="sm"
        className={cn(
          "gap-3 rounded-[6px] border border-border bg-card py-4 ring-0 transition-colors duration-150 ease-[cubic-bezier(0.2,0,0,1)] group-hover:border-foreground",
          topPick && "border-l-[3px] border-l-primary shadow-stamp",
        )}
      >
        <CardContent className="flex flex-col gap-2.5 px-4">
          {topPick ? (
            <Badge
              variant="default"
              className="h-5 gap-1 rounded-[4px] px-1.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
            >
              <Sparkles className="size-3" aria-hidden="true" />
              Top pick
            </Badge>
          ) : null}

          <div className="flex items-start justify-between gap-4">
            <h3 className="line-clamp-2 text-[17px] font-semibold leading-6 tracking-[-0.01em] text-foreground">
              {item.name}
            </h3>
            <p className="shrink-0 font-mono text-[15px] font-semibold tabular-nums text-foreground">
              {formatINR(item.price_inr)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="h-5 rounded-[4px] px-1.5 text-[11px] font-medium text-secondary-foreground"
              >
                {tag}
              </Badge>
            ))}
          </div>

          <p className="mt-0.5 text-[15px] leading-6 text-foreground">{why}</p>

          <div className="flex items-start gap-2 rounded-[4px] bg-accent px-3 py-2 text-[13px] leading-5 text-accent-foreground">
            <Scale
              className="mt-0.5 size-3.5 shrink-0"
              aria-hidden="true"
            />
            <p>
              <span className="font-semibold">Trade-off — </span>
              {tradeOff}
            </p>
          </div>
        </CardContent>

        <CardFooter className="justify-between border-t border-border bg-transparent px-4 pt-2.5 pb-0">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground transition-colors group-hover:text-foreground group-hover:underline">
            View on Bewakoof
            <ExternalLink className="size-3" aria-hidden="true" />
          </span>
          <span className="font-mono text-[10.5px] tabular-nums text-muted-foreground">
            {item.item_id}
          </span>
        </CardFooter>
      </Card>
    </a>
  );
}
