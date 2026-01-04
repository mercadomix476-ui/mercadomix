export const fuzzySearchProducts = (products, query) => {
  if (!query) return products;
  const lowerQuery = query.toLowerCase().trim();
  
  return products.filter(p => {
    // Search in name (normalized)
    const nameMatch = p.name && p.name.toLowerCase().includes(lowerQuery);
    
    // Search in barcode (exact or partial)
    const barcodeMatch = p.barcode && p.barcode.toLowerCase().includes(lowerQuery);
    
    // Search in SKU (exact or partial)
    const skuMatch = p.sku && p.sku.toLowerCase().includes(lowerQuery);
    
    return nameMatch || barcodeMatch || skuMatch;
  });
};
