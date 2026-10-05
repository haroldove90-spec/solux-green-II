import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Save, Eye, RotateCcw, Upload, Trash2, Plus, Check, 
  Sparkles, Palette, Type, Layout, Image as ImageIcon, 
  HelpCircle, MessageSquare, Phone, Mail, MapPin, 
  Sliders, ArrowLeft, ExternalLink, Database, Copy, 
  CheckCircle2, AlertTriangle, Layers, Info, ShieldCheck,
  ChevronRight, RefreshCw
} from 'lucide-react';
import { LandingConfig, LandingSlide, LandingBenefit, LandingStep, LandingFAQ, LandingStat } from '../types';
import { uploadLandingImageToSupabase } from '../supabaseService';
import { DEFAULT_LANDING_CONFIG } from '../landingDefaultData';

interface AdminLandingPageProps {
  config: LandingConfig;
  onSaveConfig: (newConfig: LandingConfig) => Promise<boolean>;
  onNavigateToLanding: () => void;
  onNavigateToPortal: () => void;
  isOfflineMode?: boolean;
}

export const SUPABASE_LANDING_SQL = `-- ============================================================
-- SQL DE SUPABASE PARA LA LANDING PAGE Y ALMACENAMIENTO DE IMÁGENES
-- Copia y pega este script en el Editor SQL de tu proyecto Supabase
-- ============================================================

-- 1. Crear tabla para la configuración de la Landing Page
CREATE TABLE IF NOT EXISTS public.landing_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  config JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en landing_config
ALTER TABLE public.landing_config ENABLE ROW LEVEL SECURITY;

-- Política de lectura pública: cualquier visitante puede leer la configuración
DROP POLICY IF EXISTS "Permitir lectura publica landing_config" ON public.landing_config;
CREATE POLICY "Permitir lectura publica landing_config"
ON public.landing_config FOR SELECT
USING (true);

-- Política de escritura: permite upsert de configuración
DROP POLICY IF EXISTS "Permitir escritura landing_config" ON public.landing_config;
CREATE POLICY "Permitir escritura landing_config"
ON public.landing_config FOR ALL
USING (true)
WITH CHECK (true);

-- 2. Crear Bucket de Supabase Storage para imágenes de la Landing
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'landing-images',
  'landing-images',
  true,
  15728640, -- Límite de 15MB por archivo
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

DROP POLICY IF EXISTS "Subida de imagenes landing-images" ON storage.objects;
CREATE POLICY "Subida de imagenes landing-images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'landing-images');

DROP POLICY IF EXISTS "Actualizacion imagenes landing-images" ON storage.objects;
CREATE POLICY "Actualizacion imagenes landing-images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'landing-images');

DROP POLICY IF EXISTS "Eliminacion imagenes landing-images" ON storage.objects;
CREATE POLICY "Eliminacion imagenes landing-images"
ON storage.objects FOR DELETE
USING (bucket_id = 'landing-images');
`;

