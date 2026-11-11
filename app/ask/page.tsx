import type { Metadata } from "next";

import { Recommender } from "@/components/recommender";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "What to wear today",
  description:
    "Describe the day, budget, and occasion. Thread picks up to three real Bewakoof pieces with the reason and the trade-off.",
};

export default function AskPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SiteHeader active="ask" />
      <Recommender />
    </div>
  );
}
