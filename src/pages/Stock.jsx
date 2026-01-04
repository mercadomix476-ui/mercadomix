import React, { useState, useEffect } from "react";
import { api as base44 } from "@/api/supabaseService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  Boxes,
  Search,
  Plus,
  Minus,
  ArrowUpDown,
  AlertTriangle,
  Package,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FileText,
  History
} from "lucide-react";
import StockAlertsCard from "@/components/stock/StockAlertsCard";
import OrderSuggestionModal from "@/components/stock/OrderSuggestionModal";
import StockMovementHistory from "@/components/stock/StockMovementHistory";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PackagePlus, PackageMinus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Stock() {
  const [search, setSearch] = useState("");
  const [showMovement, setShowMovement] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [movementType, setMovementType] = useState("entrada");
  const [movementQty, setMovementQty] = useState("");
  const [movementReason, setMovementReason] = useState("");
  const [movementLocation, setMovementLocation] = useState("");
  const [showOrderSuggestion, setShowOrderSuggestion] = useState(false);
  const [showHistory, setShowHistory] = useState(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 15;
  const queryClient = useQueryClient();

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

  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["products", page, itemsPerPage, debouncedSearch],
    queryFn: () => base44.entities.Product.list({ page, itemsPerPage, search: debouncedSearch }),
    keepPreviousData: true,
  });

  const products = productsData?.data ?? [];
  const totalProducts = productsData?.count ?? 0;

  const { data: movements = [] } = useQuery({
    queryKey: ["stockMovements"],
    queryFn: () => base44.entities.StockMovement.list("-created_date", 50),
  });

  const { data: sales = [] } = useQuery({
    queryKey: ["sales"],
    queryFn: () => base44.entities.Sale.list("-created_date", 100),
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Product.update(id, data),
  });

  const createMovementMutation = useMutation({
    mutationFn: (data) => base44.entities.StockMovement.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["stockMovements"] });
      handleCloseMovement();
    },
  });

  const handleOpenMovement = (product, type) => {
    setSelectedProduct(product);
    setMovementType(type);
    setMovementQty("");
    setMovementReason("");
    setShowMovement(true);
  };

  const handleCloseMovement = () => {
    setShowMovement(false);
    setSelectedProduct(null);
    setMovementQty("");
    setMovementReason("");
    setMovementLocation("");
  };

  const handleSubmitMovement = async () => {
    if (!selectedProduct || !movementQty) {
      toast.error("Informe a quantidade");
      return;
    }

    const qty = parseFloat(movementQty);
    if (qty <= 0) {
      toast.error("Quantidade deve ser maior que zero");
      return;
    }

    const previousStock = selectedProduct.stock_quantity || 0;
    let newStock = previousStock;

    if (movementType === "entrada") {
      newStock = previousStock + qty;
    } else if (movementType === "saida" || movementType === "ajuste") {
      newStock = Math.max(0, previousStock - qty);
    }

    try {
      await updateProductMutation.mutateAsync({
        id: selectedProduct.id,
        data: { stock_quantity: newStock },
      });

      await createMovementMutation.mutateAsync({
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        movement_type: movementType,
        quantity: qty,
        previous_stock: previousStock,
        new_stock: newStock,
        reason: movementReason || "Movimentação manual",
        location: movementLocation || undefined,
      });

      toast.success("Estoque atualizado com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar estoque");
      console.error(error);
    }
  };

  const paginatedProducts = products;

  const totalPages = Math.ceil(totalProducts / itemsPerPage);

  const lowStockProducts = products.filter(
    (p) => p.stock_quantity <= (p.min_stock || 5)
  );

  const totalStock = products.reduce((sum, p) => sum + (p.stock_quantity || 0), 0);

  const handleSendOrderEmail = async (emailData) => {
    try {
      await base44.integrations.Core.SendEmail({
        to: "admin@mercadinhomix.com",
        subject: emailData.subject,
        body: emailData.body
      });
      toast.success("Email enviado com sucesso!");
    } catch (error) {
      toast.error("Erro ao enviar email: " + error.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Controle de Estoque</h1>
          <p className="text-slate-500">Gerencie entradas, saídas e ajustes de estoque</p>
        </div>
        <Link to={createPageUrl("StockHistory")}>
          <Button variant="outline" className="gap-2">
            <FileText className="w-4 h-4" />
            Ver Histórico Completo
          </Button>
        </Link>
      </div>

      {/* Stock Alerts */}
      <StockAlertsCard 
        products={products}
        onGenerateOrder={() => setShowOrderSuggestion(true)}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Total de Produtos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-3xl font-bold text-slate-800">{totalProducts}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Itens em Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Boxes className="w-6 h-6 text-emerald-600" />
              </div>
              <span className="text-3xl font-bold text-slate-800">
                {totalStock.toFixed(0)}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className={lowStockProducts.length > 0 ? "border-amber-200 bg-amber-50" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Estoque Baixo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <span className="text-3xl font-bold text-amber-600">
                {lowStockProducts.length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          placeholder="Buscar produto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos em Estoque</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-center">Estoque Atual</TableHead>
                  <TableHead className="text-center">Mínimo</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-slate-500">
                      {product.barcode || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{product.category}</Badge>
                    </TableCell>
                    <TableCell className="text-center font-semibold">
                      {product.stock_quantity || 0}
                      <span className="text-slate-400 ml-1">
                        {product.unit_type === "unidade" ? "un" : product.unit_type}
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-slate-500">
                      {product.min_stock || 5}
                    </TableCell>
                    <TableCell className="text-center">
                      {product.stock_quantity <= (product.min_stock || 5) ? (
                        <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Baixo
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                          Normal
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowHistory(product.id)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <History className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenMovement(product, "entrada")}
                          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenMovement(product, "saida")}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-slate-600">
                Mostrando {products.length} de {totalProducts} produtos
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-slate-600">
                  Página {page} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Movements */}
      <Card>
        <CardHeader>
          <CardTitle>Movimentações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {movements.slice(0, 10).map((movement) => (
              <div
                key={movement.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      movement.movement_type === "entrada"
                        ? "bg-emerald-100"
                        : movement.movement_type === "venda"
                        ? "bg-blue-100"
                        : "bg-red-100"
                    }`}
                  >
                    {movement.movement_type === "entrada" ? (
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <TrendingDown
                        className={`w-5 h-5 ${
                          movement.movement_type === "venda"
                            ? "text-blue-600"
                            : "text-red-600"
                        }`}
                      />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{movement.product_name}</p>
                    <p className="text-sm text-slate-500">
                      {movement.movement_type === "entrada"
                        ? "Entrada"
                        : movement.movement_type === "venda"
                        ? "Venda"
                        : movement.movement_type === "ajuste"
                        ? "Ajuste"
                        : "Saída"}{" "}
                      - {movement.reason || "Sem descrição"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-bold ${
                      movement.movement_type === "entrada"
                        ? "text-emerald-600"
                        : "text-red-600"
                    }`}
                  >
                    {movement.movement_type === "entrada" ? "+" : "-"}
                    {movement.quantity}
                  </p>
                  <p className="text-xs text-slate-400">
                    {movement.created_date &&
                      format(new Date(movement.created_date), "dd/MM HH:mm", {
                        locale: ptBR,
                      })}
                  </p>
                </div>
              </div>
            ))}
            {movements.length === 0 && (
              <p className="text-center text-slate-400 py-8">
                Nenhuma movimentação registrada
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Movement Dialog */}
      <Dialog open={showMovement} onOpenChange={setShowMovement}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {movementType === "entrada" && <PackagePlus className="w-5 h-5 text-emerald-600" />}
              {movementType === "saida" && <PackageMinus className="w-5 h-5 text-red-600" />}
              {movementType === "ajuste" && <RefreshCw className="w-5 h-5 text-blue-600" />}
              {movementType === "entrada"
                ? "Entrada de Estoque"
                : movementType === "ajuste"
                ? "Ajuste de Estoque"
                : "Saída de Estoque"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="font-medium">{selectedProduct?.name}</p>
              <p className="text-sm text-slate-500">
                Estoque atual: {selectedProduct?.stock_quantity || 0}{" "}
                {selectedProduct?.unit_type === "unidade"
                  ? "un"
                  : selectedProduct?.unit_type}
              </p>
            </div>
            <div>
              <Label htmlFor="movType">Tipo de Movimentação</Label>
              <Select value={movementType} onValueChange={setMovementType}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">📦 Entrada</SelectItem>
                  <SelectItem value="saida">📤 Saída</SelectItem>
                  <SelectItem value="compra">🛒 Compra</SelectItem>
                  <SelectItem value="devolucao">↩️ Devolução</SelectItem>
                  <SelectItem value="perda">⚠️ Perda/Dano</SelectItem>
                  <SelectItem value="transferencia">🔄 Transferência</SelectItem>
                  <SelectItem value="ajuste">⚙️ Ajuste</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="qty">Quantidade</Label>
              <Input
                id="qty"
                type="number"
                step="0.001"
                value={movementQty}
                onChange={(e) => setMovementQty(e.target.value)}
                className="mt-1"
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="location">Localização/Setor (Opcional)</Label>
              <Input
                id="location"
                value={movementLocation}
                onChange={(e) => setMovementLocation(e.target.value)}
                placeholder="Ex: Depósito A, Prateleira 5..."
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="reason">Motivo</Label>
              <Textarea
                id="reason"
                value={movementReason}
                onChange={(e) => setMovementReason(e.target.value)}
                placeholder="Descreva o motivo da movimentação..."
                className="mt-1"
                rows={3}
              />
            </div>
            {movementQty && (
              <div className="p-4 bg-emerald-50 rounded-xl">
                <p className="text-sm text-emerald-700">
                  Novo estoque:{" "}
                  <strong>
                    {["entrada", "compra", "devolucao"].includes(movementType)
                      ? (selectedProduct?.stock_quantity || 0) +
                        parseFloat(movementQty)
                      : Math.max(
                          0,
                          (selectedProduct?.stock_quantity || 0) -
                            parseFloat(movementQty)
                        )}{" "}
                    {selectedProduct?.unit_type === "unidade"
                      ? "un"
                      : selectedProduct?.unit_type}
                  </strong>
                </p>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleCloseMovement}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmitMovement}
                disabled={!movementQty || createMovementMutation.isPending}
                className={
                  ["entrada", "compra", "devolucao"].includes(movementType)
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                }
              >
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stock Movement History Modal */}
      <StockMovementHistory
        productId={showHistory}
        isOpen={!!showHistory}
        onClose={() => setShowHistory(null)}
      />

      {/* Order Suggestion Modal */}
      <OrderSuggestionModal
        isOpen={showOrderSuggestion}
        onClose={() => setShowOrderSuggestion(false)}
        products={products}
        sales={sales}
        onSendEmail={handleSendOrderEmail}
      />
    </div>
  );
}