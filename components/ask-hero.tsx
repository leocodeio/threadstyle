import Link from "next/link";
import { ArrowRight, ArrowUpRight, Shirt } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const EXAMPLES = [
  "Smart shirt for a presentation tomorrow, under ₹1,500",
  "Gym and classes both, comfortable joggers, ₹2,000",
  "Winter basics, hoodie under ₹1,800, I feel cold easily",
  "College ke liye kuch simple aur comfortable, 2000 tak",
] as const;

type AskHeroProps = {
  readonly showExamples: boolean;
  readonly onExample: (example: string) => void;
};

export function AskHero({ showExamples, onExample }: AskHeroProps) {
  return (
    <>
      <section className="pt-8">
        <Badge
          variant="secondary"
          className="h-6 gap-1.5 rounded-[4px] px-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
        >
          <Shirt className="size-3" aria-hidden="true" />
          Campus stylist · 300 real pieces
        </Badge>

        <h1 className="mt-4 max-w-[22ch] font-heading text-[32px] font-semibold leading-[36px] tracking-[-0.035em] text-balance">
          Tell me the day. I&apos;ll find the fit.
        </h1>

        <p className="mt-3 max-w-[54ch] text-[14px] leading-6 text-muted-foreground sm:text-[15px]">
          Budget, weather, occasion — in English or Hinglish. I&apos;ll pick up
          to three real Bewakoof pieces and tell you why, plus the trade-off.
        </p>
      </section>

      {showExamples ? (
        <div className="mt-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Try one
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {EXAMPLES.map((example) => (
              <Button
                key={example}
                type="button"
                variant="outline"
                onClick={() => onExample(example)}
                className="h-auto justify-between gap-2 rounded-[6px] border-border bg-card px-3.5 py-2.5 text-left text-[13px] font-normal leading-5 whitespace-normal hover:border-foreground hover:bg-card"
              >
                <span>{example}</span>
                <ArrowUpRight
                  className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
              </Button>
            ))}
          </div>
          <p className="mt-4 inline-flex items-center gap-1.5 text-[12px] leading-5 text-muted-foreground">
            Prefer to browse?{" "}
            <Link
              href="/"
              className="inline-flex items-center gap-1 font-medium text-foreground underline underline-offset-4 hover:text-primary"
            >
              See all 300 pieces
              <ArrowRight className="size-3" aria-hidden="true" />
            </Link>
          </p>
        </div>
      ) : null}
    </>
  );
}
