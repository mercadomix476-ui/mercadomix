import React, { useState, useEffect } from "react";
import { api as base44 } from "@/api/supabaseService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Settings as SettingsIcon,
  Store,
  Printer,
  Download,
  Upload,
  Users,
  Save,
  FileDown,
  FileUp,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import nexusLogo from "@/assets/nexuslogo.jpg";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { toast } from "sonner";

export default function Settings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("store");
  const [importFile, setImportFile] = useState(null);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [importType, setImportType] = useState("");

  const { data: settingsList = [] } = useQuery({
    queryKey: ["settings"],
    queryFn: () => base44.entities.StoreSettings.list(),
  });

  const settings = settingsList[0] || {};

  const [formData, setFormData] = useState({
    store_name: "Nexus Commerce",
    cnpj: "",
    address: "",
    phone: "",
    printer_name: "",
    printer_width: 48,
    auto_print: true,
    logo_url: nexusLogo,
    alert_email: "",
    enable_stock_alerts: true,
    alert_threshold: 50,
    currency: "BRL",
    tax_rate: 0,
    payment_methods: ["Dinheiro", "Cartão de Crédito", "Cartão de Débito", "Pix"],
  });

  useEffect(() => {
    if (settings.id) {
      setFormData({
        store_name: settings.store_name || "Nexus Commerce",
        cnpj: settings.cnpj || "",
        address: settings.address || "",
        phone: settings.phone || "",
        printer_name: settings.printer_name || "",
        printer_width: settings.printer_width || 48,
        auto_print: settings.auto_print !== false,
        logo_url: settings.logo_url || nexusLogo,
        alert_email: settings.alert_email || "",
        enable_stock_alerts: settings.enable_stock_alerts !== false,
        alert_threshold: settings.alert_threshold || 50,
        currency: settings.currency || "BRL",
        tax_rate: settings.tax_rate || 0,
        payment_methods: settings.payment_methods || ["Dinheiro", "Cartão de Crédito", "Cartão de Débito", "Pix"],
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (settings.id) {
        return base44.entities.StoreSettings.update(settings.id, data);
      } else {
        return base44.entities.StoreSettings.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Configurações salvas com sucesso!");
    },
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  // Export Functions
  const handleExportProducts = async (format) => {
    try {
      toast.loading("Exportando produtos...");
      const products = await base44.entities.Product.list();
      
      validateDataForExport(products, "produtos");
      
      let content, filename, mimeType;
      
      if (format === "json") {
        content = JSON.stringify(products, null, 2);
        filename = "produtos.json";
        mimeType = "application/json";
      } else if (format === "csv") {
        content = convertToCSV(products);
        filename = "produtos.csv";
        mimeType = "text/csv;charset=utf-8";
      } else {
        throw new Error("Formato não suportado");
      }
      
      downloadFile(content, filename, mimeType);
      
      toast.dismiss();
      toast.success(`✅ ${products.length} produtos exportados em ${format.toUpperCase()}!`);
    } catch (error) {
      toast.dismiss();
      console.error("Erro ao exportar produtos:", error);
      toast.error("Erro ao exportar produtos: " + error.message);
    }
  };

  const handleExportSales = async (format) => {
    try {
      toast.loading("Exportando vendas...");
      const sales = await base44.entities.Sale.list();
      
      validateDataForExport(sales, "vendas");
      
      let content, filename, mimeType;
      
      if (format === "json") {
        content = JSON.stringify(sales, null, 2);
        filename = "vendas.json";
        mimeType = "application/json";
      } else if (format === "csv") {
        // Para CSV, achatar os dados complexos
        const flatSales = sales.map(sale => {
          const flatSale = { ...sale };
          
          // Converter arrays e objetos para strings
          if (flatSale.items && Array.isArray(flatSale.items)) {
            flatSale.items_count = flatSale.items.length;
            flatSale.items_json = JSON.stringify(flatSale.items);
            delete flatSale.items; // Remove o array original
          }
          
          // Converter outras propriedades complexas
          Object.keys(flatSale).forEach(key => {
            if (typeof flatSale[key] === 'object' && flatSale[key] !== null) {
              flatSale[`${key}_json`] = JSON.stringify(flatSale[key]);
              delete flatSale[key];
            }
          });
          
          return flatSale;
        });
        
        content = convertToCSV(flatSales);
        filename = "vendas.csv";
        mimeType = "text/csv;charset=utf-8";
      } else {
        throw new Error("Formato não suportado");
      }
      
      downloadFile(content, filename, mimeType);
      
      toast.dismiss();
      toast.success(`✅ ${sales.length} vendas exportadas em ${format.toUpperCase()}!`);
    } catch (error) {
      toast.dismiss();
      console.error("Erro ao exportar vendas:", error);
      toast.error("Erro ao exportar vendas: " + error.message);
    }
  };

  const handleExportBackup = async () => {
    try {
      const loadingToastId = toast.loading("Gerando backup completo...");
      
      // Buscar todos os dados em paralelo para melhor performance
      const [products, sales, stockMovements, storeSettings] = await Promise.all([
        base44.entities.Product.list().catch(() => []),
        base44.entities.Sale.list().catch(() => []),
        base44.entities.StockMovement.list().catch(() => []),
        base44.entities.StoreSettings.list().catch(() => [])
      ]);

      const backup = {
        version: "1.0",
        date: new Date().toISOString(),
        app: "Nexus Commerce",
        metadata: {
          totalProducts: products?.length || 0,
          totalSales: sales?.length || 0,
          totalMovements: stockMovements?.length || 0,
          totalSettings: storeSettings?.length || 0,
          exportedBy: formData.store_name || "Nexus Commerce"
        },
        data: {
          products: products || [],
          sales: sales || [],
          stockMovements: stockMovements || [],
          storeSettings: storeSettings || []
        }
      };

      const now = new Date();
      const fileName = `backup_mercadinho_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}.json`;
      
      downloadFile(JSON.stringify(backup, null, 2), fileName, "application/json");
      
      toast.dismiss(loadingToastId);
      toast.success(
        `✅ Backup completo exportado!\n📦 ${backup.metadata.totalProducts} produtos | 🛒 ${backup.metadata.totalSales} vendas | 📊 ${backup.metadata.totalMovements} movimentações | ⚙️ ${backup.metadata.totalSettings} configurações`,
        { duration: 6000 }
      );
    } catch (error) {
      toast.dismiss();
      console.error("Erro ao exportar backup:", error);
      toast.error("Erro ao exportar backup: " + error.message);
    }
  };

  // Função auxiliar para validar dados antes da exportação
  const validateDataForExport = (data, dataType) => {
    if (!data) {
      throw new Error(`Dados de ${dataType} não encontrados`);
    }
    
    if (!Array.isArray(data)) {
      throw new Error(`Dados de ${dataType} devem ser um array`);
    }
    
    if (data.length === 0) {
      throw new Error(`Nenhum registro de ${dataType} encontrado`);
    }
    
    // Verificar se pelo menos o primeiro item tem propriedades
    if (data[0] && typeof data[0] === 'object' && Object.keys(data[0]).length === 0) {
      throw new Error(`Registros de ${dataType} estão vazios`);
    }
    
    return true;
  };

  const convertToCSV = (data) => {
    if (!data || data.length === 0) {
      throw new Error("Nenhum dado disponível para exportar");
    }
    
    try {
      // Pegar todas as chaves únicas de todos os objetos (caso alguns tenham campos diferentes)
      const allHeaders = new Set();
      data.forEach(row => {
        if (row && typeof row === 'object') {
          Object.keys(row).forEach(key => allHeaders.add(key));
        }
      });
      
      const headers = Array.from(allHeaders);
      
      if (headers.length === 0) {
        throw new Error("Nenhum campo encontrado nos dados");
      }
      
      // Criar cabeçalho CSV
      const csvHeaders = headers.map(header => {
        // Escapar cabeçalhos que contenham vírgulas ou aspas
        if (header.includes(",") || header.includes('"') || header.includes("\n")) {
          return `"${header.replace(/"/g, '""')}"`;
        }
        return header;
      }).join(",");
      
      // Criar linhas CSV
      const rows = data.map((row, index) => {
        try {
          return headers.map(header => {
            const val = row?.[header];
            
            // Tratar valores nulos/undefined
            if (val === null || val === undefined) {
              return "";
            }
            
            // Tratar objetos e arrays
            if (typeof val === "object") {
              const jsonStr = JSON.stringify(val);
              return `"${jsonStr.replace(/"/g, '""')}"`;
            }
            
            // Converter para string
            const strVal = String(val);
            
            // Escapar strings que contenham vírgulas, aspas ou quebras de linha
            if (strVal.includes(",") || strVal.includes('"') || strVal.includes("\n") || strVal.includes("\r")) {
              return `"${strVal.replace(/"/g, '""')}"`;
            }
            
            return strVal;
          }).join(",");
        } catch (rowError) {
          console.warn(`Erro na linha ${index + 1}:`, rowError);
          return headers.map(() => "").join(","); // Linha vazia em caso de erro
        }
      });
      
      const csvContent = [csvHeaders, ...rows].join("\n");
      
      if (!csvContent.trim()) {
        throw new Error("Conteúdo CSV vazio gerado");
      }
      
      return csvContent;
    } catch (error) {
      console.error("Erro ao converter para CSV:", error);
      throw new Error(`Erro ao converter dados para CSV: ${error.message}`);
    }
  };

  const downloadFile = (content, filename, type) => {
    try {
      // Adicionar BOM para UTF-8 em arquivos CSV para melhor compatibilidade
      let finalContent = content;
      if (type.includes("csv")) {
        finalContent = "\uFEFF" + content; // BOM para UTF-8
      }
      
      const blob = new Blob([finalContent], { type: type + ";charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.style.display = "none";
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Cleanup
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);
      
    } catch (error) {
      console.error("Erro ao fazer download:", error);
      throw new Error("Erro ao fazer download do arquivo: " + error.message);
    }
  };

  // Import Functions
  const handleImportFile = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      // Validação básica do arquivo
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        toast.error("Arquivo muito grande. Tamanho máximo: 50MB");
        e.target.value = '';
        return;
      }
      
      const allowedTypes = type === "backup" 
        ? [".json"] 
        : [".json", ".csv"];
      
      const fileExt = "." + file.name.split('.').pop().toLowerCase();
      if (!allowedTypes.includes(fileExt)) {
        toast.error(`Tipo de arquivo não suportado. Tipos aceitos: ${allowedTypes.join(", ")}`);
        e.target.value = '';
        return;
      }
      
      setImportFile(file);
      setImportType(type);
      setShowImportConfirm(true);
    }
    // Reset input to allow re-selection of same file
    e.target.value = '';
  };

  const processImport = async () => {
    if (!importFile) return;

    setShowImportConfirm(false);
    let loadingToastId = null;

    try {
      const content = await importFile.text();
      const fileExt = importFile.name.split('.').pop().toLowerCase();

      if (importType === "products") {
        loadingToastId = toast.loading("Importando produtos...");
        
        let products = [];
        if (fileExt === "json") {
          const parsed = JSON.parse(content);
          products = Array.isArray(parsed) ? parsed : (parsed.data?.products || []);
        } else if (fileExt === "csv") {
          products = parseCSV(content);
        }
        
        if (!Array.isArray(products) || products.length === 0) {
          throw new Error("Nenhum produto encontrado no arquivo");
        }
        
        let importedCount = 0;
        let errorCount = 0;
        
        for (const [index, product] of products.entries()) {
          try {
            toast.loading(`Importando produto ${index + 1}/${products.length}...`, { id: loadingToastId });
            
            const cleanProduct = { ...product };
            delete cleanProduct.id;
            delete cleanProduct.created_date;
            delete cleanProduct.updated_date;
            delete cleanProduct.created_by;
            
            // Validação básica
            if (!cleanProduct.name || cleanProduct.name.trim() === "") {
              throw new Error("Nome do produto é obrigatório");
            }
            
            await base44.entities.Product.create(cleanProduct);
            importedCount++;
          } catch (err) {
            console.warn(`Produto ${index + 1} não importado:`, err.message);
            errorCount++;
          }
        }
        
        toast.dismiss(loadingToastId);
        
        if (importedCount > 0) {
          toast.success(`✅ ${importedCount} produtos importados com sucesso!${errorCount > 0 ? ` (${errorCount} com erro)` : ''}`);
          queryClient.invalidateQueries({ queryKey: ["products"] });
        } else {
          toast.error(`❌ Nenhum produto foi importado. ${errorCount} produtos com erro.`);
        }
        
      } else if (importType === "backup") {
        loadingToastId = toast.loading("Validando arquivo de backup...");
        
        const parsed = JSON.parse(content);
        
        // Validação do formato do backup
        if (!parsed.data || typeof parsed.data !== 'object') {
          throw new Error("Arquivo de backup inválido. Formato esperado não encontrado.");
        }
        
        // Verificar se é um backup do Mercadinho Mix
        if (parsed.app && parsed.app !== "Nexus Commerce") {
          toast.loading("⚠️ Backup de aplicativo diferente detectado. Continuando...", { id: loadingToastId });
        }
        
        const { products = [], sales = [], stockMovements = [], storeSettings = [] } = parsed.data;
        const totalRecords = products.length + sales.length + stockMovements.length + storeSettings.length;
        
        if (totalRecords === 0) {
          throw new Error("Backup vazio. Nenhum dado encontrado para importar.");
        }
        
        toast.loading(`Iniciando restauração de ${totalRecords} registros...`, { id: loadingToastId });
        
        let importedCounts = { products: 0, sales: 0, movements: 0, settings: 0 };
        let errorCounts = { products: 0, sales: 0, movements: 0, settings: 0 };
        
        // Import products
        if (Array.isArray(products) && products.length > 0) {
          for (const [index, product] of products.entries()) {
            try {
              toast.loading(`Importando produtos: ${index + 1}/${products.length}`, { id: loadingToastId });
              
              const cleanProduct = { ...product };
              delete cleanProduct.id;
              delete cleanProduct.created_date;
              delete cleanProduct.updated_date;
              delete cleanProduct.created_by;
              
              if (!cleanProduct.name || cleanProduct.name.trim() === "") {
                throw new Error("Nome do produto é obrigatório");
              }
              
              await base44.entities.Product.create(cleanProduct);
              importedCounts.products++;
            } catch (err) {
              console.warn(`Produto ${index + 1} não importado:`, err.message);
              errorCounts.products++;
            }
          }
        }
        
        // Import sales
        if (Array.isArray(sales) && sales.length > 0) {
          for (const [index, sale] of sales.entries()) {
            try {
              toast.loading(`Importando vendas: ${index + 1}/${sales.length}`, { id: loadingToastId });
              
              const cleanSale = { ...sale };
              delete cleanSale.id;
              delete cleanSale.created_date;
              delete cleanSale.updated_date;
              delete cleanSale.created_by;
              
              await base44.entities.Sale.create(cleanSale);
              importedCounts.sales++;
            } catch (err) {
              console.warn(`Venda ${index + 1} não importada:`, err.message);
              errorCounts.sales++;
            }
          }
        }
        
        // Import stock movements
        if (Array.isArray(stockMovements) && stockMovements.length > 0) {
          for (const [index, movement] of stockMovements.entries()) {
            try {
              toast.loading(`Importando movimentações: ${index + 1}/${stockMovements.length}`, { id: loadingToastId });
              
              const cleanMovement = { ...movement };
              delete cleanMovement.id;
              delete cleanMovement.created_date;
              delete cleanMovement.updated_date;
              delete cleanMovement.created_by;
              
              await base44.entities.StockMovement.create(cleanMovement);
              importedCounts.movements++;
            } catch (err) {
              console.warn(`Movimentação ${index + 1} não importada:`, err.message);
              errorCounts.movements++;
            }
          }
        }
        
        // Import store settings
        if (Array.isArray(storeSettings) && storeSettings.length > 0) {
          try {
            toast.loading("Importando configurações da loja...", { id: loadingToastId });
            
            const newSettings = { ...storeSettings[0] };
            delete newSettings.id;
            delete newSettings.created_date;
            delete newSettings.updated_date;
            delete newSettings.created_by;
            
            const existingSettings = await base44.entities.StoreSettings.list();
            if (existingSettings.length > 0) {
              await base44.entities.StoreSettings.update(existingSettings[0].id, newSettings);
            } else {
              await base44.entities.StoreSettings.create(newSettings);
            }
            importedCounts.settings = 1;
          } catch (err) {
            console.warn("Configurações não importadas:", err.message);
            errorCounts.settings = 1;
          }
        }
        
        toast.dismiss(loadingToastId);
        
        const totalImported = importedCounts.products + importedCounts.sales + importedCounts.movements + importedCounts.settings;
        const totalErrors = errorCounts.products + errorCounts.sales + errorCounts.movements + errorCounts.settings;
        
        if (totalImported > 0) {
          toast.success(
            `✅ Backup restaurado com sucesso!\n📦 ${importedCounts.products} produtos | 🛒 ${importedCounts.sales} vendas | 📊 ${importedCounts.movements} movimentações | ⚙️ ${importedCounts.settings} configurações${totalErrors > 0 ? `\n⚠️ ${totalErrors} registros com erro` : ''}`,
            { duration: 8000 }
          );
          
          // Invalidar todas as queries para atualizar os dados
          queryClient.invalidateQueries();
        } else {
          toast.error(`❌ Nenhum registro foi importado. ${totalErrors} registros com erro.`);
        }
      }
    } catch (error) {
      if (loadingToastId) toast.dismiss(loadingToastId);
      console.error("Erro ao importar:", error);
      toast.error(`❌ Erro na importação: ${error.message}`, { duration: 6000 });
    } finally {
      setImportFile(null);
      setImportType("");
    }
  };

  const parseCSV = (content) => {
    try {
      const lines = content.split("\n").filter(l => l.trim());
      if (lines.length < 2) {
        throw new Error("Arquivo CSV deve ter pelo menos um cabeçalho e uma linha de dados");
      }
      
      const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
      const data = [];
      
      for (let i = 1; i < lines.length; i++) {
        try {
          // Melhor parsing de CSV considerando aspas e vírgulas dentro de campos
          const values = [];
          let current = '';
          let inQuotes = false;
          
          for (let j = 0; j < lines[i].length; j++) {
            const char = lines[i][j];
            
            if (char === '"') {
              if (inQuotes && lines[i][j + 1] === '"') {
                current += '"';
                j++; // Skip next quote
              } else {
                inQuotes = !inQuotes;
              }
            } else if (char === ',' && !inQuotes) {
              values.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          values.push(current.trim()); // Add last value
          
          const row = {};
          headers.forEach((header, idx) => {
            let val = values[idx] || "";
            
            // Try to parse numbers
            if (!isNaN(val) && val !== "" && val !== null) {
              const numVal = parseFloat(val);
              if (!isNaN(numVal)) val = numVal;
            }
            
            // Parse booleans
            if (val === "true") val = true;
            if (val === "false") val = false;
            
            // Try to parse JSON objects
            if (typeof val === "string" && (val.startsWith("{") || val.startsWith("["))) {
              try {
                val = JSON.parse(val);
              } catch {
                // Keep as string if not valid JSON
              }
            }
            
            row[header] = val;
          });
          
          data.push(row);
        } catch (lineError) {
          console.warn(`Erro na linha ${i + 1} do CSV:`, lineError.message);
        }
      }
      
      return data;
    } catch (error) {
      console.error("Erro ao fazer parse do CSV:", error);
      throw new Error("Erro ao processar arquivo CSV: " + error.message);
    }
  };

  const format = (date, formatStr) => {
    const d = new Date(date);
    const pad = (n) => n.toString().padStart(2, '0');
    return formatStr
      .replace('yyyy', d.getFullYear())
      .replace('MM', pad(d.getMonth() + 1))
      .replace('dd', pad(d.getDate()))
      .replace('HH', pad(d.getHours()))
      .replace('mm', pad(d.getMinutes()))
      .replace('ss', pad(d.getSeconds()));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Configurações</h1>
          <p className="text-slate-500">Gerencie as configurações do sistema</p>
        </div>
        <LogoutButton 
          variant="outline" 
          className="text-red-600 border-red-200 hover:bg-red-50"
        />
      </div>

      <Tabs defaultValue="store" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-slate-100 p-1 rounded-lg">
          <TabsTrigger 
            value="store" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Store className="w-4 h-4" />
            <span>Loja</span>
          </TabsTrigger>
          <TabsTrigger 
            value="printer" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Impressora</span>
          </TabsTrigger>
          <TabsTrigger 
            value="alerts" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <AlertCircle className="w-4 h-4" />
            <span>Alertas</span>
          </TabsTrigger>
          <TabsTrigger 
            value="backup" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Backup</span>
          </TabsTrigger>
        </TabsList>

        {/* Store Settings */}
        <TabsContent value="store" className="mt-0">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5" />
                Dados da Loja
              </CardTitle>
              <CardDescription>
                Informações que aparecem nos cupons e relatórios
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="store_name">Nome da Loja</Label>
                  <Input
                    id="store_name"
                    value={formData.store_name}
                    onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(00) 0000-0000"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="logo_url">Logo da Loja</Label>
                  <div className="space-y-4">
                    {/* Preview da logo atual */}
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-emerald-600 shadow-lg flex-shrink-0">
                        <img 
                          src={formData.logo_url} 
                          alt="Logo atual"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = nexusLogo; // Fallback para logo padrão
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-700">Logo atual</p>
                        <p className="text-xs text-slate-500">Esta logo aparecerá no sistema interno</p>
                      </div>
                    </div>
                    
                    {/* Input para URL da logo */}
                    <div>
                      <Input
                        id="logo_url"
                        type="url"
                        value={formData.logo_url}
                        onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                        placeholder="https://exemplo.com/sua-logo.jpg"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Cole a URL da sua logo personalizada. Recomendamos imagens quadradas (1:1) para melhor resultado.
                      </p>
                    </div>

                    {/* Botão para resetar para logo padrão */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData({ ...formData, logo_url: nexusLogo })}
                      className="text-slate-600"
                    >
                      Usar Logo Padrão do Nexus Commerce
                    </Button>

                    {/* Nota sobre a logo do login */}
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs text-blue-700">
                        <strong>Nota:</strong> A tela de login sempre usará a logo oficial do Nexus Commerce. 
                        Esta configuração afeta apenas o sistema interno após o login.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <Button 
                onClick={handleSave} 
                disabled={saveMutation.isPending} 
                className="bg-[#1B4332] hover:bg-[#2D6A4F] gap-2"
              >
                <Save className="w-4 h-4" />
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Printer Settings */}
        <TabsContent value="printer" className="mt-0">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Printer className="w-5 h-5" />
                Configurações de Impressão
              </CardTitle>
              <CardDescription>
                Configure a impressora térmica ESC/POS via QZ Tray
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-800">Requisitos</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Para usar impressoras ESC/POS USB, instale o{" "}
                      <a href="https://qz.io/download/" target="_blank" rel="noopener" className="underline">
                        QZ Tray
                      </a>{" "}
                      no computador.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="printer_name">Nome da Impressora</Label>
                  <Input
                    id="printer_name"
                    value={formData.printer_name}
                    onChange={(e) => setFormData({ ...formData, printer_name: e.target.value })}
                    placeholder="Ex: POS-80"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Nome exato como aparece no sistema
                  </p>
                </div>
                <div>
                  <Label htmlFor="printer_width">Largura (caracteres)</Label>
                  <Select
                    value={formData.printer_width.toString()}
                    onValueChange={(v) => setFormData({ ...formData, printer_width: parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="32">32 (58mm)</SelectItem>
                      <SelectItem value="42">42 (72mm)</SelectItem>
                      <SelectItem value="48">48 (80mm)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-medium">Impressão Automática</p>
                  <p className="text-sm text-slate-500">
                    Imprimir cupom automaticamente após cada venda
                  </p>
                </div>
                <Switch
                  checked={formData.auto_print}
                  onCheckedChange={(v) => setFormData({ ...formData, auto_print: v })}
                />
              </div>

              <Separator />
              <Button 
                onClick={handleSave} 
                disabled={saveMutation.isPending} 
                className="bg-[#1B4332] hover:bg-[#2D6A4F] gap-2"
              >
                <Save className="w-4 h-4" />
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Settings */}
        <TabsContent value="alerts" className="mt-0">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Configurações de Alertas
              </CardTitle>
              <CardDescription>
                Configure notificações automáticas para estoque baixo
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-medium">Habilitar Alertas de Estoque</p>
                  <p className="text-sm text-slate-500">
                    Receber notificações quando produtos estiverem com estoque baixo
                  </p>
                </div>
                <Switch
                  checked={formData.enable_stock_alerts}
                  onCheckedChange={(v) => setFormData({ ...formData, enable_stock_alerts: v })}
                />
              </div>

              {formData.enable_stock_alerts && (
                <>
                  <div>
                    <Label htmlFor="alert_email">Email para Alertas</Label>
                    <Input
                      id="alert_email"
                      type="email"
                      value={formData.alert_email}
                      onChange={(e) => setFormData({ ...formData, alert_email: e.target.value })}
                      placeholder="seuemail@exemplo.com"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Email que receberá as notificações de estoque baixo
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="alert_threshold">Limiar de Alerta (%)</Label>
                    <Select
                      value={formData.alert_threshold.toString()}
                      onValueChange={(v) => setFormData({ ...formData, alert_threshold: parseInt(v) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="25">25% do estoque mínimo</SelectItem>
                        <SelectItem value="50">50% do estoque mínimo</SelectItem>
                        <SelectItem value="75">75% do estoque mínimo</SelectItem>
                        <SelectItem value="100">100% do estoque mínimo</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500 mt-1">
                      Alertas serão enviados quando o estoque atingir este percentual do mínimo
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-800">Alertas Automáticos</p>
                        <p className="text-sm text-blue-700 mt-1">
                          Você receberá um email diariamente com a lista de produtos que precisam de reposição,
                          incluindo sugestões de quantidade baseadas no histórico de vendas.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <Separator />
              <Button 
                onClick={handleSave} 
                disabled={saveMutation.isPending} 
                className="bg-[#1B4332] hover:bg-[#2D6A4F] gap-2"
              >
                <Save className="w-4 h-4" />
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup & Import/Export */}
        <TabsContent value="backup" className="mt-0 space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Backup e Importação
              </CardTitle>
              <CardDescription>
                Exporte seus dados para backup ou importe dados existentes
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Export Section */}
              <div>
                <h3 className="text-lg font-medium text-slate-800 mb-4">Exportar Dados</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-xl">
                    <h4 className="font-medium mb-2">Produtos</h4>
                    <p className="text-sm text-slate-500 mb-3">
                      Exporte o catálogo de produtos
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportProducts("json")}
                      >
                        JSON
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportProducts("csv")}
                      >
                        CSV
                      </Button>
                    </div>
                  </div>
                  <div className="p-4 border rounded-xl">
                    <h4 className="font-medium mb-2">Vendas</h4>
                    <p className="text-sm text-slate-500 mb-3">
                      Exporte o histórico de vendas
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportSales("json")}
                      >
                        JSON
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportSales("csv")}
                      >
                        CSV
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 mt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-emerald-800">Backup Completo do Sistema</h4>
                      <p className="text-sm text-emerald-700 mt-1">
                        Exporta todos os dados: produtos, vendas, movimentações e configurações
                      </p>
                    </div>
                    <Button 
                      onClick={handleExportBackup} 
                      className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Baixar Backup
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Import Section */}
              <div>
                <h3 className="text-lg font-medium text-slate-800 mb-4">Importar Dados</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-xl">
                    <h4 className="font-medium mb-2">Importar Produtos</h4>
                    <p className="text-sm text-slate-500 mb-3">
                      Suporta JSON ou CSV
                    </p>
                    <Input
                      type="file"
                      accept=".json,.csv"
                      onChange={(e) => handleImportFile(e, "products")}
                      className="cursor-pointer"
                    />
                  </div>
                  <div className="p-4 border-2 border-blue-200 bg-blue-50 rounded-xl">
                    <h4 className="font-medium mb-2 text-blue-800">Restaurar Backup Completo</h4>
                    <p className="text-sm text-blue-700 mb-3">
                      Selecione um arquivo JSON de backup exportado anteriormente
                    </p>
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept=".json"
                        onChange={(e) => handleImportFile(e, "backup")}
                        className="cursor-pointer bg-white"
                      />
                      <p className="text-xs text-blue-600">
                        ⚠️ Importante: Os dados serão adicionados ao sistema atual. Para substituir completamente, limpe os dados antes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Import Confirmation Dialog */}
      <AlertDialog open={showImportConfirm} onOpenChange={setShowImportConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Confirmar {importType === "backup" ? "Restauração de Backup" : "Importação"}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Você está prestes a importar dados do arquivo:</p>
              <p className="font-medium text-slate-700">"{importFile?.name}"</p>
              {importType === "backup" && (
                <div className="bg-amber-50 border border-amber-200 rounded p-3 mt-3">
                  <p className="text-amber-800 text-sm">
                    ⚠️ <strong>Atenção:</strong> Os dados do backup serão adicionados ao sistema atual. 
                    Produtos, vendas e movimentações serão criados como novos registros.
                  </p>
                </div>
              )}
              <p className="text-slate-600 text-sm mt-2">Deseja continuar?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setImportFile(null);
              setImportType("");
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={processImport}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Sim, Importar Agora
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}