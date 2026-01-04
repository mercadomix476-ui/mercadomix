import React, { useState } from "react";
import { api as base44 } from "@/api/supabaseService";
import { useQuery } from "@tanstack/react-query";
import {
  Receipt,
  Search,
  Calendar,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  CreditCard,
  Banknote,
  Smartphone,
  Eye,
  Printer
} from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { printReceiptBrowser } from "@/components/pdv/ReceiptPrinter";

const paymentIcons = {
  dinheiro: Banknote,
  pix: Smartphone,
  debito: CreditCard,
  credito: CreditCard,
  vale: CreditCard,
};

const paymentLabels = {
  dinheiro: "Dinheiro",
  pix: "PIX",
  debito: "Débito",
  credito: "Crédito",
  vale: "Vale",
};

export default function Sales() {
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("today");
  const [selectedSale, setSelectedSale] = useState(null);

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ["sales"],
    queryFn: () => base44.entities.Sale.list("-created_date", 500),
  });

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const list = await base44.entities.StoreSettings.list();
      return list[0] || {};
    },
  });

  const getDateRange = () => {
    const now = new Date();
    switch (dateFilter) {
      case "today":
        return { start: startOfDay(now), end: endOfDay(now) };
      case "month":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      default:
        return null;
    }
  };

  const filteredSales = sales.filter((sale) => {
    const matchesSearch =
      sale.sale_number?.toLowerCase().includes(search.toLowerCase()) ||
      sale.operator?.toLowerCase().includes(search.toLowerCase());
    
    const dateRange = getDateRange();
    const matchesDate = dateRange && sale.created_date
      ? isWithinInterval(new Date(sale.created_date), dateRange)
      : !dateRange;

    return matchesSearch && matchesDate && sale.status === "completed";
  });

  const totalSales = filteredSales.reduce((sum, s) => sum + (s.total || 0), 0);
  const totalTransactions = filteredSales.length;
  const averageTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;

  const paymentSummary = filteredSales.reduce((acc, sale) => {
    const method = sale.payment_method || "outros";
    acc[method] = (acc[method] || 0) + (sale.total || 0);
    return acc;
  }, {});

  const handlePrint = (sale) => {
    printReceiptBrowser(sale, settings);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Vendas</h1>
        <p className="text-slate-500">Histórico e relatórios de vendas</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total em Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">
              R$ {totalSales.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Transações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-800">{totalTransactions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Ticket Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              R$ {averageTicket.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              Formas de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(paymentSummary).slice(0, 3).map(([method, total]) => (
                <Badge key={method} variant="outline" className="text-xs">
                  {paymentLabels[method]}: R$ {total.toFixed(0)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Buscar por número da venda ou operador..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="month">Este Mês</SelectItem>
            <SelectItem value="all">Todas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Venda</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Operador</TableHead>
                  <TableHead className="text-center">Itens</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => {
                  const PaymentIcon = paymentIcons[sale.payment_method] || CreditCard;
                  return (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">
                        {sale.sale_number}
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {sale.created_date &&
                          format(new Date(sale.created_date), "dd/MM/yyyy HH:mm", {
                            locale: ptBR,
                          })}
                      </TableCell>
                      <TableCell>{sale.operator || "-"}</TableCell>
                      <TableCell className="text-center">
                        {sale.items?.length || 0}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <PaymentIcon className="w-4 h-4 text-slate-400" />
                          {paymentLabels[sale.payment_method] || sale.payment_method}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-emerald-600">
                        R$ {sale.total?.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedSale(sale)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handlePrint(sale)}
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {filteredSales.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <Receipt className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Nenhuma venda encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sale Details Dialog */}
      <Dialog open={!!selectedSale} onOpenChange={() => setSelectedSale(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da Venda</DialogTitle>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="text-sm text-slate-500">Número</p>
                  <p className="font-semibold">{selectedSale.sale_number}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Data</p>
                  <p className="font-semibold">
                    {selectedSale.created_date &&
                      format(new Date(selectedSale.created_date), "dd/MM/yyyy HH:mm")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Operador</p>
                  <p className="font-semibold">{selectedSale.operator || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Pagamento</p>
                  <p className="font-semibold">
                    {paymentLabels[selectedSale.payment_method]}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Itens</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedSale.items?.map((item, i) => (
                    <div
                      key={i}
                      className="flex justify-between p-2 bg-slate-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-slate-500">
                          {item.quantity} x R$ {item.unit_price?.toFixed(2)}
                        </p>
                      </div>
                      <p className="font-semibold">R$ {item.total?.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal:</span>
                  <span>R$ {(selectedSale.subtotal || selectedSale.total)?.toFixed(2)}</span>
                </div>
                {selectedSale.discount > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Desconto:</span>
                    <span>- R$ {selectedSale.discount?.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-emerald-600">
                    R$ {selectedSale.total?.toFixed(2)}
                  </span>
                </div>
                {selectedSale.payment_method === "dinheiro" && selectedSale.change > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <span>Troco:</span>
                    <span>R$ {selectedSale.change?.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <Button
                onClick={() => handlePrint(selectedSale)}
                className="w-full gap-2"
              >
                <Printer className="w-4 h-4" />
                Imprimir Cupom
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}