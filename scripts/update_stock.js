require("dotenv").config({ path: ".env.local" });
const { supabase } = require("../src/lib/supabase");

const updateStock = async () => {
  const { data, error } = await supabase
    .from("products")
    .update({ stock_quantity: 1000 });

  if (error) {
    console.error("Erro ao atualizar estoque:", error);
  } else {
    console.log("Estoque atualizado com sucesso:", data);
  }
};

updateStock();