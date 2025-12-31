import React, { useState } from "react";
import { api as base44 } from "@/api/supabaseService";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  FileText,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ShoppingCart,
  PackagePlus,
  PackageMinus,
  AlertTriangle,
  ArrowRightLeft,
  User,
  Calendar,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const movementIcons = {
  entrada: PackagePlus,
  saida: PackageMinus,
  ajuste: RefreshCw,
  venda: ShoppingCart,
  compra: TrendingUp,
  devolucao: ArrowRightLeft,
  perda: AlertTriangle,
  transferencia: ArrowRightLeft,
};

const movementColors = {
  entrada: "bg-emerald-100 text-emerald-700 border-emerald-200",
  saida: "bg-red-100 text-red-700 border-red-200",
  ajuste: "bg-blue-100 text-blue-700 border-blue-200",
  venda: "bg-purple-100 text-purple-700 border-purple-200",
  compra: "bg-green-100 text-green-700 border-green-200",
  devolucao: "bg-amber-100 text-amber-700 border-amber-200",
  perda: "bg-red-100 text-red-700 border-red-200",
  transferencia: "bg-blue-100 text-blue-700 border-blue-200",
};

const movementLabels = {
  entrada: "Entrada",
  saida: "Saída",
  ajuste: "Ajuste",
  venda: "Venda",
  compra: "Compra",
  devolucao: "Devolução",
  perda: "Perda/Dano",
  transferencia: "Transferência",
};

export default function StockHistory() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  const { data: movements = [], isLoading } = useQuery({
    queryKey: ["stockMovements"],
    queryFn: () => base44.entities.StockMovement.list("-created_date", 200),
  });

  const filteredMovements = movements.filter((m) => {
    const matchesSearch = 
      m.product_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.reason?.toLowerCase().includes(search.toLowerCase()) ||
      m.reference?.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || m.movement_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredMovements.length / itemsPerPage);
  const paginatedMovements = filteredMovements.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Statistics
  const stats = movements.reduce((acc, m) => {
    if (m.movement_type === "entrada" || m.movement_type === "compra") {
      acc.totalIn += m.quantity || 0;
      acc.countIn++;
    } else if (m.movement_type === "saida" || m.movement_type === "venda" || m.movement_type === "perda") {
      acc.totalOut += m.quantity || 0;
      acc.countOut++;
    }
    return acc;
  }, { totalIn: 0, totalOut: 0, countIn: 0, countOut: 0 });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Histórico de Movimentações</h1>
        <p className="text-slate-500">Registro completo de todas as movimentações de estoque</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total de Movimentações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-800">{movements.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Entradas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-600">+{stats.totalIn.toFixed(0)}</p>
            <p className="text-xs text-slate-400">{stats.countIn} movimentações</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Saídas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">-{stats.totalOut.toFixed(0)}</p>
            <p className="text-xs text-slate-400">{stats.countOut} movimentações</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${stats.totalIn - stats.totalOut >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {(stats.totalIn - stats.totalOut).toFixed(0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Buscar por produto, motivo ou referência..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            <SelectItem value="entrada">Entrada</SelectItem>
            <SelectItem value="saida">Saída</SelectItem>
            <SelectItem value="compra">Compra</SelectItem>
            <SelectItem value="venda">Venda</SelectItem>
            <SelectItem value="devolucao">Devolução</SelectItem>
            <SelectItem value="perda">Perda/Dano</SelectItem>
            <SelectItem value="ajuste">Ajuste</SelectItem>
            <SelectItem value="transferencia">Transferência</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Movements Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-center">Quantidade</TableHead>
                  <TableHead className="text-center">Estoque Ant.</TableHead>
                  <TableHead className="text-center">Estoque Novo</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Operador</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedMovements.map((movement) => {
                  const Icon = movementIcons[movement.movement_type] || TrendingDown;
                  const isIncrease = ["entrada", "compra", "devolucao"].includes(movement.movement_type);

                  return (
                    <TableRow key={movement.id}>
                      <TableCell className="text-slate-600">
                        {movement.created_date && (
                          <>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(movement.created_date), "dd/MM/yyyy", { locale: ptBR })}
                            </div>
                            <div className="text-xs text-slate-400">
                              {format(new Date(movement.created_date), "HH:mm")}
                            </div>
                          </>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{movement.product_name}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${movementColors[movement.movement_type]} flex items-center gap-1 w-fit`}
                        >
                          <Icon className="w-3 h-3" />
                          {movementLabels[movement.movement_type] || movement.movement_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-bold ${isIncrease ? "text-emerald-600" : "text-red-600"}`}>
                          {isIncrease ? "+" : "-"}{movement.quantity}
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-slate-600">
                        {movement.previous_stock ?? "-"}
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {movement.new_stock ?? "-"}
                      </TableCell>
                      <TableCell className="text-slate-600 max-w-xs">
                        <div className="truncate">{movement.reason || "-"}</div>
                        {movement.reference && (
                          <div className="text-xs text-slate-400">Ref: {movement.reference}</div>
                        )}
                        {movement.location && (
                          <div className="text-xs text-blue-600">📍 {movement.location}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        <div className="flex items-center gap-1 text-sm">
                          <User className="w-3 h-3" />
                          <span className="truncate max-w-[120px]">
                            {movement.created_by || "-"}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredMovements.length === 0 && !isLoading && (
            <div className="text-center py-12 text-slate-400">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>Nenhuma movimentação encontrada</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <p className="text-sm text-slate-600">
                Mostrando {(page - 1) * itemsPerPage + 1} a{" "}
                {Math.min(page * itemsPerPage, filteredMovements.length)} de{" "}
                {filteredMovements.length} movimentações
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
    </div>
  );
}