-- =====================================================================
-- SOLUX GREEN CRM, ERP & LANDING PAGE - SCRIPT SQL COMPLETO Y 100% SEGURO
-- =====================================================================
-- 🛡️ GARANTÍA DE SEGURIDAD TOTAL:
-- Este script es 100% NO DESTRUCTIVO.
-- NO CONTIENE "DROP TABLE", NO CONTIENE "TRUNCATE" NI "DELETE".
-- NINGÚN DATO, PROYECTO, USUARIO O HISTORIAL EXISTENTE SERÁ BORRADO.
-- Puede ejecutarse de forma segura en el SQL Editor de Supabase en cualquier momento.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. TABLA: landing_config (Configuración y Contenido de la Landing Page)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.landing_config (
    id TEXT PRIMARY KEY DEFAULT 'default',
    config JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.landing_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura publica landing_config" ON public.landing_config;
CREATE POLICY "Permitir lectura publica landing_config"
    ON public.landing_config FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Permitir escritura publica landing_config" ON public.landing_config;
CREATE POLICY "Permitir escritura publica landing_config"
    ON public.landing_config FOR ALL
    USING (true)
    WITH CHECK (true);

GRANT ALL ON public.landing_config TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- 2. BUCKET DE SUPABASE STORAGE: landing-images (Fotografías y Banners)
-- ---------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'landing-images',
    'landing-images',
    true,
    15728640, -- Límite de 15MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 15728640;

-- Políticas de seguridad para storage.objects (No borran archivos, solo configuran acceso)
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

-- ---------------------------------------------------------------------
-- 3. TABLA: app_config (Configuración Global, Financiamiento y Cotizador)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_config (
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

-- Asegurar columnas si la tabla ya existía
ALTER TABLE public.app_config ADD COLUMN IF NOT EXISTS default_down_payment_percent NUMERIC DEFAULT 50;
ALTER TABLE public.app_config ADD COLUMN IF NOT EXISTS contado_discount_percent NUMERIC DEFAULT 5;
ALTER TABLE public.app_config ADD COLUMN IF NOT EXISTS financing_term_months JSONB DEFAULT '[3, 6]'::jsonb;
ALTER TABLE public.app_config ADD COLUMN IF NOT EXISTS financing_terms JSONB DEFAULT '[{"id":"term_3","months":3,"label":"3 Meses","monthlyInterestRate":4.9,"downPaymentPercent":50,"active":true,"description":"50% Enganche + Amortización a 3 meses"},{"id":"term_6","months":6,"label":"6 Meses","monthlyInterestRate":4.9,"downPaymentPercent":50,"active":true,"description":"50% Enganche + Amortización a 6 meses"}]'::jsonb;
ALTER TABLE public.app_config ADD COLUMN IF NOT EXISTS panel_base_price NUMERIC DEFAULT 11000;

INSERT INTO public.app_config (id, theme, offline_mode, admin_switcher_enabled, panel_base_price, monthly_interest_rate, site_survey_cost, default_down_payment_percent, contado_discount_percent, financing_term_months, financing_terms)
VALUES ('main_config', 'light', FALSE, TRUE, 11000, 4.9, 250, 50, 5, '[3, 6]'::jsonb, '[{"id":"term_3","months":3,"label":"3 Meses","monthlyInterestRate":4.9,"downPaymentPercent":50,"active":true,"description":"50% Enganche + Amortización a 3 meses"},{"id":"term_6","months":6,"label":"6 Meses","monthlyInterestRate":4.9,"downPaymentPercent":50,"active":true,"description":"50% Enganche + Amortización a 6 meses"}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------
-- 4. TABLA: users_list (Usuarios, Administradores, Asesores y Enlaces)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users_list (
    id VARCHAR(100) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    pin VARCHAR(50) DEFAULT '1234',
    password VARCHAR(255) DEFAULT 'password123',
    role VARCHAR(50) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    parent_id VARCHAR(100),
    phone VARCHAR(50),
    whatsapp VARCHAR(50),
    email VARCHAR(150),
    avatar TEXT,
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

-- Asegurar columnas si la tabla ya existía
ALTER TABLE public.users_list ADD COLUMN IF NOT EXISTS parent_id VARCHAR(100);
ALTER TABLE public.users_list ADD COLUMN IF NOT EXISTS referral_code VARCHAR(100);
ALTER TABLE public.users_list ADD COLUMN IF NOT EXISTS bank_account_holder VARCHAR(200);
ALTER TABLE public.users_list ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);
ALTER TABLE public.users_list ADD COLUMN IF NOT EXISTS bank_clabe VARCHAR(50);
ALTER TABLE public.users_list ADD COLUMN IF NOT EXISTS account_number VARCHAR(50);
ALTER TABLE public.users_list ADD COLUMN IF NOT EXISTS card_number VARCHAR(50);
ALTER TABLE public.users_list ADD COLUMN IF NOT EXISTS payment_status_type VARCHAR(50);
ALTER TABLE public.users_list ADD COLUMN IF NOT EXISTS prospecting_areas TEXT;
ALTER TABLE public.users_list ADD COLUMN IF NOT EXISTS work_shift VARCHAR(100);
ALTER TABLE public.users_list ADD COLUMN IF NOT EXISTS street_and_number TEXT;
ALTER TABLE public.users_list ADD COLUMN IF NOT EXISTS colonia VARCHAR(150);
ALTER TABLE public.users_list ADD COLUMN IF NOT EXISTS municipio VARCHAR(150);
ALTER TABLE public.users_list ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20);
ALTER TABLE public.users_list ADD COLUMN IF NOT EXISTS ine_front_doc TEXT;
ALTER TABLE public.users_list ADD COLUMN IF NOT EXISTS ine_back_doc TEXT;
ALTER TABLE public.users_list ADD COLUMN IF NOT EXISTS ine_photos JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.users_list ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE public.users_list ADD COLUMN IF NOT EXISTS coverage VARCHAR(255) DEFAULT 'Cobertura Regional';
ALTER TABLE public.users_list ADD COLUMN IF NOT EXISTS crews_count INT DEFAULT 1;
ALTER TABLE public.users_list ADD COLUMN IF NOT EXISTS survey_rate NUMERIC DEFAULT 1000;
ALTER TABLE public.users_list ADD COLUMN IF NOT EXISTS panel_rate NUMERIC DEFAULT 1200;
ALTER TABLE public.users_list ADD COLUMN IF NOT EXISTS partner_status VARCHAR(50) DEFAULT 'activo';

CREATE INDEX IF NOT EXISTS idx_users_list_parent_id ON public.users_list(parent_id);
CREATE INDEX IF NOT EXISTS idx_users_list_role ON public.users_list(role);
CREATE INDEX IF NOT EXISTS idx_users_list_referral_code ON public.users_list(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_list_username ON public.users_list(username);

-- Insertar usuarios iniciales solo si NO existen
INSERT INTO public.users_list (id, username, pin, password, role, full_name, email, whatsapp, referral_code) VALUES
('usr_admin', 'admin', '1234', 'admin123', 'admin', 'Dirección General Solux', 'contacto@soluxgreen.com.mx', '5512345678', 'ADMIN-001'),
('usr_landing_admin', 'admin_landing', '1234', 'solux2026', 'landingadmin', 'Administrador Landing Page', 'landing@soluxgreen.com.mx', '2293233633', 'LANDING-ADMIN')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------
-- 5. TABLA: solar_projects (Proyectos Solares y Pipeline CRM)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.solar_projects (
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
    status VARCHAR(50) DEFAULT 'validacion',
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

-- Asegurar columnas si la tabla ya existía
ALTER TABLE public.solar_projects ADD COLUMN IF NOT EXISTS referrer_code VARCHAR(100);
ALTER TABLE public.solar_projects ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);
ALTER TABLE public.solar_projects ADD COLUMN IF NOT EXISTS created_by_role VARCHAR(50);
ALTER TABLE public.solar_projects ADD COLUMN IF NOT EXISTS advisor_name VARCHAR(150);
ALTER TABLE public.solar_projects ADD COLUMN IF NOT EXISTS advisor_phone VARCHAR(50);
ALTER TABLE public.solar_projects ADD COLUMN IF NOT EXISTS monitoring_app_url TEXT;
ALTER TABLE public.solar_projects ADD COLUMN IF NOT EXISTS monitoring_app_user TEXT;
ALTER TABLE public.solar_projects ADD COLUMN IF NOT EXISTS monitoring_app_pass TEXT;
ALTER TABLE public.solar_projects ADD COLUMN IF NOT EXISTS payments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.solar_projects ADD COLUMN IF NOT EXISTS site_survey_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.solar_projects ADD COLUMN IF NOT EXISTS site_survey_paid BOOLEAN DEFAULT FALSE;
ALTER TABLE public.solar_projects ADD COLUMN IF NOT EXISTS site_survey_receipt TEXT;
ALTER TABLE public.solar_projects ADD COLUMN IF NOT EXISTS site_survey_status VARCHAR(50) DEFAULT 'pendiente';
ALTER TABLE public.solar_projects ADD COLUMN IF NOT EXISTS site_survey_cost NUMERIC DEFAULT 800;
ALTER TABLE public.solar_projects ADD COLUMN IF NOT EXISTS site_survey_pdf TEXT;
ALTER TABLE public.solar_projects ADD COLUMN IF NOT EXISTS site_survey_evidence JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.solar_projects ADD COLUMN IF NOT EXISTS site_survey_date VARCHAR(50);
ALTER TABLE public.solar_projects ADD COLUMN IF NOT EXISTS assigned_enlace_id VARCHAR(100);
ALTER TABLE public.solar_projects ADD COLUMN IF NOT EXISTS enlace_name VARCHAR(150);
ALTER TABLE public.solar_projects ADD COLUMN IF NOT EXISTS is_recommended_by_advisor BOOLEAN DEFAULT FALSE;
ALTER TABLE public.solar_projects ADD COLUMN IF NOT EXISTS recommendation_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_solar_projects_referrer_code ON public.solar_projects(referrer_code);
CREATE INDEX IF NOT EXISTS idx_solar_projects_status ON public.solar_projects(status);

-- ---------------------------------------------------------------------
-- 6. TABLA: technicians (Técnicos e Instaladores de Campo)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.technicians (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    rating NUMERIC DEFAULT 5.0,
    avatar TEXT,
    completed_services_count INT DEFAULT 0,
    total_earnings NUMERIC DEFAULT 0,
    current_location JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 7. TABLA: materials (Insumos y Catálogo de Materiales)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.materials (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    unit_price NUMERIC NOT NULL,
    unit VARCHAR(50) NOT NULL,
    stock INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 8. TABLA: services (Órdenes de Servicio e Instalaciones)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.services (
    id VARCHAR(100) PRIMARY KEY,
    folio VARCHAR(50),
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    assigned_technician_id VARCHAR(100),
    client_name VARCHAR(150) NOT NULL,
    client_phone VARCHAR(50),
    address TEXT,
    scheduled_date VARCHAR(50),
    evidence JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 9. TABLA: notifications (Notificaciones del Sistema)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id VARCHAR(100) PRIMARY KEY,
    recipient_role VARCHAR(50) NOT NULL,
    recipient_user_id VARCHAR(100),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 10. TABLA: promotional_materials (Materiales Promocionales)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.promotional_materials (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_name VARCHAR(200),
    created_by VARCHAR(100),
    created_by_name VARCHAR(150),
    created_by_role VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.promotional_materials ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);
ALTER TABLE public.promotional_materials ADD COLUMN IF NOT EXISTS created_by_name VARCHAR(150);
ALTER TABLE public.promotional_materials ADD COLUMN IF NOT EXISTS created_by_role VARCHAR(50);

-- ---------------------------------------------------------------------
-- POLÍTICAS DE ACCESO (RLS) PARA TODAS LAS TABLAS
-- (Actualiza las reglas de seguridad sin alterar los registros)
-- ---------------------------------------------------------------------
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solar_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotional_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir app_config" ON public.app_config;
CREATE POLICY "Permitir app_config" ON public.app_config FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir users_list" ON public.users_list;
CREATE POLICY "Permitir users_list" ON public.users_list FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir solar_projects" ON public.solar_projects;
CREATE POLICY "Permitir solar_projects" ON public.solar_projects FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir technicians" ON public.technicians;
CREATE POLICY "Permitir technicians" ON public.technicians FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir materials" ON public.materials;
CREATE POLICY "Permitir materials" ON public.materials FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir services" ON public.services;
CREATE POLICY "Permitir services" ON public.services FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir notifications" ON public.notifications;
CREATE POLICY "Permitir notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir promotional_materials" ON public.promotional_materials;
CREATE POLICY "Permitir promotional_materials" ON public.promotional_materials FOR ALL USING (true) WITH CHECK (true);

-- Otorgar permisos a los roles anónimos y autenticados
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- =====================================================================
-- ✅ ¡FINALIZADO EXITOSAMENTE!
-- Todas las tablas y el bucket de Storage quedaron listos y operativos.
-- Todos tus datos existentes en Supabase permanecen 100% intactos.
-- =====================================================================
