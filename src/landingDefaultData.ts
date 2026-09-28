import { LandingConfig } from './types';
import { SOLUX_LOGO_URL } from './logoConfig';

export const DEFAULT_LANDING_CONFIG: LandingConfig = {
  id: 'default',
  brandName: 'Solux Green',
  logoUrl: SOLUX_LOGO_URL,
  contactWhatsapp: '2293233633',
  contactPhone: '229 323 3633',
  contactEmail: 'contacto@soluxgreen.com.mx',
  contactAddress: 'Av. Paseo de la Reforma 222, Cuauhtémoc, CDMX, México',
  defaultWhatsappMessage: 'Hola Solux Green, quiero cotizar un sistema de paneles solares',
  businessHours: 'Lunes a Viernes: 8:00 AM - 7:00 PM | Sábados: 9:00 AM - 2:00 PM',
  googleMapsUrl: 'https://maps.google.com/?q=Paseo+de+la+Reforma+222+CDMX',
  contactPhones: [
    { id: 'phone_1', label: 'Ventas & Cotizaciones (WhatsApp)', number: '229 323 3633', isWhatsApp: true },
    { id: 'phone_2', label: 'Atención a Clientes & Soporte', number: '55 1234 5678', isWhatsApp: false }
  ],
  contactEmails: [
    { id: 'email_1', label: 'Atención General', email: 'contacto@soluxgreen.com.mx' },
    { id: 'email_2', label: 'Departamento Comercial', email: 'cotizaciones@soluxgreen.com.mx' }
  ],

  // 1. Barra de Navegación (Header)
  headerMenuItems: [
    { id: 'menu_beneficios', label: 'Beneficios', href: '#beneficios' },
    { id: 'menu_soluciones', label: 'Soluciones', href: '#soluciones' },
    { id: 'menu_proyectos', label: 'Proyectos', href: '#proyectos' },
    { id: 'menu_proceso', label: 'Proceso', href: '#proceso' },
    { id: 'menu_contacto', label: 'Contacto', href: '#contacto' },
    { id: 'menu_faq', label: 'FAQ', href: '#faq' }
  ],
  headerCtaText: 'Cotizar por WhatsApp',
  headerCtaLink: 'https://wa.me/5212293233633?text=Hola%20Solux%20Green,%20quiero%20cotizar%20un%20sistema%20de%20paneles%20solares',

  // 2. Sección Hero (Slider de Imágenes / Hero Banner)
  heroBadge: 'Ahorra hasta un 98% en tu recibo de CFE',
  heroTitle: 'Transforma la luz del sol en ahorro real para tu hogar o negocio',
  heroSubtitle: 'Diseñamos e instalamos sistemas de paneles solares a tu medida con tecnología de máxima eficiencia, garantía por escrito y gestión total de interconexión con CFE.',
  heroCtaText: '👉 Solicitar Cotización Gratis por WhatsApp',
  heroCtaLink: 'https://wa.me/5212293233633?text=Hola%20Solux%20Green,%20quiero%20cotizar%20un%20sistema%20de%20paneles%20solares',
  heroTrustText: 'Asesoría técnica sin costo • Respuesta en menos de 15 minutos',
  heroSlides: [
    {
      id: 'slide_1',
      imageUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1920&q=80',
      badge: '⚡ Ahorra hasta un 98% en tu recibo de CFE',
      title: 'Transforma la luz del sol en ahorro real para tu hogar o negocio',
      subtitle: 'Instalaciones fotovoltaicas de ultra alta eficiencia con garantía por escrito de 25 años.',
      ctaText: '👉 Solicitar Cotización Gratis',
      ctaLink: '#contacto',
      ctaBgColor: '#059669',
      ctaTextColor: '#ffffff',
      secondaryCtaText: 'Conocer Soluciones',
      secondaryCtaLink: '#soluciones',
      textAlign: 'left',
      alt: 'Paneles solares monocristalinos instalados en techo'
    },
    {
      id: 'slide_2',
      imageUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=1920&q=80',
      badge: '🏢 Soluciones Comerciales e Industriales',
      title: 'Protege a tu empresa contra las alzas de tarifas eléctricas',
      subtitle: 'Retorno de inversión acelerado de 2 a 3 años y 100% deducible de impuestos el primer año.',
      ctaText: '📲 Cotizar para mi Negocio',
      ctaLink: 'https://wa.me/5212293233633?text=Hola%20Solux%20Green,%20quiero%20cotizar%20para%20mi%20empresa',
      ctaBgColor: '#0284c7',
      ctaTextColor: '#ffffff',
      secondaryCtaText: 'Ver Casos de Éxito',
      secondaryCtaLink: '#proyectos',
      textAlign: 'left',
      alt: 'Instalación industrial y comercial de paneles solares'
    },
    {
      id: 'slide_3',
      imageUrl: 'https://images.unsplash.com/photo-1497440001374-f26997328c1b?auto=format&fit=crop&w=1920&q=80',
      badge: '🤝 Red de Asesores de Enlace',
      title: 'Gana Dinero Sin Vender refiriendo proyectos solares',
      subtitle: 'Únete como Asesor de Enlace y recibe atractivas comisiones por cada proyecto cerrado.',
      ctaText: '🚀 Quiero ser Asesor de Enlace',
      ctaLink: '#enlace',
      ctaBgColor: '#e11d48',
      ctaTextColor: '#ffffff',
      secondaryCtaText: 'Más Información',
      secondaryCtaLink: '#beneficios',
      textAlign: 'center',
      alt: 'Red de alianzas y asesores de enlace Solux Green'
    }
  ],
  sliderAutoPlay: true,
  sliderIntervalSec: 6,

  // 3. Barra de Estadísticas y Confianza (Social Proof)
  stats: [
    {
      id: 'stat_1',
      value: '+98%',
      label: 'Reducción en costos',
      description: 'de electricidad en tu recibo CFE',
      iconName: 'Zap'
    },
    {
      id: 'stat_2',
      value: '25 Años',
      label: 'Garantía de rendimiento',
      description: 'en paneles solares certificados',
      iconName: 'ShieldCheck'
    },
    {
      id: 'stat_3',
      value: '100% Legal',
      label: 'Trámites de interconexión',
      description: 'gestión total con CFE incluida',
      iconName: 'Award'
    },
    {
      id: 'stat_4',
      value: 'Monitoreo 24/7',
      label: 'Seguimiento de generación',
      description: 'en tiempo real desde tu celular',
      iconName: 'Smartphone'
    }
  ],

  // 4. Beneficios Clave: ¿Por qué instalar paneles con Solux Green?
  benefitsTitle: '¿Por qué instalar paneles con Solux Green?',
  benefitsSubtitle: 'Energía limpia, protección frente a aumentos tarifarios y el mejor retorno de inversión garantizado.',
  benefits: [
    {
      id: 'benefit_1',
      title: 'Adiós a la tarifa DAC y recibos altos',
      description: 'Paga lo mínimo y protégete contra los futuros aumentos de tarifas de luz.',
      iconName: 'TrendingDown',
      imageUrl: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'benefit_2',
      title: 'Llave en mano (Sin dolores de cabeza)',
      description: 'Nosotros nos encargamos de todo: visita técnica, ingeniería, permisos, instalación y medidor bidireccional de CFE.',
      iconName: 'CheckCircle2',
      imageUrl: 'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'benefit_3',
      title: 'Equipos de Grado Industrial',
      description: 'Paneles de alta durabilidad y microinversores/inversores certificados de primera categoría.',
      iconName: 'Cpu',
      imageUrl: 'https://images.unsplash.com/photo-1545209584-0a373b508fec?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'benefit_4',
      title: 'Retorno de Inversión Rápido',
      description: 'Recupera tu inversión en un periodo de 2 a 4 años y disfruta más de 20 años de energía prácticamente gratuita.',
      iconName: 'DollarSign',
      imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80'
    }
  ],

  // 4b. Soluciones Solares
  solutionsTitle: 'Nuestras Soluciones Solares',
  solutionsSubtitle: 'Tecnología adaptada al tamaño y requerimientos energéticos de tu inmueble.',
  solutions: [
    {
      id: 'sol_res',
      title: 'Residencial de Alta Eficiencia',
      description: 'Ideal para residencias familiares, casas de descanso y usuarios en tarifa de alto consumo (DAC).',
      badge: 'Más Popular',
      imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
      features: ['Monitoreo App en tiempo real', 'Microinversores Enphase/Hoymiles', 'Interconexión CFE garantizada', 'Garantía 25 años'],
      buttonText: 'Cotizar Residencial',
      buttonLink: '#contacto',
      buttonColor: '#059669'
    },
    {
      id: 'sol_com',
      title: 'Comercial & Negocios (Pymes)',
      description: 'Optimiza la rentabilidad de tu comercio, oficinas, bodegas, consultorios o restaurantes.',
      badge: '100% Deducible',
      imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
      features: ['Deducción acelerada ISR primer año', 'Inversores trifásicos de alta potencia', 'Blindaje contra aumentos CFE', 'Soporte y mantenimiento preventivo'],
      buttonText: 'Cotizar Comercial',
      buttonLink: '#contacto',
      buttonColor: '#0284c7'
    },
    {
      id: 'sol_ind',
      title: 'Industrial & Media Tensión',
      description: 'Ingeniería a gran escala para plantas productivas, naves industriales y sectores agropecuarios.',
      badge: 'Gran Escala',
      imageUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=800&q=80',
      features: ['Estudio de calidad de energía', 'Sistemas interconectados a media tensión', 'Póliza de mantenimiento integral', 'Financiamiento leasing o crédito directo'],
      buttonText: 'Solicitar Asesoría',
      buttonLink: '#contacto',
      buttonColor: '#4f46e5'
    }
  ],

  // 4c. Galería de Proyectos Reales
  galleryTitle: 'Proyectos Instalados y Casos de Éxito',
  gallerySubtitle: 'Conoce algunas de nuestras instalaciones operando al 100% en México.',
  gallery: [
    {
      id: 'proj_1',
      title: 'Residencia Familiar Las Cumbres',
      category: 'Residencial',
      location: 'Monterrey, N.L.',
      powerKw: '7.8 kWp',
      savingsAnnual: '$34,500 MXN / año',
      imageUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'proj_2',
      title: 'Bodega Logística del Norte',
      category: 'Comercial',
      location: 'San Nicolás, N.L.',
      powerKw: '36.5 kWp',
      savingsAnnual: '$158,000 MXN / año',
      imageUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'proj_3',
      title: 'Clínica Médica Especializada',
      category: 'Comercial',
      location: 'Guadalajara, Jal.',
      powerKw: '16.2 kWp',
      savingsAnnual: '$72,000 MXN / año',
      imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80'
    }
  ],

  // 5. Nuestro Proceso en 4 Pasos Simples
  processTitle: 'Nuestro Proceso en 4 Pasos Simples',
  processSubtitle: 'De tu recibo de luz actual a tu propio sistema solar generando energía en tiempo récord.',
  steps: [
    {
      id: 'step_1',
      stepNumber: 1,
      title: 'Envía tu recibo por WhatsApp',
      description: 'Revisamos tu historial de consumo promedio bimestral.',
      iconName: 'FileText'
    },
    {
      id: 'step_2',
      stepNumber: 2,
      title: 'Propuesta personalizada en 24h',
      description: 'Calculamos el número ideal de paneles, ahorro estimado y presupuesto exacto.',
      iconName: 'Clock'
    },
    {
      id: 'step_3',
      stepNumber: 3,
      title: 'Instalación profesional y rápida',
      description: 'Montaje limpio, seguro y estético realizado por técnicos certificados.',
      iconName: 'Wrench'
    },
    {
      id: 'step_4',
      stepNumber: 4,
      title: 'Encendido y Ahorro Inmediato',
      description: 'Conectamos el sistema a la red y comienzas a generar tu propia energía limpia.',
      iconName: 'Zap'
    }
  ],

  // 6. Sección de Interacción Directa (WhatsApp Card)
  whatsappCardTitle: '¿Cuánto puedes ahorrar con tu techo? Descúbrelo hoy',
  whatsappCardDescription: 'Tómale una foto a tu recibo de luz más reciente y envíanosla. Haremos una simulación sin ningún compromiso.',
  whatsappCardBtnText: '📲 Enviar mi recibo por WhatsApp',
  whatsappCardImageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80',

  // 7. Preguntas Frecuentes (FAQ)
  faqTitle: 'Preguntas Frecuentes',
  faqSubtitle: 'Todo lo que necesitas saber antes de dar el paso a la energía solar inteligente.',
  faqs: [
    {
      id: 'faq_1',
      question: '¿Qué pasa en días nublados o de noche?',
      answer: 'El sistema permanece conectado a la red eléctrica; de noche consumes de CFE y de día inyectas tus excedentes a través de tu medidor bidireccional.'
    },
    {
      id: 'faq_2',
      question: '¿Qué espacio necesito en mi azotea o techo?',
      answer: 'A partir de 15 a 20 m² despejados podemos diseñar una solución adecuada tanto para residencias como para comercios.'
    },
    {
      id: 'faq_3',
      question: '¿Cuánto tarda la instalación?',
      answer: 'El montaje físico suele tomar entre 1 y 2 días hábiles; el cambio de medidor con CFE depende de los tiempos de la comisión, pero nosotros gestionamos todo el expediente.'
    }
  ],

  // 8. Footer (Pie de Página)
  footerDescription: 'Solux Green — Soluciones de Energía Limpia y Ahorro Inteligente.',
  footerPrivacyText: 'Aviso de Privacidad',
  footerTermsText: 'Términos de Servicio',
  floatingWhatsappActive: true,

  // Estilos visuales
  styles: {
    fontFamily: 'sans',
    textAlign: 'left',
    primaryBtnColor: '#059669', // emerald-600
    secondaryBtnColor: '#0f172a', // slate-900
    whatsappBtnColor: '#25D366', // WhatsApp official green
    heroBgColor: '#0f172a', // Dark modern slate
    statsBgColor: '#1e293b',
    benefitsBgColor: '#f8fafc',
    processBgColor: '#ffffff',
    whatsappCardBgColor: '#064e3b', // Deep emerald
    faqBgColor: '#f8fafc',
    footerBgColor: '#020617'
  }
};
