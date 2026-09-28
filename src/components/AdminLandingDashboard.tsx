import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Save, Eye, RotateCcw, Plus, Trash2, Image as ImageIcon, 
  Upload, Check, AlertCircle, Sparkles, Sliders, Type, 
  Palette, Phone, Mail, MapPin, ExternalLink, HelpCircle, 
  Layers, Sun, MessageCircle, ArrowRight, Database, 
  Copy, CheckCheck, RefreshCw, X, ArrowUp, ArrowDown,
  AlignLeft, AlignCenter, AlignRight, AlignJustify
} from 'lucide-react';
import { LandingConfig, LandingSlide, LandingBenefit, LandingSolution, LandingGalleryItem, LandingFAQ, LandingContactPhone, LandingContactEmail } from '../types';
import { DEFAULT_LANDING_CONFIG } from '../landingDefaultData';
import { uploadLandingImageToSupabase, upsertLandingConfig } from '../supabaseService';

interface AdminLandingDashboardProps {
  config: LandingConfig;
  onUpdateConfig: (newConfig: LandingConfig) => void;
  onPreviewLanding: () => void;
  onExit?: () => void;
}

export default function AdminLandingDashboard({
  config,
  onUpdateConfig,
  onPreviewLanding,
  onExit
}: AdminLandingDashboardProps) {
  // Local working copy of the configuration
  const [localConfig, setLocalConfig] = useState<LandingConfig>(() => ({
    ...DEFAULT_LANDING_CONFIG,
    ...config,
    styles: {
      ...DEFAULT_LANDING_CONFIG.styles,
      ...(config?.styles || {})
    },
    heroSlides: config?.heroSlides && config.heroSlides.length > 0 ? config.heroSlides : DEFAULT_LANDING_CONFIG.heroSlides,
    contactPhones: config?.contactPhones && config.contactPhones.length > 0 ? config.contactPhones : DEFAULT_LANDING_CONFIG.contactPhones,
    contactEmails: config?.contactEmails && config.contactEmails.length > 0 ? config.contactEmails : DEFAULT_LANDING_CONFIG.contactEmails,
    solutions: config?.solutions && config.solutions.length > 0 ? config.solutions : DEFAULT_LANDING_CONFIG.solutions,
    gallery: config?.gallery && config.gallery.length > 0 ? config.gallery : DEFAULT_LANDING_CONFIG.gallery
  }));

  // Active editor tab
  const [activeTab, setActiveTab] = useState<'slider' | 'content' | 'styles' | 'contact' | 'sql'>('slider');

  // Saving states
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Uploading states
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  // SQL Copy status
  const [sqlCopied, setSqlCopied] = useState(false);

  // Handle local state updates
  const updateField = (field: keyof LandingConfig, value: any) => {
    setLocalConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateStyles = (styleField: string, value: any) => {
    setLocalConfig(prev => ({
      ...prev,
      styles: {
        ...prev.styles,
        [styleField]: value
      }
    }));
  };

  // ----------------- IMAGE UPLOAD HELPER (SUPABASE STORAGE) -----------------
  const handleFileUpload = async (file: File, onUploaded: (url: string) => void, targetId: string) => {
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('La imagen no debe exceder los 8MB para garantizar velocidad de carga.');
      return;
    }

    setUploadingTarget(targetId);
    setUploadNotice(null);

    try {
      const res = await uploadLandingImageToSupabase(file);
      if (res.url) {
        onUploaded(res.url);
        if (res.error) {
          setUploadNotice(res.error);
        } else {
          setUploadNotice('✅ Imagen subida exitosamente a Supabase Storage.');
        }
      } else {
        alert(res.error || 'No se pudo subir la imagen.');
      }
    } catch (err: any) {
      console.error('Upload exception:', err);
      alert('Error al subir imagen: ' + err.message);
    } finally {
      setUploadingTarget(null);
      setTimeout(() => setUploadNotice(null), 5000);
    }
  };

  // ----------------- SAVE ENTIRE CONFIG TO SUPABASE -----------------
  const handleSaveToCloud = async () => {
    setIsSaving(true);
    setSaveMessage('Guardando en Supabase...');
    try {
      const updatedData: LandingConfig = {
        ...localConfig,
        updatedAt: new Date().toISOString()
      };

      // 1. Save in parent state and localStorage
      onUpdateConfig(updatedData);

      // 2. Persist in Supabase table `landing_config`
      const ok = await upsertLandingConfig(updatedData);
      if (ok) {
        setSaveSuccess(true);
        setSaveMessage('¡Cambios guardados exitosamente en Supabase y disponibles en la Landing Page!');
      } else {
        setSaveSuccess(true);
        setSaveMessage('Guardado en caché local. (Para persistencia total en la nube, asegúrate de haber ejecutado el script SQL en Supabase)');
      }
    } catch (err: any) {
      console.error('Error saving config:', err);
      setSaveMessage('Error al guardar: ' + err.message);
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveSuccess(false), 4000);
    }
  };

  // ----------------- RESET TO DEFAULTS -----------------
  const handleResetDefaults = () => {
    if (window.confirm('¿Estás seguro de que deseas restablecer todos los textos, imágenes y colores de la landing page a los valores de fábrica de Solux Green?')) {
      setLocalConfig({ ...DEFAULT_LANDING_CONFIG });
      onUpdateConfig({ ...DEFAULT_LANDING_CONFIG });
      alert('Se han restablecido los valores por defecto.');
    }
  };

  // ----------------- SLIDER HELPERS -----------------
  const handleAddSlide = () => {
    const newSlide: LandingSlide = {
      id: `slide_${Date.now()}`,
      imageUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1920&q=80',
      badge: 'Nueva Promoción Solar',
      title: 'Ahorro Inteligente con Paneles Solares',
      subtitle: 'Instalaciones certificadas con financiamiento a tu medida en México.',
      ctaText: '👉 Solicitar Cotización',
      ctaLink: '#contacto',
      ctaBgColor: localConfig.styles.primaryBtnColor || '#059669',
      ctaTextColor: '#ffffff',
      textAlign: 'left'
    };
    updateField('heroSlides', [...(localConfig.heroSlides || []), newSlide]);
  };

  const handleUpdateSlide = (index: number, updatedFields: Partial<LandingSlide>) => {
    const newSlides = [...(localConfig.heroSlides || [])];
    newSlides[index] = { ...newSlides[index], ...updatedFields };
    updateField('heroSlides', newSlides);
  };

  const handleDeleteSlide = (index: number) => {
    if ((localConfig.heroSlides || []).length <= 1) {
      alert('El slider debe tener al menos una imagen principal.');
      return;
    }
    const newSlides = localConfig.heroSlides.filter((_, i) => i !== index);
    updateField('heroSlides', newSlides);
  };

  const handleMoveSlide = (index: number, direction: 'up' | 'down') => {
    const slides = [...(localConfig.heroSlides || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;
    const temp = slides[index];
    slides[index] = slides[targetIndex];
    slides[targetIndex] = temp;
    updateField('heroSlides', slides);
  };

  // ----------------- CONTACT PHONES & EMAILS HELPERS -----------------
  const handleAddPhone = () => {
    const newPhone: LandingContactPhone = {
      id: `phone_${Date.now()}`,
      label: 'Atención a Clientes',
      number: '55 1234 5678',
      isWhatsApp: true
    };
    updateField('contactPhones', [...(localConfig.contactPhones || []), newPhone]);
  };

  const handleUpdatePhone = (index: number, updated: Partial<LandingContactPhone>) => {
    const phones = [...(localConfig.contactPhones || [])];
    phones[index] = { ...phones[index], ...updated };
    updateField('contactPhones', phones);
  };

  const handleDeletePhone = (index: number) => {
    const phones = localConfig.contactPhones?.filter((_, i) => i !== index) || [];
    updateField('contactPhones', phones);
  };

  const handleAddEmail = () => {
    const newEmail: LandingContactEmail = {
      id: `email_${Date.now()}`,
      label: 'Ventas y Cotizaciones',
      email: 'contacto@soluxgreen.com.mx'
    };
    updateField('contactEmails', [...(localConfig.contactEmails || []), newEmail]);
  };

  const handleUpdateEmail = (index: number, updated: Partial<LandingContactEmail>) => {
    const emails = [...(localConfig.contactEmails || [])];
    emails[index] = { ...emails[index], ...updated };
    updateField('contactEmails', emails);
  };

  const handleDeleteEmail = (index: number) => {
    const emails = localConfig.contactEmails?.filter((_, i) => i !== index) || [];
    updateField('contactEmails', emails);
  };

  // ----------------- SQL SCRIPT FOR SUPABASE -----------------
  const supabaseSqlScript = `-- =====================================================================
-- TABLA Y STORAGE PARA LA LANDING PAGE DE SOLUX GREEN EN SUPABASE
-- =====================================================================
-- Ejecuta este script en el SQL Editor de tu proyecto en Supabase.
-- Habilita la persistencia en tiempo real y la subida de imágenes.

-- 1. Tabla de Configuración de la Landing Page
CREATE TABLE IF NOT EXISTS landing_config (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
    config JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Habilitar RLS
ALTER TABLE landing_config ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura y escritura pública para landing_config
DROP POLICY IF EXISTS "Permitir lectura publica landing_config" ON landing_config;
CREATE POLICY "Permitir lectura publica landing_config" 
    ON landing_config FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir escritura publica landing_config" ON landing_config;
CREATE POLICY "Permitir escritura publica landing_config" 
    ON landing_config FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON landing_config TO anon, authenticated, service_role;

-- 2. Crear Bucket de Supabase Storage para las Fotos ('landing-images')
INSERT INTO storage.buckets (id, name, public)
VALUES ('landing-images', 'landing-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Políticas de acceso para el bucket de imágenes
DROP POLICY IF EXISTS "Permitir lectura publica en landing-images" ON storage.objects;
CREATE POLICY "Permitir lectura publica en landing-images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'landing-images');

DROP POLICY IF EXISTS "Permitir subida publica en landing-images" ON storage.objects;
CREATE POLICY "Permitir subida publica en landing-images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'landing-images');

DROP POLICY IF EXISTS "Permitir actualizacion publica en landing-images" ON storage.objects;
CREATE POLICY "Permitir actualizacion publica en landing-images"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'landing-images');

DROP POLICY IF EXISTS "Permitir borrado publico en landing-images" ON storage.objects;
CREATE POLICY "Permitir borrado publico en landing-images"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'landing-images');
`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(supabaseSqlScript);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 3000);
  };

  // Color preset swatches
  const colorPresets = [
    { label: 'Esmeralda', hex: '#059669' },
    { label: 'Verde CFE', hex: '#16a34a' },
    { label: 'Azul Solar', hex: '#0284c7' },
    { label: 'Índigo Pro', hex: '#4f46e5' },
    { label: 'Ámbar Energía', hex: '#d97706' },
    { label: 'Rosa Enlace', hex: '#e11d48' },
    { label: 'Púrpura', hex: '#7c3aed' },
    { label: 'Pizarra Oscuro', hex: '#0f172a' }
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      
      {/* ----------------- TOP CONTROLS HEADER ----------------- */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white shadow-lg border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-md">
              <Sliders className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-white leading-tight">
                  Panel de Administración • Landing Page
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-500/30">
                  CMS Activo
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Edita textos, imágenes del slider, teléfonos, fondos y sincroniza con Supabase
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onPreviewLanding}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border border-slate-700"
              title="Abrir la Landing Page pública para ver los cambios"
            >
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>Ver Landing Page</span>
            </button>

            <button
              onClick={handleSaveToCloud}
              disabled={isSaving}
              className={`px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer active:scale-95 ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>

            <button
              onClick={handleResetDefaults}
              className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              title="Restablecer valores de fábrica"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {onExit && (
              <button
                onClick={onExit}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                title="Cerrar panel y volver"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>

        {/* Global Notifications inside header */}
        <AnimatePresence>
          {saveSuccess && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-emerald-600 text-white text-xs font-bold py-2 px-4 text-center flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{saveMessage}</span>
            </motion.div>
          )}
          {uploadNotice && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-amber-600 text-white text-xs font-bold py-2 px-4 text-center flex items-center justify-center gap-2"
            >
              <AlertCircle className="w-4 h-4" />
              <span>{uploadNotice}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ----------------- SUB-NAVIGATION TABS ----------------- */}
      <div className="bg-white border-b border-slate-200 shadow-xs sticky top-[69px] z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-2 sm:space-x-4 overflow-x-auto py-2.5 scrollbar-none">
            
            <button
              onClick={() => setActiveTab('slider')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shrink-0 ${activeTab === 'slider' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>1. Slider & Fotos ({localConfig.heroSlides?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('content')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shrink-0 ${activeTab === 'content' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Type className="w-4 h-4" />
              <span>2. Textos & Secciones</span>
            </button>

            <button
              onClick={() => setActiveTab('styles')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shrink-0 ${activeTab === 'styles' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Palette className="w-4 h-4" />
              <span>3. Colores & Fondos</span>
            </button>

            <button
              onClick={() => setActiveTab('contact')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shrink-0 ${activeTab === 'contact' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Phone className="w-4 h-4" />
              <span>4. Teléfonos & Dirección</span>
            </button>

            <button
              onClick={() => setActiveTab('sql')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shrink-0 ${activeTab === 'sql' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Database className="w-4 h-4" />
              <span>5. Script SQL Supabase</span>
            </button>

          </div>
        </div>
      </div>

      {/* ----------------- MAIN EDITING CONTENT AREA ----------------- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        
        {/* ============================================================== */}
        {/* TAB 1: SLIDER & FOTOS DE CONTENIDO */}
        {/* ============================================================== */}
        {activeTab === 'slider' && (
          <div className="space-y-6">
            
            {/* Slider Settings Header Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Slider Principal (Hero)</span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Gestión del Carrusel de Imágenes
                </h2>
                <p className="text-xs text-slate-500 max-w-xl">
                  Cambia la imagen principal, sube nuevas fotografías desde tu dispositivo directo a Supabase, cambia títulos, subtítulos y los botones de cada diapositiva.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={localConfig.sliderAutoPlay}
                      onChange={(e) => updateField('sliderAutoPlay', e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                    />
                    <span>Auto-reproducir</span>
                  </label>

                  {localConfig.sliderAutoPlay && (
                    <div className="flex items-center gap-1 text-xs text-slate-500 border-l border-slate-200 pl-3">
                      <span>Cada</span>
                      <input 
                        type="number"
                        min="2"
                        max="30"
                        value={localConfig.sliderIntervalSec || 6}
                        onChange={(e) => updateField('sliderIntervalSec', Number(e.target.value))}
                        className="w-12 px-1.5 py-1 bg-white border border-slate-300 rounded text-center font-bold text-slate-800"
                      />
                      <span>seg</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleAddSlide}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Agregar Imagen al Slider</span>
                </button>
              </div>
            </div>

            {/* Slides List */}
            <div className="space-y-6">
              {localConfig.heroSlides && localConfig.heroSlides.map((slide, idx) => (
                <div 
                  key={slide.id || idx}
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all"
                >
                  {/* Slide Header */}
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shadow-xs">
                        #{idx + 1}
                      </span>
                      <div>
                        <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                          Diapositiva {idx + 1} {idx === 0 ? '(Imagen Principal)' : ''}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono truncate max-w-xs block">
                          {slide.title || 'Sin título'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleMoveSlide(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-30 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                        title="Mover arriba"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveSlide(idx, 'down')}
                        disabled={idx === (localConfig.heroSlides?.length || 0) - 1}
                        className="p-1.5 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-30 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                        title="Mover abajo"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSlide(idx)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                        title="Eliminar esta diapositiva"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Slide Body */}
                  <div className="p-6 grid lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left: Image Preview & Upload directly to Supabase */}
                    <div className="lg:col-span-5 space-y-4">
                      <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-inner group">
                        <img 
                          src={slide.imageUrl || 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1920&q=80'} 
                          alt="Slide preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                          <label className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl cursor-pointer">
                            <Upload className="w-4 h-4" />
                            <span>Cambiar Fotografía</span>
                            <input 
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleFileUpload(file, (url) => handleUpdateSlide(idx, { imageUrl: url }), `slide_${idx}`);
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      {/* Upload button with status */}
                      <div className="flex flex-col gap-2">
                        <label className="w-full py-3 px-4 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-dashed border-slate-300 rounded-xl text-center flex items-center justify-center gap-2 font-bold text-xs text-slate-700 hover:text-emerald-700 transition-all cursor-pointer">
                          <Upload className="w-4 h-4 text-emerald-600" />
                          <span>
                            {uploadingTarget === `slide_${idx}` ? 'Subiendo a Supabase...' : 'Subir nueva imagen a Supabase'}
                          </span>
                          <input 
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFileUpload(file, (url) => handleUpdateSlide(idx, { imageUrl: url }), `slide_${idx}`);
                              }
                            }}
                          />
                        </label>
                        
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <ImageIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">URL actual: {slide.imageUrl || 'Por defecto'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Slide Content Form */}
                    <div className="lg:col-span-7 space-y-4">
                      
                      {/* Badge / Pill */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Etiqueta Superior (Badge)</label>
                        <input 
                          type="text" 
                          value={slide.badge || ''}
                          onChange={(e) => handleUpdateSlide(idx, { badge: e.target.value })}
                          placeholder="Ej. Ahorra hasta 98% en tu recibo CFE"
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none"
                        />
                      </div>

                      {/* Main Title */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Título de la Diapositiva</label>
                        <input 
                          type="text" 
                          value={slide.title || ''}
                          onChange={(e) => handleUpdateSlide(idx, { title: e.target.value })}
                          placeholder="Título impactante..."
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:bg-white focus:border-emerald-500 outline-none"
                        />
                      </div>

                      {/* Subtitle / Paragraph */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Subtítulo / Párrafo Explicativo</label>
                        <textarea 
                          rows={2}
                          value={slide.subtitle || ''}
                          onChange={(e) => handleUpdateSlide(idx, { subtitle: e.target.value })}
                          placeholder="Detalles sobre garantías, beneficios, etc."
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-normal text-slate-700 focus:bg-white focus:border-emerald-500 outline-none resize-none"
                        />
                      </div>

                      {/* Primary Button */}
                      <div className="grid sm:grid-cols-2 gap-3 pt-1">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Texto del Botón Principal</label>
                          <input 
                            type="text" 
                            value={slide.ctaText || ''}
                            onChange={(e) => handleUpdateSlide(idx, { ctaText: e.target.value })}
                            placeholder="Ej. 👉 Solicitar Cotización"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Enlace o Destino (#contacto o URL)</label>
                          <input 
                            type="text" 
                            value={slide.ctaLink || ''}
                            onChange={(e) => handleUpdateSlide(idx, { ctaLink: e.target.value })}
                            placeholder="#contacto o https://wa.me/..."
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
                          />
                        </div>
                      </div>

                      {/* Slide Button Colors & Alignment */}
                      <div className="grid sm:grid-cols-3 gap-3 pt-1">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Color del Botón</label>
                          <div className="flex items-center gap-2">
                            <input 
                              type="color" 
                              value={slide.ctaBgColor || localConfig.styles.primaryBtnColor || '#059669'}
                              onChange={(e) => handleUpdateSlide(idx, { ctaBgColor: e.target.value })}
                              className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                            />
                            <span className="text-xs font-mono font-bold text-slate-700">{slide.ctaBgColor || '#059669'}</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Color del Texto</label>
                          <div className="flex items-center gap-2">
                            <input 
                              type="color" 
                              value={slide.ctaTextColor || '#ffffff'}
                              onChange={(e) => handleUpdateSlide(idx, { ctaTextColor: e.target.value })}
                              className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                            />
                            <span className="text-xs font-mono font-bold text-slate-700">{slide.ctaTextColor || '#ffffff'}</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Alineación del Texto</label>
                          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                            <button
                              type="button"
                              onClick={() => handleUpdateSlide(idx, { textAlign: 'left' })}
                              className={`flex-1 py-1 rounded-lg text-xs font-bold flex justify-center ${slide.textAlign === 'left' || !slide.textAlign ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'}`}
                            >
                              <AlignLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateSlide(idx, { textAlign: 'center' })}
                              className={`flex-1 py-1 rounded-lg text-xs font-bold flex justify-center ${slide.textAlign === 'center' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'}`}
                            >
                              <AlignCenter className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateSlide(idx, { textAlign: 'right' })}
                              className={`flex-1 py-1 rounded-lg text-xs font-bold flex justify-center ${slide.textAlign === 'right' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'}`}
                            >
                              <AlignRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                    </div>

                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: TEXTOS, BENEFICIOS, SOLUCIONES & FAQS */}
        {/* ============================================================== */}
        {activeTab === 'content' && (
          <div className="space-y-8">
            
            {/* Header Branding */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 block">Identidad & Marca</span>
              <h3 className="text-lg font-black text-slate-900">Encabezado y Barra Superior</h3>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Nombre de la Marca</label>
                  <input 
                    type="text" 
                    value={localConfig.brandName}
                    onChange={(e) => updateField('brandName', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Texto del Botón en Barra Superior</label>
                  <input 
                    type="text" 
                    value={localConfig.headerCtaText}
                    onChange={(e) => updateField('headerCtaText', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Benefits Section Editor */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 block">Sección de Beneficios</span>
                  <h3 className="text-lg font-black text-slate-900">¿Por qué elegir Solux Green?</h3>
                </div>
                <button
                  onClick={() => {
                    const newBen: LandingBenefit = {
                      id: `ben_${Date.now()}`,
                      title: 'Nuevo Beneficio Exclusivo',
                      description: 'Descripción detallada de la ventaja tecnológica o económica.',
                      iconName: 'Zap'
                    };
                    updateField('benefits', [...localConfig.benefits, newBen]);
                  }}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar Beneficio
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Título de la Sección</label>
                  <input 
                    type="text" 
                    value={localConfig.benefitsTitle}
                    onChange={(e) => updateField('benefitsTitle', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Subtítulo de la Sección</label>
                  <input 
                    type="text" 
                    value={localConfig.benefitsSubtitle}
                    onChange={(e) => updateField('benefitsSubtitle', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
                  />
                </div>
              </div>

              {/* Individual Benefit Cards */}
              <div className="grid md:grid-cols-2 gap-4 pt-2">
                {localConfig.benefits.map((benefit, bIdx) => (
                  <div key={benefit.id || bIdx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 relative">
                    <button
                      onClick={() => {
                        const newBens = localConfig.benefits.filter((_, i) => i !== bIdx);
                        updateField('benefits', newBens);
                      }}
                      className="absolute top-3 right-3 text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                      title="Eliminar beneficio"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="space-y-1 pr-6">
                      <label className="text-[10px] font-black uppercase text-slate-500">Título del Beneficio</label>
                      <input 
                        type="text" 
                        value={benefit.title}
                        onChange={(e) => {
                          const newBens = [...localConfig.benefits];
                          newBens[bIdx].title = e.target.value;
                          updateField('benefits', newBens);
                        }}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-500">Párrafo de Descripción</label>
                      <textarea 
                        rows={2}
                        value={benefit.description}
                        onChange={(e) => {
                          const newBens = [...localConfig.benefits];
                          newBens[bIdx].description = e.target.value;
                          updateField('benefits', newBens);
                        }}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 resize-none"
                      />
                    </div>

                    {/* Image upload for benefit */}
                    <div className="pt-1 flex items-center justify-between text-xs">
                      <label className="px-3 py-1.5 bg-white border border-slate-200 hover:border-emerald-400 text-slate-700 rounded-lg font-bold text-[11px] flex items-center gap-1.5 cursor-pointer">
                        <Upload className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{uploadingTarget === `ben_${bIdx}` ? 'Subiendo...' : 'Subir Foto a Supabase'}</span>
                        <input 
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileUpload(file, (url) => {
                                const newBens = [...localConfig.benefits];
                                newBens[bIdx].imageUrl = url;
                                updateField('benefits', newBens);
                              }, `ben_${bIdx}`);
                            }
                          }}
                        />
                      </label>

                      {benefit.imageUrl && (
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Foto subida
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Solutions Section Editor */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 block">Sección de Soluciones</span>
                  <h3 className="text-lg font-black text-slate-900">Soluciones Fotovoltaicas (Residencial, Comercial, Industrial)</h3>
                </div>
                <button
                  onClick={() => {
                    const newSol: LandingSolution = {
                      id: `sol_${Date.now()}`,
                      title: 'Nueva Solución Solar',
                      description: 'Descripción orientada a clientes residenciales o comerciales.',
                      badge: 'Nuevo',
                      imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
                      features: ['Monitoreo App en tiempo real', 'Garantía 25 años'],
                      buttonText: 'Cotizar Ahora',
                      buttonLink: '#contacto',
                      buttonColor: '#059669'
                    };
                    updateField('solutions', [...(localConfig.solutions || []), newSol]);
                  }}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar Solución
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {localConfig.solutions && localConfig.solutions.map((sol, sIdx) => (
                  <div key={sol.id || sIdx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 relative">
                    <button
                      onClick={() => {
                        const newSols = localConfig.solutions?.filter((_, i) => i !== sIdx) || [];
                        updateField('solutions', newSols);
                      }}
                      className="absolute top-3 right-3 text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="space-y-1 pr-6">
                      <label className="text-[10px] font-black uppercase text-slate-500">Nombre de la Solución</label>
                      <input 
                        type="text" 
                        value={sol.title}
                        onChange={(e) => {
                          const newSols = [...(localConfig.solutions || [])];
                          newSols[sIdx].title = e.target.value;
                          updateField('solutions', newSols);
                        }}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-500">Etiqueta Destacada (Badge)</label>
                      <input 
                        type="text" 
                        value={sol.badge || ''}
                        onChange={(e) => {
                          const newSols = [...(localConfig.solutions || [])];
                          newSols[sIdx].badge = e.target.value;
                          updateField('solutions', newSols);
                        }}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-500">Descripción</label>
                      <textarea 
                        rows={2}
                        value={sol.description}
                        onChange={(e) => {
                          const newSols = [...(localConfig.solutions || [])];
                          newSols[sIdx].description = e.target.value;
                          updateField('solutions', newSols);
                        }}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 resize-none"
                      />
                    </div>

                    {/* Image upload */}
                    <div className="pt-2">
                      <label className="w-full py-2 bg-white border border-slate-200 hover:border-emerald-400 rounded-lg text-center font-bold text-[11px] text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer">
                        <Upload className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{uploadingTarget === `sol_${sIdx}` ? 'Subiendo...' : 'Subir Foto a Supabase'}</span>
                        <input 
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileUpload(file, (url) => {
                                const newSols = [...(localConfig.solutions || [])];
                                newSols[sIdx].imageUrl = url;
                                updateField('solutions', newSols);
                              }, `sol_${sIdx}`);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQs Editor */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 block">Preguntas Frecuentes</span>
                  <h3 className="text-lg font-black text-slate-900">Sección FAQ</h3>
                </div>
                <button
                  onClick={() => {
                    const newFaq: LandingFAQ = {
                      id: `faq_${Date.now()}`,
                      question: '¿Nueva pregunta frecuente?',
                      answer: 'Respuesta clara y concisa para los clientes.'
                    };
                    updateField('faqs', [...localConfig.faqs, newFaq]);
                  }}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar Pregunta
                </button>
              </div>

              <div className="space-y-4">
                {localConfig.faqs.map((faq, fIdx) => (
                  <div key={faq.id || fIdx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 relative">
                    <button
                      onClick={() => {
                        const newFaqs = localConfig.faqs.filter((_, i) => i !== fIdx);
                        updateField('faqs', newFaqs);
                      }}
                      className="absolute top-3 right-3 text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="space-y-1 pr-6">
                      <label className="text-[10px] font-black uppercase text-slate-500">Pregunta</label>
                      <input 
                        type="text" 
                        value={faq.question}
                        onChange={(e) => {
                          const newFaqs = [...localConfig.faqs];
                          newFaqs[fIdx].question = e.target.value;
                          updateField('faqs', newFaqs);
                        }}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-500">Respuesta</label>
                      <textarea 
                        rows={2}
                        value={faq.answer}
                        onChange={(e) => {
                          const newFaqs = [...localConfig.faqs];
                          newFaqs[fIdx].answer = e.target.value;
                          updateField('faqs', newFaqs);
                        }}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 resize-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: COLORES DE BOTONES, FONDOS & TIPOGRAFÍA */}
        {/* ============================================================== */}
        {activeTab === 'styles' && (
          <div className="space-y-8">
            
            {/* Button Colors Customizer */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 block">Personalización Visual</span>
                <h3 className="text-xl font-black text-slate-900">Colores de Botones y Acciones</h3>
                <p className="text-xs text-slate-500">
                  Selecciona la paleta oficial de botones principales, WhatsApp y bordes para toda la landing page.
                </p>
              </div>

              {/* Color Presets */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Paleta Rápida de Color Primario</label>
                <div className="flex flex-wrap gap-2">
                  {colorPresets.map(preset => (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => updateStyles('primaryBtnColor', preset.hex)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${localConfig.styles.primaryBtnColor === preset.hex ? 'border-slate-900 bg-slate-900 text-white shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: preset.hex }}></span>
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
                
                {/* Primary Button Color */}
                <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <label className="text-xs font-black uppercase text-slate-700 tracking-wider block">Botón Principal</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      value={localConfig.styles.primaryBtnColor || '#059669'}
                      onChange={(e) => updateStyles('primaryBtnColor', e.target.value)}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 p-0.5"
                    />
                    <input 
                      type="text" 
                      value={localConfig.styles.primaryBtnColor || '#059669'}
                      onChange={(e) => updateStyles('primaryBtnColor', e.target.value)}
                      className="w-28 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                  <div className="pt-2">
                    <div 
                      style={{ backgroundColor: localConfig.styles.primaryBtnColor || '#059669', color: localConfig.styles.primaryBtnTextColor || '#ffffff' }}
                      className="py-2 px-4 rounded-xl text-center font-bold text-xs shadow-xs"
                    >
                      Vista Previa
                    </div>
                  </div>
                </div>

                {/* WhatsApp Button Color */}
                <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <label className="text-xs font-black uppercase text-slate-700 tracking-wider block">Botón de WhatsApp</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      value={localConfig.styles.whatsappBtnColor || '#25D366'}
                      onChange={(e) => updateStyles('whatsappBtnColor', e.target.value)}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 p-0.5"
                    />
                    <input 
                      type="text" 
                      value={localConfig.styles.whatsappBtnColor || '#25D366'}
                      onChange={(e) => updateStyles('whatsappBtnColor', e.target.value)}
                      className="w-28 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                  <div className="pt-2">
                    <div 
                      style={{ backgroundColor: localConfig.styles.whatsappBtnColor || '#25D366' }}
                      className="py-2 px-4 rounded-xl text-white text-center font-bold text-xs shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                    </div>
                  </div>
                </div>

                {/* Button Border Radius */}
                <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <label className="text-xs font-black uppercase text-slate-700 tracking-wider block">Redondez de Botones</label>
                  <select
                    value={localConfig.styles.btnBorderRadius || 'rounded-xl'}
                    onChange={(e) => updateStyles('btnBorderRadius', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                  >
                    <option value="none">Cuadrado (Recto)</option>
                    <option value="rounded-lg">Suave (rounded-lg)</option>
                    <option value="rounded-xl">Estándar Moderno (rounded-xl)</option>
                    <option value="rounded-2xl">Pronunciado (rounded-2xl)</option>
                    <option value="rounded-full">Píldora Completa (Pill)</option>
                  </select>
                </div>

              </div>
            </div>

            {/* Section Background Colors */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 block">Fondos de Secciones</span>
                <h3 className="text-xl font-black text-slate-900">Color de Fondo para Cada Sección</h3>
                <p className="text-xs text-slate-500">
                  Ajusta los fondos para lograr contraste perfecto entre bloques claros y oscuros.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                
                {/* Hero Bg */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <label className="text-[11px] font-black text-slate-700 block">Fondo Hero (Slider)</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={localConfig.styles.heroBgColor || '#0f172a'}
                      onChange={(e) => updateStyles('heroBgColor', e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                    />
                    <input 
                      type="text" 
                      value={localConfig.styles.heroBgColor || '#0f172a'}
                      onChange={(e) => updateStyles('heroBgColor', e.target.value)}
                      className="w-24 px-1.5 py-1 bg-white border border-slate-300 rounded text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Stats Bg */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <label className="text-[11px] font-black text-slate-700 block">Fondo Estadísticas</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={localConfig.styles.statsBgColor || '#1e293b'}
                      onChange={(e) => updateStyles('statsBgColor', e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                    />
                    <input 
                      type="text" 
                      value={localConfig.styles.statsBgColor || '#1e293b'}
                      onChange={(e) => updateStyles('statsBgColor', e.target.value)}
                      className="w-24 px-1.5 py-1 bg-white border border-slate-300 rounded text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Benefits Bg */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <label className="text-[11px] font-black text-slate-700 block">Fondo Beneficios</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={localConfig.styles.benefitsBgColor || '#f8fafc'}
                      onChange={(e) => updateStyles('benefitsBgColor', e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                    />
                    <input 
                      type="text" 
                      value={localConfig.styles.benefitsBgColor || '#f8fafc'}
                      onChange={(e) => updateStyles('benefitsBgColor', e.target.value)}
                      className="w-24 px-1.5 py-1 bg-white border border-slate-300 rounded text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Solutions Bg */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <label className="text-[11px] font-black text-slate-700 block">Fondo Soluciones</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={localConfig.styles.solutionsBgColor || '#ffffff'}
                      onChange={(e) => updateStyles('solutionsBgColor', e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                    />
                    <input 
                      type="text" 
                      value={localConfig.styles.solutionsBgColor || '#ffffff'}
                      onChange={(e) => updateStyles('solutionsBgColor', e.target.value)}
                      className="w-24 px-1.5 py-1 bg-white border border-slate-300 rounded text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Process Bg */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <label className="text-[11px] font-black text-slate-700 block">Fondo Proceso 4 Pasos</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={localConfig.styles.processBgColor || '#ffffff'}
                      onChange={(e) => updateStyles('processBgColor', e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                    />
                    <input 
                      type="text" 
                      value={localConfig.styles.processBgColor || '#ffffff'}
                      onChange={(e) => updateStyles('processBgColor', e.target.value)}
                      className="w-24 px-1.5 py-1 bg-white border border-slate-300 rounded text-xs font-mono"
                    />
                  </div>
                </div>

                {/* WhatsApp Banner Bg */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <label className="text-[11px] font-black text-slate-700 block">Fondo Tarjeta WhatsApp</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={localConfig.styles.whatsappCardBgColor || '#064e3b'}
                      onChange={(e) => updateStyles('whatsappCardBgColor', e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                    />
                    <input 
                      type="text" 
                      value={localConfig.styles.whatsappCardBgColor || '#064e3b'}
                      onChange={(e) => updateStyles('whatsappCardBgColor', e.target.value)}
                      className="w-24 px-1.5 py-1 bg-white border border-slate-300 rounded text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Contact Bg */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <label className="text-[11px] font-black text-slate-700 block">Fondo Contacto / Formulario</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={localConfig.styles.contactBgColor || '#f8fafc'}
                      onChange={(e) => updateStyles('contactBgColor', e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                    />
                    <input 
                      type="text" 
                      value={localConfig.styles.contactBgColor || '#f8fafc'}
                      onChange={(e) => updateStyles('contactBgColor', e.target.value)}
                      className="w-24 px-1.5 py-1 bg-white border border-slate-300 rounded text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Footer Bg */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <label className="text-[11px] font-black text-slate-700 block">Fondo Pie de Página</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={localConfig.styles.footerBgColor || '#020617'}
                      onChange={(e) => updateStyles('footerBgColor', e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                    />
                    <input 
                      type="text" 
                      value={localConfig.styles.footerBgColor || '#020617'}
                      onChange={(e) => updateStyles('footerBgColor', e.target.value)}
                      className="w-24 px-1.5 py-1 bg-white border border-slate-300 rounded text-xs font-mono"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Typography & Alignment Editor */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 block">Tipografía & Alineación</span>
                <h3 className="text-xl font-black text-slate-900">Estilo de Letra y Párrafos</h3>
                <p className="text-xs text-slate-500">
                  Modifica la fuente tipográfica general y el estilo de alineación y justificado de los textos.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                
                {/* Font Family */}
                <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <label className="text-xs font-black uppercase text-slate-700 tracking-wider block">Fuente Tipográfica</label>
                  <select
                    value={localConfig.styles.fontFamily || 'sans'}
                    onChange={(e) => updateStyles('fontFamily', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="sans">Inter (Moderno y Ultra Limpio - Por defecto)</option>
                    <option value="poppins">Poppins (Geométrica y Amigable)</option>
                    <option value="montserrat">Montserrat (Elegante y Corporativa)</option>
                    <option value="outfit">Outfit (Futurista & Energética)</option>
                    <option value="serif">Serif / Playfair (Clásica y Formal)</option>
                    <option value="mono">Mono (Técnica & Numérica)</option>
                  </select>
                </div>

                {/* Text Alignment / Justify */}
                <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <label className="text-xs font-black uppercase text-slate-700 tracking-wider block">Alineación de Párrafos de Contenido</label>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => updateStyles('textAlign', 'left')}
                      className={`py-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border cursor-pointer ${localConfig.styles.textAlign === 'left' || !localConfig.styles.textAlign ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-700 border-slate-200'}`}
                    >
                      <AlignLeft className="w-4 h-4" />
                      <span className="text-[10px]">Izquierda</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStyles('textAlign', 'center')}
                      className={`py-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border cursor-pointer ${localConfig.styles.textAlign === 'center' ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-700 border-slate-200'}`}
                    >
                      <AlignCenter className="w-4 h-4" />
                      <span className="text-[10px]">Centrado</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStyles('textAlign', 'right')}
                      className={`py-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border cursor-pointer ${localConfig.styles.textAlign === 'right' ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-700 border-slate-200'}`}
                    >
                      <AlignRight className="w-4 h-4" />
                      <span className="text-[10px]">Derecha</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStyles('textAlign', 'justify')}
                      className={`py-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border cursor-pointer ${localConfig.styles.textAlign === 'justify' ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-700 border-slate-200'}`}
                    >
                      <AlignJustify className="w-4 h-4" />
                      <span className="text-[10px]">Justificar</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: TELÉFONOS, CORREOS, DIRECCIÓN & WHATSAPP */}
        {/* ============================================================== */}
        {activeTab === 'contact' && (
          <div className="space-y-8">
            
            {/* Phones Manager */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 block">Canales Telefónicos</span>
                  <h3 className="text-xl font-black text-slate-900">Teléfonos de Contacto & WhatsApp</h3>
                  <p className="text-xs text-slate-500">Agrega, edita o elimina números que aparecerán en la barra superior, sección de contacto y pie de página.</p>
                </div>
                <button
                  onClick={handleAddPhone}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar Teléfono
                </button>
              </div>

              <div className="space-y-3">
                {localConfig.contactPhones && localConfig.contactPhones.map((phone, pIdx) => (
                  <div key={phone.id || pIdx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex-1 grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-500">Etiqueta (Ej. Ventas, Soporte)</label>
                        <input 
                          type="text" 
                          value={phone.label}
                          onChange={(e) => handleUpdatePhone(pIdx, { label: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-500">Número de Teléfono</label>
                        <input 
                          type="text" 
                          value={phone.number}
                          onChange={(e) => handleUpdatePhone(pIdx, { number: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={phone.isWhatsApp}
                          onChange={(e) => handleUpdatePhone(pIdx, { isWhatsApp: e.target.checked })}
                          className="w-4 h-4 rounded text-emerald-600 accent-emerald-600"
                        />
                        <span>Habilitar WhatsApp</span>
                      </label>

                      <button
                        onClick={() => handleDeletePhone(pIdx)}
                        className="p-2 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar teléfono"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Emails Manager */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 block">Correos Electrónicos</span>
                  <h3 className="text-xl font-black text-slate-900">Buzones y Cuentas de Correo</h3>
                </div>
                <button
                  onClick={handleAddEmail}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar Correo
                </button>
              </div>

              <div className="space-y-3">
                {localConfig.contactEmails && localConfig.contactEmails.map((emailItem, eIdx) => (
                  <div key={emailItem.id || eIdx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex-1 grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-500">Departamento o Área</label>
                        <input 
                          type="text" 
                          value={emailItem.label}
                          onChange={(e) => handleUpdateEmail(eIdx, { label: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-500">Dirección de Correo Electrónico</label>
                        <input 
                          type="email" 
                          value={emailItem.email}
                          onChange={(e) => handleUpdateEmail(eIdx, { email: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteEmail(eIdx)}
                      className="p-2 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar correo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Physical Location, Hours & WhatsApp Default Message */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 block">Ubicación y Operación</span>
                <h3 className="text-xl font-black text-slate-900">Dirección Física, Horarios y Mensajes</h3>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Dirección de Oficinas Físicas</label>
                  <textarea 
                    rows={2}
                    value={localConfig.contactAddress}
                    onChange={(e) => updateField('contactAddress', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Enlace de Ubicación (Google Maps)</label>
                  <input 
                    type="text" 
                    value={localConfig.googleMapsUrl || ''}
                    onChange={(e) => updateField('googleMapsUrl', e.target.value)}
                    placeholder="https://maps.google.com/..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Horario de Atención al Público</label>
                  <input 
                    type="text" 
                    value={localConfig.businessHours || ''}
                    onChange={(e) => updateField('businessHours', e.target.value)}
                    placeholder="Lunes a Viernes 8:00 AM - 7:00 PM"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Mensaje Predeterminado de WhatsApp</label>
                  <input 
                    type="text" 
                    value={localConfig.defaultWhatsappMessage}
                    onChange={(e) => updateField('defaultWhatsappMessage', e.target.value)}
                    placeholder="Hola Solux Green, quiero cotizar un sistema..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none"
                  />
                </div>

              </div>
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: SCRIPT SQL PARA SUPABASE */}
        {/* ============================================================== */}
        {activeTab === 'sql' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 block">Persistencia en Nube</span>
                <h3 className="text-xl font-black text-slate-900">Script SQL para Supabase</h3>
                <p className="text-xs text-slate-500">
                  Copia y pega este script en el <strong>SQL Editor</strong> de tu panel de Supabase para crear la tabla <code className="font-mono text-emerald-600">landing_config</code> y el bucket de Storage <code className="font-mono text-emerald-600">landing-images</code> con permisos públicos completos.
                </p>
              </div>

              <button
                onClick={handleCopySql}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md transition-all cursor-pointer"
              >
                {sqlCopied ? <CheckCheck className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{sqlCopied ? '¡SQL Copiado!' : 'Copiar Script SQL'}</span>
              </button>
            </div>

            <div className="relative">
              <pre className="p-5 bg-slate-950 text-slate-200 rounded-2xl text-xs font-mono leading-relaxed overflow-x-auto border border-slate-800 select-all">
                {supabaseSqlScript}
              </pre>
            </div>

            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-xs text-indigo-900 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Instrucciones de activación en Supabase:</span>
                <ol className="list-decimal list-inside space-y-1 mt-1 text-slate-700">
                  <li>Inicia sesión en tu consola de Supabase (<a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-indigo-600 underline font-semibold">supabase.com/dashboard</a>).</li>
                  <li>Ve a la pestaña <strong>SQL Editor</strong> en el menú lateral izquierdo.</li>
                  <li>Pega el código SQL copiado arriba y haz clic en <strong>RUN</strong>.</li>
                  <li>¡Listo! Tu tabla y tu bucket de almacenamiento para fotos estarán activos de por vida.</li>
                </ol>
              </div>
            </div>
          </div>
        )}

      </main>

    </div>
  );
}
