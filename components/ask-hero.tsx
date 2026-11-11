import Link from "next/link";

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
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Campus stylist · 300 real pieces
        </p>

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
              <button
                key={example}
                type="button"
                onClick={() => onExample(example)}
                className="rounded-[4px] border border-border bg-card px-3 py-2.5 text-left text-[13px] leading-5 transition-colors duration-150 hover:border-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {example}
              </button>
            ))}
          </div>
          <p className="mt-4 text-[12px] leading-5 text-muted-foreground">
            Prefer to browse?{" "}
            <Link
              href="/"
              className="font-medium text-foreground underline underline-offset-4"
            >
              See all 300 pieces
            </Link>
            .
          </p>
        </div>
      ) : null}
    </>
  );
}
