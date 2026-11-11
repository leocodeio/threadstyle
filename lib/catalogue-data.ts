import rawCatalogue from "../data/catalogue.json";
import { parseCatalogue, type CatalogueItem } from "./catalogue";

export const catalogue: readonly CatalogueItem[] = parseCatalogue(rawCatalogue);

export const catalogueById: ReadonlyMap<string, CatalogueItem> = new Map(
  catalogue.map((item) => [item.item_id, item]),
);
