import React, { useState, useRef, useEffect } from 'react';
import { 
  Wrench, CheckCircle, MapPin, Phone, ArrowLeft, 
  Layers, CheckSquare, Sparkles, Navigation, Clock,
  Eye, PenTool, ShieldAlert, Check, HelpCircle, Download,
  Upload, FileText, CheckCircle2, AlertCircle, Smartphone, Lock, LogOut, X,
  User, Camera, Plus, Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SolarProject, AppNotification } from '../types';
import { SOLUX_LOGO_URL, SOLUX_LOGO_FALLBACK } from '../logoConfig';
import { exportSurveysListPDF } from '../pdfUtils';
import UserProfileModule from './UserProfileModule';
import { NotificationsBell } from './NotificationsBell';
import NotificationsModule from './NotificationsModule';
import PromotionalMaterialsModule from './PromotionalMaterialsModule';
import { Bell } from 'lucide-react';

interface TechDashboardProps {
  solarProjects: SolarProject[];
  onUpdateSolarProject: (id: string, updated: Partial<SolarProject>) => void;
  onAddSolarProject?: (project: SolarProject) => void;
  onExit: () => void;
  users: any[];
  currentUser: any;
  onUpdateProfile: (updatedUser: any) => void;
  onUpdateUsers?: (users: any[]) => void;

  // Notification additions
  notifications: AppNotification[];
  onMarkNotificationAsRead: (id: string) => void;
  onMarkAllNotificationsAsRead: () => void;
  onClearAllNotifications?: () => void;
  onDeleteNotification?: (id: string) => void;
  onDeleteSolarProject?: (id: string) => void;
}

