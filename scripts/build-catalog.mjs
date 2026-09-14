import { writeFile } from "node:fs/promises";

const query = `*[_type == "categoryPage"] | order(title asc) {
  title,
  "slug": slug.current,
  "groups": categoryProducts[]->{
    title,
    "products": contentArea[]->{
      _id,
      name,
      productKey,
      package,
      "image": image.asset->url
    }
  }
}`;

const endpoint = new URL(
  "https://xkw8ym5s.apicdn.sanity.io/v2021-03-04/data/query/production"
);
endpoint.searchParams.set("query", query);

const response = await fetch(endpoint, {
  headers: { Accept: "application/json" },
});

if (!response.ok) {
  throw new Error(`Sanity query failed: ${response.status} ${response.statusText}`);
}

const payload = await response.json();
const categories = Array.isArray(payload.result) ? payload.result : [];

await writeFile(
  "catalog-data.json",
  JSON.stringify({ updatedAt: new Date().toISOString(), categories }, null, 2)
);

const productCount = categories.reduce(
  (total, category) =>
    total +
    (category.groups || []).reduce(
      (sum, group) => sum + (group.products || []).length,
      0
    ),
  0
);

console.log(`Catalog prepared: ${categories.length} categories, ${productCount} products.`);
