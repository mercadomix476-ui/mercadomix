import React, { useState, useEffect } from "react";
import { api as base44 } from "@/api/supabaseService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { fuzzySearchProducts } from "../components/utils/fuzzySearch";
import {
  Plus,
  Search,
  Package,
  Barcode,
  Edit,
  Trash2,
  AlertTriangle,
  Scale,
  Droplet,
  Filter,
  MoreVertical,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ProductForm } from '@/components/ProductForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const categories = [
  "Hortifruti", "Açougue", "Padaria", "Laticínios", "Bebidas",
  "Mercearia", "Limpeza", "Higiene", "Frios", "Congelados", "Pet", "Outros"
];

const unitTypes = [
  { value: "unidade", label: "Unidade" },
  { value: "kg", label: "Quilograma (kg)" },
  { value: "grama", label: "Grama (g)" },
  { value: "litro", label: "Litro (L)" },
  { value: "ml", label: "Mililitro (ml)" },
];

export default function Products() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;
  const queryClient = useQueryClient();

  // Debounce search input
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page to 1 when search changes
    }, 300); // 300ms delay

    return () => {
      clearTimeout(handler);
    };
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ["products", page, itemsPerPage, debouncedSearch],
    queryFn: () => base44.entities.Product.list({ page, itemsPerPage, search: debouncedSearch }),
    keepPreviousData: true,
  });

  const products = data?.data ?? [];
  const totalProducts = data?.count ?? 0;

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Product.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setDeleteProduct(null);
      toast.success("Produto excluído com sucesso!");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleOpenForm = (product = null) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  const filteredProducts = (() => {
    // A busca agora é feita no backend.
    // Mantemos a filtragem por categoria no frontend por enquanto.
    if (categoryFilter === "all") {
      return products;
    }
    return products.filter(p => p.category === categoryFilter);
  })();

  const totalPages = Math.ceil(totalProducts / itemsPerPage);
  const paginatedProducts = filteredProducts; // A API já retorna os dados paginados e filtrados pela busca

  useEffect(() => {
    // Não é mais necessário resetar a página aqui, o useQuery cuidará disso
  }, [search, categoryFilter]);

  // Listener para atalhos gerais
  useEffect(() => {
    const handleAppShortcut = (event) => {
      const { action, currentPath } = event.detail;
      
      // Só processar se estivermos na página de produtos
      if (currentPath !== '/products') return;
      
      switch (action) {
        case 'new':
          setShowForm(true);
          setEditingProduct(null);
          break;
          
        case 'search':
          // Focar no campo de busca
          const searchInput = document.querySelector('[data-products-search]');
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
          }
          break;
          
        case 'escape':
          if (showForm) {
            setShowForm(false);
            setEditingProduct(null);
          }
          break;
          
        default:
          break;
      }
    };

    window.addEventListener('app-shortcut', handleAppShortcut);
    
    return () => {
      window.removeEventListener('app-shortcut', handleAppShortcut);
    };
  }, [showForm]);

  const getUnitIcon = (unitType) => {
    if (unitType === "kg" || unitType === "grama") return <Scale className="w-4 h-4" />;
    if (unitType === "litro" || unitType === "ml") return <Droplet className="w-4 h-4" />;
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Produtos</h1>
          <p className="text-slate-500 text-sm sm:text-base">Gerencie o catálogo de produtos</p>
        </div>
        <Button
          onClick={() => handleOpenForm()}
          className="w-full sm:w-auto bg-[#1B4332] hover:bg-[#2D6A4F] gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Produto
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            data-products-search
            placeholder="Buscar por nome, código de barras ou SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-white z-0">
            <div className="flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Categoria" />
            </div>
          </SelectTrigger>
          <SelectContent className="z-[100] bg-white max-h-[300px]">
            <SelectItem value="all">Todas Categorias</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        <AnimatePresence>
          {paginatedProducts.map((product, index) => (
                        <motion.div
              key={product.id || index} // Ensure unique key for each product
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={() => handleOpenForm(product)}
              className={`bg-white rounded-2xl border ${
                product.is_active === false ? "opacity-60" : ""
              } ${
                product.stock_quantity <= product.min_stock
                  ? "border-amber-200"
                  : "border-slate-100"
              } overflow-hidden hover:shadow-lg transition-shadow cursor-pointer`}
            >
                <div className="aspect-square bg-slate-100 relative">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300" />
                    </div>
                  )}
                  {product.stock_quantity <= product.min_stock && (
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-amber-500 gap-1 text-xs">
                        <AlertTriangle className="w-3 h-3" />
                        <span className="hidden sm:inline">Estoque Baixo</span>
                        <span className="sm:hidden">Baixo</span>
                      </Badge>
                    </div>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="absolute top-2 right-2 h-8 w-8 bg-white/90 hover:bg-white"
                        onClick={(e) => e.preventDefault()} // Evita que o Link seja ativado
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.preventDefault(); handleOpenForm(product); }}>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => { e.preventDefault(); setDeleteProduct(product); }}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 truncate text-sm sm:text-base">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {product.barcode && (
                          <span className="text-xs text-slate-400 flex items-center gap-1 truncate">
                            <Barcode className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{product.barcode}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    {getUnitIcon(product.unit_type) && (
                      <span className="text-slate-400 flex-shrink-0">
                        {getUnitIcon(product.unit_type)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-3 gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xl sm:text-2xl font-bold text-emerald-600 truncate">
                        R$ {product.sale_price?.toFixed(2)}
                      </p>
                      {product.unit_type !== "unidade" && (
                        <span className="text-xs text-slate-400">
                          por {product.unit_type}
                        </span>
                      )}
                    </div>
                    <Badge variant="outline" className="text-slate-600 text-xs flex-shrink-0">
                      {product.category}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <span className="text-sm text-slate-500">Estoque:</span>
                    <span
                      className={`font-semibold text-sm ${
                        product.stock_quantity <= product.min_stock
                          ? "text-amber-600"
                          : "text-slate-700"
                      }`}
                    >
                      {product.stock_quantity || 0} {product.unit_type === "unidade" ? "un" : product.unit_type}
                    </span>
                  </div>
                </div>
              </motion.div>
            
          ))}
        </AnimatePresence>
      </div>

      {filteredProducts.length === 0 && !isLoading && (
        <div className="text-center py-12 col-span-full">
          <Package className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600">Nenhum produto encontrado</h3>
          <p className="text-slate-400 text-sm sm:text-base">Adicione um novo produto para começar</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
          <p className="text-sm text-slate-600 text-center sm:text-left">
            Mostrando {(page - 1) * itemsPerPage + 1} a{" "}
            {Math.min(page * itemsPerPage, totalProducts)} de{" "}
            {totalProducts} produtos
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Anterior</span>
            </Button>
            <span className="text-sm text-slate-600 px-2">
              {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <span className="hidden sm:inline mr-1">Próximo</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Product Form Dialog */}
      <ProductForm 
        isOpen={showForm}
        onClose={handleCloseForm}
        product={editingProduct}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteProduct} onOpenChange={() => setDeleteProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o produto "{deleteProduct?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteProduct.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}