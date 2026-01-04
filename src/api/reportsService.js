import { supabase } from "../lib/supabase";

export const fetchSalesReport = async (filters) => {
  const { data, error } = await supabase
    .from("sales")
    .select("*")
    .match(filters);

  if (error) {
    throw new Error("Erro ao buscar relatório de vendas: " + error.message);
  }

  return data;
};

export const fetchStockReport = async (filters) => {
  const { data, error } = await supabase
    .from("stock")
    .select("*")
    .match(filters);

  if (error) {
    throw new Error("Erro ao buscar relatório de estoque: " + error.message);
  }

  return data;
};

export const fetchMovementsReport = async (filters) => {
  const { data, error } = await supabase
    .from("movements")
    .select("*")
    .match(filters);

  if (error) {
    throw new Error("Erro ao buscar relatório de movimentações: " + error.message);
  }

  return data;
};