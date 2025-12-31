-- =============================================
-- MIGRAÇÃO PARA NEXUS COMMERCE
-- =============================================
-- Este script atualiza os dados existentes para refletir a nova marca

-- Atualizar configurações da loja existentes
UPDATE store_settings 
SET store_name = 'Nexus Commerce'
WHERE store_name = 'Mercadinho Mix' OR store_name IS NULL;

-- Se não existir nenhuma configuração, criar uma padrão
INSERT INTO store_settings (store_name, auto_print, enable_stock_alerts, alert_threshold)
SELECT 'Nexus Commerce', true, true, 10
WHERE NOT EXISTS (SELECT 1 FROM store_settings);

-- Comentário sobre a logo
-- NOTA: A logo_url pode ser mantida como está para preservar logos personalizadas dos clientes
-- A logo padrão do Nexus Commerce será aplicada automaticamente via código quando logo_url for NULL ou vazia