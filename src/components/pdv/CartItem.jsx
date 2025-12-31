import React from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, Scale, Droplet } from "lucide-react";
import { motion } from "framer-motion";

export default function CartItem({ item, onUpdateQuantity, onRemove }) {
  const isWeightBased = item.unit_type === "kg" || item.unit_type === "grama" || 
                        item.unit_type === "litro" || item.unit_type === "ml";

  const formatQuantity = () => {
    if (item.unit_type === "grama") return `${(item.quantity * 1000).toFixed(0)}g`;
    if (item.unit_type === "ml") return `${(item.quantity * 1000).toFixed(0)}ml`;
    if (item.unit_type === "kg") return `${item.quantity.toFixed(3)}kg`;
    if (item.unit_type === "litro") return `${item.quantity.toFixed(3)}L`;
    return item.quantity;
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-lg border border-slate-200 p-2 sm:p-3 hover:shadow-md transition-shadow relative"
      role="group"
      aria-label={`Item do carrinho: ${item.product_name}`}
    >
      <Button
        size="icon"
        variant="ghost"
        onClick={onRemove}
        className="absolute -top-1 -right-1 h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-red-500 hover:bg-red-600 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        aria-label={`Remover ${item.product_name} do carrinho`}
      >
        <Trash2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" aria-hidden="true" />
      </Button>

      <div className="space-y-1 sm:space-y-2">
        <h3 className="font-semibold text-xs sm:text-sm text-slate-800 truncate pr-4 sm:pr-6">
          {item.product_name}
        </h3>
        
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500" aria-label={`Preço unitário: ${item.unit_price.toFixed(2)} reais`}>
            R$ {item.unit_price.toFixed(2)}
          </span>
          {isWeightBased ? (
            <span 
              className="font-medium text-slate-700 text-xs"
              aria-label={`Quantidade: ${formatQuantity()}`}
            >
              {formatQuantity()}
            </span>
          ) : (
            <div className="flex items-center gap-0.5 sm:gap-1" role="group" aria-label="Controles de quantidade">
              <Button
                size="icon"
                variant="outline"
                onClick={() => onUpdateQuantity(item.quantity - 1)}
                className="h-5 w-5 sm:h-6 sm:w-6 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
                aria-label="Diminuir quantidade"
                disabled={item.quantity <= 1}
              >
                <Minus className="w-2.5 h-2.5 sm:w-3 sm:h-3" aria-hidden="true" />
              </Button>
              <input
                type="number"
                value={item.quantity}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  onUpdateQuantity(val);
                }}
                step={isWeightBased ? "0.001" : "1"}
                min="1"
                className="w-12 sm:w-16 h-5 sm:h-6 text-center font-bold text-xs border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                aria-label={`Quantidade atual: ${item.quantity}`}
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => onUpdateQuantity(item.quantity + 1)}
                className="h-5 w-5 sm:h-6 sm:w-6 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
                aria-label="Aumentar quantidade"
              >
                <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" aria-hidden="true" />
              </Button>
            </div>
          )}
        </div>

        <div className="pt-1 border-t border-slate-100">
          <p 
            className="font-bold text-emerald-600 text-xs sm:text-sm"
            aria-label={`Total do item: ${item.total.toFixed(2)} reais`}
          >
            R$ {item.total.toFixed(2)}
          </p>
        </div>
      </div>
    </motion.article>
  );
}
