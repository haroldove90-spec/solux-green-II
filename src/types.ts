export interface Material {
  id: string;
  name: string;
  unitPrice: number;
  unit: string;
  stock: number;
}

export interface ServiceType {
  id: string;
  name: string;
  category: 'plomería' | 'electricidad' | 'herrería' | 'clima' | 'otro';
  basePrice: number;
  icon: string;
}

export interface Technician {
  id: string;
  name: string;
  specialty: 'plomería' | 'electricidad' | 'herrería' | 'clima' | 'general';
  status: 'free' | 'on_way' | 'in_service';
  phone: string;
  avatar: string;
  completedServicesCount: number;
  totalEarnings: number;
  currentLocation: {
    lat: number;
    lng: number;
    address: string;
  };
}

export interface ServiceMaterialUsed {
  materialId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface Service {
  id: string;
  clientName: string;
  clientPhone: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  category: 'plomería' | 'electricidad' | 'herrería' | 'clima' | 'otro';
  description: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed';
  priority: 'normal' | 'urgent';
  assignedTechnicianId?: string;
  scheduledDate: string; // ISO String or Date
  createdDate: string; // ISO String or Date
  completedDate?: string; // ISO String
  
  // Evidencia
  beforeImage?: string;
  afterImage?: string;
  materialsUsed: ServiceMaterialUsed[];
  
  // Cobro
  basePrice: number;
  urgencySurcharge: number;
  paymentSurcharge: number;
  materialsTotal: number;
  finalTotal: number;
  paymentMethod?: 'cash' | 'card' | 'spei';
  paymentStatus: 'pending' | 'paid';
  clientSignature?: string;
}

export interface FinancialStats {
  byPaymentMethod: {
    cash: number;
    card: number;
    spei: number;
  };
  byCategory: {
    plomería: number;
    electricidad: number;
    herrería: number;
    clima: number;
    otro: number;
  };
  totalRevenue: number;
}

export interface SolarProject {
  id: string;
  clientName: string;
  clientPhone: string;
  municipalityState: string;
  clientEmail?: string;
  whatsappPhone?: string;
  googleMapsUrl?: string;
  electricalLoadType?: string[]; // Selection of multiple load types (e.g., 110V, 220V, etc.)
  wiresCount?: number; // Number of wires
  
  // Datos básicos para Cotización Solar
  averageBill: number; // Pago promedio de luz ($ MXN)
  availableSpace: number; // Espacio disponible en m²
  metersCount: number; // Número de medidores
  cfeStatus: 'activo_sin_adeudo' | 'con_adeudo' | 'inactivo'; // Estatus del servicio CFE
  paymentMethodDesired: 'contado' | 'msi' | 'bancario' | 'bancario_personal' | 'financieras_externas' | 'directo' | string; // Forma de pago deseada
  propertyOwnership: 'propietario' | 'arrendatario_autorizado'; // Validación de propiedad
  
  // Expediente Digital / Evidencia Multimedia
  evidence: {
    cfeReceiptFront?: string; // foto de recibo CFE frente
    cfeReceiptBack?: string; // foto de recibo CFE reverso
    cfeReceipt2Front?: string; // segundo recibo frente (opcional)
    cfeReceipt2Back?: string; // segundo recibo reverso (opcional)
    facade?: string; // foto de fachada desde calle
    installationAreaPhoto?: string; // foto área de instalación (sustituye a video de acceso)
    accessVideo?: string; // video de acceso al área de instalación (deprecado)
    roofAngle1?: string; // foto techo 1
    roofAngle2?: string; // foto techo 2
    meterAndPanel?: string; // foto medidor y centro de carga
    ineFront?: string; // foto de identificación oficial (INE) frente
    ineBack?: string; // foto de identificación oficial (INE) reverso
    proofOfAddress?: string; // comprobante de domicilio (agua, predial, etc.)
    technicalSurveyDoc?: string; // levantamiento técnico (PDF o imagen) subido por Asesor Verde o Partner
    cfeExpedientDoc?: string; // Expediente entregado a CFE
    cfeMeterChangeReceiptDoc?: string; // Acuse de recepción CFE cambio medidor
    baseQuotationDoc?: string; // Cotización base del proyecto solar
    additionalReceipts?: string[]; // fotos/evidencias de recibos de luz adicionales sin límite
    additionalDocs?: { id: string; title: string; url: string; date?: string }[]; // evidencias adicionales subidas por cliente o asesor
  };
  
  // Cotizador Inteligente
  estimatedPanels: number; // cálculo: (averageBill / 1000) * 2
  requiredArea: number; // cálculo de área mínima en m² (panels * 2.88) (1 panel = 1.20m x 2.40m = 2.88m²)
  voltageAlert220v: boolean; // true si panels > 4
  voltageUpgradeQuoted: boolean; // si se cotizó por separado el cambio a 220v
  totalInvestment: number; // inversión total estimada (paneles * costo_base)
  
