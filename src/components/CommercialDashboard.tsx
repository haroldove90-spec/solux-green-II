import React, { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Plus, 
  Briefcase, 
  Clock, 
  CheckCircle, 
  Search, 
  Percent, 
  Filter,
  AlertTriangle, 
  FileText, 
  Upload, 
  MapPin, 
  Check,
  Sparkles, 
  Eye, 
  Download, 
  Info, 
  ChevronRight, 
  FileCheck,
  Phone,
  Mail,
  Share2,
  Trash2,
  Image,
  ArrowLeft,
  Calendar,
  Layers,
  Award,
  Video,
  LogOut,
  X,
  User,
  Camera,
  PenTool,
  Zap,
  Send,
  Key,
  Lock,
  Copy,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  Handshake,
  CreditCard,
  Save,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import html2pdf from 'html2pdf.js';
import { SolarProject, AppNotification, PromotionalMaterial } from '../types';
import { SOLUX_LOGO_URL, SOLUX_LOGO_FALLBACK } from '../logoConfig';
import { fetchPromotionalMaterials, upsertPromotionalMaterial, deletePromotionalMaterial } from '../supabaseService';
import UserProfileModule from './UserProfileModule';
import { NotificationsBell } from './NotificationsBell';
import NotificationsModule from './NotificationsModule';
import PromotionalMaterialsModule from './PromotionalMaterialsModule';
import EnlaceAdvisorsModule from './EnlaceAdvisorsModule';
import { Bell } from 'lucide-react';
import { findMatchingClientUser, getClientCredentials } from '../clientMatcher';
import { generateSystemFlowPDF } from '../systemFlowPdf';
import { exportProjectDossierPDF, exportProjectDossierImage, exportProjectsListPDF, downloadOrViewTechnicalSurvey } from '../pdfUtils';
import { 
  ACTIVE_PAYMENT_METHODS, 
  calculateSoluxFinancing, 
  formatPaymentMethod, 
  buildWhatsAppFinancialSummary,
  getPaymentMethodOptions 
} from '../financingUtils';
import { formatWhatsAppPhone } from '../phoneUtils';

interface CommercialDashboardProps {
  solarProjects: SolarProject[];
  onAddSolarProject: (project: SolarProject) => void;
  onUpdateSolarProject: (id: string, updated: Partial<SolarProject>) => void;
  onUpdateUsers?: (users: any[]) => void;
  onExit: () => void;
  soluxConfig: {
    panelBasePrice: number;
    monthlyInterestRate: number;
    siteSurveyCost: number;
    defaultDownPaymentPercent?: number;
    financingTermMonths?: number[];
    contadoDiscountPercent?: number;
    financingTerms?: any[];
  };
  isOfflineMode: boolean;
  onToggleOfflineMode: () => void;
  users: any[];
  currentUser: any;
  onUpdateProfile: (updatedUser: any) => void;

  // Notification system additions
  notifications: AppNotification[];
  onMarkNotificationAsRead: (id: string) => void;
  onMarkAllNotificationsAsRead: () => void;
  onClearAllNotifications?: () => void;
  onDeleteNotification?: (id: string) => void;
  onDeleteSolarProject?: (id: string) => void;
  onTriggerNotification?: (
    title: string,
    message: string,
    role: 'admin' | 'comercial' | 'enlace' | 'partner' | 'client' | 'all',
    userId?: string
  ) => Promise<void> | void;
}

export default function CommercialDashboard({
  solarProjects,
  onAddSolarProject,
  onUpdateSolarProject,
  onUpdateUsers,
  onExit,
  soluxConfig,
  isOfflineMode,
  onToggleOfflineMode,
  users,
  currentUser,
  onUpdateProfile,

  notifications,
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  onClearAllNotifications,
  onDeleteNotification,
  onDeleteSolarProject,
  onTriggerNotification
}: CommercialDashboardProps) {
  const isRealImage = (url?: string) => {
    return !!url && url.trim() !== '' && !url.includes('placeholder') && !url.includes('PLACEHOLDER') && (url.startsWith('http') || url.startsWith('data:'));
  };

  const [activeTab, setActiveTab] = useState<'pipeline' | 'nuevo' | 'cotizador' | 'recomendar' | 'enlaces' | 'promocionales' | 'perfil' | 'notificaciones'>(() => {
    const saved = localStorage.getItem('solux_commercial_active_tab');
    return (saved as any) || 'pipeline';
  });

  useEffect(() => {
    localStorage.setItem('solux_commercial_active_tab', activeTab);
  }, [activeTab]);
  const [selectedProject, setSelectedProject] = useState<SolarProject | null>(null);
  
  // Zoom / lightbox states for evidence images
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [zoomedTitle, setZoomedTitle] = useState('');
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');

  // --- Cotizador Exprés States (Requirement 2.3) ---
  const [calcBill, setCalcBill] = useState<number | string>(0);
  const [calcSpace, setCalcSpace] = useState<number | string>('');
  const [calcOwnership, setCalcOwnership] = useState<'propietario' | 'arrendatario_autorizado'>('propietario');
  const [calcCFEStatus, setCalcCFEStatus] = useState<'activo_sin_adeudo' | 'con_adeudo' | 'inactivo'>('activo_sin_adeudo');
  
  // Signature pad states for Cotizador Exprés
  const [expressSignature, setExpressSignature] = useState<string | null>(null);
  const [isExpressSigning, setIsExpressSigning] = useState(false);
  const [isDrawingExpress, setIsDrawingExpress] = useState(false);
  const expressCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const startDrawingExpress = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawingExpress(true);
    const canvas = expressCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const drawExpress = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingExpress) return;
    const canvas = expressCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#022c22';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawingExpress = () => {
    setIsDrawingExpress(false);
  };

  const clearExpressCanvas = () => {
    const canvas = expressCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const saveExpressSignature = () => {
    const canvas = expressCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setExpressSignature(dataUrl);
    setIsExpressSigning(false);
    triggerNotification('✍️ ¡Firma guardada correctamente en la cotización exprés!');
  };
  
  // Financing simulation fields
  const [calcPayMethod, setCalcPayMethod] = useState<string>('contado');
  const [calcMonths, setCalcMonths] = useState<number>(3); // 3 meses default
  const [calcDownPaymentPercent, setCalcDownPaymentPercent] = useState<number | string>(() => {
    return Number(soluxConfig?.defaultDownPaymentPercent) || 50;
  });
  const isDownPaymentDirtyRef = useRef(false);

  useEffect(() => {
    if (soluxConfig?.defaultDownPaymentPercent !== undefined && String(soluxConfig.defaultDownPaymentPercent) !== '' && !isDownPaymentDirtyRef.current) {
      setCalcDownPaymentPercent(Number(soluxConfig.defaultDownPaymentPercent) || 50);
    }
  }, [soluxConfig?.defaultDownPaymentPercent]);

  // Proposed Client link & editable info for simulator
  const [selectedSimulationClientId, setSelectedSimulationClientId] = useState<string>('');
  const [calcClientName, setCalcClientName] = useState<string>('');
  const [calcClientPhone, setCalcClientPhone] = useState<string>('');
  const [calcClientCity, setCalcClientCity] = useState<string>('');

  // States for Recomendar a Enlace module
  const [recEnlaceId, setRecEnlaceId] = useState<string>('');
  const [recClientName, setRecClientName] = useState<string>('');
  const [recClientPhone, setRecClientPhone] = useState<string>('');
  const [recClientCity, setRecClientCity] = useState<string>('');
  const [recClientBill, setRecClientBill] = useState<string>('');
  const [recNotes, setRecNotes] = useState<string>('');
  const [recMode, setRecMode] = useState<'new' | 'existing'>('new');
  const [recExistingProjectId, setRecExistingProjectId] = useState<string>('');
  const [recSuccessModal, setRecSuccessModal] = useState<{
    clientName: string;
    enlaceName: string;
    enlacePhone: string;
    projectId: string;
    project: SolarProject;
    matchedUser?: any;
  } | null>(null);

  // Filter solarProjects so that each role only sees their own registered or assigned prospects (Admin sees all)
  const userSolarProjects = React.useMemo(() => {
    if (currentUser?.role === 'admin') return solarProjects;
    return solarProjects.filter(p => {
      const isCreator = p.createdBy === currentUser?.id || 
                        p.createdBy === currentUser?.username || 
                        p.createdBy === currentUser?.fullName;
      const isAdvisor = (p.advisorName && currentUser?.fullName && p.advisorName.toLowerCase() === currentUser.fullName.toLowerCase()) || 
                        (p.advisorName && currentUser?.username && p.advisorName.toLowerCase() === currentUser.username.toLowerCase());
      const isAssigned = p.assignedCommercialId === currentUser?.id;
      return isCreator || isAdvisor || isAssigned;
    });
  }, [solarProjects, currentUser]);

  // States for Quick Prospect Registration Modal (from calculator)
  const [isQuickProspectOpen, setIsQuickProspectOpen] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');
  const [quickEmail, setQuickEmail] = useState('');
  const [quickMunicipality, setQuickMunicipality] = useState('');
  const [quickBill, setQuickBill] = useState('');

  // --- Levantamiento Técnico Modal States for Asesor Verde ---
  const [surveyModalProject, setSurveyModalProject] = useState<SolarProject | null>(null);
  const [surveyNoShadows, setSurveyNoShadows] = useState(true);
  const [surveyRoofCondition, setSurveyRoofCondition] = useState<'buena' | 'regular' | 'mala'>('buena');
  const [surveyWiringDistance, setSurveyWiringDistance] = useState<number | string>('');
  const [surveyNotes, setSurveyNotes] = useState('');
  const [surveyUploadedDocUrl, setSurveyUploadedDocUrl] = useState('');
  const [surveyUploadedDocName, setSurveyUploadedDocName] = useState('');
  const [surveyHasSigned, setSurveyHasSigned] = useState(false);
  const [isDrawingSurvey, setIsDrawingSurvey] = useState(false);
  const surveyCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleOpenSurveyModal = (proj: SolarProject) => {
    setSurveyModalProject(proj);
    setSurveyNoShadows(proj.siteSurveyData?.noShadows ?? true);
    setSurveyRoofCondition(proj.siteSurveyData?.roofCondition ?? 'buena');
    setSurveyWiringDistance(proj.siteSurveyData?.wiringDistance ?? '');
    setSurveyNotes(proj.siteSurveyData?.surveyorNotes ?? '');
    setSurveyHasSigned(!!proj.siteSurveyData?.clientSignature);
    setSurveyUploadedDocUrl(proj.evidence?.technicalSurveyDoc || '');
    setSurveyUploadedDocName(proj.evidence?.technicalSurveyDoc ? 'Levantamiento_Firmado_Oficial.pdf' : '');
  };

  const startDrawingSurvey = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawingSurvey(true);
    const canvas = surveyCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const drawSurvey = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingSurvey) return;
    const canvas = surveyCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#022c22';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    setSurveyHasSigned(true);
  };

  const stopDrawingSurvey = () => {
    setIsDrawingSurvey(false);
  };

  const clearSurveyCanvas = () => {
    const canvas = surveyCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setSurveyHasSigned(false);
  };

  const handleSurveyFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        alert('⚠️ El archivo no debe superar los 15MB.');
        return;
      }
      setSurveyUploadedDocName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSurveyUploadedDocUrl(reader.result as string);
        triggerNotification('📄 Archivo de levantamiento técnico cargado con éxito');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSimulateSurveyPDF = () => {
    setSurveyUploadedDocUrl('data:application/pdf;base64,dictamen_oficial_solux_green');
    setSurveyUploadedDocName('Dictamen_Tecnico_Levantamiento_Firmado.pdf');
    triggerNotification('🚀 ¡Dictamen Técnico Oficial preparado y adjuntado!');
  };

  const handleSaveSurvey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!surveyModalProject) return;

    let signatureStr = '';
    const canvas = surveyCanvasRef.current;
    if (canvas && surveyHasSigned) {
      try {
        signatureStr = canvas.toDataURL('image/png');
      } catch (e) {
        signatureStr = 'data:image/png;base64,simulated_signature';
      }
    } else if (surveyModalProject.siteSurveyData?.clientSignature) {
      signatureStr = surveyModalProject.siteSurveyData.clientSignature;
    }

    const updatedSurveyData: Partial<SolarProject> = {
      siteSurveyPaid: true,
      siteSurveyStatus: 'concluido' as const,
      siteSurveyData: {
        noShadows: surveyNoShadows,
        roofCondition: surveyRoofCondition,
        wiringDistance: surveyWiringDistance,
        clientSignature: signatureStr || undefined,
        surveyorNotes: surveyNotes || undefined
      },
      evidence: {
        ...(surveyModalProject.evidence || {}),
        technicalSurveyDoc: surveyUploadedDocUrl || 'data:application/pdf;base64,dictamen_oficial_solux_green'
      },
      status: 'levantamiento_tecnico'
    };

    onUpdateSolarProject(surveyModalProject.id, updatedSurveyData);
    triggerNotification(`🚀 ¡Dictamen técnico para "${surveyModalProject.clientName}" guardado en el CRM!`);
    alert(`🚀 [Levantamiento Concluido]\nEl dictamen técnico y el documento PDF para "${surveyModalProject.clientName}" han sido enviados y guardados exitosamente en el expediente del CRM.`);

    // If selectedProject is open, update it
    if (selectedProject && selectedProject.id === surveyModalProject.id) {
      setSelectedProject(prev => prev ? ({ ...prev, ...updatedSurveyData } as SolarProject) : null);
    }

    setSurveyModalProject(null);
  };

  // --- Promotional Materials States (Requirement 4.2 & Custom CRM Upload) ---
  const [promotionalMaterials, setPromotionalMaterials] = useState<PromotionalMaterial[]>([]);
  const [loadingPromo, setLoadingPromo] = useState(false);
  const [showAddPromoForm, setShowAddPromoForm] = useState(false);
  const [newPromoTitle, setNewPromoTitle] = useState('');
  const [newPromoCategory, setNewPromoCategory] = useState<'folleto' | 'ficha_tecnica' | 'redes'>('folleto');
  const [newPromoDescription, setNewPromoDescription] = useState('');
  const [newPromoFileBase64, setNewPromoFileBase64] = useState('');
  const [newPromoFileName, setNewPromoFileName] = useState('');
  const [uploadProgress, setUploadProgress] = useState(false);

  // Sharing promotional material modal states
  const [selectedShareMaterial, setSelectedShareMaterial] = useState<PromotionalMaterial | null>(null);
  const [shareClientPhone, setShareClientPhone] = useState('');
  const [shareCustomName, setShareCustomName] = useState('');

  // Load promotional materials
  const loadPromotionalMaterials = async () => {
    setLoadingPromo(true);
    try {
      const fetched = await fetchPromotionalMaterials();
      if (fetched && fetched.length > 0) {
        setPromotionalMaterials(fetched);
      } else {
        const initial: PromotionalMaterial[] = [
          {
            id: 'promo_1',
            title: 'Folleto Comercial 2026',
            category: 'folleto',
            description: 'Folleto tríptico oficial con los beneficios de los inversores Solux Green.',
            fileUrl: 'https://appdesign.appdesignproyectos.com/solux_folleto_2026.pdf',
            fileName: 'solux_folleto_2026.pdf'
          },
          {
            id: 'promo_2',
            title: 'Ficha Técnica Oficial',
            category: 'ficha_tecnica',
            description: 'Ficha de especificaciones y garantías del fabricante para clientes industriales.',
            fileUrl: 'https://appdesign.appdesignproyectos.com/solux_ficha_tecnica.pdf',
            fileName: 'solux_ficha_tecnica.pdf'
          },
          {
            id: 'promo_3',
            title: 'Material para Redes',
            category: 'redes',
            description: 'Imágenes de antes/después del recibo de luz para compartir en tus estados.',
            fileUrl: 'https://appdesign.appdesignproyectos.com/solux_redes.zip',
            fileName: 'solux_redes.zip'
          }
        ];
        // Populate local/state
        setPromotionalMaterials(initial);
        // Save them to DB if we're not offline to populate DB
        if (!isOfflineMode) {
          for (const item of initial) {
            await upsertPromotionalMaterial(item);
          }
        }
      }
    } catch (err: any) {
      console.warn('Error loading promotional materials:', err.message);
    } finally {
      setLoadingPromo(false);
    }
  };

  useEffect(() => {
    loadPromotionalMaterials();
  }, []);

  const handlePromoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        alert('⚠️ El archivo es demasiado grande. El límite es de 15MB.');
        return;
      }
      setNewPromoFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPromoFileBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddPromotionalMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromoTitle || !newPromoDescription || !newPromoFileBase64) {
      alert('⚠️ Por favor completa todos los campos y carga un archivo.');
      return;
    }

    setUploadProgress(true);
    const newMaterial: PromotionalMaterial = {
      id: 'promo_' + Date.now(),
      title: newPromoTitle,
      category: newPromoCategory,
      description: newPromoDescription,
      fileUrl: newPromoFileBase64,
      fileName: newPromoFileName,
      createdDate: new Date().toISOString().split('T')[0]
    };

    try {
      let success = true;
      if (!isOfflineMode) {
        success = await upsertPromotionalMaterial(newMaterial);
      }

      if (success) {
        setPromotionalMaterials(prev => [newMaterial, ...prev]);
        triggerNotification('🚀 ¡Material promocional guardado con éxito!');
        // Reset form
        setNewPromoTitle('');
        setNewPromoDescription('');
        setNewPromoFileBase64('');
        setNewPromoFileName('');
        setShowAddPromoForm(false);
      } else {
        alert('❌ Error al guardar el material promocional en la base de datos.');
      }
    } catch (err: any) {
      console.error(err);
      alert('❌ Error al guardar: ' + err.message);
    } finally {
      setUploadProgress(false);
    }
  };

  const handleDeletePromo = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este material promocional?')) return;
    try {
      let success = true;
      if (!isOfflineMode) {
        success = await deletePromotionalMaterial(id);
      }
      if (success) {
        setPromotionalMaterials(prev => prev.filter(p => p.id !== id));
        triggerNotification('🗑️ Material promocional eliminado correctamente.');
      } else {
        alert('❌ Error al eliminar el material en la base de datos.');
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleShareMaterialWhatsApp = (mat: PromotionalMaterial) => {
    setSelectedShareMaterial(mat);
    // Prefill with first project phone if available
    if (userSolarProjects.length > 0) {
      setShareClientPhone(userSolarProjects[0].clientPhone);
      setShareCustomName(userSolarProjects[0].clientName);
    } else {
      setShareClientPhone('');
      setShareCustomName('');
    }
  };

  const executeShareWhatsApp = async () => {
    if (!selectedShareMaterial) return;
    let cleanPhone = shareClientPhone.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = '52' + cleanPhone;
    }
    if (!cleanPhone) {
      alert('⚠️ Por favor ingresa un número de teléfono válido.');
      return;
    }

    const greeting = shareCustomName ? `Hola *${shareCustomName}*` : 'Hola';
    const isBase64 = selectedShareMaterial.fileUrl.startsWith('data:');

    // Attempt Native File Share (Mobile devices allow attaching the actual PDF directly to WhatsApp)
    if (isBase64 && typeof navigator !== 'undefined' && 'canShare' in navigator) {
      try {
        const fetchRes = await fetch(selectedShareMaterial.fileUrl);
        const blob = await fetchRes.blob();
        const extension = selectedShareMaterial.fileName?.split('.').pop() || 'pdf';
        const fileName = selectedShareMaterial.fileName || `${selectedShareMaterial.title.replace(/[^a-zA-Z0-9]/g, '_')}.${extension}`;
        const file = new File([blob], fileName, { type: blob.type || 'application/pdf' });

        const shareData = {
          title: selectedShareMaterial.title,
          text: `☀️ *SOLUX GREEN - MATERIAL PROMOCIONAL* ☀️\n\n${greeting}, un gusto saludarte.\n\nTe comparto la ficha técnica / folleto informativo:\n📁 *${selectedShareMaterial.title}*\n📝 ${selectedShareMaterial.description}\n\n*Solux Green* - Generando energía limpia y ahorros de hasta el 98%. 🌍🍃`,
          files: [file]
        };

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share(shareData);
          triggerNotification('💬 ¡PDF del material promocional adjuntado y compartido por WhatsApp!');
          setSelectedShareMaterial(null);
          return;
        }
      } catch (err) {
        console.warn('Native share fallback to URL link:', err);
      }
    }

    // Standard WhatsApp API link fallback for Desktop / Web
    let fileInfoText = '';
    if (!isBase64) {
      fileInfoText = `Te comparto esta ficha técnica / folleto informativo de Solux Green:
📁 *${selectedShareMaterial.title}*
📝 ${selectedShareMaterial.description}

📄 *Ver/Descargar PDF:*
${selectedShareMaterial.fileUrl}`;
    } else {
      fileInfoText = `Te comparto la información de esta ficha técnica / folleto de Solux Green:
📁 *${selectedShareMaterial.title}*
📝 ${selectedShareMaterial.description}

📄 *Archivo PDF adjunto:* Descarga directa enviada.`;
      
      // Also initiate download locally on desktop so the user can drag & attach the PDF directly to the WhatsApp chat window
      downloadMaterial(selectedShareMaterial);
    }

    const message = `☀️ *SOLUX GREEN - MATERIAL PROMOCIONAL* ☀️

${greeting}, un gusto saludarte.

${fileInfoText}

*Solux Green* - Generando energía limpia y ahorros de hasta el 98%. 🌍🍃`;

    const encodedText = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
    setSelectedShareMaterial(null);
    triggerNotification('💬 Abriendo chat de WhatsApp para compartir el material promocional...');
  };

  const downloadMaterial = (mat: PromotionalMaterial) => {
    if (mat.fileUrl.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = mat.fileUrl;
      link.download = mat.fileName || `${mat.title.replace(/\s+/g, '_')}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      triggerNotification(`📥 Material "${mat.title}" descargado con éxito.`);
    } else {
      window.open(mat.fileUrl, '_blank');
      triggerNotification(`📥 Abriendo enlace de "${mat.title}"...`);
    }
  };

  // --- New Prospect form states (Requirement 8 - Expediente) ---
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
  const [formPayMethod, setFormPayMethod] = useState<string>('contado');
  const [formWires, setFormWires] = useState<number>(2);
  const [formLoads, setFormLoads] = useState<string[]>([]);
  const [formReferrerCode, setFormReferrerCode] = useState<string>('');
  const [formAdvisorId, setFormAdvisorId] = useState<string>('');

  // File Upload placeholders
  const [evidenceReceiptFront, setEvidenceReceiptFront] = useState<string>('');
  const [evidenceReceiptBack, setEvidenceReceiptBack] = useState<string>('');
  const [evidenceReceipt2Front, setEvidenceReceipt2Front] = useState<string>('');
  const [evidenceFacade, setEvidenceFacade] = useState<string>('');
  const [evidenceInstallArea, setEvidenceInstallArea] = useState<string>('');

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

  // --- Client credentials & authorization states ---
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');

  const [authModalProject, setAuthModalProject] = useState<SolarProject | null>(null);
  const [authModalUsername, setAuthModalUsername] = useState('');
  const [authModalPassword, setAuthModalPassword] = useState('');
  const [authModalCopied, setAuthModalCopied] = useState(false);

  // --- Password & Username Generator Utilities ---
  const generateSecurePassword = (): string => {
    const charsUpper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const charsLower = 'abcdefghijkmnopqrstuvwxyz';
    const charsNumbers = '23456789';
    const charsSymbols = '!@#$%*';
    const r = (str: string) => str[Math.floor(Math.random() * str.length)];
    return `Solux#${r(charsUpper)}${r(charsLower)}${r(charsNumbers)}${r(charsNumbers)}${r(charsLower)}${r(charsUpper)}${r(charsSymbols)}!`;
  };

  const generateUsernameForClient = (fullName: string, phone?: string): string => {
    const clean = (fullName || 'cliente').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');
    const base = clean.slice(0, 10) || 'cliente';
    const digits = (phone || '').replace(/\D/g, '').slice(-4) || Math.floor(1000 + Math.random() * 9000).toString();
    return `${base}_${digits}`;
  };

  // --- Helper to ensure client user exists in state / DB ---
  const ensureClientUserCredentials = (
    proj: SolarProject,
    customUsername?: string,
    customPassword?: string
  ) => {
    const matched = findMatchingClientUser(proj, users);

    let finalUsername = customUsername || matched?.username;
    if (!finalUsername || finalUsername.trim() === '') {
      finalUsername = generateUsernameForClient(proj.clientName, proj.clientPhone);
    }

    let finalPassword = customPassword || matched?.password;
    if (!finalPassword || finalPassword.trim() === '') {
      finalPassword = 'Solux2026!';
    }

    const clientUser = {
      id: matched ? matched.id : `usr_client_${Date.now()}`,
      username: finalUsername.toLowerCase().trim().replace(/\s+/g, ''),
      password: finalPassword.trim(),
      role: 'client' as const,
      fullName: proj.clientName,
      whatsapp: proj.clientPhone,
      email: proj.clientEmail || `${finalUsername}@soluxgreen.com.mx`
    };

    if (onUpdateUsers) {
      if (matched) {
        onUpdateUsers(users.map(u => u.id === matched.id ? clientUser : u));
      } else {
        onUpdateUsers([clientUser, ...(users || [])]);
      }
    }

    return clientUser;
  };

  // --- Dispatch Authorized Proposal + Credentials to Client via WhatsApp ---
  const handleSendAuthorizedQuotationWhatsApp = (
    proj: SolarProject,
    customUser?: string,
    customPass?: string
  ) => {
    const clientUser = ensureClientUserCredentials(proj, customUser, customPass);
    
    const panels = proj.estimatedPanels || Math.round(((proj.averageBill || 0) / 1000) * 2) || 2;
    const systemKwp = ((panels * 550) / 1000).toFixed(2);
    const requiredArea = proj.requiredArea || Number((panels * 2.88).toFixed(1));
    const investment = proj.totalInvestment || (panels * activePanelPrice);
    const annualSavings = Math.round((proj.averageBill || 0) * 6 * 0.9);
    const roiYears = annualSavings > 0 ? (investment / annualSavings).toFixed(1) : 'N/A';
    const appLink = window.location.origin;
    const advisorName = currentUser?.fullName || 'Asesor Verde Solux';

    const message = `☀️ *SOLUX GREEN - PROPUESTA SOLAR AUTORIZADA* ⚡

¡Hola *${proj.clientName}*! Nos da mucho gusto saludarte.

Te informamos que tu expediente y cotización solar han sido *AUTORIZADOS Y VALIDADOS* con éxito por nuestro equipo de ingeniería.

📊 *Resumen de tu Cotización Solar:*
• Factura CFE Bimestral: *$${(proj.averageBill || 0).toLocaleString('es-MX')} MXN*
• Sistema Fotovoltaico: *${panels} Paneles Solares* (${systemKwp} kWp)
• Área de Techo Requerida: *${requiredArea} m²*
• Inversión Total Estimada: *$${investment.toLocaleString('es-MX')} MXN*
• Ahorro Anual Estimado: *~$${annualSavings.toLocaleString('es-MX')} MXN/año*
• Retorno de Inversión (ROI): *~${roiYears} Años*

🔐 *TUS CREDENCIALES Y LINK DE ACCESO AL PORTAL DE CLIENTE:*
• *Rol de Usuario:* Cliente Solux Green
• *Usuario:* *${clientUser.username}*
• *Contraseña Segura:* *${clientUser.password}*
• *Link de Acceso Directo:* ${appLink}

🌐 Ingresa con tus credenciales para consultar tu cotización interactiva, simular esquemas de crédito, autorizar tu contrato o dar seguimiento a tu instalación.

👨‍💼 *Atendido por:* ${advisorName}

¡Estamos listos para transformar tu consumo eléctrico en energía limpia! 🌿`;

    const cleanPhone = (proj.clientPhone || proj.whatsappPhone || '').replace(/\D/g, '');
    const formattedPhone = cleanPhone.length === 10 ? '52' + cleanPhone : cleanPhone;
    const encodedText = encodeURIComponent(message);

    const whatsappUrl = formattedPhone 
      ? `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;

    window.open(whatsappUrl, '_blank');
    triggerNotification(`📲 Envió cotización y credenciales por WhatsApp a ${proj.clientName}`);
  };

  // --- Trigger Authorization Flow & Open WhatsApp Dispatch Modal ---
  const openAuthorizationModal = (proj: SolarProject, targetStatus = 'validado') => {
    onUpdateSolarProject(proj.id, { status: targetStatus });
    if (selectedProject?.id === proj.id) {
      setSelectedProject(prev => prev ? { ...prev, status: targetStatus } : null);
    }
    const clientUser = ensureClientUserCredentials(proj);
    setAuthModalUsername(clientUser.username);
    setAuthModalPassword(clientUser.password);
    setAuthModalProject({ ...proj, status: targetStatus });
    setAuthModalCopied(false);
    triggerNotification(`✅ Prospecto "${proj.clientName}" AUTORIZADO. ¡Credenciales y WhatsApp listos!`);
  };

  // --- Editing states ---
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editProjectEvidence, setEditProjectEvidence] = useState<SolarProject['evidence']>({});
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectPhone, setEditProjectPhone] = useState('');
  const [editProjectEmail, setEditProjectEmail] = useState('');
  const [editProjectMapsUrl, setEditProjectMapsUrl] = useState('');
  const [editProjectMunicipality, setEditProjectMunicipality] = useState('');
  const [editProjectBill, setEditProjectBill] = useState('');
  const [editProjectWires, setEditProjectWires] = useState<number>(2);
  const [editProjectLoads, setEditProjectLoads] = useState<string[]>([]);
  const [editProjectUsername, setEditProjectUsername] = useState('');
  const [editProjectPassword, setEditProjectPassword] = useState('');
  const [editProjectSpace, setEditProjectSpace] = useState('');
  const [editProjectMeters, setEditProjectMeters] = useState('');
  const [editProjectCFE, setEditProjectCFE] = useState<'activo_sin_adeudo' | 'con_adeudo' | 'inactivo'>('activo_sin_adeudo');
  const [editProjectOwnership, setEditProjectOwnership] = useState<'propietario' | 'arrendatario_autorizado'>('propietario');
  const [editProjectPayMethod, setEditProjectPayMethod] = useState<string>('directo');
  const [editProjectStatus, setEditProjectStatus] = useState<string>('');

  const [notification, setNotification] = useState<string | null>(null);

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // --- CALCULATION FORMULAS (Requirement 2.3) ---
  // Por cada $1,000 de consumo se consideran 2 paneles. Si la fracción es >= 0.1 se redondea al inmediato superior.
  const calculatePanels = (bill: number) => {
    if (bill <= 0) return 0;
    const rawPanels = (bill / 1000) * 2;
    const dec = rawPanels - Math.floor(rawPanels);
    const p = dec >= 0.1 ? Math.ceil(rawPanels) : Math.floor(rawPanels);
    return Math.max(1, p);
  };

  const activePanelPrice = (soluxConfig?.panelBasePrice !== undefined && Number(soluxConfig.panelBasePrice) > 0)
    ? Number(soluxConfig.panelBasePrice)
    : 11000;

  const activeMonthlyInterestRate = (soluxConfig?.monthlyInterestRate !== undefined && !isNaN(Number(soluxConfig.monthlyInterestRate)))
    ? Number(soluxConfig.monthlyInterestRate)
    : 4.9;

  const activeContadoDiscount = (soluxConfig?.contadoDiscountPercent !== undefined && !isNaN(Number(soluxConfig.contadoDiscountPercent)))
    ? Number(soluxConfig.contadoDiscountPercent)
    : 5;

  const safeBill = typeof calcBill === 'number' ? calcBill : (Number(calcBill) || 0);
  const panelsCount = safeBill > 0 ? calculatePanels(safeBill) : 0;
  const requiredArea = panelsCount > 0 ? Number((panelsCount * 2.88).toFixed(2)) : 0;
  const is220vRequired = panelsCount > 4;

  // Inversión total: paneles * costo_base oficial ($14,000 por defecto o configurado en soluxConfig)
  const totalInvestment = panelsCount * activePanelPrice;

  // Simulador de Financiamiento (Saldos Insolutos - Amortización Tipo Excel y MSI)
  const runFinancingSimulation = (amount: number, method: string, months: number, downPercent: number) => {
    const safeAmount = Number(amount) || 0;
    const isContado = method === 'contado';
    const isMSI = method === 'msi';
    
    // Bonificación de contado (5% por defecto o de soluxConfig)
    const contadoDiscount = activeContadoDiscount;
    const discountAmount = Math.round(safeAmount * (contadoDiscount / 100));
    const finalCashInvestment = Math.max(0, safeAmount - discountAmount);

    if (isMSI) {
      const msiPayment = safeAmount > 0 ? Math.round(safeAmount / 12) : 0;
      const schedule = Array.from({ length: 12 }, (_, i) => {
        const initialBal = Math.max(0, safeAmount - (msiPayment * i));
        const capital = i === 11 ? initialBal : msiPayment;
        const finalBal = Math.max(0, initialBal - capital);
        return {
          month: i + 1,
          initialBalance: initialBal,
          capital: capital,
          interest: 0,
          totalPayment: capital,
          finalBalance: finalBal
        };
      });

      return {
        downPayment: 0,
        principalToFinance: safeAmount,
        monthlyPayment: msiPayment,
        totalInterest: 0,
        totalToPay: safeAmount,
        totalProjectCost: safeAmount,
        contadoDiscount: 0,
        discountAmount: 0,
        finalCashInvestment: safeAmount,
        months: 12,
        interestRate: 0,
        schedule
      };
    }

    if (isContado) {
      return {
        downPayment: 0,
        principalToFinance: 0,
        monthlyPayment: 0,
        totalInterest: 0,
        totalToPay: finalCashInvestment,
        totalProjectCost: finalCashInvestment,
        contadoDiscount,
        discountAmount,
        finalCashInvestment,
        months: 0,
        interestRate: 0,
        schedule: []
      };
    }

    let safeMonths = Math.max(1, Number(months) || 3);
    if (method.startsWith('directo_')) {
      const parsed = parseInt(method.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(parsed) && parsed > 0) safeMonths = parsed;
    }

    const safeDownPercent = Math.max(0, Math.min(100, Number(downPercent) || 0));
    const downPayment = Math.round(safeAmount * (safeDownPercent / 100));
    const principalToFinance = Math.max(0, safeAmount - downPayment);
    
    // Si el plazo específico tiene una tasa personalizada configurada, usarla, si no la tasa global
    const matchingTerm = (soluxConfig?.financingTerms || []).find(t => t.months === safeMonths && t.active);
    const termRate = (matchingTerm && matchingTerm.monthlyInterestRate !== undefined && matchingTerm.monthlyInterestRate !== null && !isNaN(Number(matchingTerm.monthlyInterestRate)))
      ? Number(matchingTerm.monthlyInterestRate)
      : activeMonthlyInterestRate;
    const monthlyRate = termRate / 100;
    
    const schedule: Array<{
      month: number;
      initialBalance: number;
      capital: number;
      interest: number;
      totalPayment: number;
      finalBalance: number;
    }> = [];

    let currentBalance = principalToFinance;
    const standardCapital = Math.round((principalToFinance / safeMonths) * 100) / 100;
    let totalInterest = 0;

    for (let i = 1; i <= safeMonths; i++) {
      const initialBalance = currentBalance;
      // Para el último mes, el capital es exactamente el balance restante para liquidar a 0
      const capital = i === safeMonths ? Math.round(currentBalance * 100) / 100 : standardCapital;
      const interest = Math.round(initialBalance * monthlyRate * 100) / 100;
      const totalPayment = Math.round((capital + interest) * 100) / 100;
      currentBalance = Math.max(0, Math.round((currentBalance - capital) * 100) / 100);
      
      totalInterest += interest;

      schedule.push({
        month: i,
        initialBalance,
        capital,
        interest,
        totalPayment,
        finalBalance: currentBalance
      });
    }

    const totalToPay = principalToFinance + totalInterest;
    // Para visualización simple/compatibilidad, usamos el primer pago mensual
    const monthlyPayment = schedule.length > 0 ? Math.round(schedule[0].totalPayment) : 0;
    const totalProjectCost = Math.round((downPayment + totalToPay) * 100) / 100;

    return {
      downPayment: downPayment || 0,
      principalToFinance: principalToFinance || 0,
      monthlyPayment: monthlyPayment || 0,
      totalInterest: Math.round(totalInterest * 100) / 100 || 0,
      totalToPay: Math.round(totalToPay * 100) / 100 || 0,
      totalProjectCost: totalProjectCost || 0,
      contadoDiscount,
      discountAmount,
      finalCashInvestment,
      months: safeMonths,
      interestRate: termRate,
      schedule
    };
  };

  const effectiveDownPercent = calcDownPaymentPercent !== '' && !isNaN(Number(calcDownPaymentPercent))
    ? Number(calcDownPaymentPercent)
    : (Number(soluxConfig?.defaultDownPaymentPercent) || 50);

  const simulationResult = runFinancingSimulation(totalInvestment, calcPayMethod, calcMonths, effectiveDownPercent);

  // Handle saving simulation to Dossier (Requirement 2.2)
  const handleSaveSimulationToProject = () => {
    if (!selectedSimulationClientId) {
      alert('⚠️ Por favor selecciona un prospecto de la lista para guardar esta simulación financiera en su expediente.');
      return;
    }

    const project = userSolarProjects.find(p => p.id === selectedSimulationClientId);
    if (!project) return;

    const currentSimulations = project.savedSimulations || [];
    if (currentSimulations.length >= 3) {
      alert('⚠️ Este prospecto ya cuenta con el límite de 3 simulaciones guardadas en su expediente. Da de baja alguna antes de guardar una nueva.');
      return;
    }

    const partnerName = 
      calcPayMethod === 'contado' ? 'Pago de Contado' :
      calcPayMethod === 'msi' ? '12 MSI Tarjeta Bancaria' :
      `Financiamiento Solux Green (${simulationResult.months} Meses)`;
    const newSim = {
      id: `sim_${Date.now()}`,
      financialPartner: partnerName,
      amount: totalInvestment,
      months: simulationResult.months,
      interestRate: simulationResult.interestRate || 0,
      monthlyPayment: simulationResult.monthlyPayment,
      date: new Date().toISOString().split('T')[0],
      advisorName: currentUser?.fullName || 'Asesor Verde'
    };

    const updatedSimulations = [...currentSimulations, newSim];
    onUpdateSolarProject(selectedSimulationClientId, { savedSimulations: updatedSimulations });
    
    triggerNotification(`📊 Simulación de crédito guardada exitosamente en el expediente de "${project.clientName}" (${updatedSimulations.length}/3).`);
  };

  const exportCalculatorToImage = async () => {
    const selectedProj = userSolarProjects.find(p => p.id === selectedSimulationClientId);
    const clientName = calcClientName.trim() || (selectedProj ? selectedProj.clientName : 'Cliente Solux');
    const clientPhone = calcClientPhone.trim() || (selectedProj ? (selectedProj.clientPhone || selectedProj.whatsappPhone || 'No registrado') : 'No registrado');
    const location = calcClientCity.trim() || (selectedProj ? (selectedProj.municipalityState || 'No especificado') : 'No especificado');
    const safeBill = Number(calcBill) || 0;
    const safeInvestment = Number(totalInvestment) || 0;
    const quotationFolio = selectedProj?.id || ('COT-' + Date.now().toString().slice(-6));
    const matchedUser = selectedProj ? users?.find((u: any) => u.solarProjectId === selectedProj.id || u.username === selectedProj.clientName.toLowerCase().replace(/[^a-z0-9]/g, '')) : null;

    triggerNotification('⏳ Generando y descargando imagen completa de la cotización...');

    const quotationProject: SolarProject = {
      ...(selectedProj || {}),
      id: quotationFolio,
      clientName,
      clientPhone,
      clientEmail: selectedProj?.clientEmail,
      whatsappPhone: clientPhone,
      municipalityState: location,
      averageBill: safeBill,
      estimatedPanels: panelsCount,
      requiredArea: Number(requiredArea) || 0,
      totalInvestment: safeInvestment,
      paymentMethodDesired: calcPayMethod,
      financing: (calcPayMethod.startsWith('directo') || calcPayMethod === 'directo') ? {
        type: 'directo',
        downPayment: simulationResult.downPayment,
        months: simulationResult.months,
        interestRate: simulationResult.interestRate || soluxConfig.monthlyInterestRate || 4.9,
        monthlyPayment: simulationResult.monthlyPayment
      } : (calcPayMethod === 'msi' ? {
        type: 'msi',
        downPayment: 0,
        months: 12,
        interestRate: 0,
        monthlyPayment: simulationResult.monthlyPayment
      } : (calcPayMethod === 'contado' ? {
        type: 'contado',
        downPayment: 0,
        months: 0,
        interestRate: 0,
        monthlyPayment: 0
      } : undefined)),
      propertyOwnership: (selectedProj?.propertyOwnership as any) || 'propietario',
      cfeStatus: (selectedProj?.cfeStatus as any) || 'activo_sin_adeudo',
      metersCount: selectedProj?.metersCount || 1,
      electricalLoadType: selectedProj?.electricalLoadType || (panelsCount > 4 ? ['220V'] : ['110V']),
      voltageAlert220v: panelsCount > 4,
      voltageUpgradeQuoted: false,
      availableSpace: Number(requiredArea) || 20,
      siteSurveyPaid: false,
      siteSurveyStatus: 'pendiente',
      createdDate: selectedProj?.createdDate || new Date().toISOString().split('T')[0],
      status: 'cotizacion',
      evidence: {
        ...(selectedProj?.evidence || {}),
        ...(expressSignature ? { clientSignature: expressSignature } : {})
      }
    };

    const advisorObj = {
      fullName: currentUser?.fullName || 'Asesor Verde Solux',
      phone: currentUser?.whatsapp || '229 343 3597'
    };

    try {
      const success = await exportProjectDossierImage(
        quotationProject,
        advisorObj,
        matchedUser,
        soluxConfig,
        { expressSignature: expressSignature || undefined }
      );
      if (success) {
        triggerNotification('🖼️ ¡Imagen JPEG de la cotización descargada con éxito!');
      } else {
        triggerNotification('⚠️ Error al generar la imagen de la cotización.');
      }
    } catch (err) {
      console.error('Error generating image export:', err);
      triggerNotification('⚠️ Error al generar la imagen.');
    }
    return;
  };


  const exportCalculatorToPDF = async () => {
    const selectedProj = userSolarProjects.find(p => p.id === selectedSimulationClientId);
    const clientName = calcClientName.trim() || (selectedProj ? selectedProj.clientName : 'Cliente Solux');
    const clientPhone = calcClientPhone.trim() || (selectedProj ? (selectedProj.clientPhone || selectedProj.whatsappPhone || 'No registrado') : 'No registrado');
    const location = calcClientCity.trim() || (selectedProj ? (selectedProj.municipalityState || 'No especificado') : 'No especificado');
    const safeBill = Number(calcBill) || 0;
    const safeInvestment = Number(totalInvestment) || 0;
    const quotationFolio = selectedProj?.id || ('COT-' + Date.now().toString().slice(-6));
    const matchedUser = selectedProj ? users?.find((u: any) => u.solarProjectId === selectedProj.id || u.username === selectedProj.clientName.toLowerCase().replace(/[^a-z0-9]/g, '')) : null;

    triggerNotification('⏳ Generando y descargando PDF oficial de la cotización...');

    const quotationProject: SolarProject = {
      ...(selectedProj || {}),
      id: quotationFolio,
      clientName,
      clientPhone,
      clientEmail: selectedProj?.clientEmail,
      whatsappPhone: clientPhone,
      municipalityState: location,
      averageBill: safeBill,
      estimatedPanels: panelsCount,
      requiredArea: Number(requiredArea) || 0,
      totalInvestment: safeInvestment,
      paymentMethodDesired: calcPayMethod,
      financing: (calcPayMethod.startsWith('directo') || calcPayMethod === 'directo') ? {
        type: 'directo',
        downPayment: simulationResult.downPayment,
        months: simulationResult.months,
        interestRate: simulationResult.interestRate || soluxConfig.monthlyInterestRate || 4.9,
        monthlyPayment: simulationResult.monthlyPayment
      } : (calcPayMethod === 'msi' ? {
        type: 'msi',
        downPayment: 0,
        months: 12,
        interestRate: 0,
        monthlyPayment: simulationResult.monthlyPayment
      } : (calcPayMethod === 'contado' ? {
        type: 'contado',
        downPayment: 0,
        months: 0,
        interestRate: 0,
        monthlyPayment: 0
      } : undefined)),
      propertyOwnership: (selectedProj?.propertyOwnership as any) || 'propietario',
      cfeStatus: (selectedProj?.cfeStatus as any) || 'activo_sin_adeudo',
      metersCount: selectedProj?.metersCount || 1,
      electricalLoadType: selectedProj?.electricalLoadType || (panelsCount > 4 ? ['220V'] : ['110V']),
      voltageAlert220v: panelsCount > 4,
      voltageUpgradeQuoted: false,
      availableSpace: Number(requiredArea) || 20,
      siteSurveyPaid: false,
      siteSurveyStatus: 'pendiente',
      createdDate: selectedProj?.createdDate || new Date().toISOString().split('T')[0],
      status: 'cotizacion',
      evidence: {
        ...(selectedProj?.evidence || {}),
        ...(expressSignature ? { clientSignature: expressSignature } : {})
      }
    };

    const advisorObj = {
      fullName: currentUser?.fullName || 'Asesor Verde Solux',
      phone: currentUser?.whatsapp || '229 343 3597'
    };

    try {
      const success = await exportProjectDossierPDF(
        quotationProject,
        advisorObj,
        matchedUser,
        soluxConfig,
        { expressSignature: expressSignature || undefined }
      );

      if (success) {
        triggerNotification('📄 Cotización en PDF descargada directamente a tu equipo.');
      } else {
        triggerNotification('⚠️ Error al generar la cotización en PDF.');
      }
    } catch (err: any) {
      console.error('Error generating PDF download:', err);
      triggerNotification('❌ Error al generar el PDF de cotización.');
    }
  };

  const handleCalculatorShareWhatsApp = () => {
    const selectedProj = userSolarProjects.find(p => p.id === selectedSimulationClientId);
    const clientCreds = selectedProj ? getClientCredentials(selectedProj, users) : null;

    const clientName = calcClientName.trim() || (selectedProj ? selectedProj.clientName : 'Cliente');
    const payMethodName = formatPaymentMethod(calcPayMethod, soluxConfig);

    const finDetail = (calcPayMethod.startsWith('directo') || calcPayMethod === 'directo') 
      ? `\n  • Enganche (${effectiveDownPercent}%): *$${simulationResult.downPayment.toLocaleString('es-MX')} MXN*\n  • Plazo: *${simulationResult.months} Meses*\n  • Mensualidad Inicial: *$${simulationResult.monthlyPayment.toLocaleString('es-MX')} MXN*\n  • Total Proyecto (Enganche + Pagos): *$${simulationResult.totalProjectCost.toLocaleString('es-MX')} MXN*`
      : (calcPayMethod === 'msi'
        ? `\n  • Inversión Total: *$${totalInvestment.toLocaleString('es-MX')} MXN*\n  • Esquema: *12 Meses sin Intereses (MSI Bancario)*\n  • Mensualidad Fija: *$${simulationResult.monthlyPayment.toLocaleString('es-MX')} MXN/mes* (12 Pagos)\n  • Tasa de Interés: *0% (Sin intereses ni comisiones)*\n  • Enganche: *$0.00 MXN*`
        : (calcPayMethod === 'contado' 
          ? `\n  • Inversión de Lista: *$${totalInvestment.toLocaleString('es-MX')} MXN*\n  • Descuento Contado (${simulationResult.contadoDiscount}%): *-$${simulationResult.discountAmount.toLocaleString('es-MX')} MXN*\n  • Total Neto a Liquidar: *$${simulationResult.finalCashInvestment.toLocaleString('es-MX')} MXN*`
          : ''));

    const credentialText = (selectedProj && clientCreds) 
      ? `\n\n🔐 *Acceso a tu Portal de Cliente:* \n🌐 Link: ${window.location.origin}\n👤 Usuario: *${clientCreds.username}*\n🔑 Contraseña: *${clientCreds.password}*`
      : '';

    const advisorName = currentUser?.fullName || 'Asesor Verde Solux';
    const advisorPhone = currentUser?.whatsapp || '';
    const advisorContactText = advisorPhone ? ` (Cel/WA: ${advisorPhone})` : '';

    const message = `☀️ *COTIZACIÓN SOLAR EXPRESS - SOLUX GREEN* ☀️

Hola *${clientName}*, un gusto saludarte. Te atiende *${advisorName}* de Solux Green. Aquí tienes la propuesta de generación solar diseñada a tu medida:

📈 *Monto de Pago Bimestral:* $${calcBill.toLocaleString('es-MX')} MXN
⚡ *Módulos Recomendados:* *${panelsCount} Paneles Solares*
📐 *Espacio Requerido Mínimo:* *${requiredArea} m²*
🌱 *Beneficio:* Diagnóstico técnico preliminar y ahorro garantizado.

💰 *Inversión Estimada:* *$${totalInvestment.toLocaleString('es-MX')} MXN*
💳 *Esquema Financiero:* *${payMethodName}*${finDetail}${credentialText}

👨‍💼 *Cotizado / Atendido Por:* *${advisorName}*${advisorContactText}

*¡Genera tu propia energía limpia hoy mismo con Solux Green!* 🌍🍃`;

    const encodedText = encodeURIComponent(message);
    let targetPhone = '';
    if (selectedProj) {
      targetPhone = (selectedProj.clientPhone || selectedProj.whatsappPhone || '').replace(/\D/g, '');
      if (targetPhone.length === 10) {
        targetPhone = '52' + targetPhone;
      }
    }

    const whatsappUrl = targetPhone 
      ? `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;

    window.open(whatsappUrl, '_blank');
    triggerNotification(targetPhone ? '💬 Abriendo WhatsApp para enviar cotización al cliente...' : '💬 Abriendo WhatsApp para compartir cotización...');
  };

  // Create new prospect dossier
  const handleCreateProspect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPhone || !formMunicipality) {
      alert('⚠️ Por favor completa los campos requeridos (*).');
      return;
    }

    const bill = Number(formBill);
    const calculatedPanelsCount = calculatePanels(bill);
    const investment = calculatedPanelsCount * activePanelPrice;

    const selectedAdvisorUser = users?.find(u => u.id === formAdvisorId);
    const resolvedAdvisorName = selectedAdvisorUser ? (selectedAdvisorUser.fullName || selectedAdvisorUser.username) : (currentUser?.fullName || currentUser?.username || 'Asesor Verde Solux');
    const resolvedAdvisorPhone = selectedAdvisorUser ? (selectedAdvisorUser.whatsapp || selectedAdvisorUser.phone || '') : (currentUser?.whatsapp || currentUser?.phone || '');
    const resolvedCreatedBy = selectedAdvisorUser ? selectedAdvisorUser.id : (currentUser?.id || 'comercial_user');
    const resolvedRole = selectedAdvisorUser ? selectedAdvisorUser.role : (currentUser?.role || 'comercial');

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
      referrerCode: formReferrerCode || undefined,
      createdDate: new Date().toISOString().split('T')[0],
      createdBy: resolvedCreatedBy,
      createdByRole: resolvedRole,
      advisorName: resolvedAdvisorName,
      advisorPhone: resolvedAdvisorPhone,
      assignedCommercialId: resolvedCreatedBy,
    };

    onAddSolarProject(newProject);

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

    triggerNotification('🚀 ¡Prospecto registrado con éxito! El expediente digital y las credenciales han sido generados.');
    
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

    // Automatically transition to the pipeline tab and open the newly registered prospect details
    setActiveTab('pipeline');
    setSelectedProject(newProject);
  };

  // Quick Create Prospect function from calculator
  const handleCreateQuickProspect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName || !quickPhone || !quickMunicipality) {
      alert('⚠️ Por favor completa los campos requeridos (*).');
      return;
    }

    const bill = Number(quickBill) || 0;
    const calculatedPanelsCount = calculatePanels(bill);
    const investment = calculatedPanelsCount * activePanelPrice;

    const newProject: SolarProject = {
      id: `proj_${Date.now()}`,
      clientName: quickName,
      clientPhone: quickPhone,
      clientEmail: quickEmail || undefined,
      whatsappPhone: quickPhone,
      googleMapsUrl: undefined,
      municipalityState: quickMunicipality,
      electricalLoadType: [],
      wiresCount: 2,
      averageBill: bill,
      availableSpace: Number((calculatedPanelsCount * 2.88).toFixed(2)),
      metersCount: 1,
      cfeStatus: 'activo_sin_adeudo',
      paymentMethodDesired: calcPayMethod,
      propertyOwnership: 'propietario',
      estimatedPanels: calculatedPanelsCount,
      requiredArea: Number((calculatedPanelsCount * 2.88).toFixed(2)),
      voltageAlert220v: calculatedPanelsCount > 4,
      voltageUpgradeQuoted: calculatedPanelsCount > 4,
      totalInvestment: investment,
      siteSurveyPaid: false,
      siteSurveyStatus: 'pendiente',
      status: 'validacion',
      evidence: {
        cfeReceiptFront: 'https://appdesign.appdesignproyectos.com/recibo_cfe_placeholder.jpg',
        cfeReceiptBack: 'https://appdesign.appdesignproyectos.com/recibo_cfe_placeholder.jpg',
        facade: 'https://appdesign.appdesignproyectos.com/fachada_placeholder.jpg',
        installationAreaPhoto: 'https://appdesign.appdesignproyectos.com/techo_placeholder.jpg'
      },
      payments: [],
      createdDate: new Date().toISOString().split('T')[0],
      createdBy: currentUser?.id || 'comercial_user',
      createdByRole: currentUser?.role || 'comercial',
      advisorName: currentUser?.fullName || currentUser?.username || 'Asesor Verde Solux',
      advisorPhone: currentUser?.whatsapp || currentUser?.phone || '',
      assignedCommercialId: currentUser?.id,
    };

    onAddSolarProject(newProject);

    // Sync client user login credentials
    const generatedUsername = quickName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15) || `usr_${Date.now()}`;
    const generatedPassword = 'Solux2026!';
    const newClientUser = {
      id: `usr_client_${Date.now()}`,
      username: generatedUsername,
      email: quickEmail || `${generatedUsername}@soluxgreen.com.mx`,
      password: generatedPassword,
      role: 'client' as const,
      fullName: quickName,
      whatsapp: quickPhone
    };

    if (onUpdateUsers) {
      onUpdateUsers([newClientUser, ...(users || [])]);
    }

    // Auto-select in calculator and update calculator's average bill & space
    setSelectedSimulationClientId(newProject.id);
    setCalcBill(bill);
    setCalcSpace(Number((calculatedPanelsCount * 2.88).toFixed(2)));

    triggerNotification(`🚀 ¡Prospecto "${quickName}" registrado y seleccionado con éxito!`);
    
    // Reset state and close modal
    setQuickName('');
    setQuickPhone('');
    setQuickEmail('');
    setQuickMunicipality('');
    setQuickBill('');
    setIsQuickProspectOpen(false);
  };

  const handleOpenEditProject = (proj: SolarProject) => {
    const creds = getClientCredentials(proj, users);
    setEditProjectName(proj.clientName);
    setEditProjectPhone(proj.clientPhone);
    setEditProjectEmail(proj.clientEmail || '');
    setEditProjectMapsUrl(proj.googleMapsUrl || '');
    setEditProjectMunicipality(proj.municipalityState || '');
    setEditProjectBill(String(proj.averageBill || ''));
    setEditProjectWires(proj.wiresCount || 2);
    setEditProjectLoads(proj.electricalLoadType || []);
    setEditProjectUsername(creds.username);
    setEditProjectPassword(creds.password);
    setEditProjectSpace(String(proj.availableSpace ?? ''));
    setEditProjectMeters(String(proj.metersCount ?? ''));
    setEditProjectCFE(proj.cfeStatus || 'activo_sin_adeudo');
    setEditProjectOwnership(proj.propertyOwnership || 'propietario');
    setEditProjectPayMethod(proj.paymentMethodDesired || 'directo');
    setEditProjectStatus(proj.status || 'validacion');
    setEditProjectEvidence(proj.evidence || {});
    setIsEditingProject(true);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleEditEvidenceFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'cfeReceiptFront' | 'cfeReceiptBack' | 'facade' | 'installationAreaPhoto'
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditProjectEvidence(prev => ({
          ...prev,
          [field]: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddEditAdditionalReceipt = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newImages: string[] = [];
      let processed = 0;
      for (let i = 0; i < files.length; i++) {
        const reader = new FileReader();
        reader.onloadend = () => {
          newImages.push(reader.result as string);
          processed++;
          if (processed === files.length) {
            setEditProjectEvidence(prev => ({
              ...prev,
              additionalReceipts: [...(prev.additionalReceipts || []), ...newImages]
            }));
          }
        };
        reader.readAsDataURL(files[i]);
      }
    }
  };

  const handleRemoveEditAdditionalReceipt = (index: number) => {
    setEditProjectEvidence(prev => {
      const current = prev.additionalReceipts || [];
      return {
        ...prev,
        additionalReceipts: current.filter((_, i) => i !== index)
      };
    });
  };

  const handleSaveEditProject = () => {
    if (!selectedProject) return;
    const billNum = Number(editProjectBill) || 0;
    const calculatedPanelsCount = calculatePanels(billNum);
    const investment = calculatedPanelsCount * activePanelPrice;

    const updatedProjFields: Partial<SolarProject> = {
      clientName: editProjectName,
      clientPhone: editProjectPhone,
      clientEmail: editProjectEmail || undefined,
      whatsappPhone: editProjectPhone,
      googleMapsUrl: editProjectMapsUrl || undefined,
      municipalityState: editProjectMunicipality,
      wiresCount: editProjectWires,
      electricalLoadType: editProjectLoads,
      averageBill: billNum,
      estimatedPanels: calculatedPanelsCount,
      requiredArea: Number((calculatedPanelsCount * 2.88).toFixed(2)),
      voltageAlert220v: calculatedPanelsCount > 4,
      voltageUpgradeQuoted: calculatedPanelsCount > 4,
      totalInvestment: investment,
      availableSpace: Number(editProjectSpace) || 40,
      metersCount: Number(editProjectMeters) || 1,
      cfeStatus: editProjectCFE,
      propertyOwnership: editProjectOwnership,
      paymentMethodDesired: editProjectPayMethod,
      status: editProjectStatus,
      evidence: editProjectEvidence
    };

    onUpdateSolarProject(selectedProject.id, updatedProjFields);

    // Look up the exact matching client user or by explicit username
    const matched = users.find(u => u.role === 'client' && (
      (editProjectUsername && u.username?.toLowerCase() === editProjectUsername.trim().toLowerCase())
    )) || findMatchingClientUser(selectedProject, users);

    if (onUpdateUsers) {
      if (matched) {
         const updatedUser = {
           ...matched,
           username: editProjectUsername.trim(),
           password: editProjectPassword.trim(),
           fullName: editProjectName.trim(),
           email: editProjectEmail.trim(),
           whatsapp: editProjectPhone.trim()
         };
         onUpdateUsers(users.map(u => u.id === matched.id ? updatedUser : u));
      } else {
         const newClientUser = {
           id: `usr_client_${Date.now()}`,
           username: (editProjectUsername || editProjectName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15)).trim(),
           password: (editProjectPassword || 'Solux2026!').trim(),
           role: 'client',
           fullName: editProjectName.trim(),
           email: editProjectEmail.trim(),
           whatsapp: editProjectPhone.trim()
         };
         onUpdateUsers([...(users || []), newClientUser]);
      }
    }

    triggerNotification('💾 ¡Expediente y credenciales actualizadas correctamente!');
    setSelectedProject({ ...selectedProject, ...updatedProjFields });
    setIsEditingProject(false);
  };

  const exportProjectToPDF = async (proj: SolarProject, matchedUser: any) => {
    triggerNotification('⏳ Generando PDF oficial del expediente...');
    try {
      const creatorUser = users?.find((u: any) => u.id === proj.createdBy || u.fullName === proj.advisorName);
      const advisorNameResolved = proj.advisorName || creatorUser?.fullName || currentUser?.fullName || 'Asesor Verde Solux';
      const advisorPhoneResolved = proj.advisorPhone || creatorUser?.whatsapp || currentUser?.whatsapp || '';

      const advisorObj = {
        fullName: advisorNameResolved,
        phone: advisorPhoneResolved
      };

      const success = await exportProjectDossierPDF(proj, advisorObj, matchedUser, soluxConfig);

      if (success) {
        triggerNotification('📄 PDF oficial descargado directamente a tu equipo.');
      } else {
        triggerNotification('⚠️ Error al generar el archivo PDF.');
      }
    } catch (e) {
      console.error('Error al generar PDF:', e);
      triggerNotification('⚠️ Error al generar el PDF.');
    }
  };

  const exportProjectToExcel = (proj: SolarProject, matchedUser: any) => {
    const panels = proj.estimatedPanels || Math.round(((proj.averageBill || 0) / 1000) * 2) || 2;
    const requiredArea = proj.requiredArea || Number((panels * 2.88).toFixed(2));
    const investment = proj.totalInvestment || (panels * activePanelPrice);
    const annualSavings = Math.round((proj.averageBill || 0) * 6 * 0.9);
    const roiYears = annualSavings > 0 ? (investment / annualSavings).toFixed(1) : 'N/A';

    const csvContent = "\uFEFF"
      + [
          ["ID Expediente", "Nombre del Cliente", "WhatsApp / Telefono", "Correo", "Municipio y Estado", "Google Maps URL", "Consumo CFE Promedio MXN", "Paneles Estimados", "Potencia kWp", "Area Requerida m2", "Inversion Total MXN", "Ahorro Anual Estimado MXN", "Retorno ROI Anos", "Hilos Acometida", "Metodo Pago Deseado", "Estatus del Expediente", "Usuario Acceso", "Contrasena Acceso", "Fecha Registro"].join(","),
          [
            proj.id,
            `"${proj.clientName.replace(/"/g, '""')}"`,
            `"${proj.clientPhone}"`,
            `"${proj.clientEmail || 'N/A'}"`,
            `"${proj.municipalityState.replace(/"/g, '""')}"`,
            `"${(proj.googleMapsUrl || 'N/A').replace(/"/g, '""')}"`,
            proj.averageBill || 0,
            panels,
            (panels * 0.55).toFixed(2),
            requiredArea,
            investment,
            annualSavings,
            roiYears,
            proj.wiresCount || 2,
            `"${formatPaymentMethod(proj.paymentMethodDesired)}"`,
            `"${(proj.status || 'validacion').toUpperCase()}"`,
            `"${matchedUser ? matchedUser.username : 'N/A'}"`,
            `"${matchedUser ? matchedUser.password : 'N/A'}"`,
            proj.createdDate || ''
          ].join(",")
        ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Expediente_${proj.clientName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerNotification('📊 ¡Archivo Excel / CSV descargado exitosamente!');
  };

  const exportProjectToImage = async (proj: SolarProject, matchedUser?: any) => {
    triggerNotification('⏳ Generando y descargando imagen completa con todas las evidencias...');
    try {
      const creatorUser = users?.find((u: any) => u.id === proj.createdBy || u.fullName === proj.advisorName);
      const advName = proj.advisorName || creatorUser?.fullName || currentUser?.fullName || 'Asesor Verde Solux';
      const advPhone = proj.advisorPhone || creatorUser?.whatsapp || currentUser?.whatsapp || '229 343 3597';

      const advisorObj = {
        fullName: advName,
        phone: advPhone
      };

      const success = await exportProjectDossierImage(proj, advisorObj, matchedUser, soluxConfig);
      if (success) {
        triggerNotification('🖼️ ¡Imagen descargada con todos los datos y evidencias!');
      } else {
        triggerNotification('⚠️ Error al generar la imagen de la cotización.');
      }
    } catch (e) {
      console.error('Error al generar imagen:', e);
      triggerNotification('⚠️ Error al generar imagen.');
    }
    return;
  };

  const _legacyExportProjectToImage = (proj: SolarProject, matchedUser?: any) => {
    const creatorUser = users?.find((u: any) => u.id === proj.createdBy || u.fullName === proj.advisorName);
    const advName = proj.advisorName || creatorUser?.fullName || currentUser?.fullName || 'Asesor Verde Solux';
    const advPhone = proj.advisorPhone || creatorUser?.whatsapp || currentUser?.whatsapp || '';

    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1100;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderCanvas = (logoImg?: HTMLImageElement) => {
      // 1. Pure White Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 800, 1100);

      // 2. Draw House watermark in the center of the canvas
      ctx.save();
      ctx.strokeStyle = '#10b981';
      ctx.globalAlpha = 0.04;
      ctx.lineWidth = 2.5;
      
      ctx.beginPath();
      ctx.moveTo(150, 650);
      ctx.lineTo(400, 400);
      ctx.lineTo(650, 650);
      ctx.lineTo(580, 650);
      ctx.lineTo(580, 850);
      ctx.lineTo(220, 850);
      ctx.lineTo(220, 650);
      ctx.closePath();
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(400, 430);
      ctx.lineTo(580, 610);
      ctx.lineTo(540, 610);
      ctx.lineTo(360, 430);
      ctx.closePath();
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(380, 430); ctx.lineTo(560, 610);
      ctx.moveTo(400, 410); ctx.lineTo(540, 550);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(220, 400, 40, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(220 + Math.cos(angle) * 55, 400 + Math.sin(angle) * 55);
        ctx.lineTo(220 + Math.cos(angle) * 70, 400 + Math.sin(angle) * 70);
        ctx.stroke();
      }
      ctx.restore();

      // 3. Draw Header
      if (logoImg) {
        try {
          ctx.drawImage(logoImg, 50, 35, 150, 60);
        } catch (e) {
          ctx.fillStyle = '#022c22';
          ctx.font = '900 28px sans-serif';
          ctx.fillText('SOLUX GREEN', 50, 75);
        }
      } else {
        ctx.fillStyle = '#022c22';
        ctx.font = '900 28px sans-serif';
        ctx.fillText('SOLUX GREEN', 50, 75);
      }

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('ENERGÍA INTELIGENTE, FUTURO SUSTENTABLE', 50, 115);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#022c22';
      ctx.font = '900 22px sans-serif';
      ctx.fillText('PROPUESTA SOLAR', 750, 65);

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('COTIZACIÓN DE ENERGÍA RENOVABLE', 750, 85);

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`FECHA: ${new Date().toLocaleDateString('es-MX')}`, 750, 105);
      ctx.textAlign = 'left';

      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(50, 135);
      ctx.lineTo(750, 135);
      ctx.stroke();

      // 4. Section 1: General Info
      ctx.fillStyle = '#475569';
      ctx.font = '900 11px sans-serif';
      ctx.fillText('1. DATOS GENERALES DEL CLIENTE', 50, 168);

      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(50, 180, 700, 135, 10);
      } else {
        ctx.rect(50, 180, 700, 135);
      }
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#10b981';
      ctx.fillRect(50, 180, 5, 135);

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('NOMBRE O RAZÓN SOCIAL:', 80, 208);
      ctx.fillText('TELÉFONO DE REGISTRO:', 80, 235);
      ctx.fillText('UBICACIÓN / ESTADO:', 80, 262);
      ctx.fillText('ASESOR ATENDIENDO:', 80, 289);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(proj.clientName.toUpperCase(), 280, 208);
      ctx.fillText(proj.clientPhone || 'No registrado', 280, 235);
      ctx.fillText((proj.municipalityState || 'No especificado').toUpperCase(), 280, 262);

      ctx.fillStyle = '#059669';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(`${advName.toUpperCase()} ${advPhone ? `(TEL/WA: ${advPhone})` : ''}`, 280, 289);

      // 5. Section 2: Technical Info
      ctx.fillStyle = '#475569';
      ctx.font = '900 11px sans-serif';
      ctx.fillText('2. DETALLES TÉCNICOS Y RENDIMIENTO SOLAR', 50, 338);

      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(50, 350, 700, 130, 10);
      } else {
        ctx.rect(50, 350, 700, 130);
      }
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#10b981';
      ctx.fillRect(50, 350, 5, 130);

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('FACTURA CFE BIMESTRAL:', 80, 385);
      ctx.fillText('SISTEMA FOTOVOLTAICO ESTIMADO:', 80, 415);
      ctx.fillText('ÁREA MÍNIMA REQUERIDA:', 80, 445);
      ctx.fillText('ACOMETIDA:', 430, 445);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(`$${(proj.averageBill || 0).toLocaleString('es-MX')} MXN`, 330, 385);
      
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`${proj.estimatedPanels || 4} PANELES SOLARES DE ALTO RENDIMIENTO`, 330, 415);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(`${proj.requiredArea ? proj.requiredArea.toFixed(2) : ((proj.estimatedPanels || 4) * 2.88).toFixed(2)} m²`, 330, 445);
      ctx.fillText(`${proj.wiresCount || 2} Hilos (${proj.wiresCount === 2 ? 'Monofásico 110V' : proj.wiresCount === 3 ? 'Bifásico 220V' : 'Trifásico'})`, 640, 445);

      // 6. Section 3: Commercial Proposal
      ctx.fillStyle = '#475569';
      ctx.font = '900 11px sans-serif';
      ctx.fillText('3. PROPUESTA ECONÓMICA Y FINANCIAMIENTO', 50, 518);

      const ecoGrad = ctx.createLinearGradient(50, 530, 750, 530);
      ecoGrad.addColorStop(0, '#064e3b');
      ecoGrad.addColorStop(1, '#022c22');
      ctx.fillStyle = ecoGrad;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(50, 530, 700, 100, 10);
      } else {
        ctx.rect(50, 530, 700, 100);
      }
      ctx.fill();

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('INVERSIÓN TOTAL PROYECTADA (NETA)', 80, 565);
      ctx.fillText('MÉTODO DE ADQUISICIÓN:', 430, 565);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 24px sans-serif';
      ctx.fillText(`$${(proj.totalInvestment || ((proj.estimatedPanels || 4) * 14500)).toLocaleString('es-MX')} MXN`, 80, 595);

      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(formatPaymentMethod(proj.paymentMethodDesired).toUpperCase(), 430, 595);

      if (matchedUser) {
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#e2e8f0';
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(50, 645, 700, 75, 10);
        } else {
          ctx.rect(50, 645, 700, 75);
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#10b981';
        ctx.fillRect(50, 645, 5, 75);

        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText('ACCESO AL PORTAL DE CLIENTE ASIGNADO:', 75, 670);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(`USUARIO: ${matchedUser.username}`, 75, 695);
        
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(`CONTRASEÑA: ${matchedUser.password}`, 380, 695);
      } else {
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#e2e8f0';
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(50, 645, 700, 75, 10);
        } else {
          ctx.rect(50, 645, 700, 75);
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#64748b';
        ctx.fillRect(50, 645, 5, 75);

        ctx.fillStyle = '#475569';
        ctx.font = 'bold 9.5px sans-serif';
        ctx.fillText('NOTAS DE ADQUISICIÓN:', 75, 672);
        ctx.font = 'medium 9px sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText('* Retorno estimado de inversión acelerado. Permite ahorro de hasta el 98% del consumo histórico CFE.', 75, 690);
        ctx.fillText('* Los precios no incluyen IVA y están sujetos a cambio según condiciones del mercado y levantamiento técnico.', 75, 705);
      }

      // 7. Bottom Contact Columns (Exact replica of letterhead)
      const dividerY = 745;
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(50, dividerY);
      ctx.lineTo(750, dividerY);
      ctx.stroke();

      const c1 = 110, c2 = 310, c3 = 510, c4 = 710;
      const iconsY = 785;

      drawCircleIcon(c1, iconsY, 'whatsapp');
      drawCircleIcon(c2, iconsY, 'correo');
      drawCircleIcon(c3, iconsY, 'sitio');
      drawCircleIcon(c4, iconsY, 'direccion');

      drawCenteredText('WHATSAPP', c1, iconsY + 30, '900 9px sans-serif', '#022c22');
      drawCenteredText('CORREO', c2, iconsY + 30, '900 9px sans-serif', '#022c22');
      drawCenteredText('SITIO WEB', c3, iconsY + 30, '900 9px sans-serif', '#022c22');
      drawCenteredText('DIRECCIÓN', c4, iconsY + 30, '900 9px sans-serif', '#022c22');

      drawCenteredText('229 343 3597', c1, iconsY + 45, 'bold 10px sans-serif', '#475569');
      drawCenteredText('director@massmercadeo.com.mx', c2, iconsY + 45, 'bold 8px sans-serif', '#475569');
      drawCenteredText('soluxgreen.com.mx', c3, iconsY + 45, 'bold 10px sans-serif', '#475569');
      
      drawCenteredText('Velázquez de la Cadena 401 Int. 9,', c4, iconsY + 45, 'bold 8px sans-serif', '#475569');
      drawCenteredText('Centro, CP 91700, Veracruz, Ver.', c4, iconsY + 56, 'bold 8px sans-serif', '#475569');

      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(210, iconsY - 15); ctx.lineTo(210, iconsY + 60);
      ctx.moveTo(410, iconsY - 15); ctx.lineTo(410, iconsY + 60);
      ctx.moveTo(610, iconsY - 15); ctx.lineTo(610, iconsY + 60);
      ctx.stroke();

      // 8. Curved Footer bar (Exact replica with green wave & leaf)
      const footerStartY = 970;

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.moveTo(0, footerStartY - 5);
      ctx.quadraticCurveTo(400, footerStartY - 25, 800, footerStartY - 5);
      ctx.lineTo(800, 1100);
      ctx.lineTo(0, 1100);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#011f2d';
      ctx.beginPath();
      ctx.moveTo(0, footerStartY + 2);
      ctx.quadraticCurveTo(400, footerStartY - 18, 800, footerStartY + 2);
      ctx.lineTo(800, 1100);
      ctx.lineTo(0, 1100);
      ctx.closePath();
      ctx.fill();

      ctx.save();
      ctx.translate(730, 1035);
      ctx.rotate(-Math.PI / 10);
      ctx.fillStyle = '#10b981';
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-15, -15, -15, -40, 20, -50);
      ctx.bezierCurveTo(25, -25, 15, -5, 0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText('Solux Green es una marca del Grupo Mass Mercadeo, Fielder Master Nacional Telmex', 400, 1030);

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 8px sans-serif';
      ctx.fillText('ESTA SIMULACIÓN TIENE CARÁCTER COMERCIAL E INFORMATIVO • SOLUX GREEN PREMIUM 2026', 400, 1070);
      ctx.restore();

      try {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `Cotizacion_${proj.clientName.replace(/\s+/g, '_')}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        triggerNotification('🖼️ ¡Imagen JPEG de la cotización generada y descargada!');
      } catch (err) {
        console.error('Error generating JPEG export:', err);
      }
    };

    const drawCircleIcon = (x: number, y: number, type: string) => {
      ctx.save();
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(x, y, 16, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      if (type === 'whatsapp') {
        ctx.beginPath();
        ctx.arc(x, y, 6, 0.2 * Math.PI, 1.8 * Math.PI);
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x + 4, y + 4, 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (type === 'correo') {
        ctx.beginPath();
        ctx.rect(x - 8, y - 6, 16, 11);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x - 8, y - 6);
        ctx.lineTo(x, y);
        ctx.lineTo(x + 8, y - 6);
        ctx.stroke();
      } else if (type === 'sitio') {
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(x, y, 4, 8, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x - 8, y);
        ctx.lineTo(x + 8, y);
        ctx.stroke();
      } else if (type === 'direccion') {
        ctx.beginPath();
        ctx.arc(x, y - 3, 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y + 8);
        ctx.lineTo(x - 5, y + 1);
        ctx.arc(x, y - 1, 5, Math.PI, 0);
        ctx.closePath();
        ctx.stroke();
      }
      ctx.restore();
    };

    const drawCenteredText = (text: string, x: number, y: number, font: string, color: string) => {
      ctx.save();
      ctx.fillStyle = color;
      ctx.font = font;
      ctx.textAlign = 'center';
      ctx.fillText(text, x, y);
      ctx.restore();
    };

    let isRendered = false;
    const timeoutId = setTimeout(() => {
      if (!isRendered) {
        isRendered = true;
        renderCanvas();
      }
    }, 250);

    const logoImg = new Image();
    logoImg.crossOrigin = 'anonymous';
    logoImg.onload = () => {
      clearTimeout(timeoutId);
      if (!isRendered) {
        isRendered = true;
        renderCanvas(logoImg);
      }
    };
    logoImg.onerror = () => {
      if (logoImg.src.includes(SOLUX_LOGO_URL) || logoImg.src.endsWith('/solux.png')) {
        logoImg.src = SOLUX_LOGO_FALLBACK;
      } else {
        clearTimeout(timeoutId);
        if (!isRendered) {
          isRendered = true;
          renderCanvas();
        }
      }
    };
    logoImg.src = SOLUX_LOGO_URL;
  };

  const shareProjectOnWhatsApp = (proj: SolarProject, matchedUser?: any) => {
    const panels = proj.estimatedPanels || 4;
    const investment = proj.totalInvestment || (panels * activePanelPrice);
    const averageBill = proj.averageBill || 0;
    const credentialText = matchedUser 
      ? `\n\n🔐 *Acceso a tu Portal de Cliente:* \n🌐 Link: ${window.location.origin}\n👤 Usuario: *${matchedUser.username}*\n🔑 Contraseña: *${matchedUser.password}*`
      : '';

    const message = `☀️ *PROPUESTA COMERCIAL - SOLUX GREEN* ☀️

Hola *${proj.clientName}*, un gusto saludarte. Te comparto el resumen de tu diagnóstico solar personalizado:

📈 *Consumo Bimestral Promedio CFE:* $${averageBill.toLocaleString('es-MX')} MXN
⚡ *Sistema Fotovoltaico Recomendado:* *${panels} Paneles Solares*
📐 *Área Requerida Mínima:* *${(proj.requiredArea || (panels * 2.88)).toFixed(2)} m²*
🌱 *Reducción de Co2 Estimada:* *98% de ahorro bimestral*

${buildWhatsAppFinancialSummary(
  investment,
  proj.paymentMethodDesired,
  soluxConfig.monthlyInterestRate,
  soluxConfig.defaultDownPaymentPercent || 50
)}${credentialText}

📍 *Ubicación del Proyecto:* ${proj.municipalityState}

*¡Comienza a ahorrar y genera tu propia energía limpia hoy mismo con Solux Green!* 🌍🍃`;

    const encodedText = encodeURIComponent(message);
    let cleanPhone = (proj.clientPhone || '').replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = '52' + cleanPhone;
    }
    
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
    triggerNotification('💬 Abriendo chat de WhatsApp para compartir cotización...');
  };

  const exportAllToExcel = (projects: SolarProject[]) => {
    const headers = ["ID Expediente", "Cliente", "Telefono", "Correo", "Municipio", "Consumo Bimestral", "Paneles", "Inversion", "Hilos", "Metodo Pago", "Estatus", "Usuario Acceso", "Contrasena Acceso", "Fecha"];
    const rows = projects.map(proj => {
      const creds = getClientCredentials(proj, users);
      return [
        proj.id,
        `"${proj.clientName.replace(/"/g, '""')}"`,
        `"${proj.clientPhone}"`,
        `"${proj.clientEmail || 'N/A'}"`,
        `"${proj.municipalityState.replace(/"/g, '""')}"`,
        proj.averageBill,
        proj.estimatedPanels || 2,
        proj.totalInvestment,
        proj.wiresCount,
        `"${formatPaymentMethod(proj.paymentMethodDesired)}"`,
        `"${proj.status.toUpperCase()}"`,
        `"${creds.username}"`,
        `"${creds.password}"`,
        proj.createdDate || ''
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Todos_Los_Expedientes_Prospectos.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportAllToPDF = async (projects: SolarProject[]) => {
    try {
      triggerNotification('⏳ Generando reporte general en PDF...');
      const success = await exportProjectsListPDF(projects, 'Reporte General de Expedientes (Comercial)');
      if (success) {
        triggerNotification('📄 Reporte PDF descargado directamente a tu equipo.');
      } else {
        triggerNotification('⚠️ Error al generar el reporte PDF.');
      }
    } catch (e) {
      console.error('Error al generar PDF general:', e);
      triggerNotification('⚠️ Error al generar el reporte PDF.');
    }
  };

  // Share proposal generator (Requirement 2.1)
  const handleShareWhatsApp = (proj: SolarProject) => {
    const text = `☀️ *SOLUX GREEN - PROPUESTA COMERCIAL DE ENERGÍA LIMPIA* ☀️
Hola ${proj.clientName}, hemos calculado tu cotización inteligente:

📊 *Detalles del Sistema:*
• Paneles Recomendados: ${proj.estimatedPanels} módulos solares.
• Área Requerida en Azotea: ${proj.requiredArea} m²
• Inversión de Contado: $${proj.totalInvestment.toLocaleString('es-MX')} MXN

🌱 *Ahorro Estimado:*
• Reducción de cargo bimestral de CFE a tarifa mínima (Ahorro de hasta el 98%).

📌 _¿Te interesa financiarlo? Contamos con crédito directo Solux de 3 y 6 meses sin revisar buró de crédito._ ¡Comencemos tu transición verde! 🍃`;

    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/${formatWhatsAppPhone(proj.clientPhone)}?text=${encodedText}`, '_blank');
  };

  // Filter project list
  const filteredProjects = userSolarProjects.filter(p => {
    const matchesSearch = p.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.clientPhone.includes(searchTerm) || 
                          p.municipalityState.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' ? true : (
      statusFilter === 'validacion'
        ? (p.status === 'validacion' || p.status === 'validado')
        : p.status === statusFilter
    );
    return matchesSearch && matchesStatus;
  });

  const enlaceUsers = React.useMemo(() => {
    const list = (users || []).filter(u => u.role === 'enlace');
    if (list.length > 0) return list;
    return [
      { id: 'usr_3', username: 'enlace1', fullName: 'Asesor de Enlace CDMX', role: 'enlace', phone: '55-9012-3456', whatsapp: '5590123456', referralCode: 'SOCIO-889-MX' }
    ];
  }, [users]);

  // Handler for recommending a client to an Enlace
  const handleRecomendarAEnlace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recEnlaceId) {
      alert('⚠️ Por favor selecciona el Enlace al que deseas recomendar este cliente.');
      return;
    }

    const matchedEnlace = enlaceUsers.find(u => u.id === recEnlaceId || u.username === recEnlaceId) || (users || []).find(u => u.id === recEnlaceId || u.username === recEnlaceId);
    if (!matchedEnlace) {
      alert('⚠️ No se encontró la información del Enlace seleccionado.');
      return;
    }

    const enlaceName = matchedEnlace.fullName || matchedEnlace.username || 'Socio Enlace';
    const enlacePhone = matchedEnlace.whatsapp || matchedEnlace.phone || '';
    const enlaceCode = matchedEnlace.referralCode || `SOCIO-${(matchedEnlace.id || '889').slice(-3).toUpperCase()}-MX`;

    if (recMode === 'existing') {
      if (!recExistingProjectId) {
        alert('⚠️ Selecciona el prospecto existente que deseas vincular y recomendar a este Enlace.');
        return;
      }
      const existingProj = userSolarProjects.find(p => p.id === recExistingProjectId);
      if (!existingProj) return;

      const updatedData: Partial<SolarProject> = {
        assignedEnlaceId: matchedEnlace.id,
        enlaceName: enlaceName,
        referrerCode: enlaceCode,
        isRecommendedByAdvisor: true,
        advisorName: currentUser?.fullName || currentUser?.username || 'Asesor Verde',
        advisorPhone: currentUser?.whatsapp || currentUser?.phone || '229 343 3597',
        recommendationNotes: recNotes.trim() || 'Cliente recomendado por el Asesor Verde para atención en comunidad.',
      };

      onUpdateSolarProject(existingProj.id, updatedData);

      if (onTriggerNotification) {
        await onTriggerNotification(
          '🌱 Nueva Recomendación de Cliente Asignada',
          `El Asesor Verde ${currentUser?.fullName || 'Comercial'} te ha recomendado al cliente ${existingProj.clientName} (${existingProj.clientPhone || existingProj.whatsappPhone || 'Sin tel'}, ${existingProj.municipalityState || 'Sin ubicación'}).`,
          'enlace',
          matchedEnlace.id
        );
      }

      const matchedExistingUser = users?.find(
        (u: any) => u.solarProjectId === existingProj.id || u.username === existingProj.clientName.toLowerCase().replace(/[^a-z0-9]/g, '')
      );

      setRecSuccessModal({
        clientName: existingProj.clientName,
        enlaceName,
        enlacePhone,
        projectId: existingProj.id,
        project: { ...existingProj, ...updatedData },
        matchedUser: matchedExistingUser
      });

      triggerNotification(`✅ ¡Prospecto "${existingProj.clientName}" recomendado al Enlace ${enlaceName} con éxito!`);
      // Reset form
      setRecExistingProjectId('');
      setRecNotes('');
      return;
    }

    // Modo nuevo prospecto recomendado
    if (!recClientName.trim() || !recClientPhone.trim() || !recClientCity.trim() || !recClientBill) {
      alert('⚠️ Por favor completa todos los campos obligatorios del cliente.');
      return;
    }

    const billNum = Number(recClientBill) || 2500;
    const rawPanels = (billNum / 1000) * 2;
    const dec = rawPanels - Math.floor(rawPanels);
    const estPanels = Math.max(1, dec >= 0.1 ? Math.ceil(rawPanels) : Math.floor(rawPanels));
    const reqArea = Number((estPanels * 2.88).toFixed(2));
    const estInvest = estPanels * activePanelPrice;
    const newProjId = 'SOL-' + Date.now().toString().slice(-6);

    const newProject: SolarProject = {
      id: newProjId,
      clientName: recClientName.trim(),
      clientPhone: recClientPhone.trim(),
      whatsappPhone: recClientPhone.trim(),
      municipalityState: recClientCity.trim(),
      averageBill: billNum,
      estimatedPanels: estPanels,
      requiredArea: reqArea,
      totalInvestment: estInvest,
      paymentMethodDesired: 'directo',
      status: 'validacion',
      propertyOwnership: 'propietario',
      cfeStatus: 'activo_sin_adeudo',
      metersCount: 1,
      electricalLoadType: estPanels > 4 ? ['220V'] : ['110V'],
      voltageAlert220v: estPanels > 4,
      voltageUpgradeQuoted: false,
      availableSpace: reqArea > 0 ? reqArea : 30,
      siteSurveyPaid: false,
      siteSurveyStatus: 'pendiente',
      createdDate: new Date().toISOString().split('T')[0],
      createdBy: currentUser?.id || currentUser?.username || 'comercial',
      assignedEnlaceId: matchedEnlace.id,
      enlaceName: enlaceName,
      referrerCode: enlaceCode,
      isRecommendedByAdvisor: true,
      advisorName: currentUser?.fullName || currentUser?.username || 'Asesor Verde',
      advisorPhone: currentUser?.whatsapp || currentUser?.phone || '229 343 3597',
      recommendationNotes: recNotes.trim() || 'Cliente nuevo recomendado por el Asesor Verde para seguimiento local en comunidad.',
      payments: [],
      evidence: {}
    };

    onAddSolarProject(newProject);

    // Sync client user account
    const generatedUsername = recClientName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15) || `usr_${Date.now()}`;
    const generatedPassword = 'Solux2026!';
    const newClientUser = {
      id: `usr_client_${Date.now()}`,
      username: generatedUsername,
      email: `${generatedUsername}@soluxgreen.com.mx`,
      password: generatedPassword,
      role: 'client' as const,
      fullName: recClientName.trim(),
      whatsapp: recClientPhone.trim(),
      solarProjectId: newProjId
    };

    if (onUpdateUsers) {
      onUpdateUsers([newClientUser, ...(users || [])]);
    }

    if (onTriggerNotification) {
      await onTriggerNotification(
        '🌱 Nueva Recomendación de Cliente Asignada',
        `El Asesor Verde ${currentUser?.fullName || 'Comercial'} te ha asignado al cliente ${newProject.clientName} (${newProject.clientPhone}, ${newProject.municipalityState}) para contacto, gestión y comisiones.`,
        'enlace',
        matchedEnlace.id
      );
    }

    setRecSuccessModal({
      clientName: newProject.clientName,
      enlaceName,
      enlacePhone,
      projectId: newProjId,
      project: newProject,
      matchedUser: newClientUser
    });

    triggerNotification(`✅ ¡Cliente "${newProject.clientName}" recomendado al Enlace ${enlaceName}! Se le notificó en el sistema.`);
    // Reset form
    setRecClientName('');
    setRecClientPhone('');
    setRecClientCity('');
    setRecClientBill('');
    setRecNotes('');
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
    <div className="flex flex-col lg:flex-row h-screen text-slate-800 font-sans w-full overflow-hidden bg-[#FAFBFC]" id="commercial-module-root">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[10100] px-5 py-3 rounded-2xl shadow-xl text-xs font-black bg-emerald-600 text-white shadow-emerald-100 flex items-center gap-2.5"
          >
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-slate-200 p-6 shrink-0 justify-between h-full overflow-y-auto">
        <div className="space-y-8">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
            <SoluxLogo />
            <div>
              <span className="text-sm font-black tracking-tight text-slate-900 block">SOLUX GREEN</span>
              <span className="text-[9px] text-[#10B981] font-black tracking-widest uppercase">ASESOR COMERCIAL</span>
            </div>
          </div>

          {/* Current User Profile Widget */}
          <div 
            onClick={() => setActiveTab('perfil')}
            className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'perfil' 
                ? 'bg-[#10B981]/10 border-emerald-200/80 text-emerald-800 shadow-xs' 
                : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
              <img 
                src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.fullName || 'Asesor')}&background=10B981&color=fff&size=80&bold=true`} 
                alt="My profile" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[9px] font-black uppercase text-[#10B981] block tracking-wider font-mono">Sesión Activa</span>
              <span className="text-xs font-black block truncate leading-tight text-slate-800">{currentUser?.fullName || 'Asesor Verde'}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-extrabold tracking-tight transition-all cursor-pointer border ${
                activeTab === 'pipeline' 
                  ? 'bg-[#10B981]/10 text-emerald-800 border-emerald-100/80 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border-transparent'
              }`}
            >
              <Users className="w-4.5 h-4.5 shrink-0" />
              <span className="flex items-center justify-between w-full">
                <span>Mis Prospectos</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === 'pipeline'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {userSolarProjects.length}
                </span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('nuevo')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-extrabold tracking-tight transition-all cursor-pointer border ${
                activeTab === 'nuevo' 
                  ? 'bg-[#10B981]/10 text-emerald-800 border-emerald-100/80 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border-transparent'
              }`}
            >
              <Plus className="w-4.5 h-4.5" />
              <span>Registrar Prospecto</span>
            </button>

            <button
              onClick={() => setActiveTab('cotizador')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-extrabold tracking-tight transition-all cursor-pointer border ${
                activeTab === 'cotizador' 
                  ? 'bg-[#10B981]/10 text-emerald-800 border-emerald-100/80 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border-transparent'
              }`}
            >
              <Percent className="w-4.5 h-4.5" />
              <span>Cotizador Exprés & Crédito</span>
            </button>

            <button
              onClick={() => setActiveTab('enlaces')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-extrabold tracking-tight transition-all cursor-pointer border ${
                activeTab === 'enlaces' 
                  ? 'bg-pink-50 text-pink-700 border-pink-200 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4.5 h-4.5 text-pink-600" />
                <span>Red de Enlaces</span>
              </div>
              {enlaceUsers.length > 0 && (
                <span className="text-[10px] font-mono font-bold bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">
                  {enlaceUsers.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('recomendar')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-extrabold tracking-tight transition-all cursor-pointer border ${
                activeTab === 'recomendar' 
                  ? 'bg-[#10B981]/10 text-emerald-800 border-emerald-100/80 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border-transparent'
              }`}
            >
              <Share2 className="w-4.5 h-4.5" />
              <span>+ Recomendar a Enlace</span>
            </button>

            <button
              onClick={() => setActiveTab('perfil')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-extrabold tracking-tight transition-all cursor-pointer border ${
                activeTab === 'perfil' 
                  ? 'bg-[#10B981]/10 text-emerald-800 border-emerald-100/80 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border-transparent'
              }`}
            >
              <User className="w-4.5 h-4.5" />
              <span>Mi Perfil</span>
            </button>

            <button
              onClick={() => setActiveTab('promocionales')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-extrabold tracking-tight transition-all cursor-pointer border ${
                activeTab === 'promocionales' 
                  ? 'bg-[#10B981]/10 text-emerald-800 border-emerald-100/80 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border-transparent'
              }`}
            >
              <Award className="w-4.5 h-4.5" />
              <span>Material Promocional</span>
            </button>

            <button
              onClick={() => setActiveTab('notificaciones')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-extrabold tracking-tight transition-all cursor-pointer border relative ${
                activeTab === 'notificaciones' 
                  ? 'bg-[#10B981]/10 text-emerald-800 border-emerald-100/80 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border-transparent'
              }`}
            >
              <Bell className="w-4.5 h-4.5" />
              <span>Notificaciones</span>
              {notifications.filter(n => !n.isRead && (n.role === 'all' || n.role === 'comercial')).length > 0 && (
                <span className="absolute right-4 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
              )}
            </button>
          </div>
        </div>

        {onExit && (
          <button
            onClick={onExit}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 rounded-xl text-xs font-extrabold transition-all cursor-pointer"
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
              <span className="text-xs sm:text-sm font-black tracking-tight text-slate-900 block uppercase truncate">Asesor Verde Panel</span>
              <span className="text-[8px] text-emerald-600 font-black tracking-widest uppercase block mt-0.5">DASHBOARD</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => {
                generateSystemFlowPDF(
                  () => triggerNotification('📄 ¡Flujo del Sistema descargado exitosamente en PDF!'),
                  (err) => triggerNotification(`⚠️ ${err}`)
                );
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-xs shadow-emerald-600/20 border border-emerald-500"
              title="Descargar Manual y Flujo Operativo Completo en PDF para el Cliente"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Flujo del Sistema (PDF)</span>
              <span className="md:hidden">Flujo PDF</span>
            </button>

            <div className={`flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border text-[9px] font-black uppercase shrink-0 ${
              isOfflineMode 
                ? 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse' 
                : 'bg-emerald-50 text-emerald-700 border-emerald-100'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isOfflineMode ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
              <span className="hidden xs:inline sm:inline">{isOfflineMode ? 'Captura Offline' : 'Online'}</span>
            </div>

            <NotificationsBell
              notifications={notifications}
              role="comercial"
              currentUser={currentUser}
              onMarkAsRead={onMarkNotificationAsRead}
              onMarkAllAsRead={onMarkAllNotificationsAsRead}
              onViewAll={() => setActiveTab('notificaciones')}
            />

            <div className="flex items-center gap-1.5 sm:gap-2 border-l border-slate-200 pl-2 sm:pl-3 ml-0.5 sm:ml-1 shrink-0">
              <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                <img 
                  src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.fullName || 'Asesor')}&background=10B981&color=fff&size=80&bold=true`} 
                  alt="Perfil" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-[10px] font-black text-slate-800 truncate max-w-[60px] sm:max-w-[150px] uppercase tracking-tight hidden sm:inline">{currentUser?.fullName || 'Asesor Verde'}</span>
            </div>
          </div>
        </header>

        {/* WORKSPACE CONTENT */}
        <main className="flex-1 overflow-y-auto px-4 md:px-6 py-6 pb-24 lg:pb-6" id="commercial-main-viewport">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              
              {/* ------------------- TAB 1: PIPELINE & HISTORIAL PERMANENTE ------------------- */}
              {activeTab === 'pipeline' && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h2 className="text-base font-black uppercase text-slate-900">Historial Permanente de Prospectos</h2>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs">
                          {userSolarProjects.length} Registrados
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Busca y monitorea el avance del expediente y viabilidad técnica</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
                      <button
                        onClick={() => exportAllToPDF(filteredProjects)}
                        className="px-2.5 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-1 shrink-0"
                      >
                        📄 PDF
                      </button>
                      <button
                        onClick={() => exportAllToExcel(filteredProjects)}
                        className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-1 shrink-0"
                      >
                        📊 Excel
                      </button>
                      <input
                        type="text"
                        placeholder="Buscar por cliente, teléfono o ciudad..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold w-full sm:w-48"
                      />
                      <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                      >
                        <option value="todos">Todos los Estatus ({userSolarProjects.length})</option>
                        <option value="validacion">Validación</option>
                        <option value="levantamiento_tecnico">Levantamiento</option>
                        <option value="instalacion">Instalación</option>
                        <option value="tramite_cfe">Trámite CFE</option>
                        <option value="operacion">Operación</option>
                      </select>
                      <span className="text-[10px] font-black uppercase text-slate-400 px-2 py-1 bg-white border border-slate-200 rounded-lg">
                        {filteredProjects.length} / {userSolarProjects.length}
                      </span>
                    </div>
                  </div>

                  {/* List of prospects with custom header cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProjects.map((proj, idx) => (
                      <div 
                        key={`proj_card_${proj.id || 'p'}_${idx}`}
                        className="bg-white border border-slate-200/80 hover:border-emerald-300 rounded-3xl p-5 shadow-xs space-y-4 hover:shadow-md transition-all relative overflow-hidden"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h3 className="font-extrabold text-sm text-slate-900">{proj.clientName}</h3>
                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{proj.clientPhone}</span>
                          </div>
                          
                          <div className="flex flex-col items-end gap-1">
                            <select
                              value={proj.status || 'validacion'}
                              onChange={(e) => {
                                const newStatus = e.target.value;
                                if (['validado', 'cotizacion_enviada', 'cotizacion_final', 'firma_contrato'].includes(newStatus)) {
                                  openAuthorizationModal(proj, newStatus);
                                } else {
                                  onUpdateSolarProject(proj.id, { status: newStatus });
                                  triggerNotification(`✅ Estatus de "${proj.clientName}" actualizado a: ${newStatus.toUpperCase()}`);
                                }
                              }}
                              className={`text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded-lg border cursor-pointer font-mono outline-none transition-all shadow-2xs ${
                                proj.status === 'validado' || proj.status === 'validacion'
                                  ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                                  : proj.status === 'cotizacion_enviada'
                                  ? 'bg-purple-600 text-white border-purple-700 hover:bg-purple-700'
                                  : proj.status === 'levantamiento_tecnico' || proj.status === 'levantamiento'
                                  ? 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600'
                                  : proj.status === 'cotizacion_final'
                                  ? 'bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700'
                                  : proj.status === 'firma_contrato' || proj.status === 'contrato'
                                  ? 'bg-rose-600 text-white border-rose-700 hover:bg-rose-700'
                                  : proj.status === 'instalacion'
                                  ? 'bg-orange-600 text-white border-orange-700 hover:bg-orange-700'
                                  : proj.status === 'tramite_cfe' || proj.status === 'interconexion'
                                  ? 'bg-teal-600 text-white border-teal-700 hover:bg-teal-700'
                                  : proj.status === 'operacion'
                                  ? 'bg-sky-600 text-white border-sky-700 hover:bg-sky-700'
                                  : 'bg-slate-900 text-white border-slate-800 hover:bg-slate-800'
                              }`}
                              title="Cambiar estatus del prospecto"
                            >
                              <option value="validacion" className="bg-slate-900 text-white font-bold">Validación</option>
                              <option value="validado" className="bg-slate-900 text-white font-bold">Validado / Viable</option>
                              <option value="cotizacion_enviada" className="bg-slate-900 text-white font-bold">Cotización Enviada</option>
                              <option value="levantamiento_tecnico" className="bg-slate-900 text-white font-bold">Levantamiento Técnico</option>
                              <option value="cotizacion_final" className="bg-slate-900 text-white font-bold">Cotización Final</option>
                              <option value="firma_contrato" className="bg-slate-900 text-white font-bold">Firma de Contrato</option>
                              <option value="instalacion" className="bg-slate-900 text-white font-bold">Instalación</option>
                              <option value="tramite_cfe" className="bg-slate-900 text-white font-bold">Trámite CFE</option>
                              <option value="operacion" className="bg-slate-900 text-white font-bold">Operación</option>
                              <option value="desactivado" className="bg-slate-900 text-white font-bold">Desactivado</option>
                            </select>

                            <div className="flex items-center gap-1">
                              {proj.status !== 'validado' && (
                                <button
                                  type="button"
                                  onClick={() => openAuthorizationModal(proj, 'validado')}
                                  className="text-[8px] font-black uppercase tracking-wider bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-md flex items-center gap-1 transition-all cursor-pointer"
                                  title="Autorizar este prospecto y generar credenciales para WhatsApp"
                                >
                                  <CheckCircle className="w-2.5 h-2.5 text-emerald-600" /> Validar
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => openAuthorizationModal(proj, proj.status || 'validado')}
                                className="text-[8px] font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-700 px-2 py-0.5 rounded-md flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                                title="Enviar Cotización Autorizada, Credenciales y Link por WhatsApp"
                              >
                                <Send className="w-2.5 h-2.5" /> Cotización WA
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl text-[10px] font-mono">
                          <div>
                            <span className="text-slate-400 font-sans block text-[8px] uppercase">Factura Promedio</span>
                            <span className="font-extrabold text-slate-800">${proj.averageBill.toLocaleString('es-MX')} MXN</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-sans block text-[8px] uppercase">Paneles Calculados</span>
                            <span className="font-extrabold text-slate-800">{proj.estimatedPanels} módulos</span>
                          </div>
                        </div>

                        {/* Survey Status info */}
                        <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-100">
                          <span className="text-slate-400 font-bold">Levantamiento Físico:</span>
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                            proj.siteSurveyStatus === 'concluido'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}>
                            {proj.siteSurveyStatus === 'concluido' ? 'Concluido' : 'Pendiente/En Proceso'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <button
                            onClick={() => setSelectedProject(proj)}
                            className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-[10px] uppercase tracking-wider rounded-xl text-center"
                          >
                            Ver Expediente
                          </button>

                          <button
                            onClick={() => handleOpenSurveyModal(proj)}
                            className={`p-2 rounded-xl border flex items-center justify-center text-xs transition-all ${
                              proj.evidence?.technicalSurveyDoc || proj.siteSurveyStatus === 'concluido'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                            }`}
                            title="Ficha y Dictamen de Levantamiento Técnico (PDF)"
                          >
                            📋
                          </button>
                          
                          <button
                            onClick={() => {
                              const isDeactivated = proj.status === 'desactivado';
                              const newStatus = isDeactivated ? 'validacion' : 'desactivado';
                              onUpdateSolarProject(proj.id, { status: newStatus });
                              triggerNotification(isDeactivated ? '✅ Expediente activado correctamente.' : '⚠️ Expediente desactivado correctamente.');
                            }}
                            className={`p-2 rounded-xl border flex items-center justify-center text-xs ${
                              proj.status === 'desactivado'
                                ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                                : 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100'
                            }`}
                            title={proj.status === 'desactivado' ? 'Activar Expediente' : 'Desactivar Expediente'}
                          >
                            🔌
                          </button>

                          {onDeleteSolarProject && (
                            <button
                              onClick={() => {
                                if (window.confirm(`¿Estás completamente seguro de que deseas eliminar permanentemente el expediente de "${proj.clientName}"?`)) {
                                  onDeleteSolarProject(proj.id);
                                  triggerNotification('🗑️ Expediente eliminado correctamente.');
                                }
                              }}
                              className="p-2 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center"
                              title="Eliminar Expediente"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => handleShareWhatsApp(proj)}
                            className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl"
                            title="Compartir por WhatsApp"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {filteredProjects.length === 0 && (
                      <div className="col-span-full py-12 text-center bg-white border border-slate-200 rounded-3xl text-slate-400 font-bold uppercase tracking-wider text-xs">
                        Ningún prospecto coincide con la búsqueda
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ------------------- TAB 2: REGISTRAR PROSPECTO CON EXPEDIENTE DIGITAL COMPLETO (Requirement 8) ------------------- */}
              {activeTab === 'nuevo' && (
                <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-8 shadow-xs max-w-4xl mx-auto space-y-6">
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
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
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
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
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
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
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
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
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
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                          placeholder="Ej. Querétaro, Qro."
                        />
                      </div>

                      {/* Average Bill */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Monto de Pago Recibo CFE Promedio ($ MXN) *</label>
                          <span className="text-[8px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                            ☀️ Costo oficial: ${activePanelPrice.toLocaleString('es-MX')} / panel
                          </span>
                        </div>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={formBill}
                          onChange={e => setFormBill(e.target.value.replace(/[^0-9]/g, ''))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold [appearance:textfield]"
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
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold [appearance:textfield]"
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
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold [appearance:textfield]"
                          placeholder="Ej. 1"
                        />
                      </div>

                      {/* Estatus Servicio CFE */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Estatus de Servicio CFE</label>
                        <select
                          value={formCFE}
                          onChange={e => setFormCFE(e.target.value as any)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                        >
                          <option value="activo_sin_adeudo">Activo sin Adeudo</option>
                          <option value="con_adeudo">Con Adeudo</option>
                          <option value="inactivo">Inactivo / Nuevo Contrato</option>
                        </select>
                      </div>

                      {/* Validación de Propiedad */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Validación de Propiedad</label>
                        <select
                          value={formOwnership}
                          onChange={e => setFormOwnership(e.target.value as any)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                        >
                          <option value="propietario">Propietario Inmueble</option>
                          <option value="arrendatario_autorizado">Arrendatario Autorizado</option>
                        </select>
                      </div>

                      {/* Forma de Pago Deseada */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Forma de Pago de Interés</label>
                        <select
                          value={formPayMethod}
                          onChange={e => setFormPayMethod(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-hidden focus:border-emerald-500 transition-all"
                        >
                          {getPaymentMethodOptions(soluxConfig.financingTerms, soluxConfig.defaultDownPaymentPercent).map((opt, idx) => (
                            <option key={`pay_opt_${opt.value}_${idx}`} value={opt.value}>{opt.label}</option>
                          ))}
                          {!getPaymentMethodOptions(soluxConfig.financingTerms, soluxConfig.defaultDownPaymentPercent).some(o => o.value === formPayMethod) && (
                            <option key={`pay_opt_custom_${formPayMethod || 'custom'}`} value={formPayMethod}>
                              ⚙️ {formatPaymentMethod(formPayMethod)}
                            </option>
                          )}
                        </select>
                      </div>

                      {/* Selector de Asesor Verde Responsable */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-800 block">Asesor Verde Responsable (Registrador) *</label>
                        <select
                          value={formAdvisorId}
                          onChange={e => setFormAdvisorId(e.target.value)}
                          className="w-full px-3 py-2 bg-emerald-50/80 border border-emerald-300 rounded-xl font-bold text-xs text-slate-800 focus:outline-hidden"
                        >
                          <option value="">{currentUser?.fullName || currentUser?.username || 'Asesor Verde Actual'} (Sesión Activa)</option>
                          <optgroup label="🌱 Asesores Verdes Comercial">
                            {(users || []).filter(u => u.role === 'comercial' || u.role === 'admin').map((emp, idx) => (
                              <option key={`com_adv_${emp.id || 'e'}_${idx}`} value={emp.id}>
                                {emp.fullName || emp.username} ({emp.role === 'admin' ? 'Administrador' : 'Asesor Verde'})
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </div>

                      {/* Referido por */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Referido por (Empleado o Partner)</label>
                        <select
                          value={formReferrerCode}
                          onChange={e => setFormReferrerCode(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"
                        >
                          <option value="">Ninguno (Registro Directo)</option>
                          <optgroup label="👥 Empleados Solux Green">
                            {(users || []).filter(u => u.role === 'admin' || u.role === 'comercial' || u.role === 'enlace').map((emp, idx) => (
                              <option key={`com_ref_emp_${emp.id || 'e'}_${idx}`} value={emp.fullName || emp.username}>
                                {emp.fullName || emp.username} ({emp.role === 'admin' ? 'Admin' : emp.role === 'comercial' ? 'Asesor Verde' : 'Asesor Enlace'})
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="🤝 Socios Partners de Instalación">
                            {(users || []).filter(u => u.role === 'partner').map((p, idx) => (
                              <option key={`com_ref_p_${p.id || 'p'}_${idx}`} value={p.fullName || p.username}>
                                {p.fullName || p.username} (Socio Partner)
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </div>

                      {/* Electric loads (Requirements checklist selection) */}
                      <div className="space-y-1 col-span-1">
                        <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Cargas Eléctricas Deseadas (Múltiple)</label>
                        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border">
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
                                className={`text-[10px] p-1.5 rounded-lg border font-bold text-left transition-all ${
                                  hasLoad 
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                {load}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Wires */}
                      <div className="space-y-1 col-span-1">
                        <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Número de Hilos en Acometida</label>
                        <select
                          value={formWires}
                          onChange={e => setFormWires(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                        >
                          <option value={2}>2 Hilos (Monofásico 110V)</option>
                          <option value={3}>3 Hilos (Bifásico 220V)</option>
                          <option value={4}>4 Hilos (Trifásico 220V/440V)</option>
                        </select>
                      </div>
                    </div>

                    {/* Resumen Financiero Sincronizado en Tiempo Real (Cotizador Normal) */}
                    {(() => {
                      const billNum = Number(formBill) || 0;
                      const panels = calculatePanels(billNum);
                      const baseInvestment = panels * activePanelPrice;
                      const fin = calculateSoluxFinancing(baseInvestment, formPayMethod, soluxConfig);
                      const bimestralSavings = Math.round(billNum * 0.90);
                      const annualSavings = bimestralSavings * 6;
                      const roiYears = annualSavings > 0 ? (fin.isContado ? fin.netInvestment : fin.totalWithInterest) / annualSavings : 0;

                      return (
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 space-y-3 shadow-sm">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                            <div>
                              <div className="text-[11px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                                <span>🧮 Cuentas y Corrida Financiera Sincronizada</span>
                                <span className="text-[9px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full font-mono border border-emerald-500/30">
                                  {formatPaymentMethod(formPayMethod)}
                                </span>
                              </div>
                              <span className="text-[9px] text-slate-400 font-bold">
                                Costo Oficial: ${activePanelPrice.toLocaleString('es-MX')} MXN / panel (Sincronizado con Cotizador Exprés)
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] text-slate-400 uppercase font-bold block">Inversión Base ({panels} {panels === 1 ? 'Panel' : 'Paneles'})</span>
                              <span className="text-sm font-black text-white font-mono">
                                ${baseInvestment.toLocaleString('es-MX')} <span className="text-[10px] text-slate-400">MXN</span>
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                            <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/50">
                              <span className="text-[8px] text-slate-400 font-extrabold uppercase block">Generación Estimada</span>
                              <span className="text-xs font-black text-emerald-400 font-mono">
                                {((panels * 550) / 1000).toFixed(2)} kWp
                              </span>
                            </div>
                            <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/50">
                              <span className="text-[8px] text-slate-400 font-extrabold uppercase block">Enganche {fin.downPercent}%</span>
                              <span className="text-xs font-black text-amber-400 font-mono">
                                ${fin.downPayment.toLocaleString('es-MX')}
                              </span>
                            </div>
                            <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/50">
                              <span className="text-[8px] text-slate-400 font-extrabold uppercase block">
                                {fin.isContado ? 'Descuento Contado (5%)' : `${fin.months} Mensualidades`}
                              </span>
                              <span className="text-xs font-black text-sky-400 font-mono">
                                {fin.isContado 
                                  ? `-$${Math.round(baseInvestment * 0.05).toLocaleString('es-MX')}` 
                                  : `$${fin.monthlyPayment.toLocaleString('es-MX')}/mes`}
                              </span>
                            </div>
                            <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/50">
                              <span className="text-[8px] text-slate-400 font-extrabold uppercase block">Retorno Estimado</span>
                              <span className="text-xs font-black text-emerald-300 font-mono">
                                {roiYears > 0 ? `${roiYears.toFixed(1)} Años` : 'Inmediato'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Evidencia Multimedia uploads simulation */}
                    <div className="border-t pt-5 space-y-3">
                      <h3 className="text-[10px] font-black uppercase text-slate-900 tracking-wider">Carga de Evidencia Multimedia Obligatoria</h3>
                      
                      {/* Hidden inputs for file/camera upload */}
                      <input
                        type="file"
                        id="comm-file-front"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleEvidenceFileChange(e, setEvidenceReceiptFront)}
                      />
                      <input
                        type="file"
                        id="comm-camera-front"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => handleEvidenceFileChange(e, setEvidenceReceiptFront)}
                      />

                      <input
                        type="file"
                        id="comm-file-back"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleEvidenceFileChange(e, setEvidenceReceiptBack)}
                      />
                      <input
                        type="file"
                        id="comm-camera-back"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => handleEvidenceFileChange(e, setEvidenceReceiptBack)}
                      />

                      <input
                        type="file"
                        id="comm-file-facade"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleEvidenceFileChange(e, setEvidenceFacade)}
                      />
                      <input
                        type="file"
                        id="comm-camera-facade"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => handleEvidenceFileChange(e, setEvidenceFacade)}
                      />

                      <input
                        type="file"
                        id="comm-file-area"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleEvidenceFileChange(e, setEvidenceInstallArea)}
                      />
                      <input
                        type="file"
                        id="comm-camera-area"
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
                                onClick={() => document.getElementById('comm-file-front')?.click()}
                                className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[9px] uppercase tracking-wider flex items-center justify-center gap-1.5"
                              >
                                <Upload className="w-3 h-3 text-slate-500" /> Subir Archivo
                              </button>
                              <button
                                type="button"
                                onClick={() => document.getElementById('comm-camera-front')?.click()}
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
                                onClick={() => document.getElementById('comm-file-back')?.click()}
                                className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[9px] uppercase tracking-wider flex items-center justify-center gap-1.5"
                              >
                                <Upload className="w-3 h-3 text-slate-500" /> Subir Archivo
                              </button>
                              <button
                                type="button"
                                onClick={() => document.getElementById('comm-camera-back')?.click()}
                                className="py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold text-[9px] uppercase tracking-wider flex items-center justify-center gap-1.5 border border-emerald-100"
                              >
                                <Camera className="w-3 h-3 text-emerald-500" /> Tomar Foto
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Facade */}
                        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between h-44">
                          <span className="text-[8px] font-extrabold uppercase text-slate-400">Foto Fachada Calle *</span>
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
                                onClick={() => document.getElementById('comm-file-facade')?.click()}
                                className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[9px] uppercase tracking-wider flex items-center justify-center gap-1.5"
                              >
                                <Upload className="w-3 h-3 text-slate-500" /> Subir Archivo
                              </button>
                              <button
                                type="button"
                                onClick={() => document.getElementById('comm-camera-facade')?.click()}
                                className="py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold text-[9px] uppercase tracking-wider flex items-center justify-center gap-1.5 border border-emerald-100"
                              >
                                <Camera className="w-3 h-3 text-emerald-500" /> Tomar Foto
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Installation Area Photo */}
                        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between h-44">
                          <span className="text-[8px] font-extrabold uppercase text-slate-400">Foto Área de Instalación *</span>
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
                                onClick={() => document.getElementById('comm-file-area')?.click()}
                                className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[9px] uppercase tracking-wider flex items-center justify-center gap-1.5"
                              >
                                <Upload className="w-3 h-3 text-slate-500" /> Subir Archivo
                              </button>
                              <button
                                type="button"
                                onClick={() => document.getElementById('comm-camera-area')?.click()}
                                className="py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold text-[9px] uppercase tracking-wider flex items-center justify-center gap-1.5 border border-emerald-100"
                              >
                                <Camera className="w-3 h-3 text-emerald-500" /> Tomar Foto
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-slate-900 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                    >
                      {isOfflineMode ? '💾 GUARDAR EN COLA LOCAL (OFFLINE)' : '🚀 REGISTRAR PROSPECTO Y SUBIR EXPEDIENTE'}
                    </button>
                  </form>
                </div>
              )}

              {/* ------------------- TAB 3: COTIZADOR EXPRÉS & CRÉDITO INTERACTIVO (Requirements 2.2, 2.3) ------------------- */}
              {activeTab === 'cotizador' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto">
                  
                  {/* Left Column: Configurator Form */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 lg:col-span-5 shadow-xs space-y-4 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-sm font-black uppercase text-slate-950">Calculadora Solar de Paneles</h2>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Fórmula oficial de dimensionamiento Solux Green</p>
                      </div>
                      <div className="text-right bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl">
                        <span className="text-[7px] text-emerald-700 font-extrabold uppercase block tracking-wider">Costo Oficial Base</span>
                        <span className="text-[10px] font-black text-emerald-950 font-mono">${activePanelPrice.toLocaleString('es-MX')} / panel</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[9px] font-extrabold uppercase text-slate-500 block">Monto Bimestral de Luz ($ MXN)</label>
                          <span className="text-[9px] font-black text-emerald-700 font-mono">
                            {safeBill > 0 ? `$${safeBill.toLocaleString('es-MX')} MXN` : '$0 MXN'}
                          </span>
                        </div>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={calcBill === '' ? '' : calcBill}
                          onChange={e => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setCalcBill(val === '' ? '' : Number(val));
                          }}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-extrabold text-slate-800 [appearance:textfield] focus:outline-none focus:border-emerald-500 focus:bg-white text-sm"
                          placeholder="0"
                        />
                        {/* Botones de Selección Rápida de Consumo CFE */}
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
                              onClick={() => setCalcBill(chip.val)}
                              className={`px-2 py-1 rounded-lg text-[9px] font-black transition-all cursor-pointer border ${
                                Number(calcBill) === chip.val
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                              }`}
                            >
                              {chip.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-extrabold uppercase text-slate-500 block mb-1">
                          Área Mínima Requerida (Autocálculo 2.88 m²/panel)
                        </label>
                        <div className="w-full px-3 py-2 bg-emerald-50/70 border border-emerald-200/80 rounded-xl font-extrabold text-slate-800 flex items-center justify-between">
                          <span className="text-sm font-black text-emerald-900">{requiredArea} m²</span>
                          <span className="text-[8px] font-extrabold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-md uppercase tracking-wider">100% Automático</span>
                        </div>
                      </div>

                      {/* Payment Method simulation selection */}
                      <div>
                        <label className="text-[9px] font-extrabold uppercase text-slate-500 block mb-1">Esquema Financiero Deseado</label>
                        <select
                          value={calcPayMethod}
                          onChange={e => {
                            const val = e.target.value;
                            setCalcPayMethod(val);
                            isDownPaymentDirtyRef.current = false;
                            if (val.startsWith('directo_')) {
                              const parsed = parseInt(val.replace(/[^0-9]/g, ''), 10);
                              const m = !isNaN(parsed) && parsed > 0 ? parsed : 3;
                              setCalcMonths(m);
                              const matchingTerm = (soluxConfig?.financingTerms || []).find(t => t.months === m && t.active);
                              if (matchingTerm && matchingTerm.downPaymentPercent != null) {
                                setCalcDownPaymentPercent(matchingTerm.downPaymentPercent);
                              } else {
                                setCalcDownPaymentPercent(Number(soluxConfig?.defaultDownPaymentPercent) || 50);
                              }
                            } else if (val === 'msi') {
                              setCalcMonths(12);
                              setCalcDownPaymentPercent(0);
                            } else if (val === 'contado') {
                              setCalcMonths(0);
                              setCalcDownPaymentPercent(0);
                            }
                          }}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-extrabold text-slate-800 text-xs focus:outline-none focus:border-emerald-500"
                        >
                          {getPaymentMethodOptions(soluxConfig.financingTerms, soluxConfig.defaultDownPaymentPercent).map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                          {!getPaymentMethodOptions(soluxConfig.financingTerms, soluxConfig.defaultDownPaymentPercent).some(o => o.value === calcPayMethod) && (
                            <option key={calcPayMethod} value={calcPayMethod}>
                              ⚙️ {formatPaymentMethod(calcPayMethod, soluxConfig)}
                            </option>
                          )}
                        </select>
                      </div>

                      {(calcPayMethod.startsWith('directo') || calcPayMethod === 'directo') && (
                        <div className="grid grid-cols-2 gap-2 bg-emerald-50/50 p-3 rounded-2xl border border-emerald-200/70">
                          <div>
                            <label className="text-[8px] font-extrabold uppercase text-slate-600 block mb-0.5">Plazo de Pago</label>
                            <select
                              value={calcMonths}
                              onChange={e => {
                                const m = Number(e.target.value);
                                setCalcMonths(m);
                                setCalcPayMethod(`directo_${m}m`);
                                const matchingTerm = (soluxConfig.financingTerms || []).find(t => t.months === m && t.active);
                                if (matchingTerm && matchingTerm.downPaymentPercent) {
                                  setCalcDownPaymentPercent(matchingTerm.downPaymentPercent);
                                }
                              }}
                              className="w-full px-2 py-1.5 bg-white border border-emerald-300 rounded-lg text-[10px] font-bold text-slate-800 focus:outline-none"
                            >
                              {(soluxConfig.financingTerms && soluxConfig.financingTerms.length > 0
                                ? soluxConfig.financingTerms.filter(t => t.active)
                                : [
                                    { id: '1', months: 3, label: '3 Meses' },
                                    { id: '2', months: 6, label: '6 Meses' }
                                  ]
                              ).map((term, idx) => (
                                <option key={`solux_term_${term.id || term.months}_${idx}`} value={term.months}>
                                  {term.label || `${term.months} Meses`}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-0.5">
                              <label className="text-[8px] font-extrabold uppercase text-slate-600 block">Enganche (%)</label>
                              <span className="text-[8px] font-black text-emerald-700 font-mono">
                                {calcDownPaymentPercent || 0}%
                              </span>
                            </div>
                            <div className="relative">
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={calcDownPaymentPercent === '' ? '' : calcDownPaymentPercent}
                                onChange={e => {
                                  const val = e.target.value.replace(/[^0-9]/g, '');
                                  isDownPaymentDirtyRef.current = true;
                                  setCalcDownPaymentPercent(val === '' ? '' : Math.min(100, Number(val)));
                                }}
                                className="w-full pl-2 pr-6 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 [appearance:textfield]"
                                placeholder="Ej. 50"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-extrabold text-emerald-700 pointer-events-none">%</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Seleccionar/Asociar Prospecto o Ingresar Datos Directos */}
                    <div className="border-t pt-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] font-black uppercase text-indigo-700 block tracking-wider">Prospecto para Cotización</label>
                        <button
                          type="button"
                          onClick={() => {
                            setQuickName('');
                            setQuickPhone('');
                            setQuickEmail('');
                            setQuickMunicipality('Querétaro, Qro.');
                            setQuickBill(String(calcBill));
                            setIsQuickProspectOpen(true);
                          }}
                          className="text-[9px] font-black uppercase text-emerald-600 hover:text-emerald-700 tracking-wider flex items-center gap-0.5 cursor-pointer transition-all bg-emerald-50 hover:bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-100"
                        >
                          <Plus className="w-3 h-3 text-emerald-600" /> Nuevo Prospecto
                        </button>
                      </div>

                      <select
                        value={selectedSimulationClientId}
                        onChange={e => {
                          const val = e.target.value;
                          setSelectedSimulationClientId(val);
                          if (val) {
                            const proj = userSolarProjects.find(p => p.id === val);
                            if (proj) {
                              setCalcClientName(proj.clientName || '');
                              setCalcClientPhone(proj.clientPhone || proj.whatsappPhone || '');
                              setCalcClientCity(proj.municipalityState || '');
                              setCalcBill(proj.averageBill || 0);
                              setCalcSpace(proj.availableSpace || '');
                              if (proj.paymentMethodDesired) {
                                const desired = proj.paymentMethodDesired;
                                setCalcPayMethod(desired);
                                if (desired.startsWith('directo_')) {
                                  const parsed = parseInt(desired.replace(/[^0-9]/g, ''), 10);
                                  if (!isNaN(parsed) && parsed > 0) {
                                    setCalcMonths(parsed);
                                    const matchingTerm = (soluxConfig?.financingTerms || []).find(t => t.months === parsed && t.active);
                                    if (matchingTerm && matchingTerm.downPaymentPercent != null) {
                                      setCalcDownPaymentPercent(matchingTerm.downPaymentPercent);
                                    }
                                  }
                                } else if (desired === 'msi') {
                                  setCalcMonths(12);
                                  setCalcDownPaymentPercent(0);
                                } else if (desired === 'contado') {
                                  setCalcMonths(0);
                                  setCalcDownPaymentPercent(0);
                                }
                              }
                            }
                          } else {
                            setCalcClientName('');
                            setCalcClientPhone('');
                            setCalcClientCity('');
                            setCalcBill(0);
                            setCalcSpace('');
                          }
                        }}
                        className="w-full px-3 py-2 bg-indigo-50/40 border border-indigo-100 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden"
                      >
                        <option value="">-- Ingresar datos manualmente o elegir del CRM --</option>
                        {userSolarProjects.map((p, idx) => (
                          <option key={`calc_proj_${p.id || 'p'}_${idx}`} value={p.id}>{p.clientName} ({p.municipalityState || 'Sin ciudad'})</option>
                        ))}
                      </select>

                      {/* Campos directos de prospecto para cotización exprés */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <div>
                          <label className="text-[8px] font-bold text-slate-500 uppercase block mb-0.5">Nombre del Prospecto</label>
                          <input
                            type="text"
                            value={calcClientName}
                            onChange={e => setCalcClientName(e.target.value)}
                            placeholder="Ej. Roberto Salgado"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-[8px] font-bold text-slate-500 uppercase block mb-0.5">Teléfono / WhatsApp</label>
                          <input
                            type="tel"
                            value={calcClientPhone}
                            onChange={e => setCalcClientPhone(e.target.value)}
                            placeholder="Ej. 55-1234-5678"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-[8px] font-bold text-slate-500 uppercase block mb-0.5">Municipio / Estado</label>
                          <input
                            type="text"
                            value={calcClientCity}
                            onChange={e => setCalcClientCity(e.target.value)}
                            placeholder="Ej. Querétaro, Querétaro"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Interactive Signature Pad for Cotización Exprés */}
                    <div className="border-t pt-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                          <PenTool className="w-3.5 h-3.5 text-emerald-600" />
                          Firma Digital del Asesor / Cliente
                        </label>
                        {expressSignature && (
                          <span className="text-[7px] font-extrabold uppercase px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded border border-emerald-200">
                            ✓ Firmado
                          </span>
                        )}
                      </div>

                      {!isExpressSigning ? (
                        <div className="space-y-2">
                          {expressSignature ? (
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center space-y-2">
                              <img src={expressSignature} alt="Firma Registrada" className="h-12 max-w-full object-contain mx-auto" />
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setIsExpressSigning(true)}
                                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[8px] font-bold uppercase rounded-lg cursor-pointer shadow-xs"
                                >
                                  ✍️ Cambiar / Volver a Firmar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setExpressSignature(null)}
                                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 text-[8px] font-bold uppercase rounded-lg cursor-pointer"
                                >
                                  🗑️ Borrar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setIsExpressSigning(true)}
                              className="w-full py-2.5 bg-emerald-50/70 hover:bg-emerald-100/80 border border-dashed border-emerald-300/80 text-emerald-800 font-extrabold text-[10px] uppercase rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <PenTool className="w-3.5 h-3.5 text-emerald-600" />
                              Firmar Cotización Exprés
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-emerald-300 shadow-xs">
                          <p className="text-[8px] font-extrabold text-slate-600 uppercase">
                            Dibuje la firma abajo (mouse o touch):
                          </p>
                          <div className="border border-slate-300 rounded-xl overflow-hidden bg-white touch-none">
                            <canvas
                              ref={expressCanvasRef}
                              width={320}
                              height={110}
                              className="w-full h-24 bg-white cursor-crosshair block"
                              onMouseDown={startDrawingExpress}
                              onMouseMove={drawExpress}
                              onMouseUp={stopDrawingExpress}
                              onMouseLeave={stopDrawingExpress}
                              onTouchStart={startDrawingExpress}
                              onTouchMove={drawExpress}
                              onTouchEnd={stopDrawingExpress}
                            />
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <button
                              type="button"
                              onClick={clearExpressCanvas}
                              className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-[8px] uppercase rounded-lg cursor-pointer"
                            >
                              🧹 Limpiar
                            </button>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => setIsExpressSigning(false)}
                                className="px-2.5 py-1 bg-slate-200 text-slate-600 font-extrabold text-[8px] uppercase rounded-lg cursor-pointer"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                onClick={saveExpressSignature}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[8px] uppercase rounded-lg shadow-xs cursor-pointer"
                              >
                                ✓ Guardar Firma
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Dynamic Proposal Image Output Preview (Requirement 2.1) */}
                  <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b pb-3 mb-4">
                        <span className="text-xs font-black uppercase tracking-tight">Previsualización de Propuesta Simplificada (Imagen)</span>
                        <span className="text-[8px] text-emerald-600 font-extrabold tracking-widest uppercase font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Solux Premium</span>
                      </div>

                      {/* Visual printable Proposal Banner (Requirement 2.1) */}
                      <div className="border border-slate-200 rounded-2xl p-5 md:p-6 bg-gradient-to-b from-slate-900 to-slate-950 text-white relative overflow-hidden" id="proposal-image-canvas">
                        {/* Decorative Background glow */}
                        <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl"></div>
                        
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                          <div className="flex items-center gap-2">
                            <SoluxLogo />
                            <div>
                              <span className="text-[10px] font-black tracking-widest text-white uppercase block">SOLUX GREEN</span>
                              <span className="text-[7px] text-emerald-400 font-black tracking-wider uppercase block">COTIZACIÓN EXPRÉS</span>
                            </div>
                          </div>
                          <span className="text-[8px] font-mono text-slate-500 uppercase">{new Date().toISOString().split('T')[0]}</span>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <span className="text-[7px] font-extrabold text-[#10B981] uppercase block tracking-widest">PROPUESTA DE GENERACIÓN SOLAR</span>
                              <h3 className="text-base font-black text-white leading-tight uppercase">Diagnóstico Técnico Preliminar</h3>
                            </div>
                            <div className="text-right">
                              <span className="text-[7px] text-slate-400 uppercase font-mono block">Cotización Folio</span>
                              <span className="text-[9px] font-extrabold text-emerald-400 font-mono">
                                {selectedSimulationClientId ? selectedSimulationClientId.slice(0, 10).toUpperCase() : `COT-${Date.now().toString().slice(-6)}`}
                              </span>
                            </div>
                          </div>

                          {/* Prospecto Datos */}
                          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-800/60 px-3 py-2 rounded-xl border border-slate-700/50 text-[9px]">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span className="text-slate-300 font-bold">
                                Prospecto: <strong className="text-white">{calcClientName.trim() || 'Cliente Solux'}</strong>
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-400 font-mono text-[8px]">
                              <span>{calcClientCity.trim() || 'Ubicación no especificada'}</span>
                              <span>•</span>
                              <span>{calcClientPhone.trim() || 'Teléfono no registrado'}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3.5 py-1">
                            <div className="bg-slate-800/55 p-3 rounded-xl border border-slate-700/35 text-center">
                              <span className="text-[7px] font-extrabold text-slate-400 uppercase block mb-1">Módulos Solares</span>
                              <span className="text-lg font-black text-white block">{panelsCount}</span>
                              <span className="text-[7px] text-slate-400 uppercase block mt-0.5">Paneles Solares</span>
                            </div>

                            <div className="bg-slate-800/55 p-3 rounded-xl border border-slate-700/35 text-center">
                              <span className="text-[7px] font-extrabold text-slate-400 uppercase block mb-1">Área Mínima</span>
                              <span className="text-lg font-black text-white block">{requiredArea} m²</span>
                              <span className="text-[7px] text-slate-400 uppercase block mt-0.5">2.88 m² / Panel</span>
                            </div>

                            <div className="bg-slate-800/55 p-3 rounded-xl border border-slate-700/35 text-center">
                              <span className="text-[7px] font-extrabold text-slate-400 uppercase block mb-1">Inversión Lista</span>
                              <span className="text-lg font-black text-emerald-400 block">${totalInvestment.toLocaleString('es-MX')}</span>
                              <span className="text-[7px] text-[#10B981] uppercase block mt-0.5">${activePanelPrice.toLocaleString('es-MX')} / Panel</span>
                            </div>
                          </div>

                          {/* Alerta 220V Bifásica */}
                          {is220vRequired && (
                            <div className="bg-amber-500/15 border border-amber-500/40 p-2.5 rounded-xl flex items-center gap-2 text-[8px] text-amber-200">
                              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                              <span><strong>⚡ Requiere Acometida 220V Bifásica:</strong> Proyecto supera 4 paneles solares ({panelsCount} paneles). Requiere validación técnica de centro de carga en sitio.</span>
                            </div>
                          )}

                          {/* Descuento Comercial de Contado */}
                          {calcPayMethod === 'contado' && (
                            <div className="bg-emerald-950/30 border border-emerald-500/30 p-3 rounded-xl space-y-1.5">
                              <div className="flex justify-between items-center text-[8px] text-slate-300">
                                <span>Inversión de Lista (Equipos + Instalación Llave en Mano):</span>
                                <span className="font-mono">${totalInvestment.toLocaleString('es-MX')} MXN</span>
                              </div>
                              <div className="flex justify-between items-center text-[8px] text-emerald-400 font-bold">
                                <span>Bonificación Comercial de Contado ({simulationResult.contadoDiscount}%):</span>
                                <span className="font-mono">-${simulationResult.discountAmount.toLocaleString('es-MX')} MXN</span>
                              </div>
                              <div className="border-t border-emerald-800/60 pt-1.5 flex justify-between items-center text-[10px] font-black text-white">
                                <span className="text-emerald-300 uppercase">Inversión Neta Final a Liquidar:</span>
                                <span className="text-emerald-400 font-mono text-sm">${simulationResult.finalCashInvestment.toLocaleString('es-MX')} MXN</span>
                              </div>
                            </div>
                          )}

                          {(calcPayMethod.startsWith('directo') || calcPayMethod === 'directo') && (
                            <div className="bg-slate-800/35 border border-slate-800/80 p-4 rounded-2xl space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                <span className="text-[8px] font-black text-emerald-400 uppercase block tracking-wider">Corrida Financiera Solux (Saldos Insolutos)</span>
                                <span className="text-[8px] font-mono text-slate-400">{simulationResult.months} Meses / {simulationResult.interestRate}% Int. Mensual</span>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-2 text-[10px] font-mono pb-1">
                                <div>
                                  <span className="text-[7px] font-sans text-slate-400 block uppercase">Enganche ({effectiveDownPercent}%)</span>
                                  <span className="font-extrabold text-white">${simulationResult.downPayment.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div>
                                  <span className="text-[7px] font-sans text-slate-400 block uppercase">Monto Financiar</span>
                                  <span className="font-extrabold text-white">${simulationResult.principalToFinance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[7px] font-sans text-slate-400 block uppercase">Total Intereses</span>
                                  <span className="font-extrabold text-[#10B981]">${simulationResult.totalInterest.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                                </div>
                              </div>

                              <div className="overflow-x-auto border border-slate-800/60 rounded-xl bg-slate-950/20">
                                <table className="w-full text-left border-collapse text-[9px] font-mono leading-tight">
                                  <thead>
                                    <tr className="border-b border-slate-800 text-slate-400 text-[7px] font-sans uppercase bg-slate-900/50">
                                      <th className="p-1.5 pl-2">Mes</th>
                                      <th className="p-1.5">Saldo Inicial</th>
                                      <th className="p-1.5">Capital</th>
                                      <th className="p-1.5">Interés</th>
                                      <th className="p-1.5">Pago Total</th>
                                      <th className="p-1.5 pr-2 text-right">Saldo</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-800/40 text-slate-300">
                                    {simulationResult.schedule.map((row) => (
                                      <tr key={row.month} className="hover:bg-slate-800/10">
                                        <td className="p-1.5 pl-2 font-black text-slate-400">{row.month}</td>
                                        <td className="p-1.5">${row.initialBalance.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td className="p-1.5">${row.capital.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td className="p-1.5 text-emerald-400">${row.interest.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td className="p-1.5 font-extrabold text-white bg-slate-800/10">${row.totalPayment.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td className="p-1.5 pr-2 text-right text-slate-400">${row.finalBalance.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                      </tr>
                                    ))}
                                    <tr className="border-t border-slate-700 bg-slate-900/60 text-[9px] font-black text-white font-sans">
                                      <td className="p-1.5 pl-2" colSpan={2}>TOTALES FINANCIADOS</td>
                                      <td className="p-1.5 font-mono">${simulationResult.principalToFinance.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                      <td className="p-1.5 font-mono text-emerald-400">${simulationResult.totalInterest.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                      <td className="p-1.5 pr-2 text-right text-yellow-400 bg-emerald-950/20 font-mono" colSpan={2}>
                                        TOTAL MENSUALIDADES: ${simulationResult.totalToPay.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </td>
                                    </tr>
                                    <tr className="border-t border-emerald-500/40 bg-emerald-950/40 text-[9px] font-black text-emerald-300 font-sans">
                                      <td className="p-1.5 pl-2" colSpan={4}>COSTO TOTAL DEL PROYECTO (ENGANCHE + MENSUALIDADES)</td>
                                      <td className="p-1.5 pr-2 text-right text-emerald-400 font-mono text-[10px]" colSpan={2}>
                                        ${simulationResult.totalProjectCost.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* Esquema 12 Meses sin Intereses (MSI Bancario) */}
                          {calcPayMethod === 'msi' && (
                            <div className="bg-slate-800/35 border border-slate-800/80 p-4 rounded-2xl space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                <div className="flex items-center gap-2">
                                  <CreditCard className="w-3.5 h-3.5 text-sky-400" />
                                  <span className="text-[8px] font-black text-sky-400 uppercase block tracking-wider">Meses sin Intereses (MSI con Tarjeta Bancaria)</span>
                                </div>
                                <span className="text-[8px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">0% Tasa de Interés</span>
                              </div>

                              <div className="grid grid-cols-3 gap-2 text-[10px] font-mono pb-1">
                                <div>
                                  <span className="text-[7px] font-sans text-slate-400 block uppercase">Enganche Requerido</span>
                                  <span className="font-extrabold text-white">$0.00 MXN</span>
                                </div>
                                <div>
                                  <span className="text-[7px] font-sans text-slate-400 block uppercase">Mensualidad Fija</span>
                                  <span className="font-extrabold text-sky-400">${simulationResult.monthlyPayment.toLocaleString('es-MX')} MXN</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[7px] font-sans text-slate-400 block uppercase">Plazo Fijo</span>
                                  <span className="font-extrabold text-white">12 Mensualidades</span>
                                </div>
                              </div>

                              <div className="p-2.5 bg-sky-950/30 border border-sky-500/30 rounded-xl text-[8px] text-sky-200">
                                💳 <strong>Promoción Bancaria:</strong> Inversión total de <strong>${totalInvestment.toLocaleString('es-MX')} MXN</strong> diferida en <strong>12 mensualidades fijas de ${simulationResult.monthlyPayment.toLocaleString('es-MX')} MXN</strong> con tarjetas de crédito participantes. Sin comisiones ni recargos por apertura.
                              </div>

                              <div className="overflow-x-auto border border-slate-800/60 rounded-xl bg-slate-950/20">
                                <table className="w-full text-left border-collapse text-[9px] font-mono leading-tight">
                                  <thead>
                                    <tr className="border-b border-slate-800 text-slate-400 text-[7px] font-sans uppercase bg-slate-900/50">
                                      <th className="p-1.5 pl-2">Mes</th>
                                      <th className="p-1.5">Saldo Inicial</th>
                                      <th className="p-1.5">Mensualidad Fija</th>
                                      <th className="p-1.5 text-emerald-400">Interés</th>
                                      <th className="p-1.5 pr-2 text-right">Saldo Restante</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-800/40 text-slate-300">
                                    {simulationResult.schedule.map((row) => (
                                      <tr key={row.month} className="hover:bg-slate-800/10">
                                        <td className="p-1.5 pl-2 font-black text-slate-400">{row.month}</td>
                                        <td className="p-1.5">${row.initialBalance.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td className="p-1.5 font-extrabold text-sky-300 bg-sky-950/20">${row.totalPayment.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td className="p-1.5 text-emerald-400 font-bold">$0.00</td>
                                        <td className="p-1.5 pr-2 text-right text-slate-400">${row.finalBalance.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                      </tr>
                                    ))}
                                    <tr className="border-t border-sky-500/40 bg-sky-950/40 text-[9px] font-black text-sky-300 font-sans">
                                      <td className="p-1.5 pl-2" colSpan={3}>INVERSIÓN TOTAL A LIQUIDAR A 12 MESES</td>
                                      <td className="p-1.5 pr-2 text-right text-sky-300 font-mono text-[10px]" colSpan={2}>
                                        ${totalInvestment.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {expressSignature && (
                            <div className="pt-2.5 pb-1 border-t border-slate-800/80 flex items-center justify-between">
                              <div>
                                <span className="text-[7px] font-black text-emerald-400 uppercase tracking-widest block">Firma Registrada en Cotización:</span>
                                <span className="text-[9px] font-extrabold text-white">{currentUser?.fullName || 'Asesor Verde / Cliente'}</span>
                              </div>
                              <div className="bg-white p-1 rounded-lg border border-slate-700">
                                <img src={expressSignature} alt="Firma Registrada" className="h-8 w-auto object-contain" />
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2.5 border-t border-slate-800/80 text-[9px]">
                            <span className="flex items-center gap-1.5 font-bold text-emerald-400">
                              <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              Cotizado / Atendido Por: <strong className="text-white">{currentUser?.fullName || 'Asesor Verde Solux'}</strong>
                            </span>
                            <span className="text-[8px] text-slate-400 uppercase font-mono px-2 py-0.5 bg-slate-800/60 rounded-md border border-slate-700/50">
                              {currentUser?.role === 'admin' ? 'Administrador' : 'Asesor Comercial'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-[8px] text-slate-400 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>Esta cotización puede modificarse tras el levantamiento de obra definitivo del Partner.</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-4">
                      <button
                        onClick={exportCalculatorToImage}
                        className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                      >
                        🖼️ Imagen (.JPG)
                      </button>

                      <button
                        onClick={exportCalculatorToPDF}
                        className="py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all text-center flex items-center justify-center gap-1 cursor-pointer border border-rose-100"
                      >
                        📄 PDF (.PDF)
                      </button>

                      <button
                        onClick={handleCalculatorShareWhatsApp}
                        className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                      >
                        💬 WhatsApp
                      </button>
                    </div>

                    {selectedSimulationClientId && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateSolarProject(selectedSimulationClientId, {
                              averageBill: safeBill,
                              estimatedPanels: panelsCount,
                              requiredArea,
                              totalInvestment,
                              paymentMethodDesired: calcPayMethod,
                              voltageAlert220v: is220vRequired,
                              voltageUpgradeQuoted: is220vRequired
                            });
                            triggerNotification(`✅ ¡Cotización de $${totalInvestment.toLocaleString('es-MX')} MXN guardada y sincronizada en el expediente de "${calcClientName}"!`);
                          }}
                          className="w-full py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all text-center flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-950/20"
                        >
                          <Save className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Guardar y Sincronizar en Expediente de {calcClientName} (${totalInvestment.toLocaleString('es-MX')} MXN)</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ------------------- TAB 4: BANCO DE MATERIAL PROMOCIONAL (Multirrol) ------------------- */}
              {activeTab === 'promocionales' && (
                <div className="max-w-5xl mx-auto animate-fadeIn">
                  <PromotionalMaterialsModule 
                    currentUser={currentUser}
                    solarProjects={userSolarProjects}
                    isOfflineMode={isOfflineMode}
                    onNotification={triggerNotification}
                  />
                </div>
              )}

              {/* ------------------- TAB: RED DE ASESORES DE ENLACE ------------------- */}
              {activeTab === 'enlaces' && (
                <div className="animate-fadeIn pb-12">
                  <EnlaceAdvisorsModule
                    users={users}
                    currentUser={currentUser}
                    solarProjects={solarProjects}
                    onUpdateUsers={onUpdateUsers}
                    onTriggerNotification={triggerNotification}
                    isOfflineMode={isOfflineMode}
                  />
                </div>
              )}

              {/* ------------------- TAB 5: RECOMENDAR CLIENTE AL ROL ENLACE ------------------- */}
              {activeTab === 'recomendar' && (
                <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
                  {/* Quick banner to invite new Enlaces with link */}
                  <div className="bg-pink-50/90 border border-pink-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-pink-600 text-white flex items-center justify-center shrink-0">
                        <Share2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-pink-950 uppercase">
                          ¿Deseas sumar a un nuevo Asesor de Enlace a tu red?
                        </h4>
                        <p className="text-[11px] text-pink-800">
                          Genera y comparte tu link único de registro para que se dé de alta con sus datos y cuenta bancaria.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('enlaces')}
                      className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer shadow-xs"
                    >
                      Ir a Red de Enlaces →
                    </button>
                  </div>

                  {/* Header card */}
                  <div className="bg-gradient-to-r from-emerald-900 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-emerald-500/20">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-black uppercase tracking-wider mb-2">
                          <Handshake className="w-3.5 h-3.5" />
                          Módulo de Recomendación Comercial
                        </div>
                        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">
                          Recomendar Cliente al Rol Enlace
                        </h2>
                        <p className="text-xs text-slate-300 font-medium max-w-xl mt-1 leading-relaxed">
                          Asigna un cliente a un Socio Enlace para seguimiento en campo y comunidad. El Enlace recibirá una notificación instantánea con los datos y ganará su bono de $1,000 MXN al instalar.
                        </p>
                      </div>

                      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 shrink-0 text-center md:text-right">
                        <span className="text-[10px] uppercase font-bold text-emerald-300 block tracking-wider">Enlaces Disponibles</span>
                        <span className="text-2xl font-black text-white">{enlaceUsers.length}</span>
                        <span className="text-[9px] text-slate-300 block mt-0.5">Socios en la red</span>
                      </div>
                    </div>
                  </div>

                  {/* Form Container */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                    {/* Step 1: Select Enlace */}
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 block mb-2 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold">1</span>
                        Selecciona el Asesor de Enlace Destino *
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {enlaceUsers.map((enl, idx) => {
                          const isSelected = recEnlaceId === enl.id || recEnlaceId === enl.username;
                          return (
                            <button
                              key={`enl_usr_${enl.id || enl.username || 'enl'}_${idx}`}
                              type="button"
                              onClick={() => setRecEnlaceId(enl.id || enl.username)}
                              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                isSelected 
                                  ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-xs' 
                                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <span className="text-xs font-black text-slate-900 block truncate">{enl.fullName || enl.username}</span>
                                  <span className="text-[10px] font-mono font-bold text-pink-600 block mt-0.5">
                                    {enl.referralCode || `SOCIO-${(enl.id || '889').slice(-3).toUpperCase()}-MX`}
                                  </span>
                                </div>
                                {isSelected ? (
                                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                  </span>
                                ) : (
                                  <span className="w-5 h-5 rounded-full border border-slate-300 shrink-0" />
                                )}
                              </div>
                              <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[9px] text-slate-500 font-bold">
                                <span>📱 {enl.whatsapp || enl.phone || 'Sin tel'}</span>
                                <span className="text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">Activo</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Step 2: Choose Mode */}
                    <div className="pt-2 border-t border-slate-100">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 block mb-2 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold">2</span>
                        Origen del Cliente *
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setRecMode('new')}
                          className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                            recMode === 'new'
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-black'
                              : 'border-slate-200 text-slate-600 font-bold hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-xs uppercase block">✨ Registrar Nuevo Cliente</span>
                          <span className="text-[9px] text-slate-500 block font-normal mt-0.5">Captura datos desde cero</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setRecMode('existing')}
                          className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                            recMode === 'existing'
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-black'
                              : 'border-slate-200 text-slate-600 font-bold hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-xs uppercase block">📂 Prospecto de mi CRM</span>
                          <span className="text-[9px] text-slate-500 block font-normal mt-0.5">Vincular expediente ya registrado</span>
                        </button>
                      </div>
                    </div>

                    {/* Step 3: Fields */}
                    <form onSubmit={handleRecomendarAEnlace} className="space-y-4 pt-2 border-t border-slate-100">
                      {recMode === 'existing' ? (
                        <div className="space-y-3">
                          <div>
                            <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                              Selecciona el Prospecto de tu Pipeline *
                            </label>
                            <select
                              value={recExistingProjectId}
                              onChange={e => setRecExistingProjectId(e.target.value)}
                              required
                              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="">-- Elige un prospecto registrado --</option>
                              {userSolarProjects.map((p, idx) => (
                                <option key={`rec_proj_${p.id || 'p'}_${idx}`} value={p.id}>
                                  {p.clientName} | {p.municipalityState || 'Sin ubicación'} | ${(p.averageBill || 0).toLocaleString('es-MX')}/bim ({p.status})
                                </option>
                              ))}
                            </select>
                          </div>

                          {recExistingProjectId && (() => {
                            const selectedProj = userSolarProjects.find(p => p.id === recExistingProjectId);
                            if (!selectedProj) return null;
                            return (
                              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                                <div>
                                  <span className="text-[9px] font-black uppercase text-emerald-700 tracking-wider">Prospecto Seleccionado</span>
                                  <h4 className="text-sm font-black text-slate-900">{selectedProj.clientName}</h4>
                                  <p className="text-[11px] text-slate-500 mt-0.5">
                                    📞 {selectedProj.clientPhone} • 📍 {selectedProj.municipalityState}
                                  </p>
                                </div>
                                <div className="text-left sm:text-right">
                                  <span className="text-[9px] font-black uppercase text-slate-400 block">Inversión Estimada</span>
                                  <span className="text-sm font-black text-slate-900">
                                    ${(selectedProj.totalInvestment || 0).toLocaleString('es-MX')} MXN
                                  </span>
                                  <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                                    {selectedProj.estimatedPanels || 0} paneles recomendados
                                  </span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-600 block">
                              Nombre Completo del Cliente *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Ej. Sofía Valenzuela"
                              value={recClientName}
                              onChange={e => setRecClientName(e.target.value)}
                              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-600 block">
                              Teléfono Móvil / WhatsApp *
                            </label>
                            <input
                              type="tel"
                              required
                              placeholder="Ej. 55-9012-3456"
                              value={recClientPhone}
                              onChange={e => setRecClientPhone(e.target.value)}
                              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-600 block">
                              Municipio / Estado de Residencia *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Ej. Veracruz, Ver. / Boca del Río"
                              value={recClientCity}
                              onChange={e => setRecClientCity(e.target.value)}
                              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-600 block">
                              Pago Promedio CFE ($ Bimestral) *
                            </label>
                            <select
                              required
                              value={recClientBill}
                              onChange={e => setRecClientBill(e.target.value)}
                              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="">-- Rango de consumo de luz --</option>
                              <option value="1500">$1,000 - $2,000 pesos bimestrales (Tarifa doméstica)</option>
                              <option value="3000">$2,000 - $4,000 pesos bimestrales (Consumo medio)</option>
                              <option value="6000">$4,000 - $8,000 pesos bimestrales (Consumo alto)</option>
                              <option value="12000">Más de $10,000 pesos bimestrales (DAC / Comercial)</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Notes for Enlace */}
                      <div className="space-y-1 pt-1">
                        <label className="text-[10px] font-bold uppercase text-slate-600 block">
                          Instrucciones o Notas para el Enlace (Opcional)
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Ej. El cliente tiene dudas de crédito directo Solux, visitarlo por las tardes o contactar vía WhatsApp..."
                          value={recNotes}
                          onChange={e => setRecNotes(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      {/* Submit button */}
                      <button
                        type="submit"
                        disabled={!recEnlaceId}
                        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        <span>Recomendar Cliente y Notificar al Enlace</span>
                      </button>
                    </form>
                  </div>

                  {/* List of previously recommended clients */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                          Recomendaciones Realizadas a Enlaces
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                          Seguimiento de clientes asignados a la red de enlaces
                        </p>
                      </div>
                      <span className="text-[10px] font-black uppercase bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200">
                        {userSolarProjects.filter(p => p.isRecommendedByAdvisor || p.assignedEnlaceId).length} Asignados
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {userSolarProjects.filter(p => p.isRecommendedByAdvisor || p.assignedEnlaceId).length === 0 ? (
                        <div className="py-8 text-center text-slate-400">
                          <Handshake className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-600" />
                          <p className="text-xs font-bold uppercase">Aún no has recomendado clientes a Enlaces</p>
                          <p className="text-[10px] mt-0.5 font-normal">
                            Usa el formulario superior para asignar prospectos y potenciar las comisiones de tu equipo.
                          </p>
                        </div>
                      ) : (
                        userSolarProjects
                          .filter(p => p.isRecommendedByAdvisor || p.assignedEnlaceId)
                          .map((proj, idx) => (
                            <div key={`rec_enl_proj_${proj.id || 'p'}_${idx}`} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-slate-900">{proj.clientName}</span>
                                  <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                    {proj.status}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                                  📍 {proj.municipalityState || 'Sin ciudad'} • 📞 {proj.clientPhone} • ${(proj.averageBill || 0).toLocaleString('es-MX')}/bim
                                </p>
                                <p className="text-[10px] text-pink-700 font-bold mt-1">
                                  🤝 Enlace Asignado: <span className="font-extrabold">{proj.enlaceName || 'Enlace Solux'}</span> ({proj.referrerCode || 'Sin código'})
                                </p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <a
                                  href={`https://wa.me/${formatWhatsAppPhone(proj.clientPhone)}?text=${encodeURIComponent(`Hola ${proj.clientName}, soy ${currentUser?.fullName || 'tu Asesor Verde'} de Solux Green solar.`)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-100 transition-colors flex items-center gap-1"
                                >
                                  💬 WhatsApp Cliente
                                </a>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
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

              {/* ------------------- NOTIFICATIONS MODULE ------------------- */}
              {activeTab === 'notificaciones' && (
                <NotificationsModule
                  notifications={notifications}
                  role="comercial"
                  currentUser={currentUser}
                  onMarkAsRead={onMarkNotificationAsRead}
                  onMarkAllAsRead={onMarkAllNotificationsAsRead}
                  onClearAllNotifications={onClearAllNotifications}
                  onDeleteNotification={onDeleteNotification}
                />
              )}

            </motion.div>
          </AnimatePresence>
        </main>

        {/* 2. BOTTOM NAVIGATION */}
        <nav className="lg:hidden bg-white border-t border-slate-200 px-3 py-2.5 flex items-center justify-around shrink-0 relative z-20 shadow-lg">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-all cursor-pointer ${activeTab === 'pipeline' ? 'text-[#10B981]' : 'text-slate-400'}`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[8px] font-extrabold uppercase tracking-wider">Prospectos</span>
          </button>
          
          <button
            onClick={() => setActiveTab('nuevo')}
            className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-all cursor-pointer ${activeTab === 'nuevo' ? 'text-[#10B981]' : 'text-slate-400'}`}
          >
            <Plus className="w-5 h-5" />
            <span className="text-[8px] font-extrabold uppercase tracking-wider">Registrar</span>
          </button>

          <button
            onClick={() => setActiveTab('perfil')}
            className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-all cursor-pointer ${activeTab === 'perfil' ? 'text-[#10B981]' : 'text-slate-400'}`}
          >
            <User className="w-5 h-5" />
            <span className="text-[8px] font-extrabold uppercase tracking-wider">Perfil</span>
          </button>

          <button
            onClick={() => setActiveTab('cotizador')}
            className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-all cursor-pointer ${activeTab === 'cotizador' ? 'text-[#10B981]' : 'text-slate-400'}`}
          >
            <Percent className="w-5 h-5" />
            <span className="text-[8px] font-extrabold uppercase tracking-wider">Cotizador</span>
          </button>

          <button
            onClick={() => setActiveTab('enlaces')}
            className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-all cursor-pointer ${activeTab === 'enlaces' ? 'text-pink-600' : 'text-slate-400'}`}
          >
            <Users className="w-5 h-5 text-pink-500" />
            <span className="text-[8px] font-extrabold uppercase tracking-wider">Enlaces</span>
          </button>

          <button
            onClick={() => setActiveTab('recomendar')}
            className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-all cursor-pointer ${activeTab === 'recomendar' ? 'text-[#10B981]' : 'text-slate-400'}`}
          >
            <Handshake className="w-5 h-5" />
            <span className="text-[8px] font-extrabold uppercase tracking-wider">Recomendar</span>
          </button>

          <button
            onClick={() => setActiveTab('promocionales')}
            className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-all cursor-pointer ${activeTab === 'promocionales' ? 'text-[#10B981]' : 'text-slate-400'}`}
          >
            <Award className="w-5 h-5" />
            <span className="text-[8px] font-extrabold uppercase tracking-wider">Promo</span>
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

      {/* ------------------- PROSPECT DETAILS / DIGITAL DOSSIER MODAL ------------------- */}
      <AnimatePresence>
        {selectedProject && (() => {
          const clientCreds = getClientCredentials(selectedProject, users);
          const matchedUser = clientCreds.user;
          const activeCredsForExport = matchedUser || { username: clientCreds.username, password: clientCreds.password, fullName: selectedProject.clientName };
          return (
            <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col relative"
              >
                <div className="bg-slate-900 text-white p-4 md:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#10B981] flex items-center justify-center text-white font-black text-sm shrink-0">
                      {selectedProject.clientName[0]}
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-tight text-white">{selectedProject.clientName}</h3>
                      <p className="text-[9px] text-[#10B981] font-black uppercase tracking-widest font-mono">ID: {selectedProject.id}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap sm:justify-end">
                    <button
                      onClick={() => {
                        const isDeactivated = selectedProject.status === 'desactivado';
                        const newStatus = isDeactivated ? 'validacion' : 'desactivado';
                        onUpdateSolarProject(selectedProject.id, { status: newStatus });
                        setSelectedProject(prev => prev ? { ...prev, status: newStatus } : null);
                        triggerNotification(isDeactivated ? '✅ Expediente activado correctamente.' : '⚠️ Expediente desactivado correctamente.');
                      }}
                      className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                        selectedProject.status === 'desactivado'
                          ? 'bg-amber-500 hover:bg-amber-600 text-white'
                          : 'bg-orange-600 hover:bg-orange-700 text-white'
                      }`}
                    >
                      {selectedProject.status === 'desactivado' ? '🔌 Activar' : '🔌 Desactivar'}
                    </button>
                    {onDeleteSolarProject && (
                      <button
                        onClick={() => {
                          if (window.confirm(`¿Estás completamente seguro de que deseas eliminar permanentemente el expediente de "${selectedProject.clientName}"?`)) {
                            onDeleteSolarProject(selectedProject.id);
                            setSelectedProject(null);
                            triggerNotification('🗑️ Expediente eliminado correctamente.');
                          }
                        }}
                        className="p-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-all cursor-pointer"
                        title="Eliminar Expediente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenEditProject(selectedProject)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm border border-emerald-400/40 flex items-center gap-1.5"
                    >
                      <span>✍️</span>
                      <span>Editar Datos / Acceso</span>
                    </button>
                    <button
                      onClick={() => exportProjectToPDF(selectedProject, activeCredsForExport)}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer text-[10px] font-bold"
                      title="Exportar PDF"
                    >
                      📄 PDF
                    </button>
                    <button
                      onClick={() => exportProjectToExcel(selectedProject, activeCredsForExport)}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer text-[10px] font-bold"
                      title="Exportar Excel"
                    >
                      📊 Excel
                    </button>
                    <button
                      onClick={() => exportProjectToImage(selectedProject, activeCredsForExport)}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer text-[10px] font-bold"
                      title="Exportar Imagen JPEG"
                    >
                      🖼️ JPG
                    </button>
                    <button
                      onClick={() => shareProjectOnWhatsApp(selectedProject, activeCredsForExport)}
                      className="p-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer text-[10px] font-bold"
                      title="Compartir por WhatsApp"
                    >
                      💬 WhatsApp
                    </button>
                    <button
                      onClick={() => setSelectedProject(null)}
                      className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer ml-auto sm:ml-0"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Modal body */}
                <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6 text-xs">
                  
                  {/* Status, Partner and Referrer Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Estatus CRM</label>
                      <select
                        value={selectedProject.status}
                        onChange={(e) => {
                          const newStatus = e.target.value as any;
                          setSelectedProject(prev => prev ? { ...prev, status: newStatus } : null);
                          onUpdateSolarProject(selectedProject.id, { status: newStatus });
                          triggerNotification('Estatus del expediente actualizado.');
                        }}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                      >
                        <option value="validacion">VALIDACIÓN</option>
                        <option value="estudio_tecnico">ESTUDIO TÉCNICO</option>
                        <option value="propuesta_diseno">PROPUESTA / DISEÑO</option>
                        <option value="negociacion">NEGOCIACIÓN</option>
                        <option value="tramite_cfe">TRÁMITE CFE</option>
                        <option value="instalacion">INSTALACIÓN</option>
                        <option value="completado">COMPLETADO</option>
                        <option value="rechazado">RECHAZADO</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Socio Partner Asignado</label>
                      <select
                        value={selectedProject.assignedPartnerId || ''}
                        onChange={(e) => {
                          const partnerId = e.target.value;
                          setSelectedProject(prev => prev ? { ...prev, assignedPartnerId: partnerId || undefined } : null);
                          onUpdateSolarProject(selectedProject.id, { assignedPartnerId: partnerId || undefined });
                          triggerNotification('Partner asignado al expediente.');
                        }}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                      >
                        <option value="">Elegir Partner...</option>
                        {(users || []).filter(u => u.role === 'partner').map((p, idx) => (
                          <option key={`com_partner_${p.id || 'p'}_${idx}`} value={p.id}>{p.fullName || p.username}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Referido por:</label>
                      <select
                        value={selectedProject.referrerCode || ''}
                        onChange={(e) => {
                          const refCode = e.target.value;
                          setSelectedProject(prev => prev ? { ...prev, referrerCode: refCode || undefined } : null);
                          onUpdateSolarProject(selectedProject.id, { referrerCode: refCode || undefined });
                          triggerNotification('Referido por actualizado correctamente.');
                        }}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                      >
                        <option value="">Ninguno (Registro Directo)</option>
                        <optgroup label="👥 Empleados Solux Green">
                          {(users || []).filter(u => u.role === 'admin' || u.role === 'comercial' || u.role === 'enlace').map((emp, idx) => (
                            <option key={`com_edit_emp_${emp.id || 'e'}_${idx}`} value={emp.fullName || emp.username}>
                              {emp.fullName || emp.username} ({emp.role === 'admin' ? 'Admin' : emp.role === 'comercial' ? 'Asesor Verde' : 'Asesor Enlace'})
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="🤝 Socios Partners de Instalación">
                          {(users || []).filter(u => u.role === 'partner').map((p, idx) => (
                            <option key={`com_edit_ref_p_${p.id || 'p'}_${idx}`} value={p.fullName || p.username}>
                              {p.fullName || p.username} (Socio Partner)
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
                  </div>
                  
                  {/* Credentials card block */}
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-[1.5rem] p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h5 className="text-[10px] font-black uppercase tracking-wider text-emerald-800">Credenciales de Acceso del Cliente</h5>
                      <p className="text-[9px] text-emerald-600 font-bold uppercase mt-0.5">
                        Permiten al cliente iniciar sesión en su portal para ver cotizaciones
                        {!clientCreds.isRegistered && (
                          <span className="ml-1.5 text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded font-black text-[8px] tracking-wide">
                            (Generado por Nombre)
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-4 font-mono text-[11px]">
                      <div>
                        <span className="text-[8px] font-sans font-extrabold text-slate-400 uppercase block">Usuario</span>
                        <span className="font-extrabold text-slate-800">{clientCreds.username}</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-sans font-extrabold text-slate-400 uppercase block">Contraseña</span>
                        <span className="font-extrabold text-emerald-700">{clientCreds.password}</span>
                      </div>
                    </div>
                  </div>

                  {/* Contact grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* General details */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase text-slate-900 tracking-wider border-b pb-1.5 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                        Ficha y Diagnóstico de la Obra
                      </h4>

                      <div className="grid grid-cols-2 gap-3.5 text-[11px]">
                        <div>
                          <span className="text-[8px] font-extrabold uppercase text-slate-400 block">Teléfono Celular</span>
                          <span className="font-bold text-slate-800 inline-flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" /> {selectedProject.clientPhone}
                          </span>
                        </div>
                        <div>
                          <span className="text-[8px] font-extrabold uppercase text-slate-400 block">Correo Electrónico</span>
                          <span className="font-bold text-slate-800 inline-flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-slate-400" /> {selectedProject.clientEmail || 'Sin registrar'}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-[8px] font-extrabold uppercase text-slate-400 block">Ubicación Google Maps</span>
                          {selectedProject.googleMapsUrl ? (
                            <a href={selectedProject.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-blue-600 hover:underline break-all">
                              {selectedProject.googleMapsUrl}
                            </a>
                          ) : (
                            <span className="text-slate-400 italic font-bold">No registrada</span>
                          )}
                        </div>

                        <div>
                          <span className="text-[8px] font-extrabold uppercase text-slate-400 block">Espacio Disponible</span>
                          <span className="font-bold text-slate-800">{selectedProject.availableSpace || 40} m²</span>
                        </div>

                        <div>
                          <span className="text-[8px] font-extrabold uppercase text-slate-400 block">Número de Medidores</span>
                          <span className="font-bold text-slate-800">{selectedProject.metersCount || 1}</span>
                        </div>

                        <div>
                          <span className="text-[8px] font-extrabold uppercase text-slate-400 block">Estatus de Servicio CFE</span>
                          <span className="font-bold text-slate-800">
                            {selectedProject.cfeStatus === 'activo_sin_adeudo' ? 'Activo sin Adeudo' : selectedProject.cfeStatus === 'con_adeudo' ? 'Con Adeudo' : 'Inactivo / Nuevo Contrato'}
                          </span>
                        </div>

                        <div>
                          <span className="text-[8px] font-extrabold uppercase text-slate-400 block">Validación de Propiedad</span>
                          <span className="font-bold text-slate-800">
                            {selectedProject.propertyOwnership === 'propietario' ? 'Propietario' : 'Arrendatario Autorizado'}
                          </span>
                        </div>

                        <div className="col-span-2">
                          <span className="text-[8px] font-extrabold uppercase text-slate-400 block">Forma de Pago de Interés</span>
                          <span className="font-bold text-indigo-700">
                            {formatPaymentMethod(selectedProject.paymentMethodDesired)}
                          </span>
                          {(() => {
                            const fin = calculateSoluxFinancing(
                              selectedProject.totalInvestment || ((selectedProject.estimatedPanels || 4) * activePanelPrice),
                              selectedProject.paymentMethodDesired,
                              soluxConfig.monthlyInterestRate,
                              soluxConfig.defaultDownPaymentPercent || 50
                            );
                            if (fin.isFinancing) {
                              return (
                                <span className="block text-[8px] font-sans text-emerald-700 font-black mt-0.5">
                                  Enganche {fin.downPercent}%: ${fin.downPayment.toLocaleString('es-MX')} MXN • {fin.months} Meses (${fin.monthlyPayment.toLocaleString('es-MX')}/mes)
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </div>

                        <div className="col-span-2 pt-1 border-t border-slate-100 space-y-1">
                          <span className="text-[8px] font-extrabold uppercase text-indigo-500 block">Estatus CRM & Validación del Expediente</span>
                          <div className="flex flex-wrap items-center gap-2">
                            <select
                              value={selectedProject.status || 'validacion'}
                              onChange={(e) => {
                                const newStatus = e.target.value;
                                onUpdateSolarProject(selectedProject.id, { status: newStatus });
                                setSelectedProject({ ...selectedProject, status: newStatus });
                                triggerNotification(`✅ Estatus actualizado a: ${newStatus.toUpperCase()}`);
                              }}
                              className="px-2.5 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl font-black text-[10px] uppercase tracking-wider cursor-pointer font-mono outline-none"
                            >
                              <option value="validacion">Validación</option>
                              <option value="validado">Validado / Viable</option>
                              <option value="cotizacion_enviada">Cotización Enviada</option>
                              <option value="levantamiento_tecnico">Levantamiento Técnico</option>
                              <option value="cotizacion_final">Cotización Final</option>
                              <option value="firma_contrato">Firma de Contrato</option>
                              <option value="instalacion">Instalación</option>
                              <option value="tramite_cfe">Trámite CFE</option>
                              <option value="operacion">Operación</option>
                              <option value="desactivado">Desactivado</option>
                            </select>

                            {selectedProject.status !== 'validado' && (
                              <button
                                type="button"
                                onClick={() => {
                                  onUpdateSolarProject(selectedProject.id, { status: 'validado' });
                                  setSelectedProject({ ...selectedProject, status: 'validado' });
                                  triggerNotification(`✅ ¡Prospecto "${selectedProject.clientName}" VALIDADO correctamente!`);
                                }}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Validar Prospecto
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 border p-3.5 rounded-2xl font-mono text-[11px]">
                        <span className="text-[8px] font-sans font-black uppercase text-slate-400 block mb-1">Cargas Eléctricas & Hilos</span>
                        <div>• Acometida: {selectedProject.wiresCount || 2} Hilos</div>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {selectedProject.electricalLoadType?.map((load, idx) => (
                            <span key={`comm_load_${load}_${idx}`} className="bg-slate-200 text-slate-700 font-sans font-extrabold px-1.5 py-0.5 rounded text-[8px]">
                              {load}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                  {/* Right Column: Quotation Summary & Credit Simulations */}
                  <div className="space-y-4">
                    {/* ☀️ Cotización Realizada & Diagnóstico Solar */}
                    {(() => {
                      const panels = selectedProject.estimatedPanels || Math.round(((selectedProject.averageBill || 0) / 1000) * 2) || 2;
                      const systemKwp = ((panels * 550) / 1000).toFixed(2);
                      const requiredArea = selectedProject.requiredArea || Number((panels * 2.88).toFixed(1));
                      const investment = selectedProject.totalInvestment || (panels * activePanelPrice);
                      const annualSavings = Math.round((selectedProject.averageBill || 0) * 6 * 0.9);
                      const roiYears = annualSavings > 0 ? (investment / annualSavings).toFixed(1) : 'N/A';

                      return (
                        <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white p-4.5 rounded-[1.5rem] shadow-xl space-y-3.5 border border-emerald-500/40 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                          <div className="flex items-center justify-between border-b border-emerald-500/30 pb-2">
                            <div className="flex items-center gap-2">
                              <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                              <h4 className="text-[11px] font-black uppercase tracking-wider text-emerald-300">
                                Cotización Solar & Diagnóstico
                              </h4>
                            </div>
                            <span className="text-[8px] font-mono font-black uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                              Propuesta Activa
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2.5 text-xs">
                            <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                              <span className="text-[8px] font-black uppercase text-emerald-300/80 block">Factura CFE Bimestral</span>
                              <span className="font-mono font-black text-sm text-white">
                                ${(selectedProject.averageBill || 0).toLocaleString('es-MX')} <span className="text-[9px] font-bold text-slate-400">MXN</span>
                              </span>
                            </div>

                            <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                              <span className="text-[8px] font-black uppercase text-emerald-300/80 block">Sistema Fotovoltaico</span>
                              <span className="font-mono font-black text-sm text-emerald-400">
                                {panels} Paneles <span className="text-[9px] font-extrabold text-slate-300">({systemKwp} kWp)</span>
                              </span>
                            </div>

                            <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                              <span className="text-[8px] font-black uppercase text-emerald-300/80 block">Área Requerida Techo</span>
                              <span className="font-mono font-extrabold text-xs text-white">
                                {requiredArea} m² <span className="text-[8px] text-slate-400">(Disp: {selectedProject.availableSpace || 40}m²)</span>
                              </span>
                            </div>

                            <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                              <span className="text-[8px] font-black uppercase text-emerald-300/80 block">Inversión Estimada</span>
                              <span className="font-mono font-black text-sm text-amber-300">
                                ${investment.toLocaleString('es-MX')} <span className="text-[9px] font-bold text-slate-400">MXN</span>
                              </span>
                            </div>

                            <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                              <span className="text-[8px] font-black uppercase text-emerald-300/80 block">Ahorro Estimado Anual</span>
                              <span className="font-mono font-black text-xs text-emerald-300">
                                ~${annualSavings.toLocaleString('es-MX')} MXN <span className="text-[8px] text-slate-300">(~90%)</span>
                              </span>
                            </div>

                            <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                              <span className="text-[8px] font-black uppercase text-emerald-300/80 block">Retorno Inversión (ROI)</span>
                              <span className="font-mono font-black text-xs text-sky-300">
                                ~{roiYears} Años
                              </span>
                            </div>
                          </div>

                          <div className="pt-1 flex flex-wrap justify-between items-center gap-2 text-[10px]">
                            <span className="text-slate-300 font-medium">Pago deseado: <strong className="text-white uppercase">{formatPaymentMethod(selectedProject.paymentMethodDesired)}</strong></span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {selectedProject.totalInvestment !== (panels * activePanelPrice) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updatedTotal = panels * activePanelPrice;
                                    onUpdateSolarProject(selectedProject.id, {
                                      totalInvestment: updatedTotal,
                                      estimatedPanels: panels
                                    });
                                    triggerNotification(`✅ Inversión actualizada a $${updatedTotal.toLocaleString('es-MX')} MXN con tarifa vigente.`);
                                  }}
                                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[9px] uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                                  title="Actualizar inversión con la tarifa oficial configurada"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>Actualizar a Tarifa Vigente</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedSimulationClientId(selectedProject.id);
                                  setCalcClientName(selectedProject.clientName || '');
                                  setCalcClientPhone(selectedProject.clientPhone || selectedProject.whatsappPhone || '');
                                  setCalcClientCity(selectedProject.municipalityState || '');
                                  setCalcBill(selectedProject.averageBill || 0);
                                  setCalcSpace(selectedProject.availableSpace || '');
                                  if (selectedProject.paymentMethodDesired) {
                                    setCalcPayMethod(selectedProject.paymentMethodDesired);
                                  }
                                  setSelectedProject(null);
                                  setActiveTab('cotizador');
                                  triggerNotification(`🧮 Cargando "${selectedProject.clientName}" en Cotizador Exprés con tarifa de $${activePanelPrice.toLocaleString('es-MX')} MXN.`);
                                }}
                                className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[9px] uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                              >
                                <Percent className="w-3 h-3" /> Abrir en Cotizador
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Simulations lists (Requirement 2.2) */}
                    <div className="space-y-2.5">
                      <h4 className="text-[10px] font-black uppercase text-indigo-700 tracking-wider border-b pb-1 flex items-center gap-1.5 mb-1">
                        <Percent className="w-3.5 h-3.5 text-indigo-600" />
                        Simulaciones de Crédito Activas (Máx 3)
                      </h4>

                      {selectedProject.savedSimulations && selectedProject.savedSimulations.length > 0 ? (
                        selectedProject.savedSimulations.map((sim, index) => (
                          <div key={`comm_sim_${sim.id || 'sim'}_${index}`} className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-2xl flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[8px] bg-indigo-600 text-white font-black px-1.5 py-0.2 rounded">Simulación {index + 1}</span>
                                <span className="font-black text-indigo-950 uppercase">{sim.financialPartner}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 font-bold mt-1">
                                Plazo: {sim.months} meses • Tasa: {sim.interestRate}%
                                {sim.advisorName && (
                                  <span className="text-emerald-700 font-extrabold ml-2">
                                    • Por: {sim.advisorName}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-[8px] font-extrabold text-slate-400 block">Pago Mensual</span>
                              <span className="font-mono font-black text-indigo-700 text-xs">${sim.monthlyPayment.toLocaleString('es-MX')}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center bg-slate-50 border p-4 rounded-2xl text-slate-400 italic">
                          No hay simulaciones guardadas en este expediente aún. Calcúlalas desde la pestaña "Cotizador".
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Multimedia files evidence checklist (Requirement 8) */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-slate-900 tracking-wider border-b pb-1.5 flex items-center gap-1.5">
                    <Image className="w-3.5 h-3.5 text-blue-600" />
                    Expediente Multimedia Cargado
                  </h4>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="bg-slate-50 border p-3 rounded-2xl space-y-2">
                      <span className="text-[8px] font-extrabold text-slate-500 uppercase block">CFE Frente</span>
                      <div 
                        onClick={() => selectedProject?.evidence?.cfeReceiptFront && isRealImage(selectedProject.evidence.cfeReceiptFront) && (setZoomedImage(selectedProject.evidence.cfeReceiptFront), setZoomedTitle('Recibo CFE Frente'))}
                        className={`w-full h-20 bg-slate-200 rounded-xl overflow-hidden relative group ${selectedProject?.evidence?.cfeReceiptFront && isRealImage(selectedProject.evidence.cfeReceiptFront) ? 'cursor-pointer' : ''}`}
                      >
                        {selectedProject?.evidence?.cfeReceiptFront && isRealImage(selectedProject.evidence.cfeReceiptFront) ? (
                          <>
                            <img src={selectedProject.evidence.cfeReceiptFront} alt="CFE" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-[9px] font-black uppercase text-white tracking-widest bg-slate-900/70 px-2 py-0.5 rounded">Zoom 🔍</span>
                            </div>
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold block pt-6">Sin Archivo</span>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-50 border p-3 rounded-2xl space-y-2">
                      <span className="text-[8px] font-extrabold text-slate-500 uppercase block">CFE Reverso</span>
                      <div 
                        onClick={() => selectedProject?.evidence?.cfeReceiptBack && isRealImage(selectedProject.evidence.cfeReceiptBack) && (setZoomedImage(selectedProject.evidence.cfeReceiptBack), setZoomedTitle('Recibo CFE Reverso'))}
                        className={`w-full h-20 bg-slate-200 rounded-xl overflow-hidden relative group ${selectedProject?.evidence?.cfeReceiptBack && isRealImage(selectedProject.evidence.cfeReceiptBack) ? 'cursor-pointer' : ''}`}
                      >
                        {selectedProject?.evidence?.cfeReceiptBack && isRealImage(selectedProject.evidence.cfeReceiptBack) ? (
                          <>
                            <img src={selectedProject.evidence.cfeReceiptBack} alt="CFE" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-[9px] font-black uppercase text-white tracking-widest bg-slate-900/70 px-2 py-0.5 rounded">Zoom 🔍</span>
                            </div>
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold block pt-6">Sin Archivo</span>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-50 border p-3 rounded-2xl space-y-2">
                      <span className="text-[8px] font-extrabold text-slate-500 uppercase block">Fachada Calle</span>
                      <div 
                        onClick={() => selectedProject?.evidence?.facade && isRealImage(selectedProject.evidence.facade) && (setZoomedImage(selectedProject.evidence.facade), setZoomedTitle('Fachada Calle'))}
                        className={`w-full h-20 bg-slate-200 rounded-xl overflow-hidden relative group ${selectedProject?.evidence?.facade && isRealImage(selectedProject.evidence.facade) ? 'cursor-pointer' : ''}`}
                      >
                        {selectedProject?.evidence?.facade && isRealImage(selectedProject.evidence.facade) ? (
                          <>
                            <img src={selectedProject.evidence.facade} alt="Fachada" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-[9px] font-black uppercase text-white tracking-widest bg-slate-900/70 px-2 py-0.5 rounded">Zoom 🔍</span>
                            </div>
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold block pt-6">Sin Archivo</span>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-50 border p-3 rounded-2xl space-y-2">
                      <span className="text-[8px] font-extrabold text-slate-500 uppercase block">Área Instalación</span>
                      <div 
                        onClick={() => selectedProject?.evidence?.installationAreaPhoto && isRealImage(selectedProject.evidence.installationAreaPhoto) && (setZoomedImage(selectedProject.evidence.installationAreaPhoto), setZoomedTitle('Área de Instalación'))}
                        className={`w-full h-20 bg-slate-200 rounded-xl overflow-hidden relative group ${selectedProject?.evidence?.installationAreaPhoto && isRealImage(selectedProject.evidence.installationAreaPhoto) ? 'cursor-pointer' : ''}`}
                      >
                        {selectedProject?.evidence?.installationAreaPhoto && isRealImage(selectedProject.evidence.installationAreaPhoto) ? (
                          <>
                            <img src={selectedProject.evidence.installationAreaPhoto} alt="Techo" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-[9px] font-black uppercase text-white tracking-widest bg-slate-900/70 px-2 py-0.5 rounded">Zoom 🔍</span>
                            </div>
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold block pt-6">Sin Archivo</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 📋 SECCIÓN OFICIAL DE LEVANTAMIENTO TÉCNICO Y DICTAMEN DE SITIO (CRM) */}
                <div className="bg-gradient-to-br from-emerald-50/70 via-slate-50 to-teal-50/50 border border-emerald-200/80 rounded-2xl p-4 md:p-5 space-y-4 shadow-xs">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-emerald-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                        📋
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                          Dictamen y Ficha de Levantamiento Técnico
                        </h4>
                        <p className="text-[9px] text-slate-500 font-medium">Registro oficial de viabilidad física, sombras, cableado y firma digital</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${
                        selectedProject.siteSurveyStatus === 'concluido' || selectedProject.evidence?.technicalSurveyDoc
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}>
                        {selectedProject.siteSurveyStatus === 'concluido' || selectedProject.evidence?.technicalSurveyDoc
                          ? '✅ Levantamiento Concluido'
                          : '⏳ Pendiente de Dictamen'}
                      </span>
                    </div>
                  </div>

                  {/* Resumen de Viabilidad Técnica */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white border border-emerald-100 p-2.5 rounded-xl">
                      <span className="text-[8px] font-extrabold text-slate-400 uppercase block">Ausencia Sombras</span>
                      <span className="text-xs font-black text-slate-800 flex items-center gap-1 mt-0.5">
                        {selectedProject.siteSurveyData?.noShadows !== false ? '☀️ Viable (Sin Sombras)' : '⚠️ Sombras Detectadas'}
                      </span>
                    </div>

                    <div className="bg-white border border-emerald-100 p-2.5 rounded-xl">
                      <span className="text-[8px] font-extrabold text-slate-400 uppercase block">Condición Techo/Loza</span>
                      <span className="text-xs font-black text-slate-800 uppercase mt-0.5 block">
                        🏠 {selectedProject.siteSurveyData?.roofCondition || 'Buena'}
                      </span>
                    </div>

                    <div className="bg-white border border-emerald-100 p-2.5 rounded-xl">
                      <span className="text-[8px] font-extrabold text-slate-400 uppercase block">Distancia Cableado CFE</span>
                      <span className="text-xs font-black text-slate-800 mt-0.5 block">
                        ⚡ {selectedProject.siteSurveyData?.wiringDistance || 12} metros
                      </span>
                    </div>

                    <div className="bg-white border border-emerald-100 p-2.5 rounded-xl">
                      <span className="text-[8px] font-extrabold text-slate-400 uppercase block">Firma Cliente</span>
                      <span className="text-xs font-black text-emerald-700 mt-0.5 block">
                        {selectedProject.siteSurveyData?.clientSignature ? '✍️ Registrada Digital' : '⏳ Pendiente de Firma'}
                      </span>
                    </div>
                  </div>

                  {/* Observaciones del Perito */}
                  {selectedProject.siteSurveyData?.surveyorNotes && (
                    <div className="bg-white border border-slate-200 p-3 rounded-xl space-y-1">
                      <span className="text-[8px] font-extrabold text-slate-400 uppercase block">Notas y Observaciones de Campo</span>
                      <p className="text-xs font-medium text-slate-700 italic">"{selectedProject.siteSurveyData.surveyorNotes}"</p>
                    </div>
                  )}

                  {/* Visualización de Firma si existe */}
                  {selectedProject.siteSurveyData?.clientSignature && (
                    <div className="bg-white border border-emerald-200 p-3 rounded-xl space-y-1.5 inline-block">
                      <span className="text-[8px] font-extrabold text-emerald-800 uppercase block">Firma Digital del Cliente en Sitio</span>
                      <div className="border border-slate-200 rounded-lg p-2 bg-slate-50 w-48 h-16 flex items-center justify-center overflow-hidden">
                        {selectedProject.siteSurveyData.clientSignature.startsWith('data:image') ? (
                          <img src={selectedProject.siteSurveyData.clientSignature} alt="Firma" className="max-h-full object-contain" />
                        ) : (
                          <span className="font-serif italic text-sm font-bold text-slate-800">{selectedProject.clientName} (Firmado)</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Documento PDF del Levantamiento */}
                  <div className="bg-white border border-emerald-200/90 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900">
                            {selectedProject.evidence?.technicalSurveyDoc ? 'Dictamen_Tecnico_Levantamiento_Firmado.pdf' : 'Ficha de Levantamiento Técnico (PDF)'}
                          </span>
                          {selectedProject.evidence?.technicalSurveyDoc && (
                            <span className="text-[8px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">
                              PDF Adjunto
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] text-slate-500 font-bold mt-0.5">
                          {selectedProject.evidence?.technicalSurveyDoc
                            ? 'Documento oficial con checklist de viabilidad, datos de azotea y firma digital del cliente.'
                            : 'Aún no se ha adjuntado el documento PDF oficial del levantamiento.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      {(selectedProject.evidence?.technicalSurveyDoc || selectedProject.siteSurveyStatus === 'concluido' || selectedProject.siteSurveyData) ? (
                        <>
                          <button
                            type="button"
                            onClick={() => downloadOrViewTechnicalSurvey(selectedProject, soluxConfig, triggerNotification)}
                            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                            title="Descargar Dictamen Técnico Oficial en PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Descargar PDF</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const phone = (selectedProject.clientPhone || '').replace(/\D/g, '');
                              const msg = `Hola *${selectedProject.clientName}*, te compartimos que el Dictamen Técnico Oficial del Levantamiento de tu propiedad ya está certificado y registrado en Solux Green.\n\nFolio: *${selectedProject.id}*\nEstatus: *VIABLE PARA INSTALACIÓN FOTOVOLTAICA*\n\nQuedamos a tus órdenes en *Solux Green*. 🌿⚡`;
                              window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`, '_blank');
                            }}
                            className="px-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border border-emerald-300 cursor-pointer"
                            title="Compartir Notificación de Dictamen por WhatsApp"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </button>
                        </>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => handleOpenSurveyModal(selectedProject)}
                        className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-xs"
                      >
                        <PenTool className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{selectedProject.evidence?.technicalSurveyDoc ? 'Editar / Actualizar Ficha' : 'Completar Ficha y PDF'}</span>
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* Modal footer */}
              <div className="bg-slate-100/80 border-t border-slate-200 p-4 md:p-5 flex flex-col sm:flex-row gap-3 justify-end items-stretch sm:items-center shrink-0">
                <button
                  onClick={() => handleOpenEditProject(selectedProject)}
                  className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-2 shadow-md hover:shadow-lg w-full sm:w-auto"
                >
                  <Key className="w-4 h-4 text-indigo-200 shrink-0" />
                  <span>✍️ Editar Datos y Credenciales</span>
                </button>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="px-5 py-3 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center w-full sm:w-auto shadow-sm"
                >
                  Cerrar Expediente
                </button>
              </div>
            </motion.div>
          </div>
        ); })()}
      </AnimatePresence>

      {/* ------------------- EXPEDIENTE EDIT FORM MODAL ------------------- */}
      <AnimatePresence>
        {isEditingProject && (
          <div className="fixed inset-0 z-[9995] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200 p-4 sm:p-6 md:p-8 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col relative"
            >
              <div className="shrink-0 pb-3 border-b border-slate-100 mb-4">
                <h3 className="text-sm sm:text-base font-black uppercase tracking-tight text-slate-900">Editar Expediente y Credenciales</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Modifica los parámetros de obra y acceso de este prospecto</p>
              </div>

              <div className="flex-1 overflow-y-auto pr-1.5 space-y-5 min-h-0 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold text-slate-500 uppercase">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={editProjectName}
                    onChange={e => setEditProjectName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold text-slate-500 uppercase">Celular WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={editProjectPhone}
                    onChange={e => setEditProjectPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold text-slate-500 uppercase">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    value={editProjectEmail}
                    onChange={e => setEditProjectEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold text-slate-500 uppercase">Google Maps URL</label>
                  <input
                    type="text"
                    value={editProjectMapsUrl}
                    onChange={e => setEditProjectMapsUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold text-slate-500 uppercase">Municipio y Estado *</label>
                  <input
                    type="text"
                    required
                    value={editProjectMunicipality}
                    onChange={e => setEditProjectMunicipality(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold text-slate-500 uppercase">CFE Recibo Bimestral Promedio ($)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={editProjectBill}
                    onChange={e => setEditProjectBill(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-bold [appearance:textfield]"
                    placeholder="Ej. 3500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold text-slate-500 uppercase">Hilos Acometida</label>
                  <select
                    value={editProjectWires}
                    onChange={e => setEditProjectWires(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-bold"
                  >
                    <option value={2}>2 Hilos (110V)</option>
                    <option value={3}>3 Hilos (220V)</option>
                    <option value={4}>4 Hilos (Trifásico)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold text-slate-500 uppercase">Espacio Disponible en Techo (m²)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={editProjectSpace}
                    onChange={e => setEditProjectSpace(e.target.value.replace(/[^0-9.]/g, ''))}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-bold [appearance:textfield]"
                    placeholder="Ej. 40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold text-slate-500 uppercase">Número de Medidores CFE</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={editProjectMeters}
                    onChange={e => setEditProjectMeters(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-bold [appearance:textfield]"
                    placeholder="Ej. 1"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold text-slate-500 uppercase">Estatus de Servicio CFE</label>
                  <select
                    value={editProjectCFE}
                    onChange={e => setEditProjectCFE(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-bold"
                  >
                    <option value="activo_sin_adeudo">Activo sin Adeudo</option>
                    <option value="con_adeudo">Con Adeudo</option>
                    <option value="inactivo">Inactivo / Nuevo Contrato</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold text-slate-500 uppercase">Validación de Propiedad</label>
                  <select
                    value={editProjectOwnership}
                    onChange={e => setEditProjectOwnership(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-bold"
                  >
                    <option value="propietario">Propietario Inmueble</option>
                    <option value="arrendatario_autorizado">Arrendatario Autorizado</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold text-slate-500 uppercase">Forma de Pago de Interés</label>
                  <select
                    value={editProjectPayMethod}
                    onChange={e => setEditProjectPayMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-bold text-slate-800 focus:outline-hidden focus:border-emerald-500 transition-all"
                  >
                    {getPaymentMethodOptions(soluxConfig.financingTerms, soluxConfig.defaultDownPaymentPercent).map((opt, idx) => (
                      <option key={`edit_pay_opt_${opt.value}_${idx}`} value={opt.value}>{opt.label}</option>
                    ))}
                    {!getPaymentMethodOptions(soluxConfig.financingTerms, soluxConfig.defaultDownPaymentPercent).some(o => o.value === editProjectPayMethod) && (
                      <option key={`edit_pay_opt_custom_${editProjectPayMethod || 'custom'}`} value={editProjectPayMethod}>
                        ⚙️ {formatPaymentMethod(editProjectPayMethod)} (Opción Anterior)
                      </option>
                    )}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold text-slate-500 uppercase font-bold text-indigo-600">Estatus de Expediente CRM *</label>
                  <select
                    value={editProjectStatus}
                    onChange={e => setEditProjectStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-indigo-200 rounded-xl font-bold text-indigo-850"
                  >
                    <option value="validacion">Validación</option>
                    <option value="levantamiento_tecnico">Levantamiento</option>
                    <option value="financiamiento_enviado">Simulado/Financiando</option>
                    <option value="cotizacion_final">Propuesta Final</option>
                    <option value="firma_contrato">Firma Contrato</option>
                    <option value="instalacion">Instalación</option>
                    <option value="tramite_cfe">Trámite CFE</option>
                    <option value="operacion">Operación</option>
                    <option value="desactivado">Desactivado (Inactivo)</option>
                  </select>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[9px] font-extrabold text-slate-500 uppercase">Cargas Eléctricas</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-xl">
                    {['Aire Acondicionado 220V', 'Estufa Eléctrica', 'Cargador Auto Eléctrico', 'Bomba de Agua'].map(load => {
                      const hasLoad = editProjectLoads.includes(load);
                      return (
                        <button
                          key={load}
                          type="button"
                          onClick={() => {
                            if (hasLoad) {
                              setEditProjectLoads(editProjectLoads.filter(l => l !== load));
                            } else {
                              setEditProjectLoads([...editProjectLoads, load]);
                            }
                          }}
                          className={`text-[9px] p-1.5 rounded-lg border font-bold ${
                            hasLoad ? 'bg-emerald-50 border-emerald-300 text-emerald-850' : 'bg-white text-slate-600'
                          }`}
                        >
                          {load}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Credentials Editing */}
                <div className="md:col-span-2 bg-indigo-50/60 border border-indigo-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-indigo-200 pb-2">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-indigo-600" />
                      Acceso al Portal y Credenciales del Cliente (Rol Cliente)
                    </h4>
                    <span className="text-[9px] font-extrabold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full uppercase">
                      Acceso Activo
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] font-extrabold text-indigo-700 uppercase flex items-center gap-1">
                          <User className="w-3 h-3 text-indigo-500" /> Usuario de Acceso *
                        </label>
                        <button
                          type="button"
                          onClick={() => setEditProjectUsername(generateUsernameForClient(editProjectName, editProjectPhone))}
                          className="text-[8px] font-extrabold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                        >
                          👤 Sugerir Usuario
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        value={editProjectUsername}
                        onChange={e => setEditProjectUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                        className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl font-bold font-mono text-xs text-indigo-800 shadow-2xs focus:outline-indigo-500"
                        placeholder="ej. roberto_3456"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] font-extrabold text-emerald-700 uppercase flex items-center gap-1">
                          <Lock className="w-3 h-3 text-emerald-500" /> Contraseña Segura *
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const newPass = generateSecurePassword();
                            setEditProjectPassword(newPass);
                            triggerNotification('⚡ Contraseña segura generada con éxito');
                          }}
                          className="text-[8px] font-extrabold text-emerald-700 hover:text-emerald-900 underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <RefreshCw className="w-2.5 h-2.5" /> Generar Segura
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={editProjectPassword}
                          onChange={e => setEditProjectPassword(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl font-bold font-mono text-xs text-emerald-900 shadow-2xs focus:outline-emerald-500"
                          placeholder="ej. Solux#8k2M!"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 items-center">
                    <div className="sm:col-span-2 space-y-0.5">
                      <label className="text-[8px] font-extrabold text-slate-500 uppercase block">Link Directo de Acceso al Portal</label>
                      <div className="flex items-center gap-1 bg-white border border-indigo-200 rounded-xl px-2.5 py-1.5">
                        <ExternalLink className="w-3 h-3 text-indigo-500 shrink-0" />
                        <span className="text-[10px] font-mono font-bold text-slate-700 truncate flex-1">{window.location.origin}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.origin);
                            triggerNotification('📋 ¡Link de acceso copiado al portapapeles!');
                          }}
                          className="text-[8px] font-extrabold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-lg border border-indigo-200 cursor-pointer flex items-center gap-1"
                        >
                          <Copy className="w-2.5 h-2.5" /> Copiar
                        </button>
                      </div>
                    </div>

                    <div className="sm:col-span-1 pt-3 sm:pt-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedProject) {
                            handleSendAuthorizedQuotationWhatsApp(
                              {
                                ...selectedProject,
                                clientName: editProjectName,
                                clientPhone: editProjectPhone,
                                averageBill: Number(editProjectBill) || selectedProject.averageBill,
                                status: editProjectStatus || 'validado'
                              },
                              editProjectUsername,
                              editProjectPassword
                            );
                          }
                        }}
                        className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[9px] uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        WhatsApp Credenciales
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sección de Evidencia Multimedia en Edición */}
                <div className="md:col-span-2 border-t border-slate-150 pt-4 space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-slate-900 tracking-wider">
                    Evidencia Multimedia y Recibos CFE (Editar)
                  </h4>
                  
                  {/* Inputs ocultos para edición */}
                  <input
                    type="file"
                    id="edit-file-front"
                    accept="image/*"
                    className="hidden"
                    onChange={e => handleEditEvidenceFileChange(e, 'cfeReceiptFront')}
                  />
                  <input
                    type="file"
                    id="edit-camera-front"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={e => handleEditEvidenceFileChange(e, 'cfeReceiptFront')}
                  />

                  <input
                    type="file"
                    id="edit-file-back"
                    accept="image/*"
                    className="hidden"
                    onChange={e => handleEditEvidenceFileChange(e, 'cfeReceiptBack')}
                  />
                  <input
                    type="file"
                    id="edit-camera-back"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={e => handleEditEvidenceFileChange(e, 'cfeReceiptBack')}
                  />

                  <input
                    type="file"
                    id="edit-file-facade"
                    accept="image/*"
                    className="hidden"
                    onChange={e => handleEditEvidenceFileChange(e, 'facade')}
                  />
                  <input
                    type="file"
                    id="edit-camera-facade"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={e => handleEditEvidenceFileChange(e, 'facade')}
                  />

                  <input
                    type="file"
                    id="edit-file-area"
                    accept="image/*"
                    className="hidden"
                    onChange={e => handleEditEvidenceFileChange(e, 'installationAreaPhoto')}
                  />
                  <input
                    type="file"
                    id="edit-camera-area"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={e => handleEditEvidenceFileChange(e, 'installationAreaPhoto')}
                  />

                  <input
                    type="file"
                    id="edit-file-additional"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleAddEditAdditionalReceipt}
                  />
                  <input
                    type="file"
                    id="edit-camera-additional"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleAddEditAdditionalReceipt}
                  />

                  {/* Grid de Evidencias Estándar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    {/* CFE Frente */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 flex flex-col justify-between h-40">
                      <span className="text-[8px] font-extrabold uppercase text-slate-500">Recibo CFE Frente</span>
                      {editProjectEvidence.cfeReceiptFront && isRealImage(editProjectEvidence.cfeReceiptFront) ? (
                        <div className="relative h-20 w-full border rounded-xl overflow-hidden bg-slate-100 flex flex-col items-center justify-center">
                          <img src={editProjectEvidence.cfeReceiptFront} alt="Frente CFE" className="w-full h-full object-cover" />
                          <button 
                            type="button" 
                            onClick={() => setEditProjectEvidence(p => ({ ...p, cfeReceiptFront: undefined }))}
                            className="absolute bottom-1 right-1 bg-rose-600 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow hover:bg-rose-700 transition-all cursor-pointer"
                          >
                            Borrar
                          </button>
                        </div>
                      ) : (
                        <div className="h-20 w-full border border-dashed rounded-xl flex flex-col items-center justify-center bg-white text-slate-400 gap-1">
                          <Upload className="w-4 h-4 opacity-40" />
                          <span className="text-[7px] uppercase font-bold">Sin Imagen</span>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-1 mt-1">
                        <button
                          type="button"
                          onClick={() => document.getElementById('edit-file-front')?.click()}
                          className="py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[7px] uppercase tracking-wider flex items-center justify-center gap-0.5 cursor-pointer"
                        >
                          <Upload className="w-2 h-2" /> Archivo
                        </button>
                        <button
                          type="button"
                          onClick={() => document.getElementById('edit-camera-front')?.click()}
                          className="py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-bold text-[7px] uppercase tracking-wider flex items-center justify-center gap-0.5 border border-emerald-100 cursor-pointer"
                        >
                          <Camera className="w-2 h-2" /> Cámara
                        </button>
                      </div>
                    </div>

                    {/* CFE Reverso */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 flex flex-col justify-between h-40">
                      <span className="text-[8px] font-extrabold uppercase text-slate-500">Recibo CFE Reverso</span>
                      {editProjectEvidence.cfeReceiptBack && isRealImage(editProjectEvidence.cfeReceiptBack) ? (
                        <div className="relative h-20 w-full border rounded-xl overflow-hidden bg-slate-100 flex flex-col items-center justify-center">
                          <img src={editProjectEvidence.cfeReceiptBack} alt="Reverso CFE" className="w-full h-full object-cover" />
                          <button 
                            type="button" 
                            onClick={() => setEditProjectEvidence(p => ({ ...p, cfeReceiptBack: undefined }))}
                            className="absolute bottom-1 right-1 bg-rose-600 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow hover:bg-rose-700 transition-all cursor-pointer"
                          >
                            Borrar
                          </button>
                        </div>
                      ) : (
                        <div className="h-20 w-full border border-dashed rounded-xl flex flex-col items-center justify-center bg-white text-slate-400 gap-1">
                          <Upload className="w-4 h-4 opacity-40" />
                          <span className="text-[7px] uppercase font-bold">Sin Imagen</span>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-1 mt-1">
                        <button
                          type="button"
                          onClick={() => document.getElementById('edit-file-back')?.click()}
                          className="py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[7px] uppercase tracking-wider flex items-center justify-center gap-0.5 cursor-pointer"
                        >
                          <Upload className="w-2 h-2" /> Archivo
                        </button>
                        <button
                          type="button"
                          onClick={() => document.getElementById('edit-camera-back')?.click()}
                          className="py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-bold text-[7px] uppercase tracking-wider flex items-center justify-center gap-0.5 border border-emerald-100 cursor-pointer"
                        >
                          <Camera className="w-2 h-2" /> Cámara
                        </button>
                      </div>
                    </div>

                    {/* Fachada */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 flex flex-col justify-between h-40">
                      <span className="text-[8px] font-extrabold uppercase text-slate-500">Fachada</span>
                      {editProjectEvidence.facade && isRealImage(editProjectEvidence.facade) ? (
                        <div className="relative h-20 w-full border rounded-xl overflow-hidden bg-slate-100 flex flex-col items-center justify-center">
                          <img src={editProjectEvidence.facade} alt="Fachada" className="w-full h-full object-cover" />
                          <button 
                            type="button" 
                            onClick={() => setEditProjectEvidence(p => ({ ...p, facade: undefined }))}
                            className="absolute bottom-1 right-1 bg-rose-600 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow hover:bg-rose-700 transition-all cursor-pointer"
                          >
                            Borrar
                          </button>
                        </div>
                      ) : (
                        <div className="h-20 w-full border border-dashed rounded-xl flex flex-col items-center justify-center bg-white text-slate-400 gap-1">
                          <Upload className="w-4 h-4 opacity-40" />
                          <span className="text-[7px] uppercase font-bold">Sin Imagen</span>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-1 mt-1">
                        <button
                          type="button"
                          onClick={() => document.getElementById('edit-file-facade')?.click()}
                          className="py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[7px] uppercase tracking-wider flex items-center justify-center gap-0.5 cursor-pointer"
                        >
                          <Upload className="w-2 h-2" /> Archivo
                        </button>
                        <button
                          type="button"
                          onClick={() => document.getElementById('edit-camera-facade')?.click()}
                          className="py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-bold text-[7px] uppercase tracking-wider flex items-center justify-center gap-0.5 border border-emerald-100 cursor-pointer"
                        >
                          <Camera className="w-2 h-2" /> Cámara
                        </button>
                      </div>
                    </div>

                    {/* Área Instalación */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 flex flex-col justify-between h-40">
                      <span className="text-[8px] font-extrabold uppercase text-slate-500">Área Instalación</span>
                      {editProjectEvidence.installationAreaPhoto && isRealImage(editProjectEvidence.installationAreaPhoto) ? (
                        <div className="relative h-20 w-full border rounded-xl overflow-hidden bg-slate-100 flex flex-col items-center justify-center">
                          <img src={editProjectEvidence.installationAreaPhoto} alt="Área Instalación" className="w-full h-full object-cover" />
                          <button 
                            type="button" 
                            onClick={() => setEditProjectEvidence(p => ({ ...p, installationAreaPhoto: undefined }))}
                            className="absolute bottom-1 right-1 bg-rose-600 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow hover:bg-rose-700 transition-all cursor-pointer"
                          >
                            Borrar
                          </button>
                        </div>
                      ) : (
                        <div className="h-20 w-full border border-dashed rounded-xl flex flex-col items-center justify-center bg-white text-slate-400 gap-1">
                          <Upload className="w-4 h-4 opacity-40" />
                          <span className="text-[7px] uppercase font-bold">Sin Imagen</span>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-1 mt-1">
                        <button
                          type="button"
                          onClick={() => document.getElementById('edit-file-area')?.click()}
                          className="py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[7px] uppercase tracking-wider flex items-center justify-center gap-0.5 cursor-pointer"
                        >
                          <Upload className="w-2 h-2" /> Archivo
                        </button>
                        <button
                          type="button"
                          onClick={() => document.getElementById('edit-camera-area')?.click()}
                          className="py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-bold text-[7px] uppercase tracking-wider flex items-center justify-center gap-0.5 border border-emerald-100 cursor-pointer"
                        >
                          <Camera className="w-2 h-2" /> Cámara
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Sección de Evidencias de Recibo de Luz Adicionales SIN LÍMITE */}
                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 mt-3 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-black uppercase text-indigo-950 tracking-tight block">
                          Evidencias Adicionales de Recibos de Luz / Obra
                        </span>
                        <span className="text-[8px] font-bold text-indigo-600 uppercase">
                          Sube fotos o recibos extras de forma ilimitada
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => document.getElementById('edit-file-additional')?.click()}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-extrabold text-[8px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                        >
                          <Plus className="w-3 h-3" /> Agregar Archivo(s)
                        </button>
                        <button
                          type="button"
                          onClick={() => document.getElementById('edit-camera-additional')?.click()}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-[8px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                        >
                          <Camera className="w-3 h-3" /> Tomar Foto
                        </button>
                      </div>
                    </div>

                    {editProjectEvidence.additionalReceipts && editProjectEvidence.additionalReceipts.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 pt-1">
                        {editProjectEvidence.additionalReceipts.map((src, index) => (
                          <div key={index} className="relative h-20 w-full border rounded-xl overflow-hidden bg-white shadow-xs group">
                            <img src={src} alt={`Evidencia adicional ${index + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => handleRemoveEditAdditionalReceipt(index)}
                              className="absolute top-1 right-1 bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-md shadow-md transition-all cursor-pointer"
                              title="Eliminar evidencia"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                            <div className="absolute bottom-0 inset-x-0 bg-slate-900/60 backdrop-blur-xs py-0.5 text-center">
                              <span className="text-[7px] text-white font-black uppercase">Evidencia #{index + 1}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 border border-dashed border-indigo-200 bg-white rounded-xl flex flex-col items-center justify-center gap-1.5 text-indigo-400">
                        <Upload className="w-5 h-5 opacity-40" />
                        <span className="text-[8px] uppercase font-bold tracking-wider">No hay recibos adicionales. Presiona "Agregar Archivo(s)" para subir imágenes.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              </div>

              <div className="pt-2 border-t flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsEditingProject(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditProject}
                  className="px-5 py-2 bg-slate-900 hover:bg-[#10B981] text-white font-extrabold uppercase text-[10px] tracking-wider rounded-xl cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lightbox Zoom Modal */}
      {zoomedImage && (
        <div 
          id="commercial-lightbox"
          className="fixed inset-0 bg-black/95 z-[10000] flex flex-col items-center justify-center p-4 animate-fadeIn" 
          onClick={() => { setZoomedImage(null); }}
        >
          <div className="relative max-w-4xl w-full max-h-[85vh] flex items-center justify-center" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute -top-12 right-0 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer border border-white/10"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={zoomedImage} 
              alt={zoomedTitle} 
              className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl border border-white/5" 
            />
          </div>
          <div className="mt-4 text-center">
            <span className="text-[10px] font-black uppercase text-white tracking-widest bg-slate-900/80 px-4 py-2 rounded-full border border-slate-750">
              {zoomedTitle}
            </span>
          </div>
        </div>
      )}

      {/* WhatsApp Sharing Modal for Promotional Materials */}
      {selectedShareMaterial && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[10010] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-extrabold text-xs uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-emerald-600 animate-pulse" />
                Compartir por WhatsApp
              </h3>
              <button 
                onClick={() => setSelectedShareMaterial(null)}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl">
                <p className="text-[11px] font-black uppercase text-emerald-800 tracking-wider">Material seleccionado:</p>
                <p className="text-xs font-black text-slate-950 mt-1">{selectedShareMaterial.title}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{selectedShareMaterial.description}</p>
              </div>

              {/* Client selection dropdown (always active, combining prospects, portal clients, and demo fallbacks) */}
              {(() => {
                const options: Array<{ id: string; name: string; phone: string; type: string }> = [];
                const seen = new Set<string>();

                // 1. Add from active solar projects
                if (userSolarProjects && userSolarProjects.length > 0) {
                  userSolarProjects.forEach(p => {
                    const key = p.clientName.toLowerCase().trim();
                    if (!seen.has(key)) {
                      seen.add(key);
                      options.push({
                        id: `proj-${p.id}`,
                        name: p.clientName,
                        phone: p.clientPhone || p.whatsappPhone || '',
                        type: 'Prospecto'
                      });
                    }
                  });
                }

                // 2. Add from users of role === 'client'
                if (users && users.length > 0) {
                  users.filter(u => u.role === 'client').forEach(u => {
                    const key = u.fullName.toLowerCase().trim();
                    if (!seen.has(key)) {
                      seen.add(key);
                      options.push({
                        id: `user-${u.id}`,
                        name: u.fullName,
                        phone: u.whatsapp || u.phone || '',
                        type: 'Cliente'
                      });
                    }
                  });
                }

                // 3. Fallback demo clients
                if (options.length === 0) {
                  const fallbackClients = [
                    { name: 'María Elena Pérez', phone: '5511223344', type: 'Demo' },
                    { name: 'Juan Carlos Ochoa', phone: '5555443322', type: 'Demo' },
                    { name: 'Inmobiliaria Alfa', phone: '5599887766', type: 'Demo' },
                    { name: 'Roberto Sánchez', phone: '5544332211', type: 'Demo' }
                  ];
                  fallbackClients.forEach((fc, idx) => {
                    options.push({
                      id: `fallback-${idx}`,
                      name: fc.name,
                      phone: fc.phone,
                      type: fc.type
                    });
                  });
                }

                return (
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Seleccionar de la Lista de Clientes / Prospectos</label>
                    <select 
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          const found = options.find(o => o.id === val);
                          if (found) {
                            setShareClientPhone(found.phone);
                            setShareCustomName(found.name);
                          }
                        } else {
                          setShareClientPhone('');
                          setShareCustomName('');
                        }
                      }}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all shadow-2xs cursor-pointer"
                    >
                      <option value="">-- Ingresar datos manualmente --</option>
                      {Array.from(new Set(options.map(o => o.type))).map(type => (
                        <optgroup key={type} label={type === 'Demo' ? 'Clientes de Prueba / Demo' : `${type}s`}>
                          {options.filter(o => o.type === type).map((o, idx) => (
                            <option key={`opt_${o.id || 'o'}_${idx}`} value={o.id}>
                              {o.name} {o.phone ? `(${o.phone})` : ''}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                );
              })()}

              <div className="space-y-1">
                <label className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Nombre del Destinatario (Opcional)</label>
                <input 
                  type="text" 
                  value={shareCustomName}
                  onChange={(e) => setShareCustomName(e.target.value)}
                  placeholder="Ej. Juan Pérez" 
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all shadow-2xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Número de WhatsApp (10 dígitos) *</label>
                <input 
                  type="tel" 
                  required
                  value={shareClientPhone}
                  onChange={(e) => setShareClientPhone(e.target.value)}
                  placeholder="Ej. 5512345678" 
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all shadow-2xs"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setSelectedShareMaterial(null)}
                className="w-1/2 py-2.5 border border-slate-200 text-slate-500 font-extrabold text-[10px] uppercase tracking-wider rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-center"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={executeShareWhatsApp}
                className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer text-center"
              >
                <Share2 className="w-3.5 h-3.5" />
                Abrir WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Prospect Registration Modal */}
      {isQuickProspectOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[10020] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-extrabold text-xs uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-600" />
                Registrar Prospecto Rápido
              </h3>
              <button 
                onClick={() => setIsQuickProspectOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateQuickProspect} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Nombre del Cliente *</label>
                <input 
                  type="text" 
                  required
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                  placeholder="Ej. Roberto Sánchez Ruiz" 
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Teléfono Celular (WhatsApp) *</label>
                <input 
                  type="tel" 
                  required
                  value={quickPhone}
                  onChange={(e) => setQuickPhone(e.target.value)}
                  placeholder="Ej. 5589123456" 
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Correo Electrónico (Opcional)</label>
                <input 
                  type="email" 
                  value={quickEmail}
                  onChange={(e) => setQuickEmail(e.target.value)}
                  placeholder="Ej. roberto.s@gmail.com" 
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Municipio y Estado *</label>
                <input 
                  type="text" 
                  required
                  value={quickMunicipality}
                  onChange={(e) => setQuickMunicipality(e.target.value)}
                  placeholder="Ej. Querétaro, Qro." 
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Pago Recibo CFE Promedio ($ MXN) *</label>
                <input 
                  type="text" 
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  value={quickBill}
                  onChange={(e) => setQuickBill(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Ej. 3500" 
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all [appearance:textfield]"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsQuickProspectOpen(false)}
                  className="w-1/2 py-2.5 text-slate-500 font-extrabold text-[10px] uppercase tracking-wider rounded-xl hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer text-center"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Autorización de Prospecto y Envío por WhatsApp */}
      {authModalProject && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-[10030] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-scaleUp my-8">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> Expediente Autorizado & Validado
                </span>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Envío de Cotización Autorizada y Accesos
                </h3>
                <p className="text-xs font-semibold text-slate-500">
                  Cliente: <strong className="text-slate-900">{authModalProject.clientName}</strong> ({authModalProject.clientPhone})
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setAuthModalProject(null)}
                className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Resumen de la Cotización que se le enviará */}
            <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-slate-50 border border-emerald-200/80 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-emerald-600" /> Datos de la Cotización
                </span>
                <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full uppercase">
                  {authModalProject.status ? authModalProject.status.replace('_', ' ') : 'validado'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                  <span className="text-[8px] font-sans font-bold uppercase text-slate-400 block">Recibo CFE Promedio</span>
                  <span className="font-extrabold text-slate-900">${(authModalProject.averageBill || 0).toLocaleString('es-MX')} MXN</span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                  <span className="text-[8px] font-sans font-bold uppercase text-slate-400 block">Módulos Calculados</span>
                  <span className="font-extrabold text-emerald-700">{authModalProject.estimatedPanels || Math.round(((authModalProject.averageBill || 0) / 1000) * 2)} Paneles (550W)</span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                  <span className="text-[8px] font-sans font-bold uppercase text-slate-400 block">Inversión Estimada</span>
                  <span className="font-extrabold text-slate-900">${(authModalProject.totalInvestment || ((authModalProject.estimatedPanels || 2) * activePanelPrice)).toLocaleString('es-MX')} MXN</span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                  <span className="text-[8px] font-sans font-bold uppercase text-slate-400 block">Ahorro Anual Estimado</span>
                  <span className="font-extrabold text-emerald-700">~${Math.round((authModalProject.averageBill || 0) * 6 * 0.9).toLocaleString('es-MX')} MXN/año</span>
                </div>
              </div>
            </div>

            {/* Credenciales y Link de Acceso a Configurar */}
            <div className="space-y-3.5 bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-indigo-600" /> Credenciales Generadas para el Cliente
                </span>
                <span className="text-[8px] font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                  Rol: Cliente Solux
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-extrabold text-slate-600 uppercase">Usuario de Acceso *</label>
                    <button
                      type="button"
                      onClick={() => setAuthModalUsername(generateUsernameForClient(authModalProject.clientName, authModalProject.clientPhone))}
                      className="text-[8px] font-extrabold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                    >
                      👤 Sugerir
                    </button>
                  </div>
                  <input 
                    type="text"
                    value={authModalUsername}
                    onChange={(e) => setAuthModalUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-extrabold text-emerald-700 uppercase">Contraseña Segura *</label>
                    <button
                      type="button"
                      onClick={() => {
                        const newPass = generateSecurePassword();
                        setAuthModalPassword(newPass);
                        triggerNotification('⚡ Nueva contraseña segura generada');
                      }}
                      className="text-[8px] font-extrabold text-emerald-700 hover:text-emerald-900 underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <RefreshCw className="w-2.5 h-2.5" /> Nueva Segura
                    </button>
                  </div>
                  <input 
                    type="text"
                    value={authModalPassword}
                    onChange={(e) => setAuthModalPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-mono font-extrabold text-emerald-900 focus:outline-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <label className="text-[9px] font-extrabold text-slate-600 uppercase block">Link Directo de Acceso al Portal</label>
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2">
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="text-[10px] font-mono font-bold text-slate-700 truncate flex-1">{window.location.origin}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.origin);
                      setAuthModalCopied(true);
                      setTimeout(() => setAuthModalCopied(false), 2500);
                      triggerNotification('📋 ¡Link de acceso copiado al portapapeles!');
                    }}
                    className={`text-[9px] font-extrabold px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                      authModalCopied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                    }`}
                  >
                    {authModalCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {authModalCopied ? '¡Copiado!' : 'Copiar Link'}
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  ensureClientUserCredentials(authModalProject, authModalUsername, authModalPassword);
                  handleSendAuthorizedQuotationWhatsApp(authModalProject, authModalUsername, authModalPassword);
                  setAuthModalProject(null);
                }}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Send className="w-4 h-4 animate-bounce" />
                Enviar Cotización y Accesos por WhatsApp
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAuthModalProject(null)}
                  className="w-1/2 py-2.5 text-slate-500 font-extrabold text-[10px] uppercase tracking-wider rounded-xl hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer text-center"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    ensureClientUserCredentials(authModalProject, authModalUsername, authModalPassword);
                    triggerNotification(`💾 ¡Credenciales guardadas y cliente activado correctamente!`);
                    setAuthModalProject(null);
                  }}
                  className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer text-center"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Guardar Sin Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------- MODAL DE LEVANTAMIENTO TÉCNICO INTERACTIVO (ASESOR VERDE & CRM) ------------------- */}
      {surveyModalProject && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  📋
                </div>
                <div>
                  <h3 className="text-base font-black uppercase text-slate-900">
                    Ficha de Levantamiento Técnico y Dictamen
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                    Cliente: <span className="text-emerald-700 font-black">{surveyModalProject.clientName}</span> ({surveyModalProject.municipalityState})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSurveyModalProject(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSurvey} className="space-y-4">
              {/* Checklist Viabilidad */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  Checklist de Viabilidad Física de Sitio
                </h4>

                <div className="space-y-3 pt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer bg-white p-3 rounded-xl border border-slate-200 hover:border-emerald-300 transition-all">
                    <input
                      type="checkbox"
                      checked={surveyNoShadows}
                      onChange={e => setSurveyNoShadows(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-black text-slate-800 block">Ausencia de Sombras Obstructoras</span>
                      <span className="text-[9px] text-slate-500 block">No hay árboles altos, construcciones vecinas ni pretiles que generen sombra crítica en el techo.</span>
                    </div>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase text-slate-500 block">Condición de Techo / Loza</label>
                      <select
                        value={surveyRoofCondition}
                        onChange={e => setSurveyRoofCondition(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                      >
                        <option value="buena">✅ Buena (Loza o lámina sólida)</option>
                        <option value="regular">⚠️ Regular (Requiere anclaje especial)</option>
                        <option value="mala">❌ Mala (Requiere impermeabilizar / reparar)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase text-slate-500 block">Distancia Cableado a Medidor (m)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={surveyWiringDistance || ''}
                        onChange={e => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setSurveyWiringDistance(val === '' ? 0 : Number(val));
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 [appearance:textfield]"
                        placeholder="Ej. 12"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase text-slate-500 block">Observaciones y Notas de Campo del Perito</label>
                    <textarea
                      rows={2}
                      value={surveyNotes}
                      onChange={e => setSurveyNotes(e.target.value)}
                      placeholder="Ej. Loza de concreto de 15cm con acceso por escalera marina. Medidor bifásico a 12 metros..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Subir PDF o Simular Levantamiento */}
              <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    Documento de Levantamiento Técnico Escaneado / PDF
                  </h4>
                  {surveyUploadedDocUrl && (
                    <span className="text-[8px] font-black uppercase bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded">
                      Documento Listo
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="bg-white border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center transition-all">
                    <Upload className="w-5 h-5 text-emerald-600" />
                    <span className="text-[10px] font-black text-slate-800 uppercase">Subir Archivo PDF/Imagen</span>
                    <span className="text-[8px] text-slate-400">PDF, JPG o PNG hasta 15MB</span>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={handleSurveyFileUpload}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleSimulateSurveyPDF}
                    className="bg-white border border-emerald-300 hover:bg-emerald-100/50 rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center transition-all shadow-2xs"
                  >
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                    <span className="text-[10px] font-black text-emerald-800 uppercase">Simular PDF Oficial Firmado</span>
                    <span className="text-[8px] text-emerald-600">Genera y adjunta PDF oficial Solux</span>
                  </button>
                </div>

                {surveyUploadedDocUrl && (
                  <div className="bg-white border border-emerald-200 rounded-xl px-3 py-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 truncate flex-1">
                      📄 {surveyUploadedDocName || 'Dictamen_Tecnico_Levantamiento_Firmado.pdf'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (surveyModalProject) {
                          downloadOrViewTechnicalSurvey(surveyModalProject, soluxConfig, triggerNotification);
                        } else {
                          triggerNotification('📄 Documento listo para guardar y descargar.');
                        }
                      }}
                      className="text-[9px] font-extrabold text-emerald-700 hover:underline uppercase shrink-0 cursor-pointer bg-transparent border-0"
                    >
                      Descargar PDF ↗
                    </button>
                  </div>
                )}
              </div>

              {/* Firma Digital del Cliente */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-emerald-600" />
                    Firma Digital del Cliente en Sitio (Aprobación)
                  </h4>
                  <button
                    type="button"
                    onClick={clearSurveyCanvas}
                    className="text-[9px] font-extrabold text-rose-600 hover:text-rose-800 uppercase cursor-pointer"
                  >
                    Limpiar Firma
                  </button>
                </div>

                <div className="bg-white border-2 border-slate-200 rounded-xl overflow-hidden touch-none relative h-28 flex items-center justify-center">
                  <canvas
                    ref={surveyCanvasRef}
                    width={400}
                    height={112}
                    onMouseDown={startDrawingSurvey}
                    onMouseMove={drawSurvey}
                    onMouseUp={stopDrawingSurvey}
                    onMouseLeave={stopDrawingSurvey}
                    onTouchStart={startDrawingSurvey}
                    onTouchMove={drawSurvey}
                    onTouchEnd={stopDrawingSurvey}
                    className="w-full h-full cursor-crosshair"
                  />
                  {!surveyHasSigned && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                        Dibuja la firma del cliente aquí con el dedo o mouse
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSurveyModalProject(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Guardar y Enviar al CRM</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------- MODAL ÉXITO RECOMENDACIÓN A ENLACE ------------------- */}
      {recSuccessModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
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
                <span className="text-[9px] font-black uppercase text-emerald-700 tracking-wider">¡Recomendación Enviada con Éxito!</span>
                <h3 className="text-base font-black text-slate-900 leading-tight">
                  {recSuccessModal.clientName}
                </h3>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold uppercase text-[9px]">Enlace Asignado:</span>
                <span className="font-extrabold text-slate-800">{recSuccessModal.enlaceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold uppercase text-[9px]">Notificación:</span>
                <span className="font-bold text-emerald-700">Enviada en tiempo real 🔔</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold uppercase text-[9px]">Folio Proyecto:</span>
                <span className="font-mono font-bold text-slate-700">{recSuccessModal.projectId}</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
              El Asesor de Enlace tiene este prospecto asignado en su módulo de <span className="font-black text-slate-800">Recomendaciones Recibidas</span> y recibirá el bono de comisión de <span className="font-black text-pink-700">$1,000 MXN</span> en cuanto se concrete la instalación física.
            </p>

            {/* Generación de Imagen y PDF del Expediente / Cotización de la Recomendación */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider block">
                Expediente y Cotización del Prospecto:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => exportProjectToImage(recSuccessModal.project, recSuccessModal.matchedUser)}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200 shadow-xs"
                >
                  <Image className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Descargar JPG</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportProjectToPDF(recSuccessModal.project, recSuccessModal.matchedUser)}
                  className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-rose-200 shadow-xs"
                >
                  <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Descargar PDF</span>
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              {recSuccessModal.enlacePhone && (
                <a
                  href={`https://wa.me/${formatWhatsAppPhone(recSuccessModal.enlacePhone)}?text=${encodeURIComponent(
                    `Hola ${recSuccessModal.enlaceName}, te acabo de recomendar al cliente ${recSuccessModal.clientName} desde el sistema Solux Green para seguimiento comercial. ¡Revisa tu módulo de Recomendaciones Recibidas en tu panel!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  💬 Avisar al Enlace por WhatsApp
                </a>
              )}

              <button
                type="button"
                onClick={() => setRecSuccessModal(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
