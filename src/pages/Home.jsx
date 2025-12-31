import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api as base44 } from "@/api/supabaseService";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import {
  ShoppingCart,
  Package,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, startOfDay, endOfDay, startOfMonth, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Home() {
  const { user } = useAuth();

  const { data: productData } = useQuery({
    queryKey: ["products_all"],
    queryFn: () => base44.entities.Product.list({ page: 1, itemsPerPage: 5000 }),
  });
  const products = productData?.data ?? [];

  const { data: sales = [] } = useQuery({
    queryKey: ["sales"],
    queryFn: () => base44.entities.Sale.list("-created_date", 100),
  });

  // Today's stats
  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);
  
  const todaySales = sales.filter(s => 
    s.created_date && isWithinInterval(new Date(s.created_date), { start: todayStart, end: todayEnd })
  );
  
  const todayRevenue = todaySales.reduce((sum, s) => sum + (s.total || 0), 0);
  
  // Month stats
  const monthStart = startOfMonth(today);
  const monthSales = sales.filter(s => 
    s.created_date && isWithinInterval(new Date(s.created_date), { start: monthStart, end: todayEnd })
  );
  const monthRevenue = monthSales.reduce((sum, s) => sum + (s.total || 0), 0);

  // Low stock
  const lowStockProducts = products.filter(p => p.stock_quantity <= (p.min_stock || 5));
  const criticalStock = lowStockProducts.filter(p => p.stock_quantity <= (p.min_stock || 5) * 0.5);

  // Recent sales
  const recentSales = sales.slice(0, 4);

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 truncate">
            Olá, {user?.full_name || "Mercado Mix"}! 👋
          </h1>
          <p className="text-slate-500 mt-1 capitalize text-sm sm:text-base">
            {format(today, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <Link to="/PDV" className="w-full sm:w-auto">
          <Button 
            size="lg" 
            className="w-full sm:w-auto bg-[#1B4332] hover:bg-[#2D6A4F] gap-2 shadow-lg focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:ring-offset-2"
            aria-label="Abrir ponto de venda"
          >
            <ShoppingCart className="w-5 h-5" aria-hidden="true" />
            Abrir PDV
          </Button>
        </Link>
      </header>

      {/* Stats Cards */}
      <section aria-label="Estatísticas do dashboard">
        <h2 className="sr-only">Resumo de vendas e estoque</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Vendas Hoje */}
          <Card 
            className="bg-[#10B981] text-white border-0 shadow-lg relative overflow-hidden"
            role="region"
            aria-labelledby="vendas-hoje-title"
          >
            <CardHeader className="pb-2">
              <CardTitle id="vendas-hoje-title" className="text-sm font-medium opacity-90 flex items-center gap-2">
                <DollarSign className="w-4 h-4" aria-hidden="true" />
                Vendas Hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold" aria-label={`Vendas de hoje: ${todayRevenue.toFixed(2)} reais`}>
                R$ {todayRevenue.toFixed(2)}
              </div>
              <p className="text-sm opacity-80 mt-1" aria-label={`${todaySales.length} transações realizadas hoje`}>
                {todaySales.length} transações
              </p>
            </CardContent>
          </Card>

          {/* Mês Atual */}
          <Card 
            className="bg-[#3B82F6] text-white border-0 shadow-lg relative overflow-hidden"
            role="region"
            aria-labelledby="mes-atual-title"
          >
            <CardHeader className="pb-2">
              <CardTitle id="mes-atual-title" className="text-sm font-medium opacity-90 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" aria-hidden="true" />
                Mês Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold" aria-label={`Vendas do mês: ${monthRevenue.toFixed(2)} reais`}>
                R$ {monthRevenue.toFixed(2)}
              </div>
              <p className="text-sm opacity-80 mt-1" aria-label={`${monthSales.length} vendas realizadas este mês`}>
                {monthSales.length} vendas
              </p>
            </CardContent>
          </Card>

          {/* Produtos */}
          <Card 
            className="bg-[#8B5CF6] text-white border-0 shadow-lg relative overflow-hidden"
            role="region"
            aria-labelledby="produtos-title"
          >
            <CardHeader className="pb-2">
              <CardTitle id="produtos-title" className="text-sm font-medium opacity-90 flex items-center gap-2">
                <Package className="w-4 h-4" aria-hidden="true" />
                Produtos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold" aria-label={`Total de ${products.length} produtos cadastrados`}>
                {products.length}
              </div>
              <p className="text-sm opacity-80 mt-1" aria-label={`${products.length} produtos ativos no sistema`}>
                {products.length} ativos
              </p>
            </CardContent>
          </Card>

          {/* Estoque Baixo */}
          <Card 
            className="bg-[#EF4444] text-white border-0 shadow-lg relative overflow-hidden"
            role="region"
            aria-labelledby="estoque-baixo-title"
          >
            <CardHeader className="pb-2">
              <CardTitle id="estoque-baixo-title" className="text-sm font-medium opacity-90 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                Estoque Baixo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold" aria-label={`${lowStockProducts.length} produtos com estoque baixo`}>
                {lowStockProducts.length}
              </div>
              <p className="text-sm opacity-80 mt-1" aria-label={`${criticalStock.length} produtos em estado crítico`}>
                {criticalStock.length} críticos
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
        {/* Recent Sales */}
        <section aria-labelledby="vendas-recentes-title">
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle id="vendas-recentes-title" className="text-lg font-bold text-slate-800">
                Vendas Recentes
              </CardTitle>
              <Link 
                to="/Sales" 
                className="text-sm font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 rounded"
                aria-label="Ver todas as vendas"
              >
                Ver todas <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {recentSales.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4" role="status" aria-live="polite">
                  Nenhuma venda recente.
                </p>
              ) : (
                <ul className="space-y-4" role="list" aria-label="Lista de vendas recentes">
                  {recentSales.map((sale) => (
                    <li key={sale.id} role="listitem">
                      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100">
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                          <div 
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0"
                            role="img"
                            aria-label="Ícone de venda"
                          >
                            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-slate-800 text-sm truncate" aria-label={`Venda número ${sale.id}`}>
                              {sale.id}
                            </p>
                            <p className="text-xs text-slate-500" aria-label={`Realizada às ${sale.created_date ? format(new Date(sale.created_date), "HH:mm") : "horário não disponível"}`}>
                              {sale.created_date ? format(new Date(sale.created_date), "HH:mm") : "--:--"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-emerald-600 text-sm" aria-label={`Valor total: ${sale.total?.toFixed(2)} reais`}>
                            R$ {sale.total?.toFixed(2)}
                          </p>
                          <p className="text-xs text-slate-500" aria-label={`${sale.items?.length || 0} itens vendidos`}>
                            {sale.items?.length || 0} itens
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Stock Alerts */}
        <section aria-labelledby="alertas-estoque-title">
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle id="alertas-estoque-title" className="text-lg font-bold text-slate-800">
                Alertas de Estoque
              </CardTitle>
              <Link 
                to="/Stock" 
                className="text-sm font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 rounded"
                aria-label="Ver controle de estoque completo"
              >
                Ver estoque <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {lowStockProducts.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4" role="status" aria-live="polite">
                  Nenhum alerta de estoque.
                </p>
              ) : (
                <ul className="space-y-4" role="list" aria-label="Lista de produtos com estoque baixo">
                  {lowStockProducts.slice(0, 4).map((product) => (
                    <li key={product.id} role="listitem">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-100">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-800 text-sm truncate" aria-label={`Produto: ${product.name}`}>
                            {product.name}
                          </p>
                          <p className="text-xs text-slate-500 mt-1" aria-label={`Estoque atual: ${product.stock_quantity}, estoque mínimo: ${product.min_stock}`}>
                            Estoque: <span className="font-semibold">{product.stock_quantity}</span> (Mín: {product.min_stock})
                          </p>
                        </div>
                        <Badge 
                          variant="destructive" 
                          className="bg-red-500 hover:bg-red-600 flex-shrink-0 ml-2"
                          role="status"
                          aria-label="Status crítico"
                        >
                          Crítico
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
