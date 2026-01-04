import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { api as base44 } from '@/api/supabaseService';
import { toast } from 'sonner';
import { Upload, Check, X } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { LoadingSpinner, LoadingOverlay } from '@/components/ui/loading-spinner';
import { ProgressBar } from '@/components/ui/progress';

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

export function ProductForm({ isOpen, onClose, product, initialData, onSuccess }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({});
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        barcode: product.barcode || "",
        sku: product.sku || "",
        category: product.category || "Mercearia",
        unit_type: product.unit_type || "unidade",
        cost_price: product.cost_price || "",
        sale_price: product.sale_price || "",
        stock_quantity: product.stock_quantity || 0,
        min_stock: product.min_stock || 5,
        is_active: product.is_active !== false,
        image_url: product.image_url || ""
      });
    } else {
      setFormData({
        name: initialData?.name || "",
        barcode: initialData?.barcode || "",
        sku: initialData?.sku || "",
        category: "Mercearia",
        unit_type: "unidade",
        cost_price: "",
        sale_price: "",
        stock_quantity: 0,
        min_stock: 5,
        is_active: true,
        image_url: ""
      });
    }
    setValidationErrors({});
  }, [product, isOpen, initialData]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Product.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto criado com sucesso!");
      if (onSuccess) onSuccess(data);
      onClose();
    },
    onError: (err) => toast.error(err.message)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Product.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ['products', product.id] });
      toast.success("Produto atualizado com sucesso!");
      onClose();
    },
    onError: (err) => toast.error(err.message)
  });

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name?.trim()) {
      errors.name = "Nome do produto é obrigatório";
    }
    
    if (!formData.sale_price || parseFloat(String(formData.sale_price).replace(",", ".")) <= 0) {
      errors.sale_price = "Preço de venda deve ser maior que zero";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const data = {
      ...formData,
      name: formData.name.trim(),
      cost_price: parseFloat(String(formData.cost_price).replace(",", ".")) || 0,
      sale_price: parseFloat(String(formData.sale_price).replace(",", ".")) || 0,
      stock_quantity: parseFloat(String(formData.stock_quantity).replace(",", ".")) || 0,
      min_stock: parseFloat(String(formData.min_stock).replace(",", ".")) || 5,
    };

    if (product) {
      updateMutation.mutate({ id: product.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 100);

      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        setFormData({ ...formData, image_url: file_url });
        toast.success("Imagem enviada com sucesso!");
        setImageUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (error) {
      setImageUploading(false);
      setUploadProgress(0);
      toast.error("Erro ao enviar imagem");
    }
  };

  const isLoading = createMutation.isLoading || updateMutation.isLoading;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
            {product ? "Editar Produto" : "Novo Produto"}
            {isLoading && <LoadingSpinner size="sm" />}
          </DialogTitle>
        </DialogHeader>
        
        <LoadingOverlay isLoading={isLoading}>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="sm:col-span-2">
                <Label htmlFor="name" className="text-sm font-medium">Nome do Produto *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (validationErrors.name) {
                      setValidationErrors({ ...validationErrors, name: null });
                    }
                  }}
                  required
                  className={`mt-1 transition-all duration-200 ${validationErrors.name ? 'border-red-500 focus:border-red-500' : ''}`}
                  aria-invalid={!!validationErrors.name}
                  aria-describedby={validationErrors.name ? "name-error" : undefined}
                />
                <AnimatePresence>
                  {validationErrors.name && (
                    <motion.p
                      id="name-error"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-red-500 text-sm mt-1"
                      role="alert"
                    >
                      {validationErrors.name}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <div>
                <Label htmlFor="barcode" className="text-sm font-medium">Código de Barras</Label>
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="mt-1 transition-all duration-200"
                />
              </div>

              <div>
                <Label htmlFor="sku" className="text-sm font-medium">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="mt-1 transition-all duration-200"
                />
              </div>

              <div>
                <Label htmlFor="category" className="text-sm font-medium">Categoria</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger className="bg-white mt-1">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent className="z-[200] bg-white max-h-[200px]">
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="unit_type" className="text-sm font-medium">Tipo de Unidade</Label>
                <Select
                  value={formData.unit_type}
                  onValueChange={(v) => setFormData({ ...formData, unit_type: v })}
                >
                  <SelectTrigger className="bg-white mt-1">
                    <SelectValue placeholder="Selecione a unidade" />
                  </SelectTrigger>
                  <SelectContent className="z-[200] bg-white">
                    {unitTypes.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="cost_price" className="text-sm font-medium">Preço de Custo</Label>
                <Input
                  id="cost_price"
                  type="text"
                  value={formData.cost_price}
                  onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                  className="mt-1 transition-all duration-200"
                  placeholder="0,00"
                />
              </div>

              <div>
                <Label htmlFor="sale_price" className="text-sm font-medium">Preço de Venda *</Label>
                <Input
                  id="sale_price"
                  type="text"
                  value={formData.sale_price}
                  onChange={(e) => {
                    setFormData({ ...formData, sale_price: e.target.value });
                    if (validationErrors.sale_price) {
                      setValidationErrors({ ...validationErrors, sale_price: null });
                    }
                  }}
                  required
                  className={`mt-1 transition-all duration-200 ${validationErrors.sale_price ? 'border-red-500 focus:border-red-500' : ''}`}
                  placeholder="0,00"
                  aria-invalid={!!validationErrors.sale_price}
                  aria-describedby={validationErrors.sale_price ? "sale-price-error" : undefined}
                />
                <AnimatePresence>
                  {validationErrors.sale_price && (
                    <motion.p
                      id="sale-price-error"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-red-500 text-sm mt-1"
                      role="alert"
                    >
                      {validationErrors.sale_price}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <div>
                <Label htmlFor="stock_quantity" className="text-sm font-medium">Quantidade em Estoque</Label>
                <Input
                  id="stock_quantity"
                  type="number"
                  step="0.001"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  className="mt-1 transition-all duration-200"
                />
              </div>

              <div>
                <Label htmlFor="min_stock" className="text-sm font-medium">Estoque Mínimo</Label>
                <Input
                  id="min_stock"
                  type="number"
                  step="0.001"
                  value={formData.min_stock}
                  onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                  className="mt-1 transition-all duration-200"
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="image" className="text-sm font-medium">Imagem do Produto</Label>
                <div className="mt-1">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="cursor-pointer"
                    disabled={imageUploading}
                  />
                  
                  {imageUploading && (
                    <div className="mt-2">
                      <ProgressBar 
                        value={uploadProgress} 
                        showLabel 
                        label="Enviando imagem..."
                        size="sm"
                      />
                    </div>
                  )}

                  <AnimatePresence>
                    {formData.image_url && !imageUploading && (
                      <motion.div 
                        className="mt-2"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                      >
                        <div className="relative inline-block">
                          <img 
                            src={formData.image_url} 
                            alt="Preview do produto" 
                            className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, image_url: "" })}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                            aria-label="Remover imagem"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex items-center space-x-2 sm:col-span-2">
                <Switch 
                  id="is_active" 
                  checked={formData.is_active} 
                  onCheckedChange={(c) => setFormData({...formData, is_active: c})} 
                />
                <Label htmlFor="is_active" className="text-sm font-medium">Produto Ativo</Label>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={onClose} 
                className="w-full sm:w-auto"
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || imageUploading} 
                className="w-full sm:w-auto"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    {product ? 'Salvando...' : 'Criando...'}
                  </div>
                ) : (
                  product ? 'Salvar Alterações' : 'Criar Produto'
                )}
              </Button>
            </div>
          </form>
        </LoadingOverlay>
      </DialogContent>
    </Dialog>
  );
}