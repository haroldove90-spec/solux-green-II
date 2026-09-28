import React, { useState, useEffect, useMemo } from 'react';
import html2pdf from 'html2pdf.js';
import { 
  Handshake, Share2, Award, Gift, Sparkles, 
  Send, Users, Copy, Check, DollarSign, Plus,
  Coins, BookOpen, Download, HelpCircle, ChevronRight, CheckCircle,
  User, LogOut, Phone, MessageSquare, MapPin, Calendar, FileText, ArrowUpRight, ExternalLink,
  Image as ImageIcon, UserPlus, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SolarProject, AppNotification, SoluxConfig } from '../types';
import { SOLUX_LOGO_URL, SOLUX_LOGO_FALLBACK } from '../logoConfig';
import UserProfileModule from './UserProfileModule';
import { NotificationsBell } from './NotificationsBell';
import NotificationsModule from './NotificationsModule';
import PromotionalMaterialsModule from './PromotionalMaterialsModule';
import EnlaceAdvisorsModule from './EnlaceAdvisorsModule';
import { Bell } from 'lucide-react';
import { exportProjectDossierPDF, exportProjectDossierImage } from '../pdfUtils';
import { formatWhatsAppPhone } from '../phoneUtils';

interface EnlaceDashboardProps {
  solarProjects: SolarProject[];
  users?: any[];
  soluxConfig?: SoluxConfig;
  onAddSolarProject: (project: SolarProject) => void;
  onUpdateSolarProject?: (id: string, updated: Partial<SolarProject>) => void;
  onDeleteSolarProject?: (id: string) => void;
  onExit: () => void;
  currentUser: any;
  onUpdateProfile: (updatedUser: any) => void;
  isOfflineMode?: boolean;

  // Notification additions
  notifications: AppNotification[];
  onMarkNotificationAsRead: (id: string) => void;
  onMarkAllNotificationsAsRead: () => void;
  onClearAllNotifications?: () => void;
  onDeleteNotification?: (id: string) => void;

  onUpdateUsers?: (users: any[] | ((prev: any[]) => any[])) => void;
  onDeleteUser?: (id: string) => void;
  onTriggerNotification?: (title: string, message: string, role: string, userId?: string) => void;
  onSwitchUser?: (user: any) => void;
}

