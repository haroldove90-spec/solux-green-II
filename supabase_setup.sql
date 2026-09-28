-- =====================================================================
-- SOLUX GREEN CRM & ERP - SCHEMA DEFINITIVO Y LIMPIO PARA SUPABASE
-- =====================================================================
-- Ejecuta este script completo en el SQL Editor de tu proyecto en Supabase.
-- Este script recrea limpiamente todas las tablas necesarias sin errores de columnas.

-- 1. LIMPIEZA DE TABLAS PREVIAS
DROP TABLE IF EXISTS solar_projects CASCADE;
DROP TABLE IF EXISTS technicians CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS materials CASCADE;
DROP TABLE IF EXISTS users_list CASCADE;
DROP TABLE IF EXISTS app_config CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS promotional_materials CASCADE;

-- =====================================================================
-- TABLA 1: app_config (Configuración Global del Sistema)
-- =====================================================================
CREATE TABLE app_config (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'main_config',
    theme VARCHAR(20) DEFAULT 'light',
    offline_mode BOOLEAN DEFAULT FALSE,
    admin_switcher_enabled BOOLEAN DEFAULT TRUE,
    panel_base_price NUMERIC DEFAULT 11000,
    monthly_interest_rate NUMERIC DEFAULT 4.9,
    site_survey_cost NUMERIC DEFAULT 250,
    default_down_payment_percent NUMERIC DEFAULT 50,
    contado_discount_percent NUMERIC DEFAULT 5,
    financing_term_months JSONB DEFAULT '[3, 6]'::jsonb,
    financing_terms JSONB DEFAULT '[{"id":"term_3","months":3,"label":"3 Meses","monthlyInterestRate":4.9,"downPaymentPercent":50,"active":true,"description":"50% Enganche + Amortización a 3 meses"},{"id":"term_6","months":6,"label":"6 Meses","monthlyInterestRate":4.9,"downPaymentPercent":50,"active":true,"description":"50% Enganche + Amortización a 6 meses"}]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO app_config (id, theme, offline_mode, admin_switcher_enabled, panel_base_price, monthly_interest_rate, site_survey_cost, default_down_payment_percent, contado_discount_percent, financing_term_months, financing_terms)
VALUES ('main_config', 'light', FALSE, TRUE, 11000, 4.9, 250, 50, 5, '[3, 6]'::jsonb, '[{"id":"term_3","months":3,"label":"3 Meses","monthlyInterestRate":4.9,"downPaymentPercent":50,"active":true,"description":"50% Enganche + Amortización a 3 meses"},{"id":"term_6","months":6,"label":"6 Meses","monthlyInterestRate":4.9,"downPaymentPercent":50,"active":true,"description":"50% Enganche + Amortización a 6 meses"}]'::jsonb);

-- =====================================================================
-- TABLA 2: users_list (Usuarios, Administradores, Asesores, Partners y Enlaces)
-- =====================================================================
CREATE TABLE users_list (
    id VARCHAR(100) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    pin VARCHAR(50) DEFAULT '1234',
    password VARCHAR(255) DEFAULT 'password123',
    role VARCHAR(50) NOT NULL, -- 'admin', 'comercial', 'partner', 'enlace', 'client'
    full_name VARCHAR(150) NOT NULL,
    parent_id VARCHAR(100) REFERENCES users_list(id) ON DELETE SET NULL,
    phone VARCHAR(50),
    whatsapp VARCHAR(50),
    email VARCHAR(150),
    avatar TEXT,
    -- Columnas específicas para Partners y Técnicos
    coverage VARCHAR(255) DEFAULT 'Cobertura Regional',
    crews_count INT DEFAULT 1,
    survey_rate NUMERIC DEFAULT 1000,
    panel_rate NUMERIC DEFAULT 1200,
    bank_account_holder VARCHAR(200),
    bank_name VARCHAR(100),
    bank_clabe VARCHAR(50),
    account_number VARCHAR(50),
    card_number VARCHAR(50),
    payment_status_type VARCHAR(50),
    prospecting_areas TEXT,
    work_shift VARCHAR(100),
    street_and_number TEXT,
    colonia VARCHAR(150),
    municipio VARCHAR(150),
    zip_code VARCHAR(20),
    address TEXT,
    location_url TEXT,
    ine_photos JSONB DEFAULT '[]'::jsonb,
    ine_front_doc TEXT,
    ine_back_doc TEXT,
    partner_status VARCHAR(50) DEFAULT 'activo',
    referral_code VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users_list (id, username, pin, password, role, full_name, parent_id, email, whatsapp, avatar, referral_code, municipio, work_shift) VALUES
('usr_admin', 'admin', '1234', 'admin123', 'admin', 'Dirección General Solux', NULL, 'contacto@soluxgreen.com.mx', '5512345678', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 'ADMIN-001', 'Monterrey', 'Tiempo completo'),
('usr_harold', 'harold_anguiano', '1234', 'Chevropar#1970', 'enlace', 'Harold Anguiano', NULL, 'haroldo90@hotmail.com', '5544332211', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80', 'SOCIO-889-MX', 'Monterrey', 'Tiempo completo'),
('usr_enlace_sofia', 'sofia_martinez', '1234', 'Solux2026!', 'enlace', 'Lic. Sofía Martínez', 'usr_harold', 'sofia.martinez@soluxgreen.com.mx', '5511223344', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', 'ENLACE-SOF1-MX', 'San Pedro / Cumbres', 'Tiempo completo'),
('usr_carlos_mendoza', 'carlos_mendoza', '1234', 'password123', 'comercial', 'Ing. Carlos Mendoza', NULL, 'carlos.mendoza@soluxgreen.com.mx', '5512345678', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', 'ASESOR-MENDOZA', 'Monterrey', 'Tiempo completo'),
('usr_valeria_gomez', 'valeria_gomez', '1234', 'password123', 'comercial', 'Lic. Valeria Gómez', NULL, 'valeria.gomez@soluxgreen.com.mx', '5590123456', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', 'ASESOR-GOMEZ', 'Guadalupe', 'Tiempo completo'),
('usr_partner_1', 'partner_solar', '1234', 'password123', 'partner', 'Solar Tech Instalaciones S.A.', NULL, 'contacto@solartech.mx', '5588889999', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', 'PARTNER-01', 'Área Metropolitana', 'Tiempo completo'),
('usr_cliente_demo', 'cliente_demo', '1234', 'password123', 'client', 'Roberto Garza', NULL, 'roberto.garza@gmail.com', '5577665544', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80', NULL, 'San Nicolás', 'Tiempo completo');

-- =====================================================================
-- TABLA 3: solar_projects (Proyectos Solares, CRM Comercial y Enlaces)
-- =====================================================================
CREATE TABLE solar_projects (
    id VARCHAR(100) PRIMARY KEY,
    client_name VARCHAR(150) NOT NULL,
    client_phone VARCHAR(50) NOT NULL,
    municipality_state VARCHAR(200) NOT NULL,
    client_email VARCHAR(150),
    whatsapp_phone VARCHAR(50),
    google_maps_url TEXT,
    electrical_load_type TEXT[],
    wires_count INT,
    average_bill NUMERIC NOT NULL,
    available_space NUMERIC NOT NULL,
    meters_count INT DEFAULT 1,
    cfe_status VARCHAR(50) DEFAULT 'activo_sin_adeudo',
    payment_method_desired VARCHAR(100) DEFAULT 'directo',
    property_ownership VARCHAR(100) DEFAULT 'propietario',
    evidence JSONB DEFAULT '{}'::jsonb,
    estimated_panels INT DEFAULT 4,
    required_area NUMERIC DEFAULT 8.8,
    voltage_alert_220v BOOLEAN DEFAULT FALSE,
    voltage_upgrade_quoted BOOLEAN DEFAULT FALSE,
    total_investment NUMERIC DEFAULT 0,
    financing JSONB,
    saved_simulations JSONB DEFAULT '[]'::jsonb,
    site_survey_paid BOOLEAN DEFAULT FALSE,
    site_survey_cost NUMERIC DEFAULT 800,
    site_survey_receipt TEXT,
    site_survey_status VARCHAR(50) DEFAULT 'pendiente',
    site_survey_data JSONB DEFAULT '{}'::jsonb,
    site_survey_pdf TEXT,
    site_survey_evidence JSONB DEFAULT '[]'::jsonb,
    site_survey_date VARCHAR(50),
    referrer_code VARCHAR(100),
    assigned_enlace_id VARCHAR(100),
    enlace_name VARCHAR(150),
    is_recommended_by_advisor BOOLEAN DEFAULT FALSE,
    recommendation_notes TEXT,
    status VARCHAR(50) DEFAULT 'validacion', -- 'validacion', 'cotizacion_enviada', 'levantamiento', 'propuesta', 'firmado', 'instalado'
    assigned_partner_id VARCHAR(100),
    monitoring_app_url TEXT,
    monitoring_app_user TEXT,
    monitoring_app_pass TEXT,
    payments JSONB DEFAULT '[]'::jsonb,
    created_date VARCHAR(50) NOT NULL,
    created_by VARCHAR(100),
    created_by_role VARCHAR(50),
    advisor_name VARCHAR(150),
    advisor_phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO solar_projects (
    id, client_name, client_phone, municipality_state, average_bill, available_space, 
    meters_count, cfe_status, payment_method_desired, property_ownership, estimated_panels, 
    required_area, voltage_alert_220v, voltage_upgrade_quoted, total_investment, 
    site_survey_paid, site_survey_status, referrer_code, status, assigned_partner_id, 
    payments, created_date, created_by, created_by_role, advisor_name, advisor_phone
) VALUES
(
    'proj_101', 'Familia Garza Villarreal', '55-7766-5544', 'San Pedro Garza García, N.L.', 
    4500, 50, 1, 'activo_sin_adeudo', 'contado', 'propietario', 8, 23.04, 
    TRUE, TRUE, 88000, TRUE, 'concluido', 'SOCIO-889-MX', 'instalado', 'usr_partner_1', 
    '[]'::jsonb, '2026-07-01', 'usr_harold', 'enlace', 'Ing. Carlos Mendoza', '55-1234-5678'
),
(
    'proj_102', 'Lic. Sofía Valenzuela', '55-9012-3456', 'Monterrey, Nuevo León', 
    2500, 35, 1, 'activo_sin_adeudo', 'directo', 'propietario', 5, 14.40, 
    TRUE, TRUE, 55000, FALSE, 'pendiente', 'SOCIO-889-MX', 'firmado', 'usr_partner_1', 
    '[]'::jsonb, '2026-07-10', 'usr_harold', 'enlace', 'Ing. Carlos Mendoza', '55-1234-5678'
);

-- =====================================================================
-- TABLA 4: technicians (Técnicos de Campo)
-- =====================================================================
CREATE TABLE technicians (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    rating NUMERIC DEFAULT 5.0,
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO technicians (id, name, specialty, phone, status, rating, avatar) VALUES
('tech_1', 'Juan Manuel Torres', 'plomería', '55-1234-5678', 'active', 4.9, 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80'),
('tech_2', 'Ing. Ricardo Morales', 'electricidad', '55-8765-4321', 'active', 4.8, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'),
('tech_3', 'Carlos Eduardo Silva', 'cerrajería', '55-2345-6789', 'busy', 4.7, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80');

-- =====================================================================
-- TABLA 5: materials (Catálogo de Materiales e Insumos)
-- =====================================================================
CREATE TABLE materials (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    unit_price NUMERIC NOT NULL,
    unit VARCHAR(50) NOT NULL,
    stock INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO materials (id, name, unit_price, unit, stock) VALUES
('mat_1', 'Tubo Cobre 1/2" (metro)', 180, 'm', 15),
('mat_2', 'Cable Eléctrico Calibre 12 (metro)', 35, 'm', 100),
('mat_3', 'Válvula de Paso 3/4"', 220, 'pza', 8),
('mat_4', 'Pastilla Termomagnética 20A', 160, 'pza', 12),
('mat_5', 'Soldadura de Estaño (carrete)', 290, 'pza', 5),
('mat_6', 'Filtro purificador de agua', 450, 'pza', 4),
('mat_7', 'Electrodos para soldar (paquete)', 190, 'pza', 10),
('mat_8', 'Cinta de aislar negra 3M', 45, 'pza', 25);

-- =====================================================================
-- TABLA 6: services (Servicios e Instalaciones)
-- =====================================================================
CREATE TABLE services (
    id VARCHAR(100) PRIMARY KEY,
    client_name VARCHAR(150) NOT NULL,
    client_phone VARCHAR(50) NOT NULL,
    address VARCHAR(250) NOT NULL,
    coordinates JSONB DEFAULT '{}'::jsonb,
    category VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(50) DEFAULT 'normal',
    assigned_technician_id VARCHAR(100) REFERENCES technicians(id) ON DELETE SET NULL,
    scheduled_date VARCHAR(50) NOT NULL,
    created_date VARCHAR(50) NOT NULL,
    completed_date VARCHAR(50),
    before_image TEXT,
    after_image TEXT,
    materials_used JSONB DEFAULT '[]'::jsonb,
    base_price NUMERIC DEFAULT 0,
    urgency_surcharge NUMERIC DEFAULT 0,
    payment_surcharge NUMERIC DEFAULT 0,
    materials_total NUMERIC DEFAULT 0,
    final_total NUMERIC DEFAULT 0,
    payment_method VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'pending',
    client_signature TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- TABLA 7: notifications (Notificaciones Multirrol)
-- =====================================================================
CREATE TABLE notifications (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    created_date VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    role VARCHAR(50) NOT NULL, -- 'admin', 'comercial', 'enlace', 'partner', 'client', 'all'
    user_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO notifications (id, title, message, created_date, is_read, role) VALUES
('notif_1', '¡Sistema de Comisiones Enlace Activo!', 'Cada recomendación que pase a estatus Instalado liberará un bono inmediato de $1,000 MXN en tu monedero.', '2026-07-10', FALSE, 'enlace'),
('notif_2', '¡Bienvenido a Solux Green!', 'Plataforma integral comercial, técnica y operativa lista.', '2026-07-09', FALSE, 'all');

-- =====================================================================
-- TABLA 8: promotional_materials (Materiales Promocionales)
-- =====================================================================
CREATE TABLE promotional_materials (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'folleto', 'ficha_tecnica', 'redes'
    description TEXT,
    file_url TEXT NOT NULL,
    file_name VARCHAR(200),
    created_by VARCHAR(100),
    created_by_name VARCHAR(150),
    created_by_role VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO promotional_materials (id, title, category, description, file_url, file_name) VALUES
('promo_1', 'Folleto Comercial 2026', 'folleto', 'Folleto tríptico oficial con los beneficios de los inversores Solux Green.', 'https://appdesign.appdesignproyectos.com/solux_folleto_2026.pdf', 'solux_folleto_2026.pdf'),
('promo_2', 'Ficha Técnica Oficial', 'ficha_tecnica', 'Ficha de especificaciones y garantías del fabricante para clientes industriales.', 'https://appdesign.appdesignproyectos.com/solux_ficha_tecnica.pdf', 'solux_ficha_tecnica.pdf'),
('promo_3', 'Material para Redes', 'redes', 'Imágenes de antes/después del recibo de luz para compartir en tus estados.', 'https://appdesign.appdesignproyectos.com/solux_redes.zip', 'solux_redes.zip');

-- =====================================================================
-- SEGURIDAD Y POLÍTICAS RLS (Row Level Security)
-- =====================================================================
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE solar_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotional_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir app_config" ON app_config;
CREATE POLICY "Permitir app_config" ON app_config FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir users_list" ON users_list;
CREATE POLICY "Permitir users_list" ON users_list FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir solar_projects" ON solar_projects;
CREATE POLICY "Permitir solar_projects" ON solar_projects FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir technicians" ON technicians;
CREATE POLICY "Permitir technicians" ON technicians FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir materials" ON materials;
CREATE POLICY "Permitir materials" ON materials FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir services" ON services;
CREATE POLICY "Permitir services" ON services FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir notifications" ON notifications;
CREATE POLICY "Permitir notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir promotional_materials" ON promotional_materials;
CREATE POLICY "Permitir promotional_materials" ON promotional_materials FOR ALL USING (true) WITH CHECK (true);

-- Permisos de lectura, inserción, actualización y eliminación para el cliente (anon y authenticated)
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- =====================================================================
-- MIGRACIÓN NO DESTRUCTIVA (Para bases de datos ya existentes)
-- Si no quieres borrar tus datos actuales, ejecuta solo este bloque
-- =====================================================================
ALTER TABLE solar_projects ADD COLUMN IF NOT EXISTS referrer_code VARCHAR(100);
ALTER TABLE solar_projects ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);
ALTER TABLE solar_projects ADD COLUMN IF NOT EXISTS created_by_role VARCHAR(50);
ALTER TABLE solar_projects ADD COLUMN IF NOT EXISTS advisor_name VARCHAR(150);
ALTER TABLE solar_projects ADD COLUMN IF NOT EXISTS advisor_phone VARCHAR(50);
ALTER TABLE solar_projects ADD COLUMN IF NOT EXISTS monitoring_app_url TEXT;
ALTER TABLE solar_projects ADD COLUMN IF NOT EXISTS monitoring_app_user TEXT;
ALTER TABLE solar_projects ADD COLUMN IF NOT EXISTS monitoring_app_pass TEXT;
ALTER TABLE solar_projects ADD COLUMN IF NOT EXISTS payments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE solar_projects ADD COLUMN IF NOT EXISTS site_survey_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE solar_projects ADD COLUMN IF NOT EXISTS site_survey_paid BOOLEAN DEFAULT FALSE;
ALTER TABLE solar_projects ADD COLUMN IF NOT EXISTS site_survey_receipt TEXT;
ALTER TABLE solar_projects ADD COLUMN IF NOT EXISTS site_survey_status VARCHAR(50) DEFAULT 'pendiente';
ALTER TABLE solar_projects ADD COLUMN IF NOT EXISTS site_survey_cost NUMERIC DEFAULT 800;
ALTER TABLE solar_projects ADD COLUMN IF NOT EXISTS site_survey_pdf TEXT;
ALTER TABLE solar_projects ADD COLUMN IF NOT EXISTS site_survey_evidence JSONB DEFAULT '[]'::jsonb;
ALTER TABLE solar_projects ADD COLUMN IF NOT EXISTS site_survey_date VARCHAR(50);
ALTER TABLE solar_projects ADD COLUMN IF NOT EXISTS assigned_enlace_id VARCHAR(100);
ALTER TABLE solar_projects ADD COLUMN IF NOT EXISTS enlace_name VARCHAR(150);
ALTER TABLE solar_projects ADD COLUMN IF NOT EXISTS is_recommended_by_advisor BOOLEAN DEFAULT FALSE;
ALTER TABLE solar_projects ADD COLUMN IF NOT EXISTS recommendation_notes TEXT;

ALTER TABLE promotional_materials ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);
ALTER TABLE promotional_materials ADD COLUMN IF NOT EXISTS created_by_name VARCHAR(150);
ALTER TABLE promotional_materials ADD COLUMN IF NOT EXISTS created_by_role VARCHAR(50);

ALTER TABLE users_list ADD COLUMN IF NOT EXISTS parent_id VARCHAR(100) REFERENCES users_list(id) ON DELETE SET NULL;
ALTER TABLE users_list ADD COLUMN IF NOT EXISTS referral_code VARCHAR(100);
ALTER TABLE users_list ADD COLUMN IF NOT EXISTS bank_account_holder VARCHAR(200);
ALTER TABLE users_list ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);
ALTER TABLE users_list ADD COLUMN IF NOT EXISTS bank_clabe VARCHAR(50);
ALTER TABLE users_list ADD COLUMN IF NOT EXISTS account_number VARCHAR(50);
ALTER TABLE users_list ADD COLUMN IF NOT EXISTS card_number VARCHAR(50);
ALTER TABLE users_list ADD COLUMN IF NOT EXISTS payment_status_type VARCHAR(50);
ALTER TABLE users_list ADD COLUMN IF NOT EXISTS prospecting_areas TEXT;
ALTER TABLE users_list ADD COLUMN IF NOT EXISTS work_shift VARCHAR(100);
ALTER TABLE users_list ADD COLUMN IF NOT EXISTS street_and_number TEXT;
ALTER TABLE users_list ADD COLUMN IF NOT EXISTS colonia VARCHAR(150);
ALTER TABLE users_list ADD COLUMN IF NOT EXISTS municipio VARCHAR(150);
ALTER TABLE users_list ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20);
ALTER TABLE users_list ADD COLUMN IF NOT EXISTS ine_front_doc TEXT;
ALTER TABLE users_list ADD COLUMN IF NOT EXISTS ine_back_doc TEXT;
ALTER TABLE users_list ADD COLUMN IF NOT EXISTS ine_photos JSONB DEFAULT '[]'::jsonb;
ALTER TABLE users_list ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE users_list ADD COLUMN IF NOT EXISTS coverage VARCHAR(255) DEFAULT 'Cobertura Regional';
ALTER TABLE users_list ADD COLUMN IF NOT EXISTS crews_count INT DEFAULT 1;
ALTER TABLE users_list ADD COLUMN IF NOT EXISTS survey_rate NUMERIC DEFAULT 1000;
ALTER TABLE users_list ADD COLUMN IF NOT EXISTS panel_rate NUMERIC DEFAULT 1200;
ALTER TABLE users_list ADD COLUMN IF NOT EXISTS partner_status VARCHAR(50) DEFAULT 'activo';

-- Índices de optimización para red de enlaces, jerarquía y referidos
CREATE INDEX IF NOT EXISTS idx_users_list_parent_id ON users_list(parent_id);
CREATE INDEX IF NOT EXISTS idx_users_list_role ON users_list(role);
CREATE INDEX IF NOT EXISTS idx_users_list_referral_code ON users_list(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_list_username ON users_list(username);
CREATE INDEX IF NOT EXISTS idx_solar_projects_referrer_code ON solar_projects(referrer_code);
CREATE INDEX IF NOT EXISTS idx_solar_projects_status ON solar_projects(status);

ALTER TABLE app_config ADD COLUMN IF NOT EXISTS default_down_payment_percent NUMERIC DEFAULT 50;
ALTER TABLE app_config ADD COLUMN IF NOT EXISTS contado_discount_percent NUMERIC DEFAULT 5;
ALTER TABLE app_config ADD COLUMN IF NOT EXISTS financing_term_months JSONB DEFAULT '[3, 6]'::jsonb;
ALTER TABLE app_config ADD COLUMN IF NOT EXISTS financing_terms JSONB DEFAULT '[{"id":"term_3","months":3,"label":"3 Meses","monthlyInterestRate":4.9,"downPaymentPercent":50,"active":true,"description":"50% Enganche + Amortización a 3 meses"},{"id":"term_6","months":6,"label":"6 Meses","monthlyInterestRate":4.9,"downPaymentPercent":50,"active":true,"description":"50% Enganche + Amortización a 6 meses"}]'::jsonb;
ALTER TABLE app_config ADD COLUMN IF NOT EXISTS panel_base_price NUMERIC DEFAULT 11000;
UPDATE app_config SET panel_base_price = 11000 WHERE id = 'main_config';

-- =====================================================================
-- SECCIÓN LANDING PAGE: CONFIGURACIÓN DINÁMICA & STORAGE DE FOTOGRAFÍAS
-- =====================================================================

-- 1. Tabla de Configuración de la Landing Page
CREATE TABLE IF NOT EXISTS public.landing_config (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
    config JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.landing_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura publica landing_config" ON public.landing_config;
CREATE POLICY "Permitir lectura publica landing_config" 
    ON public.landing_config FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir escritura publica landing_config" ON public.landing_config;
CREATE POLICY "Permitir escritura publica landing_config" 
    ON public.landing_config FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON public.landing_config TO anon, authenticated, service_role;

-- 2. Bucket de Supabase Storage para Fotos del Slider y Contenido ('landing-images')
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'landing-images',
    'landing-images',
    true,
    15728640, -- 15MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 15728640;

-- 3. Políticas de acceso para el bucket 'landing-images'
DROP POLICY IF EXISTS "Lectura publica landing-images" ON storage.objects;
CREATE POLICY "Lectura publica landing-images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'landing-images');

DROP POLICY IF EXISTS "Subida publica landing-images" ON storage.objects;
CREATE POLICY "Subida publica landing-images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'landing-images');

DROP POLICY IF EXISTS "Actualizacion publica landing-images" ON storage.objects;
CREATE POLICY "Actualizacion publica landing-images"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'landing-images');

DROP POLICY IF EXISTS "Eliminacion publica landing-images" ON storage.objects;
CREATE POLICY "Eliminacion publica landing-images"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'landing-images');


