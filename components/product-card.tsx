import Image from "next/image";

import {
  CATEGORY_LABELS,
  discountPercent,
  formatINR,
  type CatalogueItem,
} from "@/lib/catalogue";

type ProductCardProps = {
  item: CatalogueItem;
  priority?: boolean;
};

export function ProductCard({ item, priority = false }: ProductCardProps) {
  const off = discountPercent(item);

  return (
    <a
      href={item.source_url}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={`${item.name} on Bewakoof`}
      className="group flex flex-col overflow-hidden rounded-[6px] border border-border bg-card transition-[transform,border-color] duration-150 ease-[cubic-bezier(0.2,0,0,1)] hover:-translate-y-1 hover:border-foreground focus-visible:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
        <Image
          src={item.image_url}
          alt={item.name}
          fill
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover"
          unoptimized
        />
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {CATEGORY_LABELS[item.category]}
          </span>
          {item.rating ? (
            <span className="font-mono text-[10.5px] tabular-nums text-muted-foreground">
              {item.rating.toFixed(1)}
            </span>
          ) : null}
        </div>

        <h3 className="line-clamp-2 text-[13px] font-medium leading-[18px] tracking-[-0.01em]">
          {item.name}
        </h3>

        <p className="line-clamp-1 text-[11px] leading-4 text-muted-foreground">
          {[item.colour, item.fabric].filter(Boolean).join(" · ")}
        </p>

        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-0.5 pt-1.5">
          <span className="font-mono text-[14px] font-semibold tabular-nums">
            {formatINR(item.price_inr)}
          </span>
          {off ? (
            <>
              <span className="font-mono text-[11px] tabular-nums text-muted-foreground line-through">
                {formatINR(item.mrp_inr)}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground">
                {off}% off
              </span>
            </>
          ) : null}
        </div>
      </div>
    </a>
  );
}
