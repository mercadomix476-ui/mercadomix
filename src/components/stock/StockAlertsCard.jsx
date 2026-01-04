import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function StockAlertsCard() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      const { data, error } = await supabase.rpc('get_low_stock_products');

      if (error) {
        console.error("Erro ao buscar alertas de estoque:", error);
      } else {
        setAlerts(data);
      }
    };

    fetchAlerts();
  }, []);

  return (
    <div className="p-4 border rounded">
      <h2 className="text-lg font-bold mb-2">Alertas de Estoque</h2>
      {alerts.length > 0 ? (
        <ul>
          {alerts.map((alert, index) => (
            <li key={index} className="mb-2">
              <span className="font-medium">{alert.name}</span>: {alert.stock_quantity} unidades (mínimo: {alert.min_stock})
            </li>
          ))}
        </ul>
      ) : (
        <p>Nenhum alerta de estoque.</p>
      )}
    </div>
  );
}
