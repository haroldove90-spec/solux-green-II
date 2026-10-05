import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sun, Zap, ShieldCheck, Award, Smartphone, CheckCircle2, 
  ArrowRight, Phone, Mail, MapPin, MessageSquare, ChevronDown, 
  ChevronUp, ExternalLink, Settings, ArrowLeft, ChevronLeft, 
  ChevronRight, Sparkles, FileText, Clock, Wrench, Cpu, 
  TrendingDown, DollarSign, Layers, Check, Camera, User, Send,
  AlertTriangle, RotateCcw, Menu, X, LogIn
} from 'lucide-react';
import { LandingConfig, LandingSlide, LandingBenefit, LandingStep, LandingFAQ, LandingStat, SolarProject } from '../types';
import { SOLUX_LOGO_FALLBACK } from '../logoConfig';
import { calculateSoluxFinancing, formatPaymentMethod } from '../financingUtils';

interface LandingPageViewProps {
  config: LandingConfig;
  onNavigateToAdmin?: () => void;
  onNavigateToPortal?: () => void;
  onAddSolarProject?: (project: SolarProject) => void;
  soluxConfig?: any;
  currentUser?: any;
}

export default function LandingPageView({
  config,
  onNavigateToAdmin,
  onNavigateToPortal,
  onAddSolarProject,
  soluxConfig,
  currentUser
}: LandingPageViewProps) {
  // Mobile / Tablet Navigation Drawer State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Slider State
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const slides = config.heroSlides && config.heroSlides.length > 0 ? config.heroSlides : [];

  // FAQ Accordion State
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(config.faqs?.[0]?.id || null);

  // Formulario de Contacto / Prospecto Solar (Replicado de Asesor Verde)
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formMunicipality, setFormMunicipality] = useState('');
  const [formMapsUrl, setFormMapsUrl] = useState('');
  const [formBill, setFormBill] = useState<number | string>('');
  const [formSpace, setFormSpace] = useState<string>('');
  const [formMeters, setFormMeters] = useState<string>('1');
  const [formCFE, setFormCFE] = useState<'activo_sin_adeudo' | 'con_adeudo' | 'inactivo'>('activo_sin_adeudo');
  const [formOwnership, setFormOwnership] = useState<'propietario' | 'arrendatario_autorizado'>('propietario');
  const [formPayMethod, setFormPayMethod] = useState<string>('contado');
  const [formLoads, setFormLoads] = useState<string[]>([]);
  const [formWires, setFormWires] = useState<number>(2);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [lastWhatsAppUrl, setLastWhatsAppUrl] = useState<string>('');

  // Cálculo de paneles según fórmula oficial Solux Green: (Monto CFE / 1000) * 2
  const calculatePanels = (bill: number) => {
    if (!bill || bill <= 0) return 0;
    const rawPanels = (bill / 1000) * 2;
    const decimalPart = rawPanels - Math.floor(rawPanels);
    return Math.max(1, decimalPart >= 0.1 ? Math.ceil(rawPanels) : Math.floor(rawPanels));
  };

  const activePanelPrice = Number(soluxConfig?.panelBasePrice) || 11000;
  const billNum = Number(formBill) || 0;
  const estimatedPanelsCount = calculatePanels(billNum);
  const baseInvestment = estimatedPanelsCount * activePanelPrice;
  const finCalc = calculateSoluxFinancing(baseInvestment, formPayMethod, soluxConfig);
  const bimestralSavings = Math.round(billNum * 0.95);
  const annualSavings = bimestralSavings * 6;
  const roiYears = annualSavings > 0 ? (finCalc.isContado ? finCalc.netInvestment : finCalc.totalWithInterest) / annualSavings : 0;

  // Auto-play for Hero Slider
  useEffect(() => {
    if (!config.sliderAutoPlay || slides.length <= 1) return;
    const intervalTime = (config.sliderIntervalSec || 6) * 1000;
    const timer = setInterval(() => {
      setCurrentSlideIndex(prev => (prev + 1) % slides.length);
    }, intervalTime);
    return () => clearInterval(timer);
  }, [config.sliderAutoPlay, config.sliderIntervalSec, slides.length]);

  const handleNextSlide = () => {
    if (slides.length > 0) {
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    }
  };

  const handlePrevSlide = () => {
    if (slides.length > 0) {
      setCurrentSlideIndex((prev) => (prev - 1 + slides.length) % slides.length);
    }
  };

  // Helper to build WhatsApp URL with pre-filled message
  const getCleanWhatsappUrl = (customText?: string) => {
    const rawNum = config.contactWhatsapp.replace(/\D/g, '');
    const cleanNum = rawNum.startsWith('52') ? rawNum : (rawNum.length === 10 ? `521${rawNum}` : `52${rawNum}`);
    const textToEncode = customText || config.defaultWhatsappMessage || 'Hola Solux Green, quiero cotizar un sistema de paneles solares';
    return `https://wa.me/${cleanNum}?text=${encodeURIComponent(textToEncode)}`;
  };

  // Typography font class
  const getFontFamilyClass = () => {
    switch (config.styles?.fontFamily) {
      case 'inter': return 'font-sans';
      case 'poppins': return 'font-sans tracking-wide';
      case 'serif': return 'font-serif';
      case 'mono': return 'font-mono';
      default: return 'font-sans';
    }
  };

  // Text alignment class
  const getTextAlignClass = () => {
    switch (config.styles?.textAlign) {
      case 'center': return 'text-center';
      case 'justify': return 'text-justify';
      default: return 'text-left';
    }
  };

  // Resolver for slide CTA links
  const getSlideCtaLink = (slide?: LandingSlide) => {
    if (!slide) return config.heroCtaLink || '#contacto';
    if (slide.ctaLink && slide.ctaLink.trim() !== '') {
      return slide.ctaLink;
    }
    const text = (slide.ctaText || '').toLowerCase();
    const isEnlace = text.includes('enlace') || text.includes('asesor') || slide.id === 'slide_3';
    if (isEnlace) {
      return 'https://wa.me/5212293233633?text=Hola%20Solux%20Green,%20quiero%20ser%20Asesor%20de%20Enlace%20y%20solicito%20informes';
    }
    return config.heroCtaLink || '#contacto';
  };

  const handleProspectFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim() || !formMunicipality.trim()) {
      alert('⚠️ Por favor completa los campos obligatorios: Nombre, Teléfono Celular y Municipio.');
      return;
    }

    setFormSubmitting(true);

    const safeBillNum = Number(formBill) || 0;
    const panels = calculatePanels(safeBillNum);
    const investment = panels * activePanelPrice;
    const kwp = ((panels * 550) / 1000).toFixed(2);
    const fin = calculateSoluxFinancing(investment, formPayMethod, soluxConfig);
    const payMethodLabel = formatPaymentMethod(formPayMethod);

    const whatsappMessage = `☀️ *SOLICITUD DE PROSPECTO SOLAR - SOLUX GREEN* ☀️

👤 *DATOS DEL CLIENTE:*
• Nombre: *${formName.trim()}*
• Teléfono / WhatsApp: *${formPhone.trim()}*
• Correo Electrónico: *${formEmail.trim() || 'No especificado'}*
• Municipio y Estado: *${formMunicipality.trim()}*
• Ubicación Maps: ${formMapsUrl.trim() || 'No especificada'}

⚡ *INFORMACIÓN ELÉCTRICA Y DEL INMUEBLE:*
• Pago CFE Promedio: *$${safeBillNum.toLocaleString('es-MX')} MXN* bimestral
• Espacio Disponible en Techo: *${formSpace ? `${formSpace} m²` : 'Por verificar en sitio'}*
• Número de Medidores CFE: *${formMeters || '1'}*
• Estatus de Servicio CFE: *${formCFE === 'activo_sin_adeudo' ? 'Activo sin Adeudo' : formCFE === 'con_adeudo' ? 'Con Adeudo' : 'Inactivo / Nuevo Contrato'}*
• Validación de Propiedad: *${formOwnership === 'propietario' ? 'Propietario del Inmueble' : 'Arrendatario Autorizado'}*
• Número de Hilos en Acometida: *${formWires} Hilos*
• Cargas Especiales: *${formLoads.length > 0 ? formLoads.join(', ') : 'Ninguna seleccionada'}*

📊 *ESTIMACIÓN PRELIMINAR SOLUX GREEN:*
• Paneles Sugeridos: *${panels} Módulos Fotovoltaicos* (~${kwp} kWp)
• Inversión Preliminar: *$${investment.toLocaleString('es-MX')} MXN*
• Esquema de Pago: *${payMethodLabel}*
• Enganche Estimado (${fin.downPercent}%): *$${fin.downPayment.toLocaleString('es-MX')} MXN*
• Ahorro Estimado: *Hasta 98% en recibo de CFE*

📸 *ADVERTENCIA / EVIDENCIAS:*
⚠️ *Toma foto de tu recibo de luz, medidor, etc y envíales por este medio.*
(Por favor envía tus fotos por este medio para que nuestro equipo técnico elabore tu diseño y cotización definitiva).`;

    const targetNumber = '5212293233633';
    const waUrl = `https://wa.me/${targetNumber}?text=${encodeURIComponent(whatsappMessage)}`;
    setLastWhatsAppUrl(waUrl);

    if (onAddSolarProject) {
      try {
        const newProj: SolarProject = {
          id: `proj_web_${Date.now()}`,
          clientName: formName.trim(),
          clientPhone: formPhone.trim(),
          clientEmail: formEmail.trim() || undefined,
          whatsappPhone: formPhone.trim(),
          googleMapsUrl: formMapsUrl.trim() || undefined,
          municipalityState: formMunicipality.trim(),
          electricalLoadType: formLoads,
          wiresCount: formWires,
          averageBill: safeBillNum,
          availableSpace: Number(formSpace) || Number((panels * 2.88).toFixed(2)),
          metersCount: Number(formMeters) || 1,
          cfeStatus: formCFE,
          paymentMethodDesired: formPayMethod,
          propertyOwnership: formOwnership,
          estimatedPanels: panels,
          requiredArea: Number((panels * 2.88).toFixed(2)),
          voltageAlert220v: panels > 4,
          voltageUpgradeQuoted: panels > 4,
          totalInvestment: investment,
          siteSurveyPaid: false,
          siteSurveyStatus: 'pendiente',
          status: 'validacion',
          evidence: {},
          payments: [],
          createdDate: new Date().toISOString().split('T')[0],
          createdBy: 'landing_web',
          createdByRole: 'client',
          advisorName: 'Equipo Solux Green',
          advisorPhone: '229 323 3633'
        };
        onAddSolarProject(newProj);
      } catch (err) {
        console.warn('Error saving prospect from landing:', err);
      }
    }

    window.open(waUrl, '_blank');
    setFormSuccess(true);
    setFormSubmitting(false);
  };

  const currentSlide = slides[currentSlideIndex] || slides[0];

  return (
    <div 
      className={`min-h-screen text-slate-900 bg-white selection:bg-emerald-500 selection:text-white ${getFontFamilyClass()} relative overflow-x-hidden`}
      id="solux-landing-page"
    >
      {/* ========================================================================= */}
      {/* 1. TOP ANNOUNCEMENT & ACCESS QUICK BAR                                     */}
      {/* ========================================================================= */}
      <div className="bg-slate-950 text-slate-300 text-xs py-2 px-4 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2 z-50 relative">
        <div className="flex items-center gap-3 text-[11px] font-semibold">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ahorro Inteligente de Energía en México</span>
          </span>
          <span className="hidden md:inline text-slate-600">•</span>
          <span className="hidden md:flex items-center gap-1 text-slate-300">
            <Phone className="w-3 h-3 text-emerald-400" />
            <span>{config.contactPhone || '229 323 3633'}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Admin shortcuts only if logged-in user is admin */}
          {currentUser?.role === 'admin' ? (
            <>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-900/60 border border-violet-500/40 text-violet-200 text-[10px] font-black uppercase">
                👑 Admin Activo
              </span>
              {onNavigateToAdmin && (
                <button
                  onClick={onNavigateToAdmin}
                  className="px-2.5 py-1 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                  title="Ir al Panel de Edición de la Landing Page"
                >
                  <Settings className="w-3 h-3" />
                  <span>Admin Landing</span>
                </button>
              )}
              {onNavigateToPortal && (
                <button
                  onClick={onNavigateToPortal}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer border border-slate-700"
                  title="Ir al Panel de Operaciones"
                >
                  <ArrowLeft className="w-3 h-3 text-emerald-400" />
                  <span>Panel Admin</span>
                </button>
              )}
            </>
          ) : (
            /* Final user: only see button to access the system with credentials */
            onNavigateToPortal && (
              <button
                type="button"
                onClick={onNavigateToPortal}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                title="Acceso al sistema con credenciales registradas"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Acceder al Sistema</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. BARRA DE NAVEGACIÓN (HEADER) RESPONSIVE (DESKTOP, TABLET, MOBILE)      */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logotipo */}
          <div className="flex items-center gap-3">
            <a href="#hero" className="flex items-center gap-2.5 group">
              <img 
                src={config.logoUrl} 
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = SOLUX_LOGO_FALLBACK;
                }}
                alt={config.brandName || "Solux Green"} 
                className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </a>
          </div>

          {/* Menú de Navegación Principal (Visible en Desktop lg+) */}
          <nav className="hidden lg:flex items-center gap-7">
            {config.headerMenuItems.map((item) => (
              <a
                key={item.id}
                href={item.href}
                className="text-sm font-bold text-slate-700 hover:text-emerald-600 transition-colors tracking-tight"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Botones de Acción (Acceder al Sistema, WhatsApp y Menú Hamburguesa) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Botón: Acceder al Sistema (Para empleados y usuarios finales registrados) */}
            {onNavigateToPortal && (
              <button
                type="button"
                onClick={onNavigateToPortal}
                className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-emerald-600/30 hover:border-emerald-500 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-extrabold uppercase tracking-wide flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                title="Acceder al sistema con usuario y contraseña"
              >
                <LogIn className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="hidden md:inline">Acceder al Sistema</span>
                <span className="md:hidden">Acceso</span>
              </button>
            )}

            {/* Botón Directo: Cotizar por WhatsApp */}
            <a
              href={getCleanWhatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              style={{ backgroundColor: config.styles?.whatsappBtnColor || '#25D366' }}
              className="px-3.5 sm:px-5 py-2 sm:py-2.5 text-white rounded-xl text-xs sm:text-sm font-extrabold uppercase tracking-wide flex items-center gap-2 shadow-md hover:brightness-105 active:scale-95 transition-all cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 fill-white shrink-0" />
              <span className="hidden sm:inline">{config.headerCtaText || 'Cotizar por WhatsApp'}</span>
              <span className="sm:hidden">WhatsApp</span>
            </a>

            {/* Botón Hamburguesa Activo para Tablet y Móvil (lg:hidden) */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 sm:p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors focus:outline-none cursor-pointer flex items-center justify-center border border-slate-200 shadow-xs"
              aria-label={isMobileMenuOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
              title={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú de navegación"}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-slate-900" />
              ) : (
                <Menu className="w-6 h-6 text-slate-900" />
              )}
            </button>
          </div>
        </div>

        {/* Desplegable de Navegación Móvil y Tablet (Drawer / Dropdown) */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="lg:hidden bg-white border-b border-slate-200 shadow-xl overflow-hidden z-50"
            >
              <div className="px-4 sm:px-6 py-5 space-y-4 max-w-7xl mx-auto">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Menú de Navegación
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold uppercase">
                    Solux Green
                  </span>
                </div>
                
                {/* Enlaces de Navegación */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {config.headerMenuItems.map((item) => (
                    <a
                      key={item.id}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-800 hover:text-emerald-700 font-bold text-sm transition-colors border border-slate-100 active:scale-98"
                    >
                      <span>{item.label}</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </a>
                  ))}
                </div>

                {/* Acciones Rápidas en Menú Móvil/Tablet */}
                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5">
                  {onNavigateToPortal && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onNavigateToPortal();
                      }}
                      className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer active:scale-98"
                    >
                      <LogIn className="w-4 h-4 text-emerald-400" />
                      <span>Acceder al Sistema (Empleados)</span>
                    </button>
                  )}

                  <a
                    href={getCleanWhatsappUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{ backgroundColor: config.styles?.whatsappBtnColor || '#25D366' }}
                    className="flex-1 py-3 px-4 rounded-xl text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer active:scale-98"
                  >
                    <MessageSquare className="w-4 h-4 fill-white" />
                    <span>{config.headerCtaText || 'Cotizar por WhatsApp'}</span>
                  </a>
                </div>

                {/* Información de contacto */}
                <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    {config.contactPhone || '229 323 3633'}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Atención Inmediata
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ========================================================================= */}
      {/* 2. SECCIÓN HERO (SLIDER DE IMÁGENES / HERO BANNER)                        */}
      {/* ========================================================================= */}
      <section 
        id="hero" 
        className="relative min-h-[580px] lg:min-h-[680px] flex items-center overflow-hidden transition-colors"
        style={{ backgroundColor: config.styles?.heroBgColor || '#0f172a' }}
      >
        {/* Background Image Slides with AnimatePresence */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            {currentSlide && (
              <motion.div
                key={currentSlide.id || currentSlideIndex}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0"
              >
                <img 
                  src={currentSlide.imageUrl} 
                  alt={currentSlide.alt || "Paneles Solares Solux Green"} 
                  className="w-full h-full object-cover object-center"
                />
                {/* Modern Dark Gradient Overlay for Readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/75 to-slate-950/40" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Hero Content Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24 relative z-10 w-full text-white">
          <div className="max-w-2xl space-y-6">
            
            {/* Badge / Etiqueta superior */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 backdrop-blur-md"
            >
              <Zap className="w-4 h-4 text-emerald-400" />
              <span className="text-xs sm:text-sm font-extrabold tracking-wide uppercase">
                {currentSlide?.badge || config.heroBadge || 'Ahorra hasta un 98% en tu recibo de CFE'}
              </span>
            </motion.div>

            {/* Titular Principal (H1) */}
            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-sm"
            >
              {currentSlide?.title || config.heroTitle}
            </motion.h1>

            {/* Subtítulo */}
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`text-base sm:text-lg text-slate-200 font-medium leading-relaxed max-w-xl ${getTextAlignClass()}`}
            >
              {currentSlide?.subtitle || config.heroSubtitle}
            </motion.p>

            {/* Llamado a la Acción (CTA Principal por Diapositiva) */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4"
            >
              {(() => {
                const targetLink = getSlideCtaLink(currentSlide);
                const isExternal = targetLink.startsWith('http');
                const isSlide3 = currentSlide?.id === 'slide_3';
                const buttonText = currentSlide?.ctaText && currentSlide.ctaText.trim() !== ''
                  ? currentSlide.ctaText
                  : (isSlide3 ? '🚀 Quiero ser Asesor de Enlace' : config.heroCtaText || '👉 Solicitar Cotización');
                const buttonBg = currentSlide?.ctaBgColor || (isSlide3 ? '#e11d48' : config.styles?.primaryBtnColor || '#059669');
                const buttonTextColor = currentSlide?.ctaTextColor || '#ffffff';

                return (
                  <a
                    href={targetLink}
                    onClick={(e) => {
                      if (targetLink.startsWith('#')) {
                        e.preventDefault();
                        const el = document.querySelector(targetLink);
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    target={isExternal ? '_blank' : undefined}
                    rel={isExternal ? 'noopener noreferrer' : undefined}
                    style={{ 
                      backgroundColor: buttonBg,
                      color: buttonTextColor
                    }}
                    className="px-8 py-4 rounded-2xl text-sm sm:text-base font-black uppercase tracking-wider text-center shadow-xl shadow-emerald-900/30 hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-3 cursor-pointer"
                  >
                    <span>{buttonText}</span>
                  </a>
                );
              })()}
            </motion.div>

            {/* Texto de confianza */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 font-semibold"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{config.heroTrustText || 'Asesoría técnica sin costo • Respuesta en menos de 15 minutos'}</span>
            </motion.div>

          </div>
        </div>

        {/* Slider Controls (if multiple slides exist) */}
        {slides.length > 1 && (
          <>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-slate-900/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/50">
              {slides.map((_, idx) => (
                <button
                  key={`dot_${idx}`}
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    currentSlideIndex === idx ? 'w-8 bg-emerald-400' : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Ir a diapositiva ${idx + 1}`}
                />
              ))}
            </div>

            <button
              onClick={handlePrevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-slate-900/40 hover:bg-slate-900/70 border border-white/20 text-white backdrop-blur-md transition-all cursor-pointer hidden md:flex items-center justify-center"
              aria-label="Diapositiva anterior"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={handleNextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-slate-900/40 hover:bg-slate-900/70 border border-white/20 text-white backdrop-blur-md transition-all cursor-pointer hidden md:flex items-center justify-center"
              aria-label="Diapositiva siguiente"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 3. BARRA DE ESTADÍSTICAS Y CONFIANZA (SOCIAL PROOF)                       */}
      {/* ========================================================================= */}
      <section 
        className="py-12 border-y border-slate-800 text-white relative z-10 transition-colors"
        style={{ backgroundColor: config.styles?.statsBgColor || '#1e293b' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {config.stats.map((stat) => (
              <div 
                key={stat.id} 
                className="flex flex-col items-center text-center p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/40 transition-colors"
              >
                <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-emerald-400 tracking-tight mb-1 font-mono">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white">
                  {stat.label}
                </div>
                {stat.description && (
                  <div className="text-[11px] text-slate-300 font-medium mt-1 leading-snug">
                    {stat.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. BENEFICIOS CLAVE: ¿POR QUÉ INSTALAR PANELES CON SOLUX GREEN?          */}
      {/* ========================================================================= */}
      <section 
        id="beneficios" 
        className="py-20 lg:py-28 transition-colors"
        style={{ backgroundColor: config.styles?.benefitsBgColor || '#f8fafc' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-3.5 py-1 rounded-full inline-block">
              Máximo Rendimiento & Ahorro
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight uppercase">
              {config.benefitsTitle || '¿Por qué instalar paneles con Solux Green?'}
            </h2>
            <p className={`text-base text-slate-600 font-medium max-w-2xl mx-auto ${getTextAlignClass()}`}>
              {config.benefitsSubtitle || 'Energía limpia, protección frente a aumentos tarifarios y el mejor retorno de inversión garantizado.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
            {config.benefits.map((benefit, idx) => (
              <motion.div
                key={benefit.id}
                whileHover={{ y: -4 }}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-lg shadow-slate-100 flex flex-col justify-between overflow-hidden relative group"
              >
                {/* Image if provided */}
                {benefit.imageUrl && (
                  <div className="h-44 sm:h-52 w-full rounded-2xl overflow-hidden mb-6 relative">
                    <img 
                      src={benefit.imageUrl} 
                      alt={benefit.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                    <div className="absolute bottom-3 left-3 bg-emerald-600/90 text-white font-mono text-xs font-bold px-2.5 py-1 rounded-lg backdrop-blur-xs">
                      Solux Tier-1 #0{idx + 1}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xl mb-2">
                    {idx === 0 && <TrendingDown className="w-6 h-6" />}
                    {idx === 1 && <CheckCircle2 className="w-6 h-6" />}
                    {idx === 2 && <Cpu className="w-6 h-6" />}
                    {idx === 3 && <DollarSign className="w-6 h-6" />}
                    {idx > 3 && <Sparkles className="w-6 h-6" />}
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {benefit.title}
                  </h3>

                  <p className={`text-slate-600 font-medium text-sm sm:text-base leading-relaxed ${getTextAlignClass()}`}>
                    {benefit.description.replace('2 a 4 años', '2 a 5 años')}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. NUESTRO PROCESO EN 4 PASOS SIMPLES                                      */}
      {/* ========================================================================= */}
      <section 
        id="proceso" 
        className="py-20 lg:py-28 transition-colors border-t border-slate-100"
        style={{ backgroundColor: config.styles?.processBgColor || '#ffffff' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-3.5 py-1 rounded-full inline-block">
              Instalación sin complicaciones
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight uppercase">
              {config.processTitle || 'Nuestro Proceso en 4 Pasos Simples'}
            </h2>
            <p className={`text-base text-slate-600 font-medium max-w-2xl mx-auto ${getTextAlignClass()}`}>
              {config.processSubtitle || 'De tu recibo de luz actual a tu propio sistema solar generando energía en tiempo récord.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {config.steps.map((step, idx) => (
              <div 
                key={step.id} 
                className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-7 flex flex-col justify-between relative group hover:border-emerald-500/50 transition-all hover:shadow-lg"
              >
                <div className="space-y-4">
                  {/* Step Number Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-3xl sm:text-4xl font-black text-emerald-600 font-mono">
                      0{step.stepNumber || idx + 1}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      {idx === 0 && <FileText className="w-5 h-5" />}
                      {idx === 1 && <Clock className="w-5 h-5" />}
                      {idx === 2 && <Wrench className="w-5 h-5" />}
                      {idx === 3 && <Zap className="w-5 h-5" />}
                      {idx > 3 && <Check className="w-5 h-5" />}
                    </div>
                  </div>

                  <h4 className="text-lg font-black text-slate-900 tracking-tight">
                    {step.title}
                  </h4>

                  <p className={`text-slate-600 text-xs sm:text-sm font-medium leading-relaxed ${getTextAlignClass()}`}>
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick CTA to start Step 1 */}
          <div className="mt-12 text-center">
            <a
              href={getCleanWhatsappUrl('Hola Solux Green, quiero enviar mi recibo para comenzar el Paso 1 de cotización')}
              target="_blank"
              rel="noopener noreferrer"
              style={{ backgroundColor: config.styles?.primaryBtnColor || '#059669' }}
              className="inline-flex items-center gap-3 px-8 py-4 text-white font-extrabold text-sm uppercase tracking-wider rounded-2xl shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              <FileText className="w-5 h-5" />
              <span>Iniciar Ahora: Enviar Recibo de Luz</span>
            </a>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. SECCIÓN DE INTERACCIÓN DIRECTA (WHATSAPP CARD)                          */}
      {/* ========================================================================= */}
      <section 
        id="soluciones"
        className="py-16 lg:py-24 text-white relative overflow-hidden transition-colors"
        style={{ backgroundColor: config.styles?.whatsappCardBgColor || '#064e3b' }}
      >
        {/* Decorative background circle */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 text-emerald-300 flex items-center justify-center mx-auto shadow-inner">
            <MessageSquare className="w-8 h-8 fill-emerald-300" />
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight uppercase">
            {config.whatsappCardTitle || '¿Cuánto puedes ahorrar con tu techo? Descúbrelo hoy'}
          </h2>

          <p className={`text-base sm:text-xl text-emerald-100 font-medium max-w-2xl mx-auto leading-relaxed ${getTextAlignClass()}`}>
            {config.whatsappCardDescription || 'Tómale una foto a tu recibo de luz más reciente y envíanosla. Haremos una simulación sin ningún compromiso.'}
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#contacto"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById('contacto') || document.querySelector('#contacto');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{ backgroundColor: config.styles?.whatsappBtnColor || '#25D366' }}
              className="w-full sm:w-auto px-10 py-5 text-white font-black text-base sm:text-lg uppercase tracking-wider rounded-2xl shadow-2xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              <span>{config.whatsappCardBtnText || '📲 Enviar mi recibo'}</span>
            </a>
          </div>

          <p className="text-xs text-emerald-200/80 font-bold uppercase tracking-wider">
            Respuesta promedio: 15 minutos • Sin costo de estudio inicial
          </p>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECCIÓN DE CONTACTO: REGISTRAR PROSPECTO SOLAR (REPLICADO DE ASESOR VERDE)*/}
      {/* ========================================================================= */}
      <section 
        id="contacto" 
        className="py-20 lg:py-28 bg-slate-50 border-t border-slate-200 scroll-mt-20"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-700 bg-emerald-100/80 border border-emerald-300 px-4 py-1.5 rounded-full inline-flex items-center gap-1.5 shadow-xs">
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              Solicita Información • Cotización y Registro de Prospecto
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight uppercase">
              Contacto
            </h2>
            <p className="text-slate-600 text-sm sm:text-base font-medium max-w-2xl mx-auto leading-relaxed">
              Completa la información técnica básica de tu inmueble. Al enviar el formulario recibirás tu cálculo preliminar de inmediato y se enviará a nuestro WhatsApp oficial para asesorarte paso a paso.
            </p>
          </div>

          {/* Form Container */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl space-y-6" id="formulario-prospecto">
            
            {/* Form Success State */}
            {formSuccess ? (
              <div className="text-center py-10 space-y-5 animate-fadeIn">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div className="space-y-2 max-w-lg mx-auto">
                  <h3 className="text-2xl font-black uppercase text-slate-900">¡Información Registrada con Éxito!</h3>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                    Hemos preparado tu resumen de generación solar con <strong>{estimatedPanelsCount} paneles solares</strong> y ahorro de hasta el 98% en tu recibo de CFE.
                  </p>
                </div>

                {/* Warning Reminder in Success Modal */}
                <div className="max-w-md mx-auto p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl text-left space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-900 font-black text-xs uppercase">
                    <Camera className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Recordatorio Importante:</span>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed font-bold">
                    📸 Toma foto de tu recibo de luz, medidor, etc y envíales por este medio.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
                  {lastWhatsAppUrl && (
                    <a
                      href={lastWhatsAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <MessageSquare className="w-4 h-4 fill-white" />
                      <span>Abrir WhatsApp (+52 1 229 323 3633)</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setFormSuccess(false);
                      setFormName('');
                      setFormPhone('');
                      setFormEmail('');
                      setFormMunicipality('');
                      setFormMapsUrl('');
                      setFormSpace('');
                    }}
                    className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Llenar Otro Registro</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleProspectFormSubmit} className="space-y-6">
                
                {/* 1. Datos Generales del Cliente */}
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                    <User className="w-4 h-4 text-emerald-600" />
                    <span>1. Datos del Cliente / Contacto</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 block">
                        Nombre Completo *
                      </label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={e => setFormName(e.target.value)}
                        placeholder="Ej. Roberto Sánchez Ruiz"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 block">
                        Teléfono Celular (WhatsApp) *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formPhone}
                        onChange={e => setFormPhone(e.target.value)}
                        placeholder="Ej. 229 123 4567"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 block">
                        Correo Electrónico *
                      </label>
                      <input
                        type="email"
                        required
                        value={formEmail}
                        onChange={e => setFormEmail(e.target.value)}
                        placeholder="Ej. contacto@cliente.com"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 block">
                        Municipio y Estado *
                      </label>
                      <input
                        type="text"
                        required
                        value={formMunicipality}
                        onChange={e => setFormMunicipality(e.target.value)}
                        placeholder="Ej. Boca del Río, Veracruz"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 block">
                        Enlace de Ubicación Google Maps (Opcional)
                      </label>
                      <input
                        type="url"
                        value={formMapsUrl}
                        onChange={e => setFormMapsUrl(e.target.value)}
                        placeholder="Ej. https://maps.app.goo.gl/..."
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Información Eléctrica y del Inmueble */}
                <div className="pt-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>2. Datos de Consumo CFE y Propiedad</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 text-xs">
                    {/* Monto de Pago Recibo CFE Promedio */}
                    <div className="md:col-span-2 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 block">
                          Monto de Pago Recibo CFE Promedio ($ MXN Bimestral) *
                        </label>
                        {billNum > 0 && (
                          <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            ${billNum.toLocaleString('es-MX')} MXN
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        required
                        value={formBill}
                        onChange={e => setFormBill(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="Ej. 3500 (o selecciona abajo)"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-extrabold text-sm text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                      />

                      {/* Botones de Selección Rápida */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {[
                          { label: '$1,500', val: 1500 },
                          { label: '$2,500', val: 2500 },
                          { label: '$3,500', val: 3500 },
                          { label: '$5,000', val: 5000 },
                          { label: '$8,000', val: 8000 },
                          { label: '$12,000 (Tarifa DAC)', val: 12000 }
                        ].map(chip => (
                          <button
                            key={chip.val}
                            type="button"
                            onClick={() => setFormBill(chip.val)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer border ${
                              formBill !== '' && Number(formBill) === chip.val
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                            }`}
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Espacio Disponible en Techo */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 block">
                        Espacio Disponible en Techo (m²)
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formSpace}
                        onChange={e => setFormSpace(e.target.value.replace(/[^0-9.]/g, ''))}
                        placeholder="Ej. 40"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                      />
                    </div>

                    {/* Número de Medidores CFE */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 block">
                        Número de Medidores CFE
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formMeters}
                        onChange={e => setFormMeters(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="Ej. 1"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                      />
                    </div>

                    {/* Estatus Servicio CFE */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 block">
                        Estatus de Servicio CFE
                      </label>
                      <select
                        value={formCFE}
                        onChange={e => setFormCFE(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                      >
                        <option value="activo_sin_adeudo">Activo sin Adeudo</option>
                        <option value="con_adeudo">Con Adeudo</option>
                        <option value="inactivo">Inactivo / Nuevo Contrato</option>
                      </select>
                    </div>

                    {/* Validación de Propiedad */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 block">
                        Validación de Propiedad
                      </label>
                      <select
                        value={formOwnership}
                        onChange={e => setFormOwnership(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                      >
                        <option value="propietario">Propietario Inmueble</option>
                        <option value="arrendatario_autorizado">Arrendatario Autorizado</option>
                      </select>
                    </div>

                    {/* Forma de Pago Deseada */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 block">
                        Forma de Pago de Interés
                      </label>
                      <select
                        value={formPayMethod}
                        onChange={e => setFormPayMethod(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                      >
                        <option value="contado">Pago de Contado (5% Descuento Especial)</option>
                        <option value="directo_3">Crédito Directo 3 Meses (50% Enganche)</option>
                        <option value="directo_6">Crédito Directo 6 Meses (50% Enganche)</option>
                        <option value="msi">Meses Sin Intereses con Tarjeta de Crédito</option>
                      </select>
                    </div>

                    {/* Número de Hilos en Acometida */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 block">
                        Número de Hilos en Acometida
                      </label>
                      <select
                        value={formWires}
                        onChange={e => setFormWires(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                      >
                        <option value={2}>2 Hilos (Monofásico 110V)</option>
                        <option value={3}>3 Hilos (Bifásico 220V)</option>
                        <option value={4}>4 Hilos (Trifásico 220V/440V)</option>
                      </select>
                    </div>

                    {/* Cargas Eléctricas Deseadas */}
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 block">
                        Cargas Eléctricas Especiales (Selección Múltiple)
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {['Aire Acondicionado 220V', 'Estufa Eléctrica', 'Cargador Auto Eléctrico', 'Bomba de Agua'].map(load => {
                          const hasLoad = formLoads.includes(load);
                          return (
                            <button
                              key={load}
                              type="button"
                              onClick={() => {
                                if (hasLoad) {
                                  setFormLoads(formLoads.filter(l => l !== load));
                                } else {
                                  setFormLoads([...formLoads, load]);
                                }
                              }}
                              className={`p-2 rounded-xl border text-[11px] font-bold text-center transition-all cursor-pointer ${
                                hasLoad 
                                  ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-xs' 
                                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {hasLoad ? '✓ ' : '+ '}{load}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ADVERTENCIA PROMINENTE REQUERIDA POR EL USUARIO */}
                <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-2 border-amber-500/40 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-amber-950 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                      <span>📸 Toma foto de tu recibo de luz, medidor, etc y envíales por este medio</span>
                    </h4>
                    <p className="text-xs text-amber-900/90 leading-relaxed font-semibold">
                      Para que nuestro equipo de ingeniería pueda calcular con total precisión la inclinación, azimut y capacidad exacta para tu inmueble, por favor toma fotos con tu dispositivo móvil de: <strong>1) Ambos lados de tu recibo de CFE</strong> y <strong>2) Tu medidor o centro de carga</strong>. Al enviar tus datos se abrirá WhatsApp al <strong>+52 1 229 323 3633</strong> donde podrás compartir tus fotos al instante.
                    </p>
                  </div>
                </div>

                {/* Botón de Envío Directo a WhatsApp */}
                <button
                  type="submit"
                  disabled={formSubmitting}
                  style={{ backgroundColor: config.styles?.primaryBtnColor || '#059669' }}
                  className="w-full py-4 px-6 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-emerald-900/20 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-3 cursor-pointer"
                >
                  <Send className="w-5 h-5" />
                  <span>📲 Enviar Solicitud a WhatsApp (+52 1 229 323 3633)</span>
                </button>
              </form>
            )}

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. PREGUNTAS FRECUENTES (FAQ)                                             */}
      {/* ========================================================================= */}
      <section 
        id="faq" 
        className="py-20 lg:py-28 transition-colors border-t border-slate-200"
        style={{ backgroundColor: config.styles?.faqBgColor || '#f8fafc' }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16 space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-3.5 py-1 rounded-full inline-block">
              Respuestas Claras
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight uppercase">
              {config.faqTitle || 'Preguntas Frecuentes'}
            </h2>
            <p className={`text-base text-slate-600 font-medium max-w-xl mx-auto ${getTextAlignClass()}`}>
              {config.faqSubtitle || 'Todo lo que necesitas saber antes de dar el paso a la energía solar inteligente.'}
            </p>
          </div>

          <div className="space-y-4">
            {config.faqs.map((faq) => {
              const isOpen = expandedFaqId === faq.id;
              return (
                <div 
                  key={faq.id} 
                  className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs transition-all"
                >
                  <button
                    onClick={() => setExpandedFaqId(isOpen ? null : faq.id)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 font-bold text-slate-900 text-base sm:text-lg hover:text-emerald-600 transition-colors cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-6 pb-6 text-slate-600 text-sm sm:text-base leading-relaxed border-t border-slate-100 pt-4"
                      >
                        <p className={getTextAlignClass()}>{faq.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. FOOTER (PIE DE PÁGINA) & DIRECT SUPPORT                                */}
      {/* ========================================================================= */}
      <footer 
        className="text-slate-400 py-16 transition-colors border-t border-slate-800"
        style={{ backgroundColor: config.styles?.footerBgColor || '#020617' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Columna 1: Marca y descripción */}
            <div className="space-y-4">
              <img 
                src={config.logoUrl} 
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = SOLUX_LOGO_FALLBACK;
                }}
                alt="Solux Green" 
                className="h-10 w-auto object-contain brightness-125"
              />
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                {config.footerDescription || 'Solux Green — Soluciones de Energía Limpia y Ahorro Inteligente.'}
              </p>
              <div className="text-[11px] text-slate-500 font-mono">
                Tecnología fotovoltaica de alto rendimiento interconectada a CFE.
              </div>
            </div>

            {/* Columna 2: Contacto & Ubicación */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-white">
                Contacto Directo
              </h4>
              <ul className="space-y-2 text-xs">
                <li className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{config.contactPhone}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{config.contactEmail}</span>
                </li>
                {config.contactAddress && (
                  <li className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{config.contactAddress}</span>
                  </li>
                )}
              </ul>
            </div>

            {/* Columna 3: Enlace Directo Soporte WhatsApp */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-white">
                Soporte y Asistencia
              </h4>
              <p className="text-xs text-slate-400">
                ¿Dudas sobre tus trámites o monitoreo? Contáctanos de inmediato.
              </p>
              <a
                href={getCleanWhatsappUrl('Hola Solux Green, requiero asistencia técnica / comercial')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Enlace Directo de Soporte por WhatsApp</span>
              </a>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              © {new Date().getFullYear()} {config.brandName || 'Solux Green'}. Todos los derechos reservados.
            </div>
            <div className="flex items-center gap-6">
              <span className="hover:text-slate-400 cursor-pointer">{config.footerPrivacyText || 'Aviso de Privacidad'}</span>
              <span>•</span>
              <span className="hover:text-slate-400 cursor-pointer">{config.footerTermsText || 'Términos de Servicio'}</span>
            </div>
          </div>

        </div>
      </footer>

      {/* ========================================================================= */}
      {/* BOTÓN FLOTANTE SIEMPRE VISIBLE DE WHATSAPP EN ESQUINA INFERIOR DERECHA    */}
      {/* ========================================================================= */}
      {config.floatingWhatsappActive !== false && (
        <aside 
          aria-label="Atención en línea por WhatsApp"
          className="fixed bottom-6 right-6 z-50 flex items-center group cursor-pointer"
        >
          <div className="mr-3 px-3.5 py-1.5 bg-slate-900/90 text-white text-xs font-extrabold rounded-xl shadow-xl border border-slate-800 backdrop-blur-md hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity">
            ¿Cotizamos tu sistema solar?
          </div>
          
          <a
            href={getCleanWhatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            style={{ backgroundColor: config.styles?.whatsappBtnColor || '#25D366' }}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 active:scale-95 transition-all relative border-2 border-white/40"
            aria-label="Abrir chat de WhatsApp"
          >
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-25" />
            <MessageSquare className="w-7 h-7 sm:w-8 sm:h-8 fill-white" />
          </a>
        </aside>
      )}

    </div>
  );
}
