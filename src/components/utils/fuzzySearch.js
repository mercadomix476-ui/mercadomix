export const fuzzySearchProducts = (products, query) => {
  if (!query) return products;
  return products.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
};