export default function EnlaceDashboard({
  solarProjects,
  users = [],
  soluxConfig,
  onAddSolarProject,
  onExit,
  currentUser,
  onUpdateProfile,
  onSwitchUser,
  isOfflineMode = false,

  notifications,
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  onClearAllNotifications,
  onDeleteNotification,
  onUpdateUsers,
  onDeleteUser,
  onTriggerNotification
}: EnlaceDashboardProps) {
  const [activeTab, setActiveTab] = useState<'monedero' | 'recomendar' | 'banco' | 'perfil' | 'notificaciones'>(() => {
    const saved = localStorage.getItem('solux_enlace_active_tab');
    if (saved === 'asesores' || saved === 'recomendaciones' || saved === 'nuevo') return 'recomendar';
    if (saved === 'recomendar' || saved === 'monedero' || saved === 'banco' || saved === 'perfil' || saved === 'notificaciones') {
      return saved as any;
    }
    return 'recomendar';
  });

  useEffect(() => {
    localStorage.setItem('solux_enlace_active_tab', activeTab);
  }, [activeTab]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedInviteLink, setCopiedInviteLink] = useState(false);
  const [copiedCampaignId, setCopiedCampaignId] = useState<string | null>(null);

  // New referral simplified form
  const [refName, setRefName] = useState('');
  const [refPhone, setRefPhone] = useState('');
  const [refCity, setRefCity] = useState('');
  const [refBill, setRefBill] = useState('');
  
  // Costo oficial del panel estipulado por el Administrador (Sincronizado con Cotizador Exprés y Cotizador Principal)
  const activePanelPrice = (soluxConfig?.panelBasePrice !== undefined && Number(soluxConfig.panelBasePrice) > 0)
    ? Number(soluxConfig.panelBasePrice)
    : 11000;

  // Fórmula oficial de dimensionamiento de paneles (Idéntica a Cotizador Exprés y Cotizador Principal):
  // Por cada $1,000 de consumo se consideran 2 paneles. Si la fracción es >= 0.1 se redondea al inmediato superior.
  const calculatePanels = (bill: number) => {
    if (bill <= 0) return 0;
    const rawPanels = (bill / 1000) * 2;
    const dec = rawPanels - Math.floor(rawPanels);
    const p = dec >= 0.1 ? Math.ceil(rawPanels) : Math.floor(rawPanels);
    return Math.max(1, p);
  };

  // Resolver Asesor Verde que lo recomendó (Sponsor exclusivo del Enlace)
  const mySponsorAdvisor = useMemo(() => {
    // 1. Si el usuario Enlace tiene parentId o parent_id registrado
    const rawParentId = currentUser?.parentId || (currentUser as any)?.parent_id || (currentUser as any)?.sponsorId;
    if (rawParentId) {
      const found = users.find(u => 
        u.id === rawParentId || 
        (u.username && u.username.toLowerCase() === String(rawParentId).toLowerCase())
      );
      if (found) return found;
    }
    // 2. Si no tiene parentId directo (ej. root admin o enlace directo de la plataforma):
    // Priorizar Asesor Verde Gustavo Luna (usr_gustavo / Gustavo) o el primer asesor comercial
    const primaryAdv = users.find(u => u.id === 'usr_gustavo' || (u.username && u.username.toLowerCase() === 'gustavo'))
      || users.find(u => u.role === 'comercial')
      || users.find(u => u.role === 'admin' && u.id !== currentUser?.id);
    return primaryAdv || null;
  }, [currentUser, users]);

  // Lista estricta: ÚNICAMENTE debe mostrarse el asesor verde que lo recomendó
  const greenAdvisors = useMemo(() => {
    if (mySponsorAdvisor) {
      return [mySponsorAdvisor];
    }
    return [];
  }, [mySponsorAdvisor]);

  const defaultAdvisorId = greenAdvisors.length > 0 ? greenAdvisors[0].id : (mySponsorAdvisor?.id || 'usr_gustavo');
  const [selectedAdvisorId, setSelectedAdvisorId] = useState<string>(defaultAdvisorId);

  // Mantener seleccionado el asesor verde asignado
  useEffect(() => {
    if (defaultAdvisorId && selectedAdvisorId !== defaultAdvisorId) {
      setSelectedAdvisorId(defaultAdvisorId);
    }
  }, [defaultAdvisorId]);

  // Success Feedback Modal State
  const [successReferralData, setSuccessReferralData] = useState<{
    clientName: string;
    clientPhone: string;
    city: string;
    advisorName: string;
    advisorPhone: string;
    referralCode: string;
    estimatedBonus: number;
    projectId: string;
  } | null>(null);

  const referralCode = currentUser?.username === 'harold_anguiano' ? 'SOCIO-889-MX' : (currentUser?.referralCode || `SOCIO-${(currentUser?.id || '889').slice(-3).toUpperCase()}-MX`);
  const referralLink = `https://soluxgreen.com.mx/prospecto?ref=${referralCode}`;
  const enlaceInviteLink = `https://soluxgreen.com.mx/registro-enlace?ref=${referralCode}`;

  const myAdvisorsCount = (users || []).filter(u => 
    u.role === 'enlace' && 
    (u.parentId === currentUser?.id || u.parentId === currentUser?.username) && 
    u.id !== currentUser?.id
  ).length;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(enlaceInviteLink);
    setCopiedInviteLink(true);
    setTimeout(() => setCopiedInviteLink(false), 2000);
  };

  const handleCopyCampaign = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCampaignId(id);
    setTimeout(() => setCopiedCampaignId(null), 2000);
  };

  // Live calculation values for the quick form (synchronized with Cotizador Exprés and Principal)
  const billValue = Number(refBill) || 0;
  const estimatedPanelsCalc = billValue > 0 ? calculatePanels(billValue) : 0;
  const estimatedAreaCalc = Number((estimatedPanelsCalc * 2.88).toFixed(1));
  const estimatedInvestmentCalc = estimatedPanelsCalc * activePanelPrice;
  const estimatedKwpCalc = ((estimatedPanelsCalc * 550) / 1000).toFixed(2);
  const estimatedAnnualSavingsCalc = Math.round(billValue * 6 * 0.9);

  // Submit quick referral
  const handleQuickReferral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refName || !refPhone || !refCity || !refBill) {
      alert('⚠️ Por favor completa los datos básicos del prospecto solar.');
      return;
    }

    const bill = Number(refBill) || 0;
    // Auto calculate initial quoting details using the official synchronized formula
    const panels = calculatePanels(bill);
    const requiredArea = Number((panels * 2.88).toFixed(2));
    const is220v = panels > 4;
    const totalInvestment = panels * activePanelPrice;

    // Resolve assigned advisor (strictly the recommending advisor)
    const matchedAdvisor = greenAdvisors.find(u => u.id === selectedAdvisorId) || greenAdvisors[0] || mySponsorAdvisor;
    const advisorName = matchedAdvisor ? (matchedAdvisor.fullName || matchedAdvisor.username) : 'Gustavo Luna (Asesor Verde)';
    const advisorPhone = matchedAdvisor ? (matchedAdvisor.whatsapp || matchedAdvisor.phone || '2293233633') : '2293233633';

    const projId = `proj_ref_${Date.now()}`;
    const newProject: SolarProject = {
      id: projId,
      clientName: refName,
      clientPhone: refPhone,
      municipalityState: refCity,
      averageBill: bill,
      availableSpace: 40, // default
      metersCount: 1,
      cfeStatus: 'activo_sin_adeudo',
      paymentMethodDesired: 'directo',
      propertyOwnership: 'propietario',
      evidence: {}, // empty for quick referral
      estimatedPanels: panels,
      requiredArea,
      voltageAlert220v: is220v,
      voltageUpgradeQuoted: is220v,
      totalInvestment,
      siteSurveyPaid: false,
      siteSurveyStatus: 'pendiente',
      referrerCode: referralCode, // bound to this referrer!
      status: 'validacion',
      payments: [],
      createdDate: new Date().toISOString().split('T')[0],
      createdBy: currentUser?.id || 'enlace_user',
      createdByRole: currentUser?.role || 'enlace',
      advisorName: advisorName,
      advisorPhone: advisorPhone,
      assignedEnlaceId: currentUser?.id,
      enlaceName: currentUser?.fullName || currentUser?.username
    };

    onAddSolarProject(newProject);
    
    if (onTriggerNotification) {
      onTriggerNotification(
        'Nuevo Prospecto de Enlace',
        `${currentUser?.fullName || 'Un Enlace'} recomendó al prospecto ${refName} (${refCity}) asignado a ${advisorName}.`,
        'comercial',
        matchedAdvisor?.id
      );
    }

    // Set rich success modal
    setSuccessReferralData({
      clientName: refName,
      clientPhone: refPhone,
      city: refCity,
      advisorName: advisorName,
      advisorPhone: advisorPhone,
      referralCode: referralCode,
      estimatedBonus: 1000,
      projectId: projId
    });

    // Clear form
    setRefName('');
    setRefPhone('');
    setRefCity('');
    setRefBill('');
  };

  // Calculations: retrieve only referrals generated by this user or matching referral code (admin sees all)
  const myReferrals = solarProjects.filter(p => {
    if (currentUser?.role === 'admin') return true;
    const matchesCode = Boolean(referralCode && p.referrerCode === referralCode);
    const isAssigned = p.assignedEnlaceId === currentUser?.id || 
                       p.assignedEnlaceId === currentUser?.username ||
                       (p.enlaceName && currentUser?.fullName && p.enlaceName.toLowerCase() === currentUser.fullName.toLowerCase());
    const isCreator = p.createdBy === currentUser?.id || 
                      p.createdBy === currentUser?.username || 
                      p.createdBy === currentUser?.fullName;
    const isAdvisor = Boolean((p.advisorName && currentUser?.fullName && p.advisorName.toLowerCase() === currentUser.fullName.toLowerCase()) || 
                      (p.advisorName && currentUser?.username && p.advisorName.toLowerCase() === currentUser.username.toLowerCase()));
    return matchesCode || isAssigned || isCreator || isAdvisor;
  });

  // Clients specifically recommended / assigned to this Enlace by an Asesor Verde
  const recommendationsFromAdvisors = solarProjects.filter(p => {
    const isAssigned = p.assignedEnlaceId === currentUser?.id || 
                       p.assignedEnlaceId === currentUser?.username ||
                       (p.enlaceName && currentUser?.fullName && p.enlaceName.toLowerCase() === currentUser.fullName.toLowerCase());
    const isReferrerMatch = Boolean(referralCode && p.referrerCode === referralCode && p.isRecommendedByAdvisor);
    return isAssigned || isReferrerMatch || (currentUser?.role === 'admin' && p.isRecommendedByAdvisor);
  });

  // Bonus conditions:
  // - "Registrado" -> validation phase
  // - "Levantamiento" -> levantamiento
  // - "Contratado" -> contrato or later
  // - "Instalado" -> instalacion or later (This generates the $1,000 pesos bonus!)
  const getReferralStatusText = (status: SolarProject['status']) => {
    if (status === 'validacion') return { text: 'Registrado', style: 'text-blue-700 bg-blue-50 border-blue-200' };
    if (status === 'levantamiento') return { text: 'En Levantamiento', style: 'text-amber-700 bg-amber-50 border-amber-200' };
    if (status === 'contrato') return { text: 'Contratado', style: 'text-purple-700 bg-purple-50 border-purple-200' };
    return { text: 'Instalado', style: 'text-emerald-700 bg-emerald-50 border-emerald-200' }; // instalacion, tramite, operacion
  };

  const successfullyInstalled = myReferrals.filter(p => 
    p.status === 'instalacion' || p.status === 'tramite_cfe' || p.status === 'interconexion' || p.status === 'operacion'
  );

  const contractedCount = myReferrals.filter(p => p.status === 'contrato').length;

  const totalBonusesEarned = successfullyInstalled.length * 1000;
  const pendingBonuses = contractedCount * 1000;

  const exportReferralsToExcel = () => {
    const headers = ["ID Expediente", "Nombre del Recomendado", "Telefono", "Ubicacion", "Estatus de Fase", "Bono Estimado", "Fecha Registro"];
    const rows = myReferrals.map(ref => {
      const tracker = getReferralStatusText(ref.status);
      const isInstalled = tracker.text === 'Instalado';
      const isContracted = tracker.text === 'Contratado';
      const bonoText = isInstalled ? '+$1,000 MXN' : isContracted ? '$1,000 (Firmado)' : '$0.00 (Pendiente)';
      return [
        ref.id,
        `"${ref.clientName.replace(/"/g, '""')}"`,
        `"${ref.clientPhone}"`,
        `"${ref.municipalityState.replace(/"/g, '""')}"`,
        `"${tracker.text}"`,
        `"${bonoText}"`,
        ref.createdDate || ''
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Mis_Recomendados_Enlace_${referralCode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const exportReferralsToPDF = async () => {
    if (isExportingPdf) return;
    try {
      setIsExportingPdf(true);

      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '0';
      container.style.top = '0';
      container.style.zIndex = '999999';
      container.style.opacity = '1';
      container.style.pointerEvents = 'none';
      container.style.width = '794px';
      container.style.padding = '35px';
      container.style.backgroundColor = '#ffffff';
      container.style.fontFamily = 'Helvetica Neue, Helvetica, Arial, sans-serif';
      container.style.color = '#1e293b';
      container.style.boxSizing = 'border-box';

      container.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 18px; margin-bottom: 22px;">
          <div>
            <h1 style="font-size: 20px; font-weight: 900; text-transform: uppercase; margin: 0; color: #0f172a; letter-spacing: -0.5px;">SOLUX GREEN</h1>
            <p style="font-size: 11px; text-transform: uppercase; margin: 4px 0 0; color: #db2777; font-weight: 800; letter-spacing: 1px;">Reporte de Enlace Comercial & Recompensas</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; font-size: 11px; font-weight: 800; color: #475569;">CÓDIGO PROMOTOR: <span style="color: #0f172a;">${referralCode}</span></p>
            <p style="margin: 4px 0 0; font-size: 10px; color: #64748b;">Fecha: ${new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>

        <div style="background-color: #fdf2f8; border: 1px solid #fbcfe8; padding: 14px 18px; border-radius: 10px; margin-bottom: 20px; font-size: 11px; display: flex; justify-content: space-between;">
          <div>
            <span style="font-weight: 800; color: #db2777; text-transform: uppercase; display: block; font-size: 9px; margin-bottom: 2px;">Total Recomendados</span>
            <strong style="font-size: 16px; color: #0f172a;">${myReferrals.length}</strong>
          </div>
          <div>
            <span style="font-weight: 800; color: #059669; text-transform: uppercase; display: block; font-size: 9px; margin-bottom: 2px;">Instalados con éxito</span>
            <strong style="font-size: 16px; color: #059669;">${successfullyInstalled.length}</strong>
          </div>
          <div>
            <span style="font-weight: 800; color: #6366f1; text-transform: uppercase; display: block; font-size: 9px; margin-bottom: 2px;">Bonos Cobrados / Por Cobrar</span>
            <strong style="font-size: 16px; color: #4338ca;">$${(totalBonusesEarned + pendingBonuses).toLocaleString('es-MX')} MXN</strong>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background-color: #f8fafc; border-bottom: 2px solid #cbd5e1;">
              <th style="padding: 10px; text-align: left; font-size: 9px; font-weight: 800; text-transform: uppercase; color: #475569;">Recomendado</th>
              <th style="padding: 10px; text-align: left; font-size: 9px; font-weight: 800; text-transform: uppercase; color: #475569;">Teléfono</th>
              <th style="padding: 10px; text-align: left; font-size: 9px; font-weight: 800; text-transform: uppercase; color: #475569;">Ubicación</th>
              <th style="padding: 10px; text-align: left; font-size: 9px; font-weight: 800; text-transform: uppercase; color: #475569;">Fase / Estatus</th>
              <th style="padding: 10px; text-align: right; font-size: 9px; font-weight: 800; text-transform: uppercase; color: #475569;">Bono Generado</th>
            </tr>
          </thead>
          <tbody>
            ${myReferrals.map((ref, idx) => {
              const tracker = getReferralStatusText(ref.status);
              const isInstalled = tracker.text === 'Instalado';
              const isContracted = tracker.text === 'Contratado';
              const bgBadge = isInstalled ? '#d1fae5' : isContracted ? '#ede9fe' : '#dbeafe';
              const textBadge = isInstalled ? '#065f46' : isContracted ? '#5b21b6' : '#1e40af';
              const bono = isInstalled ? '+$1,000 MXN' : isContracted ? '$1,000 (Firmado)' : '$0 (Pendiente)';
              const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
              return `
                <tr style="background-color: ${rowBg}; border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px; font-size: 11px; font-weight: 700; color: #0f172a;">${ref.clientName}</td>
                  <td style="padding: 10px; font-size: 11px; color: #334155;">${ref.clientPhone}</td>
                  <td style="padding: 10px; font-size: 11px; color: #334155;">${ref.municipalityState}</td>
                  <td style="padding: 10px;"><span style="display: inline-block; padding: 3px 8px; border-radius: 9999px; font-size: 9px; font-weight: 800; text-transform: uppercase; background-color: ${bgBadge}; color: ${textBadge};">${tracker.text}</span></td>
                  <td style="padding: 10px; text-align: right; font-size: 11px; font-weight: 800; font-family: monospace; color: ${isInstalled ? '#059669' : '#475569'};">${bono}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        <div style="margin-top: 30px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 9px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">
          Solux Green México · Reporte Oficial de Recomendados y Bonos
        </div>
      `;

      document.body.appendChild(container);
      await new Promise(r => setTimeout(r, 150));

      const opt = {
        margin: [8, 8, 8, 8],
        filename: `Mis_Recomendados_Solux_${referralCode}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };

      await (html2pdf as any)().set(opt).from(container).save();
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    } catch (err) {
      console.error('Error al exportar PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // content bank campaign cards data
  const campaigns = [
    {
      id: 'camp_1',
      title: '🔋 Sálvate de los apagones',
      theme: 'from-orange-600 to-amber-600',
      description: 'Campaña de concientización sobre cortes de energía de la red y almacenamiento con inversores Solux.',
      copyText: '¿Cansado de los apagones constantes en tu colonia? 🔌 Con Solux Green obtén energía solar garantizada las 24 horas y despídete de los recibos de CFE caros. ¡Pregúntame cómo cotizar gratis hoy mismo! ☀️🍃 #AhorroSolar #SoluxGreen'
    },
    {
      id: 'camp_2',
      title: '💸 Ahorra en tu recibo de luz',
      theme: 'from-emerald-600 to-teal-600',
      description: 'Enfoque financiero en la reducción del recibo bimestral de CFE (hasta un 98% de reducción de cargo).',
      copyText: '¿Sabías que puedes reducir tu tarifa bimestral de CFE a solo el cargo mínimo con paneles solares? 💰 Deja de tirar dinero y genera tu propia energía limpia. Recibe una propuesta preliminar gratis con tu recibo de luz. ¡Escríbeme! 🍃🏡 #SoluxGreen #PanelesSolares'
    },
    {
      id: 'camp_3',
      title: '🌳 Hogar Sustentable',
      theme: 'from-sky-600 to-indigo-600',
      description: 'Enfoque ecológico que destaca la reducción de huella de carbono y el valor agregado del inmueble.',
      copyText: 'Convierte tu casa en un hogar del futuro. ☀️ Aumenta el valor de plusvalía de tu propiedad e impulsa la transición verde en México. Paneles solares Solux con financiamiento directo sin revisar buró. ¡Infórmate ya! 🌳✨ #EnergiaLimpia #Solux'
    }
  ];

  const SoluxLogo = () => (
    <button
      type="button"
      onClick={onExit}
      title="Volver al Menú Principal de Roles (Home)"
      className="cursor-pointer hover:opacity-85 transition-opacity active:scale-95 shrink-0 inline-flex items-center"
    >
      <img 
        src={SOLUX_LOGO_URL} 
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = SOLUX_LOGO_FALLBACK;
        }}
        alt="Solux Green Logo" 
        className="h-9 w-auto object-contain shrink-0 select-none"
        referrerPolicy="no-referrer"
      />
    </button>
  );

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-slate-50 text-slate-800 font-sans overflow-hidden" id="enlace-solar-root">
      
      {/* 1. SIDEBAR FOR DESKTOP */}
      <aside className="hidden lg:flex flex-col w-72 bg-white/95 border-r border-slate-200 p-6 shrink-0 justify-between h-full overflow-y-auto">
        <div className="space-y-8">
          {/* Branding */}
          <div className="flex items-center gap-3">
            <SoluxLogo />
            <div>
              <span className="text-sm font-black tracking-tight text-slate-900 block">SOLUX GREEN</span>
              <span className="text-[9px] text-[#EC4899] font-extrabold tracking-widest uppercase">Asesor Enlace</span>
            </div>
          </div>

          {/* Current User Profile Widget */}
          <div 
            onClick={() => setActiveTab('perfil')}
            className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'perfil' 
                ? 'bg-pink-50 border-pink-100 text-pink-700 shadow-xs' 
                : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
              <img 
                src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.fullName || 'Enlace')}&background=EC4899&color=fff&size=80&bold=true`} 
                alt="My profile" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[9px] font-black uppercase text-[#EC4899] block tracking-wider font-mono">Enlace Activo</span>
              <span className="text-xs font-black block truncate leading-tight text-slate-800">{currentUser?.fullName || 'Asesor Enlace'}</span>
            </div>
          </div>
 
          {/* Navigation Items */}
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('monedero')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'monedero' 
                  ? 'bg-pink-50 text-pink-700 border border-pink-100 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <Coins className="w-4.5 h-4.5 shrink-0" />
              <span>Recompensas</span>
            </button>
 
            <button
              onClick={() => setActiveTab('banco')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'banco' 
                  ? 'bg-pink-50 text-pink-700 border border-pink-100 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <Share2 className="w-4.5 h-4.5 shrink-0" />
              <span>Publicidad</span>
            </button>

            <button
              onClick={() => setActiveTab('recomendar')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'recomendar' 
                  ? 'bg-pink-50 text-pink-700 border border-pink-100 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <UserPlus className="w-4.5 h-4.5 shrink-0" />
                <span>Recomendar Enlace</span>
              </div>
              <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[9px] font-black px-2 py-0.5 rounded-full">
                +$1,000
              </span>
            </button>

            <button
              onClick={() => setActiveTab('perfil')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'perfil' 
                  ? 'bg-pink-50 text-pink-700 border border-pink-100 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <User className="w-4.5 h-4.5 shrink-0" />
              <span>Mi Perfil</span>
            </button>

            <button
              onClick={() => setActiveTab('notificaciones')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer relative ${
                activeTab === 'notificaciones' 
                  ? 'bg-pink-50 text-pink-700 border border-pink-100 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <Bell className="w-4.5 h-4.5 shrink-0" />
              <span>Notificaciones</span>
              {notifications.filter(n => !n.isRead && (n.role === 'all' || n.role === 'enlace')).length > 0 && (
                <span className="absolute right-4 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
              )}
            </button>
          </nav>
        </div>
 
        {/* Bottom copiable card & exit */}
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div>
              <span className="text-xs uppercase tracking-wider block font-bold text-slate-500">Mi Código</span>
              <span className="font-mono text-sm md:text-base font-black text-pink-600 block mt-1">{referralCode}</span>
            </div>
            <button
              onClick={handleCopyLink}
              className="w-full py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold uppercase text-slate-700 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'Copiado' : 'Copiar Link'}</span>
            </button>
          </div>

          <button
            onClick={onExit}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all cursor-pointer"
          >
            <Download className="w-4.5 h-4.5 rotate-90 shrink-0" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 min-w-0">
        
        {/* Top header bar */}
        <header className="bg-white border-b border-slate-200 px-3 sm:px-5 py-3 sm:py-4 flex items-center justify-between shrink-0 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="lg:hidden shrink-0"><SoluxLogo /></span>
            <div className="min-w-0">
              <span className="text-[10px] font-black text-pink-600 uppercase block tracking-wider truncate max-w-[120px] sm:max-w-[180px]">{currentUser?.fullName || 'Asesor Enlace'}</span>
              <h1 className="text-xs sm:text-sm font-black text-slate-800 uppercase truncate mt-0.5">
                Código: {referralCode}
              </h1>
            </div>
          </div>
  
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={handleCopyLink}
              className="p-1.5 sm:p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-700 border border-slate-200 active:scale-95 transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">Copiar Link</span>
            </button>

            <NotificationsBell
              notifications={notifications}
              role="enlace"
              currentUser={currentUser}
              onMarkAsRead={onMarkNotificationAsRead}
              onMarkAllAsRead={onMarkAllNotificationsAsRead}
              onViewAll={() => setActiveTab('notificaciones')}
            />

            <button
              onClick={() => setActiveTab('perfil')}
              title="Ver mi perfil"
              className="flex items-center gap-1.5 sm:gap-2 border-l border-slate-200 pl-2 sm:pl-3 ml-0.5 sm:ml-1 shrink-0 hover:opacity-80 transition-opacity cursor-pointer text-left"
            >
              <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                <img 
                  src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.fullName || 'Enlace')}&background=10B981&color=fff&size=80&bold=true`} 
                  alt="Perfil" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-[10px] font-black text-slate-800 truncate max-w-[120px] uppercase tracking-tight leading-tight">{currentUser?.fullName || 'Asesor Enlace'}</span>
                <span className="text-[8px] font-bold text-pink-600 truncate max-w-[120px] leading-tight">@{currentUser?.username || 'enlace'}</span>
              </div>
            </button>
          </div>
        </header>
 
        {/* Dashboard sub-header inside content area (status overview) */}
        <div className="bg-white border-b border-slate-200/85 px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div>
            <span className="text-xs font-black uppercase text-pink-700 tracking-wider">Socio Activo: {currentUser?.fullName || 'Asesor Enlace'}</span>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">
              {activeTab === 'recomendar' ? 'Recomendar Enlace' :
               activeTab === 'monedero' ? 'Monedero Electrónico' :
               activeTab === 'banco' ? 'Publicidad y Materiales' :
               activeTab === 'perfil' ? 'Mi Perfil de Usuario' : 'Notificaciones'}
            </h2>
          </div>
          {activeTab === 'recomendar' ? (
            <div className="bg-pink-50 border border-pink-100 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl text-xs text-pink-800 font-extrabold flex items-center gap-1.5 sm:gap-2">
              <Sparkles className="w-4 h-4 text-pink-600" />
              <span>Bono por Instalación: <strong className="font-mono text-sm md:text-base font-black text-emerald-600 ml-1">+$1,000 MXN</strong></span>
            </div>
          ) : (
            <div className="bg-pink-50 border border-pink-100 px-4 py-2 rounded-2xl text-xs text-pink-800 font-extrabold">
              Cobrado: <span className="font-mono text-sm md:text-base font-black text-pink-700 ml-1">${totalBonusesEarned.toLocaleString('es-MX')} MXN</span>
            </div>
          )}
        </div>

        {/* Content View Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pb-20 md:pb-8">
          <AnimatePresence mode="wait">

            {/* TAB: RECOMENDAR ENLACE (Formulario de recomendación + Enlaces y difusión) */}
            {activeTab === 'recomendar' && (
              <div className="w-full space-y-6 max-w-5xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Hero Header Banner */}
                  <div className="bg-gradient-to-r from-pink-900 via-slate-900 to-emerald-950 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-pink-500/20">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/20 border border-pink-400/30 text-pink-300 text-[10px] font-black uppercase tracking-wider">
                          <UserPlus className="w-3.5 h-3.5" />
                          Módulo Recomendar Enlace
                        </div>
                        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">
                          Recomienda y Gana $1,000 MXN en Efectivo
                        </h2>
                        <p className="text-xs text-slate-300 font-medium max-w-xl leading-relaxed">
                          Registra prospectos solares o comparte tu enlace personal. En cuanto tu recomendado firme e inicie la instalación de sus paneles solares con Solux Green, recibirás tu bono de <strong className="text-pink-400 font-black">$1,000 MXN</strong> directamente en tu monedero.
                        </p>
                      </div>

                      {/* Quick Metrics Badges */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center min-w-[120px]">
                          <span className="text-[9px] uppercase font-bold text-pink-300 block tracking-wider">Tu Código</span>
                          <span className="text-lg font-mono font-black text-white">{referralCode}</span>
                          <span className="text-[8px] text-slate-300 block mt-0.5">Promotor Activo</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center min-w-[130px]">
                          <span className="text-[9px] uppercase font-bold text-emerald-300 block tracking-wider">Bono por Cierre</span>
                          <span className="text-xl font-black text-emerald-400">+$1,000</span>
                          <span className="text-[8px] text-slate-300 block mt-0.5">MXN sin límite</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Direct Recommendation Form (7 cols) */}
                    <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
                      <div className="border-b border-slate-100 pb-3">
                        <h3 className="text-sm font-black uppercase tracking-wide text-slate-900 flex items-center gap-2">
                          <UserPlus className="w-4 h-4 text-pink-600" />
                          <span>Registrar Nuevo Prospecto Solar</span>
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                          Completa los datos para asignar a un Asesor Verde y asegurar tu bono
                        </p>
                      </div>

                      <form onSubmit={handleQuickReferral} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 block mb-1">
                              Nombre Completo del Recomendado *
                            </label>
                            <input
                              type="text"
                              value={refName}
                              onChange={e => setRefName(e.target.value)}
                              placeholder="Ej. Roberto Sánchez Gómez"
                              required
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 block mb-1">
                              Teléfono / WhatsApp *
                            </label>
                            <input
                              type="tel"
                              value={refPhone}
                              onChange={e => setRefPhone(e.target.value)}
                              placeholder="Ej. 2291234567"
                              required
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white font-mono"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 block mb-1">
                              Municipio / Ciudad y Estado *
                            </label>
                            <input
                              type="text"
                              value={refCity}
                              onChange={e => setRefCity(e.target.value)}
                              placeholder="Ej. Boca del Río, Veracruz"
                              required
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 block mb-1">
                              Recibo CFE Promedio (Bimestral MXN) *
                            </label>
                            <input
                              type="number"
                              value={refBill}
                              onChange={e => setRefBill(e.target.value)}
                              placeholder="Ej. 3500"
                              min="100"
                              required
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white font-mono"
                            />
                            {/* Quick selection chips matching Cotizador Express */}
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {[
                                { label: '$1,500', val: 1500 },
                                { label: '$2,500', val: 2500 },
                                { label: '$3,500', val: 3500 },
                                { label: '$5,000', val: 5000 },
                                { label: '$8,000', val: 8000 },
                                { label: '$12,000 (DAC)', val: 12000 }
                              ].map(chip => (
                                <button
                                  key={chip.val}
                                  type="button"
                                  onClick={() => setRefBill(String(chip.val))}
                                  className={`px-2 py-1 rounded-lg text-[9px] font-black transition-all cursor-pointer border ${
                                    Number(refBill) === chip.val
                                      ? 'bg-pink-600 text-white border-pink-600 shadow-xs'
                                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                                  }`}
                                >
                                  {chip.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Advisor Display - Strictly showing their recommending Asesor Verde */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 block">
                              Asesor Verde que Atenderá la Cotización
                            </label>
                            <span className="text-[8px] font-black text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md uppercase tracking-wider">
                              🌱 Asesor Verde Asignado
                            </span>
                          </div>
                          <select
                            value={selectedAdvisorId}
                            onChange={e => setSelectedAdvisorId(e.target.value)}
                            disabled={greenAdvisors.length <= 1}
                            className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border ${
                              greenAdvisors.length <= 1
                                ? 'bg-slate-100/90 text-slate-800 border-slate-300/80 cursor-default select-none'
                                : 'bg-slate-50 border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white cursor-pointer'
                            }`}
                          >
                            {greenAdvisors.length > 0 ? (
                              greenAdvisors.map((adv, idx) => (
                                <option key={`enl_adv_opt_${adv.id || adv.username}_${idx}`} value={adv.id}>
                                  🌱 {adv.fullName || adv.username} - Asesor Verde {adv.whatsapp ? `(${adv.whatsapp})` : ''}
                                </option>
                              ))
                            ) : (
                              <option value="usr_gustavo">🌱 Gustavo Luna - Asesor Verde</option>
                            )}
                          </select>
                          <span className="text-[9px] text-emerald-800 font-semibold flex items-center gap-1.5 mt-1.5 bg-emerald-50/80 border border-emerald-200/70 p-2 rounded-lg">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>
                              {greenAdvisors.length > 0
                                ? `Tu Asesor Verde que te recomendó (${greenAdvisors[0].fullName || greenAdvisors[0].username}) dará seguimiento técnico y comercial personalizado a tus prospectos.`
                                : 'Tu Asesor Verde asignado de cabecera atenderá la cotización técnica y presentará la propuesta.'}
                            </span>
                          </span>
                        </div>

                        {/* Dynamic Live Estimation Card - Synchronized with Cotizador Exprés and Principal */}
                        {billValue > 0 && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-gradient-to-r from-pink-50 via-slate-50 to-emerald-50/50 border border-pink-200/80 rounded-2xl p-4 space-y-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-pink-200/60 pb-2">
                              <span className="text-[10px] font-black uppercase tracking-wider text-pink-900 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-pink-600" />
                                Pre-Cálculo Solar Oficial Sincronizado
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded-md font-mono">
                                  Costo Oficial: ${activePanelPrice.toLocaleString('es-MX')} MXN / panel
                                </span>
                                <span className="text-[9px] font-black text-pink-700 bg-pink-100/90 border border-pink-200 px-2 py-0.5 rounded-md">
                                  Tu Bono: +$1,000 MXN
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-0.5">
                              <div className="bg-white/90 p-2.5 rounded-xl border border-pink-100/80 shadow-xs">
                                <span className="text-[8px] uppercase text-slate-400 font-extrabold block">Paneles Sugeridos</span>
                                <strong className="text-sm font-black text-slate-900 font-mono">{estimatedPanelsCalc} módulos</strong>
                                <span className="text-[8px] text-slate-400 font-bold block">550W Monocristalino</span>
                              </div>
                              <div className="bg-white/90 p-2.5 rounded-xl border border-pink-100/80 shadow-xs">
                                <span className="text-[8px] uppercase text-slate-400 font-extrabold block">Potencia Pico</span>
                                <strong className="text-sm font-black text-emerald-700 font-mono">~{estimatedKwpCalc} kWp</strong>
                                <span className="text-[8px] text-slate-400 font-bold block">Generación Solar</span>
                              </div>
                              <div className="bg-white/90 p-2.5 rounded-xl border border-pink-100/80 shadow-xs">
                                <span className="text-[8px] uppercase text-slate-400 font-extrabold block">Espacio en Techo</span>
                                <strong className="text-sm font-black text-slate-900 font-mono">~{estimatedAreaCalc} m²</strong>
                                <span className="text-[8px] text-slate-400 font-bold block">2.88 m²/panel</span>
                              </div>
                              <div className="bg-white/90 p-2.5 rounded-xl border border-pink-100/80 shadow-xs">
                                <span className="text-[8px] uppercase text-slate-400 font-extrabold block">Inversión Estimada</span>
                                <strong className="text-sm font-black text-slate-900 font-mono">${estimatedInvestmentCalc.toLocaleString('es-MX')}</strong>
                                <span className="text-[8px] text-emerald-600 font-bold block">Sincronizado Admin</span>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[9px]">
                              <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                                🍃 Ahorro anual estimado: <strong>~${estimatedAnnualSavingsCalc.toLocaleString('es-MX')} MXN/año</strong> en CFE
                              </span>
                              {estimatedPanelsCalc > 4 && (
                                <span className="text-amber-800 bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                                  ⚡ Requiere acometida 220V Bifásica (&gt;4 paneles)
                                </span>
                              )}
                            </div>
                          </motion.div>
                        )}

                        <button
                          type="submit"
                          className="w-full py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-pink-500/20 active:scale-[0.99] transition-all cursor-pointer"
                        >
                          <Send className="w-4 h-4" />
                          <span>Registrar y Enlazar Recomendación</span>
                        </button>
                      </form>
                    </div>

                    {/* Right Column: Shareable Links and WhatsApp scripts (5 cols) */}
                    <div className="lg:col-span-5 space-y-5">
                      {/* Card: Share Prospect Link */}
                      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                        <div className="flex items-center gap-2 text-slate-900">
                          <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center font-bold">
                            <Share2 className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-wide">Tu Enlace de Recomendación</h4>
                            <p className="text-[9px] text-slate-400 font-bold uppercase">Comparte directo por redes o WhatsApp</p>
                          </div>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                          <span className="text-[8px] uppercase tracking-wider block font-bold text-slate-400">URL Personalizada con tu Código</span>
                          <p className="text-[11px] font-mono text-slate-700 break-all font-semibold select-all bg-white p-2 rounded-lg border border-slate-200/80">
                            {referralLink}
                          </p>
                          <div className="flex gap-2 pt-1">
                            <button
                              type="button"
                              onClick={handleCopyLink}
                              className="flex-1 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            >
                              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copiedLink ? '¡Copiado!' : 'Copiar'}</span>
                            </button>
                            <a
                              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                                `¡Hola! Te comparto este enlace para cotizar paneles solares con Solux Green y bajar tu recibo de CFE hasta un 95%. Solicita tu estudio gratuito aquí: ${referralLink}`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xs"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Card: Share Enlace Recruiter Link */}
                      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                        <div className="flex items-center gap-2 text-slate-900">
                          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                            <Users className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-wide">Invitar a un Nuevo Enlace</h4>
                            <p className="text-[9px] text-slate-400 font-bold uppercase">Suma promotores bajo tu recomendación</p>
                          </div>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                          <span className="text-[8px] uppercase tracking-wider block font-bold text-slate-400">Enlace de Registro de Enlaces</span>
                          <p className="text-[11px] font-mono text-slate-700 break-all font-semibold select-all bg-white p-2 rounded-lg border border-slate-200/80">
                            {enlaceInviteLink}
                          </p>
                          <div className="flex gap-2 pt-1">
                            <button
                              type="button"
                              onClick={handleCopyInviteLink}
                              className="flex-1 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            >
                              {copiedInviteLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copiedInviteLink ? '¡Copiado!' : 'Copiar'}</span>
                            </button>
                            <a
                              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                                `¡Hola! Únete como Asesor de Enlace en Solux Green y genera excelentes ingresos por recomendar proyectos de energía solar en tu comunidad. Regístrate con mi enlace: ${enlaceInviteLink}`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xs"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Quick Info Box */}
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start gap-3 text-slate-600 text-[10px] leading-relaxed">
                        <Sparkles className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-800 block uppercase font-black text-[9px] mb-0.5">Seguimiento Transparente</strong>
                          Cada vez que registres un prospecto o alguien ingrese por tu enlace, su expediente aparecerá en tu pestaña de <strong className="text-pink-700">Recompensas (Monedero)</strong> con el estatus de su cotización e instalación física.
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {/* NOTIFICATIONS MODULE */}
            {activeTab === 'notificaciones' && (
              <NotificationsModule
                notifications={notifications}
                role="enlace"
                currentUser={currentUser}
                onMarkAsRead={onMarkNotificationAsRead}
                onMarkAllAsRead={onMarkAllNotificationsAsRead}
                onClearAllNotifications={onClearAllNotifications}
                onDeleteNotification={onDeleteNotification}
              />
            )}
        
            {/* TAB 1: MONEDERO Y LISTA DE REFERIDOS */}
            {activeTab === 'monedero' && (
          <div className="space-y-6 w-full">
            
            {/* Wallet cards row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Card 1: total cobrado */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between shadow-xs">
                <div className="space-y-1">
                  <span className="text-[8px] text-slate-500 font-black block uppercase tracking-wider">Saldo Cobrado</span>
                  <span className="text-lg font-black text-slate-800 block font-mono">${totalBonusesEarned.toLocaleString('es-MX')} MXN</span>
                  <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded inline-block font-bold">
                    Cobrado con Éxito
                  </span>
                </div>
                <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Coins className="w-5 h-5 animate-pulse" />
                </div>
              </div>

              {/* Card 2: pendiente por liberar */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between shadow-xs">
                <div className="space-y-1">
                  <span className="text-[8px] text-slate-500 font-black block uppercase tracking-wider">Por Liberar</span>
                  <span className="text-lg font-black text-amber-600 block font-mono">${pendingBonuses.toLocaleString('es-MX')} MXN</span>
                  <span className="text-[9px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded inline-block font-bold">
                    Firmado por instalar
                  </span>
                </div>
                <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
                  <Gift className="w-5 h-5" />
                </div>
              </div>

              {/* Card 3: total prospects */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between shadow-xs">
                <div className="space-y-1">
                  <span className="text-[8px] text-slate-500 font-black block uppercase tracking-wider">Mis Recomendados</span>
                  <span className="text-lg font-black text-slate-800 block font-mono">{myReferrals.length} Personas</span>
                  <span className="text-[9px] text-slate-500 block font-semibold">
                    Enviados a Solux Green
                  </span>
                </div>
                <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>

            </div>

            {/* Referrals tracker table */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-xs font-black text-slate-800 uppercase tracking-wide">Estatus de tus Recomendados</h2>
                  <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Seguimiento en tiempo real del proceso de venta</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setActiveTab('recomendar')}
                    className="px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Recomendar Enlace</span>
                  </button>
                  {myReferrals.length > 0 && (
                    <>
                      <button
                        onClick={exportReferralsToPDF}
                        disabled={isExportingPdf}
                        className="px-2.5 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-60 text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-1 shadow-xs"
                      >
                        {isExportingPdf ? '⏳ Descargando...' : '📄 PDF'}
                      </button>
                      <button
                        onClick={exportReferralsToExcel}
                        className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-1"
                      >
                        📊 Excel
                      </button>
                    </>
                  )}
                </div>
              </div>

              {myReferrals.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-pink-50 text-pink-500 mx-auto flex items-center justify-center">
                    <UserPlus className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-800">Todavía no tienes recomendados registrados</h4>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Comienza recomendando a tu primer contacto para ganar $1,000 MXN en cuanto se instale.</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('recomendar')}
                    className="mt-2 px-4 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-2 shadow-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Recomendar Prospecto Ahora</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs text-slate-600">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400">
                        <th className="py-2.5 px-3 text-[8px] font-black uppercase tracking-widest">Recomendado</th>
                        <th className="py-2.5 px-3 text-[8px] font-black uppercase tracking-widest">Ubicación</th>
                        <th className="py-2.5 px-3 text-[8px] font-black uppercase tracking-widest">Asesor Verde Asignado</th>
                        <th className="py-2.5 px-3 text-[8px] font-black uppercase tracking-widest">Fase en Solux</th>
                        <th className="py-2.5 px-3 text-[8px] font-black uppercase tracking-widest text-right">Tu Bono</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-bold">
                      {myReferrals.map((ref, idx) => {
                        const tracker = getReferralStatusText(ref.status);
                        const isInstalled = tracker.text === 'Instalado';
                        const isContracted = tracker.text === 'Contratado';
                        const advName = ref.advisorName || 'Ing. Carlos Mendoza (Asesor Verde)';
                        const advPhone = ref.advisorPhone || '5512345678';

                        return (
                          <tr key={`enl_ref_row_${ref.id || 'ref'}_${idx}`} className="hover:bg-slate-50 transition-all">
                            <td className="py-3 px-3">
                              <span className="text-slate-800 block font-extrabold">{ref.clientName}</span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[9px] text-slate-400 font-mono">CFE: ${ref.averageBill}/bim</span>
                                <span className="text-[9px] text-slate-300">•</span>
                                <a 
                                  href={`https://api.whatsapp.com/send?phone=${formatWhatsAppPhone(ref.clientPhone)}&text=${encodeURIComponent(`Hola ${ref.clientName}, ¿cómo estás? Te saluda ${currentUser?.fullName || 'tu amigo'}, te registré en Solux Green para tu cotización solar.`)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[9px] text-emerald-600 hover:text-emerald-700 underline flex items-center gap-0.5 font-bold"
                                  title="Contactar al cliente por WhatsApp"
                                >
                                  {ref.clientPhone}
                                </a>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-[10px] text-slate-500 font-medium">
                              {ref.municipalityState}
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <div>
                                  <span className="text-[10px] font-black text-slate-800 block">{advName}</span>
                                  <span className="text-[8px] text-emerald-600 font-bold uppercase block tracking-wider">🌱 Especialista Solux</span>
                                </div>
                                {advPhone && (
                                  <a
                                    href={`https://api.whatsapp.com/send?phone=${formatWhatsAppPhone(advPhone)}&text=${encodeURIComponent(`Hola ${advName}, te saluda ${currentUser?.fullName || 'Socio Enlace'} (Código: ${referralCode}). Te asigné a mi referido ${ref.clientName} (${ref.clientPhone}) en ${ref.municipalityState}. ¿Cómo va su cotización?`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-[9px] font-bold"
                                    title="Consultar avance con el Asesor Verde por WhatsApp"
                                  >
                                    💬 WA
                                  </a>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase border tracking-wider ${tracker.style}`}>
                                {tracker.text}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <span className={`font-mono text-xs ${isInstalled ? 'text-emerald-600 font-black' : isContracted ? 'text-amber-600' : 'text-slate-400'}`}>
                                {isInstalled ? '+$1,000 MXN' : isContracted ? '$1,000 (Firmado)' : '$0.00 (Pendiente)'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Terms breakdown block */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start gap-3 text-slate-500 leading-relaxed text-[10px] max-w-2xl">
              <Sparkles className="w-4.5 h-4.5 text-pink-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-slate-800 uppercase block mb-0.5">¿Cómo funcionan tus comisiones de Enlace?</span>
                Por cada amigo que recomiendes y decida instalar paneles solares con Solux Green, tú ganas un bono de <span className="text-pink-700 font-bold">$1,000 pesos en efectivo</span> de forma inmediata al momento de iniciar la instalación física. ¡Sin límite de recomendados!
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: BANCO DE MATERIAL PROMOCIONAL (Multirrol) */}
        {activeTab === 'banco' && (
          <div className="w-full">
            <PromotionalMaterialsModule 
              currentUser={currentUser}
              solarProjects={solarProjects}
              isOfflineMode={isOfflineMode}
            />
          </div>
        )}

        {/* TAB 3: RECOMENDACIONES RECIBIDAS DE ASESORES VERDES */}
        {(activeTab === 'recomendaciones' || activeTab === 'nuevo') && (
          <div className="flex-1 overflow-y-auto p-5 md:p-8 w-full space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 max-w-5xl mx-auto"
            >
              {/* Header Hero Banner */}
              <div className="bg-gradient-to-r from-pink-900 via-slate-900 to-emerald-950 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-pink-500/20">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/20 border border-pink-400/30 text-pink-300 text-[10px] font-black uppercase tracking-wider mb-2">
                      <Handshake className="w-3.5 h-3.5" />
                      Módulo de Recomendaciones Recibidas
                    </div>
                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">
                      Clientes Asignados por Asesores Verdes
                    </h2>
                    <p className="text-xs text-slate-300 font-medium max-w-xl mt-1 leading-relaxed">
                      Aquí recibes los prospectos recomendados por el equipo de Asesores Verdes de Solux Green para acompañamiento local en tu comunidad. ¡Cada cliente instalado te genera <span className="text-pink-400 font-black">$1,000 MXN</span> de bono en tu monedero!
                    </p>
                  </div>

                  {/* Summary Metric Badges */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center min-w-[120px]">
                      <span className="text-[9px] uppercase font-bold text-pink-300 block tracking-wider">Asignados</span>
                      <span className="text-2xl font-black text-white">{recommendationsFromAdvisors.length}</span>
                      <span className="text-[8px] text-slate-300 block mt-0.5">Prospectos</span>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center min-w-[140px]">
                      <span className="text-[9px] uppercase font-bold text-emerald-300 block tracking-wider">Bono Potencial</span>
                      <span className="text-2xl font-black text-emerald-400">
                        ${(recommendationsFromAdvisors.length * 1000).toLocaleString('es-MX')}
                      </span>
                      <span className="text-[8px] text-slate-300 block mt-0.5">MXN en Monedero</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations List Container */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
                      <span>Expedientes en Atención</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-pink-100 text-pink-800 rounded-full">
                        {recommendationsFromAdvisors.length}
                      </span>
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                      Contacta al cliente y coordínate con su Asesor Verde para cerrar la venta
                    </p>
                  </div>
                </div>

                {recommendationsFromAdvisors.length === 0 ? (
                  <div className="py-14 text-center text-slate-400 space-y-3">
                    <div className="w-16 h-16 rounded-3xl bg-pink-50 text-pink-500 mx-auto flex items-center justify-center">
                      <Handshake className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black uppercase text-slate-800">
                        Aún no tienes recomendaciones asignadas
                      </h4>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        Cuando un <span className="font-bold text-emerald-700">Asesor Verde</span> te recomiende o asigne un cliente desde su Cotizador Exprés o Pipeline comercial, aparecerá aquí inmediatamente con notificación en tiempo real.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {recommendationsFromAdvisors.map((proj, idx) => {
                      const tracker = getReferralStatusText(proj.status);
                      const isInstalled = tracker.text === 'Instalado';
                      const cleanPhone = (proj.clientPhone || '').replace(/\D/g, '');
                      const advisorPhoneClean = (proj.advisorPhone || '').replace(/\D/g, '');

                      return (
                        <div
                          key={`rec_adv_proj_${proj.id || 'p'}_${idx}`}
                          className="bg-slate-50/70 border border-slate-200 hover:border-pink-300 rounded-2xl p-5 transition-all shadow-2xs space-y-4"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-black text-slate-900">{proj.clientName}</h4>
                                <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${tracker.style}`}>
                                  {tracker.text}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1 font-medium">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                  {proj.municipalityState || 'Ubicación sin registrar'}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1 font-mono text-slate-600">
                                  Folio: {proj.id.slice(-8).toUpperCase()}
                                </span>
                              </div>
                            </div>

                            {/* Reward Pill */}
                            <div className="bg-pink-50 border border-pink-200 rounded-xl px-3 py-1.5 text-right shrink-0">
                              <span className="text-[8px] font-black uppercase text-pink-700 block tracking-wider">
                                {isInstalled ? '✅ Bono Cobrado' : '🎁 Bono al Instalar'}
                              </span>
                              <span className="text-xs font-black text-pink-900">
                                +$1,000 MXN
                              </span>
                            </div>
                          </div>

                          {/* Technical & Commercial Quick Summary */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-3 rounded-xl border border-slate-200/80 text-center">
                            <div>
                              <span className="text-[8px] font-extrabold uppercase text-slate-400 block">Recibo CFE</span>
                              <span className="text-xs font-black text-slate-800">
                                ${(proj.averageBill || 0).toLocaleString('es-MX')}/bim
                              </span>
                            </div>
                            <div>
                              <span className="text-[8px] font-extrabold uppercase text-slate-400 block">Paneles Est.</span>
                              <span className="text-xs font-black text-emerald-700">
                                {proj.estimatedPanels || 'Calculando'} módulos
                              </span>
                            </div>
                            <div>
                              <span className="text-[8px] font-extrabold uppercase text-slate-400 block">Inversión</span>
                              <span className="text-xs font-black text-slate-800">
                                ${(proj.totalInvestment || (proj.estimatedPanels ? proj.estimatedPanels * activePanelPrice : 0)).toLocaleString('es-MX')}
                              </span>
                            </div>
                            <div>
                              <span className="text-[8px] font-extrabold uppercase text-slate-400 block">Fecha Asignación</span>
                              <span className="text-xs font-bold text-slate-600">
                                {proj.createdDate || 'Reciente'}
                              </span>
                            </div>
                          </div>

                          {/* Green Advisor info */}
                          <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                                🌱
                              </span>
                              <div>
                                <span className="text-[8px] font-black uppercase text-emerald-800 tracking-wide block">
                                  Recomendado por Asesor Verde
                                </span>
                                <span className="font-extrabold text-slate-900">
                                  {proj.advisorName || 'Asesor Comercial Solux'}
                                </span>
                                {proj.advisorPhone && (
                                  <span className="text-[10px] text-slate-500 font-medium ml-2">
                                    📞 {proj.advisorPhone}
                                  </span>
                                )}
                              </div>
                            </div>

                            {advisorPhoneClean && (
                              <a
                                href={`https://wa.me/${formatWhatsAppPhone(advisorPhoneClean)}?text=${encodeURIComponent(
                                  `Hola ${proj.advisorName || 'Asesor Verde'}, veo que me recomendaste al cliente ${proj.clientName} (Folio ${proj.id}). ¡Me estoy coordinando con él para el seguimiento!`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 bg-white text-emerald-800 border border-emerald-300 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-emerald-100 transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                              >
                                💬 Coordinar con Asesor
                              </a>
                            )}
                          </div>

                          {/* Notes if present */}
                          {proj.recommendationNotes && (
                            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-900 flex items-start gap-2">
                              <span className="text-amber-700 font-bold shrink-0">📝 Nota:</span>
                              <span className="font-medium text-[11px]">{proj.recommendationNotes}</span>
                            </div>
                          )}

                          {/* Client Contact & Dossier Actions */}
                          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/60">
                            {cleanPhone ? (
                              <>
                                <a
                                  href={`https://wa.me/${formatWhatsAppPhone(cleanPhone)}?text=${encodeURIComponent(
                                    `Hola ${proj.clientName}, te saluda ${currentUser?.fullName || 'tu Enlace Solux'} de la red Solux Green solar. Tu Asesor Verde nos compartió tus datos para brindarte atención y resolver cualquier duda con tu proyecto solar.`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 min-w-[180px] py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>Contactar por WhatsApp</span>
                                </a>

                                <a
                                  href={`tel:${formatWhatsAppPhone(cleanPhone)}`}
                                  className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                                >
                                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Llamar</span>
                                </a>
                              </>
                            ) : null}

                            {/* Exportar Expediente / Cotización */}
                            {(() => {
                              const matchedUser = users?.find(
                                (u: any) => u.solarProjectId === proj.id || u.username === proj.clientName.toLowerCase().replace(/[^a-z0-9]/g, '')
                              );
                              return (
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => exportProjectDossierImage(proj, matchedUser, soluxConfig)}
                                    title="Descargar propuesta en Imagen JPG"
                                    className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                                  >
                                    <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>JPG</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => exportProjectDossierPDF(proj, matchedUser, soluxConfig)}
                                    title="Descargar expediente en PDF"
                                    className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-rose-600" />
                                    <span>PDF</span>
                                  </button>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* ------------------- SUCCESS REFERRAL CONFIRMATION MODAL ------------------- */}
        {successReferralData && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-left space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase text-emerald-700 tracking-wider">¡Registro Exitoso!</span>
                  <h3 className="text-base font-black text-slate-900 leading-tight">Recomendación Enlazada</h3>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-200/80 pb-1.5">
                  <span className="text-slate-500 font-semibold">Cliente Recomendado:</span>
                  <span className="font-extrabold text-slate-800">{successReferralData.clientName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/80 pb-1.5">
                  <span className="text-slate-500 font-semibold">Teléfono / Ubicación:</span>
                  <span className="font-mono text-slate-700">{successReferralData.clientPhone} ({successReferralData.city})</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/80 pb-1.5 bg-emerald-50/80 -mx-4 px-4 py-1.5">
                  <span className="text-emerald-900 font-bold">👤 Asesor Verde Asignado:</span>
                  <span className="font-extrabold text-emerald-700">{successReferralData.advisorName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/80 pb-1.5">
                  <span className="text-slate-500 font-semibold">Tu Código de Enlace:</span>
                  <span className="font-mono font-bold text-pink-700 bg-pink-50 px-2 py-0.5 rounded">{successReferralData.referralCode}</span>
                </div>
                <div className="flex justify-between pt-0.5">
                  <span className="text-slate-500 font-semibold">Bono en Monedero:</span>
                  <span className="font-black text-emerald-600 font-mono">+${successReferralData.estimatedBonus.toLocaleString('es-MX')} MXN</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[10px] text-amber-900 space-y-1">
                <strong className="block font-black uppercase tracking-wider text-[9px] text-amber-800">📍 ¿Dónde se registran estos datos?</strong>
                <ul className="list-disc pl-4 space-y-0.5 font-medium">
                  <li><strong>Monedero Electrónico (Recompensas):</strong> Puedes ver el estatus en tiempo real en la tabla de este portal.</li>
                  <li><strong>CRM Comercial:</strong> Se envió al buzón del Asesor Verde <em>{successReferralData.advisorName}</em> para su cotización y llamada.</li>
                  <li><strong>Base de Datos Supabase:</strong> Guardado en la tabla <code className="bg-amber-100 px-1 rounded">solar_projects</code>.</li>
                </ul>
              </div>

              <div className="space-y-2 pt-2">
                {/* Botón Principal: Notificar / Compartir con el Cliente Recomendado usando estrictamente el teléfono ingresado */}
                <a
                  href={`https://api.whatsapp.com/send?phone=${formatWhatsAppPhone(successReferralData.clientPhone)}&text=${encodeURIComponent(
                    `¡Hola ${successReferralData.clientName}! Te saluda ${currentUser?.fullName || 'tu Asesor de Enlace Solux Green'}. ☀️\n\nTe registré exitosamente en el sistema Solux Green para tu cotización y proyecto de paneles solares (Folio de recomendación: ${successReferralData.referralCode}).\n\nMuy pronto te contactará nuestro Asesor Verde ${successReferralData.advisorName} para presentarte la propuesta de ahorro para tu recibo de CFE en ${successReferralData.city}. ¡Saludos cordiales! 🌿⚡`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer text-center"
                >
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span>Avisar al Cliente por WhatsApp ({successReferralData.clientPhone})</span>
                </a>

                {/* Botón Secundario: Avisar también al Asesor Verde Asignado */}
                {successReferralData.advisorPhone && (
                  <a
                    href={`https://api.whatsapp.com/send?phone=${formatWhatsAppPhone(successReferralData.advisorPhone)}&text=${encodeURIComponent(
                      `Hola ${successReferralData.advisorName}, te saluda ${currentUser?.fullName || 'Socio Enlace'} (Código: ${successReferralData.referralCode}). Acabo de registrar a mi prospecto recomendado ${successReferralData.clientName} (WhatsApp: ${successReferralData.clientPhone}) en ${successReferralData.city}. ¡Quedo al pendiente de su cotización!`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-200 text-center"
                  >
                    <span>👤 Notificar también al Asesor Verde ({successReferralData.advisorName})</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setSuccessReferralData(null);
                    setActiveTab('monedero');
                  }}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all text-center"
                >
                  Ver en Monedero
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* ------------------- USER PROFILE MODULE ------------------- */}
        {activeTab === 'perfil' && (
          <UserProfileModule 
            currentUser={currentUser} 
            onUpdateProfile={onUpdateProfile} 
            isOfflineMode={isOfflineMode}
          />
        )}
        </AnimatePresence>
      </div>

      {/* 3. BOTTOM TAB NAVIGATION FOR TABLET/MOBILE (lg:hidden) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200 z-50 flex justify-around items-center px-4 shadow-lg">
        <button
          onClick={() => setActiveTab('monedero')}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-colors relative py-1 px-3 rounded-xl ${
            activeTab === 'monedero' ? 'text-pink-600 font-black' : 'text-slate-400'
          }`}
        >
          <Coins className="w-5 h-5" />
          <span className="text-[8px] tracking-wider uppercase font-black">Monedero</span>
          {activeTab === 'monedero' && (
            <motion.div 
              layoutId="bottom-nav-active-indicator-enlace"
              className="absolute bottom-0 w-8 h-0.5 bg-pink-500 rounded-full"
            />
          )}
        </button>

        <button
          onClick={() => setActiveTab('banco')}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-colors relative py-1 px-2 rounded-xl ${
            activeTab === 'banco' ? 'text-pink-600 font-black' : 'text-slate-400'
          }`}
        >
          <Share2 className="w-5 h-5" />
          <span className="text-[8px] tracking-wider uppercase font-black">Publicidad</span>
          {activeTab === 'banco' && (
            <motion.div 
              layoutId="bottom-nav-active-indicator-enlace"
              className="absolute bottom-0 w-8 h-0.5 bg-pink-500 rounded-full"
            />
          )}
        </button>

        <button
          onClick={() => setActiveTab('recomendar')}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-colors relative py-1 px-2 rounded-xl ${
            activeTab === 'recomendar' ? 'text-pink-600 font-black' : 'text-slate-400'
          }`}
        >
          <UserPlus className="w-5 h-5" />
          <span className="text-[8px] tracking-wider uppercase font-black">Recomendar</span>
          <span className="absolute top-0 right-1 w-2 h-2 bg-emerald-500 rounded-full" />
          {activeTab === 'recomendar' && (
            <motion.div 
              layoutId="bottom-nav-active-indicator-enlace"
              className="absolute bottom-0 w-8 h-0.5 bg-pink-500 rounded-full"
            />
          )}
        </button>

        <button
          onClick={() => setActiveTab('perfil')}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-colors relative py-1 px-3 rounded-xl ${
            activeTab === 'perfil' ? 'text-pink-600 font-black' : 'text-slate-400'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[8px] tracking-wider uppercase font-black">Perfil</span>
          {activeTab === 'perfil' && (
            <motion.div 
              layoutId="bottom-nav-active-indicator-enlace"
              className="absolute bottom-0 w-8 h-0.5 bg-pink-500 rounded-full"
            />
          )}
        </button>

        <button
          onClick={onExit}
          className="flex flex-col items-center gap-1 cursor-pointer text-rose-500 hover:text-rose-600 py-1 px-3 rounded-xl"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-[8px] tracking-wider uppercase font-black">Salir</span>
        </button>
      </nav>

      </div>

    </div>
  );
}
