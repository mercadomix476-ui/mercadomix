import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { api as base44 } from "@/api/supabaseService";
import { Search, Plus, Barcode } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ProductSearch({ onAddProduct, searchQuery, setSearchQuery }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300); // 300ms delay

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["products_search", debouncedSearch],
    queryFn: () => base44.entities.Product.list({ search: debouncedSearch, itemsPerPage: 10 }),
    enabled: !!debouncedSearch, // Only run query if debouncedSearch is not empty
  });

  const filteredProducts = productsData?.data ?? [];

  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredProducts]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredProducts.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredProducts.length > 0) {
        handleAdd(filteredProducts[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setSearchQuery("");
    }
  };

  const handleAdd = (product) => {
    onAddProduct(product, 1);
    setSearchQuery("");
    inputRef.current?.focus();
  };

  return (
    <div className="relative z-50">
      <div className="relative">
        <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" aria-hidden="true" />
        <Input
          ref={inputRef}
          data-search-input
          placeholder="Buscar produto por nome, código de barras ou SKU (F2)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-12 sm:h-14 pl-10 sm:pl-12 text-base sm:text-lg shadow-sm border-slate-200 focus:ring-emerald-500"
          autoFocus
          role="combobox"
          aria-expanded={filteredProducts.length > 0}
          aria-haspopup="listbox"
          aria-controls="product-listbox"
          aria-activedescendant={filteredProducts.length > 0 ? `product-${selectedIndex}` : undefined}
          aria-label="Buscar produtos para adicionar ao carrinho"
          aria-describedby="search-instructions"
        />
        <div id="search-instructions" className="sr-only">
          Use as setas para navegar, Enter para selecionar, Escape para limpar
        </div>
        {searchQuery && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hidden sm:block" aria-hidden="true">
                ENTER para adicionar
            </div>
        )}
      </div>

      {filteredProducts.length > 0 && (
        <Card className="absolute w-full mt-2 shadow-xl border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <ScrollArea className="max-h-[300px] sm:max-h-[400px]">
            <ul 
              id="product-listbox"
              className="p-1"
              role="listbox"
              aria-label="Produtos encontrados"
            >
              {filteredProducts.map((product, index) => (
                <li
                  key={product.id}
                  id={`product-${index}`}
                  onClick={() => handleAdd(product)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleAdd(product);
                    }
                  }}
                  className={`
                    flex items-center justify-between p-2 sm:p-3 rounded-lg cursor-pointer transition-colors
                    ${index === selectedIndex ? "bg-emerald-50 border border-emerald-100" : "hover:bg-slate-50"}
                  `}
                  role="option"
                  aria-selected={index === selectedIndex}
                  tabIndex={index === selectedIndex ? 0 : -1}
                  aria-label={`${product.name}, preço ${product.sale_price?.toFixed(2)} reais, estoque ${product.stock_quantity}`}
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div 
                      className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 rounded-md flex items-center justify-center text-slate-400 flex-shrink-0"
                      role="img"
                      aria-label={product.image_url ? "Imagem do produto" : "Sem imagem"}
                    >
                      {product.image_url ? (
                        <img src={product.image_url} alt="" className="w-full h-full object-cover rounded-md" />
                      ) : (
                        <Barcode className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-800 text-sm sm:text-base truncate">{product.name}</p>
                      <div className="flex gap-2 text-xs text-slate-500">
                        <span className="truncate">SKU: {product.sku || "-"}</span>
                        <span className="hidden sm:inline" aria-hidden="true">•</span>
                        <span className="hidden sm:inline">Estoque: {product.stock_quantity}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="font-bold text-emerald-600 text-sm sm:text-base">R$ {product.sale_price?.toFixed(2)}</p>
                    <Badge variant="outline" className="text-[10px] h-4 sm:h-5 mt-1">
                      {product.unit_type}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </Card>
      )}
    </div>
  );
}