export default function TechDashboard({
  solarProjects,
  onUpdateSolarProject,
  onAddSolarProject,
  onExit,
  users,
  currentUser,
  onUpdateProfile,
  onUpdateUsers,

  notifications,
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  onClearAllNotifications,
  onDeleteNotification
}: TechDashboardProps) {
  const [activeTab, setActiveTab] = useState<'tareas' | 'nuevo' | 'perfil' | 'notificaciones' | 'promocionales'>(() => {
    const saved = localStorage.getItem('solux_tech_active_tab');
    return (saved as any) || 'tareas';
  });

  useEffect(() => {
    localStorage.setItem('solux_tech_active_tab', activeTab);
  }, [activeTab]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [surveyStatusFilter, setSurveyStatusFilter] = useState<'todos' | 'pendiente' | 'en_proceso' | 'concluido'>('todos');
  
  // Offline simulation state inside Partner dashboard
  const [partnerOfflineMode, setPartnerOfflineMode] = useState<boolean>(() => {
    return localStorage.getItem('solux_offline') === 'true';
  });

  // --- New Prospect Registration Form States ---
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formMapsUrl, setFormMapsUrl] = useState('');
  const [formMunicipality, setFormMunicipality] = useState('');
  const [formBill, setFormBill] = useState('');
  const [formSpace, setFormSpace] = useState('');
  const [formMeters, setFormMeters] = useState('');
  const [formCFE, setFormCFE] = useState<'activo_sin_adeudo' | 'con_adeudo' | 'inactivo'>('activo_sin_adeudo');
  const [formOwnership, setFormOwnership] = useState<'propietario' | 'arrendatario_autorizado'>('propietario');
  const [formPayMethod, setFormPayMethod] = useState<string>('directo');
  const [formWires, setFormWires] = useState<number>(2);
  const [formLoads, setFormLoads] = useState<string[]>([]);

  // File Upload states for Registration
  const [evidenceReceiptFront, setEvidenceReceiptFront] = useState<string>('');
  const [evidenceReceiptBack, setEvidenceReceiptBack] = useState<string>('');
  const [evidenceReceipt2Front, setEvidenceReceipt2Front] = useState<string>('');
  const [evidenceFacade, setEvidenceFacade] = useState<string>('');
  const [evidenceInstallArea, setEvidenceInstallArea] = useState<string>('');

  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');

  const handleEvidenceFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const calculatePanels = (bill: number) => {
    if (bill <= 0) return 0;
    const rawPanels = (bill / 1000) * 2;
    const dec = rawPanels - Math.floor(rawPanels);
    const p = dec >= 0.1 ? Math.ceil(rawPanels) : Math.floor(rawPanels);
    return Math.max(1, p);
  };

  const getFilteredSurveys = () => {
    return solarProjects.filter(p => {
      if (currentUser?.role !== 'admin') {
        const isAssigned = p.assignedPartnerId === currentUser?.id || p.assignedTechnicianId === currentUser?.id;
        const isCreator = p.createdBy === currentUser?.id || 
                          p.createdBy === currentUser?.username || 
                          p.createdBy === currentUser?.fullName;
        if (!isAssigned && !isCreator) return false;
      }
      return surveyStatusFilter === 'todos' ? true : p.siteSurveyStatus === surveyStatusFilter;
    });
  };

  const exportSurveysToExcel = () => {
    const list = getFilteredSurveys();
    const headers = ["ID Proyecto", "Cliente", "Telefono", "Municipio y Estado", "Estatus Levantamiento", "Paneles Estimados", "Inversion Estimada", "Hilos", "Metodo Pago", "Fecha Registro"];
    const rows = list.map(proj => [
      proj.id,
      `"${proj.clientName.replace(/"/g, '""')}"`,
      `"${proj.clientPhone}"`,
      `"${proj.municipalityState.replace(/"/g, '""')}"`,
      `"${proj.siteSurveyStatus === 'concluido' ? 'CONCLUIDO' : 'PENDIENTE'}"`,
      proj.estimatedPanels || 2,
      proj.totalInvestment || 0,
      proj.wiresCount || 2,
      `"${proj.paymentMethodDesired}"`,
      proj.createdDate || ''
    ].join(","));

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Levantamientos_Tecnicos_${surveyStatusFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportSurveysToPDF = async () => {
    const list = getFilteredSurveys();
    await exportSurveysListPDF(list, surveyStatusFilter);
  };

  const handleCreateProspect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPhone || !formMunicipality) {
      alert('⚠️ Por favor completa los campos requeridos (*).');
      return;
    }

    const bill = Number(formBill);
    const calculatedPanelsCount = calculatePanels(bill);
    const investment = calculatedPanelsCount * 8500; // default base price

    const newProject: SolarProject = {
      id: `proj_${Date.now()}`,
      clientName: formName,
      clientPhone: formPhone,
      clientEmail: formEmail || undefined,
      whatsappPhone: formPhone,
      googleMapsUrl: formMapsUrl || undefined,
      municipalityState: formMunicipality,
      electricalLoadType: formLoads,
      wiresCount: formWires,
      averageBill: bill,
      availableSpace: Number(formSpace),
      metersCount: Number(formMeters) || 1,
      cfeStatus: formCFE,
      paymentMethodDesired: formPayMethod,
      propertyOwnership: formOwnership,
      estimatedPanels: calculatedPanelsCount,
      requiredArea: Number((calculatedPanelsCount * 2.88).toFixed(2)),
      voltageAlert220v: calculatedPanelsCount > 4,
      voltageUpgradeQuoted: calculatedPanelsCount > 4,
      totalInvestment: investment,
      siteSurveyPaid: false,
      siteSurveyStatus: 'pendiente',
      status: 'validacion',
      evidence: {
        cfeReceiptFront: evidenceReceiptFront || 'https://appdesign.appdesignproyectos.com/recibo_cfe_placeholder.jpg',
        cfeReceiptBack: evidenceReceiptBack || 'https://appdesign.appdesignproyectos.com/recibo_cfe_placeholder.jpg',
        cfeReceipt2Front: evidenceReceipt2Front || undefined,
        facade: evidenceFacade || 'https://appdesign.appdesignproyectos.com/fachada_placeholder.jpg',
        installationAreaPhoto: evidenceInstallArea || 'https://appdesign.appdesignproyectos.com/techo_placeholder.jpg'
      },
      payments: [],
      createdDate: new Date().toISOString().split('T')[0],
      createdBy: currentUser?.id || 'partner_user',
      createdByRole: currentUser?.role || 'partner',
      advisorName: currentUser?.fullName || currentUser?.username || 'Partner de Instalaciones',
      advisorPhone: currentUser?.whatsapp || currentUser?.phone || '',
      assignedPartnerId: currentUser?.id,
    };

    if (onAddSolarProject) {
      onAddSolarProject(newProject);
    }

    // Sync client user
    const generatedUsername = formUsername || formName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15);
    const generatedPassword = formPassword || 'Solux2026!';
    const newClientUser = {
      id: `usr_client_${Date.now()}`,
      username: generatedUsername,
      email: formEmail || `${generatedUsername}@soluxgreen.com.mx`,
      password: generatedPassword,
      role: 'client',
      fullName: formName,
      whatsapp: formPhone
    };

    if (onUpdateUsers) {
      onUpdateUsers([newClientUser, ...(users || [])]);
    }

    alert('🚀 ¡Prospecto registrado con éxito por el Partner! Se ha creado su expediente digital.');
    
    // Clear Form
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormMapsUrl('');
    setFormMunicipality('');
    setFormBill('');
    setFormSpace('');
    setFormMeters('');
    setFormWires(2);
    setFormLoads([]);
    setFormUsername('');
    setFormPassword('');
    setEvidenceReceiptFront('');
    setEvidenceReceiptBack('');
    setEvidenceReceipt2Front('');
    setEvidenceFacade('');
    setEvidenceInstallArea('');
    setActiveTab('tareas');
    setSelectedProjectId(newProject.id);
  };

  // Checklist Form States
  const [noShadows, setNoShadows] = useState<boolean>(true);
  const [roofCondition, setRoofCondition] = useState<'buena' | 'regular' | 'mala'>('buena');
  const [wiringDistance, setWiringDistance] = useState<number | string>('');
  const [surveyorNotes, setSurveyorNotes] = useState<string>('');

  // PDF Document simulation upload
  const [uploadedDocUrl, setUploadedDocUrl] = useState<string>('');

  // Signature States
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  // Selected project object
  const activeProject = solarProjects.find(p => p.id === selectedProjectId);

  // Initialize checklist values only when selected project ID changes
  useEffect(() => {
    if (activeProject) {
      setNoShadows(activeProject.siteSurveyData?.noShadows ?? true);
      setRoofCondition(activeProject.siteSurveyData?.roofCondition ?? 'buena');
      setWiringDistance(activeProject.siteSurveyData?.wiringDistance ?? '');
      setSurveyorNotes(activeProject.siteSurveyData?.surveyorNotes ?? '');
      setHasSigned(!!activeProject.siteSurveyData?.clientSignature);
      setUploadedDocUrl(activeProject.evidence?.technicalSurveyDoc || '');
    }
  }, [selectedProjectId]);

  // Canvas drawing functions for signature box
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';

    const coords = getEventCoords(e, canvas);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getEventCoords(e, canvas);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    setHasSigned(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };

  const getEventCoords = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  // Handle survey submission (with offline support - Requirement 1.1)
  const handleSubmitSurvey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;

    let signatureStr = '';
    const canvas = canvasRef.current;
    if (canvas && hasSigned) {
      try {
        signatureStr = canvas.toDataURL('image/png');
      } catch (e) {
        signatureStr = 'data:image/png;base64,simulated_signature';
      }
    } else if (hasSigned) {
      signatureStr = 'data:image/png;base64,simulated_signature';
    }
    
    const updatedSurveyData = {
      siteSurveyPaid: true,
      siteSurveyStatus: 'concluido' as const,
      siteSurveyData: {
        noShadows,
        roofCondition,
        wiringDistance,
        clientSignature: signatureStr || undefined,
        surveyorNotes: surveyorNotes || undefined
      },
      evidence: {
        ...(activeProject?.evidence || {}),
        technicalSurveyDoc: uploadedDocUrl || 'data:application/pdf;base64,dictamen_oficial_solux_green'
      },
      // Advance to technically validated status
      status: 'levantamiento_tecnico'
    };

    if (partnerOfflineMode) {
      // Store survey updates locally to sync later
      const savedOfflineSurveys = JSON.parse(localStorage.getItem('solux_offline_surveys') || '[]');
      savedOfflineSurveys.push({ id: selectedProjectId, data: updatedSurveyData });
      localStorage.setItem('solux_offline_surveys', JSON.stringify(savedOfflineSurveys));
      
      alert(`📲 [Modo Offline - Levantamiento Guardado]\nSe guardó el dictamen técnico localmente para el cliente "${activeProject?.clientName}". Se transmitirá al CRM en cuanto se detecte conexión.`);
    } else {
      onUpdateSolarProject(selectedProjectId, updatedSurveyData);
      alert(`🚀 [Levantamiento Concluido]\nEl dictamen técnico para "${activeProject?.clientName}" ha sido enviado y guardado exitosamente en el expediente del CRM.`);
    }

    // Return to main list
    setSelectedProjectId(null);
  };

  // Sync offline surveys manually if they want to simulate
  const handleSyncOfflineSurveys = () => {
    const offlineSurveys = JSON.parse(localStorage.getItem('solux_offline_surveys') || '[]');
    if (offlineSurveys.length === 0) {
      alert('ℹ️ No hay levantamientos técnicos pendientes por sincronizar en la cola local.');
      return;
    }

    offlineSurveys.forEach((survey: any) => {
      onUpdateSolarProject(survey.id, survey.data);
    });

    localStorage.removeItem('solux_offline_surveys');
    alert(`⚡ ¡Sincronización Exitosa!\nSe han transmitido ${offlineSurveys.length} levantamientos guardados offline al CRM de Solux Green.`);
  };

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
        className="h-8 w-auto object-contain shrink-0 select-none"
        referrerPolicy="no-referrer"
      />
    </button>
  );

  return (
    <div className="flex flex-col lg:flex-row h-screen text-slate-800 font-sans w-full overflow-hidden bg-[#FAFBFC]" id="partner-module-root">
      
      {/* 1. SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-72 bg-slate-900 text-slate-100 p-6 shrink-0 justify-between h-full overflow-y-auto">
        <div className="space-y-8">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-5">
            <SoluxLogo />
            <div>
              <span className="text-sm font-black tracking-tight text-white block">SOLUX GREEN</span>
              <span className="text-[9px] text-[#10B981] font-black tracking-widest uppercase">SOCIO PARTNER</span>
            </div>
          </div>

          {/* Connection simulation in partner panel (Requirement 1.1) */}
          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black tracking-wider uppercase text-slate-400">Modo Conexión</span>
              <span className={`w-2 h-2 rounded-full ${partnerOfflineMode ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></span>
            </div>
            <p className="text-[9px] text-slate-500 font-bold leading-normal">
              {partnerOfflineMode 
                ? 'Simulando loza/techo sin señal móvil. Dictámenes guardados en cola.' 
                : 'Conectado a la red de Solux.'}
            </p>
            <button
              onClick={() => {
                const nextVal = !partnerOfflineMode;
                setPartnerOfflineMode(nextVal);
                localStorage.setItem('solux_offline', String(nextVal));
                if (!nextVal) handleSyncOfflineSurveys();
              }}
              className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-[9px] font-extrabold tracking-wider uppercase"
            >
              {partnerOfflineMode ? '⚡ CONECTARSE' : '🔌 COMPORTARSE OFFLINE'}
            </button>
            
            {partnerOfflineMode && (
              <button
                onClick={handleSyncOfflineSurveys}
                className="w-full py-1.5 bg-amber-600/10 hover:bg-amber-600/20 text-amber-400 rounded-lg text-[8px] font-black uppercase tracking-wider"
              >
                Sincronizar Cola Local
              </button>
            )}
          </div>

          {/* Current User Profile Widget */}
          <div 
            onClick={() => {
              setActiveTab('perfil');
              setSelectedProjectId(null);
            }}
            className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'perfil' 
                ? 'bg-[#10B981]/15 border-[#10B981]/30 text-white shadow-md' 
                : 'bg-slate-800/40 border-slate-700/40 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-700 shrink-0 bg-slate-800">
              <img 
                src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.fullName || 'Socio')}&background=10B981&color=fff&size=80&bold=true`} 
                alt="My profile" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[9px] font-black uppercase text-[#10B981] block tracking-wider font-mono">Sesión Activa</span>
              <span className="text-xs font-black block truncate leading-tight">{currentUser?.fullName || 'Socio Partner'}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <button
              onClick={() => {
                setActiveTab('tareas');
                setSelectedProjectId(null);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'tareas' 
                  ? 'bg-[#10B981] text-white' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Wrench className="w-4.5 h-4.5" />
              <span>Levantamientos de Obra</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('nuevo');
                setSelectedProjectId(null);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'nuevo' 
                  ? 'bg-[#10B981] text-white' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Plus className="w-4.5 h-4.5" />
              <span>Registrar Prospecto</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('promocionales');
                setSelectedProjectId(null);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'promocionales' 
                  ? 'bg-[#10B981] text-white' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Award className="w-4.5 h-4.5 text-emerald-400" />
              <span>Material Promocional</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('perfil');
                setSelectedProjectId(null);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'perfil' 
                  ? 'bg-[#10B981] text-white' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <User className="w-4.5 h-4.5" />
              <span>Mi Perfil</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('notificaciones');
                setSelectedProjectId(null);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer relative ${
                activeTab === 'notificaciones' 
                  ? 'bg-[#10B981] text-white' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Bell className="w-4.5 h-4.5" />
              <span>Notificaciones</span>
              {notifications.filter(n => !n.isRead && (n.role === 'all' || n.role === 'partner')).length > 0 && (
                <span className="absolute right-4 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
              )}
            </button>
          </div>
        </div>

        {onExit && (
          <button
            onClick={onExit}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-red-900/40 text-slate-300 hover:text-red-400 border border-slate-700 rounded-xl text-xs font-extrabold transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Regresar al Inicio</span>
          </button>
        )}
      </aside>

      {/* WORKSPACE AREA */}
      <div className="flex-1 flex flex-col overflow-hidden relative min-w-0">
        
        {/* HEADER */}
        <header className="bg-white border-b border-slate-200 px-3 sm:px-5 py-3 sm:py-4 flex items-center justify-between shrink-0 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="lg:hidden shrink-0"><SoluxLogo /></span>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-black tracking-tight text-slate-900 block uppercase truncate">Partner de Instalaciones</span>
              <span className="text-[8px] text-emerald-600 font-black tracking-widest uppercase block mt-0.5">DASHBOARD</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className={`flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border text-[9px] font-black uppercase shrink-0 ${
              partnerOfflineMode 
                ? 'bg-amber-50 text-amber-700 border-amber-100' 
                : 'bg-emerald-50 text-emerald-700 border-emerald-100'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${partnerOfflineMode ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`}></span>
              <span className="hidden xs:inline sm:inline">{partnerOfflineMode ? 'Modo Offline' : 'Online'}</span>
            </div>

            <NotificationsBell
              notifications={notifications}
              role="partner"
              currentUser={currentUser}
              onMarkAsRead={onMarkNotificationAsRead}
              onMarkAllAsRead={onMarkAllNotificationsAsRead}
              onViewAll={() => {
                setActiveTab('notificaciones');
                setSelectedProjectId(null);
              }}
            />

            <div className="flex items-center gap-1.5 sm:gap-2 border-l border-slate-200 pl-2 sm:pl-3 ml-0.5 sm:ml-1 shrink-0">
              <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                <img 
                  src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.fullName || 'Socio')}&background=10B981&color=fff&size=80&bold=true`} 
                  alt="Perfil" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-[10px] font-black text-slate-800 truncate max-w-[60px] sm:max-w-[150px] uppercase tracking-tight hidden sm:inline">{currentUser?.fullName || 'Socio Partner'}</span>
            </div>
          </div>
        </header>

        {/* WORKSPACE CONTENT */}
        <main className="flex-1 overflow-y-auto px-4 md:px-6 py-6 pb-24 lg:pb-6" id="partner-main-viewport">
          <AnimatePresence mode="wait">
            {activeTab === 'promocionales' ? (
              <PromotionalMaterialsModule 
                currentUser={currentUser}
                solarProjects={solarProjects}
                isOfflineMode={partnerOfflineMode}
              />
            ) : activeTab === 'perfil' ? (
              <UserProfileModule 
                currentUser={currentUser} 
                onUpdateProfile={onUpdateProfile} 
                isOfflineMode={partnerOfflineMode}
              />
            ) : activeTab === 'notificaciones' ? (
              <NotificationsModule
                notifications={notifications}
                role="partner"
                currentUser={currentUser}
                onMarkAsRead={onMarkNotificationAsRead}
                onMarkAllAsRead={onMarkAllNotificationsAsRead}
                onClearAllNotifications={onClearAllNotifications}
                onDeleteNotification={onDeleteNotification}
              />
            ) : activeTab === 'nuevo' ? (
              <motion.div
                key="new-prospect-form"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white border border-slate-200 rounded-3xl p-5 md:p-8 shadow-xs max-w-4xl mx-auto space-y-6"
              >
                <div>
                  <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Nuevo Expediente de Prospecto Solar</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Completa la ficha técnica y carga la evidencia multimedia del cliente</p>
                </div>

                <form onSubmit={handleCreateProspect} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                    {/* Name */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Nombre del Cliente *</label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={e => setFormName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                        placeholder="Ej. Roberto Sánchez Ruiz"
                      />
                    </div>

                    {/* Phone */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Teléfono Celular (WhatsApp) *</label>
                      <input
                        type="tel"
                        required
                        value={formPhone}
                        onChange={e => setFormPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                        placeholder="Ej. 5589123456"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Correo Electrónico *</label>
                      <input
                        type="email"
                        required
                        value={formEmail}
                        onChange={e => setFormEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                        placeholder="Ej. roberto.s@gmail.com"
                      />
                    </div>

                    {/* Google Maps link */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Enlace de Ubicación Google Maps</label>
                      <input
                        type="url"
                        value={formMapsUrl}
                        onChange={e => setFormMapsUrl(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                        placeholder="Ej. https://maps.google.com/?q=..."
                      />
                    </div>

                    {/* City/Municipality */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Municipio y Estado *</label>
                      <input
                        type="text"
                        required
                        value={formMunicipality}
                        onChange={e => setFormMunicipality(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                        placeholder="Ej. Querétaro, Qro."
                      />
                    </div>

                    {/* Average Bill */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Monto de Pago Recibo CFE Promedio ($ MXN)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={formBill}
                        onChange={e => setFormBill(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 [appearance:textfield]"
                        placeholder="Ej. 3500"
                      />
                    </div>

                    {/* Espacio Disponible */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Espacio Disponible en Techo (m²)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formSpace}
                        onChange={e => setFormSpace(e.target.value.replace(/[^0-9.]/g, ''))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 [appearance:textfield]"
                        placeholder="Ej. 40"
                      />
                    </div>

                    {/* Número de Medidores */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Número de Medidores CFE</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={formMeters}
                        onChange={e => setFormMeters(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 [appearance:textfield]"
                        placeholder="Ej. 1"
                      />
                    </div>

                    {/* Estatus Servicio CFE */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Estatus de Servicio CFE</label>
                      <select
                        value={formCFE}
                        onChange={e => setFormCFE(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                      >
                        <option value="activo_sin_adeudo">Activo sin Adeudo</option>
                        <option value="con_adeudo">Con Adeudo</option>
                        <option value="inactivo">Inactivo</option>
                      </select>
                    </div>

                    {/* Propiedad */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Tipo de Propiedad</label>
                      <select
                        value={formOwnership}
                        onChange={e => setFormOwnership(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                      >
                        <option value="propietario">Propietario Legal</option>
                        <option value="arrendatario_autorizado">Arrendatario Autorizado</option>
                      </select>
                    </div>

                    {/* Método Pago deseado */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Método de Pago Preferido</label>
                      <select
                        value={formPayMethod}
                        onChange={e => setFormPayMethod(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                      >
                        <option value="directo">Compra Directa de Contado</option>
                        <option value="financiamiento_solux">Financiamiento Directo Solux</option>
                        <option value="infonavit_verde">Hipoteca Verde / Infonavit</option>
                        <option value="suscripcion_solar">Suscripción Solar PPA</option>
                      </select>
                    </div>

                    {/* Hilos Acometida */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Tipo de Acometida (Fases / Hilos)</label>
                      <select
                        value={formWires}
                        onChange={e => setFormWires(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                      >
                        <option value={2}>Monofásica (2 Hilos - 127V)</option>
                        <option value={3}>Bifásica (3 Hilos - 220V)</option>
                        <option value={4}>Trifásica (4 Hilos - 220V/380V)</option>
                      </select>
                    </div>
                  </div>

                  {/* Cargas Eléctricas Pesadas */}
                  <div className="space-y-2 text-xs">
                    <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Cargas Eléctricas de Alto Consumo Detectadas</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {['Aire Acondicionado 220V', 'Bomba de Agua grande', 'Horno Eléctrico', 'Cargador de Auto Eléctrico'].map(load => (
                        <label key={load} className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl font-bold cursor-pointer hover:bg-slate-100/50 transition-all text-slate-700">
                          <input
                            type="checkbox"
                            checked={formLoads.includes(load)}
                            onChange={() => {
                              if (formLoads.includes(load)) {
                                setFormLoads(formLoads.filter(l => l !== load));
                              } else {
                                setFormLoads([...formLoads, load]);
                              }
                            }}
                            className="rounded text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                          />
                          <span>{load}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Multimedia Evidence section with file and mobile camera take capabilities */}
                  <div className="space-y-3.5 border-t pt-5">
                    <div>
                      <h3 className="text-[10px] font-black uppercase text-slate-900 tracking-wider">Evidencia del Sitio (Recibos y Fotos)</h3>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Carga imágenes o utiliza la cámara de tu dispositivo en tiempo real</p>
                    </div>

                    {/* Hidden inputs */}
                    <input
                      type="file"
                      id="partner-file-front"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleEvidenceFileChange(e, setEvidenceReceiptFront)}
                    />
                    <input
                      type="file"
                      id="partner-camera-front"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => handleEvidenceFileChange(e, setEvidenceReceiptFront)}
                    />

                    <input
                      type="file"
                      id="partner-file-back"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleEvidenceFileChange(e, setEvidenceReceiptBack)}
                    />
                    <input
                      type="file"
                      id="partner-camera-back"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => handleEvidenceFileChange(e, setEvidenceReceiptBack)}
                    />

                    <input
                      type="file"
                      id="partner-file-facade"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleEvidenceFileChange(e, setEvidenceFacade)}
                    />
                    <input
                      type="file"
                      id="partner-camera-facade"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => handleEvidenceFileChange(e, setEvidenceFacade)}
                    />

                    <input
                      type="file"
                      id="partner-file-area"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleEvidenceFileChange(e, setEvidenceInstallArea)}
                    />
                    <input
                      type="file"
                      id="partner-camera-area"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => handleEvidenceFileChange(e, setEvidenceInstallArea)}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center text-xs">
                      {/* CFE Front */}
                      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between h-44">
                        <span className="text-[8px] font-extrabold uppercase text-slate-400">Recibo CFE Frente *</span>
                        {evidenceReceiptFront ? (
                          <div className="relative h-24 w-full border rounded-xl overflow-hidden bg-slate-100 flex flex-col items-center justify-center">
                            <img src={evidenceReceiptFront} alt="Frente CFE" className="w-full h-full object-cover" />
                            <button 
                              type="button" 
                              onClick={() => setEvidenceReceiptFront('')}
                              className="absolute bottom-1 right-1 bg-rose-600 text-white text-[8px] font-black uppercase px-2 py-1 rounded-md hover:bg-rose-700 shadow transition-all"
                            >
                              Eliminar
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <button
                              type="button"
                              onClick={() => document.getElementById('partner-file-front')?.click()}
                              className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[9px] uppercase tracking-wider flex items-center justify-center gap-1.5"
                            >
                              <Upload className="w-3 h-3 text-slate-500" /> Subir Archivo
                            </button>
                            <button
                              type="button"
                              onClick={() => document.getElementById('partner-camera-front')?.click()}
                              className="py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold text-[9px] uppercase tracking-wider flex items-center justify-center gap-1.5 border border-emerald-100"
                            >
                              <Camera className="w-3 h-3 text-emerald-500" /> Tomar Foto
                            </button>
                          </div>
                        )}
                      </div>

                      {/* CFE Back */}
                      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between h-44">
                        <span className="text-[8px] font-extrabold uppercase text-slate-400">Recibo CFE Reverso *</span>
                        {evidenceReceiptBack ? (
                          <div className="relative h-24 w-full border rounded-xl overflow-hidden bg-slate-100 flex flex-col items-center justify-center">
                            <img src={evidenceReceiptBack} alt="Reverso CFE" className="w-full h-full object-cover" />
                            <button 
                              type="button" 
                              onClick={() => setEvidenceReceiptBack('')}
                              className="absolute bottom-1 right-1 bg-rose-600 text-white text-[8px] font-black uppercase px-2 py-1 rounded-md hover:bg-rose-700 shadow transition-all"
                            >
                              Eliminar
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <button
                              type="button"
                              onClick={() => document.getElementById('partner-file-back')?.click()}
                              className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[9px] uppercase tracking-wider flex items-center justify-center gap-1.5"
                            >
                              <Upload className="w-3 h-3 text-slate-500" /> Subir Archivo
                            </button>
                            <button
                              type="button"
                              onClick={() => document.getElementById('partner-camera-back')?.click()}
                              className="py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold text-[9px] uppercase tracking-wider flex items-center justify-center gap-1.5 border border-emerald-100"
                            >
                              <Camera className="w-3 h-3 text-emerald-500" /> Tomar Foto
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Facade */}
                      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between h-44">
                        <span className="text-[8px] font-extrabold uppercase text-slate-400">Fachada del Inmueble *</span>
                        {evidenceFacade ? (
                          <div className="relative h-24 w-full border rounded-xl overflow-hidden bg-slate-100 flex flex-col items-center justify-center">
                            <img src={evidenceFacade} alt="Fachada" className="w-full h-full object-cover" />
                            <button 
                              type="button" 
                              onClick={() => setEvidenceFacade('')}
                              className="absolute bottom-1 right-1 bg-rose-600 text-white text-[8px] font-black uppercase px-2 py-1 rounded-md hover:bg-rose-700 shadow transition-all"
                            >
                              Eliminar
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <button
                              type="button"
                              onClick={() => document.getElementById('partner-file-facade')?.click()}
                              className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[9px] uppercase tracking-wider flex items-center justify-center gap-1.5"
                            >
                              <Upload className="w-3 h-3 text-slate-500" /> Subir Archivo
                            </button>
                            <button
                              type="button"
                              onClick={() => document.getElementById('partner-camera-facade')?.click()}
                              className="py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold text-[9px] uppercase tracking-wider flex items-center justify-center gap-1.5 border border-emerald-100"
                            >
                              <Camera className="w-3 h-3 text-emerald-500" /> Tomar Foto
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Installation Area */}
                      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between h-44">
                        <span className="text-[8px] font-extrabold uppercase text-slate-400">Área de Instalación (Techo) *</span>
                        {evidenceInstallArea ? (
                          <div className="relative h-24 w-full border rounded-xl overflow-hidden bg-slate-100 flex flex-col items-center justify-center">
                            <img src={evidenceInstallArea} alt="Techo" className="w-full h-full object-cover" />
                            <button 
                              type="button" 
                              onClick={() => setEvidenceInstallArea('')}
                              className="absolute bottom-1 right-1 bg-rose-600 text-white text-[8px] font-black uppercase px-2 py-1 rounded-md hover:bg-rose-700 shadow transition-all"
                            >
                              Eliminar
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <button
                              type="button"
                              onClick={() => document.getElementById('partner-file-area')?.click()}
                              className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[9px] uppercase tracking-wider flex items-center justify-center gap-1.5"
                            >
                              <Upload className="w-3 h-3 text-slate-500" /> Subir Archivo
                            </button>
                            <button
                              type="button"
                              onClick={() => document.getElementById('partner-camera-area')?.click()}
                              className="py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold text-[9px] uppercase tracking-wider flex items-center justify-center gap-1.5 border border-emerald-100"
                            >
                              <Camera className="w-3 h-3 text-emerald-500" /> Tomar Foto
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Acceso Cliente Portal section */}
                  <div className="space-y-3 border-t pt-5 text-xs">
                    <div>
                      <h3 className="text-[10px] font-black uppercase text-slate-900 tracking-wider">Credenciales de Acceso para el Cliente</h3>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Credenciales para que el cliente final acceda a su portal de seguimiento</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Nombre de Usuario (Opcional - Autogenerado si vacío)</label>
                        <input
                          type="text"
                          value={formUsername}
                          onChange={e => setFormUsername(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                          placeholder="Ej. robertosanchez"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Contraseña de Acceso (Por defecto: Solux2026!)</label>
                        <input
                          type="text"
                          value={formPassword}
                          onChange={e => setFormPassword(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                          placeholder="Ej. SOLUX2026"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      className="px-6 py-3 bg-slate-900 hover:bg-[#10B981] hover:text-white text-[#10B981] font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-md flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Registrar Prospecto Solar
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : !selectedProjectId ? (
              /* TAB 1: LIST OF ASSIGNED PROJECTS FOR SURVEYS */
              <motion.div
                key="list-surveys"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-base font-black uppercase text-slate-900">Visitas Técnicas y Levantamientos Programados</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Completa los checklist de viabilidad en sitio y recopila la firma del cliente</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
                    <button
                      onClick={exportSurveysToPDF}
                      className="px-2.5 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-1 shrink-0"
                    >
                      📄 PDF
                    </button>
                    <button
                      onClick={exportSurveysToExcel}
                      className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-1 shrink-0"
                    >
                      📊 Excel
                    </button>

                    <select
                      value={surveyStatusFilter}
                      onChange={e => setSurveyStatusFilter(e.target.value as any)}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                    >
                      <option value="todos">Todos los Estatus de Visita</option>
                      <option value="pendiente">Pendientes</option>
                      <option value="en_proceso">En Proceso</option>
                      <option value="concluido">Concluidos</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getFilteredSurveys().map((proj, idx) => (
                    <div 
                      key={`survey_proj_${proj.id || 'p'}_${idx}`}
                      className="bg-white border border-slate-200/80 hover:border-teal-400 rounded-3xl p-5 shadow-xs space-y-4 hover:shadow-md transition-all relative overflow-hidden"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-900">{proj.clientName}</h3>
                          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{proj.clientPhone}</span>
                        </div>
                        <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          proj.siteSurveyStatus === 'concluido' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {proj.siteSurveyStatus === 'concluido' ? 'REALIZADO' : 'PENDIENTE'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{proj.municipalityState}</span>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border text-[10px] font-mono">
                        <div className="flex justify-between">
                          <span className="font-sans text-slate-400 block text-[8px] uppercase">Paneles Calculados</span>
                          <span className="font-extrabold text-slate-700">{proj.estimatedPanels} pzas</span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="font-sans text-slate-400 block text-[8px] uppercase">Acometida Hilos</span>
                          <span className="font-extrabold text-slate-700">{proj.wiresCount || 2} Hilos</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedProjectId(proj.id)}
                        className="w-full py-2 bg-slate-900 hover:bg-teal-600 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all"
                      >
                        {proj.siteSurveyStatus === 'concluido' ? 'Ver/Editar Diagnóstico' : 'Realizar Diagnóstico Físico'}
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              /* TAB 2: DETAILED INTERACTIVE CHECKLIST ASSESSMENT & SIGNATURE (Requirement 3.2, 8) */
              <motion.div
                key="assessment-form"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white border border-slate-200 rounded-3xl p-5 md:p-8 shadow-xs max-w-3xl mx-auto space-y-6"
              >
                <div className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => setSelectedProjectId(null)}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                      <h2 className="text-sm font-black uppercase text-slate-950">Ficha de Levantamiento Técnico</h2>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Cliente: {activeProject?.clientName}</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400">ID: {activeProject?.id}</span>
                </div>

                <form onSubmit={handleSubmitSurvey} className="space-y-6 text-xs">
                  
                  {/* Checklist viability fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    {/* Shadows */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Ausencia de Sombras Obstructoras</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setNoShadows(true)}
                          className={`flex-1 py-2 rounded-xl font-bold border transition-all ${noShadows ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-white border-slate-200 text-slate-500'}`}
                        >
                          SÍ (Luz Directa Garantizada)
                        </button>
                        <button
                          type="button"
                          onClick={() => setNoShadows(false)}
                          className={`flex-1 py-2 rounded-xl font-bold border transition-all ${!noShadows ? 'bg-rose-50 border-rose-300 text-rose-800' : 'bg-white border-slate-200 text-slate-500'}`}
                        >
                          NO (Presencia de Sombras/Árboles)
                        </button>
                      </div>
                    </div>

                    {/* Roof Condition */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Condición de la Loza / Piso</label>
                      <select
                        value={roofCondition}
                        onChange={e => setRoofCondition(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                      >
                        <option value="buena">Buena (Sin humedad, losa firme)</option>
                        <option value="regular">Regular (Requiere impermeabilizar)</option>
                        <option value="mala">Mala (Deteriorada, no viable colocar peso)</option>
                      </select>
                    </div>

                    {/* Wiring distance */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Distancia al Medidor CFE (Metros)</label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={wiringDistance || ''}
                          onChange={e => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setWiringDistance(val === '' ? 0 : Number(val));
                          }}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold [appearance:textfield]"
                          placeholder="Ej. 12"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">metros</span>
                      </div>
                    </div>

                    {/* Technical PDF Upload simulation (Requirement 8) */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Documento de Levantamiento Técnico Formal</label>
                      {uploadedDocUrl ? (
                        <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold text-xs">
                          <span>📄 Levantamiento_Firmado.pdf</span>
                          <button
                            type="button"
                            onClick={() => setUploadedDocUrl('')}
                            className="text-rose-500 hover:underline cursor-pointer text-xs"
                          >
                            Eliminar
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <label className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 rounded-xl border-slate-200 border border-dashed font-bold flex items-center justify-center gap-1.5 cursor-pointer text-xs text-slate-600">
                            <Upload className="w-4 h-4 text-slate-400" />
                            <span>Subir Archivo PDF/Img</span>
                            <input
                              type="file"
                              accept=".pdf,image/*"
                              className="hidden"
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    setUploadedDocUrl(reader.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setUploadedDocUrl('data:application/pdf;base64,dictamen_oficial_solux_green')}
                            className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold cursor-pointer"
                            title="Generar Dictamen Automático"
                          >
                            Auto-generar
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Surveyor notes */}
                    <div className="space-y-1 col-span-1 md:col-span-2">
                      <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Notas de campo y Observaciones de Obra</label>
                      <textarea
                        value={surveyorNotes}
                        onChange={e => setSurveyorNotes(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold min-h-[60px]"
                        placeholder="Registra detalles de herrería, bajadas de cableado o requerimientos especiales..."
                      />
                    </div>
                  </div>

                  {/* Customer Signature Box (Requirement 3.2) */}
                  <div className="border-t pt-5 space-y-2.5">
                    <label className="text-[10px] font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                      <PenTool className="w-3.5 h-3.5 text-slate-500" />
                      Firma Digital de Autorización del Cliente *
                    </label>
                    <p className="text-[10px] text-slate-500 leading-normal mb-2">
                      El cliente debe firmar directamente sobre la pantalla para autorizar el dictamen de viabilidad física del proyecto.
                    </p>

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2 max-w-sm">
                      <canvas
                        ref={canvasRef}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full h-36 bg-white border border-slate-100 rounded-xl cursor-crosshair touch-none"
                      />
                      <div className="flex justify-between items-center mt-2 px-1">
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                          {hasSigned ? '✏️ Firma registrada' : 'Firmar aquí'}
                        </span>
                        <button
                          type="button"
                          onClick={clearCanvas}
                          className="text-[9px] text-rose-500 hover:underline font-extrabold uppercase"
                        >
                          Limpiar firma
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Submit buttons */}
                  <button
                    type="submit"
                    className="w-full py-3 bg-slate-900 hover:bg-teal-600 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    {partnerOfflineMode ? '💾 GUARDAR EN DICTAMEN LOCAL (OFFLINE)' : '🚀 COMPLETAR LEVANTAMIENTO Y ENVIAR AL CRM'}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* 2. BOTTOM NAVIGATION BAR - TABLET AND MOBILE */}
        <nav className="lg:hidden bg-slate-900 border-t border-slate-800 px-3 py-2.5 flex items-center justify-around shrink-0 relative z-20 shadow-lg">
          <button
            onClick={() => {
              setActiveTab('tareas');
              setSelectedProjectId(null);
            }}
            className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-all cursor-pointer ${activeTab === 'tareas' ? 'text-[#10B981]' : 'text-slate-400'}`}
          >
            <Wrench className="w-5 h-5" />
            <span className="text-[8px] font-extrabold uppercase tracking-wider">Levantamientos</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('nuevo');
              setSelectedProjectId(null);
            }}
            className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-all cursor-pointer ${activeTab === 'nuevo' ? 'text-[#10B981]' : 'text-slate-400'}`}
          >
            <Plus className="w-5 h-5" />
            <span className="text-[8px] font-extrabold uppercase tracking-wider">Registrar</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('promocionales');
              setSelectedProjectId(null);
            }}
            className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-all cursor-pointer ${activeTab === 'promocionales' ? 'text-[#10B981]' : 'text-slate-400'}`}
          >
            <Award className="w-5 h-5" />
            <span className="text-[8px] font-extrabold uppercase tracking-wider">Material</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('perfil');
              setSelectedProjectId(null);
            }}
            className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-all cursor-pointer ${activeTab === 'perfil' ? 'text-[#10B981]' : 'text-slate-400'}`}
          >
            <User className="w-5 h-5" />
            <span className="text-[8px] font-extrabold uppercase tracking-wider">Perfil</span>
          </button>

          {onExit && (
            <button
              onClick={onExit}
              className="flex flex-col items-center gap-1 p-1 rounded-xl text-rose-500"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-[8px] font-extrabold uppercase tracking-wider">Salir</span>
            </button>
          )}
        </nav>
      </div>
    </div>
  );
}
