import type { Metadata } from "next";

import rawCatalogue from "@/data/catalogue.json";
import { Marketplace } from "@/components/marketplace";
import { ShopChat } from "@/components/shop-chat";
import { SiteHeader } from "@/components/site-header";
import { featuredOrder, parseCatalogue } from "@/lib/catalogue";

const items = featuredOrder(parseCatalogue(rawCatalogue));

export const metadata: Metadata = {
  description:
    "Search 300 real Bewakoof pieces by category, colour, or fabric. Every card links to the real store page.",
};

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SiteHeader active="shop" />
      <Marketplace items={items} />
      <ShopChat />
      <div aria-hidden="true" className="h-20" />
    </div>
  );
}
