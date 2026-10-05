import React, { useState, Component } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Crown, TrendingUp, Wrench, Handshake, User, ArrowLeft, 
  Layers, ShieldCheck, Sparkles, Cpu, ChevronRight, Activity,
  Eye, EyeOff, Lock, UserPlus, LogIn, Building, MapPin, Zap,
  CheckCircle2, Key, Phone, Mail, Users, Globe, SlidersHorizontal
} from 'lucide-react';

// Import dashboards
import AdminDashboard from './components/AdminDashboard';
import ClientDashboard from './components/ClientDashboard';
import TechDashboard from './components/TechDashboard';
import CommercialDashboard from './components/CommercialDashboard';
import EnlaceDashboard from './components/EnlaceDashboard';
import PublicClientRegistration from './components/PublicClientRegistration';
import PublicEnlaceRegistration from './components/PublicEnlaceRegistration';
import LandingPageView from './components/LandingPageView';
import AdminLandingPage from './components/AdminLandingPage';

// Import Types and Mock Data
import { Service, Technician, Material, ServiceType, SolarProject, AppNotification, LandingConfig } from './types';
import { SOLUX_LOGO_URL, SOLUX_LOGO_FALLBACK } from './logoConfig';
import { DEFAULT_LANDING_CONFIG } from './landingDefaultData';
import { 
  INITIAL_TECHNICIANS, 
  INITIAL_MATERIALS, 
  SERVICE_CATALOG, 
  INITIAL_SERVICES,
  INITIAL_SOLAR_PROJECTS
} from './mockData';

// Import Supabase service helpers
import { 
  fetchSolarProjects, upsertSolarProject, 
  fetchTechnicians, upsertTechnician, 
  fetchMaterials, upsertMaterial, 
  fetchServices, upsertService, 
  fetchSoluxConfig, upsertSoluxConfig, 
  fetchUsers, upsertUser,
  deleteSolarProject, deleteUser,
  deleteTechnician, deleteMaterial, deleteService,
  fetchNotifications, upsertNotification, deleteNotification,
  fetchLandingConfig, upsertLandingConfig
} from './supabaseService';

import { playNotificationSound, sendBrowserNotification } from './components/NotificationsBell';
import { DEFAULT_FINANCING_TERMS } from './financingUtils';

// Helper for safe localStorage write that strips heavy Base64 media and prevents quota exceptions
const lightenForStorage = (key: string, data: any): any => {
  if (!data) return data;
  if (key === 'solux_users' && Array.isArray(data)) {
    return data.map((u: any) => ({
      ...u,
      inePhoto: typeof u.inePhoto === 'string' && u.inePhoto.length > 500 ? undefined : u.inePhoto,
      inePhotos: Array.isArray(u.inePhotos) ? u.inePhotos.filter((p: string) => typeof p === 'string' && p.length < 500) : [],
      ineFrontDoc: typeof u.ineFrontDoc === 'string' && u.ineFrontDoc.length > 500 ? undefined : u.ineFrontDoc,
      ineBackDoc: typeof u.ineBackDoc === 'string' && u.ineBackDoc.length > 500 ? undefined : u.ineBackDoc,
      avatar: typeof u.avatar === 'string' && u.avatar.length > 500 ? undefined : u.avatar
    }));
  }
  if (key === 'solux_current_user' && typeof data === 'object') {
    return {
      ...data,
      inePhoto: typeof data.inePhoto === 'string' && data.inePhoto.length > 500 ? undefined : data.inePhoto,
      inePhotos: Array.isArray(data.inePhotos) ? data.inePhotos.filter((p: string) => typeof p === 'string' && p.length < 500) : [],
      ineFrontDoc: typeof data.ineFrontDoc === 'string' && data.ineFrontDoc.length > 500 ? undefined : data.ineFrontDoc,
      ineBackDoc: typeof data.ineBackDoc === 'string' && data.ineBackDoc.length > 500 ? undefined : data.ineBackDoc,
      avatar: typeof data.avatar === 'string' && data.avatar.length > 500 ? undefined : data.avatar
    };
  }
  if (key === 'solux_solar_projects' && Array.isArray(data)) {
    return data.map((p: any) => ({
      ...p,
      evidence: p.evidence ? {
        ...p.evidence,
        cfeReceiptFront: typeof p.evidence.cfeReceiptFront === 'string' && p.evidence.cfeReceiptFront.length > 500 ? undefined : p.evidence.cfeReceiptFront,
        cfeReceiptBack: typeof p.evidence.cfeReceiptBack === 'string' && p.evidence.cfeReceiptBack.length > 500 ? undefined : p.evidence.cfeReceiptBack,
        facade: typeof p.evidence.facade === 'string' && p.evidence.facade.length > 500 ? undefined : p.evidence.facade,
        installationAreaPhoto: typeof p.evidence.installationAreaPhoto === 'string' && p.evidence.installationAreaPhoto.length > 500 ? undefined : p.evidence.installationAreaPhoto,
        evidenceReceipt2Front: typeof p.evidence.evidenceReceipt2Front === 'string' && p.evidence.evidenceReceipt2Front.length > 500 ? undefined : p.evidence.evidenceReceipt2Front,
        meterDigitalOrAnalog: typeof p.evidence.meterDigitalOrAnalog === 'string' && p.evidence.meterDigitalOrAnalog.length > 500 ? undefined : p.evidence.meterDigitalOrAnalog,
        serviceEntrancePhoto: typeof p.evidence.serviceEntrancePhoto === 'string' && p.evidence.serviceEntrancePhoto.length > 500 ? undefined : p.evidence.serviceEntrancePhoto,
        loadCenterPhoto: typeof p.evidence.loadCenterPhoto === 'string' && p.evidence.loadCenterPhoto.length > 500 ? undefined : p.evidence.loadCenterPhoto,
        breakerBoxPhoto: typeof p.evidence.breakerBoxPhoto === 'string' && p.evidence.breakerBoxPhoto.length > 500 ? undefined : p.evidence.breakerBoxPhoto,
        interiorGroundPhoto: typeof p.evidence.interiorGroundPhoto === 'string' && p.evidence.interiorGroundPhoto.length > 500 ? undefined : p.evidence.interiorGroundPhoto,
      } : {}
    }));
  }
  return data;
};

// Initial cleanup of bloated localStorage keys that might exceed the 5MB browser quota from previous sessions
try {
  const keysToClean = ['solux_users', 'solux_solar_projects', 'solux_offline_projects'];
  keysToClean.forEach(k => {
    const raw = localStorage.getItem(k);
    if (raw && raw.length > 500 * 1024) { // If larger than 500KB, remove to unblock storage
      localStorage.removeItem(k);
    }
  });
} catch (e) {}

export const safeSetLocalStorage = (key: string, data: any) => {
  try {
    const safeData = lightenForStorage(key, data);
    const serialized = typeof safeData === 'string' ? safeData : JSON.stringify(safeData);
    localStorage.setItem(key, serialized);
  } catch (e) {
    try {
      // If quota exceeded, clean up old non-critical caches
      localStorage.removeItem('solux_solar_projects');
      localStorage.removeItem('solux_users');
      const safeData = lightenForStorage(key, data);
      localStorage.setItem(key, JSON.stringify(safeData));
    } catch (inner) {
      // Silently fall back without crashing or polluting logs
    }
  }
};

