import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sun, Zap, ShieldCheck, TrendingDown, CheckCircle2, 
  Clock, DollarSign, Award, Smartphone, FileText, 
  Wrench, ChevronLeft, ChevronRight, MessageCircle, 
  Phone, Mail, MapPin, ArrowRight, ExternalLink, 
  HelpCircle, ChevronDown, ChevronUp, Sparkles, Building,
  Home, Factory, Settings, Users, LogIn, Send, Check
} from 'lucide-react';
import { LandingConfig, LandingSlide, SolarProject } from '../types';
import { SOLUX_LOGO_URL, SOLUX_LOGO_FALLBACK } from '../logoConfig';
import { upsertSolarProject } from '../supabaseService';

interface LandingPageProps {
  config: LandingConfig;
  onNavigateToRole?: (role: any) => void;
  onOpenAdminLanding?: () => void;
  onTriggerNotification?: (title: string, message: string, role?: string) => void;
}

export default function LandingPage({ 
  config, 
  onNavigateToRole,
  onOpenAdminLanding,
  onTriggerNotification
}: LandingPageProps) {
  // Slider active state
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const slides = config.heroSlides && config.heroSlides.length > 0 ? config.heroSlides : [];

  // Slider auto-play
  useEffect(() => {
    if (!config.sliderAutoPlay || slides.length <= 1) return;
    const intervalTime = (config.sliderIntervalSec || 6) * 1000;
    const timer = setInterval(() => {
      setCurrentSlideIndex(prev => (prev + 1) % slides.length);
    }, intervalTime);
    return () => clearInterval(timer);
  }, [config.sliderAutoPlay, config.sliderIntervalSec, slides.length]);

  const handlePrevSlide = () => {
    setCurrentSlideIndex(prev => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    setCurrentSlideIndex(prev => (prev + 1) % slides.length);
  };

  // FAQ accordion state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Fast Cotizador / Lead form state
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadCity, setLeadCity] = useState('');
  const [leadBill, setLeadBill] = useState('3500');
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState(false);

  // Estimated savings calculation based on lead bill
  const monthlyBill = Number(leadBill) || 3500;
  const estimatedAnnualBill = monthlyBill * 6; // bimestral
  const estimatedSavingsAnnual = Math.round(estimatedAnnualBill * 0.94);
  const estimatedPanels = Math.max(2, Math.ceil(monthlyBill / 750));

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName || !leadPhone) {
      alert('Por favor completa al menos tu nombre y teléfono para enviarte tu simulación.');
      return;
    }

    setLeadSubmitting(true);
    try {
      const newProjectId = `lead_landing_${Date.now()}`;
      const newLead: SolarProject = {
        id: newProjectId,
        clientName: leadName,
        clientPhone: leadPhone,
        clientEmail: leadEmail || undefined,
        municipalityState: leadCity || 'Por definir (Landing Page)',
        averageBill: monthlyBill,
        availableSpace: estimatedPanels * 2.5,
        metersCount: 1,
        cfeStatus: 'activo_sin_adeudo',
        paymentMethodDesired: 'contado',
        propertyOwnership: 'propietario',
        estimatedPanels: estimatedPanels,
        requiredArea: estimatedPanels * 2.5,
        voltageAlert220v: false,
        voltageUpgradeQuoted: false,
        totalInvestment: estimatedPanels * 11000,
        siteSurveyPaid: false,
        siteSurveyStatus: 'pendiente',
        evidence: {},
        payments: [],
        status: 'Validación',
        createdDate: new Date().toISOString(),
        createdBy: 'landing_page_public',
        createdByRole: 'client'
      };

      await upsertSolarProject(newLead);

      if (onTriggerNotification) {
        onTriggerNotification(
          'Nuevo Prospecto de Landing Page',
          `${leadName} (${leadPhone}) ha solicitado cotización con un recibo aproximado de $${monthlyBill.toLocaleString('es-MX')} MXN.`,
          'comercial'
        );
      }

      setLeadSuccess(true);
      setTimeout(() => {
        setLeadName('');
        setLeadPhone('');
        setLeadEmail('');
        setLeadCity('');
      }, 3000);
    } catch (err: any) {
      console.error('Error submitting lead:', err);
      alert('Ocurrió un error al enviar tu solicitud. Puedes comunicarte directamente vía WhatsApp.');
    } finally {
      setLeadSubmitting(false);
    }
  };

  // Font family resolution
  const getFontFamilyClass = (font: string = 'sans') => {
    switch (font) {
      case 'inter': return 'font-sans';
      case 'poppins': return 'font-sans tracking-tight';
      case 'montserrat': return 'font-sans tracking-wide';
      case 'outfit': return 'font-sans';
      case 'serif': return 'font-serif';
      case 'mono': return 'font-mono';
      default: return 'font-sans';
    }
  };

  // Text alignment helper
  const getTextAlignClass = (align?: string) => {
    switch (align) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      case 'justify': return 'text-justify';
      default: return 'text-left';
    }
  };

  // Border radius helper
  const getRadiusClass = (radius?: string) => {
    switch (radius) {
      case 'none': return 'rounded-none';
      case 'rounded-lg': return 'rounded-lg';
      case 'rounded-2xl': return 'rounded-2xl';
      case 'rounded-full': return 'rounded-full';
      default: return 'rounded-xl';
    }
  };

  const activeSlide = slides[currentSlideIndex] || slides[0] || {
    id: 'default_slide',
    imageUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1920&q=80',
    title: config.heroTitle,
    subtitle: config.heroSubtitle,
    badge: config.heroBadge,
    ctaText: config.heroCtaText,
    ctaLink: config.heroCtaLink
  };

  const primaryBtnColor = config.styles.primaryBtnColor || '#059669';
  const primaryTextColor = config.styles.primaryBtnTextColor || '#ffffff';
  const whatsappColor = config.styles.whatsappBtnColor || '#25D366';
  const fontClass = getFontFamilyClass(config.styles.fontFamily);
  const globalAlign = getTextAlignClass(config.styles.textAlign);
  const btnRadius = getRadiusClass(config.styles.btnBorderRadius);

  // WhatsApp click handler
  const handleOpenWhatsApp = (customNumber?: string, customText?: string) => {
    const rawNum = customNumber || config.contactWhatsapp || '2293233633';
    const cleanNum = rawNum.replace(/\D/g, '');
    const numWithCountry = cleanNum.startsWith('52') ? cleanNum : `52${cleanNum}`;
    const msg = encodeURIComponent(customText || config.defaultWhatsappMessage || 'Hola Solux Green, quiero cotizar un sistema de paneles solares');
    window.open(`https://wa.me/${numWithCountry}?text=${msg}`, '_blank');
  };

  // Map icon strings to Lucide components
  const renderIcon = (name?: string, className: string = 'w-6 h-6') => {
    switch (name) {
      case 'Zap': return <Zap className={className} />;
      case 'ShieldCheck': return <ShieldCheck className={className} />;
      case 'TrendingDown': return <TrendingDown className={className} />;
      case 'CheckCircle2': return <CheckCircle2 className={className} />;
      case 'Award': return <Award className={className} />;
      case 'Smartphone': return <Smartphone className={className} />;
      case 'Clock': return <Clock className={className} />;
      case 'DollarSign': return <DollarSign className={className} />;
      case 'Wrench': return <Wrench className={className} />;
      case 'Sun': return <Sun className={className} />;
      case 'Building': return <Building className={className} />;
      case 'Home': return <Home className={className} />;
      default: return <Sparkles className={className} />;
    }
  };

  return (
    <div className={`min-h-screen bg-white text-slate-900 ${fontClass} selection:bg-emerald-500 selection:text-white`}>
      
      {/* ------------------- TOP ANNOUNCEMENT BAR ------------------- */}
      <div className="bg-slate-900 text-slate-200 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="font-semibold text-emerald-400">Promoción 2026:</span>
            <span>Financiamiento directo a 3 y 6 meses con 50% de enganche</span>
          </div>

          <div className="flex items-center gap-4">
            {config.contactPhones && config.contactPhones.length > 0 && (
              <a 
                href={`tel:${config.contactPhones[0].number.replace(/\D/g, '')}`} 
                className="hover:text-white flex items-center gap-1 font-medium transition-colors"
              >
                <Phone className="w-3 h-3 text-emerald-400" />
                <span>{config.contactPhones[0].number}</span>
              </a>
            )}
            {config.contactEmail && (
              <a 
                href={`mailto:${config.contactEmail}`} 
                className="hidden sm:flex items-center gap-1 hover:text-white transition-colors"
              >
                <Mail className="w-3 h-3 text-emerald-400" />
                <span>{config.contactEmail}</span>
              </a>
            )}
            {onOpenAdminLanding && (
              <button
                onClick={onOpenAdminLanding}
                className="px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                title="Abrir Panel de Administración de la Landing Page"
              >
                <Settings className="w-3 h-3" /> Admin Landing
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ------------------- NAVIGATION HEADER ------------------- */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Logo */}
          <a href="#" className="flex items-center gap-3 shrink-0">
            <img 
              src={config.logoUrl || SOLUX_LOGO_URL} 
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = SOLUX_LOGO_FALLBACK;
              }}
              alt={config.brandName || "Solux Green"} 
              className="h-10 sm:h-12 w-auto object-contain"
            />
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-700">
            {config.headerMenuItems && config.headerMenuItems.map(item => (
              <a 
                key={item.id} 
                href={item.href}
                className="hover:text-emerald-600 transition-colors py-1 relative group"
              >
                {item.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-500 transition-all duration-300 group-hover:w-full"></span>
              </a>
            ))}
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => handleOpenWhatsApp()}
              style={{ backgroundColor: whatsappColor }}
              className={`hidden sm:inline-flex items-center gap-2 px-4 py-2.5 text-white font-bold text-xs uppercase tracking-wider shadow-sm hover:opacity-95 transition-all cursor-pointer ${btnRadius}`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>{config.headerCtaText || 'Cotizar por WhatsApp'}</span>
            </button>

            {onNavigateToRole && (
              <button
                onClick={() => onNavigateToRole('public_client_reg')}
                style={{ backgroundColor: primaryBtnColor, color: primaryTextColor }}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 font-bold text-xs uppercase tracking-wider shadow-md hover:brightness-110 transition-all cursor-pointer ${btnRadius}`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Cotizador Exprés</span>
              </button>
            )}

            {onNavigateToRole && (
              <button
                onClick={() => onNavigateToRole(null)}
                className="p-2 sm:px-3 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                title="Acceder a Perfiles y Sistema"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden lg:inline text-[11px] uppercase">Portal</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ------------------- HERO SLIDER SECTION ------------------- */}
      <section 
        className="relative overflow-hidden text-white min-h-[580px] lg:min-h-[660px] flex items-center"
        style={{ backgroundColor: config.styles.heroBgColor || '#0f172a' }}
        id="hero"
      >
        {/* Slider Background Image with transition */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide.id || currentSlideIndex}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${activeSlide.imageUrl || 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1920&q=80'})`
            }}
          >
            {/* Gradient Overlays for optimal readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-900/60"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40"></div>
          </motion.div>
        </AnimatePresence>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 w-full">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            <div className={`lg:col-span-7 space-y-6 ${activeSlide.textAlign === 'center' ? 'text-center' : activeSlide.textAlign === 'right' ? 'text-right' : 'text-left'}`}>
              
              {/* Badge */}
              <motion.div
                key={`badge-${currentSlideIndex}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-bold text-xs uppercase tracking-wider backdrop-blur-sm"
              >
                <Sun className="w-3.5 h-3.5 text-emerald-400 animate-spin-slow" />
                <span>{activeSlide.badge || config.heroBadge}</span>
              </motion.div>

              {/* Title */}
              <motion.h1
                key={`title-${currentSlideIndex}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white"
              >
                {activeSlide.title || config.heroTitle}
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                key={`subtitle-${currentSlideIndex}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className={`text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-2xl ${globalAlign}`}
              >
                {activeSlide.subtitle || config.heroSubtitle}
              </motion.p>

              {/* Buttons */}
              <motion.div
                key={`cta-${currentSlideIndex}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="pt-2 flex flex-wrap gap-4 items-center"
              >
                <a
                  href={activeSlide.ctaLink || '#contacto'}
                  style={{
                    backgroundColor: activeSlide.ctaBgColor || primaryBtnColor,
                    color: activeSlide.ctaTextColor || primaryTextColor
                  }}
                  className={`inline-flex items-center gap-2 px-6 py-4 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-900/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer ${btnRadius}`}
                >
                  <span>{activeSlide.ctaText || config.heroCtaText || 'Solicitar Cotización Gratis'}</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                {activeSlide.secondaryCtaText && (
                  <a
                    href={activeSlide.secondaryCtaLink || '#soluciones'}
                    style={{
                      backgroundColor: activeSlide.secondaryCtaBgColor || 'rgba(255, 255, 255, 0.1)',
                      color: activeSlide.secondaryCtaTextColor || '#ffffff'
                    }}
                    className={`inline-flex items-center gap-2 px-5 py-4 font-bold text-xs uppercase tracking-wider backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all cursor-pointer ${btnRadius}`}
                  >
                    <span>{activeSlide.secondaryCtaText}</span>
                  </a>
                )}
              </motion.div>

              {/* Trust Tag */}
              <div className="pt-2 flex items-center gap-2 text-xs text-slate-400 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{config.heroTrustText || 'Asesoría técnica sin costo • Respuesta en menos de 15 minutos'}</span>
              </div>
            </div>

            {/* Quick Interactive Estimator Box in Hero */}
            <div className="lg:col-span-5">
              <div className="bg-slate-900/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-5 text-left">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">Estimador Rápido</span>
                    <h3 className="text-lg font-black text-white">Calcula tu Ahorro Estimado</h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Zap className="w-5 h-5" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 font-semibold mb-1.5">
                      <span>¿Cuánto pagas de luz al bimestre?</span>
                      <span className="text-emerald-400 font-mono font-bold text-sm">
                        ${Number(leadBill).toLocaleString('es-MX')} MXN
                      </span>
                    </div>
                    <input 
                      type="range"
                      min="1500"
                      max="35000"
                      step="500"
                      value={leadBill}
                      onChange={(e) => setLeadBill(e.target.value)}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-1">
                      <span>$1,500</span>
                      <span>$15,000</span>
                      <span>$35,000+</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 bg-slate-800/80 border border-slate-700/60 rounded-2xl">
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">Ahorro Anual Proyectado</span>
                      <span className="text-lg font-black text-emerald-400 font-mono">
                        ${estimatedSavingsAnnual.toLocaleString('es-MX')} <span className="text-[10px] font-sans">/año</span>
                      </span>
                    </div>
                    <div className="p-3 bg-slate-800/80 border border-slate-700/60 rounded-2xl">
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">Paneles Sugeridos</span>
                      <span className="text-lg font-black text-sky-400 font-mono">
                        {estimatedPanels} <span className="text-[10px] font-sans">módulos</span>
                      </span>
                    </div>
                  </div>

                  <a
                    href="#contacto"
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> Quiero Congelar este Ahorro
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Slider Controls (Next / Prev arrows & Dots) */}
        {slides.length > 1 && (
          <>
            <button
              onClick={handlePrevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-slate-900/60 hover:bg-slate-900/90 text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all cursor-pointer shadow-lg"
              aria-label="Slide anterior"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-slate-900/60 hover:bg-slate-900/90 text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all cursor-pointer shadow-lg"
              aria-label="Slide siguiente"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`h-2.5 rounded-full transition-all cursor-pointer ${idx === currentSlideIndex ? 'w-8 bg-emerald-400' : 'w-2.5 bg-white/40 hover:bg-white/70'}`}
                  aria-label={`Ir al slide ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* ------------------- STATS & TRUST BAR ------------------- */}
      <section 
        className="py-12 border-b border-slate-800 text-white"
        style={{ backgroundColor: config.styles.statsBgColor || '#1e293b' }}
        id="stats"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
            {config.stats && config.stats.map(stat => (
              <div key={stat.id} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-xs">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  {renderIcon(stat.iconName, 'w-6 h-6')}
                </div>
                <div>
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight block">
                    {stat.value}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-200 block">
                    {stat.label}
                  </span>
                  {stat.description && (
                    <span className="text-[11px] text-slate-400 block pt-0.5 leading-tight">
                      {stat.description}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------- BENEFITS SECTION ------------------- */}
      <section 
        className="py-20 lg:py-28"
        style={{ backgroundColor: config.styles.benefitsBgColor || '#f8fafc' }}
        id="beneficios"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              Ventajas Competitivas
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
              {config.benefitsTitle}
            </h2>
            <p className={`text-base text-slate-600 max-w-2xl mx-auto ${globalAlign}`}>
              {config.benefitsSubtitle}
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {config.benefits && config.benefits.map((benefit, idx) => (
              <div 
                key={benefit.id}
                className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {benefit.imageUrl ? (
                    <div className="w-full h-40 rounded-2xl overflow-hidden mb-6 relative">
                      <img 
                        src={benefit.imageUrl} 
                        alt={benefit.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 w-9 h-9 rounded-xl bg-white/90 backdrop-blur-md text-emerald-600 flex items-center justify-center shadow-md">
                        {renderIcon(benefit.iconName, 'w-5 h-5')}
                      </div>
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                      {renderIcon(benefit.iconName, 'w-7 h-7')}
                    </div>
                  )}

                  <h3 className="text-lg font-black text-slate-900 mb-2 leading-snug">
                    {benefit.title}
                  </h3>
                  <p className={`text-xs text-slate-600 leading-relaxed ${globalAlign}`}>
                    {benefit.description}
                  </p>
                </div>

                <div className="pt-5 mt-4 border-t border-slate-100 flex items-center text-[11px] font-black text-emerald-600 gap-1 uppercase tracking-wider">
                  <span>Beneficio Garantizado</span>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------- SOLUTIONS SECTION ------------------- */}
      {config.solutions && config.solutions.length > 0 && (
        <section 
          className="py-20 lg:py-28 text-slate-900 border-t border-slate-100"
          style={{ backgroundColor: config.styles.solutionsBgColor || '#ffffff' }}
          id="soluciones"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center space-y-3 mb-16">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                Soluciones Fotovoltaicas
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
                {config.solutionsTitle || 'Nuestras Soluciones Solares'}
              </h2>
              <p className={`text-base text-slate-600 max-w-2xl mx-auto ${globalAlign}`}>
                {config.solutionsSubtitle || 'Diseñadas para maximizar tu ahorro con tecnología de primer nivel.'}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {config.solutions.map((sol) => (
                <div 
                  key={sol.id}
                  className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {sol.imageUrl && (
                      <div className="relative h-48 w-full overflow-hidden">
                        <img 
                          src={sol.imageUrl} 
                          alt={sol.title} 
                          className="w-full h-full object-cover"
                        />
                        {sol.badge && (
                          <span className="absolute top-4 right-4 bg-emerald-600 text-white font-extrabold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                            {sol.badge}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="p-6 sm:p-8 space-y-4">
                      <h3 className="text-xl font-black text-slate-900">
                        {sol.title}
                      </h3>
                      <p className={`text-xs text-slate-600 leading-relaxed ${globalAlign}`}>
                        {sol.description}
                      </p>

                      {sol.features && sol.features.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          {sol.features.map((feat, fIdx) => (
                            <div key={fIdx} className="flex items-center gap-2 text-xs text-slate-700">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-6 sm:p-8 pt-0">
                    <a
                      href={sol.buttonLink || '#contacto'}
                      style={{ backgroundColor: sol.buttonColor || primaryBtnColor }}
                      className={`w-full py-3.5 text-white font-black text-xs uppercase tracking-wider shadow-md hover:opacity-95 transition-all text-center flex items-center justify-center gap-2 cursor-pointer ${btnRadius}`}
                    >
                      <span>{sol.buttonText || 'Cotizar Esta Solución'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ------------------- REAL PROJECTS GALLERY ------------------- */}
      {config.gallery && config.gallery.length > 0 && (
        <section 
          className="py-20 lg:py-28 bg-slate-900 text-white"
          style={{ backgroundColor: config.styles.galleryBgColor || '#0f172a' }}
          id="proyectos"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center space-y-3 mb-16">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
                Casos de Éxito
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                {config.galleryTitle || 'Proyectos Instalados y Casos de Éxito'}
              </h2>
              <p className={`text-base text-slate-300 max-w-2xl mx-auto ${globalAlign}`}>
                {config.gallerySubtitle || 'Instalaciones reales generando energía limpia y reduciendo costos todos los días.'}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {config.gallery.map((proj) => (
                <div 
                  key={proj.id}
                  className="bg-slate-800/90 rounded-3xl border border-slate-700 overflow-hidden shadow-xl hover:scale-[1.02] transition-transform duration-300 flex flex-col justify-between"
                >
                  <div className="relative h-56 w-full">
                    <img 
                      src={proj.imageUrl} 
                      alt={proj.title} 
                      className="w-full h-full object-cover"
                    />
                    {proj.category && (
                      <span className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md text-emerald-400 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-emerald-500/30">
                        {proj.category}
                      </span>
                    )}
                  </div>

                  <div className="p-6 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{proj.location || 'México'}</span>
                    </div>

                    <h3 className="text-lg font-black text-white">
                      {proj.title}
                    </h3>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/60 text-xs">
                      <div>
                        <span className="text-[10px] uppercase text-slate-400 block font-bold">Capacidad</span>
                        <span className="font-black text-white font-mono">{proj.powerKw || '8 kWp'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-slate-400 block font-bold">Ahorro Anual</span>
                        <span className="font-black text-emerald-400 font-mono">{proj.savingsAnnual || 'Ahorro Alto'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ------------------- PROCESS IN 4 STEPS ------------------- */}
      <section 
        className="py-20 lg:py-28"
        style={{ backgroundColor: config.styles.processBgColor || '#ffffff' }}
        id="proceso"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              Facilidad y Rapidez
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
              {config.processTitle}
            </h2>
            <p className={`text-base text-slate-600 max-w-2xl mx-auto ${globalAlign}`}>
              {config.processSubtitle}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {config.steps && config.steps.map((step, idx) => (
              <div 
                key={step.id} 
                className="bg-slate-50/80 rounded-3xl p-6 sm:p-8 border border-slate-200/80 relative flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                      0{step.stepNumber || idx + 1}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-500 flex items-center justify-center">
                      {renderIcon(step.iconName, 'w-5 h-5')}
                    </div>
                  </div>

                  <h3 className="text-base font-black text-slate-900 mb-2 leading-snug">
                    {step.title}
                  </h3>
                  <p className={`text-xs text-slate-600 leading-relaxed ${globalAlign}`}>
                    {step.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-200/60 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Paso {step.stepNumber || idx + 1} de 4
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------- DIRECT WHATSAPP BANNER ------------------- */}
      <section 
        className="py-16 text-white relative overflow-hidden"
        style={{ backgroundColor: config.styles.whatsappCardBgColor || '#064e3b' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-8 space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-300 font-bold text-xs uppercase tracking-wider border border-white/10">
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Atención Rápida por WhatsApp</span>
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
                {config.whatsappCardTitle}
              </h2>
              <p className={`text-sm sm:text-base text-emerald-100 max-w-2xl leading-relaxed ${globalAlign}`}>
                {config.whatsappCardDescription}
              </p>
            </div>

            <div className="lg:col-span-4 flex justify-start lg:justify-end">
              <button
                onClick={() => handleOpenWhatsApp()}
                style={{ backgroundColor: whatsappColor }}
                className={`px-8 py-5 text-white font-black text-sm uppercase tracking-wider shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 cursor-pointer ${btnRadius}`}
              >
                <MessageCircle className="w-6 h-6" />
                <span>{config.whatsappCardBtnText || 'Enviar mi Recibo por WhatsApp'}</span>
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ------------------- CONTACT & LEAD CAPTURE SECTION ------------------- */}
      <section 
        className="py-20 lg:py-28"
        style={{ backgroundColor: config.styles.contactBgColor || '#f8fafc' }}
        id="contacto"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            
            {/* Left: Contact Info */}
            <div className="lg:col-span-5 space-y-8">
              <div className="space-y-3">
                <span className="text-xs font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                  Canales Oficiales
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  Contáctanos y Visítanos
                </h2>
                <p className={`text-sm text-slate-600 leading-relaxed ${globalAlign}`}>
                  Estamos disponibles para resolver cualquier duda sobre tu consumo, el trámite con CFE y los esquemas de financiamiento disponibles.
                </p>
              </div>

              {/* Phones List */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Teléfonos de Contacto</h4>
                {config.contactPhones && config.contactPhones.map(phone => (
                  <div key={phone.id} className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${phone.isWhatsApp ? 'bg-emerald-50 text-emerald-600' : 'bg-sky-50 text-sky-600'}`}>
                        {phone.isWhatsApp ? <MessageCircle className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">{phone.label}</span>
                        <span className="text-sm font-black text-slate-900 font-mono">{phone.number}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {phone.isWhatsApp && (
                        <button
                          onClick={() => handleOpenWhatsApp(phone.number)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                        >
                          <MessageCircle className="w-3 h-3" /> WhatsApp
                        </button>
                      )}
                      <a
                        href={`tel:${phone.number.replace(/\D/g, '')}`}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition-colors"
                        title="Llamar directamente"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {/* Emails List */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Correos Electrónicos</h4>
                {config.contactEmails && config.contactEmails.map(mail => (
                  <a 
                    key={mail.id} 
                    href={`mailto:${mail.email}`}
                    className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center gap-3 shadow-xs hover:border-emerald-300 transition-colors block"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">{mail.label}</span>
                      <span className="text-xs sm:text-sm font-black text-slate-800 break-all">{mail.email}</span>
                    </div>
                  </a>
                ))}
              </div>

              {/* Address & Hours */}
              <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Dirección Corporativa</span>
                    <p className="text-xs font-semibold text-slate-800 leading-snug">{config.contactAddress}</p>
                    {config.googleMapsUrl && (
                      <a 
                        href={config.googleMapsUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 mt-1"
                      >
                        <span>Ver en Google Maps</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                {config.businessHours && (
                  <div className="flex items-start gap-3 pt-3 border-t border-slate-100">
                    <Clock className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Horario de Atención</span>
                      <p className="text-xs font-medium text-slate-700">{config.businessHours}</p>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Right: Lead Capture Form */}
            <div className="lg:col-span-7">
              <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl space-y-6">
                
                <div>
                  <span className="text-xs font-black uppercase tracking-widest text-emerald-600">
                    {config.leadFormBadge || 'Cotización Inmediata'}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                    {config.leadFormTitle || 'Solicita tu Propuesta Solar Sin Costo'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    {config.leadFormSubtitle || 'Ingresa tus datos y un Asesor Verde se pondrá en contacto contigo en menos de 15 minutos.'}
                  </p>
                </div>

                {leadSuccess ? (
                  <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                    <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
                      <Check className="w-7 h-7" />
                    </div>
                    <h4 className="text-xl font-black text-slate-900">¡Solicitud Recibida con Éxito!</h4>
                    <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                      Tu cotización preliminar para un promedio de <strong>${Number(leadBill).toLocaleString('es-MX')} MXN</strong> está en proceso. Te contactaremos vía WhatsApp para enviarte los detalles.
                    </p>
                    <button
                      onClick={() => setLeadSuccess(false)}
                      className="px-5 py-2.5 bg-emerald-600 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer"
                    >
                      Enviar otra cotización
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleLeadSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tu Nombre Completo *</label>
                        <input 
                          type="text" 
                          required
                          placeholder="Ej. Ing. Roberto Garza" 
                          value={leadName}
                          onChange={(e) => setLeadName(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Teléfono / WhatsApp *</label>
                        <input 
                          type="tel" 
                          required
                          placeholder="Ej. 81 1234 5678" 
                          value={leadPhone}
                          onChange={(e) => setLeadPhone(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Correo Electrónico (Opcional)</label>
                        <input 
                          type="email" 
                          placeholder="correo@ejemplo.com" 
                          value={leadEmail}
                          onChange={(e) => setLeadEmail(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Municipio / Estado</label>
                        <input 
                          type="text" 
                          placeholder="Ej. Monterrey, N.L." 
                          value={leadCity}
                          onChange={(e) => setLeadCity(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Pago Promedio Bimestral de Luz CFE ($ MXN)</label>
                      <input 
                        type="number" 
                        min="500"
                        step="100"
                        value={leadBill}
                        onChange={(e) => setLeadBill(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-emerald-700 font-mono focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={leadSubmitting}
                        style={{ backgroundColor: primaryBtnColor, color: primaryTextColor }}
                        className={`w-full py-4 font-black text-xs uppercase tracking-wider shadow-xl hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer ${btnRadius} ${leadSubmitting ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <Send className="w-4 h-4" />
                        <span>{leadSubmitting ? 'Procesando Cotización...' : 'Enviar y Recibir Propuesta Solar'}</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-400 text-center pt-1">
                      🔒 Tus datos están protegidos bajo estricto aviso de privacidad. No enviamos spam.
                    </p>
                  </form>
                )}

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ------------------- FREQUENTLY ASKED QUESTIONS (FAQ) ------------------- */}
      <section 
        className="py-20 lg:py-28 border-t border-slate-100"
        style={{ backgroundColor: config.styles.faqBgColor || '#f8fafc' }}
        id="faq"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              Resuelve tus Dudas
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
              {config.faqTitle}
            </h2>
            <p className={`text-base text-slate-600 ${globalAlign}`}>
              {config.faqSubtitle}
            </p>
          </div>

          <div className="space-y-4">
            {config.faqs && config.faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div 
                  key={faq.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs transition-all"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 font-black text-sm sm:text-base text-slate-900 hover:text-emerald-600 transition-colors cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform ${isOpen ? 'bg-emerald-50 text-emerald-600 rotate-180' : 'bg-slate-50 text-slate-400'}`}>
                      <ChevronDown className="w-4 h-4" />
                    </span>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-50">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------- FOOTER ------------------- */}
      <footer 
        className="py-14 text-slate-400 text-xs border-t border-slate-800"
        style={{ backgroundColor: config.styles.footerBgColor || '#020617' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 pb-12 border-b border-slate-800">
            
            {/* Brand column */}
            <div className="md:col-span-2 space-y-4">
              <img 
                src={config.logoUrl || SOLUX_LOGO_URL} 
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = SOLUX_LOGO_FALLBACK;
                }}
                alt={config.brandName || "Solux Green"} 
                className="h-10 w-auto object-contain brightness-0 invert opacity-90"
              />
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                {config.footerDescription || 'Solux Green — Soluciones de Energía Limpia y Ahorro Inteligente en México.'}
              </p>
              <div className="flex items-center gap-3 pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 text-[10px] font-bold uppercase">
                  <ShieldCheck className="w-3.5 h-3.5" /> NOM & CFE Certificado
                </span>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-3">
              <h5 className="text-xs font-black uppercase tracking-widest text-slate-200">Navegación</h5>
              <ul className="space-y-2 text-xs">
                <li><a href="#hero" className="hover:text-white transition-colors">Inicio</a></li>
                <li><a href="#beneficios" className="hover:text-white transition-colors">Beneficios</a></li>
                <li><a href="#soluciones" className="hover:text-white transition-colors">Soluciones</a></li>
                <li><a href="#proyectos" className="hover:text-white transition-colors">Casos de Éxito</a></li>
                <li><a href="#proceso" className="hover:text-white transition-colors">Proceso de Instalación</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">Preguntas Frecuentes</a></li>
              </ul>
            </div>

            {/* System / Administration Links */}
            <div className="space-y-3">
              <h5 className="text-xs font-black uppercase tracking-widest text-slate-200">Acceso al Sistema</h5>
              <ul className="space-y-2 text-xs">
                {onOpenAdminLanding && (
                  <li>
                    <button 
                      onClick={onOpenAdminLanding}
                      className="hover:text-emerald-400 transition-colors font-bold flex items-center gap-1.5 cursor-pointer text-emerald-500"
                    >
                      <Settings className="w-3.5 h-3.5" /> Administrar Landing Page
                    </button>
                  </li>
                )}
                {onNavigateToRole && (
                  <>
                    <li>
                      <button 
                        onClick={() => onNavigateToRole('public_client_reg')}
                        className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5 text-emerald-400" /> Cotizador Público
                      </button>
                    </li>
                    <li>
                      <button 
                        onClick={() => onNavigateToRole('public_enlace_reg')}
                        className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5 text-pink-400" /> Registro Asesor de Enlace
                      </button>
                    </li>
                    <li>
                      <button 
                        onClick={() => onNavigateToRole(null)}
                        className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-slate-300 font-bold"
                      >
                        <LogIn className="w-3.5 h-3.5" /> Inicio de Sesión de Equipo
                      </button>
                    </li>
                  </>
                )}
              </ul>
            </div>

          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <span>© {new Date().getFullYear()} {config.brandName || 'Solux Green'}. Todos los derechos reservados.</span>
            <div className="flex items-center gap-6">
              <a href="#contacto" className="hover:text-slate-300 transition-colors">{config.footerPrivacyText || 'Aviso de Privacidad'}</a>
              <a href="#contacto" className="hover:text-slate-300 transition-colors">{config.footerTermsText || 'Términos de Servicio'}</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ------------------- FLOATING WHATSAPP BUTTON ------------------- */}
      {config.floatingWhatsappActive && (
        <button
          onClick={() => handleOpenWhatsApp()}
          style={{ backgroundColor: whatsappColor }}
          className="fixed bottom-6 right-6 z-50 p-4 rounded-full text-white shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer group"
          aria-label="Abrir WhatsApp"
          title="¿Dudas? Chatea con un asesor en WhatsApp"
        >
          <MessageCircle className="w-7 h-7" />
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-500 ease-in-out font-bold text-xs uppercase tracking-wider pl-0 group-hover:pl-2">
            Cotizar por WhatsApp
          </span>
        </button>
      )}

    </div>
  );
}
