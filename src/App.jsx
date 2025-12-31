import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

import Home from "./pages/Home";
import PDV from "./pages/PDV";
import Products from "./pages/Products";
import Sales from "./pages/Sales";
import Settings from "./pages/Settings";
import Stock from "./pages/Stock";
import StockHistory from "./pages/StockHistory";
import Login from "./pages/Login";
import Reports from "./pages/Reports";

import MainLayout from "./components/layout/MainLayout";
import { SkipLink } from "./components/SkipLink";
import { FeedbackProvider } from "./components/FeedbackContainer";
import { AuthProvider, PERMISSIONS, USER_ROLES } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

const queryClient = new QueryClient();

// Componente interno para usar os hooks dentro do Router
function AppContent() {
  // Inicializar atalhos de teclado
  useKeyboardShortcuts();

  return (
    <>
      <SkipLink />
      <Routes>
        {/* Rota pública */}
        <Route path="/login" element={<Login />} />
        
        {/* Rotas protegidas com layout principal */}
        <Route element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          {/* Dashboard - Acesso geral */}
          <Route path="/" element={<Home />} />
          
          {/* Produtos - Requer permissão de visualização */}
          <Route path="/products" element={
            <ProtectedRoute requiredPermission={PERMISSIONS.PRODUCTS_VIEW}>
              <Products />
            </ProtectedRoute>
          } />
          
          {/* Vendas - Requer permissão de visualização */}
          <Route path="/sales" element={
            <ProtectedRoute requiredPermission={PERMISSIONS.SALES_VIEW}>
              <Sales />
            </ProtectedRoute>
          } />
          
          {/* Estoque - Requer permissão de visualização */}
          <Route path="/stock" element={
            <ProtectedRoute requiredPermission={PERMISSIONS.STOCK_VIEW}>
              <Stock />
            </ProtectedRoute>
          } />
          
          {/* Histórico de Estoque - Requer permissão específica */}
          <Route path="/stock-history" element={
            <ProtectedRoute requiredPermission={PERMISSIONS.STOCK_HISTORY}>
              <StockHistory />
            </ProtectedRoute>
          } />
          
          {/* Relatórios - Requer permissão de visualização */}
          <Route path="/reports" element={
            <ProtectedRoute requiredPermission={PERMISSIONS.REPORTS_VIEW}>
              <Reports />
            </ProtectedRoute>
          } />
          
          {/* Configurações - Requer role de Manager ou Admin */}
          <Route path="/settings" element={
            <ProtectedRoute requiredRoles={[USER_ROLES.ADMIN, USER_ROLES.MANAGER]}>
              <Settings />
            </ProtectedRoute>
          } />
        </Route>
        
        {/* PDV - Rota separada com proteção específica */}
        <Route path="/pdv" element={
          <ProtectedRoute requiredPermission={PERMISSIONS.PDV_ACCESS}>
            <PDV />
          </ProtectedRoute>
        } />
        
        {/* Rota padrão - redireciona para home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FeedbackProvider>
          <Router>
            <AppContent />
          </Router>
          
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
                border: '1px solid hsl(var(--border))',
              },
            }}
            aria-live="polite"
          />
        </FeedbackProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
