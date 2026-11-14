import Link from "next/link";

type SiteHeaderProps = {
  readonly active: "ask" | "shop" | "how";
};

function navClass(active: boolean): string {
  return [
    "text-[12px] font-medium transition-colors duration-150",
    active
      ? "text-foreground"
      : "text-muted-foreground hover:text-foreground",
  ].join(" ");
}

export function SiteHeader({ active }: SiteHeaderProps) {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link
          href="/"
          className="font-heading text-[20px] font-semibold leading-none tracking-[-0.03em]"
        >
          Thread<span className="text-primary">.</span>
        </Link>

        <nav aria-label="Primary" className="flex items-center gap-5">
          <Link
            href="/ask"
            aria-current={active === "ask" ? "page" : undefined}
            className={navClass(active === "ask")}
          >
            Ask
          </Link>
          <Link
            href="/"
            aria-current={active === "shop" ? "page" : undefined}
            className={navClass(active === "shop")}
          >
            Shop
          </Link>
          <Link
            href="/how-it-works"
            aria-current={active === "how" ? "page" : undefined}
            className={navClass(active === "how")}
          >
            How it works
          </Link>
        </nav>
      </div>
    </header>
  );
}
