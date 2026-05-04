// One well-known, category-appropriate Unsplash photo per category.
// Used as a fallback when a product's own imageUrl fails to load.
// To update: visit https://unsplash.com/photos/{ID} to verify the replacement.
const CATEGORY_FALLBACKS: Record<string, string> = {
  "Jackets & Coats": "1539533018447-63fcce2678e3", // wool overcoat
  "Shirts":          "1596755094514-f87e34085b2c", // oxford button-up shirt
  "Trousers":        "1542272604-787c3835535d",    // dark indigo jeans
  "Knitwear":        "1620799140408-edc6dcb6d633", // cable knit sweater
  "Footwear":        "1600269452121-4f2416e55c28", // white leather sneakers
  "Accessories":     "1553062407-98eeb64c6a62",    // canvas tote bag
};

const GENERIC_FALLBACK = "1539533018447-63fcce2678e3"; // fallback for unknown categories

export function getCategoryFallback(category: string): string {
  const id = CATEGORY_FALLBACKS[category] ?? GENERIC_FALLBACK;
  return `https://images.unsplash.com/photo-${id}?w=600&h=800&fit=crop&q=80`;
}