  // Financiamiento
  financing?: {
    type: 'contado' | 'msi' | 'bancario' | 'bancario_personal' | 'financieras_externas' | 'directo' | string;
    downPayment: number; // enganche
    months: number; // plazo
    interestRate: number; // tasa de interés
    monthlyPayment: number; // pago mensual
  };

  // Hasta 3 simulaciones de crédito guardadas en expediente
  savedSimulations?: {
    id: string;
    financialPartner: string;
    amount: number;
    months: number;
    interestRate: number;
    monthlyPayment: number;
    date: string;
  }[];
  
  // Levantamiento Técnico
  siteSurveyPaid: boolean; // Pago de $250
  siteSurveyReceipt?: string; // comprobante de pago de levantamiento
  siteSurveyStatus: 'pendiente' | 'en_proceso' | 'concluido';
  siteSurveyData?: {
    noShadows: boolean; // Ausencia de sombras
    roofCondition: 'buena' | 'regular' | 'mala'; // Condiciones de loza/piso/azotea
    wiringDistance: number; // Distancia física instalacion-medidor
    clientSignature?: string; // Firma digital del cliente autorizando
    surveyorNotes?: string; // Notas de campo
  };
  
  // Referido
  referrerCode?: string; // Código de asesor de enlace que refirió
  assignedEnlaceId?: string; // ID del usuario rol Enlace asignado
  enlaceName?: string; // Nombre del usuario rol Enlace
  isRecommendedByAdvisor?: boolean; // Verdadero si fue recomendado por un Asesor Verde
  recommendationNotes?: string; // Notas de la recomendación enviada al Enlace
  
  // Estatus en tiempo real (Soporta nuevos estados del PDF)
  status: 'cotizacion_enviada' | 'financiamiento_enviado' | 'levantamiento_tecnico' | 'cotizacion_final' | 'firma_contrato' | 'instalacion' | 'tramite_cfe' | 'validacion' | 'levantamiento' | 'contrato' | 'interconexion' | 'operacion' | string;
  
  // Partner asignado al proyecto (solo administradores pueden elegirlo)
  assignedPartnerId?: string;
  assignedCommercialId?: string;
  assignedTechnicianId?: string;

  // Datos para el cliente (monitoreo del sistema)
  monitoringAppUrl?: string;
  monitoringAppUser?: string;
  monitoringAppPass?: string;

  // Historial de pagos
  payments: {
    id: string;
    concept: string;
    amount: number;
    date: string;
    status: 'pendiente' | 'pagado';
    receipt?: string;
  }[];
  
  createdDate: string;
  createdBy?: string;
  createdByRole?: string;
  advisorName?: string;
  advisorPhone?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  createdDate: string;
  isRead: boolean;
  role: 'admin' | 'comercial' | 'enlace' | 'partner' | 'client' | 'all';
  userId?: string;
}

export interface PromotionalMaterial {
  id: string;
  title: string;
  category: 'folleto' | 'ficha_tecnica' | 'redes' | string;
  description: string;
  fileUrl: string;
  fileName?: string;
  createdDate?: string;
  createdBy?: string;
  createdByName?: string;
  createdByRole?: string;
}

export interface User {
  id: string;
  username: string;
  email?: string;
  password?: string;
  pin?: string;
  role: 'admin' | 'landingadmin' | 'comercial' | 'tech' | 'partner' | 'enlace' | 'client' | 'landingpage' | 'public_client_reg' | string;
  fullName?: string;
  parentId?: string;
  whatsapp?: string;
  avatar?: string;
  coverage?: string;
  crewsCount?: number;
  surveyRate?: number;
  panelRate?: number;
  partnerStatus?: 'activo' | 'revision' | 'suspendido' | string;
  address?: string;
  locationUrl?: string;
  inePhotos?: string[];
  bankAccountHolder?: string;
  bankName?: string;
  bankClabe?: string;
  accountNumber?: string;
  cardNumber?: string;
  paymentStatusType?: 'Por proyecto' | 'Por referido' | '5% antes de IVA' | string;
  prospectingAreas?: string;
  workShift?: 'Tiempo completo' | 'Tiempo parcial' | string;
  additionalPhone?: string;
  companyName?: string;
  taxRegime?: string;
  cfdiUse?: string;
  rfc?: string;
  taxAddress?: string;
  streetAndNumber?: string;
  colonia?: string;
  municipio?: string;
  zipCode?: string;
  coverageStates?: string;
  weeklyInstallCapacity?: number;
  agreedProfitMargin?: number;
  taxSituationDoc?: string;
  allianceContractDoc?: string;
  ineFrontDoc?: string;
  ineBackDoc?: string;
  referralCode?: string;
  createdAt?: string;
  createdDate?: string;
}

export interface FinancingTerm {
  id: string;
  months: number;
  label: string;
  monthlyInterestRate?: number;
  downPaymentPercent?: number;
  active: boolean;
  description?: string;
}

export interface SoluxConfig {
  panelBasePrice: number | string;
  monthlyInterestRate: number | string;
  siteSurveyCost: number | string;
  defaultDownPaymentPercent?: number | string; // e.g. 50%
  contadoDiscountPercent?: number | string; // e.g. 5% de descuento por pago de contado
  financingTermMonths?: number[]; // e.g. [3, 6]
  financingTerms?: FinancingTerm[];
  updatedAt?: string;
}

// =====================================================================
// LANDING PAGE & ADMIN LANDING TYPES
// =====================================================================

export interface LandingSlide {
  id: string;
  imageUrl: string;
  badge?: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  ctaBgColor?: string;
  ctaTextColor?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  secondaryCtaBgColor?: string;
  secondaryCtaTextColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  alt?: string;
}

export interface LandingBenefit {
  id: string;
  title: string;
  description: string;
  iconName?: string;
  imageUrl?: string;
}

export interface LandingSolution {
  id: string;
  title: string;
  description: string;
  badge?: string;
  imageUrl?: string;
  features?: string[];
  buttonText?: string;
  buttonLink?: string;
  buttonColor?: string;
}

export interface LandingGalleryItem {
  id: string;
  title: string;
  category?: string;
  location?: string;
  powerKw?: string;
  savingsAnnual?: string;
  imageUrl: string;
}

export interface LandingStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  iconName?: string;
}