export default function AdminLandingPage({
  config,
  onSaveConfig,
  onNavigateToLanding,
  onNavigateToPortal,
  isOfflineMode = false
}: AdminLandingPageProps) {
  const [formData, setFormData] = useState<LandingConfig>(() => ({
    ...DEFAULT_LANDING_CONFIG,
    ...config,
    styles: {
      ...DEFAULT_LANDING_CONFIG.styles,
      ...(config?.styles || {})
    }
  }));

  const [activeTab, setActiveTab] = useState<
    'general' | 'hero' | 'benefits' | 'process' | 'whatsapp' | 'stats' | 'faqs' | 'styles' | 'sql'
  >('hero');

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Helper to handle general text changes
  const handleChange = (field: keyof LandingConfig, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Helper to handle nested styles changes
  const handleStyleChange = (field: keyof LandingConfig['styles'], value: any) => {
    setFormData(prev => ({
      ...prev,
      styles: {
        ...prev.styles,
        [field]: value
      }
    }));
  };

  // Save changes
  const handleSave = async () => {
    setSaving(true);
    setStatusMessage(null);
    try {
      const success = await onSaveConfig(formData);
      setSaveSuccess(true);
      setStatusMessage('¡Cambios guardados con éxito en la Landing Page!');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setStatusMessage('Error al guardar: ' + (err.message || 'Error desconocido'));
    } finally {
      setSaving(false);
    }
  };

  // Reset to default
  const handleResetToDefault = () => {
    if (window.confirm('¿Seguro que deseas restablecer todos los textos, imágenes y colores al contenido oficial de Solux Green?')) {
      setFormData(DEFAULT_LANDING_CONFIG);
      setStatusMessage('Contenido restablecido al valor inicial oficial.');
    }
  };

  // Image uploader wrapper for any target field or slide
  const handleFileUpload = async (
    file: File, 
    callback: (uploadedUrl: string) => void,
    trackingKey: string
  ) => {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      alert('⚠️ La imagen no debe superar los 15 MB.');
      return;
    }
    setUploadingImage(trackingKey);
    setStatusMessage('Subiendo imagen a Supabase Storage...');
    
    try {
      const res = await uploadLandingImageToSupabase(file);
      if (res.url) {
        callback(res.url);
        if (res.error) {
          setStatusMessage(res.error);
        } else {
          setStatusMessage('✅ Fotografía subida exitosamente a Supabase Storage.');
        }
      } else {
        alert('Error al procesar la imagen: ' + (res.error || 'Error desconocido'));
      }
    } catch (err: any) {
      alert('Error al subir: ' + err.message);
    } finally {
      setUploadingImage(null);
    }
  };

  // Slide management
  const handleAddSlide = () => {
    const newSlide: LandingSlide = {
      id: `slide_${Date.now()}`,
      imageUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1920&q=80',
      badge: 'Solux Green • Alta Eficiencia',
      title: 'Nueva Instalación Solar',
      subtitle: 'Tecnología limpia y ahorro bimestral inmediato en tu recibo CFE.',
      ctaText: '👉 Solicitar Cotización',
      alt: 'Fotografía de panel solar'
    };
    setFormData(prev => ({
      ...prev,
      heroSlides: [...prev.heroSlides, newSlide]
    }));
  };

  const handleUpdateSlide = (index: number, updatedFields: Partial<LandingSlide>) => {
    setFormData(prev => {
      const newSlides = [...prev.heroSlides];
      newSlides[index] = { ...newSlides[index], ...updatedFields };
      return { ...prev, heroSlides: newSlides };
    });
  };

  const handleDeleteSlide = (index: number) => {
    if (formData.heroSlides.length <= 1) {
      alert('Debe existir al menos una imagen en el slider hero.');
      return;
    }
    setFormData(prev => ({
      ...prev,
      heroSlides: prev.heroSlides.filter((_, i) => i !== index)
    }));
  };

  // Benefit management
  const handleAddBenefit = () => {
    const newBenefit: LandingBenefit = {
      id: `benefit_${Date.now()}`,
      title: 'Nuevo Beneficio Clave',
      description: 'Describe el beneficio de ahorro o valor para el cliente.',
      imageUrl: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=800&q=80'
    };
    setFormData(prev => ({
      ...prev,
      benefits: [...prev.benefits, newBenefit]
    }));
  };

  const handleUpdateBenefit = (index: number, updatedFields: Partial<LandingBenefit>) => {
    setFormData(prev => {
      const newBenefits = [...prev.benefits];
      newBenefits[index] = { ...newBenefits[index], ...updatedFields };
      return { ...prev, benefits: newBenefits };
    });
  };

  const handleDeleteBenefit = (index: number) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index)
    }));
  };

  // Step management
  const handleUpdateStep = (index: number, updatedFields: Partial<LandingStep>) => {
    setFormData(prev => {
      const newSteps = [...prev.steps];
      newSteps[index] = { ...newSteps[index], ...updatedFields };
      return { ...prev, steps: newSteps };
    });
  };

  // FAQ management
  const handleAddFaq = () => {
    const newFaq: LandingFAQ = {
      id: `faq_${Date.now()}`,
      question: '¿Pregunta frecuente sobre el sistema solar?',
      answer: 'Respuesta clara y técnica para el prospecto.'
    };
    setFormData(prev => ({
      ...prev,
      faqs: [...prev.faqs, newFaq]
    }));
  };

  const handleUpdateFaq = (index: number, updatedFields: Partial<LandingFAQ>) => {
    setFormData(prev => {
      const newFaqs = [...prev.faqs];
      newFaqs[index] = { ...newFaqs[index], ...updatedFields };
      return { ...prev, faqs: newFaqs };
    });
  };

  const handleDeleteFaq = (index: number) => {
    setFormData(prev => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index)
    }));
  };

  // Copy SQL
  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_LANDING_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans" id="admin-landing-root">
      
      {/* ========================================================================= */}
      {/* TOP HEADER: ADMIN ACTIONS & DIRECT PREVIEW                                */}
      {/* ========================================================================= */}
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-50 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateToPortal}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700 flex items-center gap-1.5 text-xs font-bold"
            title="Volver al Portal Multi-Rol"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Menú Multi-Rol</span>
          </button>

          <div className="h-6 w-px bg-slate-800 hidden sm:block" />

          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h1 className="text-sm sm:text-base font-black uppercase tracking-tight text-white flex items-center gap-2">
                <span>Panel de Administración: Landing Page</span>
              </h1>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider hidden sm:block">
              Edición en tiempo real • Subida de fotos a Supabase • Control Total de Contenido
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* SQL Guide Button */}
          <button
            onClick={() => setShowSqlModal(true)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Ver Script SQL para Supabase (Tablas y Storage)"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden md:inline">SQL Supabase</span>
          </button>

          {/* Reset button */}
          <button
            onClick={handleResetToDefault}
            className="px-2.5 sm:px-3 py-2 bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-900/50 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
            title="Restablecer contenido por defecto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Restablecer</span>
          </button>

          {/* Live Preview Button */}
          <button
            onClick={onNavigateToLanding}
            className="px-3 sm:px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Ver Landing</span>
          </button>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all cursor-pointer ${
              saveSuccess 
                ? 'bg-emerald-500 text-white' 
                : 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95'
            }`}
          >
            {saving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : saveSuccess ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{saving ? 'Guardando...' : saveSuccess ? '¡Guardado!' : 'Guardar'}</span>
          </button>
        </div>
      </header>

      {/* Status banner if message present */}
      {statusMessage && (
        <div className="bg-emerald-950/80 border-b border-emerald-500/30 text-emerald-200 px-4 py-2 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button 
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-white text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TABS NAVIGATION                                                           */}
      {/* ========================================================================= */}
      <div className="bg-slate-950/60 border-b border-slate-800 px-4 sm:px-6 py-2 overflow-x-auto scrollbar-thin">
        <div className="flex items-center gap-1 min-w-max">
          {[
            { id: 'hero', label: '1. Hero & Slider', icon: Sliders },
            { id: 'general', label: '2. Identidad & Contacto', icon: Phone },
            { id: 'benefits', label: '3. Beneficios & Fotos', icon: Sparkles },
            { id: 'process', label: '4. Pasos del Proceso', icon: Layers },
            { id: 'whatsapp', label: '5. Tarjeta WhatsApp', icon: MessageSquare },
            { id: 'stats', label: '6. Social Proof / Estadísticas', icon: Layout },
            { id: 'faqs', label: '7. Preguntas Frecuentes', icon: HelpCircle },
            { id: 'styles', label: '8. Colores, Fuentes & Justificación', icon: Palette },
            { id: 'sql', label: '9. Guía SQL Supabase', icon: Database },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wide flex items-center gap-2 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MAIN ADMIN CONTENT AREA                                                   */}
      {/* ========================================================================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">

        {/* --------------------------------------------------------------------- */}
        {/* TAB 1: HERO & SLIDER DE IMÁGENES                                      */}
        {/* --------------------------------------------------------------------- */}
        {activeTab === 'hero' && (
          <div className="space-y-6">
            <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-700 pb-4">
                <div>
                  <h2 className="text-lg font-black uppercase text-white flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-emerald-400" />
                    <span>Sección Hero: Titular, Subtítulo y Botón Principal</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Modifica los textos principales que aparecen sobre el banner de inicio.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                    Badge / Etiqueta Superior
                  </label>
                  <input
                    type="text"
                    value={formData.heroBadge}
                    onChange={(e) => handleChange('heroBadge', e.target.value)}
                    placeholder="Ej. Ahorra hasta un 98% en tu recibo de CFE"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                    Texto de Confianza (Bajo el botón)
                  </label>
                  <input
                    type="text"
                    value={formData.heroTrustText}
                    onChange={(e) => handleChange('heroTrustText', e.target.value)}
                    placeholder="Ej. Asesoría técnica sin costo • Respuesta en menos de 15 minutos"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                    Titular Principal (H1)
                  </label>
                  <input
                    type="text"
                    value={formData.heroTitle}
                    onChange={(e) => handleChange('heroTitle', e.target.value)}
                    placeholder="Transforma la luz del sol en ahorro real para tu hogar o negocio"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-base font-black text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                    Subtítulo Descriptivo
                  </label>
                  <textarea
                    rows={2}
                    value={formData.heroSubtitle}
                    onChange={(e) => handleChange('heroSubtitle', e.target.value)}
                    placeholder="Diseñamos e instalamos sistemas de paneles solares..."
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-medium text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                    Texto del Botón Principal
                  </label>
                  <input
                    type="text"
                    value={formData.heroCtaText}
                    onChange={(e) => handleChange('heroCtaText', e.target.value)}
                    placeholder="👉 Solicitar Cotización Gratis por WhatsApp"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                    Enlace de Acción (WhatsApp / URL)
                  </label>
                  <input
                    type="text"
                    value={formData.heroCtaLink}
                    onChange={(e) => handleChange('heroCtaLink', e.target.value)}
                    placeholder="https://wa.me/5212293233633?text=..."
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* CONTROL INDEPENDIENTE DE BOTONES DE LAS 3 IMÁGENES DEL SLIDER */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-emerald-500/40 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
              <div className="border-b border-slate-700/80 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider mb-1.5 border border-emerald-500/30">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Control Total e Independiente</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black uppercase text-white flex items-center gap-2">
                    <span>Botones de las 3 Imágenes del Slider Hero</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Configura el texto, enlace de destino y colores de cada uno de los botones de forma 100% independiente.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {[0, 1, 2].map((slideIndex) => {
                  const s = formData.heroSlides[slideIndex] || {
                    id: `slide_${slideIndex + 1}`,
                    imageUrl: '',
                    title: `Diapositiva #${slideIndex + 1}`,
                    ctaText: slideIndex === 2 ? '🚀 Quiero ser Asesor de Enlace' : slideIndex === 1 ? '📲 Cotizar para mi Negocio' : '👉 Solicitar Cotización Gratis',
                    ctaLink: slideIndex === 2 ? 'https://wa.me/5212293233633?text=Hola%20Solux%20Green,%20quiero%20ser%20Asesor%20de%20Enlace%20y%20solicito%20informes' : '#contacto',
                    ctaBgColor: slideIndex === 2 ? '#e11d48' : slideIndex === 1 ? '#0284c7' : '#059669',
                    ctaTextColor: '#ffffff'
                  };

                  return (
                    <div 
                      key={`btn_ctrl_${slideIndex}`}
                      className="bg-slate-950/80 border border-slate-700 rounded-2xl p-4 sm:p-5 space-y-3.5 relative flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-mono font-bold">
                              {slideIndex + 1}
                            </span>
                            <span>Botón Imagen #{slideIndex + 1}</span>
                          </span>

                          <span className="text-[9px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                            {slideIndex === 2 ? 'Tercera Imagen' : slideIndex === 1 ? 'Segunda Imagen' : 'Primera Imagen'}
                          </span>
                        </div>

                        {/* Texto del Botón */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold uppercase text-slate-300 tracking-wider block">
                            Texto del Botón *
                          </label>
                          <input
                            type="text"
                            value={s.ctaText || ''}
                            onChange={(e) => handleUpdateSlide(slideIndex, { ctaText: e.target.value })}
                            placeholder={slideIndex === 2 ? '🚀 Quiero ser Asesor de Enlace' : 'Texto del botón...'}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-black text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        {/* Enlace o Destino del Botón */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold uppercase text-slate-300 tracking-wider block">
                            Enlace o Destino (Acción)
                          </label>
                          <input
                            type="text"
                            value={s.ctaLink || ''}
                            onChange={(e) => handleUpdateSlide(slideIndex, { ctaLink: e.target.value })}
                            placeholder="#contacto o URL"
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                          />

                          {/* Botones de Selección Rápida de Enlace */}
                          <div className="flex flex-wrap gap-1 pt-1">
                            {[
                              { label: 'WhatsApp Asesor Enlace', url: 'https://wa.me/5212293233633?text=Hola%20Solux%20Green,%20quiero%20ser%20Asesor%20de%20Enlace%20y%20solicito%20informes' },
                              { label: '#contacto (Formulario)', url: '#contacto' },
                              { label: 'WhatsApp Cotizar Negocio', url: 'https://wa.me/5212293233633?text=Hola%20Solux%20Green,%20quiero%20cotizar%20para%20mi%20empresa' },
                              { label: 'WhatsApp Cotizar Hogar', url: 'https://wa.me/5212293233633?text=Hola%20Solux%20Green,%20quiero%20cotizar%20un%20sistema%20de%20paneles%20solares' },
                              { label: '#soluciones', url: '#soluciones' },
                              { label: '#beneficios', url: '#beneficios' }
                            ].map(preset => (
                              <button
                                key={preset.url}
                                type="button"
                                onClick={() => handleUpdateSlide(slideIndex, { ctaLink: preset.url })}
                                className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded cursor-pointer transition-all border ${
                                  s.ctaLink === preset.url
                                    ? 'bg-emerald-600 text-white border-emerald-500'
                                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                                }`}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Color de Fondo y de Texto */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div className="space-y-1">
                            <label className="text-[9px] font-extrabold uppercase text-slate-400 block">Color Fondo</label>
                            <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-700">
                              <input
                                type="color"
                                value={s.ctaBgColor || '#059669'}
                                onChange={(e) => handleUpdateSlide(slideIndex, { ctaBgColor: e.target.value })}
                                className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent"
                              />
                              <span className="text-[10px] font-mono text-slate-300 font-bold">{s.ctaBgColor || '#059669'}</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-extrabold uppercase text-slate-400 block">Color Texto</label>
                            <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-700">
                              <input
                                type="color"
                                value={s.ctaTextColor || '#ffffff'}
                                onChange={(e) => handleUpdateSlide(slideIndex, { ctaTextColor: e.target.value })}
                                className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent"
                              />
                              <span className="text-[10px] font-mono text-slate-300 font-bold">{s.ctaTextColor || '#ffffff'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Live Button Preview Box */}
                      <div className="pt-2 border-t border-slate-800 text-center space-y-1">
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">Vista Previa del Botón:</span>
                        <div
                          style={{
                            backgroundColor: s.ctaBgColor || '#059669',
                            color: s.ctaTextColor || '#ffffff'
                          }}
                          className="py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider shadow truncate"
                        >
                          {s.ctaText || 'Botón sin texto'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SLIDER IMAGES MANAGER */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-700 pb-4">
                <div>
                  <h3 className="text-base font-black uppercase text-white flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-emerald-400" />
                    <span>Fotografías del Slider Hero (Subida a Supabase)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Sube fotos de alta resolución tomadas en México. Las imágenes se almacenan en Supabase Storage.
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.sliderAutoPlay}
                      onChange={(e) => handleChange('sliderAutoPlay', e.target.checked)}
                      className="rounded accent-emerald-500 cursor-pointer"
                    />
                    <span>Auto-reproducir Slider</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleAddSlide}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Foto al Slider</span>
                  </button>
                </div>
              </div>

              {/* Slider list */}
              <div className="space-y-6">
                {formData.heroSlides.map((slide, index) => (
                  <div 
                    key={slide.id || index}
                    className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 sm:p-6 space-y-4 relative"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4" />
                        <span>Diapositiva #{index + 1}</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => handleDeleteSlide(index)}
                        className="text-slate-400 hover:text-rose-400 p-1 rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1 font-bold"
                        title="Eliminar diapositiva"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Eliminar</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                      {/* Image Preview & Upload Button */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-300 uppercase block">
                          Fotografía en Supabase
                        </label>
                        <div className="h-40 w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 relative group">
                          <img 
                            src={slide.imageUrl} 
                            alt={slide.alt || "Diapositiva"} 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                            <label className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer shadow-md flex items-center gap-1.5">
                              <Upload className="w-3.5 h-3.5" />
                              <span>Cambiar Foto</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleFileUpload(
                                      file,
                                      (url) => handleUpdateSlide(index, { imageUrl: url }),
                                      `slide_${index}`
                                    );
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>

                        {/* Direct File Selector input */}
                        <div className="pt-1">
                          <label className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-emerald-500/50 rounded-xl text-xs font-bold text-slate-300 flex items-center justify-center gap-2 cursor-pointer transition-all">
                            {uploadingImage === `slide_${index}` ? (
                              <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                            ) : (
                              <Upload className="w-4 h-4 text-emerald-400" />
                            )}
                            <span>{uploadingImage === `slide_${index}` ? 'Subiendo a Supabase...' : 'Subir Imagen desde tu Equipo'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleFileUpload(
                                    file,
                                    (url) => handleUpdateSlide(index, { imageUrl: url }),
                                    `slide_${index}`
                                  );
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      {/* Slide Texts Customization */}
                      <div className="lg:col-span-2 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-400 uppercase">
                              Badge Específico
                            </label>
                            <input
                              type="text"
                              value={slide.badge || ''}
                              onChange={(e) => handleUpdateSlide(index, { badge: e.target.value })}
                              placeholder="Ej. Ahorro hasta 98%"
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-400 uppercase">
                              Texto de Botón CTA
                            </label>
                            <input
                              type="text"
                              value={slide.ctaText || ''}
                              onChange={(e) => handleUpdateSlide(index, { ctaText: e.target.value })}
                              placeholder={index === 2 ? '🚀 Quiero ser Asesor de Enlace' : 'Ej. 👉 Solicitar Cotización'}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-400 uppercase">
                              Enlace / Destino CTA
                            </label>
                            <input
                              type="text"
                              value={slide.ctaLink || ''}
                              onChange={(e) => handleUpdateSlide(index, { ctaLink: e.target.value })}
                              placeholder="#contacto o URL"
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-400 uppercase">
                              Color del Botón
                            </label>
                            <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                              <input
                                type="color"
                                value={slide.ctaBgColor || '#059669'}
                                onChange={(e) => handleUpdateSlide(index, { ctaBgColor: e.target.value })}
                                className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent"
                              />
                              <span className="text-[10px] font-mono text-slate-300 font-bold">{slide.ctaBgColor || '#059669'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-400 uppercase">
                            Título de la Diapositiva
                          </label>
                          <input
                            type="text"
                            value={slide.title || ''}
                            onChange={(e) => handleUpdateSlide(index, { title: e.target.value })}
                            placeholder="Título representativo..."
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-400 uppercase">
                            Subtítulo
                          </label>
                          <input
                            type="text"
                            value={slide.subtitle || ''}
                            onChange={(e) => handleUpdateSlide(index, { subtitle: e.target.value })}
                            placeholder="Subtítulo o descripción..."
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium text-slate-300 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* TAB 2: IDENTIDAD, MARCA Y CONTACTO                                    */}
        {/* --------------------------------------------------------------------- */}
        {activeTab === 'general' && (
          <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="border-b border-slate-700 pb-4">
              <h2 className="text-lg font-black uppercase text-white flex items-center gap-2">
                <Phone className="w-5 h-5 text-emerald-400" />
                <span>Datos de Contacto, Marca y Enlaces de WhatsApp</span>
              </h2>
              <p className="text-xs text-slate-400">
                Ajusta los números a los que llegarán los prospectos y cotizaciones de la Landing Page.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Nombre de la Marca
                </label>
                <input
                  type="text"
                  value={formData.brandName}
                  onChange={(e) => handleChange('brandName', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Teléfono / WhatsApp Directo (10 dígitos en México)
                </label>
                <input
                  type="text"
                  value={formData.contactWhatsapp}
                  onChange={(e) => handleChange('contactWhatsapp', e.target.value)}
                  placeholder="2293233633"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Teléfono Visible en Encabezado y Pie de Página
                </label>
                <input
                  type="text"
                  value={formData.contactPhone}
                  onChange={(e) => handleChange('contactPhone', e.target.value)}
                  placeholder="229 323 3633"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Correo Electrónico Oficial
                </label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => handleChange('contactEmail', e.target.value)}
                  placeholder="contacto@soluxgreen.com.mx"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Dirección Física de Oficinas o Matriz
                </label>
                <input
                  type="text"
                  value={formData.contactAddress}
                  onChange={(e) => handleChange('contactAddress', e.target.value)}
                  placeholder="Av. Paseo de la Reforma 222, Cuauhtémoc, CDMX, México"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-medium text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Mensaje Predeterminado de WhatsApp al iniciar chat
                </label>
                <textarea
                  rows={2}
                  value={formData.defaultWhatsappMessage}
                  onChange={(e) => handleChange('defaultWhatsappMessage', e.target.value)}
                  placeholder="Hola Solux Green, quiero cotizar un sistema de paneles solares"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-medium text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* TAB 3: BENEFICIOS & FOTOGRAFÍAS                                       */}
        {/* --------------------------------------------------------------------- */}
        {activeTab === 'benefits' && (
          <div className="space-y-6">
            <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-700 pb-4">
                <div>
                  <h2 className="text-lg font-black uppercase text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                    <span>Sección de Beneficios Clave</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Personaliza los beneficios, títulos y fotografías de cada tarjeta. Sube tus fotos a Supabase.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddBenefit}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Beneficio</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                    Título de la Sección
                  </label>
                  <input
                    type="text"
                    value={formData.benefitsTitle}
                    onChange={(e) => handleChange('benefitsTitle', e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                    Subtítulo de la Sección
                  </label>
                  <input
                    type="text"
                    value={formData.benefitsSubtitle}
                    onChange={(e) => handleChange('benefitsSubtitle', e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-medium text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Benefits Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                {formData.benefits.map((benefit, idx) => (
                  <div 
                    key={benefit.id || idx}
                    className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 space-y-4 relative"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-black uppercase text-emerald-400">
                        Beneficio #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteBenefit(idx)}
                        className="text-slate-400 hover:text-rose-400 p-1 rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1 font-bold"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-400 uppercase">
                          Título del Beneficio
                        </label>
                        <input
                          type="text"
                          value={benefit.title}
                          onChange={(e) => handleUpdateBenefit(idx, { title: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-400 uppercase">
                          Descripción
                        </label>
                        <textarea
                          rows={2}
                          value={benefit.description}
                          onChange={(e) => handleUpdateBenefit(idx, { description: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      {/* Image & Supabase Uploader */}
                      <div className="space-y-2 pt-1">
                        <label className="text-[11px] font-bold text-slate-400 uppercase block">
                          Fotografía del Beneficio
                        </label>
                        <div className="flex items-center gap-3">
                          {benefit.imageUrl && (
                            <img 
                              src={benefit.imageUrl} 
                              alt={benefit.title} 
                              className="h-16 w-24 object-cover rounded-lg border border-slate-800 shrink-0"
                            />
                          )}
                          <label className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-emerald-500/50 rounded-xl text-xs font-bold text-slate-300 flex items-center justify-center gap-2 cursor-pointer transition-all">
                            {uploadingImage === `benefit_${idx}` ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                            ) : (
                              <Upload className="w-3.5 h-3.5 text-emerald-400" />
                            )}
                            <span>{uploadingImage === `benefit_${idx}` ? 'Subiendo a Supabase...' : 'Subir Foto a Supabase'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleFileUpload(
                                    file,
                                    (url) => handleUpdateBenefit(idx, { imageUrl: url }),
                                    `benefit_${idx}`
                                  );
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* TAB 4: PASOS DEL PROCESO EN 4 PASOS                                   */}
        {/* --------------------------------------------------------------------- */}
        {activeTab === 'process' && (
          <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="border-b border-slate-700 pb-4">
              <h2 className="text-lg font-black uppercase text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                <span>Nuestro Proceso en 4 Pasos Simples</span>
              </h2>
              <p className="text-xs text-slate-400">
                Edita los pasos que guían al cliente desde el envío de su recibo hasta la interconexión con CFE.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Título de la Sección
                </label>
                <input
                  type="text"
                  value={formData.processTitle}
                  onChange={(e) => handleChange('processTitle', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Subtítulo
                </label>
                <input
                  type="text"
                  value={formData.processSubtitle}
                  onChange={(e) => handleChange('processSubtitle', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-medium text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {formData.steps.map((step, idx) => (
                <div 
                  key={step.id || idx}
                  className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-sm font-black font-mono text-emerald-400">
                      Paso #{step.stepNumber || idx + 1}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">
                      Título del Paso
                    </label>
                    <input
                      type="text"
                      value={step.title}
                      onChange={(e) => handleUpdateStep(idx, { title: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">
                      Descripción
                    </label>
                    <textarea
                      rows={2}
                      value={step.description}
                      onChange={(e) => handleUpdateStep(idx, { description: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* TAB 5: TARJETA DE INTERACCIÓN WHATSAPP                                */}
        {/* --------------------------------------------------------------------- */}
        {activeTab === 'whatsapp' && (
          <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="border-b border-slate-700 pb-4">
              <h2 className="text-lg font-black uppercase text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-400" />
                <span>Sección de Interacción Directa (WhatsApp Card)</span>
              </h2>
              <p className="text-xs text-slate-400">
                La tarjeta central donde se invita al prospecto a mandar la foto de su recibo CFE.
              </p>
            </div>

            <div className="space-y-4 max-w-3xl">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Encabezado Principal de la Tarjeta
                </label>
                <input
                  type="text"
                  value={formData.whatsappCardTitle}
                  onChange={(e) => handleChange('whatsappCardTitle', e.target.value)}
                  placeholder="¿Cuánto puedes ahorrar con tu techo? Descúbrelo hoy"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-base font-black text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Descripción
                </label>
                <textarea
                  rows={3}
                  value={formData.whatsappCardDescription}
                  onChange={(e) => handleChange('whatsappCardDescription', e.target.value)}
                  placeholder="Tómale una foto a tu recibo de luz más reciente y envíanosla. Haremos una simulación sin ningún compromiso."
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-medium text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Texto del Botón Destacado Grande
                </label>
                <input
                  type="text"
                  value={formData.whatsappCardBtnText}
                  onChange={(e) => handleChange('whatsappCardBtnText', e.target.value)}
                  placeholder="📲 Enviar mi recibo por WhatsApp"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-black text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* TAB 6: SOCIAL PROOF / ESTADÍSTICAS                                   */}
        {/* --------------------------------------------------------------------- */}
        {activeTab === 'stats' && (
          <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="border-b border-slate-700 pb-4">
              <h2 className="text-lg font-black uppercase text-white flex items-center gap-2">
                <Layout className="w-5 h-5 text-emerald-400" />
                <span>Barra de Estadísticas y Confianza (Social Proof)</span>
              </h2>
              <p className="text-xs text-slate-400">
                Edita los indicadores numéricos mostrados (+98%, 25 Años, etc.).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {formData.stats.map((stat, idx) => (
                <div 
                  key={stat.id || idx}
                  className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 space-y-3"
                >
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">
                      Valor Numérico Destacado
                    </label>
                    <input
                      type="text"
                      value={stat.value}
                      onChange={(e) => {
                        const newStats = [...formData.stats];
                        newStats[idx] = { ...newStats[idx], value: e.target.value };
                        setFormData(prev => ({ ...prev, stats: newStats }));
                      }}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm font-black font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">
                      Etiqueta
                    </label>
                    <input
                      type="text"
                      value={stat.label}
                      onChange={(e) => {
                        const newStats = [...formData.stats];
                        newStats[idx] = { ...newStats[idx], label: e.target.value };
                        setFormData(prev => ({ ...prev, stats: newStats }));
                      }}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">
                      Subtexto / Detalle
                    </label>
                    <input
                      type="text"
                      value={stat.description || ''}
                      onChange={(e) => {
                        const newStats = [...formData.stats];
                        newStats[idx] = { ...newStats[idx], description: e.target.value };
                        setFormData(prev => ({ ...prev, stats: newStats }));
                      }}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium text-slate-300 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* TAB 7: PREGUNTAS FRECUENTES (FAQ)                                    */}
        {/* --------------------------------------------------------------------- */}
        {activeTab === 'faqs' && (
          <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-700 pb-4">
              <div>
                <h2 className="text-lg font-black uppercase text-white flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-emerald-400" />
                  <span>Preguntas Frecuentes (FAQ)</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Agrega, edita o elimina las preguntas más comunes de tus clientes.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddFaq}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Pregunta</span>
              </button>
            </div>

            <div className="space-y-4">
              {formData.faqs.map((faq, idx) => (
                <div 
                  key={faq.id || idx}
                  className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-black uppercase text-emerald-400">
                      Pregunta #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteFaq(idx)}
                      className="text-slate-400 hover:text-rose-400 p-1 rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1 font-bold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar</span>
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">
                      Pregunta
                    </label>
                    <input
                      type="text"
                      value={faq.question}
                      onChange={(e) => handleUpdateFaq(idx, { question: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">
                      Respuesta Detallada
                    </label>
                    <textarea
                      rows={2}
                      value={faq.answer}
                      onChange={(e) => handleUpdateFaq(idx, { answer: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* TAB 8: ESTILOS, COLORES, FUENTES & JUSTIFICACIÓN                      */}
        {/* --------------------------------------------------------------------- */}
        {activeTab === 'styles' && (
          <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 sm:p-8 space-y-8 shadow-xl">
            <div className="border-b border-slate-700 pb-4">
              <h2 className="text-lg font-black uppercase text-white flex items-center gap-2">
                <Palette className="w-5 h-5 text-emerald-400" />
                <span>Diseño Visual: Tipografía, Alineación de Textos y Paleta de Colores</span>
              </h2>
              <p className="text-xs text-slate-400">
                Cambia el estilo de letra, alineación/justificación y los colores de botones y fondos de cada sección.
              </p>
            </div>

            {/* Typography & Justification */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Font Family */}
              <div className="bg-slate-900/90 border border-slate-700 rounded-2xl p-5 space-y-3">
                <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Type className="w-4 h-4 text-emerald-400" />
                  <span>Estilo de Letra / Tipografía General</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'sans', label: 'Sans Moderno', desc: 'Limpio y legible' },
                    { id: 'inter', label: 'Inter Pro', desc: 'Alta claridad' },
                    { id: 'poppins', label: 'Poppins Estilo', desc: 'Geométrico moderno' },
                    { id: 'serif', label: 'Serif Elegante', desc: 'Institucional' },
                    { id: 'mono', label: 'Mono Tech', desc: 'Industrial e ingeniería' },
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => handleStyleChange('fontFamily', f.id as any)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        formData.styles.fontFamily === f.id
                          ? 'bg-emerald-600/30 border-emerald-500 text-white font-extrabold'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold">{f.label}</div>
                      <div className="text-[10px] text-slate-400">{f.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Justification / Alignment */}
              <div className="bg-slate-900/90 border border-slate-700 rounded-2xl p-5 space-y-3">
                <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Layout className="w-4 h-4 text-emerald-400" />
                  <span>Alineación / Justificación de Párrafos</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'left', label: 'Izquierda', desc: 'Alineación clásica' },
                    { id: 'center', label: 'Centrado', desc: 'Enfoque simétrico' },
                    { id: 'justify', label: 'Justificado', desc: 'Bloques perfectos' },
                  ].map(a => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => handleStyleChange('textAlign', a.id as any)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        formData.styles.textAlign === a.id
                          ? 'bg-emerald-600/30 border-emerald-500 text-white font-extrabold'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold">{a.label}</div>
                      <div className="text-[10px] text-slate-400">{a.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Button Colors */}
            <div className="bg-slate-900/90 border border-slate-700 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Palette className="w-4 h-4 text-emerald-400" />
                <span>Colores de Botones y Llamados a la Acción (CTA)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">
                    Color Botón Principal
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.styles.primaryBtnColor}
                      onChange={(e) => handleStyleChange('primaryBtnColor', e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={formData.styles.primaryBtnColor}
                      onChange={(e) => handleStyleChange('primaryBtnColor', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">
                    Color Botón WhatsApp Oficial
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.styles.whatsappBtnColor}
                      onChange={(e) => handleStyleChange('whatsappBtnColor', e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={formData.styles.whatsappBtnColor}
                      onChange={(e) => handleStyleChange('whatsappBtnColor', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">
                    Color Botón Secundario
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.styles.secondaryBtnColor}
                      onChange={(e) => handleStyleChange('secondaryBtnColor', e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={formData.styles.secondaryBtnColor}
                      onChange={(e) => handleStyleChange('secondaryBtnColor', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section Background Colors */}
            <div className="bg-slate-900/90 border border-slate-700 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Palette className="w-4 h-4 text-emerald-400" />
                <span>Colores de Fondo de las Secciones</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[
                  { field: 'heroBgColor', label: 'Fondo Hero' },
                  { field: 'statsBgColor', label: 'Fondo Estadísticas' },
                  { field: 'benefitsBgColor', label: 'Fondo Beneficios' },
                  { field: 'processBgColor', label: 'Fondo Proceso' },
                  { field: 'whatsappCardBgColor', label: 'Fondo Tarjeta WhatsApp' },
                  { field: 'faqBgColor', label: 'Fondo Preguntas FAQ' },
                  { field: 'footerBgColor', label: 'Fondo Pie de Página' },
                ].map(item => (
                  <div key={item.field} className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">
                      {item.label}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={(formData.styles as any)[item.field]}
                        onChange={(e) => handleStyleChange(item.field as any, e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={(formData.styles as any)[item.field]}
                        onChange={(e) => handleStyleChange(item.field as any, e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-[11px] font-mono text-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* TAB 9: GUÍA SQL PARA SUPABASE                                         */}
        {/* --------------------------------------------------------------------- */}
        {activeTab === 'sql' && (
          <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-700 pb-4">
              <div>
                <h2 className="text-lg font-black uppercase text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-400" />
                  <span>Script SQL para Supabase (Tabla y Storage)</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Ejecuta este script en el editor SQL de tu panel de Supabase para activar la persistencia y el bucket de imágenes.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopySql}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-all"
              >
                {copiedSql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedSql ? '¡Copiado al Portapapeles!' : 'Copiar Código SQL'}</span>
              </button>
            </div>

            <div className="relative">
              <pre className="p-4 sm:p-6 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-mono text-emerald-400 overflow-x-auto max-h-[500px] leading-relaxed selection:bg-emerald-500 selection:text-white">
                {SUPABASE_LANDING_SQL}
              </pre>
            </div>

            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 text-xs text-emerald-300 space-y-2">
              <div className="font-black uppercase flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Instrucciones de Aplicación:</span>
              </div>
              <ol className="list-decimal pl-5 space-y-1 font-medium text-slate-300">
                <li>Ve a tu consola de Supabase en <strong className="text-white">supabase.com/dashboard</strong>.</li>
                <li>Selecciona tu proyecto Solux Green.</li>
                <li>Entra al <strong className="text-white">SQL Editor</strong> en el menú lateral izquierdo.</li>
                <li>Pega el código SQL anterior y presiona el botón <strong className="text-emerald-400">Run</strong>.</li>
                <li>¡Listo! Tu tabla <code className="text-emerald-300">landing_config</code> y tu bucket <code className="text-emerald-300">landing-images</code> quedarán 100% operativos.</li>
              </ol>
            </div>
          </div>
        )}

      </main>

      {/* ========================================================================= */}
      {/* SQL MODAL POPUP (QUICK ACCESS ANYWHERE)                                    */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showSqlModal && (
          <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-3xl w-full max-h-[90vh] flex flex-col space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-black uppercase text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-400" />
                  <span>Script SQL para Supabase</span>
                </h3>
                <button
                  onClick={() => setShowSqlModal(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto">
                  {SUPABASE_LANDING_SQL}
                </pre>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <button
                  onClick={handleCopySql}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all"
                >
                  {copiedSql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedSql ? '¡Copiado!' : 'Copiar SQL'}</span>
                </button>

                <button
                  onClick={() => setShowSqlModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold uppercase cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
