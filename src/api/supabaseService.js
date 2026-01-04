import { supabase } from "@/lib/supabase";

export const api = {
  auth: {
    me: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
         throw new Error("User not logged in");
      }
      
      // Buscar perfil do usuário
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('Erro ao buscar perfil:', profileError);
        // Se não encontrar perfil, retornar com role padrão
        if (profileError.code === 'PGRST116') {
          return {
            ...user,
            role: 'operator',
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0]
          };
        }
        // Para outros erros, ainda tentar retornar o usuário
        return {
          ...user,
          role: 'operator',
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0]
        };
      }
      
      // Se encontrou o perfil, usar os dados do perfil
      return {
        ...user,
        ...profile,
        role: profile.role || 'operator',
        full_name: profile.full_name || user.user_metadata?.full_name || user.email?.split('@')[0]
      };
    },
    login: async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { user: data.user, error };
    },
    logout: async () => {
      const { error } = await supabase.auth.signOut();
      return { error };
    },
    register: async (email, password, fullName) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });
      return { user: data.user, error };
    }
  },
  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        // In a real app, upload to Supabase Storage
        // For now, we can try to upload if a bucket exists, or mock it with Data URI like before
        // but since we are "removing base44", let's try to do it right or keep the mock fallback.
        // Let's keep the Data URI mock for now to avoid Storage bucket dependency unless needed.
        // Or better: try to upload to a 'uploads' bucket.
        
        // Use Data URI for simplicity as setting up Storage buckets requires dashboard access
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                resolve({ file_url: reader.result });
            };
            reader.readAsDataURL(file);
        });
      }
    }
  },
  entities: {
    Product: {
      list: async ({ page = 1, itemsPerPage = 20, filters = {}, search = '' } = {}) => {
        const from = (page - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;

        let query = supabase
          .from('products')
          .select('*', { count: 'exact' });

        if (search) {
          query = query.or(`name.ilike.%${search}%,barcode.ilike.%${search}%`);
        }

        query = query.order('name', { ascending: true });
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (error) throw error;

        return { data, count };
      },

      getById: async (id) => {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        return { data };
      },
      update: async (id, updates) => {
        const { data, error } = await supabase
          .from('products')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
          
        if (error) throw error;
        return data;
      },
      create: async (item) => {
        const { data, error } = await supabase
          .from('products')
          .insert([item])
          .select()
          .single();
          
        if (error) throw error;
        return data;
      },
      delete: async (id) => {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', id);
          
        if (error) throw error;
        return true;
      }
    },
    Sale: {
      list: async (sort = "-created_date", limit = 100) => {
        let query = supabase
          .from('sales')
          .select('*');
        
        if (sort.startsWith('-')) {
            query = query.order(sort.substring(1), { ascending: false });
        } else {
            query = query.order(sort, { ascending: true });
        }
        
        if (limit) {
            query = query.limit(limit);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        return data;
      },
      create: async (saleData) => {
        const { items, ...saleRecord } = saleData;

        // 1. Create the main sale record
        const { data: sale, error: saleError } = await supabase
          .from('sales')
          .insert([saleRecord])
          .select()
          .single();

        if (saleError) {
          console.error("Error creating sale:", saleError);
          throw saleError;
        }

        // 2. Prepare and insert the sale items
        if (items && items.length > 0) {
          const saleItemsToInsert = items.map(item => ({
            sale_id: sale.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total
          }));

          const { error: itemsError } = await supabase
            .from('sale_items')
            .insert(saleItemsToInsert);

          if (itemsError) {
            console.error("Failed to insert sale items, but sale record was created:", sale.id);
            console.error("Items error:", itemsError);
            throw itemsError;
          }
        }

        return sale;
      }
    },
    StockMovement: {
      list: async () => {
        const { data, error } = await supabase
            .from('stock_movements')
            .select('*, products(name)')
            .order('created_date', { ascending: false });
            
        if (error) throw error;
        return data;
      },
      create: async (movementData) => {
        const { data, error } = await supabase
            .from('stock_movements')
            .insert([movementData])
            .select()
            .single();
            
        if (error) throw error;
        return data;
      }
    },
    StoreSettings: {
      list: async () => {
        const { data, error } = await supabase
            .from('store_settings')
            .select('*')
            .limit(1);
            
        if (error) throw error;
        return data || [];
      },
      update: async (id, updates) => {
        const { data, error } = await supabase
            .from('store_settings')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
            
        if (error) throw error;
        return data;
      },
      create: async (settingsData) => {
        const { data, error } = await supabase
            .from('store_settings')
            .insert([settingsData])
            .select()
            .single();
            
        if (error) throw error;
        return data;
      }
    },
    Profile: {
      list: async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
      },
      getById: async (id) => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        return data;
      },
      update: async (id, updates) => {
        const { data, error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      },
      updateRole: async (userId, newRole) => {
        const { data, error } = await supabase
          .from('profiles')
          .update({ role: newRole })
          .eq('id', userId)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    }
  }
};