export interface LandingStat {
  id: string;
  value: string;
  label: string;
  description?: string;
  iconName?: string;
}

export interface LandingFAQ {
  id: string;
  question: string;
  answer: string;
}

export interface LandingMenuItem {
  id: string;
  label: string;
  href: string;
}

export interface LandingContactPhone {
  id: string;
  label: string;
  number: string;
  isWhatsApp?: boolean;
}

export interface LandingContactEmail {
  id: string;
  label: string;
  email: string;
}

export interface LandingStyles {
  fontFamily: 'sans' | 'inter' | 'poppins' | 'serif' | 'mono' | 'montserrat' | 'outfit' | 'roboto';
  textAlign: 'left' | 'center' | 'right' | 'justify';
  primaryBtnColor: string; // e.g. '#059669'
  primaryBtnTextColor?: string; // e.g. '#ffffff'
  secondaryBtnColor: string;
  secondaryBtnTextColor?: string;
  whatsappBtnColor: string;
  btnBorderRadius?: 'none' | 'rounded-lg' | 'rounded-xl' | 'rounded-2xl' | 'rounded-full';
  heroBgColor: string; // custom hex or preset
  heroBgImage?: string;
  statsBgColor: string;
  benefitsBgColor: string;
  solutionsBgColor?: string;
  galleryBgColor?: string;
  processBgColor: string;
  whatsappCardBgColor: string;
  faqBgColor: string;
  contactBgColor?: string;
  footerBgColor: string;
  fontSizeParagraph?: 'sm' | 'base' | 'lg';
}

export interface LandingConfig {
  id?: string;
  // Brand & Contact
  brandName: string;
  logoUrl: string;
  contactWhatsapp: string;
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  defaultWhatsappMessage: string;
  contactPhones?: LandingContactPhone[];
  contactEmails?: LandingContactEmail[];
  businessHours?: string;
  googleMapsUrl?: string;

  // Header
  headerMenuItems: LandingMenuItem[];
  headerCtaText: string;
  headerCtaLink?: string;

  // Hero Section
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCtaText: string;
  heroCtaLink: string;
  heroTrustText: string;
  heroSlides: LandingSlide[];
  sliderAutoPlay: boolean;
  sliderIntervalSec: number;

  // Stats / Social Proof
  stats: LandingStat[];

  // Benefits
  benefitsTitle: string;
  benefitsSubtitle: string;
  benefits: LandingBenefit[];

  // Solutions (Residencial, Comercial, Industrial)
  solutionsTitle?: string;
  solutionsSubtitle?: string;
  solutions?: LandingSolution[];

  // Real Projects Gallery
  galleryTitle?: string;
  gallerySubtitle?: string;
  gallery?: LandingGalleryItem[];

  // 4 Steps Process
  processTitle: string;
  processSubtitle: string;
  steps: LandingStep[];

  // Direct Interaction WhatsApp Card
  whatsappCardTitle: string;
  whatsappCardDescription: string;
  whatsappCardBtnText: string;
  whatsappCardBtnLink?: string;
  whatsappCardImageUrl?: string;

  // FAQs
  faqTitle: string;
  faqSubtitle: string;
  faqs: LandingFAQ[];

  // Cotizador Rápido / Lead capture banner
  leadFormTitle?: string;
  leadFormSubtitle?: string;
  leadFormBadge?: string;

  // Footer
  footerDescription: string;
  footerPrivacyText: string;
  footerTermsText: string;
  floatingWhatsappActive: boolean;

  // Visual Styles
  styles: LandingStyles;

  updatedAt?: string;
}