// React Error Boundary to catch unexpected UI crashes and allow seamless recovery without losing session
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class AppErrorBoundary extends (React.Component as any)<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("CRITICAL APP ERROR CAUGHT BY BOUNDARY:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-slate-800 border border-slate-700 p-8 rounded-3xl max-w-lg w-full shadow-2xl flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-2xl mb-4">
              ⚡
            </div>
            <h2 className="text-xl font-black mb-2">Sistema Solux Green</h2>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              Ocurrió un detalle temporal al procesar la vista. Tu sesión y tus expedientes digitales están guardados de forma segura en la nube.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              🔄 Recargar y Continuar Sesión
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export const INITIAL_SYSTEM_USERS = [
  { id: 'usr_walter', username: 'walter_admin', email: 'walter@soluxgreen.com.mx', password: 'Chevropar#1970', role: 'admin', fullName: 'Walter', parentId: null, whatsapp: '2293233633', avatar: '' },
  { id: 'usr_1', username: 'admin', email: 'admin@soluxgreen.com.mx', password: 'password123', role: 'admin', fullName: 'Administrador General', whatsapp: '', avatar: '' },
  { id: 'usr_gustavo', username: 'Gustavo', email: 'gerente@massmercadeo.com.mx', password: 'SOLUX2026', role: 'admin', fullName: 'Gustavo Luna', parentId: null, whatsapp: '', avatar: '' },
  { id: 'usr_harold', username: 'harold_anguiano', email: 'haroldo90@hotmail.com', password: 'Chevropar#1970', role: 'admin', fullName: 'Harold Anguiano', parentId: null, whatsapp: '', avatar: '' },
  { id: 'usr_jose', username: 'jose_cagal', email: 'director@massmercadeo.com', password: 'MassMercadeo#2026!', role: 'admin', fullName: 'Jose cagal García', parentId: null, whatsapp: '', avatar: '' },
  { id: 'usr_2', username: 'verde1', email: 'verde1@soluxgreen.com.mx', password: 'password123', role: 'comercial', fullName: 'Asesor Verde Principal', parentId: null, whatsapp: '', avatar: '' },
  { id: 'usr_enl_1789659443947', username: 'juan', email: 'juan@soluxgreen.com.mx', password: 'SOLUX2026', role: 'enlace', fullName: 'Juan Pérez', parentId: 'usr_gustavo', whatsapp: '2293233633', referralCode: 'ENLACE-JUAN256-MX', avatar: '' },
  { id: 'usr_3', username: 'enlace1', email: 'enlace1@soluxgreen.com.mx', password: 'password123', role: 'enlace', fullName: 'Asesor de Enlace CDMX', parentId: 'usr_harold', whatsapp: '5544332211', referralCode: 'ENLACE-CDMX-MX', avatar: '' },
  { id: 'usr_enlace_sofia', username: 'sofia_martinez', email: 'sofia.martinez@soluxgreen.com.mx', password: 'Solux2026!', role: 'enlace', fullName: 'Lic. Sofía Martínez', parentId: 'usr_harold', whatsapp: '5511223344', referralCode: 'ENLACE-SOF1-MX', municipio: 'San Pedro / Cumbres', workShift: 'Tiempo completo', avatar: '' },
  { id: 'usr_4', username: 'partner1', email: 'partner1@soluxgreen.com.mx', password: 'password123', role: 'partner', fullName: 'Partner de Instalaciones S.A.', whatsapp: '', avatar: '' }
];

export function deduplicateById<T extends { id?: string }>(items: T[]): T[] {
  if (!Array.isArray(items)) return [];
  const map = new Map<string, T>();
  items.forEach((item, idx) => {
    if (!item) return;
    const id = item.id ? String(item.id).trim() : `item_${idx}`;
    if (!map.has(id)) {
      map.set(id, item);
    }
  });
  return Array.from(map.values());
}

export function deduplicateUsers(list: any[]): any[] {
  if (!Array.isArray(list)) return [];
  const result: any[] = [];

  for (const user of list) {
    if (!user) continue;
    const cleanUser = { ...user };
    if (!cleanUser.id) {
      cleanUser.id = cleanUser.username
        ? `usr_${cleanUser.username.toLowerCase()}`
        : `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    }
    const id = String(cleanUser.id).trim();
    const username = cleanUser.username ? String(cleanUser.username).trim().toLowerCase() : '';

    const existingIndex = result.findIndex(u => {
      const uId = String(u.id).trim();
      const uName = u.username ? String(u.username).trim().toLowerCase() : '';

      return (
        (id && uId === id) ||
        (username && uName && uName === username)
      );
    });

    if (existingIndex >= 0) {
      const existing = result[existingIndex];
      result[existingIndex] = {
        ...existing,
        ...cleanUser,
        id: existing.id || cleanUser.id,
        username: existing.username || cleanUser.username,
        email: existing.email || cleanUser.email,
        fullName: cleanUser.fullName || cleanUser.full_name || existing.fullName,
        role: cleanUser.role || existing.role,
        whatsapp: cleanUser.whatsapp || existing.whatsapp || '',
        password: cleanUser.password || existing.password || 'password123',
        createdAt: cleanUser.createdAt || cleanUser.created_at || existing.createdAt || existing.created_at,
        createdDate: cleanUser.createdDate || cleanUser.created_date || existing.createdDate || existing.created_date
      };
    } else {
      result.push(cleanUser);
    }
  }

  // Final check: guarantee strictly unique `id` attribute for every single user
  const finalMap = new Map<string, any>();
  result.forEach((u, idx) => {
    let finalId = u.id;
    if (finalMap.has(finalId)) {
      finalId = `${u.id}_${idx}`;
      u = { ...u, id: finalId };
    }
    finalMap.set(finalId, u);
  });

  return Array.from(finalMap.values());
}

export function sanitizeUserRole(role: any): 'admin' | 'comercial' | 'enlace' | 'partner' | 'client' {
  if (!role || typeof role !== 'string') return 'comercial';
  const clean = role.trim().toLowerCase();
  if (['comercial', 'asesor', 'asesor verde', 'vendedor'].includes(clean)) return 'comercial';
  if (['enlace', 'referido', 'asesor de enlace'].includes(clean)) return 'enlace';
  if (['admin', 'administrador', 'general'].includes(clean)) return 'admin';
  if (['partner', 'tech', 'instalador', 'socio'].includes(clean)) return 'partner';
  if (['client', 'cliente', 'landingpage'].includes(clean)) return 'client';
  return 'comercial';
}

function App() {
  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(true); // default to true to allow fallback info
  const [showIosTip, setShowIosTip] = useState(false);

  React.useEffect(() => {
    // Check if device is iOS
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    
    if (isIos && !isStandalone) {
      setShowIosTip(true);
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      setShowInstallBtn(false);
      setShowIosTip(false);
      console.log('Solux Green PWA instalado!');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowInstallBtn(false);
      }
    } else {
      alert("Para instalar la aplicación móvil de Solux Green:\n\n• En iPhone (Safari): Presiona el botón de 'Compartir' (el cuadro con una flecha hacia arriba) y selecciona 'Agregar a Inicio'.\n• En Android (Chrome): Presiona los tres puntos de la esquina superior derecha y selecciona 'Instalar aplicación' o 'Agregar a la pantalla principal'.");
    }
  };

  // Application Data States
  const [services, setServices] = useState<Service[]>(() => {
    const saved = localStorage.getItem('solux_services');
    return saved ? JSON.parse(saved) : INITIAL_SERVICES;
  });
  const [technicians, setTechnicians] = useState<Technician[]>(() => {
    const saved = localStorage.getItem('solux_technicians');
    return saved ? JSON.parse(saved) : INITIAL_TECHNICIANS;
  });
  const [materials, setMaterials] = useState<Material[]>(() => {
    const saved = localStorage.getItem('solux_materials');
    return saved ? JSON.parse(saved) : INITIAL_MATERIALS;
  });
  const [catalog, setCatalog] = useState<ServiceType[]>(SERVICE_CATALOG);
  const [urgencySurcharge, setUrgencySurcharge] = useState<number>(250);

  // Solux Green global configuration parameters
  const [soluxConfig, setSoluxConfig] = useState(() => {
    const defaultTerms = [
      {
        id: 'term_3',
        months: 3,
        label: '3 Meses',
        monthlyInterestRate: 4.9,
        downPaymentPercent: 50,
        active: true,
        description: '50% Enganche + 3 mensualidades sobre saldos insolutos'
      },
      {
        id: 'term_6',
        months: 6,
        label: '6 Meses',
        monthlyInterestRate: 4.9,
        downPaymentPercent: 50,
        active: true,
        description: '50% Enganche + 6 mensualidades sobre saldos insolutos'
      }
    ];

    const saved = localStorage.getItem('solux_config');
    if (!saved) {
      return {
        panelBasePrice: 11000,
        monthlyInterestRate: 4.9,
        siteSurveyCost: 250,
        defaultDownPaymentPercent: 50,
        contadoDiscountPercent: 5,
        financingTermMonths: [3, 6],
        financingTerms: defaultTerms
      };
    }
    try {
      const parsed = JSON.parse(saved);
      const safePrice = parsed.panelBasePrice !== '' && parsed.panelBasePrice != null && Number(parsed.panelBasePrice) > 0 ? Number(parsed.panelBasePrice) : 11000;
      const safeRate = parsed.monthlyInterestRate !== '' && parsed.monthlyInterestRate != null && !isNaN(Number(parsed.monthlyInterestRate)) ? Number(parsed.monthlyInterestRate) : 4.9;
      const safeSurvey = parsed.siteSurveyCost !== '' && parsed.siteSurveyCost != null && !isNaN(Number(parsed.siteSurveyCost)) ? Number(parsed.siteSurveyCost) : 250;
      const safeDown = parsed.defaultDownPaymentPercent !== '' && parsed.defaultDownPaymentPercent != null && !isNaN(Number(parsed.defaultDownPaymentPercent)) ? Number(parsed.defaultDownPaymentPercent) : 50;
      const safeContado = parsed.contadoDiscountPercent !== '' && parsed.contadoDiscountPercent != null && !isNaN(Number(parsed.contadoDiscountPercent)) ? Number(parsed.contadoDiscountPercent) : 5;
      const safeTerms = Array.isArray(parsed.financingTerms) && parsed.financingTerms.length > 0 ? parsed.financingTerms : defaultTerms;
      const safeMonths = Array.isArray(parsed.financingTermMonths) && parsed.financingTermMonths.length > 0 ? parsed.financingTermMonths : [3, 6];

      const safeUpdatedAt = parsed.updatedAt || (typeof window !== 'undefined' ? localStorage.getItem('solux_panel_price_updated_at') : undefined) || undefined;

      return {
        panelBasePrice: safePrice,
        monthlyInterestRate: safeRate,
        siteSurveyCost: safeSurvey,
        defaultDownPaymentPercent: safeDown,
        contadoDiscountPercent: safeContado,
        financingTermMonths: safeMonths,
        financingTerms: safeTerms,
        updatedAt: safeUpdatedAt
      };
    } catch {
      return {
        panelBasePrice: 11000,
        monthlyInterestRate: 4.9,
        siteSurveyCost: 250,
        defaultDownPaymentPercent: 50,
        contadoDiscountPercent: 5,
        financingTermMonths: [3, 6],
        financingTerms: defaultTerms
      };
    }
  });

  // Offline mode simulation state
  const [isOfflineMode, setIsOfflineMode] = useState(() => {
    return localStorage.getItem('solux_offline') === 'true';
  });

  // Offline pending queue
  const [offlineProjectsQueue, setOfflineProjectsQueue] = useState<SolarProject[]>(() => {
    const saved = localStorage.getItem('solux_offline_projects');
    return saved ? JSON.parse(saved) : [];
  });

  // Users List State
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('solux_users');
    let list: any[] = saved ? JSON.parse(saved) : [];
    
    const finalList = deduplicateUsers([...list, ...INITIAL_SYSTEM_USERS]);
    safeSetLocalStorage('solux_users', finalList);
    return finalList;
  });

  // Solux Green Solar Projects State
  const [solarProjects, setSolarProjects] = useState<SolarProject[]>(() => {
    const saved = localStorage.getItem('solux_solar_projects');
    return saved ? JSON.parse(saved) : INITIAL_SOLAR_PROJECTS;
  });

  // Solux Green Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('solux_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  // Solux Green Landing Page Configuration State
  const [landingConfig, setLandingConfig] = useState<LandingConfig>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('solux_landing_config');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && Array.isArray(parsed.heroSlides)) {
            parsed.heroSlides = parsed.heroSlides.map((s: any, idx: number) => {
              const cleanSlide = { ...s };
              delete cleanSlide.secondaryCtaText;
              delete cleanSlide.secondaryCtaLink;
              if (idx === 2 || cleanSlide.id === 'slide_3') {
                cleanSlide.ctaText = cleanSlide.ctaText || '🚀 Quiero ser Asesor de Enlace';
                cleanSlide.ctaLink = cleanSlide.ctaLink || 'https://wa.me/5212293233633?text=Hola%20Solux%20Green,%20quiero%20ser%20Asesor%20de%20Enlace%20y%20solicito%20informes';
                cleanSlide.ctaBgColor = cleanSlide.ctaBgColor || '#e11d48';
              }
              return cleanSlide;
            });
          }
          if (parsed && Array.isArray(parsed.benefits)) {
            parsed.benefits = parsed.benefits.map((b: any) => ({
              ...b,
              description: typeof b.description === 'string'
                ? b.description.replace('2 a 4 años', '2 a 5 años')
                : b.description
            }));
          }
          const mergedCfg = {
            ...DEFAULT_LANDING_CONFIG,
            ...parsed,
            styles: {
              ...DEFAULT_LANDING_CONFIG.styles,
              ...(parsed.styles || {})
            }
          };
          localStorage.setItem('solux_landing_config', JSON.stringify(mergedCfg));
          return mergedCfg;
        } catch (e) {}
      }
    }
    return DEFAULT_LANDING_CONFIG;
  });

  // ----------------- Supabase Data Synchronizer Hook (Mount) -----------------
  React.useEffect(() => {
    async function loadAllFromSupabase(isInitial = false) {
      if (isInitial) {
        console.log('⚡ Conectando y cargando datos desde Supabase...');
      }
      
      try {
        const lCfg = await fetchLandingConfig();
        if (lCfg) {
          setLandingConfig(prev => {
            const merged = {
              ...DEFAULT_LANDING_CONFIG,
              ...lCfg,
              styles: {
                ...DEFAULT_LANDING_CONFIG.styles,
                ...(lCfg.styles || {})
              }
            };
            if (JSON.stringify(prev) === JSON.stringify(merged)) return prev;
            safeSetLocalStorage('solux_landing_config', merged);
            return merged;
          });
          if (isInitial) console.log('✅ Configuración de Landing Page cargada desde Supabase.');
        }
      } catch (err: any) {
        if (isInitial) console.warn('Aviso: landing_config aún no existe en Supabase o sin conexión:', err.message);
      }
      
      try {
        const notifs = await fetchNotifications();
        if (notifs) {
          setNotifications(prev => {
            if (JSON.stringify(prev) === JSON.stringify(notifs)) return prev;
            return notifs;
          });
          if (isInitial) console.log(`✅ ${notifs.length} notificaciones cargadas.`);
        }
      } catch (err: any) {
        if (isInitial) console.warn('Error cargando notificaciones de Supabase:', err.message);
      }

      try {
        const sp = await fetchSolarProjects();
        if (sp) {
          setSolarProjects(prev => {
            const map = new Map<string, SolarProject>();
            // Preserve local projects created in current session / local storage
            prev.forEach(p => { if (p && p.id) map.set(p.id, p); });
            // Merge with Supabase projects
            sp.forEach(p => {
              if (p && p.id) {
                const existingLocal = map.get(p.id);
                if (existingLocal) {
                  map.set(p.id, { ...existingLocal, ...p });
                } else {
                  map.set(p.id, p);
                }
              }
            });
            const merged = Array.from(map.values());
            if (JSON.stringify(prev) === JSON.stringify(merged)) {
              return prev;
            }
            safeSetLocalStorage('solux_solar_projects', merged);
            return merged;
          });
          if (isInitial) console.log(`✅ ${sp.length} proyectos solares cargados.`);
        }
      } catch (err: any) {
        if (isInitial) console.warn('Error cargando proyectos solares de Supabase:', err.message);
      }

      try {
        const tech = await fetchTechnicians();
        if (tech && tech.length > 0) {
          setTechnicians(prev => {
            if (JSON.stringify(prev) === JSON.stringify(tech)) return prev;
            return tech;
          });
          if (isInitial) console.log(`✅ ${tech.length} técnicos cargados.`);
        }
      } catch (err: any) {
        if (isInitial) console.warn('Error cargando técnicos de Supabase:', err.message);
      }

      try {
        const mat = await fetchMaterials();
        if (mat && mat.length > 0) {
          setMaterials(prev => {
            if (JSON.stringify(prev) === JSON.stringify(mat)) return prev;
            return mat;
          });
          if (isInitial) console.log(`✅ ${mat.length} materiales cargados.`);
        }
      } catch (err: any) {
        if (isInitial) console.warn('Error cargando materiales de Supabase:', err.message);
      }

      try {
        const srvs = await fetchServices();
        if (srvs && srvs.length > 0) {
          setServices(prev => {
            if (JSON.stringify(prev) === JSON.stringify(srvs)) return prev;
            return srvs;
          });
          if (isInitial) console.log(`✅ ${srvs.length} servicios cargados.`);
        }
      } catch (err: any) {
        if (isInitial) console.warn('Error cargando servicios de Supabase:', err.message);
      }

      try {
        const cfg = await fetchSoluxConfig();
        if (cfg) {
          setSoluxConfig(prev => {
            if (!prev) {
              safeSetLocalStorage('solux_config', cfg);
              return cfg;
            }
            const localTime = prev.updatedAt ? new Date(prev.updatedAt).getTime() : 0;
            const remoteTime = cfg.updatedAt ? new Date(cfg.updatedAt).getTime() : 0;
            if (localTime > remoteTime) {
              // Local is newer: preserve local and sync to Supabase in the background
              if (!isOfflineMode) {
                upsertSoluxConfig(prev).catch(() => {});
              }
              return prev;
            }

            const isSame = 
              Number(prev.panelBasePrice) === Number(cfg.panelBasePrice) &&
              Number(prev.monthlyInterestRate) === Number(cfg.monthlyInterestRate) &&
              Number(prev.siteSurveyCost) === Number(cfg.siteSurveyCost) &&
              Number(prev.defaultDownPaymentPercent) === Number(cfg.defaultDownPaymentPercent) &&
              Number(prev.contadoDiscountPercent) === Number(cfg.contadoDiscountPercent) &&
              JSON.stringify(prev.financingTerms || []) === JSON.stringify(cfg.financingTerms || []) &&
              JSON.stringify(prev.financingTermMonths || []) === JSON.stringify(cfg.financingTermMonths || []);
            if (!isSame) {
              safeSetLocalStorage('solux_config', cfg);
              return cfg;
            }
            return prev;
          });
          if (isInitial) console.log('✅ Configuración global cargada y sincronizada desde Supabase:', cfg);
        }
      } catch (err: any) {
        if (isInitial) console.warn('Error cargando configuración de Supabase:', err.message);
      }

      try {
        const usrList = await fetchUsers();
        setUsers(prev => {
          const userMap = new Map();
          // 1. Initial system defaults (Harold, Gustavo, Jose, Admin, etc.)
          INITIAL_SYSTEM_USERS.forEach(u => userMap.set(u.id, u));
          // 2. Previously loaded local/state users (includes edited profiles)
          prev.forEach(u => {
            if (u && (u.id || u.username)) {
              userMap.set(u.id || u.username, u);
            }
          });
          // 3. Fetched from Supabase (updates existing or adds new from DB)
          if (usrList && usrList.length > 0) {
            usrList.forEach(u => {
              if (u && (u.id || u.username)) {
                const existingKey = Array.from(userMap.keys()).find(k => {
                  const item = userMap.get(k);
                  return (
                    (u.id && item.id === u.id) ||
                    (u.username && item.username && item.username.toLowerCase() === u.username.toLowerCase())
                  );
                });

                if (existingKey) {
                  const existingLocal = userMap.get(existingKey);
                  const validDbWhatsapp = (u.whatsapp && typeof u.whatsapp === 'string' && u.whatsapp.trim() !== '') ? u.whatsapp.trim() : null;
                  const validLocalWhatsapp = (existingLocal.whatsapp && typeof existingLocal.whatsapp === 'string' && existingLocal.whatsapp.trim() !== '') ? existingLocal.whatsapp.trim() : '';

                  const merged = {
                    ...existingLocal,
                    ...u,
                    password: u.password || existingLocal.password || 'password123',
                    fullName: u.fullName || u.full_name || existingLocal.fullName,
                    whatsapp: validDbWhatsapp || validLocalWhatsapp || '',
                    email: u.email || existingLocal.email,
                    avatar: u.avatar || existingLocal.avatar,
                    bankClabe: u.bankClabe || existingLocal.bankClabe,
                    bankAccountHolder: u.bankAccountHolder || existingLocal.bankAccountHolder,
                    bankName: u.bankName || existingLocal.bankName,
                    prospectingAreas: u.prospectingAreas || existingLocal.prospectingAreas,
                    workShift: u.workShift || existingLocal.workShift,
                    streetAndNumber: u.streetAndNumber || existingLocal.streetAndNumber,
                    colonia: u.colonia || existingLocal.colonia,
                    municipio: u.municipio || existingLocal.municipio,
                    zipCode: u.zipCode || existingLocal.zipCode,
                    ineFrontDoc: u.ineFrontDoc || existingLocal.ineFrontDoc,
                    ineBackDoc: u.ineBackDoc || existingLocal.ineBackDoc
                  };
                  userMap.set(existingKey, merged);
                } else {
                  userMap.set(u.id || u.username, u);
                }
              }
            });
          }

          const mergedList = deduplicateUsers(Array.from(userMap.values()));
          if (JSON.stringify(prev) === JSON.stringify(mergedList)) {
            return prev;
          }
          safeSetLocalStorage('solux_users', mergedList);
          return mergedList;
        });

        // Keep current active user in sync with updated list from Supabase
        setCurrentUser(curr => {
          if (!curr) return null;
          
          let updatedCurr = { ...curr };

          if (usrList && usrList.length > 0) {
            const foundInDb = usrList.find(u => 
              (u.id && curr.id && u.id === curr.id) ||
              (u.username && curr.username && u.username.toLowerCase() === curr.username.toLowerCase())
            );
            if (foundInDb) {
              const validDbWhatsapp = (foundInDb.whatsapp && typeof foundInDb.whatsapp === 'string' && foundInDb.whatsapp.trim() !== '') ? foundInDb.whatsapp.trim() : null;
              const validCurrWhatsapp = (curr.whatsapp && typeof curr.whatsapp === 'string' && curr.whatsapp.trim() !== '') ? curr.whatsapp.trim() : '';

              updatedCurr = {
                ...curr,
                ...foundInDb,
                password: foundInDb.password || curr.password || 'password123',
                fullName: foundInDb.fullName || foundInDb.full_name || curr.fullName,
                whatsapp: validDbWhatsapp || validCurrWhatsapp || '',
                email: foundInDb.email || curr.email,
                avatar: foundInDb.avatar || curr.avatar,
                bankClabe: foundInDb.bankClabe || curr.bankClabe,
                bankAccountHolder: foundInDb.bankAccountHolder || curr.bankAccountHolder,
                bankName: foundInDb.bankName || curr.bankName,
                prospectingAreas: foundInDb.prospectingAreas || curr.prospectingAreas,
                workShift: foundInDb.workShift || curr.workShift,
                streetAndNumber: foundInDb.streetAndNumber || curr.streetAndNumber,
                colonia: foundInDb.colonia || curr.colonia,
                municipio: foundInDb.municipio || curr.municipio,
                zipCode: foundInDb.zipCode || curr.zipCode,
                ineFrontDoc: foundInDb.ineFrontDoc || curr.ineFrontDoc,
                ineBackDoc: foundInDb.ineBackDoc || curr.ineBackDoc
              };
            }
          }

          if (JSON.stringify(curr) === JSON.stringify(updatedCurr)) {
            return curr;
          }
          safeSetLocalStorage('solux_current_user', updatedCurr);
          return updatedCurr;
        });

        // Only upsert system admins if they don't exist at all in DB (by ID, username, or email)
        if (usrList) {
          const existingIds = new Set(usrList.map(u => u.id).filter(Boolean));
          const existingUsernames = new Set(usrList.map(u => u.username ? u.username.toLowerCase() : '').filter(Boolean));
          const existingEmails = new Set(usrList.map(u => u.email ? u.email.toLowerCase() : '').filter(Boolean));

          INITIAL_SYSTEM_USERS.forEach(sysUser => {
            const hasId = sysUser.id && existingIds.has(sysUser.id);
            const hasUsername = sysUser.username && existingUsernames.has(sysUser.username.toLowerCase());
            const hasEmail = sysUser.email && existingEmails.has(sysUser.email.toLowerCase());

            if (!hasId && !hasUsername && !hasEmail) {
              upsertUser(sysUser).catch(() => {});
            }
          });
        }

        if (usrList && isInitial) {
          console.log(`✅ ${usrList.length} usuarios cargados desde Supabase.`);
        }
      } catch (err: any) {
        if (isInitial) console.warn('Error cargando usuarios de Supabase:', err.message);
      }
    }

    if (!isOfflineMode) {
      loadAllFromSupabase(true);
      
      // Auto-polling interval to keep data fully synchronized across all roles / sessions / devices
      const interval = setInterval(() => {
        loadAllFromSupabase(false);
      }, 5000); // Check every 5 seconds
      
      return () => clearInterval(interval);
    }
  }, [isOfflineMode]);

  // Save states locally in background using safeSetLocalStorage
  React.useEffect(() => {
    safeSetLocalStorage('solux_solar_projects', solarProjects);
  }, [solarProjects]);

  React.useEffect(() => {
    safeSetLocalStorage('solux_technicians', technicians);
  }, [technicians]);

  React.useEffect(() => {
    safeSetLocalStorage('solux_services', services);
  }, [services]);

  React.useEffect(() => {
    safeSetLocalStorage('solux_materials', materials);
  }, [materials]);

  React.useEffect(() => {
    safeSetLocalStorage('solux_offline_projects', offlineProjectsQueue);
  }, [offlineProjectsQueue]);

  React.useEffect(() => {
    safeSetLocalStorage('solux_users', users);
  }, [users]);

  React.useEffect(() => {
    safeSetLocalStorage('solux_config', soluxConfig);
  }, [soluxConfig]);

  React.useEffect(() => {
    safeSetLocalStorage('solux_notifications', notifications);
  }, [notifications]);

  React.useEffect(() => {
    safeSetLocalStorage('solux_landing_config', landingConfig);
  }, [landingConfig]);

  const handleUpdateLandingConfig = async (newConfig: LandingConfig): Promise<boolean> => {
    setLandingConfig(newConfig);
    safeSetLocalStorage('solux_landing_config', newConfig);
    if (!isOfflineMode) {
      try {
        const ok = await upsertLandingConfig(newConfig);
        return ok;
      } catch (e) {
        console.warn('Error al persistir configuración de landing en Supabase:', e);
        return false;
      }
    }
    return true;
  };


  // Synchronize offline projects when connection is restored / toggled
  const syncOfflineProjects = React.useCallback(() => {
    if (offlineProjectsQueue.length === 0) return;
    
    // Add pending offline projects to main solarProjects list
    setSolarProjects(prev => [...offlineProjectsQueue, ...prev]);
    
    // Clear offline queue
    setOfflineProjectsQueue([]);
    localStorage.removeItem('solux_offline_projects');
    
    // Show a pretty native alert / notification
    alert(`⚡ [Solux Green Sync] ¡Conexión Restablecida!\nSe han sincronizado correctamente ${offlineProjectsQueue.length} proyectos capturados en modo offline.`);
  }, [offlineProjectsQueue]);

  // Handle actual browser online events
  React.useEffect(() => {
    const handleOnline = () => {
      if (!isOfflineMode) {
        syncOfflineProjects();
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [isOfflineMode, syncOfflineProjects]);

  const handleToggleOfflineMode = () => {
    const nextVal = !isOfflineMode;
    setIsOfflineMode(nextVal);
    localStorage.setItem('solux_offline', String(nextVal));
    
    if (!nextVal) {
      // Toggled online manually, run sync!
      setTimeout(() => {
        syncOfflineProjects();
      }, 500);
    }
  };

  // --- Notifications Helper Handlers ---
  const handleTriggerNotification = React.useCallback(async (
    title: string,
    message: string,
    role: 'admin' | 'comercial' | 'enlace' | 'partner' | 'client' | 'all',
    userId?: string
  ) => {
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title,
      message,
      createdDate: new Date().toISOString().split('T')[0],
      isRead: false,
      role,
      userId
    };

    setNotifications(prev => [newNotif, ...prev]);

    if (!isOfflineMode) {
      try {
        await upsertNotification(newNotif);
      } catch (err) {
        console.warn('Error saving notification to Supabase:', err);
      }
    }

    playNotificationSound();
    sendBrowserNotification(title, message);
  }, [isOfflineMode]);

  const handleMarkNotificationAsRead = React.useCallback(async (id: string) => {
    setNotifications(prev => {
      const next = prev.map(n => n.id === id ? { ...n, isRead: true } : n);
      const updatedNotif = next.find(n => n.id === id);
      if (updatedNotif && !isOfflineMode) {
        upsertNotification(updatedNotif).catch(e => console.warn('Error marking notification read in Supabase:', e));
      }
      return next;
    });
  }, [isOfflineMode]);

  const handleMarkAllNotificationsAsRead = React.useCallback(async () => {
    setNotifications(prev => {
      const next = prev.map(n => ({ ...n, isRead: true }));
      // batch upsert each unread
      prev.forEach(n => {
        if (!n.isRead && !isOfflineMode) {
          upsertNotification({ ...n, isRead: true }).catch(e => console.warn('Error batch upserting read state:', e));
        }
      });
      return next;
    });
  }, [isOfflineMode]);

  const handleClearAllNotifications = React.useCallback(async () => {
    const backupNotifs = [...notifications];
    setNotifications([]);
    if (!isOfflineMode) {
      backupNotifs.forEach(n => {
        deleteNotification(n.id).catch(e => console.warn('Error deleting notification:', e));
      });
    }
  }, [isOfflineMode, notifications]);

  const handleDeleteNotification = React.useCallback(async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (!isOfflineMode) {
      try {
        await deleteNotification(id);
      } catch (err) {
        console.warn('Error deleting notification from Supabase:', err);
      }
    }
  }, [isOfflineMode]);

  const handleAddSolarProject = (newProject: SolarProject) => {
    if (isOfflineMode) {
      // Store in offline queue instead
      setOfflineProjectsQueue(prev => [newProject, ...prev]);
      alert(`📲 [Modo Offline Activo]\nEl prospecto solar "${newProject.clientName}" se guardó localmente en la memoria del navegador. Se sincronizará automáticamente al recuperar conexión.`);
    } else {
      setSolarProjects(prev => {
        const next = [newProject, ...prev];
        safeSetLocalStorage('solux_solar_projects', next);
        return next;
      });
      upsertSolarProject(newProject).catch(err => console.error("Error al upsertar proyecto solar:", err));
    }

    // Trigger notification when a client or prospect registers (Requirement 6)
    const title = '🆕 Nuevo Prospecto Registrado';
    const message = `El cliente ${newProject.clientName} se ha registrado en el sistema. Consumo: $${newProject.averageBill} CFE. Paneles estimados: ${newProject.estimatedPanels}.`;
    
    // Send to admin
    handleTriggerNotification(title, message, 'admin');
    // Send to comercial
    handleTriggerNotification(title, message, 'comercial');
  };

  const handleUpdateSolarProject = (id: string, updated: Partial<SolarProject>) => {
    setSolarProjects(prev => {
      const nextList = prev.map(p => {
        if (p.id === id) {
          const next = { ...p, ...updated };
          if (!isOfflineMode) {
            upsertSolarProject(next).catch(err => console.error("Error al upsertar proyecto solar actualizado:", err));
          }

          // Trigger notifications depending on changes
          if (updated.assignedPartnerId && updated.assignedPartnerId !== p.assignedPartnerId) {
            handleTriggerNotification(
              '📋 Levantamiento Técnico Asignado',
              `Se te ha asignado el levantamiento técnico para el cliente "${next.clientName}" en ${next.municipalityState || 'ubicación registrada'}.`,
              'partner',
              updated.assignedPartnerId
            );
            // Also notify admin and comercial for tracking
            handleTriggerNotification(
              '📋 Socio Asignado a Proyecto',
              `El proyecto de "${next.clientName}" ha sido asignado a un socio partner para su levantamiento técnico.`,
              'admin'
            );
          }

          if (updated.status && updated.status !== p.status) {
            handleTriggerNotification(
              '⚡ Estatus de Expediente Actualizado',
              `El expediente de "${next.clientName}" ha cambiado su estatus a: ${updated.status.toUpperCase()}.`,
              'comercial'
            );
            handleTriggerNotification(
              '⚡ Estatus de Expediente Actualizado',
              `El expediente de "${next.clientName}" ha cambiado su estatus a: ${updated.status.toUpperCase()}.`,
              'admin'
            );

            // Find if there is a client user with matching name or email to notify them as well
            const matchedClient = users.find(u => u.role === 'client' && u.fullName?.toLowerCase() === next.clientName?.toLowerCase());
            if (matchedClient) {
              handleTriggerNotification(
                '⚡ Tu Proyecto Solar tiene Actualizaciones',
                `El estatus de tu proyecto solar ha sido cambiado a: ${updated.status.toUpperCase()}.`,
                'client',
                matchedClient.id
              );
            }
          }

          if (updated.siteSurveyStatus && updated.siteSurveyStatus !== p.siteSurveyStatus) {
            const isDone = updated.siteSurveyStatus === 'concluido';
            const statusLabel = isDone ? 'CONCLUIDO' : 'EN PROCESO';
            handleTriggerNotification(
              `✅ Levantamiento Técnico ${statusLabel}`,
              `El socio partner ha marcado el levantamiento del cliente "${next.clientName}" como: ${statusLabel}.`,
              'admin'
            );
            handleTriggerNotification(
              `✅ Levantamiento Técnico ${statusLabel}`,
              `El socio partner ha marcado el levantamiento del cliente "${next.clientName}" como: ${statusLabel}.`,
              'comercial'
            );
          }

          return next;
        }
        return p;
      });
      const updatedItem = nextList.find(p => p.id === id);
      const finalProjectsList = updatedItem ? [updatedItem, ...nextList.filter(p => p.id !== id)] : nextList;
      safeSetLocalStorage('solux_solar_projects', finalProjectsList);
      return finalProjectsList;
    });
  };

  const handleUpdateSoluxConfig = (config: any) => {
    setSoluxConfig(prev => {
      const merged = { ...prev, ...config };
      const nowIso = new Date().toISOString();
      const normalized = {
        panelBasePrice: merged.panelBasePrice !== '' && merged.panelBasePrice != null ? Number(merged.panelBasePrice) : 11000,
        monthlyInterestRate: merged.monthlyInterestRate !== '' && merged.monthlyInterestRate != null ? Number(merged.monthlyInterestRate) : 4.9,
        siteSurveyCost: merged.siteSurveyCost !== '' && merged.siteSurveyCost != null ? Number(merged.siteSurveyCost) : 250,
        defaultDownPaymentPercent: merged.defaultDownPaymentPercent !== '' && merged.defaultDownPaymentPercent != null ? Number(merged.defaultDownPaymentPercent) : 50,
        contadoDiscountPercent: merged.contadoDiscountPercent !== '' && merged.contadoDiscountPercent != null ? Number(merged.contadoDiscountPercent) : 5,
        financingTermMonths: merged.financingTerms && Array.isArray(merged.financingTerms)
          ? merged.financingTerms.filter((t: any) => t.active).map((t: any) => t.months)
          : (merged.financingTermMonths || [3, 6]),
        financingTerms: merged.financingTerms || prev?.financingTerms || [],
        updatedAt: config.updatedAt || nowIso
      };
      safeSetLocalStorage('solux_config', normalized);
      localStorage.setItem('solux_config_configured', 'true');
      localStorage.setItem('solux_panel_price_updated_at', normalized.updatedAt);
      if (!isOfflineMode) {
        upsertSoluxConfig(normalized).catch(err => console.error("Error al upsertar configuración:", err));
      }
      return normalized;
    });
  };

  const handleUpdateUsers = (nextUsers: any[] | ((prev: any[]) => any[])) => {
    setUsers(prevUsers => {
      const resolved = typeof nextUsers === 'function' ? nextUsers(prevUsers) : nextUsers;
      const deduplicated = deduplicateUsers(resolved);
      safeSetLocalStorage('solux_users', deduplicated);
      
      // Sync differences with Supabase
      if (!isOfflineMode) {
        deduplicated.forEach(user => {
          const prevUser = prevUsers.find(u => u.id === user.id);
          if (!prevUser || JSON.stringify(prevUser) !== JSON.stringify(user)) {
            upsertUser(user).catch(err => console.error("Error al upsertar usuario:", err));
          }
        });
      }
      return deduplicated;
    });
  };

  const handleDeleteSolarProject = (id: string) => {
    setSolarProjects(prev => {
      const nextList = prev.filter(p => p.id !== id);
      safeSetLocalStorage('solux_solar_projects', nextList);
      return nextList;
    });
    if (!isOfflineMode) {
      deleteSolarProject(id).catch(err => console.error("Error deleting project:", err));
    }
  };

  const handleDeleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    if (!isOfflineMode) {
      deleteUser(id).catch(err => console.error("Error deleting user:", err));
    }
  };

  const handleDeleteTechnician = (id: string) => {
    setTechnicians(prev => prev.filter(t => t.id !== id));
    if (!isOfflineMode) {
      deleteTechnician(id).catch(err => console.error("Error deleting technician:", err));
    }
  };

  const handleDeleteMaterial = (id: string) => {
    setMaterials(prev => prev.filter(m => m.id !== id));
    if (!isOfflineMode) {
      deleteMaterial(id).catch(err => console.error("Error deleting material:", err));
    }
  };

  const handleDeleteService = (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
    if (!isOfflineMode) {
      deleteService(id).catch(err => console.error("Error deleting service:", err));
    }
  };

  // Active Simulation Role & User Session persistence across refreshes
  const [currentUser, setCurrentUser] = useState<any>(() => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem('solux_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [activeRole, setActiveRole] = useState<'admin' | 'comercial' | 'tech' | 'enlace' | 'client' | 'landingpage' | 'landingadmin' | 'public_client_reg' | 'public_enlace_reg' | 'login' | null>(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      if (
        searchParams.get('vista') === 'login' ||
        searchParams.get('acceso') === 'portal' ||
        window.location.pathname === '/login' ||
        window.location.hash.includes('login')
      ) {
        return 'login';
      }
      if (
        searchParams.get('vista') === 'landing' ||
        window.location.pathname === '/landing' ||
        window.location.pathname === '/landingpage' ||
        window.location.hash.includes('landingpage')
      ) {
        return 'landingpage';
      }
      if (
        searchParams.get('vista') === 'admin-landing' ||
        window.location.pathname === '/admin-landing' ||
        window.location.hash.includes('admin-landing')
      ) {
        return 'landingadmin';
      }
      if (
        searchParams.get('registro') === 'enlace' ||
        searchParams.get('enlace') === 'true' ||
        window.location.pathname.includes('/registro-enlace') ||
        window.location.pathname.includes('/enlace-registro') ||
        window.location.hash.includes('registro-enlace')
      ) {
        return 'public_enlace_reg';
      }
      if (window.location.pathname === '/clientes' || window.location.href.includes('/clientes') || window.location.hash === '#/clientes' || window.location.hash.includes('clientes')) {
        const savedUserStr = localStorage.getItem('solux_current_user');
        if (savedUserStr) {
          try {
            const parsed = JSON.parse(savedUserStr);
            if (parsed && parsed.role) {
              return parsed.role === 'partner' ? 'tech' : parsed.role;
            }
          } catch (e) {
            // ignore
          }
        }
        return 'public_client_reg';
      }
    }
    const savedRole = typeof window !== 'undefined' ? localStorage.getItem('solux_active_role') : null;
    if (savedRole && savedRole !== 'null' && savedRole !== 'undefined') return savedRole as any;

    // Fallback: derive role from currentUser if present
    const savedUserStr = typeof window !== 'undefined' ? localStorage.getItem('solux_current_user') : null;
    if (savedUserStr) {
      try {
        const u = JSON.parse(savedUserStr);
        if (u && u.role) {
          if (u.role === 'admin') return 'admin';
          if (u.role === 'comercial') return 'comercial';
          if (u.role === 'enlace') return 'enlace';
          if (u.role === 'partner') return 'tech';
          if (u.role === 'client') return 'client';
        }
      } catch (e) {
        // ignore
      }
    }
    // Default home page is the landing page
    return 'landingpage';
  });

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      if (
        searchParams.get('registro') === 'enlace' ||
        searchParams.get('enlace') === 'true' ||
        window.location.pathname.includes('/registro-enlace') ||
        window.location.pathname.includes('/enlace-registro') ||
        window.location.hash.includes('registro-enlace')
      ) {
        setActiveRole('public_enlace_reg');
        return;
      }
      if (window.location.pathname === '/clientes' || window.location.href.includes('/clientes') || window.location.hash === '#/clientes' || window.location.hash.includes('clientes')) {
        const savedUserStr = localStorage.getItem('solux_current_user');
        if (savedUserStr) {
          try {
            const parsed = JSON.parse(savedUserStr);
            if (parsed && parsed.role) {
              setActiveRole(parsed.role === 'partner' ? 'tech' : parsed.role);
              return;
            }
          } catch (e) {
            // ignore
          }
        }
        setActiveRole('public_client_reg');
      }
    }
  }, []);

  React.useEffect(() => {
    if (activeRole) {
      safeSetLocalStorage('solux_active_role', activeRole);
    } else {
      try { localStorage.removeItem('solux_active_role'); } catch (e) {}
    }
  }, [activeRole]);

  React.useEffect(() => {
    if (currentUser) {
      safeSetLocalStorage('solux_current_user', currentUser);
    } else {
      try { localStorage.removeItem('solux_current_user'); } catch (e) {}
    }
  }, [currentUser]);

  // On initial load, route non-admin users to their assigned role dashboard once
  const hasAutoRoutedRoleRef = React.useRef(false);
  React.useEffect(() => {
    if (!hasAutoRoutedRoleRef.current && currentUser && currentUser.role && !activeRole) {
      hasAutoRoutedRoleRef.current = true;
      const cleanRole = sanitizeUserRole(currentUser.role);
      const expectedActiveRole = cleanRole === 'partner' ? 'tech' : cleanRole;
      setActiveRole(expectedActiveRole as any);
    }
  }, [currentUser, activeRole]);

  // Synchronize effectiveUser if role is set but no currentUser is set
  React.useEffect(() => {
    if (activeRole && !currentUser && users && users.length > 0) {
      let defaultUser = null;
      if (activeRole === 'admin') {
        defaultUser = users.find((u: any) => u.role === 'admin' && u.whatsapp && u.whatsapp.trim() !== '') || users.find((u: any) => u.role === 'admin');
      } else if (activeRole === 'comercial') {
        defaultUser = users.find((u: any) => u.role === 'comercial');
      } else if (activeRole === 'enlace') {
        defaultUser = users.find((u: any) => u.role === 'enlace');
      } else if (activeRole === 'tech') {
        defaultUser = users.find((u: any) => u.role === 'partner');
      }
      if (defaultUser) {
        setCurrentUser(defaultUser);
      }
    }
  }, [activeRole, currentUser, users]);

  const handleUpdateProfile = (updatedUser: any) => {
    const finalUpdatedUser = {
      ...currentUser,
      ...updatedUser
    };

    setCurrentUser(finalUpdatedUser);
    safeSetLocalStorage('solux_current_user', finalUpdatedUser);

    setUsers((prev: any[]) => {
      const exists = prev.some(u => u.id === finalUpdatedUser.id || (u.username && u.username.toLowerCase() === (finalUpdatedUser.username || '').toLowerCase()));
      const nextList = exists
        ? prev.map(u => (u.id === finalUpdatedUser.id || (u.username && u.username.toLowerCase() === (finalUpdatedUser.username || '').toLowerCase())) ? { ...u, ...finalUpdatedUser } : u)
        : [...prev, finalUpdatedUser];
      const deduplicated = deduplicateUsers(nextList);
      safeSetLocalStorage('solux_users', deduplicated);
      return deduplicated;
    });

    if (!isOfflineMode) {
      // Upsert only the target updated user in Supabase
      upsertUser(finalUpdatedUser).then(success => {
        if (success) {
          console.log("✅ Perfil guardado exitosamente en Supabase");
        } else {
          console.warn("⚠️ No se pudo actualizar en Supabase, conservando versión en LocalStorage");
        }
      }).catch(err => console.error("Error al upsertar perfil modificado:", err));
    }
  };

  const handleExitSession = React.useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('solux_current_user');
    localStorage.removeItem('solux_active_role');
    localStorage.removeItem('solux_admin_supervision');
    if (typeof window !== 'undefined' && (window.location.pathname === '/clientes' || window.location.href.includes('/clientes') || window.location.hash === '#/clientes' || window.location.hash.includes('clientes'))) {
      setActiveRole('public_client_reg');
    } else {
      setActiveRole('landingpage');
    }
  }, []);

  const handleSwitchUser = React.useCallback((targetUser: any) => {
    if (!targetUser) return;
    const cleanRole = sanitizeUserRole(targetUser.role);
    let targetRole: any = cleanRole;
    if (cleanRole === 'partner') targetRole = 'tech';

    // If current user is admin, remember original admin for returning
    if (currentUser?.role === 'admin' && targetUser.id !== currentUser.id) {
      safeSetLocalStorage('solux_admin_supervision', currentUser);
    }

    setCurrentUser(targetUser);
    setActiveRole(targetRole);
    safeSetLocalStorage('solux_current_user', targetUser);
    safeSetLocalStorage('solux_active_role', targetRole);
  }, [currentUser]);

  // --- Multi-Role Login & Registration Portal States ---
  const [homeActiveTab, setHomeActiveTab] = useState<'login' | 'register'>('login');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'admin' | 'comercial' | 'tech' | 'enlace' | 'client'>('admin');

  // Login Form States
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Registration Form States
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regWhatsapp, setRegWhatsapp] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regAdminKey, setRegAdminKey] = useState('');
  const [regPartnerCompany, setRegPartnerCompany] = useState('');
  const [regCityZone, setRegCityZone] = useState('');
  const [regCfeBill, setRegCfeBill] = useState<number>(0);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  // Quick fill demo credentials for selected role
  const handleQuickFillDemo = (role: 'admin' | 'comercial' | 'tech' | 'enlace' | 'client') => {
    setLoginError('');
    if (role === 'admin') {
      setLoginUsername('admin');
      setLoginPassword('password123');
    } else if (role === 'comercial') {
      setLoginUsername('verde1');
      setLoginPassword('password123');
    } else if (role === 'tech') {
      setLoginUsername('partner1');
      setLoginPassword('password123');
    } else if (role === 'enlace') {
      setLoginUsername('enlace1');
      setLoginPassword('password123');
    } else if (role === 'client') {
      const clientUser = users.find((u: any) => u.role === 'client');
      if (clientUser) {
        setLoginUsername(clientUser.username);
        setLoginPassword(clientUser.password || 'SOLUX2026');
      } else {
        setLoginUsername('cliente_demo');
        setLoginPassword('SOLUX2026');
      }
    }
  };

  // Direct 1-click enter as demo user for role
  const handleQuickEnterDemo = (role: 'admin' | 'comercial' | 'tech' | 'enlace' | 'client') => {
    let targetUser = users.find((u: any) => {
      if (role === 'admin') return u.role === 'admin';
      if (role === 'comercial') return u.role === 'comercial';
      if (role === 'tech') return u.role === 'partner';
      if (role === 'enlace') return u.role === 'enlace';
      if (role === 'client') return u.role === 'client';
      return false;
    });

    if (!targetUser) {
      targetUser = {
        id: `usr_demo_${role}_${Date.now()}`,
        username: `${role}_demo`,
        email: `${role}@soluxgreen.com.mx`,
        password: 'password123',
        role: role === 'tech' ? 'partner' : role,
        fullName: `Usuario Demo ${role.toUpperCase()}`,
        whatsapp: currentUser?.whatsapp || '5500000000',
        avatar: currentUser?.avatar || ''
      };
      setUsers((prev: any[]) => [targetUser, ...prev]);
    }

    const mappedActiveRole = role === 'tech' ? 'tech' : role;
    setCurrentUser(targetUser);
    setActiveRole(mappedActiveRole as any);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    const trimUser = loginUsername.trim().toLowerCase();
    const trimPass = loginPassword.trim();
    const cleanDigits = trimUser.replace(/\D/g, '');

    if (!trimUser) {
      setLoginError('Por favor ingresa tu nombre de usuario o correo electrónico.');
      return;
    }

    let allUsersList = [...users];

    // Attempt remote fetch from Supabase if offline mode is disabled
    if (!isOfflineMode) {
      try {
        const remoteUsers = await fetchUsers();
        if (remoteUsers && remoteUsers.length > 0) {
          allUsersList = deduplicateUsers([...allUsersList, ...remoteUsers]);
          setUsers(allUsersList);
        }
      } catch (err) {
        console.warn('Error syncing remote users during login:', err);
      }
    }

    // 1. Try matching user by username, email, phone, or name with role-prioritization
    const targetFilterRole = selectedRoleFilter === 'tech' ? 'partner' : selectedRoleFilter;

    // A) Exact username match within selected role
    let foundUser = allUsersList.find((u: any) => {
      const uname = (u.username || '').trim().toLowerCase();
      const urole = sanitizeUserRole(u.role);
      return (!selectedRoleFilter || urole === targetFilterRole) && uname === trimUser;
    });

    // B) Exact username match across any role
    if (!foundUser) {
      foundUser = allUsersList.find((u: any) => {
        const uname = (u.username || '').trim().toLowerCase();
        return uname === trimUser;
      });
    }

    // C) Full name match within selected role
    if (!foundUser) {
      foundUser = allUsersList.find((u: any) => {
        const uNameNorm = (u.fullName || '').trim().toLowerCase();
        const uNameClean = uNameNorm.replace(/[^a-z0-9]/g, '');
        const urole = sanitizeUserRole(u.role);
        return (!selectedRoleFilter || urole === targetFilterRole) && (uNameNorm === trimUser || uNameClean === trimUser);
      });
    }

    // D) Full name match across any role
    if (!foundUser) {
      foundUser = allUsersList.find((u: any) => {
        const uNameNorm = (u.fullName || '').trim().toLowerCase();
        const uNameClean = uNameNorm.replace(/[^a-z0-9]/g, '');
        return uNameNorm === trimUser || uNameClean === trimUser;
      });
    }

    // E) Email match within selected role
    if (!foundUser) {
      foundUser = allUsersList.find((u: any) => {
        const uemail = (u.email || '').trim().toLowerCase();
        const urole = sanitizeUserRole(u.role);
        return (!selectedRoleFilter || urole === targetFilterRole) && (uemail === trimUser || (uemail && uemail.split('@')[0] === trimUser));
      });
    }

    // F) Phone match within selected role
    if (!foundUser && cleanDigits && cleanDigits.length >= 8) {
      foundUser = allUsersList.find((u: any) => {
        const uphone = (u.whatsapp || '').replace(/\D/g, '');
        const urole = sanitizeUserRole(u.role);
        return (!selectedRoleFilter || urole === targetFilterRole) && uphone === cleanDigits;
      });
    }

    // G) Fallback matching any user
    if (!foundUser) {
      foundUser = allUsersList.find((u: any) => {
        const uname = (u.username || '').trim().toLowerCase();
        const uemail = (u.email || '').trim().toLowerCase();
        const uphone = (u.whatsapp || '').replace(/\D/g, '');
        const uNameNorm = (u.fullName || '').trim().toLowerCase();
        const uNameClean = uNameNorm.replace(/[^a-z0-9]/g, '');

        return (
          uname === trimUser || 
          uemail === trimUser || 
          (uphone && uphone === cleanDigits && cleanDigits.length >= 8) ||
          uNameNorm === trimUser ||
          uNameClean === trimUser ||
          (uname && uname.split('_')[0] === trimUser) ||
          (uemail && uemail.split('@')[0] === trimUser)
        );
      });
    }

    if (foundUser) {
      // If user matched, sync/update password if necessary
      if (trimPass && foundUser.password !== trimPass) {
        foundUser = { ...foundUser, password: trimPass };
        setUsers(prev => prev.map(u => u.id === foundUser.id ? foundUser : u));
        upsertUser(foundUser).catch(err => console.warn('Error updating user password on login:', err));
      }
    }

    // 2. Fallback: Check solarProjects if no user found in users array
    if (!foundUser) {
      const matchingProject = solarProjects.find(proj => {
        const cName = (proj.clientName || '').trim().toLowerCase();
        const cEmail = (proj.clientEmail || '').trim().toLowerCase();
        const cPhone = (proj.clientPhone || '').replace(/\D/g, '');
        const cNameClean = cName.replace(/[^a-z0-9]/g, '');

        return (
          cName === trimUser ||
          cEmail === trimUser ||
          (cPhone && cPhone === cleanDigits && cleanDigits.length >= 8) ||
          cNameClean === trimUser ||
          (cEmail && cEmail.split('@')[0] === trimUser) ||
          (cNameClean.slice(0, 10) === trimUser)
        );
      });

      if (matchingProject) {
        const genUser = matchingProject.clientEmail 
          ? matchingProject.clientEmail.split('@')[0] 
          : (matchingProject.clientName || 'cliente').toLowerCase().replace(/[^a-z0-9]/g, '');
        
        foundUser = {
          id: `usr_client_${Date.now()}`,
          username: genUser,
          password: trimPass || 'Solux2026!',
          role: 'client',
          fullName: matchingProject.clientName,
          whatsapp: matchingProject.clientPhone,
          email: matchingProject.clientEmail || `${genUser}@soluxgreen.com.mx`
        };

        setUsers(prev => deduplicateUsers([foundUser, ...prev]));
        upsertUser(foundUser).catch(err => console.warn('Error saving auto-resolved client user:', err));
      }
    }

    // 3. Auto-provisioning fallback for new credentials like anakarepies@gmail.com
    if (!foundUser && trimUser.length >= 3) {
      const targetRole = selectedRoleFilter === 'tech' ? 'partner' : selectedRoleFilter;
      const userPrefix = trimUser.includes('@') ? trimUser.split('@')[0] : trimUser;
      const nameParts = userPrefix.split(/[\._-]/).map(p => p.charAt(0).toUpperCase() + p.slice(1));
      const formattedFullName = nameParts.join(' ') || 'Usuario Registrado';

      foundUser = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        username: userPrefix,
        email: trimUser.includes('@') ? trimUser : `${userPrefix}@soluxgreen.com.mx`,
        password: trimPass || 'Solux2026!',
        role: targetRole,
        fullName: formattedFullName,
        whatsapp: ''
      };

      setUsers(prev => deduplicateUsers([foundUser, ...prev]));
      upsertUser(foundUser).catch(err => console.warn('Error auto-creating new login user:', err));
    }
    
    if (foundUser) {
      const cleanRole = sanitizeUserRole(foundUser.role);
      let targetRole: 'admin' | 'comercial' | 'tech' | 'enlace' | 'client' | null = null;
      if (cleanRole === 'admin') targetRole = 'admin';
      else if (cleanRole === 'comercial') targetRole = 'comercial';
      else if (cleanRole === 'enlace') targetRole = 'enlace';
      else if (cleanRole === 'partner') targetRole = 'tech';
      else if (cleanRole === 'client') targetRole = 'client';

      // Override role if logging in with explicit active role card selection
      if (!targetRole && selectedRoleFilter) {
        targetRole = selectedRoleFilter;
      }

      if (targetRole) {
        const userWithCleanRole = { ...foundUser, role: cleanRole === 'partner' ? 'partner' : targetRole === 'tech' ? 'partner' : cleanRole };
        try { localStorage.removeItem('solux_admin_supervision'); } catch (e) {}
        setActiveRole(targetRole);
        setCurrentUser(userWithCleanRole);
        safeSetLocalStorage('solux_current_user', userWithCleanRole);
        safeSetLocalStorage('solux_active_role', targetRole);
        setLoginUsername('');
        setLoginPassword('');
        setLoginError('');
      } else {
        setLoginError('Rol de usuario desconocido.');
      }
    } else {
      setLoginError('Nombre de usuario, correo o contraseña incorrectos.');
    }
  };

  // Submit Handler for Multi-Role User Registration
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    if (!regFullName.trim() || !regUsername.trim() || !regEmail.trim() || !regPassword) {
      setRegError('Por favor completa todos los campos requeridos (*).');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('Las contraseñas no coinciden. Verifícalas e intenta nuevamente.');
      return;
    }

    const cleanUsername = regUsername.trim().toLowerCase();
    const cleanEmail = regEmail.trim().toLowerCase();

    const existing = users.find((u: any) => 
      u.username.toLowerCase() === cleanUsername || 
      (u.email && u.email.toLowerCase() === cleanEmail)
    );

    if (existing) {
      setRegError('El nombre de usuario o correo ya se encuentra registrado.');
      return;
    }

    const mappedUserRole = selectedRoleFilter === 'tech' ? 'partner' : selectedRoleFilter;

    const newUserId = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newUser = {
      id: newUserId,
      username: regUsername.trim(),
      email: cleanEmail,
      password: regPassword,
      role: mappedUserRole,
      fullName: regFullName.trim(),
      whatsapp: regWhatsapp.trim() || '',
      company: mappedUserRole === 'partner' ? (regPartnerCompany.trim() || 'Socio Instalador') : undefined,
      city: (mappedUserRole === 'enlace' || mappedUserRole === 'client') ? regCityZone.trim() : undefined,
      createdDate: new Date().toISOString()
    };

    setUsers((prev: any[]) => {
      const nextList = [newUser, ...prev];
      localStorage.setItem('solux_users', JSON.stringify(nextList));
      return nextList;
    });

    if (!isOfflineMode) {
      upsertUser(newUser).catch(err => console.error("Error al guardar nuevo usuario:", err));
    }

    if (mappedUserRole === 'client' && regCfeBill > 0) {
      const panelsCount = Math.ceil(regCfeBill / 1000) * 2 || 4;
      const investment = panelsCount * (Number(soluxConfig?.panelBasePrice) || 11000);
      const newProj: SolarProject = {
        id: `proj_${Date.now()}`,
        clientName: regFullName.trim(),
        clientPhone: regWhatsapp.trim() || '5500000000',
        clientEmail: cleanEmail,
        municipalityState: regCityZone.trim() || 'Ciudad de México, CDMX',
        averageBill: regCfeBill,
        estimatedPanels: panelsCount,
        requiredArea: Number((panelsCount * 2.88).toFixed(2)),
        voltageAlert220v: panelsCount > 4,
        voltageUpgradeQuoted: panelsCount > 4,
        totalInvestment: investment,
        status: 'diagnostico_generado',
        paymentMethodDesired: 'financiamiento_solux',
        propertyOwnership: 'propietario',
        cfeStatus: 'activo_sin_adeudo',
        electricalLoadType: ['Residencial Solar'],
        wiresCount: panelsCount > 4 ? 3 : 2,
        availableSpace: Number((panelsCount * 2.88).toFixed(2)),
        metersCount: 1,
        siteSurveyPaid: false,
        siteSurveyStatus: 'pendiente',
        evidence: {},
        payments: [],
        createdDate: new Date().toISOString().split('T')[0]
      };
      handleAddSolarProject(newProj);
    }

    handleTriggerNotification(
      `🎉 Nuevo Usuario Registrado`,
      `Se ha registrado el usuario "${newUser.fullName}" con el rol de ${mappedUserRole.toUpperCase()}.`,
      'admin'
    );

    setRegSuccess(`¡Cuenta con rol ${selectedRoleFilter.toUpperCase()} creada con éxito! Accediendo al panel...`);

    setRegFullName('');
    setRegUsername('');
    setRegEmail('');
    setRegWhatsapp('');
    setRegPassword('');
    setRegConfirmPassword('');
    setRegAdminKey('');
    setRegPartnerCompany('');
    setRegCityZone('');

    setTimeout(() => {
      const mappedActiveRole = selectedRoleFilter === 'tech' ? 'tech' : selectedRoleFilter;
      setCurrentUser(newUser);
      setActiveRole(mappedActiveRole as any);
    }, 1100);
  };

  // --- Handlers for Admin Dashboard ---
  const handleAssignService = (serviceId: string, technicianId: string) => {
    setServices(prev => prev.map(s => 
      s.id === serviceId ? { ...s, assignedTechnicianId: technicianId, status: 'assigned' } : s
    ));
    setTechnicians(prev => prev.map(t => 
      t.id === technicianId ? { ...t, status: 'on_way' } : t
    ));
  };

  const handleUpdateCatalogPrice = (id: string, newPrice: number) => {
    setCatalog(prev => prev.map(item => 
      item.id === id ? { ...item, basePrice: newPrice } : item
    ));
  };

  const handleAddCatalogItem = (newItem: Omit<ServiceType, 'id'>) => {
    const itemWithId: ServiceType = {
      ...newItem,
      id: `cat_${Date.now()}`
    };
    setCatalog(prev => [...prev, itemWithId]);
  };

  const handleDeleteCatalogItem = (id: string) => {
    setCatalog(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdateUrgenciesSurcharge = (amount: number) => {
    setUrgencySurcharge(amount);
  };

  // --- Handlers for Technician Dashboard ---
  const handleCompleteService = (
    serviceId: string, 
    evidence: { 
      beforeImage?: string; 
      afterImage?: string; 
      materialsUsed: { materialId: string; name: string; quantity: number; unitPrice: number }[]; 
      paymentMethod: 'cash' | 'card' | 'spei'; 
      paymentStatus: 'paid'; 
      signature: string 
    }
  ) => {
    setServices(prev => prev.map(s => {
      if (s.id !== serviceId) return s;
      const matsTotal = evidence.materialsUsed.reduce((sum, m) => sum + (m.quantity * m.unitPrice), 0);
      const finalTotal = s.basePrice + s.urgencySurcharge + matsTotal;
      return {
        ...s,
        status: 'completed',
        completedDate: new Date().toISOString(),
        beforeImage: evidence.beforeImage,
        afterImage: evidence.afterImage,
        materialsUsed: evidence.materialsUsed,
        materialsTotal: matsTotal,
        finalTotal: finalTotal,
        paymentMethod: evidence.paymentMethod,
        paymentStatus: 'paid',
        clientSignature: evidence.signature
      };
    }));

    // Free the technician and increase earnings and completed counts
    const completedService = services.find(s => s.id === serviceId);
    if (completedService?.assignedTechnicianId) {
      const techId = completedService.assignedTechnicianId;
      setTechnicians(prev => prev.map(t => {
        if (t.id !== techId) return t;
        return {
          ...t,
          status: 'free',
          completedServicesCount: t.completedServicesCount + 1,
          totalEarnings: t.totalEarnings + (completedService.basePrice * 0.4) // Technician earns 40% of base
        };
      }));
    }
  };

  const handleUpdateTechStatus = (techId: string, status: 'free' | 'on_way' | 'in_service') => {
    setTechnicians(prev => prev.map(t => 
      t.id === techId ? { ...t, status } : t
    ));
  };

  // --- Handlers for Client Dashboard ---
  const handleRequestService = (request: {
    clientName: string;
    clientPhone: string;
    address: string;
    category: 'plomería' | 'electricidad' | 'herrería' | 'clima' | 'otro';
    description: string;
    priority: 'normal' | 'urgent';
    scheduledDate: string;
    basePrice: number;
  }) => {
    const newSrv: Service = {
      id: `srv_${Date.now()}`,
      clientName: request.clientName,
      clientPhone: request.clientPhone,
      address: request.address,
      coordinates: { 
        lat: 19.41 + (Math.random() - 0.5) * 0.05, 
        lng: -99.16 + (Math.random() - 0.5) * 0.05 
      },
      category: request.category,
      description: request.description,
      status: 'pending',
      priority: request.priority,
      scheduledDate: request.scheduledDate,
      createdDate: new Date().toISOString(),
      materialsUsed: [],
      basePrice: request.basePrice,
      urgencySurcharge: request.priority === 'urgent' ? urgencySurcharge : 0,
      paymentSurcharge: 0,
      materialsTotal: 0,
      finalTotal: request.basePrice + (request.priority === 'urgent' ? urgencySurcharge : 0),
      paymentStatus: 'pending'
    };
    
    setServices(prev => [newSrv, ...prev]);
  };

  // Roles Definition
  const roles = [
    {
      id: 'admin' as const,
      title: 'Administrador General',
      icon: Crown,
      color: 'from-violet-500 to-indigo-600',
      bgColor: 'bg-violet-50/70 text-violet-600 border-violet-100/50',
      badgeColor: 'bg-violet-600'
    },
    {
      id: 'comercial' as const,
      title: 'Asesor Verde',
      icon: TrendingUp,
      color: 'from-orange-500 to-amber-600',
      bgColor: 'bg-orange-50/70 text-orange-600 border-orange-100/50',
      badgeColor: 'bg-orange-600'
    },
    {
      id: 'tech' as const,
      title: 'Partner de Instalaciones',
      icon: Wrench,
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-50/70 text-emerald-600 border-emerald-100/50',
      badgeColor: 'bg-emerald-600'
    },
    {
      id: 'enlace' as const,
      title: 'Asesor de Enlace (Gana Dinero Sin Vender)',
      icon: Handshake,
      color: 'from-rose-500 to-pink-600',
      bgColor: 'bg-rose-50/70 text-rose-600 border-rose-100/50',
      badgeColor: 'bg-rose-600'
    },
    {
      id: 'client' as const,
      title: 'Cliente Final',
      icon: User,
      color: 'from-sky-500 to-blue-600',
      bgColor: 'bg-sky-50/70 text-sky-600 border-sky-100/50',
      badgeColor: 'bg-sky-600'
    },
    {
      id: 'landingpage' as const,
      title: 'Landing Page (Pública)',
      icon: Globe,
      color: 'from-teal-500 to-emerald-600',
      bgColor: 'bg-teal-50/70 text-teal-600 border-teal-100/50',
      badgeColor: 'bg-teal-600'
    },
    {
      id: 'landingadmin' as const,
      title: 'Admin Landing Page',
      icon: SlidersHorizontal,
      color: 'from-violet-500 to-purple-600',
      bgColor: 'bg-violet-50/70 text-violet-600 border-violet-100/50',
      badgeColor: 'bg-violet-600'
    }
  ];

  const [showMobileRoleModal, setShowMobileRoleModal] = useState(false);

  const renderAdminSwitcher = () => {
    const originalAdminRaw = typeof window !== 'undefined' ? localStorage.getItem('solux_admin_supervision') : null;
    let originalAdmin: any = null;
    if (originalAdminRaw) {
      try { originalAdmin = JSON.parse(originalAdminRaw); } catch(e) {}
    }
    
    const roleLabels: Record<string, string> = {
      admin: 'Administrador',
      comercial: 'Asesor Verde',
      tech: 'Partner de Instalación',
      enlace: 'Asesor Enlace',
      client: 'Cliente Solar',
      landingpage: 'Landing Page',
      landingadmin: 'Admin Landing'
    };

    const handleSwitchToRole = (targetRole: 'admin' | 'comercial' | 'tech' | 'enlace' | 'client' | 'landingpage' | 'landingadmin') => {
      if (currentUser?.role === 'admin') {
        safeSetLocalStorage('solux_admin_supervision', currentUser);
      }

      if (targetRole === 'landingpage') {
        setActiveRole('landingpage');
        safeSetLocalStorage('solux_active_role', 'landingpage');
        return;
      }

      if (targetRole === 'landingadmin') {
        setActiveRole('landingadmin');
        safeSetLocalStorage('solux_active_role', 'landingadmin');
        return;
      }

      if (targetRole === 'admin') {
        const adminUser = originalAdmin || users.find((u: any) => u.role === 'admin') || INITIAL_SYSTEM_USERS.find(u => u.role === 'admin');
        if (adminUser) {
          setCurrentUser(adminUser);
          safeSetLocalStorage('solux_current_user', adminUser);
        }
        try { localStorage.removeItem('solux_admin_supervision'); } catch(e) {}
        setActiveRole('admin');
        safeSetLocalStorage('solux_active_role', 'admin');
        return;
      }

      if (targetRole === 'comercial') {
        const comUser = (currentUser?.role === 'comercial' ? currentUser : null) || users.find((u: any) => u.role === 'comercial') || INITIAL_SYSTEM_USERS.find(u => u.role === 'comercial');
        if (comUser && currentUser?.role !== 'comercial') {
          setCurrentUser(comUser);
          safeSetLocalStorage('solux_current_user', comUser);
        }
        setActiveRole('comercial');
        safeSetLocalStorage('solux_active_role', 'comercial');
        return;
      }

      if (targetRole === 'tech') {
        const techUser = (currentUser?.role === 'partner' ? currentUser : null) || users.find((u: any) => u.role === 'partner' || u.role === 'tech') || INITIAL_SYSTEM_USERS.find(u => u.role === 'partner');
        if (techUser && currentUser?.role !== 'partner' && currentUser?.role !== 'tech') {
          setCurrentUser(techUser);
          safeSetLocalStorage('solux_current_user', techUser);
        }
        setActiveRole('tech');
        safeSetLocalStorage('solux_active_role', 'tech');
        return;
      }

      if (targetRole === 'enlace') {
        const enlUser = (currentUser?.role === 'enlace' ? currentUser : null) || users.find((u: any) => u.username === 'juan') || users.find((u: any) => u.role === 'enlace') || INITIAL_SYSTEM_USERS.find(u => u.role === 'enlace');
        if (enlUser && currentUser?.role !== 'enlace') {
          setCurrentUser(enlUser);
          safeSetLocalStorage('solux_current_user', enlUser);
        }
        setActiveRole('enlace');
        safeSetLocalStorage('solux_active_role', 'enlace');
        return;
      }

      if (targetRole === 'client') {
        const clientUser = (currentUser?.role === 'client' ? currentUser : null) || users.find((u: any) => u.role === 'client') || INITIAL_SYSTEM_USERS.find(u => u.role === 'client');
        if (clientUser && currentUser?.role !== 'client') {
          setCurrentUser(clientUser);
          safeSetLocalStorage('solux_current_user', clientUser);
        }
        setActiveRole('client');
        safeSetLocalStorage('solux_active_role', 'client');
        return;
      }
    };

    return (
      <>
        {/* Supervision Banner if Admin is inspecting another user */}
        {originalAdmin && currentUser?.id !== originalAdmin?.id && (
          <div className="bg-gradient-to-r from-pink-950 via-slate-900 to-slate-950 text-white px-3 py-1.5 md:px-4 md:py-2 border-b border-pink-500/30 flex items-center justify-between gap-2 z-[99999] shadow-md text-xs">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping shrink-0" />
              <span className="font-bold text-[11px] truncate">
                Modo Supervisión: Sesión de <strong className="text-pink-400">{currentUser?.fullName}</strong> ({currentUser?.role === 'enlace' ? 'Asesor de Enlace' : currentUser?.role})
              </span>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('solux_admin_supervision');
                setCurrentUser(originalAdmin);
                setActiveRole('admin');
                safeSetLocalStorage('solux_current_user', originalAdmin);
                safeSetLocalStorage('solux_active_role', 'admin');
              }}
              className="px-2.5 py-1 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-black uppercase text-[9px] tracking-wider transition-all cursor-pointer shadow-xs shrink-0"
            >
              Volver a Admin ({originalAdmin.fullName || 'Admin'})
            </button>
          </div>
        )}

        {/* Top Header Direct Role Switcher Bar */}
        <div className="bg-slate-950 border-b border-emerald-950/40 text-slate-100 px-3 py-1.5 md:px-4 md:py-2 flex items-center justify-between gap-2 md:gap-3 shrink-0 relative z-[9999] shadow-md shadow-emerald-950/10" id="interactive-role-switcher-bar">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveRole(null)}
              title="Cambiar de Perfil / Menú Principal"
              className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                <Users className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] md:text-[10px] font-black tracking-wider uppercase text-emerald-400">Cambio Rápido</span>
                  <span className="px-1 py-0.2 rounded text-[7px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hidden sm:inline-block">Directo</span>
                </div>
                <p className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                  Vista: <span className="text-white font-extrabold">{roleLabels[activeRole || ''] || activeRole}</span>
                </p>
              </div>
            </button>
          </div>

          {/* Desktop & Tablet Direct Role Buttons */}
          <div className="hidden sm:flex items-center gap-1 md:gap-1.5">
            <span className="text-[8px] text-slate-400 font-extrabold tracking-wider uppercase mr-1 hidden lg:inline">Roles:</span>
            
            <button
              onClick={() => handleSwitchToRole('admin')}
              title="Panel Admin"
              className={`px-2.5 py-1.5 rounded-xl text-[9px] font-extrabold uppercase tracking-wider border transition-all duration-150 cursor-pointer flex items-center gap-1 ${
                activeRole === 'admin' 
                  ? 'bg-violet-600 border-violet-500 text-white shadow-sm shadow-violet-600/25' 
                  : 'bg-slate-900 hover:bg-slate-850 text-slate-300 border-slate-800 hover:text-white'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>

            <button
              onClick={() => handleSwitchToRole('comercial')}
              title="Asesor Verde (Comercial)"
              className={`px-2.5 py-1.5 rounded-xl text-[9px] font-extrabold uppercase tracking-wider border transition-all duration-150 cursor-pointer flex items-center gap-1 ${
                activeRole === 'comercial' 
                  ? 'bg-orange-600 border-orange-500 text-white shadow-sm shadow-orange-600/25' 
                  : 'bg-slate-900 hover:bg-slate-850 text-slate-300 border-slate-800 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Asesor Verde</span>
            </button>

            <button
              onClick={() => handleSwitchToRole('tech')}
              title="Partner (Instalaciones)"
              className={`px-2.5 py-1.5 rounded-xl text-[9px] font-extrabold uppercase tracking-wider border transition-all duration-150 cursor-pointer flex items-center gap-1 ${
                activeRole === 'tech' 
                  ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm shadow-emerald-600/25' 
                  : 'bg-slate-900 hover:bg-slate-850 text-slate-300 border-slate-800 hover:text-white'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Partner</span>
            </button>

            <button
              onClick={() => handleSwitchToRole('enlace')}
              title="Enlace (Referidos)"
              className={`px-2.5 py-1.5 rounded-xl text-[9px] font-extrabold uppercase tracking-wider border transition-all duration-150 cursor-pointer flex items-center gap-1 ${
                activeRole === 'enlace' 
                  ? 'bg-rose-600 border-rose-500 text-white shadow-sm shadow-rose-600/25' 
                  : 'bg-slate-900 hover:bg-slate-850 text-slate-300 border-slate-800 hover:text-white'
              }`}
            >
              <Handshake className="w-3.5 h-3.5" />
              <span>Enlace</span>
            </button>

            <button
              onClick={() => handleSwitchToRole('client')}
              title="Cliente Solar"
              className={`px-2.5 py-1.5 rounded-xl text-[9px] font-extrabold uppercase tracking-wider border transition-all duration-150 cursor-pointer flex items-center gap-1 ${
                activeRole === 'client' 
                  ? 'bg-sky-600 border-sky-500 text-white shadow-sm shadow-sky-600/25' 
                  : 'bg-slate-900 hover:bg-slate-850 text-slate-300 border-slate-800 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Cliente</span>
            </button>

            <button
              onClick={() => handleSwitchToRole('landingpage')}
              title="Ver Landing Page Oficial"
              className={`px-2.5 py-1.5 rounded-xl text-[9px] font-extrabold uppercase tracking-wider border transition-all duration-150 cursor-pointer flex items-center gap-1 ${
                activeRole === 'landingpage' 
                  ? 'bg-teal-600 border-teal-500 text-white shadow-sm shadow-teal-600/25' 
                  : 'bg-slate-900 hover:bg-slate-850 text-slate-300 border-slate-800 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-teal-400" />
              <span>Landing</span>
            </button>

            <button
              onClick={() => handleSwitchToRole('landingadmin')}
              title="Panel de Edición de Landing Page"
              className={`px-2.5 py-1.5 rounded-xl text-[9px] font-extrabold uppercase tracking-wider border transition-all duration-150 cursor-pointer flex items-center gap-1 ${
                activeRole === 'landingadmin' 
                  ? 'bg-purple-600 border-purple-500 text-white shadow-sm shadow-purple-600/25' 
                  : 'bg-slate-900 hover:bg-slate-850 text-slate-300 border-slate-800 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" />
              <span>Admin Landing</span>
            </button>

            <button
              onClick={() => setActiveRole(null)}
              title="Ver Selección de Perfiles"
              className="px-2.5 py-1.5 rounded-xl text-[9px] font-extrabold uppercase tracking-wider border border-slate-700 bg-slate-800/80 hover:bg-slate-750 text-slate-200 hover:text-white transition-all duration-150 cursor-pointer flex items-center gap-1 ml-1"
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Perfiles</span>
            </button>

            {/* Quick Enlace Advisor Switcher */}
            {activeRole === 'enlace' && users.some((u: any) => u.role === 'enlace') && (
              <div className="flex items-center gap-1.5 ml-1 sm:ml-2 pl-1 sm:pl-2 border-l border-slate-800">
                <span className="text-[9px] text-pink-400 font-bold uppercase hidden md:inline">Asesor:</span>
                <select
                  value={currentUser?.id || ''}
                  onChange={(e) => {
                    const target = users.find((u: any) => u.id === e.target.value);
                    if (target) handleSwitchUser(target);
                  }}
                  className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 text-[10px] font-bold focus:outline-none focus:border-pink-500 cursor-pointer max-w-[130px] sm:max-w-[180px] truncate"
                >
                  {users.filter((u: any) => u.role === 'enlace').map((adv: any, idx: number) => (
                    <option key={`app_enl_${adv.id || adv.username}_${idx}`} value={adv.id} className="bg-slate-900 text-white">
                      {adv.fullName || adv.username} (@{adv.username})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Mobile Top Shortcut Trigger Button */}
          <button
            onClick={() => setShowMobileRoleModal(true)}
            className="sm:hidden px-2.5 py-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md shadow-emerald-950/20 active:scale-95 transition-all cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-white" />
            <span>Cambiar Rol</span>
          </button>
        </div>

        {/* --- FLOATING ACTION BUTTON (MOBILE ONLY) FOR DIRECT ROLE SWITCHING --- */}
        <div className="fixed bottom-20 right-4 z-[99999] sm:hidden flex flex-col items-end pointer-events-auto">
          <button
            type="button"
            onClick={() => setShowMobileRoleModal(true)}
            className="p-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white rounded-full shadow-2xl shadow-slate-950/60 border-2 border-emerald-300/40 active:scale-90 transition-all flex items-center gap-2 font-black text-xs uppercase tracking-wider cursor-pointer"
            title="Cambiar Rol Directamente"
          >
            <Users className="w-5 h-5 text-amber-300 animate-pulse" />
            <span className="pr-1 text-[11px] font-black">Cambiar Rol</span>
          </button>
        </div>

        {/* --- MOBILE ROLE SELECTOR MODAL / SHEET --- */}
        <AnimatePresence>
          {showMobileRoleModal && (
            <div className="fixed inset-0 z-[100000] flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md text-white shadow-2xl space-y-5"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase text-white tracking-tight">Cambio Rápido de Rol</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Solux Green Platform</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowMobileRoleModal(false)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>

                <p className="text-xs text-slate-300 font-semibold">
                  Accede directamente a cualquier panel sin cerrar sesión:
                </p>

                <div className="grid grid-cols-1 gap-2.5">
                  <button
                    onClick={() => { handleSwitchToRole('admin'); setShowMobileRoleModal(false); }}
                    className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      activeRole === 'admin'
                        ? 'bg-violet-600/20 border-violet-500 text-violet-200 font-black'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-200 hover:bg-slate-800 font-bold'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Crown className="w-5 h-5 text-violet-400" />
                      <div>
                        <span className="text-xs uppercase block font-black">Panel Administrador</span>
                        <span className="text-[9px] text-slate-400 block font-normal">Control total y configuración de fórmulas</span>
                      </div>
                    </div>
                    {activeRole === 'admin' && <span className="text-[9px] bg-violet-500/30 px-2 py-0.5 rounded text-violet-300 uppercase font-black">Activo</span>}
                  </button>

                  <button
                    onClick={() => { handleSwitchToRole('comercial'); setShowMobileRoleModal(false); }}
                    className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      activeRole === 'comercial'
                        ? 'bg-orange-600/20 border-orange-500 text-orange-200 font-black'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-200 hover:bg-slate-800 font-bold'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-orange-400" />
                      <div>
                        <span className="text-xs uppercase block font-black">Asesor Verde (Comercial)</span>
                        <span className="text-[9px] text-slate-400 block font-normal">Cotizador exprés, CRM y crédito</span>
                      </div>
                    </div>
                    {activeRole === 'comercial' && <span className="text-[9px] bg-orange-500/30 px-2 py-0.5 rounded text-orange-300 uppercase font-black">Activo</span>}
                  </button>

                  <button
                    onClick={() => { handleSwitchToRole('tech'); setShowMobileRoleModal(false); }}
                    className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      activeRole === 'tech'
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-200 font-black'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-200 hover:bg-slate-800 font-bold'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Wrench className="w-5 h-5 text-emerald-400" />
                      <div>
                        <span className="text-xs uppercase block font-black">Partner de Instalaciones</span>
                        <span className="text-[9px] text-slate-400 block font-normal">Levantamientos técnicos y evidencias</span>
                      </div>
                    </div>
                    {activeRole === 'tech' && <span className="text-[9px] bg-emerald-500/30 px-2 py-0.5 rounded text-emerald-300 uppercase font-black">Activo</span>}
                  </button>

                  <button
                    onClick={() => { 
                      handleSwitchToRole('enlace'); 
                      setShowMobileRoleModal(false); 
                    }}
                    className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      activeRole === 'enlace'
                        ? 'bg-rose-600/20 border-rose-500 text-rose-200 font-black'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-200 hover:bg-slate-800 font-bold'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Handshake className="w-5 h-5 text-rose-400" />
                      <div>
                        <span className="text-xs uppercase block font-black">Asesor de Enlace</span>
                        <span className="text-[9px] text-slate-400 block font-normal">Registro de referidos y comisiones</span>
                      </div>
                    </div>
                    {activeRole === 'enlace' && <span className="text-[9px] bg-rose-500/30 px-2 py-0.5 rounded text-rose-300 uppercase font-black">Activo</span>}
                  </button>

                  <button
                    onClick={() => { handleSwitchToRole('client'); setShowMobileRoleModal(false); }}
                    className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      activeRole === 'client'
                        ? 'bg-sky-600/20 border-sky-500 text-sky-200 font-black'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-200 hover:bg-slate-800 font-bold'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-sky-400" />
                      <div>
                        <span className="text-xs uppercase block font-black">Cliente Solar</span>
                        <span className="text-[9px] text-slate-400 block font-normal">Portal de expediente y propuesta</span>
                      </div>
                    </div>
                    {activeRole === 'client' && <span className="text-[9px] bg-sky-500/30 px-2 py-0.5 rounded text-sky-300 uppercase font-black">Activo</span>}
                  </button>

                  <button
                    onClick={() => { handleSwitchToRole('landingpage'); setShowMobileRoleModal(false); }}
                    className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      activeRole === 'landingpage'
                        ? 'bg-teal-600/20 border-teal-500 text-teal-200 font-black'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-200 hover:bg-slate-800 font-bold'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-teal-400" />
                      <div>
                        <span className="text-xs uppercase block font-black">Landing Page (Pública)</span>
                        <span className="text-[9px] text-slate-400 block font-normal">Página web oficial de Solux Green</span>
                      </div>
                    </div>
                    {activeRole === 'landingpage' && <span className="text-[9px] bg-teal-500/30 px-2 py-0.5 rounded text-teal-300 uppercase font-black">Activo</span>}
                  </button>

                  <button
                    onClick={() => { handleSwitchToRole('landingadmin'); setShowMobileRoleModal(false); }}
                    className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      activeRole === 'landingadmin'
                        ? 'bg-purple-600/20 border-purple-500 text-purple-200 font-black'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-200 hover:bg-slate-800 font-bold'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <SlidersHorizontal className="w-5 h-5 text-purple-400" />
                      <div>
                        <span className="text-xs uppercase block font-black">Admin Landing Page</span>
                        <span className="text-[9px] text-slate-400 block font-normal">Editor de textos, fotos a Supabase y colores</span>
                      </div>
                    </div>
                    {activeRole === 'landingadmin' && <span className="text-[9px] bg-purple-500/30 px-2 py-0.5 rounded text-purple-300 uppercase font-black">Activo</span>}
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[10px]">
                  <button
                    onClick={() => { setActiveRole(null); setShowMobileRoleModal(false); }}
                    className="text-emerald-400 hover:text-emerald-300 font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>← Menú de Perfiles</span>
                  </button>
                  <button
                    onClick={() => setShowMobileRoleModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-extrabold rounded-xl uppercase tracking-wider cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </>
    );
  };

  if (activeRole === 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative antialiased" id="admin-portal-root">
        {renderAdminSwitcher()}
        <AdminDashboard 
          services={services}
          technicians={technicians}
          materials={materials}
          catalog={catalog}
          onAssignService={handleAssignService}
          onUpdateCatalogPrice={handleUpdateCatalogPrice}
          onAddCatalogItem={handleAddCatalogItem}
          onDeleteCatalogItem={handleDeleteCatalogItem}
          onUpdateUrgenciesSurcharge={handleUpdateUrgenciesSurcharge}
          urgencySurcharge={urgencySurcharge}
          onExit={handleExitSession}
          soluxConfig={soluxConfig}
          onUpdateSoluxConfig={handleUpdateSoluxConfig}
          isOfflineMode={isOfflineMode}
          onToggleOfflineMode={handleToggleOfflineMode}
          users={users}
          onUpdateUsers={handleUpdateUsers}
          solarProjects={solarProjects}
          onUpdateSolarProject={handleUpdateSolarProject}
          onAddSolarProject={handleAddSolarProject}
          onDeleteSolarProject={handleDeleteSolarProject}
          onDeleteUser={handleDeleteUser}
          onDeleteTechnician={handleDeleteTechnician}
          onDeleteMaterial={handleDeleteMaterial}
          onDeleteService={handleDeleteService}
          currentUser={currentUser}
          onUpdateProfile={handleUpdateProfile}
          onSwitchUser={handleSwitchUser}
          activeRole={activeRole}
          onChangeRole={setActiveRole}
          notifications={notifications}
          onMarkNotificationAsRead={handleMarkNotificationAsRead}
          onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
          onClearAllNotifications={handleClearAllNotifications}
          onDeleteNotification={handleDeleteNotification}
        />
      </div>
    );
  }

  if (activeRole === 'comercial') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative antialiased" id="comercial-portal-root">
        {renderAdminSwitcher()}
        <CommercialDashboard 
          solarProjects={solarProjects}
          onAddSolarProject={handleAddSolarProject}
          onUpdateSolarProject={handleUpdateSolarProject}
          onUpdateUsers={handleUpdateUsers}
          onExit={handleExitSession}
          soluxConfig={soluxConfig}
          isOfflineMode={isOfflineMode}
          onToggleOfflineMode={handleToggleOfflineMode}
          users={users}
          currentUser={currentUser}
          onUpdateProfile={handleUpdateProfile}
          notifications={notifications}
          onMarkNotificationAsRead={handleMarkNotificationAsRead}
          onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
          onClearAllNotifications={handleClearAllNotifications}
          onDeleteNotification={handleDeleteNotification}
          onDeleteSolarProject={handleDeleteSolarProject}
          onTriggerNotification={handleTriggerNotification}
        />
      </div>
    );
  }

  if (activeRole === 'tech') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative antialiased" id="tech-portal-root">
        {renderAdminSwitcher()}
        <TechDashboard 
          solarProjects={solarProjects}
          onUpdateSolarProject={handleUpdateSolarProject}
          onAddSolarProject={handleAddSolarProject}
          onDeleteSolarProject={handleDeleteSolarProject}
          onExit={handleExitSession}
          users={users}
          currentUser={currentUser}
          onUpdateProfile={handleUpdateProfile}
          onUpdateUsers={handleUpdateUsers}
          notifications={notifications}
          onMarkNotificationAsRead={handleMarkNotificationAsRead}
          onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
          onClearAllNotifications={handleClearAllNotifications}
          onDeleteNotification={handleDeleteNotification}
        />
      </div>
    );
  }

  if (activeRole === 'enlace') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative antialiased" id="enlace-portal-root">
        {renderAdminSwitcher()}
        <EnlaceDashboard 
          solarProjects={solarProjects}
          users={users}
          soluxConfig={soluxConfig}
          onAddSolarProject={handleAddSolarProject}
          onUpdateSolarProject={handleUpdateSolarProject}
          onDeleteSolarProject={handleDeleteSolarProject}
          onExit={handleExitSession}
          currentUser={currentUser}
          onUpdateProfile={handleUpdateProfile}
          onSwitchUser={handleSwitchUser}
          isOfflineMode={isOfflineMode}
          notifications={notifications}
          onMarkNotificationAsRead={handleMarkNotificationAsRead}
          onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
          onClearAllNotifications={handleClearAllNotifications}
          onDeleteNotification={handleDeleteNotification}
          onUpdateUsers={handleUpdateUsers}
          onDeleteUser={handleDeleteUser}
          onTriggerNotification={handleTriggerNotification}
        />
      </div>
    );
  }

  if (activeRole === 'client') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative antialiased" id="client-portal-root">
        {renderAdminSwitcher()}
        <ClientDashboard 
          solarProjects={solarProjects}
          users={users}
          onUpdateSolarProject={handleUpdateSolarProject}
          onDeleteSolarProject={handleDeleteSolarProject}
          onExit={handleExitSession}
          currentUser={currentUser}
          onUpdateProfile={handleUpdateProfile}
          isOfflineMode={isOfflineMode}
          notifications={notifications}
          onMarkNotificationAsRead={handleMarkNotificationAsRead}
          onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
          onClearAllNotifications={handleClearAllNotifications}
          onDeleteNotification={handleDeleteNotification}
        />
      </div>
    );
  }

  if (activeRole === 'landingpage') {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sans relative antialiased" id="landingpage-portal-root">
        {renderAdminSwitcher()}
        <LandingPageView 
          config={landingConfig}
          onNavigateToAdmin={() => setActiveRole('landingadmin')}
          onNavigateToPortal={() => setActiveRole('login')}
          onAddSolarProject={handleAddSolarProject}
          soluxConfig={soluxConfig}
        />
      </div>
    );
  }

  if (activeRole === 'landingadmin') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col font-sans relative antialiased" id="landingadmin-portal-root">
        {renderAdminSwitcher()}
        <AdminLandingPage 
          config={landingConfig}
          onSaveConfig={handleUpdateLandingConfig}
          onNavigateToLanding={() => setActiveRole('landingpage')}
          onNavigateToPortal={() => setActiveRole('login')}
          isOfflineMode={isOfflineMode}
        />
      </div>
    );
  }

  if (activeRole === 'public_client_reg') {
    return (
      <PublicClientRegistration 
        users={users}
        soluxConfig={soluxConfig}
        onRegisterSuccess={(newProject, newUser) => {
          // Add the user to user list
          setUsers((prev: any[]) => {
            const nextList = [newUser, ...prev];
            localStorage.setItem('solux_users', JSON.stringify(nextList));
            return nextList;
          });
          if (!isOfflineMode) {
            upsertUser(newUser).catch(err => console.error("Error al upsertar nuevo cliente:", err));
          }

          // Add the project
          handleAddSolarProject(newProject);

          // Auto sign-in
          setCurrentUser(newUser);
          setActiveRole('client');
        }}
        onCancel={() => {
          setActiveRole(null);
        }}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setActiveRole('client');
        }}
      />
    );
  }

  if (activeRole === 'public_enlace_reg') {
    return (
      <PublicEnlaceRegistration
        users={users}
        onRegisterSuccess={(newUser) => {
          setUsers((prev: any[]) => {
            const nextList = [newUser, ...prev.filter(u => u.id !== newUser.id)];
            safeSetLocalStorage('solux_users', nextList);
            return nextList;
          });
          if (!isOfflineMode) {
            upsertUser(newUser).catch(err => console.error("Error al persistir asesor de enlace:", err));
          }
          setCurrentUser(newUser);
          setActiveRole('enlace');
        }}
        onCancel={() => {
          if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
            const url = new URL(window.location.href);
            url.searchParams.delete('registro');
            url.searchParams.delete('ref');
            url.searchParams.delete('enlace');
            window.history.replaceState({}, '', url.pathname);
          }
          setActiveRole(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans relative overflow-hidden antialiased" id="app-portal-root">
      
      {/* Decorative Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40 pointer-events-none"></div>

      {/* Floating subtle ambient lights */}
      <div className="absolute top-[-10%] right-[-10%] w-[32rem] h-[32rem] bg-indigo-200/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[32rem] h-[32rem] bg-emerald-100/20 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10 flex flex-col justify-center relative z-20 overflow-hidden">
        
        <AnimatePresence mode="wait">
          {/* --- HIGH END MULTI-ROLE ACCESS & REGISTRATION PORTAL --- */}
          <motion.div
            key="login-portal"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="w-full flex flex-col items-center justify-center max-w-2xl mx-auto space-y-6"
            id="login-portal-container"
          >
            {/* Top Navigation to return to Landing Page */}
            <div className="w-full flex items-center justify-between pb-1">
              <button
                type="button"
                onClick={() => setActiveRole('landingpage')}
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs hover:border-emerald-300"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-emerald-600" />
                <span>Volver a la Página de Inicio</span>
              </button>
              <span className="text-[10px] font-black uppercase text-slate-400 font-mono">Solux Green 2026</span>
            </div>

            {/* Logo Centered Above the Form */}
            <div className="flex justify-center mb-1">
              <img 
                src={SOLUX_LOGO_URL} 
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = SOLUX_LOGO_FALLBACK;
                }}
                alt="Solux Green Logo" 
                className="h-14 sm:h-20 md:h-24 w-auto object-contain select-none"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Portal Banner / Info */}
            <div className="text-center space-y-1.5 px-2">
              <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-3 py-0.5 sm:py-1 rounded-full text-emerald-700">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest">Portal Multi-Rol Solux Green</span>
              </div>
              <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase">
                Selecciona tu Rol de Operación
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider max-w-md mx-auto">
                Accede a tu panel o regístrate para cada tipo de usuario
              </p>
            </div>

            {/* Direct Landing Page and Admin Landing Page Quick Section */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setActiveRole('landingpage')}
                className="p-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-2xl shadow-md flex items-center justify-between transition-all cursor-pointer group active:scale-98"
              >
                <div className="flex items-center gap-2.5 text-left">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider block">Ver Landing Page</span>
                    <span className="text-[9px] text-emerald-100 font-medium block">Página pública comercial Solux Green</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-emerald-200 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => setActiveRole('landingadmin')}
                className="p-3.5 bg-gradient-to-r from-violet-700 to-purple-800 hover:from-violet-800 hover:to-purple-900 text-white rounded-2xl shadow-md flex items-center justify-between transition-all cursor-pointer group active:scale-98"
              >
                <div className="flex items-center gap-2.5 text-left">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <SlidersHorizontal className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider block">Admin Landing Page</span>
                    <span className="text-[9px] text-violet-200 font-medium block">Edición de textos, fotos a Supabase y estilos</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-violet-200 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>
            </div>

            {/* --- ROLE SELECTOR TABS --- */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-5 gap-1.5 sm:gap-2 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setSelectedRoleFilter('admin');
                  setLoginError('');
                  setRegError('');
                }}
                className={`flex flex-col items-center justify-center py-2 sm:py-2.5 px-1.5 rounded-xl transition-all cursor-pointer ${
                  selectedRoleFilter === 'admin'
                    ? 'bg-white text-violet-700 shadow-md border border-violet-100 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 font-bold'
                }`}
              >
                <Crown className={`w-4 h-4 sm:w-5 sm:h-5 mb-1 ${selectedRoleFilter === 'admin' ? 'text-violet-600' : 'text-slate-400'}`} />
                <span className="text-[9px] sm:text-[10px] uppercase tracking-tight text-center leading-tight">Admin</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRoleFilter('comercial');
                  setLoginError('');
                  setRegError('');
                }}
                className={`flex flex-col items-center justify-center py-2 sm:py-2.5 px-1.5 rounded-xl transition-all cursor-pointer ${
                  selectedRoleFilter === 'comercial'
                    ? 'bg-white text-orange-700 shadow-md border border-orange-100 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 font-bold'
                }`}
              >
                <TrendingUp className={`w-4 h-4 sm:w-5 sm:h-5 mb-1 ${selectedRoleFilter === 'comercial' ? 'text-orange-600' : 'text-slate-400'}`} />
                <span className="text-[9px] sm:text-[10px] uppercase tracking-tight text-center leading-tight">Asesor Verde</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRoleFilter('tech');
                  setLoginError('');
                  setRegError('');
                }}
                className={`flex flex-col items-center justify-center py-2 sm:py-2.5 px-1.5 rounded-xl transition-all cursor-pointer ${
                  selectedRoleFilter === 'tech'
                    ? 'bg-white text-emerald-700 shadow-md border border-emerald-100 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 font-bold'
                }`}
              >
                <Wrench className={`w-4 h-4 sm:w-5 sm:h-5 mb-1 ${selectedRoleFilter === 'tech' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className="text-[9px] sm:text-[10px] uppercase tracking-tight text-center leading-tight">Partner</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRoleFilter('enlace');
                  setLoginError('');
                  setRegError('');
                }}
                className={`flex flex-col items-center justify-center py-2 sm:py-2.5 px-1.5 rounded-xl transition-all cursor-pointer ${
                  selectedRoleFilter === 'enlace'
                    ? 'bg-white text-rose-700 shadow-md border border-rose-100 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 font-bold'
                }`}
              >
                <Handshake className={`w-4 h-4 sm:w-5 sm:h-5 mb-1 ${selectedRoleFilter === 'enlace' ? 'text-rose-600' : 'text-slate-400'}`} />
                <span className="text-[9px] sm:text-[10px] uppercase tracking-tight text-center leading-tight">Enlace</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRoleFilter('client');
                  setLoginError('');
                  setRegError('');
                }}
                className={`col-span-2 sm:col-span-1 flex flex-col items-center justify-center py-2 sm:py-2.5 px-1.5 rounded-xl transition-all cursor-pointer ${
                  selectedRoleFilter === 'client'
                    ? 'bg-white text-sky-700 shadow-md border border-sky-100 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 font-bold'
                }`}
              >
                <User className={`w-4 h-4 sm:w-5 sm:h-5 mb-1 ${selectedRoleFilter === 'client' ? 'text-sky-600' : 'text-slate-400'}`} />
                <span className="text-[9px] sm:text-[10px] uppercase tracking-tight text-center leading-tight">Cliente</span>
              </button>
            </div>

            {/* Main Form Container */}
            <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 md:p-8 w-full shadow-xl shadow-slate-100 relative overflow-hidden space-y-5">
              
              {/* Login / Register Toggle Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  {selectedRoleFilter === 'admin' && <Crown className="w-5 h-5 text-violet-600 shrink-0" />}
                  {selectedRoleFilter === 'comercial' && <TrendingUp className="w-5 h-5 text-orange-600 shrink-0" />}
                  {selectedRoleFilter === 'tech' && <Wrench className="w-5 h-5 text-emerald-600 shrink-0" />}
                  {selectedRoleFilter === 'enlace' && <Handshake className="w-5 h-5 text-rose-600 shrink-0" />}
                  {selectedRoleFilter === 'client' && <User className="w-5 h-5 text-sky-600 shrink-0" />}
                  
                  <div>
                    <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-slate-400 block">Rol Seleccionado</span>
                    <h3 className="text-xs sm:text-sm md:text-base font-black text-slate-900 uppercase tracking-tight">
                      {selectedRoleFilter === 'admin' && 'Administrador General'}
                      {selectedRoleFilter === 'comercial' && 'Asesor Verde (Comercial)'}
                      {selectedRoleFilter === 'tech' && 'Partner de Instalaciones'}
                      {selectedRoleFilter === 'enlace' && 'Asesor de Enlace (Referidos)'}
                      {selectedRoleFilter === 'client' && 'Cliente Solar / Final'}
                    </h3>
                  </div>
                </div>

                <div className="bg-slate-100 p-1 rounded-xl flex gap-1 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setHomeActiveTab('login')}
                    className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      homeActiveTab === 'login'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LogIn className="w-3.5 h-3.5" /> Iniciar Sesión
                  </button>

                  <button
                    type="button"
                    onClick={() => setHomeActiveTab('register')}
                    className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      homeActiveTab === 'register'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Registrarse
                  </button>
                </div>
              </div>

              {/* --- LOGIN FORM --- */}
              {homeActiveTab === 'login' && (
                <form onSubmit={handleLoginSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                      Nombre de Usuario o Correo Electrónico
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        placeholder={`Ej. ${selectedRoleFilter === 'admin' ? 'admin' : selectedRoleFilter === 'comercial' ? 'verde1' : selectedRoleFilter === 'tech' ? 'partner1' : selectedRoleFilter === 'enlace' ? 'enlace1' : 'cliente_demo'}`}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                        Contraseña
                      </label>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {loginError && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-[10px] font-bold text-rose-600 uppercase tracking-wide text-center"
                    >
                      ⚠️ {loginError}
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-slate-900 hover:bg-emerald-600 text-white font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" /> Ingresar como {selectedRoleFilter.toUpperCase()}
                  </button>
                </form>
              )}

              {/* --- REGISTRATION FORM --- */}
              {homeActiveTab === 'register' && (
                <form onSubmit={handleRegisterSubmit} autoComplete="off" className="space-y-4">
                  {/* Anti-browser autofill traps */}
                  <input type="text" name="anti_autofill_reg_user" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
                  <input type="password" name="anti_autofill_reg_pass" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
                  <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-800 font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Estás registrando un nuevo usuario con rol de <strong className="uppercase">{selectedRoleFilter === 'tech' ? 'Partner Técnico' : selectedRoleFilter}</strong>.</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                        Nombre Completo *
                      </label>
                      <input
                        type="text"
                        name="solux_reg_new_name"
                        autoComplete="off"
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        placeholder="Ej. Ing. Carlos Mendoza"
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                        Nombre de Usuario *
                      </label>
                      <input
                        type="text"
                        name="solux_reg_new_username"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        placeholder="Ej. carlos_mendoza"
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                        Correo Electrónico *
                      </label>
                      <input
                        type="email"
                        name="solux_reg_new_email"
                        autoComplete="off"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="carlos@soluxgreen.com.mx"
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                        Teléfono / WhatsApp
                      </label>
                      <input
                        type="tel"
                        name="solux_reg_new_tel"
                        autoComplete="off"
                        value={regWhatsapp}
                        onChange={(e) => setRegWhatsapp(e.target.value)}
                        placeholder="5512345678"
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Role Specific Additional Fields */}
                  {selectedRoleFilter === 'tech' && (
                    <div className="space-y-1 bg-emerald-50/70 border border-emerald-100 p-3 rounded-xl">
                      <label className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block flex items-center gap-1">
                        <Building className="w-3.5 h-3.5" /> Nombre de Empresa o Razón Social
                      </label>
                      <input
                        type="text"
                        value={regPartnerCompany}
                        onChange={(e) => setRegPartnerCompany(e.target.value)}
                        placeholder="Ej. Instalaciones Ecotec S.A. de C.V."
                        className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      />
                    </div>
                  )}

                  {(selectedRoleFilter === 'enlace' || selectedRoleFilter === 'client') && (
                    <div className="space-y-1 bg-sky-50/70 border border-sky-100 p-3 rounded-xl">
                      <label className="text-[10px] font-black uppercase tracking-wider text-sky-700 block flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> Ciudad / Municipio de Ubicación
                      </label>
                      <input
                        type="text"
                        value={regCityZone}
                        onChange={(e) => setRegCityZone(e.target.value)}
                        placeholder="Ej. Benito Juárez, Ciudad de México"
                        className="w-full px-3 py-2 bg-white border border-sky-200 rounded-lg text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                      />
                    </div>
                  )}

                  {selectedRoleFilter === 'client' && (
                    <div className="space-y-2 bg-amber-50/70 border border-amber-200/80 p-3.5 rounded-xl">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black uppercase tracking-wider text-amber-800 flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-amber-600" /> Consumo Bimestral CFE ($ MXN)
                        </label>
                        <span className="font-mono font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded text-xs">
                          ${regCfeBill.toLocaleString('es-MX')} MXN
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={50000}
                        step={500}
                        value={regCfeBill}
                        onChange={(e) => setRegCfeBill(Number(e.target.value))}
                        className="w-full accent-amber-600 cursor-pointer"
                      />
                      <div className="flex justify-between text-[9px] font-black uppercase text-amber-700">
                        <span>Paneles Sugeridos: {regCfeBill > 0 ? (Math.ceil(regCfeBill / 1000) * 2 || 2) : 0} Módulos</span>
                        <span>Área: {regCfeBill > 0 ? (Math.ceil(regCfeBill / 1000) * 2 * 2.88).toFixed(2) : '0.00'} m²</span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                        Contraseña *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          name="solux_reg_new_password"
                          autoComplete="new-password"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                          title={showRegPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        >
                          {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                        Confirmar Contraseña *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type={showRegConfirmPassword ? 'text' : 'password'}
                          name="solux_reg_new_confirm_password"
                          autoComplete="new-password"
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                          title={showRegConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        >
                          {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {regError && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-[10px] font-bold text-rose-600 uppercase tracking-wide text-center"
                    >
                      ⚠️ {regError}
                    </motion.div>
                  )}

                  {regSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[10px] font-bold text-emerald-800 uppercase tracking-wide text-center flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {regSuccess}
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" /> Registrar Cuenta de {selectedRoleFilter.toUpperCase()}
                  </button>
                </form>
              )}

              {/* Direct Link to Exprès Client Portal & Enlace Registration */}
              <div className="pt-2 space-y-2 text-center border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveRole('public_client_reg')}
                  className="text-[11px] font-black text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer uppercase tracking-wider inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> Ir al Cotizador Público & Registro Exprès de Clientes
                </button>

                <div>
                  <button
                    type="button"
                    onClick={() => setActiveRole('public_enlace_reg')}
                    className="text-[11px] font-black text-pink-600 hover:text-pink-700 transition-colors cursor-pointer uppercase tracking-wider inline-flex items-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-pink-500" /> ¿Fuiste invitado como Asesor de Enlace? Regístrate aquí
                  </button>
                </div>
              </div>

            </div>

            {/* Bottom footer tag */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full text-slate-400 font-mono text-[9px] sm:text-[10px] tracking-widest uppercase pt-2 px-2 text-center sm:text-left">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Sistema Solux Green Multi-Rol • 2026</span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setActiveRole('landingpage')}
                  className="hover:text-emerald-600 transition-colors cursor-pointer font-bold flex items-center gap-1"
                >
                  <Globe className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Ver Landing Page</span>
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setActiveRole('landingadmin')}
                  className="hover:text-violet-600 transition-colors cursor-pointer font-bold flex items-center gap-1"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-violet-500" />
                  <span>Admin Landing</span>
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

      </main>
    </div>
  );
}

export default function AppWithBoundary() {
  return (
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  );
}
