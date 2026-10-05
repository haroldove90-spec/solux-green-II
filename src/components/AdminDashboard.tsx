import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  Settings, 
  Menu, 
  X, 
  LogOut, 
  Plus, 
  Trash2, 
  Edit, 
  Check, 
  DollarSign, 
  Zap, 
  Briefcase, 
  UserCheck, 
  ArrowRight,
  TrendingUp,
  Percent,
  Calendar,
  Layers,
  Download,
  Phone,
  Mail,
  MapPin,
  Crown,
  Wrench,
  Handshake,
  Activity,
  FileText,
  Image,
  Video,
  Eye,
  Bell,
  CheckCircle,
  HelpCircle,
  Shield,
  BriefcaseIcon,
  CloudLightning,
  AlertTriangle,
  ChevronRight,
  UserCheck2,
  Lock,
  Smartphone,
  Share2,
  User,
  Camera,
  Upload,
  Award,
  Sun,
  Sparkles,
  RefreshCw,
  LogIn,
  SlidersHorizontal,
  Sliders,
  Save
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { motion, AnimatePresence } from 'motion/react';
import { Service, Technician, Material, ServiceType, SolarProject, AppNotification, LandingConfig, LandingSlide } from '../types';
import { ensureThreeSlides } from './AdminLandingPage';
import { SOLUX_LOGO_URL, SOLUX_LOGO_FALLBACK } from '../logoConfig';
import UserProfileModule from './UserProfileModule';
import { NotificationsBell } from './NotificationsBell';
import NotificationsModule from './NotificationsModule';
import PromotionalMaterialsModule from './PromotionalMaterialsModule';
import { findMatchingClientUser, getClientCredentials } from '../clientMatcher';
import { generateSystemFlowPDF } from '../systemFlowPdf';
import { exportProjectDossierPDF, exportProjectDossierImage, exportProjectsListPDF, downloadOrViewTechnicalSurvey } from '../pdfUtils';
import { 
  ACTIVE_PAYMENT_METHODS, 
  calculateSoluxFinancing, 
  formatPaymentMethod, 
  buildWhatsAppFinancialSummary,
  FinancingTermConfig,
  DEFAULT_FINANCING_TERMS,
  getPaymentMethodOptions
} from '../financingUtils';
import { formatWhatsAppPhone } from '../phoneUtils';

interface AdminDashboardProps {
  services: Service[];
  technicians: Technician[];
  materials: Material[];
  catalog: ServiceType[];
  onAssignService: (serviceId: string, technicianId: string) => void;
  onUpdateCatalogPrice: (id: string, newPrice: number) => void;
  onAddCatalogItem: (item: Omit<ServiceType, 'id'>) => void;
  onDeleteCatalogItem: (id: string) => void;
  onUpdateUrgenciesSurcharge: (amount: number) => void;
  urgencySurcharge: number;
  onExit?: () => void;
  
  // Solux Green additions
  soluxConfig: {
    panelBasePrice: number;
    monthlyInterestRate: number;
    siteSurveyCost: number;
    defaultDownPaymentPercent?: number;
    contadoDiscountPercent?: number;
    financingTermMonths?: number[];
    financingTerms?: FinancingTermConfig[];
  };
  onUpdateSoluxConfig: (config: any) => void;
  isOfflineMode: boolean;
  onToggleOfflineMode: () => void;
  users: any[];
  onUpdateUsers: (users: any[]) => void;
  solarProjects: SolarProject[];
  onUpdateSolarProject: (id: string, updated: Partial<SolarProject>) => void;
  onAddSolarProject?: (newProject: SolarProject) => void;
  onDeleteSolarProject?: (id: string) => void;
  onDeleteUser?: (id: string) => void;
  onDeleteTechnician?: (id: string) => void;
  onDeleteMaterial?: (id: string) => void;
  onDeleteService?: (id: string) => void;
  currentUser: any;
  onUpdateProfile: (updatedUser: any) => void;
  onSwitchUser?: (user: any) => void;
  activeRole?: 'admin' | 'comercial' | 'tech' | 'enlace' | 'client' | 'landingpage' | 'landingadmin' | null;
  onChangeRole?: (role: 'admin' | 'comercial' | 'tech' | 'enlace' | 'client' | 'landingpage' | 'landingadmin' | null) => void;
  
  // Notification system additions
  notifications: AppNotification[];
  onMarkNotificationAsRead: (id: string) => void;
  onMarkAllNotificationsAsRead: () => void;
  onClearAllNotifications?: () => void;
  onDeleteNotification?: (id: string) => void;

  // Landing page additions
  landingConfig?: LandingConfig;
  onUpdateLandingConfig?: (config: LandingConfig) => Promise<boolean>;
}

export default function AdminDashboard({
  services,
  technicians,
  materials,
  onExit,
  soluxConfig,
  onUpdateSoluxConfig,
  isOfflineMode,
  onToggleOfflineMode,
  users,
  onUpdateUsers,
  solarProjects,
  onUpdateSolarProject,
  onAddSolarProject,
  onDeleteSolarProject,
  onDeleteUser,
  onDeleteTechnician,
  onDeleteMaterial,
  onDeleteService,
  currentUser,
  onUpdateProfile,
  onSwitchUser,
  activeRole,
  onChangeRole,
  
  notifications,
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  onClearAllNotifications,
  onDeleteNotification,

  landingConfig,
  onUpdateLandingConfig
}: AdminDashboardProps) {
  // Slider buttons state for the Admin Landingpage tab
  const [dashSlides, setDashSlides] = useState<LandingSlide[]>(() => {
    return ensureThreeSlides(landingConfig?.heroSlides);
  });
  const [savingDashSlides, setSavingDashSlides] = useState(false);
  const [saveDashSlidesSuccess, setSaveDashSlidesSuccess] = useState(false);

  useEffect(() => {
    if (landingConfig?.heroSlides) {
      setDashSlides(ensureThreeSlides(landingConfig.heroSlides));
    }
  }, [landingConfig]);

  const handleUpdateDashSlide = (idx: number, updated: Partial<LandingSlide>) => {
    setDashSlides(prev => {
      const next = ensureThreeSlides(prev);
      next[idx] = { ...next[idx], ...updated };
      return next;
    });
  };

  const handleSaveDashSlides = async () => {
    if (!onUpdateLandingConfig || !landingConfig) return;
    setSavingDashSlides(true);
    try {
      const updatedConfig: LandingConfig = {
        ...landingConfig,
        heroSlides: dashSlides,
        heroCtaText: dashSlides[0]?.ctaText || landingConfig.heroCtaText,
        heroCtaLink: dashSlides[0]?.ctaLink || landingConfig.heroCtaLink
      };
      await onUpdateLandingConfig(updatedConfig);
      setSaveDashSlidesSuccess(true);
      setTimeout(() => setSaveDashSlidesSuccess(false), 3000);
    } catch (e) {
      console.warn('Error saving slider buttons from AdminDashboard:', e);
    } finally {
      setSavingDashSlides(false);
    }
  };
  const isRealImage = (url?: string) => {
    return !!url && url.trim() !== '' && !url.includes('placeholder') && !url.includes('PLACEHOLDER') && (url.startsWith('http') || url.startsWith('data:'));
  };

  const [activeTab, setActiveTab] = useState<'crm' | 'usuarios' | 'partners' | 'costo_panel' | 'configuracion' | 'landingpage' | 'perfil' | 'roles' | 'notificaciones' | 'promocionales'>(() => {
    const saved = localStorage.getItem('solux_admin_active_tab');
    return (saved as any) || 'crm';
  });

  const activePanelPrice = (soluxConfig?.panelBasePrice !== undefined && Number(soluxConfig.panelBasePrice) > 0)
    ? Number(soluxConfig.panelBasePrice)
    : 11000;

  const [panelPriceInput, setPanelPriceInput] = useState<string>(() => {
    return soluxConfig?.panelBasePrice ? String(soluxConfig.panelBasePrice) : '11000';
  });
  const [panelPriceSavedSuccess, setPanelPriceSavedSuccess] = useState(false);
  const [lastSavedPrice, setLastSavedPrice] = useState<number>(() => {
    return (soluxConfig?.panelBasePrice !== undefined && Number(soluxConfig.panelBasePrice) > 0)
      ? Number(soluxConfig.panelBasePrice)
      : 11000;
  });
  const [panelPriceLastUpdated, setPanelPriceLastUpdated] = useState<string>(() => {
    return localStorage.getItem('solux_panel_price_updated_at') || '';
  });

  // Keep input in sync if soluxConfig.panelBasePrice changes externally
  useEffect(() => {
    if (soluxConfig?.panelBasePrice) {
      setPanelPriceInput(String(soluxConfig.panelBasePrice));
      setLastSavedPrice(Number(soluxConfig.panelBasePrice));
    }
  }, [soluxConfig?.panelBasePrice]);

  const handleSavePanelPrice = (customValue?: number) => {
    const targetVal = customValue !== undefined ? customValue : Number(panelPriceInput.replace(/[^0-9]/g, ''));
    if (!targetVal || isNaN(targetVal) || targetVal <= 0) {
      triggerNotification('⚠️ Ingresa un costo válido para el módulo solar (mayor a 0).');
      return;
    }

    const now = new Date().toISOString();
    try {
      localStorage.setItem('solux_panel_price_updated_at', now);
    } catch (_) {}
    setPanelPriceLastUpdated(now);
    setPanelPriceInput(String(targetVal));
    setLastSavedPrice(targetVal);

    onUpdateSoluxConfig({
      ...soluxConfig,
      panelBasePrice: targetVal
    });

    setEditConfig(prev => ({
      ...prev,
      panelBasePrice: targetVal
    }));

    setPanelPriceSavedSuccess(true);
    setTimeout(() => setPanelPriceSavedSuccess(false), 4500);
    triggerNotification(`☀️ ¡Costo del panel actualizado a $${targetVal.toLocaleString('es-MX')} MXN! Sincronizado en ambos cotizadores.`);
  };
  const [activeSubTab, setActiveSubTab] = useState<'pipeline' | 'prospectos' | 'analisis' | 'nuevo'>(() => {
    const saved = localStorage.getItem('solux_admin_active_sub_tab');
    return (saved as any) || 'pipeline';
  });

  useEffect(() => {
    localStorage.setItem('solux_admin_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('solux_admin_active_sub_tab', activeSubTab);
  }, [activeSubTab]);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Filters for CRM Tab
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');

  // Filters for Personal / Users Tab
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'todos' | 'comercial' | 'enlace' | 'partner' | 'admin' | 'client'>('todos');

  // Selected project for Details Modal
  const [selectedProject, setSelectedProject] = useState<SolarProject | null>(null);

  // Zoom / lightbox states for evidence images
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [zoomedTitle, setZoomedTitle] = useState('');

  // --- New Prospect form states (same as in CommercialDashboard) ---
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

  // File Upload placeholders / values
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

  // --- Client credentials states ---
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');

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

  const calculatePanels = (bill: number) => {
    if (bill <= 0) return 0;
    const rawPanels = (bill / 1000) * 2;
    const dec = rawPanels - Math.floor(rawPanels);
    const p = dec >= 0.1 ? Math.ceil(rawPanels) : Math.floor(rawPanels);
    return Math.max(1, p);
  };

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
    const resolvedAdvisorName = selectedAdvisorUser ? (selectedAdvisorUser.fullName || selectedAdvisorUser.username) : (currentUser?.fullName || currentUser?.username || 'Administrador General');
    const resolvedAdvisorPhone = selectedAdvisorUser ? (selectedAdvisorUser.whatsapp || selectedAdvisorUser.phone || '') : (currentUser?.whatsapp || currentUser?.phone || '');
    const resolvedCreatedBy = selectedAdvisorUser ? selectedAdvisorUser.id : (currentUser?.id || 'admin_user');
    const resolvedRole = selectedAdvisorUser ? selectedAdvisorUser.role : 'admin';

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
    onUpdateUsers([newClientUser, ...(users || [])]);

    showNotification(`🚀 Prospecto "${formName}" registrado exitosamente.`);
    
    // Reset form fields
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormMapsUrl('');
    setFormMunicipality('');
    setFormBill('');
    setFormSpace('');
    setFormMeters('');
    setFormCFE('activo_sin_adeudo');
    setFormOwnership('propietario');
    setFormPayMethod('contado');
    setFormWires(2);
    setFormLoads([]);
    setFormUsername('');
    setFormPassword('');
    setEvidenceReceiptFront('');
    setEvidenceReceiptBack('');
    setEvidenceReceipt2Front('');
    setEvidenceFacade('');
    setEvidenceInstallArea('');
    
    // Switch active subtab to list or pipeline
    setActiveSubTab('prospectos');
    setSelectedProject(newProject);
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

    const matched = findMatchingClientUser(selectedProject, users);

    if (matched) {
      const updatedUser = {
        ...matched,
        username: editProjectUsername || matched.username,
        password: editProjectPassword || matched.password || 'Solux2026!',
        fullName: editProjectName,
        email: editProjectEmail || matched.email,
        whatsapp: editProjectPhone || matched.whatsapp
      };
      onUpdateUsers([updatedUser, ...users.filter(u => u.id !== matched.id)]);
    } else {
      const cleanName = editProjectName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12);
      const digits = (editProjectPhone || '').replace(/\D/g, '').slice(-4) || '2026';
      const fallbackUser = `${cleanName}_${digits}`;
      const newClientUser = {
        id: `usr_client_${Date.now()}`,
        username: editProjectUsername || fallbackUser,
        password: editProjectPassword || 'Solux2026!',
        role: 'client',
        fullName: editProjectName,
        email: editProjectEmail,
        whatsapp: editProjectPhone
      };
      onUpdateUsers([newClientUser, ...(users || [])]);
    }

    showNotification('💾 ¡Expediente y credenciales actualizadas correctamente!');
    setSelectedProject({ ...selectedProject, ...updatedProjFields });
    setIsEditingProject(false);
  };

  const exportProjectToPDF = async (proj: SolarProject, matchedUser: any) => {
    showNotification('⏳ Generando PDF oficial del expediente...');
    const creatorUser = users?.find((u: any) => u.id === proj.createdBy || u.fullName === proj.advisorName);
    const advisorObj = {
      fullName: proj.advisorName || creatorUser?.fullName || currentUser?.fullName || 'Administrador General Solux',
      phone: proj.advisorPhone || creatorUser?.whatsapp || currentUser?.whatsapp || ''
    };
    const success = await exportProjectDossierPDF(proj, advisorObj, matchedUser, soluxConfig);
    if (success) {
      showNotification('📄 Expediente PDF descargado exitosamente.');
    } else {
      showNotification('⚠️ Error al generar el PDF del expediente.', 'error');
    }
  };

  const exportProjectToExcel = (proj: SolarProject, matchedUser: any) => {
    const csvContent = "\uFEFF"
      + [
          ["ID Expediente", "Nombre del Cliente", "WhatsApp / Telefono", "Correo", "Municipio y Estado", "Google Maps URL", "Consumo CFE Promedio", "Paneles Estimados", "Inversion Total", "Hilos Acometida", "Metodo Pago Deseado", "Estatus del Expediente", "Usuario Acceso", "Contrasena Acceso", "Fecha Registro"].join(","),
          [
            proj.id,
            `"${proj.clientName.replace(/"/g, '""')}"`,
            `"${proj.clientPhone}"`,
            `"${proj.clientEmail || 'N/A'}"`,
            `"${proj.municipalityState.replace(/"/g, '""')}"`,
            `"${(proj.googleMapsUrl || 'N/A').replace(/"/g, '""')}"`,
            proj.averageBill,
            proj.estimatedPanels || 2,
            proj.totalInvestment,
            proj.wiresCount,
            `"${proj.paymentMethodDesired}"`,
            `"${proj.status.toUpperCase()}"`,
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
  };

  const triggerNotification = (msg: string) => {
    setNotification({ message: msg, type: 'success' });
    setTimeout(() => setNotification(null), 4000);
  };

  const exportProjectToImage = async (proj: SolarProject, matchedUser?: any) => {
    triggerNotification('⏳ Generando y descargando imagen completa con todas las evidencias...');
    try {
      const creatorUser = users?.find((u: any) => u.id === proj.createdBy || u.fullName === proj.advisorName);
      const advName = proj.advisorName || creatorUser?.fullName || currentUser?.fullName || 'Administrador Solux Green';
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
    const advName = proj.advisorName || creatorUser?.fullName || currentUser?.fullName || 'Administrador / Asesor Solux';
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
      ctx.fillText((proj.paymentMethodDesired || 'Contado / Crédito').toUpperCase(), 430, 595);

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
    const investment = proj.totalInvestment || (panels * 14500);
    const averageBill = proj.averageBill || 0;

    let activeClientUser = matchedUser;
    if (!activeClientUser || !activeClientUser.username) {
      const creds = getClientCredentials(proj, users);
      activeClientUser = creds.user || {
        id: `usr_client_${Date.now()}`,
        username: creds.username,
        password: creds.password,
        role: 'client' as const,
        fullName: proj.clientName,
        whatsapp: proj.clientPhone,
        email: proj.clientEmail || `${creds.username}@soluxgreen.com.mx`
      };
    }

    const credentialText = activeClientUser 
      ? `\n\n🔐 *Acceso a tu Portal de Cliente:* \n🌐 Link de Acceso: ${window.location.origin}\n👤 Usuario: *${activeClientUser.username}*\n🔑 Contraseña: *${activeClientUser.password}*`
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
    triggerNotification('💬 Abriendo chat de WhatsApp para compartir cotización y credenciales...');
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
        `"${proj.paymentMethodDesired}"`,
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
    showNotification('⏳ Generando reporte global en PDF...');
    const success = await exportProjectsListPDF(projects, 'Reporte Global de Expedientes (Administración)');
    if (success) {
      showNotification('📄 Reporte PDF descargado exitosamente.');
    } else {
      showNotification('⚠️ Error al generar el PDF del reporte.', 'error');
    }
  };
  
    // Users Form State
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isUserFormUsernameManuallyEdited, setIsUserFormUsernameManuallyEdited] = useState(false);
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    role: 'comercial' as 'admin' | 'comercial' | 'enlace' | 'partner',
    parentId: '', // parent user for hierachy
    whatsapp: '', // whatsapp field
    prospectingAreas: '', // Área(s) de prospectación
    workShift: 'Tiempo completo' as 'Tiempo completo' | 'Tiempo parcial', // Tipo de jornada laboral
    bankAccountHolder: '', // Titular de la cuenta
    bankName: '', // Institución bancaria (excepto SPIN by OXXO)
    bankClabe: '', // CLABE interbancaria de 18 dígitos
    streetAndNumber: '',
    colonia: '',
    municipio: '',
    zipCode: '',
    ineFrontDoc: '',
    ineBackDoc: ''
  });

  const handleUserFullNameChange = (val: string) => {
    setUserForm(prev => {
      const slug = val
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, '_')
        .replace(/__+/g, '_')
        .replace(/^_|_$/g, '');

      const shouldUpdateUsername = 
        !editingUserId && (
          !isUserFormUsernameManuallyEdited ||
          !prev.username ||
          prev.username.toLowerCase() === 'gustavo' ||
          prev.username.toLowerCase() === 'admin' ||
          prev.username === slug.slice(0, -1) ||
          prev.username.startsWith(slug.slice(0, 3))
        );

      const newUsername = shouldUpdateUsername ? slug : prev.username;
      const newEmail = shouldUpdateUsername && (!prev.email || prev.email.includes('@soluxgreen.com'))
        ? (slug ? `${slug}@soluxgreen.com.mx` : '')
        : prev.email;

      return {
        ...prev,
        fullName: val,
        username: newUsername,
        email: newEmail,
        bankAccountHolder: !prev.bankAccountHolder || prev.bankAccountHolder === prev.fullName ? val : prev.bankAccountHolder
      };
    });
  };

  const [lastSavedUser, setLastSavedUser] = useState<any | null>(null);

  // Partner Form State
  const [isPartnerFormOpen, setIsPartnerFormOpen] = useState(false);
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);
  const [partnerForm, setPartnerForm] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    whatsapp: '',
    coverage: '',
    crewsCount: 0,
    surveyRate: 0,
    panelRate: 0,
    address: '',
    locationUrl: '',
    inePhotos: [] as string[],
    bankAccountHolder: '',
    bankName: '',
    bankClabe: '',
    accountNumber: '',
    cardNumber: '',
    paymentStatusType: 'Por proyecto' as string,
    partnerStatus: 'activo'
  });

  const handleOpenAddPartner = () => {
    setEditingPartnerId(null);
    setPartnerForm({
      username: '',
      email: '',
      fullName: '',
      password: '',
      whatsapp: '',
      coverage: '',
      crewsCount: 0,
      surveyRate: 0,
      panelRate: 0,
      address: '',
      locationUrl: '',
      inePhotos: [],
      bankAccountHolder: '',
      bankName: '',
      bankClabe: '',
      accountNumber: '',
      cardNumber: '',
      paymentStatusType: 'Por proyecto',
      partnerStatus: 'activo'
    });
    setIsPartnerFormOpen(true);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const el = document.getElementById('admin-partner-form-container');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleOpenEditPartner = (partner: any) => {
    setEditingPartnerId(partner.id);
    setPartnerForm({
      username: partner.username || '',
      email: partner.email || '',
      fullName: partner.fullName || '',
      password: partner.password || '',
      whatsapp: partner.whatsapp || '',
      coverage: partner.coverage || '',
      crewsCount: partner.crewsCount !== undefined ? Number(partner.crewsCount) : 0,
      surveyRate: partner.surveyRate !== undefined ? Number(partner.surveyRate) : 0,
      panelRate: partner.panelRate !== undefined ? Number(partner.panelRate) : 0,
      address: partner.address || '',
      locationUrl: partner.locationUrl || '',
      inePhotos: Array.isArray(partner.inePhotos) ? partner.inePhotos : [],
      bankAccountHolder: partner.bankAccountHolder || '',
      bankName: partner.bankName || '',
      bankClabe: partner.bankClabe || '',
      accountNumber: partner.accountNumber || '',
      cardNumber: partner.cardNumber || '',
      paymentStatusType: partner.paymentStatusType || 'Por proyecto',
      partnerStatus: partner.partnerStatus || 'activo'
    });
    setIsPartnerFormOpen(true);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const el = document.getElementById('admin-partner-form-container');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handlePartnerIneUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files) as File[];
    const oversized = fileList.some(file => file.size > 12 * 1024 * 1024);
    if (oversized) {
      showNotification('⚠️ Una o más imágenes superan los 12 MB.', 'error');
      return;
    }

    const readers = fileList.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (evt) => {
          resolve(evt.target?.result as string);
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then(newImages => {
      setPartnerForm(prev => ({
        ...prev,
        inePhotos: [...(prev.inePhotos || []), ...newImages]
      }));
      showNotification(`✅ ¡${newImages.length} foto(s) de INE cargadas con éxito!`);
    });
  };

  const handleRemovePartnerInePhoto = (index: number) => {
    setPartnerForm(prev => ({
      ...prev,
      inePhotos: (prev.inePhotos || []).filter((_, i) => i !== index)
    }));
  };

  const handleSavePartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerForm.username.trim() || !partnerForm.fullName.trim()) {
      showNotification('Por favor llena los campos obligatorios.', 'error');
      return;
    }

    const partnerData = {
      username: partnerForm.username.trim(),
      email: partnerForm.email.trim() || `${partnerForm.username.trim()}@soluxgreen.com.mx`,
      fullName: partnerForm.fullName.trim(),
      password: partnerForm.password || 'password123',
      whatsapp: partnerForm.whatsapp.trim(),
      role: 'partner' as const,
      coverage: partnerForm.coverage,
      crewsCount: Number(partnerForm.crewsCount),
      surveyRate: Number(partnerForm.surveyRate),
      panelRate: Number(partnerForm.panelRate),
      address: partnerForm.address.trim(),
      locationUrl: partnerForm.locationUrl.trim(),
      inePhotos: partnerForm.inePhotos || [],
      bankAccountHolder: partnerForm.bankAccountHolder.trim(),
      bankName: partnerForm.bankName.trim(),
      bankClabe: partnerForm.bankClabe.trim(),
      accountNumber: partnerForm.accountNumber.trim(),
      cardNumber: partnerForm.cardNumber.trim(),
      paymentStatusType: partnerForm.paymentStatusType,
      partnerStatus: partnerForm.partnerStatus
    };

    if (editingPartnerId) {
      const updatedUser = { id: editingPartnerId, ...partnerData, updatedAt: new Date().toISOString() };
      onUpdateUsers([updatedUser, ...users.filter(u => u.id !== editingPartnerId)]);
      showNotification('🤝 Partner actualizado con éxito.');
      setLastSavedUser(updatedUser);
    } else {
      const nowIso = new Date().toISOString();
      const newUser = {
        id: `usr_${Date.now()}`,
        ...partnerData,
        createdAt: nowIso,
        createdDate: nowIso
      };
      onUpdateUsers([newUser, ...(users || [])]);
      showNotification('🤝 Nuevo Partner registrado en el sistema.');
      setLastSavedUser(newUser);
    }
    setIsPartnerFormOpen(false);
  };

  const generateSecurePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
    let pass = '';
    // ensure at least one uppercase, lowercase, digit, and special char
    pass += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    pass += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    pass += '0123456789'[Math.floor(Math.random() * 10)];
    pass += '!@#$%&*'[Math.floor(Math.random() * 7)];
    
    for (let i = 0; i < 6; i++) {
      pass += chars[Math.floor(Math.random() * chars.length)];
    }
    // Shuffle
    const shuffled = pass.split('').sort(() => 0.5 - Math.random()).join('');
    setUserForm(prev => ({ ...prev, password: shuffled }));
  };

  const generateSecurePasswordForPartner = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
    let pass = '';
    pass += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    pass += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    pass += '0123456789'[Math.floor(Math.random() * 10)];
    pass += '!@#$%&*'[Math.floor(Math.random() * 7)];
    
    for (let i = 0; i < 6; i++) {
      pass += chars[Math.floor(Math.random() * chars.length)];
    }
    const shuffled = pass.split('').sort(() => 0.5 - Math.random()).join('');
    setPartnerForm(prev => ({ ...prev, password: shuffled }));
  };

  const getWhatsAppShareLink = (user: any) => {
    const roleName = user.role === 'admin' 
      ? 'Administrador General' 
      : user.role === 'comercial' 
      ? 'Asesor Verde (Comercial)' 
      : user.role === 'enlace' 
      ? 'Asesor de Enlace (Referidos)' 
      : 'Partner de Instalaciones (Socio)';
      
    const text = `¡Hola ${user.fullName}! Te damos la bienvenida a Solux Green Premium.

Tus credenciales para ingresar al sistema son:
• Usuario: ${user.username}
${user.email ? `• Correo: ${user.email}\n` : ''}• Contraseña: ${user.password}
• Rol: ${roleName}

Enlace de acceso al sistema: ${window.location.origin}

¡Éxito!`;

    const rawPhone = user.whatsapp ? user.whatsapp.replace(/\D/g, '') : '';
    const phone = rawPhone.length === 10 ? '52' + rawPhone : rawPhone;
    return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;
  };

  // Config parameters editing state
  const [editConfig, setEditConfig] = useState<{
    panelBasePrice: number | string;
    monthlyInterestRate: number | string;
    siteSurveyCost: number | string;
    defaultDownPaymentPercent: number | string;
    contadoDiscountPercent: number | string;
    financingTermMonths: number[];
    financingTerms: FinancingTermConfig[];
  }>(() => {
    return {
      panelBasePrice: soluxConfig?.panelBasePrice ?? 11000,
      monthlyInterestRate: soluxConfig?.monthlyInterestRate ?? 4.9,
      siteSurveyCost: soluxConfig?.siteSurveyCost ?? 250,
      defaultDownPaymentPercent: soluxConfig?.defaultDownPaymentPercent ?? 50,
      contadoDiscountPercent: soluxConfig?.contadoDiscountPercent ?? 5,
      financingTermMonths: soluxConfig?.financingTermMonths ?? [3, 6],
      financingTerms: soluxConfig?.financingTerms ?? [
        { id: 'term_3', months: 3, label: '3 Meses', monthlyInterestRate: 4.9, downPaymentPercent: 50, active: true },
        { id: 'term_6', months: 6, label: '6 Meses', monthlyInterestRate: 4.9, downPaymentPercent: 50, active: true }
      ]
    };
  });

  // Track if user has modified the configuration in the admin form without saving
  const [isConfigDirty, setIsConfigDirty] = useState(false);

  // State for adding a new credit term in the Admin parameters UI
  const [newTermMonths, setNewTermMonths] = useState<number | string>('');
  const [newTermRate, setNewTermRate] = useState<number | string>('');
  const [newTermDownPayment, setNewTermDownPayment] = useState<number | string>('');
  const [newTermLabel, setNewTermLabel] = useState<string>('');
  const [simInvestmentAmount, setSimInvestmentAmount] = useState<number | string>('');

  useEffect(() => {
    // Only synchronize from incoming soluxConfig if the admin is NOT actively editing
    if (!isConfigDirty && soluxConfig) {
      setEditConfig({
        panelBasePrice: soluxConfig.panelBasePrice ?? 11000,
        monthlyInterestRate: soluxConfig.monthlyInterestRate ?? 4.9,
        siteSurveyCost: soluxConfig.siteSurveyCost ?? 250,
        defaultDownPaymentPercent: soluxConfig.defaultDownPaymentPercent ?? 50,
        contadoDiscountPercent: soluxConfig.contadoDiscountPercent ?? 5,
        financingTermMonths: soluxConfig.financingTermMonths ?? [3, 6],
        financingTerms: soluxConfig.financingTerms ?? []
      });
      if (soluxConfig.panelBasePrice) {
        setPanelPriceInput(String(soluxConfig.panelBasePrice));
        setLastSavedPrice(Number(soluxConfig.panelBasePrice));
      }
    }
  }, [soluxConfig, isConfigDirty]);

  const handleResetConfig = () => {
    setEditConfig({
      panelBasePrice: soluxConfig?.panelBasePrice ?? 11000,
      monthlyInterestRate: soluxConfig?.monthlyInterestRate ?? 4.9,
      siteSurveyCost: soluxConfig?.siteSurveyCost ?? 250,
      defaultDownPaymentPercent: soluxConfig?.defaultDownPaymentPercent ?? 50,
      contadoDiscountPercent: soluxConfig?.contadoDiscountPercent ?? 5,
      financingTermMonths: soluxConfig?.financingTermMonths ?? [3, 6],
      financingTerms: soluxConfig?.financingTerms ?? []
    });
    setIsConfigDirty(false);
    showNotification('🔄 Parámetros restablecidos a la configuración guardada actualmente.');
  };

  // Push Notifications Catalog State
  const [pushNotifications, setPushNotifications] = useState([
    { id: 'p_1', title: 'Asignación de Levantamiento Técnico', body: 'Se te ha asignado un levantamiento técnico para el cliente {cliente}. Por favor revisa tu panel.', role: 'partner', active: true },
    { id: 'p_2', title: 'Viabilidad Técnica Aprobada', body: '¡Excelentes noticias! El levantamiento técnico para el cliente {cliente} ha sido Aprobado.', role: 'comercial', active: true },
    { id: 'p_3', title: 'Viabilidad Técnica Rechazada', body: 'Atención: El levantamiento técnico para el cliente {cliente} ha sido dictaminado como No Viable.', role: 'comercial', active: true },
    { id: 'p_4', title: 'Comisión por Instalación Pagada', body: 'Se ha completado la instalación del proyecto {cliente}. Tu comisión de $1,000 MXN ha sido depositada.', role: 'enlace', active: true },
    { id: 'p_5', title: 'Nuevo Referido Enlazado', body: 'Tu referido en enlace ha registrado un nuevo prospecto: {cliente}. ¡Comienza su asesoría solar!', role: 'comercial', active: true },
  ]);

  const [testNotificationId, setTestNotificationId] = useState('p_1');
  const [testNotificationTarget, setTestNotificationTarget] = useState('');

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  const handleSaveConfig = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    // Update financingTermMonths array to keep synchronized with active financingTerms
    const updatedMonths = (editConfig.financingTerms || [])
      .filter(t => t.active)
      .map(t => t.months)
      .sort((a, b) => a - b);

    const cleanedTerms = (editConfig.financingTerms || []).map(t => ({
      ...t,
      monthlyInterestRate: Number(t.monthlyInterestRate) || 0,
      downPaymentPercent: Number(t.downPaymentPercent) || 0
    }));

    const parsedBasePrice = editConfig.panelBasePrice !== '' ? Number(editConfig.panelBasePrice) : (Number(soluxConfig?.panelBasePrice) || 11000);
    const parsedMonthlyRate = editConfig.monthlyInterestRate !== '' ? Number(editConfig.monthlyInterestRate) : (Number(soluxConfig?.monthlyInterestRate) || 4.9);
    const parsedSurveyCost = editConfig.siteSurveyCost !== '' ? Number(editConfig.siteSurveyCost) : (Number(soluxConfig?.siteSurveyCost) || 250);
    const parsedDownPercent = editConfig.defaultDownPaymentPercent !== '' ? Number(editConfig.defaultDownPaymentPercent) : (Number(soluxConfig?.defaultDownPaymentPercent) || 50);
    const parsedContadoDiscount = editConfig.contadoDiscountPercent !== '' ? Number(editConfig.contadoDiscountPercent) : (Number(soluxConfig?.contadoDiscountPercent) || 5);

    const fullConfig = {
      ...soluxConfig,
      ...editConfig,
      panelBasePrice: parsedBasePrice,
      monthlyInterestRate: parsedMonthlyRate,
      siteSurveyCost: parsedSurveyCost,
      defaultDownPaymentPercent: parsedDownPercent,
      contadoDiscountPercent: parsedContadoDiscount,
      financingTerms: cleanedTerms.length > 0 ? cleanedTerms : (soluxConfig?.financingTerms || []),
      financingTermMonths: updatedMonths.length > 0 ? updatedMonths : (soluxConfig?.financingTermMonths || [3, 6])
    };

    onUpdateSoluxConfig(fullConfig);
    setPanelPriceInput(String(parsedBasePrice));
    setLastSavedPrice(parsedBasePrice);
    setIsConfigDirty(false);
    localStorage.setItem('solux_config_configured', 'true');
    const now = new Date().toISOString();
    try {
      localStorage.setItem('solux_panel_price_updated_at', now);
    } catch (_) {}
    setPanelPriceLastUpdated(now);
    showNotification(`⚙️ Parámetros globales actualizados con éxito. Costo oficial base: $${parsedBasePrice.toLocaleString('es-MX')} MXN.`);
  };

  const handleAddFinancingTerm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTermMonths || Number(newTermMonths) <= 0) {
      showNotification('⚠️ El plazo en meses debe ser mayor a 0.', 'error');
      return;
    }
    const termId = `term_${newTermMonths}m_${Date.now().toString().slice(-4)}`;
    const label = newTermLabel.trim() || `${newTermMonths} Meses`;
    const newTerm: FinancingTermConfig = {
      id: termId,
      months: Number(newTermMonths),
      label: label,
      monthlyInterestRate: newTermRate !== '' ? Number(newTermRate) : (Number(editConfig.monthlyInterestRate) || 0),
      downPaymentPercent: newTermDownPayment !== '' ? Number(newTermDownPayment) : (Number(editConfig.defaultDownPaymentPercent) || 0),
      active: true,
      description: `${Number(newTermDownPayment) || 0}% Enganche + ${newTermMonths} pagos`
    };

    const updatedTerms = [...(editConfig.financingTerms || []), newTerm];
    const updatedMonths = updatedTerms.filter(t => t.active).map(t => t.months).sort((a, b) => a - b);
    const newConfigState = {
      ...editConfig,
      financingTerms: updatedTerms,
      financingTermMonths: updatedMonths
    };

    setIsConfigDirty(true);
    setEditConfig(newConfigState);
    setNewTermMonths('');
    setNewTermRate('');
    setNewTermDownPayment('');
    setNewTermLabel('');
    showNotification(`✅ Plazo a ${newTermMonths} Meses agregado con éxito.`);
  };

  const handleToggleFinancingTerm = (termId: string) => {
    const updatedTerms = (editConfig.financingTerms || []).map(t => 
      t.id === termId ? { ...t, active: !t.active } : t
    );
    const updatedMonths = updatedTerms.filter(t => t.active).map(t => t.months).sort((a, b) => a - b);
    setIsConfigDirty(true);
    setEditConfig(prev => ({
      ...prev,
      financingTerms: updatedTerms,
      financingTermMonths: updatedMonths
    }));
  };

  const handleDeleteFinancingTerm = (termId: string) => {
    const updatedTerms = (editConfig.financingTerms || []).filter(t => t.id !== termId);
    if (updatedTerms.length === 0) {
      showNotification('⚠️ Debe haber al menos un esquema de financiamiento configurado.', 'error');
      return;
    }
    const updatedMonths = updatedTerms.filter(t => t.active).map(t => t.months).sort((a, b) => a - b);
    setIsConfigDirty(true);
    setEditConfig(prev => ({
      ...prev,
      financingTerms: updatedTerms,
      financingTermMonths: updatedMonths
    }));
    showNotification('🗑️ Plazo de crédito eliminado.');
  };

  const handleUpdateFinancingTermField = (termId: string, field: keyof FinancingTermConfig, value: any) => {
    const updatedTerms = (editConfig.financingTerms || []).map(t => {
      if (t.id === termId) {
        return { ...t, [field]: value };
      }
      return t;
    });
    setIsConfigDirty(true);
    setEditConfig(prev => ({ ...prev, financingTerms: updatedTerms }));
  };

  // Export to CSV Functionality (Requirement 1.4)
  const handleExportCSV = () => {
    // Columns: Name, Phone, Email, Municipality/State, Average Bill, Estimated Panels, Total Investment, Payment Method, Status, Referral Code, Partner Assigned, Created Date
    const headers = [
      'ID Proyecto',
      'Nombre Cliente',
      'Teléfono',
      'Email',
      'Municipio y Estado',
      'Factura CFE Bimestral ($)',
      'Paneles Estimados',
      'Inversión Total ($)',
      'Método de Pago Deseado',
      'Estatus Actual',
      'Código Referido',
      'ID Partner Asignado',
      'Fecha Creación'
    ];

    const rows = solarProjects.map(proj => [
      proj.id,
      `"${proj.clientName.replace(/"/g, '""')}"`,
      `"${proj.clientPhone}"`,
      `"${proj.clientEmail || ''}"`,
      `"${proj.municipalityState.replace(/"/g, '""')}"`,
      proj.averageBill,
      proj.estimatedPanels,
      proj.totalInvestment,
      `"${proj.paymentMethodDesired}"`,
      `"${proj.status}"`,
      `"${proj.referrerCode || 'Ninguno'}"`,
      `"${proj.assignedPartnerId || 'Sin Asignar'}"`,
      proj.createdDate
    ]);

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_prospectos_solux_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('📊 Reporte general exportado en formato CSV compatible con Excel.');
  };

  // User Actions
  const handleOpenAddUser = (initialRole?: any) => {
    setEditingUserId(null);
    setIsUserFormUsernameManuallyEdited(false);
    const validRole: 'comercial' | 'enlace' | 'admin' | 'partner' = 
      (typeof initialRole === 'string' && ['comercial', 'enlace', 'admin', 'partner'].includes(initialRole))
        ? (initialRole as any)
        : 'comercial';
    setUserForm({
      username: '',
      email: '',
      fullName: '',
      password: '',
      role: validRole,
      parentId: '',
      whatsapp: '',
      prospectingAreas: '',
      workShift: 'Tiempo completo',
      bankAccountHolder: '',
      bankName: '',
      bankClabe: '',
      streetAndNumber: '',
      colonia: '',
      municipio: '',
      zipCode: '',
      ineFrontDoc: '',
      ineBackDoc: ''
    });
    setIsUserFormOpen(true);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const el = document.getElementById('admin-user-form-container');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleOpenEditUser = (user: any) => {
    setEditingUserId(user.id);
    setIsUserFormUsernameManuallyEdited(true);
    const validRole: 'comercial' | 'enlace' | 'admin' | 'partner' = 
      (typeof user.role === 'string' && ['comercial', 'enlace', 'admin', 'partner'].includes(user.role))
        ? (user.role as any)
        : 'comercial';
    setUserForm({
      username: user.username || '',
      email: user.email || '',
      fullName: user.fullName || '',
      password: user.password || '',
      role: validRole,
      parentId: user.parentId || '',
      whatsapp: user.whatsapp || '',
      prospectingAreas: user.prospectingAreas || '',
      workShift: user.workShift || 'Tiempo completo',
      bankAccountHolder: user.bankAccountHolder || '',
      bankName: user.bankName || '',
      bankClabe: user.bankClabe || '',
      streetAndNumber: user.streetAndNumber || user.address || '',
      colonia: user.colonia || '',
      municipio: user.municipio || '',
      zipCode: user.zipCode || '',
      ineFrontDoc: user.ineFrontDoc || (user.inePhotos && user.inePhotos[0]) || '',
      ineBackDoc: user.ineBackDoc || (user.inePhotos && user.inePhotos[1]) || ''
    });
    setIsUserFormOpen(true);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const el = document.getElementById('admin-user-form-container');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleDeleteUser = (id: string) => {
    if (id === 'usr_1') {
      showNotification('No se puede eliminar el administrador por defecto.', 'error');
      return;
    }
    const userToDelete = users.find(u => u.id === id);
    const name = userToDelete ? userToDelete.fullName : 'este usuario';
    if (window.confirm(`¿Estás completamente seguro de que deseas eliminar permanentemente a "${name}" del sistema?`)) {
      if (onDeleteUser) {
        onDeleteUser(id);
      } else {
        onUpdateUsers(users.filter(u => u.id !== id));
      }
      showNotification('👤 Usuario eliminado permanentemente del sistema.');
    }
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.username.trim() || !userForm.fullName.trim()) {
      showNotification('Por favor llena los campos obligatorios (*).', 'error');
      return;
    }

    // Check SPIN by OXXO restriction
    if (userForm.bankName.trim().toLowerCase().includes('spin') || userForm.bankName.trim().toLowerCase().includes('oxxo')) {
      showNotification('⚠️ No se permiten cuentas SPIN by OXXO para pagos bancarios.', 'error');
      return;
    }

    // Check CLABE 18 digits if provided
    const cleanClabe = userForm.bankClabe.replace(/\D/g, '');
    if (userForm.bankClabe.trim() && cleanClabe.length !== 18) {
      showNotification('⚠️ La CLABE interbancaria debe tener exactamente 18 dígitos.', 'error');
      return;
    }

    const cleanRole: 'comercial' | 'enlace' | 'admin' | 'partner' = 
      (typeof userForm.role === 'string' && ['comercial', 'enlace', 'admin', 'partner'].includes(userForm.role))
        ? (userForm.role as any)
        : 'comercial';

    const inePhotosArr = [userForm.ineFrontDoc, userForm.ineBackDoc].filter(Boolean);
    const fullAddress = userForm.streetAndNumber 
      ? `${userForm.streetAndNumber}${userForm.colonia ? `, Col. ${userForm.colonia}` : ''}${userForm.municipio ? `, ${userForm.municipio}` : ''}${userForm.zipCode ? ` C.P. ${userForm.zipCode}` : ''}`
      : '';

    if (editingUserId) {
      const updatedUser = { 
        id: editingUserId, 
        ...userForm, 
        address: fullAddress || userForm.streetAndNumber,
        inePhotos: inePhotosArr,
        role: cleanRole, 
        bankClabe: cleanClabe || userForm.bankClabe,
        updatedAt: new Date().toISOString()
      };
      onUpdateUsers([updatedUser, ...users.filter(u => u.id !== editingUserId)]);
      showNotification(`👤 Perfil de ${cleanRole === 'enlace' ? 'Asesor de Enlace' : cleanRole === 'comercial' ? 'Asesor Verde' : cleanRole === 'partner' ? 'Partner de Instalaciones' : 'Administrador General'} actualizado con éxito.`);
      setLastSavedUser(updatedUser);
    } else {
      const nowIso = new Date().toISOString();
      const newUser = {
        id: `usr_${Date.now()}`,
        ...userForm,
        address: fullAddress || userForm.streetAndNumber,
        inePhotos: inePhotosArr,
        role: cleanRole,
        bankClabe: cleanClabe || userForm.bankClabe,
        createdAt: nowIso,
        createdDate: nowIso
      };
      onUpdateUsers([newUser, ...(users || [])]);
      showNotification(`👤 Nuevo ${cleanRole === 'enlace' ? 'Asesor de Enlace' : cleanRole === 'comercial' ? 'Asesor Verde' : cleanRole === 'partner' ? 'Partner de Instalaciones' : 'Administrador General'} registrado exitosamente.`);
      setLastSavedUser(newUser);
    }
    setIsUserFormOpen(false);
  };

  // Simulated push notification trigger
  const handleSendTestPush = () => {
    const push = pushNotifications.find(p => p.id === testNotificationId);
    if (!push) return;

    const targetUser = users.find(u => u.id === testNotificationTarget || u.role === push.role);
    const destName = targetUser ? targetUser.fullName : `Asesor con Rol ${push.role.toUpperCase()}`;
    const formattedBody = push.body.replace('{cliente}', 'Gómez de la Vega S.A.');

    alert(`🔔 [NOTIFICACIÓN PUSH ENVIADA]
Para: ${destName} (${push.role.toUpperCase()})
Título: ${push.title}
Mensaje: ${formattedBody}

*El simulador emitió la señal del evento correctamente.*`);
    showNotification('🔔 Señal de notificación push emitida con éxito.');
  };

  // Helper to extract timestamp or date for sorting by latest created first (hasta arriba en primer lugar)
  const getUserRecencyScore = (u: any): number => {
    if (!u) return 0;
    if (u.createdAt) {
      const t = new Date(u.createdAt).getTime();
      if (!isNaN(t) && t > 0) return t;
    }
    if (u.createdDate) {
      const t = new Date(u.createdDate).getTime();
      if (!isNaN(t) && t > 0) return t;
    }
    if (u.created_at) {
      const t = new Date(u.created_at).getTime();
      if (!isNaN(t) && t > 0) return t;
    }
    // Check if ID has timestamp like usr_174043...
    if (u.id) {
      const match = String(u.id).match(/\d{10,}/);
      if (match) return Number(match[0]);
    }
    return 0;
  };

  // Partners and Commercial lists for assignments (newest first)
  const partnerUsers = [...users]
    .filter(u => u.role === 'partner')
    .sort((a, b) => getUserRecencyScore(b) - getUserRecencyScore(a));

  const commercialUsers = [...users]
    .filter(u => u.role === 'comercial')
    .sort((a, b) => getUserRecencyScore(b) - getUserRecencyScore(a));

  // Filter projects
  const filteredProjects = solarProjects.filter(p => {
    const matchesSearch = p.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.clientPhone.includes(searchQuery) || 
                          p.municipalityState.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'todos' ? true : (
      statusFilter === 'validacion'
        ? (p.status === 'validacion' || p.status === 'validado' || p.status === 'diagnostico_generado' || p.status === 'cotizacion_enviada' || p.status === 'nuevo' || p.status === 'prospecto' || !p.status || !['levantamiento_tecnico', 'financiamiento_enviado', 'cotizacion_final', 'firma_contrato', 'instalacion', 'tramite_cfe', 'operacion'].includes(p.status))
        : p.status === statusFilter
    );
    return matchesSearch && matchesStatus;
  });

  // Filter users / personal (ALWAYS sorted with newest registered user at the very top in 1st place)
  const filteredUsers = [...users]
    .sort((a, b) => {
      const scoreA = getUserRecencyScore(a);
      const scoreB = getUserRecencyScore(b);
      if (scoreA !== scoreB) {
        return scoreB - scoreA; // Descending: newest employee first
      }
      return 0;
    })
    .filter(u => {
      const q = userSearchQuery.trim().toLowerCase();
      const matchesSearch = !q || 
        (u.fullName || '').toLowerCase().includes(q) ||
        (u.username || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.whatsapp || '').includes(q) ||
        (u.prospectingAreas || '').toLowerCase().includes(q);
      
      const matchesRole = userRoleFilter === 'todos' ? true : u.role === userRoleFilter;
      return matchesSearch && matchesRole;
    });

  // Pipeline columns mapping
  const pipelineStages = [
    { id: 'validacion', label: 'Validación', color: 'bg-blue-500' },
    { id: 'levantamiento_tecnico', label: 'Levantamiento', color: 'bg-amber-500' },
    { id: 'financiamiento_enviado', label: 'Simulado/Financiando', color: 'bg-indigo-500' },
    { id: 'cotizacion_final', label: 'Propuesta Final', color: 'bg-purple-500' },
    { id: 'firma_contrato', label: 'Firma Contrato', color: 'bg-rose-500' },
    { id: 'instalacion', label: 'Instalación', color: 'bg-emerald-500' },
    { id: 'tramite_cfe', label: 'Trámite CFE', color: 'bg-sky-500' },
    { id: 'operacion', label: 'Operación', color: 'bg-teal-500' }
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
        className="h-8 w-auto object-contain shrink-0 select-none"
        referrerPolicy="no-referrer"
      />
    </button>
  );

  return (
    <div className="flex flex-col lg:flex-row h-screen text-slate-800 font-sans w-full overflow-hidden bg-[#FAFBFC]" id="admin-module-root">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-2xl shadow-xl text-xs font-black flex items-center gap-2.5 ${
              notification.type === 'success' ? 'bg-emerald-600 text-white shadow-emerald-100' : 'bg-rose-600 text-white shadow-rose-100'
            }`}
          >
            <CheckCircle className="w-4 h-4 shrink-0 animate-bounce" />
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. SIDEBAR NAVIGATION */}
      <aside className="hidden lg:flex flex-col w-72 bg-slate-900 text-slate-100 p-6 shrink-0 justify-between h-full overflow-y-auto">
        <div className="space-y-8">
          {/* Logo & Name */}
          <div className="flex items-center gap-3 border-b border-slate-800 pb-5">
            <SoluxLogo />
            <div>
              <span className="text-sm font-black tracking-tight text-white block">SOLUX GREEN</span>
              <span className="text-[9px] text-[#10B981] font-black tracking-widest uppercase">ADMIN GENERAL</span>
            </div>
          </div>

          {/* Quick Offline toggle */}
          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black tracking-wider uppercase text-slate-400">Modo de Conexión</span>
              <span className={`w-2 h-2 rounded-full ${isOfflineMode ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 animate-pulse'}`}></span>
            </div>
            <p className="text-[9px] text-slate-500 font-bold leading-normal">
              {isOfflineMode 
                ? 'Simulando red desconectada. Registros locales guardados en cola.' 
                : 'Conectado a la nube. Sincronización instantánea activa.'}
            </p>
            <button
              onClick={onToggleOfflineMode}
              className={`w-full py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                isOfflineMode 
                  ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30' 
                  : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
              }`}
            >
              {isOfflineMode ? '⚡ PONERSE ONLINE' : '🔌 COMPORTARSE OFFLINE'}
            </button>
          </div>

          {/* Current User Profile Widget */}
          <div 
            onClick={() => setActiveTab('perfil')}
            className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'perfil' 
                ? 'bg-[#10B981]/15 border-[#10B981]/30 text-white shadow-md' 
                : 'bg-slate-800/40 border-slate-700/40 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-700 shrink-0 bg-slate-800">
              <img 
                src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.fullName || currentUser?.username || 'Admin')}&background=10B981&color=fff&size=80&bold=true`} 
                alt="My profile" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[9px] font-black uppercase text-[#10B981] block tracking-wider font-mono">Sesión Activa</span>
              <span className="text-xs font-black block truncate leading-tight">{currentUser?.fullName || currentUser?.username || 'Administrador Solux'}</span>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="space-y-1.5">
            <button
              onClick={() => {
                setActiveTab('crm');
                if (activeSubTab === 'nuevo') {
                  setActiveSubTab('pipeline');
                }
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-extrabold tracking-tight transition-all cursor-pointer ${
                activeTab === 'crm' && activeSubTab !== 'nuevo'
                  ? 'bg-[#10B981] text-white shadow-md' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Activity className="w-4.5 h-4.5 shrink-0" />
              <span className="flex items-center justify-between w-full">
                <span>Prospectos (CRM)</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === 'crm' && activeSubTab !== 'nuevo'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-800 text-emerald-400 border border-slate-700'
                }`}>
                  {solarProjects.length}
                </span>
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('crm');
                setActiveSubTab('nuevo');
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-extrabold tracking-tight transition-all cursor-pointer ${
                activeTab === 'crm' && activeSubTab === 'nuevo'
                  ? 'bg-[#10B981] text-white shadow-md' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Plus className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
              <span>Registrar Prospecto</span>
            </button>

            <button
              onClick={() => setActiveTab('usuarios')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-extrabold tracking-tight transition-all cursor-pointer ${
                activeTab === 'usuarios' 
                  ? 'bg-[#10B981] text-white shadow-md' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Users className="w-4.5 h-4.5 shrink-0" />
              <span className="flex items-center justify-between w-full">
                <span>Personal</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === 'usuarios' 
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-800 text-emerald-400 border border-slate-700'
                }`}>
                  {users.length}
                </span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('partners')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-extrabold tracking-tight transition-all cursor-pointer ${
                activeTab === 'partners' 
                  ? 'bg-[#10B981] text-white shadow-md' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Handshake className="w-4.5 h-4.5 shrink-0" />
              <span className="flex items-center justify-between w-full">
                <span>Socios Partners</span>
                <span className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    activeTab === 'partners'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-800 text-emerald-400 border border-slate-700'
                  }`}>
                    {partnerUsers.length}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[7px] font-black uppercase bg-emerald-500/25 text-emerald-300 border border-emerald-500/35">ALTA</span>
                </span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('roles')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-extrabold tracking-tight transition-all cursor-pointer ${
                activeTab === 'roles' 
                  ? 'bg-[#10B981] text-white' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Shield className="w-4.5 h-4.5 text-emerald-400 animate-pulse" />
              <span className="flex items-center gap-1.5">
                Acceso a Roles
                <span className="px-1.5 py-0.5 rounded text-[7px] font-black uppercase bg-emerald-500/25 text-emerald-300 border border-emerald-500/35">NUEVO</span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('promocionales')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-extrabold tracking-tight transition-all cursor-pointer ${
                activeTab === 'promocionales' 
                  ? 'bg-[#10B981] text-white' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Award className="w-4.5 h-4.5 text-emerald-400" />
              <span>Material Promocional</span>
            </button>

            <button
              onClick={() => setActiveTab('perfil')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-extrabold tracking-tight transition-all cursor-pointer ${
                activeTab === 'perfil' 
                  ? 'bg-[#10B981] text-white' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <User className="w-4.5 h-4.5" />
              <span>Mi Perfil</span>
            </button>

            <button
              onClick={() => setActiveTab('landingpage')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-extrabold tracking-tight transition-all cursor-pointer ${
                activeTab === 'landingpage' 
                  ? 'bg-[#10B981] text-white' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Layers className="w-4.5 h-4.5" />
              <span>Admin Landingpage</span>
            </button>

            <button
              onClick={() => setActiveTab('notificaciones')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-extrabold tracking-tight transition-all cursor-pointer relative ${
                activeTab === 'notificaciones' 
                  ? 'bg-[#10B981] text-white' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Bell className="w-4.5 h-4.5" />
              <span>Notificaciones</span>
              {notifications.filter(n => !n.isRead && (n.role === 'all' || n.role === 'admin')).length > 0 && (
                <span className="absolute right-3 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('costo_panel')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-extrabold tracking-tight transition-all cursor-pointer ${
                activeTab === 'costo_panel' 
                  ? 'bg-[#10B981] text-white shadow-md' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Sun className="w-4.5 h-4.5 text-amber-400 shrink-0" />
              <span className="flex items-center justify-between w-full">
                <span>Costo del Panel</span>
                <span className="px-1.5 py-0.5 rounded text-[7px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  AL DÍA
                </span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('configuracion')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-extrabold tracking-tight transition-all cursor-pointer ${
                activeTab === 'configuracion' 
                  ? 'bg-[#10B981] text-white' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Settings className="w-4.5 h-4.5" />
              <span>Configuración del Sistema</span>
            </button>
          </div>
        </div>

        {onExit && (
          <button
            onClick={onExit}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-red-900/40 text-slate-300 hover:text-red-400 border border-slate-700 rounded-xl text-xs font-extrabold transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Volver al Portal</span>
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
              <span className="text-xs sm:text-sm font-black tracking-tight text-slate-900 block uppercase truncate">Solux Green CRM</span>
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

            <button
              onClick={handleExportCSV}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-emerald-55 hover:text-emerald-700 text-slate-700 font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer border border-slate-200"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Excel (CSV)</span>
            </button>

            <div className={`flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border text-[9px] font-black uppercase shrink-0 ${
              isOfflineMode 
                ? 'bg-amber-50 text-amber-700 border-amber-100' 
                : 'bg-emerald-50 text-emerald-700 border-emerald-100'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isOfflineMode ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`}></span>
              <span className="hidden xs:inline sm:inline">{isOfflineMode ? 'Modo Local' : 'Online'}</span>
            </div>

            <NotificationsBell
              notifications={notifications}
              role="admin"
              currentUser={currentUser}
              onMarkAsRead={onMarkNotificationAsRead}
              onMarkAllAsRead={onMarkAllNotificationsAsRead}
              onViewAll={() => setActiveTab('notificaciones')}
            />

            <div className="flex items-center gap-1.5 sm:gap-2 border-l border-slate-200 pl-2 sm:pl-3 ml-0.5 sm:ml-1 shrink-0">
              <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                <img 
                  src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.fullName || currentUser?.username || 'Admin')}&background=10B981&color=fff&size=80&bold=true`} 
                  alt="Perfil" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-[10px] font-black text-slate-800 truncate max-w-[60px] sm:max-w-[150px] uppercase tracking-tight hidden sm:inline">{currentUser?.fullName || currentUser?.username || 'Administrador Solux'}</span>
            </div>
          </div>
        </header>

        {/* CONTENT VIEWPORT */}
        <main className="flex-1 overflow-y-auto px-4 md:px-6 py-6 bg-transparent pb-24 lg:pb-6" id="admin-main-viewport">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full space-y-6"
            >
              
              {/* ------------------- MODULE 1: PIPELINE & CRM ------------------- */}
              {activeTab === 'crm' && (
                <div className="space-y-6">
                  
                  {/* Top Stats summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col justify-between shadow-xs">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Proyectos Totales</span>
                      <span className="text-lg font-black text-slate-900 mt-2 block">{solarProjects.length}</span>
                      <span className="text-[8px] text-slate-500 font-bold block mt-1">Registrados en sistema</span>
                    </div>
                    <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col justify-between shadow-xs">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Inversión Estimada</span>
                      <span className="text-lg font-black text-slate-900 mt-2 block">
                        ${solarProjects.reduce((acc, p) => acc + p.totalInvestment, 0).toLocaleString('es-MX')} MXN
                      </span>
                      <span className="text-[8px] text-emerald-600 font-bold block mt-1">Valor de cartera</span>
                    </div>
                    <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col justify-between shadow-xs">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Levantamientos</span>
                      <span className="text-lg font-black text-amber-600 mt-2 block">
                        {solarProjects.filter(p => p.siteSurveyStatus === 'en_proceso' || p.siteSurveyStatus === 'concluido').length}
                      </span>
                      <span className="text-[8px] text-slate-500 font-bold block mt-1">
                        {solarProjects.filter(p => p.siteSurveyPaid).length} pagados ($250)
                      </span>
                    </div>
                    <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col justify-between shadow-xs">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Instalados / Trámite</span>
                      <span className="text-lg font-black text-emerald-600 mt-2 block">
                        {solarProjects.filter(p => p.status === 'instalacion' || p.status === 'tramite_cfe' || p.status === 'operacion').length}
                      </span>
                      <span className="text-[8px] text-emerald-600 font-bold block mt-1">Sistemas activos</span>
                    </div>
                  </div>

                  {/* Filter & Search actions */}
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                      <input
                        type="text"
                        placeholder="Buscar por cliente, teléfono, ciudad..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full sm:w-64 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                      >
                        <option value="todos">Todos los Estatus ({solarProjects.length})</option>
                        {pipelineStages.map(stage => {
                          const count = solarProjects.filter(p => {
                            if (stage.id === 'validacion') {
                              return p.status === 'validacion' || p.status === 'validado' || p.status === 'diagnostico_generado' || p.status === 'cotizacion_enviada' || p.status === 'nuevo' || p.status === 'prospecto' || !p.status || !['levantamiento_tecnico', 'financiamiento_enviado', 'cotizacion_final', 'firma_contrato', 'instalacion', 'tramite_cfe', 'operacion'].includes(p.status);
                            }
                            return p.status === stage.id;
                          }).length;
                          return (
                            <option key={stage.id} value={stage.id}>{stage.label} ({count})</option>
                          );
                        })}
                      </select>
                      <button
                        onClick={() => exportAllToPDF(filteredProjects)}
                        className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer inline-flex items-center gap-1 shrink-0"
                        title="Exportar Filtrados a PDF"
                      >
                        📄 PDF
                      </button>
                      <button
                        onClick={() => exportAllToExcel(filteredProjects)}
                        className="px-3 py-2 bg-[#10B981] hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer inline-flex items-center gap-1 shrink-0"
                        title="Exportar Filtrados a Excel"
                      >
                        📊 Excel
                      </button>
                      <span className="text-[10px] font-black uppercase text-slate-400 px-2 py-1 bg-slate-100 rounded-lg">
                        {filteredProjects.length} / {solarProjects.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 self-stretch md:self-auto justify-end">
                      <button
                        onClick={() => setActiveSubTab('pipeline')}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                          activeSubTab === 'pipeline' 
                            ? 'bg-emerald-600 text-white shadow-xs' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <span>Pipeline Visual</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                          activeSubTab === 'pipeline' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {solarProjects.length}
                        </span>
                      </button>
                      <button
                        onClick={() => setActiveSubTab('prospectos')}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                          activeSubTab === 'prospectos' 
                            ? 'bg-emerald-600 text-white shadow-xs' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <span>Lista de Expedientes</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                          activeSubTab === 'prospectos' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {solarProjects.length}
                        </span>
                      </button>
                      <button
                        onClick={() => setActiveSubTab('nuevo')}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                          activeSubTab === 'nuevo' 
                            ? 'bg-emerald-600 text-white shadow-xs' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        ➕ Registrar Prospecto
                      </button>
                    </div>
                  </div>

                  {/* Active Subtabs */}
                  {activeSubTab === 'pipeline' && (
                    <div className="overflow-x-auto pb-4">
                      <div className="flex gap-4 min-w-[1200px]">
                        {pipelineStages.map(stage => {
                          const stageProjects = filteredProjects.filter(p => {
                            if (stage.id === 'validacion') {
                              return p.status === 'validacion' || p.status === 'validado' || p.status === 'diagnostico_generado' || p.status === 'cotizacion_enviada' || p.status === 'nuevo' || p.status === 'prospecto' || !p.status || !['levantamiento_tecnico', 'financiamiento_enviado', 'cotizacion_final', 'firma_contrato', 'instalacion', 'tramite_cfe', 'operacion'].includes(p.status);
                            }
                            return p.status === stage.id;
                          });
                          return (
                            <div key={stage.id} className="w-80 shrink-0 bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col h-[550px]">
                              {/* Stage Header */}
                              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${stage.color}`}></span>
                                  <span className="text-[10px] font-black uppercase text-slate-700 tracking-wide">{stage.label}</span>
                                </div>
                                <span className="bg-slate-200 text-slate-600 text-[9px] font-black px-2 py-0.5 rounded-full">
                                  {stageProjects.length}
                                </span>
                              </div>

                              {/* Stage Cards */}
                              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                                {stageProjects.length === 0 ? (
                                  <div className="text-center py-8 text-slate-400 text-[10px] font-bold uppercase tracking-wider border border-dashed border-slate-200 rounded-xl bg-white/50">
                                    Sin proyectos
                                  </div>
                                ) : (
                                  stageProjects.map((proj, idx) => {
                                    const partner = users.find(u => u.id === proj.assignedPartnerId);
                                    const creatorUser = users.find(u => u.id === proj.createdBy || u.fullName === proj.advisorName);
                                    const registradorName = proj.advisorName || creatorUser?.fullName || 'Administración';
                                    const registradorRol = proj.createdByRole || creatorUser?.role || 'comercial';
                                    return (
                                      <div 
                                        key={`stage_proj_${proj.id || 'p'}_${idx}`} 
                                        onClick={() => setSelectedProject(proj)}
                                        className="bg-white border border-slate-100 hover:border-emerald-300 rounded-xl p-3.5 shadow-xs cursor-pointer transition-all hover:shadow-md transform hover:-translate-y-0.5 space-y-2 group"
                                      >
                                        <div className="flex items-start justify-between">
                                          <span className="text-xs font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors block">
                                            {proj.clientName}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold">
                                          <MapPin className="w-3 h-3 text-slate-400" />
                                          <span>{proj.municipalityState}</span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-1 bg-slate-50 p-2 rounded-lg border border-slate-100/80 text-[10px] font-mono">
                                          <div>
                                            <span className="text-slate-400 block text-[8px] uppercase font-sans font-extrabold">Paneles</span>
                                            <span className="font-extrabold text-slate-700">{proj.estimatedPanels} pzas</span>
                                          </div>
                                          <div>
                                            <span className="text-slate-400 block text-[8px] uppercase font-sans font-extrabold">Inversión</span>
                                            <span className="font-extrabold text-slate-700">${(proj.totalInvestment/1000).toFixed(0)}k</span>
                                          </div>
                                        </div>

                                        {/* Registrador Employee badge for Admin control */}
                                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[9px]">
                                          <span className="text-slate-400 font-bold">Registrado por:</span>
                                          <span className="font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded text-[8px] uppercase truncate max-w-[130px]" title={`${registradorName} (${registradorRol})`}>
                                            👤 {registradorName}
                                          </span>
                                        </div>

                                        {/* Assigned Partner badge */}
                                        <div className="flex items-center justify-between pt-1 text-[9px]">
                                          <span className="text-slate-400 font-bold">Socio Partner:</span>
                                          <span className={`px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider ${
                                            partner 
                                              ? 'bg-teal-50 text-teal-700 border border-teal-100' 
                                              : 'bg-rose-50 text-rose-600 border border-rose-100 animate-pulse'
                                          }`}>
                                            {partner ? partner.fullName : 'S/Asignar'}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {activeSubTab === 'prospectos' && (
                    /* Subtab List of files */
                    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                              <th className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Prospecto</th>
                              <th className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Registrado por (Empleado)</th>
                              <th className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Ubicación</th>
                              <th className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Detalles de Obra</th>
                              <th className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Levantamiento</th>
                              <th className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Asignado</th>
                              <th className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Estatus</th>
                              <th className="p-3 text-right text-[9px] font-black uppercase tracking-widest text-slate-400">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredProjects.map((proj, idx) => {
                              const partner = users.find(u => u.id === proj.assignedPartnerId);
                              const creatorUser = users.find(u => u.id === proj.createdBy || u.fullName === proj.advisorName);
                              return (
                                <tr key={`adm_proj_row_${proj.id || 'p'}_${idx}`} className="hover:bg-slate-50/30 transition-all font-bold">
                                  <td className="p-3">
                                    <div className="font-extrabold text-slate-900">{proj.clientName}</div>
                                    <div className="text-[10px] text-slate-400 font-normal">{proj.clientPhone} • {proj.clientEmail || 'Sin correo'}</div>
                                  </td>
                                  <td className="p-3">
                                    <div className="font-extrabold text-slate-800 text-[11px]">{proj.advisorName || creatorUser?.fullName || 'Administración'}</div>
                                    <div className="text-[9px] text-indigo-600 font-black uppercase">{proj.createdByRole || creatorUser?.role || 'comercial'}</div>
                                  </td>
                                  <td className="p-3 text-slate-600 text-[11px] font-medium">
                                    {proj.municipalityState}
                                  </td>
                                  <td className="p-3">
                                    <div className="text-slate-800">{proj.estimatedPanels} Paneles solares</div>
                                    <div className="text-[10px] text-emerald-600 font-bold font-mono">${proj.totalInvestment.toLocaleString()} MXN</div>
                                  </td>
                                  <td className="p-3">
                                    <span className={`inline-block px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                                      proj.siteSurveyStatus === 'concluido'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                        : proj.siteSurveyStatus === 'en_proceso'
                                        ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                        : 'bg-slate-100 text-slate-500'
                                    }`}>
                                      {proj.siteSurveyStatus === 'concluido' ? 'Realizado' : proj.siteSurveyStatus === 'en_proceso' ? 'En Proceso' : 'Pendiente'}
                                    </span>
                                  </td>
                                  <td className="p-3">
                                    <span className={`inline-block px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                                      partner ? 'bg-teal-50 text-teal-700' : 'bg-rose-50 text-rose-600 animate-pulse'
                                    }`}>
                                      {partner ? partner.fullName : 'Sin Asignar'}
                                    </span>
                                  </td>
                                  <td className="p-3">
                                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase bg-slate-900 text-white tracking-widest">
                                      {proj.status.toUpperCase()}
                                    </span>
                                  </td>
                                  <td className="p-3 text-right">
                                    <div className="inline-flex items-center gap-1.5 justify-end">
                                      <button
                                        onClick={() => setSelectedProject(proj)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-600 hover:text-white rounded-lg transition-all cursor-pointer text-[10px] font-extrabold uppercase"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                        Ver
                                      </button>
                                      {onDeleteSolarProject && (
                                        <button
                                          onClick={() => {
                                            if (window.confirm(`¿Estás completamente seguro de que deseas eliminar permanentemente el expediente de "${proj.clientName}"?`)) {
                                              onDeleteSolarProject(proj.id);
                                              showNotification('🗑️ Expediente eliminado correctamente.');
                                            }
                                          }}
                                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 rounded-lg transition-all cursor-pointer border border-rose-100/50"
                                          title="Eliminar Expediente"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {activeSubTab === 'nuevo' && (
                    <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-8 shadow-xs max-w-4xl mx-auto space-y-6 animate-fadeIn">
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
                            <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Monto de Pago Recibo CFE Promedio ($ MXN)</label>
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
                              <option value="">{currentUser?.fullName || currentUser?.username || 'Administrador General'} (Admin Actual)</option>
                              <optgroup label="🌱 Asesores Verdes Disponibles">
                                {(users || []).filter(u => u.role === 'comercial' || u.role === 'admin').map((emp, idx) => (
                                  <option key={`advisor_${emp.id || 'e'}_${idx}`} value={emp.id}>
                                    {emp.fullName || emp.username} ({emp.role === 'admin' ? 'Admin' : 'Asesor Verde'})
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
                                  <option key={`ref_emp_${emp.id || 'e'}_${idx}`} value={emp.fullName || emp.username}>
                                    {emp.fullName || emp.username} ({emp.role === 'admin' ? 'Admin' : emp.role === 'comercial' ? 'Asesor Verde' : 'Asesor Enlace'})
                                  </option>
                                ))}
                              </optgroup>
                              <optgroup label="🤝 Socios Partners de Instalación">
                                {(users || []).filter(u => u.role === 'partner').map((p, idx) => (
                                  <option key={`ref_partner_${p.id || 'p'}_${idx}`} value={p.fullName || p.username}>
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

                        {/* Resumen Financiero y Cuentas del Proyecto en Tiempo Real */}
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
                                    <span>🧮 Cuentas y Corrida Financiera del Expediente</span>
                                    <span className="text-[9px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full font-mono border border-emerald-500/30">
                                      {formatPaymentMethod(formPayMethod)}
                                    </span>
                                  </div>
                                  <div className="text-[9px] text-slate-400">
                                    Dimensionamiento: {panels} paneles solares • Techo requerido: {(panels * 2.88).toFixed(1)} m²
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-[9px] text-slate-400 uppercase font-bold">Inversión Bruta Base</div>
                                  <div className="text-xs font-mono font-bold text-slate-200">${baseInvestment.toLocaleString('es-MX')} MXN</div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                                {fin.isContado ? (
                                  <>
                                    <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                                      <div className="text-[9px] text-emerald-400 font-bold uppercase">Descuento Comercial</div>
                                      <div className="text-sm font-black text-emerald-300">-{fin.discountPercent}%</div>
                                      <div className="text-[8px] text-slate-400">-${fin.discountAmount.toLocaleString('es-MX')} MXN</div>
                                    </div>
                                    <div className="bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-800/60 sm:col-span-2">
                                      <div className="text-[9px] text-emerald-400 font-bold uppercase">Pago Único de Contado</div>
                                      <div className="text-base font-black text-white">${fin.netInvestment.toLocaleString('es-MX')} <span className="text-[9px] text-emerald-400 font-normal">MXN</span></div>
                                      <div className="text-[8px] text-emerald-300/80">Sin intereses • Pago de contado directo</div>
                                    </div>
                                    <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                                      <div className="text-[9px] text-slate-400 font-bold uppercase">Ahorro CFE Estimado</div>
                                      <div className="text-sm font-black text-white">~${bimestralSavings.toLocaleString('es-MX')}</div>
                                      <div className="text-[8px] text-slate-400">Por bimestre (~90% del recibo)</div>
                                    </div>
                                  </>
                                ) : fin.isDirectFinancing ? (
                                  <>
                                    <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                                      <div className="text-[9px] text-sky-400 font-bold uppercase">Enganche Requerido ({fin.downPaymentPercent}%)</div>
                                      <div className="text-sm font-black text-sky-300">${fin.downPayment.toLocaleString('es-MX')}</div>
                                      <div className="text-[8px] text-slate-400">Pago inicial al contratar</div>
                                    </div>
                                    <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                                      <div className="text-[9px] text-slate-400 font-bold uppercase">Saldo a Financiar</div>
                                      <div className="text-sm font-black text-white">${fin.financedAmount.toLocaleString('es-MX')}</div>
                                      <div className="text-[8px] text-slate-400">Tasa: {fin.monthlyInterestRate}% /mes</div>
                                    </div>
                                    <div className="bg-sky-950/50 p-2.5 rounded-xl border border-sky-800/60">
                                      <div className="text-[9px] text-sky-300 font-bold uppercase">Mensualidad Fija ({fin.months} Meses)</div>
                                      <div className="text-base font-black text-white">${fin.monthlyPayment.toLocaleString('es-MX')} <span className="text-[9px] text-sky-300 font-normal">/mes</span></div>
                                      <div className="text-[8px] text-sky-300/80">Total financiado: ${fin.totalWithInterest.toLocaleString('es-MX')}</div>
                                    </div>
                                    <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                                      <div className="text-[9px] text-slate-400 font-bold uppercase">Ahorro Bimestral CFE</div>
                                      <div className="text-sm font-black text-emerald-400">~${bimestralSavings.toLocaleString('es-MX')}</div>
                                      <div className="text-[8px] text-slate-400">Retorno est.: ~{roiYears.toFixed(1)} años</div>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="bg-indigo-950/40 p-2.5 rounded-xl border border-indigo-800/60 sm:col-span-2">
                                      <div className="text-[9px] text-indigo-300 font-bold uppercase">12 Meses Sin Intereses (MSI)</div>
                                      <div className="text-base font-black text-white">${fin.monthlyPayment.toLocaleString('es-MX')} <span className="text-[9px] text-indigo-300 font-normal">/mes</span></div>
                                      <div className="text-[8px] text-indigo-300/80">Tarjeta de crédito bancaria participante • 0% intereses</div>
                                    </div>
                                    <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60 sm:col-span-2">
                                      <div className="text-[9px] text-slate-400 font-bold uppercase">Inversión Total & Ahorro</div>
                                      <div className="text-sm font-black text-white">${fin.netInvestment.toLocaleString('es-MX')} MXN</div>
                                      <div className="text-[8px] text-slate-400">Ahorro CFE: ~${bimestralSavings.toLocaleString('es-MX')}/bimestre</div>
                                    </div>
                                  </>
                                )}
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
                            id="admin-file-front"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleEvidenceFileChange(e, setEvidenceReceiptFront)}
                          />
                          <input
                            type="file"
                            id="admin-camera-front"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(e) => handleEvidenceFileChange(e, setEvidenceReceiptFront)}
                          />

                          <input
                            type="file"
                            id="admin-file-back"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleEvidenceFileChange(e, setEvidenceReceiptBack)}
                          />
                          <input
                            type="file"
                            id="admin-camera-back"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(e) => handleEvidenceFileChange(e, setEvidenceReceiptBack)}
                          />

                          <input
                            type="file"
                            id="admin-file-facade"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleEvidenceFileChange(e, setEvidenceFacade)}
                          />
                          <input
                            type="file"
                            id="admin-camera-facade"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(e) => handleEvidenceFileChange(e, setEvidenceFacade)}
                          />

                          <input
                            type="file"
                            id="admin-file-area"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleEvidenceFileChange(e, setEvidenceInstallArea)}
                          />
                          <input
                            type="file"
                            id="admin-camera-area"
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
                                    onClick={() => document.getElementById('admin-file-front')?.click()}
                                    className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[9px] uppercase tracking-wider flex items-center justify-center gap-1.5"
                                  >
                                    <Upload className="w-3 h-3 text-slate-500" /> Subir Archivo
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => document.getElementById('admin-camera-front')?.click()}
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
                                    onClick={() => document.getElementById('admin-file-back')?.click()}
                                    className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[9px] uppercase tracking-wider flex items-center justify-center gap-1.5"
                                  >
                                    <Upload className="w-3 h-3 text-slate-500" /> Subir Archivo
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => document.getElementById('admin-camera-back')?.click()}
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
                                    onClick={() => document.getElementById('admin-file-facade')?.click()}
                                    className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[9px] uppercase tracking-wider flex items-center justify-center gap-1.5"
                                  >
                                    <Upload className="w-3 h-3 text-slate-500" /> Subir Archivo
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => document.getElementById('admin-camera-facade')?.click()}
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
                                    onClick={() => document.getElementById('admin-file-area')?.click()}
                                    className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[9px] uppercase tracking-wider flex items-center justify-center gap-1.5"
                                  >
                                    <Upload className="w-3 h-3 text-slate-500" /> Subir Archivo
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => document.getElementById('admin-camera-area')?.click()}
                                    className="py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold text-[9px] uppercase tracking-wider flex items-center justify-center gap-1.5 border border-emerald-100"
                                  >
                                    <Camera className="w-3 h-3 text-emerald-500" /> Tomar Foto
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Client Portal Credentials Section */}
                        <div className="border-t pt-5 space-y-3">
                          <h3 className="text-[10px] font-black uppercase text-slate-900 tracking-wider">Credenciales de Acceso para el Cliente</h3>
                          <p className="text-[9px] text-slate-450 font-bold uppercase tracking-wide leading-relaxed">
                            Crea el usuario que utilizará el cliente en su Portal de Monitoreo para visualizar este expediente y el avance de su obra en tiempo real.
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            <div className="space-y-1">
                              <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Usuario del Cliente</label>
                              <input
                                type="text"
                                value={formUsername}
                                onChange={e => setFormUsername(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                                placeholder="Ej. robertosolux"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Contraseña</label>
                              <input
                                type="text"
                                value={formPassword}
                                onChange={e => setFormPassword(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                                placeholder="Ej. Solux2026!"
                              />
                            </div>
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-3 bg-slate-900 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                        >
                          🚀 REGISTRAR PROSPECTO Y SUBIR EXPEDIENTE
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {/* ------------------- MODULE 2: GESTIÓN DE USUARIOS ------------------- */}
              {activeTab === 'usuarios' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h2 className="text-sm font-black uppercase tracking-wide text-slate-900">Gestión de Personal</h2>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs">
                          {users.length} Registrados
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Crea o modifica los usuarios, contraseñas y comisiones del sistema</p>
                    </div>
                    
                    <button
                      onClick={() => handleOpenAddUser('comercial')}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-[#10B981] text-white text-[10px] font-black uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Registrar Nuevo Usuario
                    </button>
                  </div>

                  {/* Stat cards summary for Personal */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <button
                      onClick={() => setUserRoleFilter('todos')}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between shadow-xs ${
                        userRoleFilter === 'todos'
                          ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-emerald-500/50'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900'
                      }`}
                    >
                      <span className={`text-[9px] font-black uppercase tracking-widest block ${userRoleFilter === 'todos' ? 'text-slate-400' : 'text-slate-400'}`}>
                        👥 Total Personal
                      </span>
                      <span className="text-xl font-black mt-2 block">{users.length}</span>
                      <span className={`text-[8px] font-bold block mt-0.5 ${userRoleFilter === 'todos' ? 'text-emerald-400' : 'text-slate-500'}`}>
                        Plantilla completa
                      </span>
                    </button>

                    <button
                      onClick={() => setUserRoleFilter('comercial')}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between shadow-xs ${
                        userRoleFilter === 'comercial'
                          ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-300'
                          : 'bg-white border-slate-200 hover:border-emerald-200 text-slate-900'
                      }`}
                    >
                      <span className={`text-[9px] font-black uppercase tracking-widest block ${userRoleFilter === 'comercial' ? 'text-emerald-100' : 'text-emerald-600'}`}>
                        🌿 Asesores Verdes
                      </span>
                      <span className="text-xl font-black mt-2 block">{users.filter(u => u.role === 'comercial').length}</span>
                      <span className={`text-[8px] font-bold block mt-0.5 ${userRoleFilter === 'comercial' ? 'text-emerald-200' : 'text-slate-500'}`}>
                        Venta directa
                      </span>
                    </button>

                    <button
                      onClick={() => setUserRoleFilter('enlace')}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between shadow-xs ${
                        userRoleFilter === 'enlace'
                          ? 'bg-pink-600 text-white border-pink-600 ring-2 ring-pink-300'
                          : 'bg-white border-slate-200 hover:border-pink-200 text-slate-900'
                      }`}
                    >
                      <span className={`text-[9px] font-black uppercase tracking-widest block ${userRoleFilter === 'enlace' ? 'text-pink-100' : 'text-pink-600'}`}>
                        🤝 Asesores Enlace
                      </span>
                      <span className="text-xl font-black mt-2 block">{users.filter(u => u.role === 'enlace').length}</span>
                      <span className={`text-[8px] font-bold block mt-0.5 ${userRoleFilter === 'enlace' ? 'text-pink-200' : 'text-slate-500'}`}>
                        Red de referidos
                      </span>
                    </button>

                    <button
                      onClick={() => setUserRoleFilter('partner')}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between shadow-xs ${
                        userRoleFilter === 'partner'
                          ? 'bg-teal-600 text-white border-teal-600 ring-2 ring-teal-300'
                          : 'bg-white border-slate-200 hover:border-teal-200 text-slate-900'
                      }`}
                    >
                      <span className={`text-[9px] font-black uppercase tracking-widest block ${userRoleFilter === 'partner' ? 'text-teal-100' : 'text-teal-600'}`}>
                        🔧 Socios Partners
                      </span>
                      <span className="text-xl font-black mt-2 block">{users.filter(u => u.role === 'partner').length}</span>
                      <span className={`text-[8px] font-bold block mt-0.5 ${userRoleFilter === 'partner' ? 'text-teal-200' : 'text-slate-500'}`}>
                        Técnicos certificados
                      </span>
                    </button>

                    <button
                      onClick={() => setUserRoleFilter('admin')}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between shadow-xs ${
                        userRoleFilter === 'admin'
                          ? 'bg-purple-600 text-white border-purple-600 ring-2 ring-purple-300'
                          : 'bg-white border-slate-200 hover:border-purple-200 text-slate-900'
                      }`}
                    >
                      <span className={`text-[9px] font-black uppercase tracking-widest block ${userRoleFilter === 'admin' ? 'text-purple-100' : 'text-purple-600'}`}>
                        🛡️ Administradores
                      </span>
                      <span className="text-xl font-black mt-2 block">{users.filter(u => u.role === 'admin').length}</span>
                      <span className={`text-[8px] font-bold block mt-0.5 ${userRoleFilter === 'admin' ? 'text-purple-200' : 'text-slate-500'}`}>
                        Control general
                      </span>
                    </button>
                  </div>

                  {/* Users search & role filter bar */}
                  <div className="bg-white border border-slate-200 p-3.5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
                    <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
                      <input
                        type="text"
                        placeholder="Buscar personal por nombre, usuario, correo o celular..."
                        value={userSearchQuery}
                        onChange={e => setUserSearchQuery(e.target.value)}
                        className="w-full md:w-80 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      {userSearchQuery && (
                        <button
                          onClick={() => setUserSearchQuery('')}
                          className="px-2 py-1 text-[10px] text-slate-400 hover:text-slate-700 font-bold"
                        >
                          ✕ Limpiar
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-2 w-full md:w-auto">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        Mostrando <strong className="text-slate-900 font-black">{filteredUsers.length}</strong> de <strong className="text-slate-900 font-black">{users.length}</strong> registros
                      </span>
                    </div>
                  </div>

                  {/* Users Form Form Modal/Drawer in-place */}
                  <AnimatePresence>
                    {isUserFormOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-md overflow-hidden"
                      >
                        <form onSubmit={handleSaveUser} autoComplete="off" className="space-y-5">
                          {/* Anti-browser autofill traps */}
                          <input type="text" name="anti_autofill_adm_user" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
                          <input type="password" name="anti_autofill_adm_pass" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-100 pb-3">
                            <div>
                              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                📝 {editingUserId ? 'Editar Perfil de Usuario' : 'Alta de Nuevo Integrante Solux Green'}
                              </h3>
                              <p className="text-[10px] text-slate-500 font-medium">
                                Captura de datos oficial según sección 3.3.2 para Asesores Verdes, Enlaces y Colaboradores.
                              </p>
                            </div>

                            {/* Quick Role Selector Tabs for Section 3.4 */}
                            <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/60">
                              <button
                                type="button"
                                onClick={() => setUserForm(prev => ({ ...prev, role: 'comercial' }))}
                                className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase transition-all cursor-pointer ${
                                  userForm.role === 'comercial'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                🌿 Asesor Verde
                              </button>
                              <button
                                type="button"
                                onClick={() => setUserForm(prev => ({ ...prev, role: 'enlace' }))}
                                className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase transition-all cursor-pointer ${
                                  userForm.role === 'enlace'
                                    ? 'bg-pink-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                🤝 Asesor de Enlace
                              </button>
                              <button
                                type="button"
                                onClick={() => setUserForm(prev => ({ ...prev, role: 'partner' }))}
                                className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase transition-all cursor-pointer ${
                                  userForm.role === 'partner'
                                    ? 'bg-teal-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                🔧 Partner
                              </button>
                              <button
                                type="button"
                                onClick={() => setUserForm(prev => ({ ...prev, role: 'admin' }))}
                                className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase transition-all cursor-pointer ${
                                  userForm.role === 'admin'
                                    ? 'bg-purple-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                🛡️ Admin
                              </button>
                            </div>
                          </div>

                          {/* Seccion 1: Datos Personales y de Trabajo */}
                          <div className="space-y-3">
                            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                              👤 Datos Personales y Jornada Laboral
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                              {/* Full Name */}
                              <div className="space-y-1">
                                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Nombre Completo *</label>
                                <input
                                  type="text"
                                  name="solux_adm_new_fullname"
                                  autoComplete="off"
                                  value={userForm.fullName}
                                  onChange={e => handleUserFullNameChange(e.target.value)}
                                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none"
                                  placeholder="Ej. Carlos Martínez Rodríguez"
                                  required
                                />
                              </div>

                              {/* WhatsApp / Celular */}
                              <div className="space-y-1">
                                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Número de Celular (WhatsApp) *</label>
                                <input
                                  type="tel"
                                  value={userForm.whatsapp}
                                  onChange={e => setUserForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none"
                                  placeholder="Ej. 8112345678"
                                  required
                                />
                              </div>

                              {/* Email */}
                              <div className="space-y-1">
                                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Correo Electrónico *</label>
                                <input
                                  type="email"
                                  value={userForm.email}
                                  onChange={e => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none"
                                  placeholder="Ej. asesor@soluxgreen.com"
                                  required
                                />
                              </div>

                              {/* Prospecting Areas */}
                              <div className="space-y-1">
                                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Área(s) de Prospectación</label>
                                <input
                                  type="text"
                                  value={userForm.prospectingAreas}
                                  onChange={e => setUserForm(prev => ({ ...prev, prospectingAreas: e.target.value }))}
                                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none"
                                  placeholder="Ej. San Pedro, Monterrey, Santa Catarina"
                                />
                              </div>

                              {/* Work Shift */}
                              <div className="space-y-1">
                                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Tipo de Jornada Laboral</label>
                                <select
                                  value={userForm.workShift}
                                  onChange={e => setUserForm(prev => ({ ...prev, workShift: e.target.value as any }))}
                                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                                >
                                  <option value="Tiempo completo">Tiempo Completo</option>
                                  <option value="Tiempo parcial">Tiempo Parcial</option>
                                </select>
                              </div>

                              {/* System Role */}
                              <div className="space-y-1">
                                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Rol del Sistema</label>
                                <select
                                  value={userForm.role}
                                  onChange={e => setUserForm(prev => ({ ...prev, role: e.target.value as any }))}
                                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                                >
                                  <option value="comercial">Asesor Verde (Comercial)</option>
                                  <option value="enlace">Asesor de Enlace (Referidos)</option>
                                  <option value="admin">Administrador General</option>
                                  <option value="partner">Partner de Instalaciones</option>
                                </select>
                              </div>

                              {/* Hierarchy Parent (Asesor Verde Responsable) */}
                              <div className="space-y-1">
                                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Asesor Verde Responsable</label>
                                <select
                                  value={userForm.parentId}
                                  onChange={e => setUserForm(prev => ({ ...prev, parentId: e.target.value }))}
                                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                                >
                                  <option value="">Ninguno (Directo / Nivel Superior)</option>
                                  {commercialUsers.map((u, idx) => (
                                    <option key={`adm_comm_u_${u.id || 'u'}_${idx}`} value={u.id}>{u.fullName}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* Seccion 2: Domicilio del Empleado */}
                          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                              📍 Domicilio del Empleado / Usuario
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                              {/* Calle y número */}
                              <div className="space-y-1 sm:col-span-2">
                                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Calle y Número</label>
                                <input
                                  type="text"
                                  value={userForm.streetAndNumber}
                                  onChange={e => setUserForm(prev => ({ ...prev, streetAndNumber: e.target.value }))}
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none"
                                  placeholder="Ej. Av. Constitución #450 Int 3"
                                />
                              </div>

                              {/* Colonia */}
                              <div className="space-y-1">
                                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Colonia</label>
                                <input
                                  type="text"
                                  value={userForm.colonia}
                                  onChange={e => setUserForm(prev => ({ ...prev, colonia: e.target.value }))}
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none"
                                  placeholder="Ej. Centro"
                                />
                              </div>

                              {/* Municipio / Alcaldía */}
                              <div className="space-y-1">
                                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Municipio / Alcaldía</label>
                                <input
                                  type="text"
                                  value={userForm.municipio}
                                  onChange={e => setUserForm(prev => ({ ...prev, municipio: e.target.value }))}
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none"
                                  placeholder="Ej. Monterrey"
                                />
                              </div>

                              {/* Código Postal */}
                              <div className="space-y-1 sm:col-span-1">
                                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Código Postal</label>
                                <input
                                  type="text"
                                  maxLength={5}
                                  value={userForm.zipCode}
                                  onChange={e => setUserForm(prev => ({ ...prev, zipCode: e.target.value.replace(/\D/g, '') }))}
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none"
                                  placeholder="Ej. 64000"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Seccion 3: Identificación Oficial (INE Frente y Vuelta) */}
                          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                              🪪 Identificación Oficial (INE Frente y Vuelta)
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {/* INE Frente */}
                              <div className="space-y-2 bg-white p-3 rounded-xl border border-slate-200">
                                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">INE Frente</label>
                                {userForm.ineFrontDoc ? (
                                  <div className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-100 max-h-36 flex items-center justify-center p-2">
                                    <img src={userForm.ineFrontDoc} alt="INE Frente" className="max-h-28 object-contain rounded" />
                                    <button
                                      type="button"
                                      onClick={() => setUserForm(prev => ({ ...prev, ineFrontDoc: '' }))}
                                      className="absolute top-2 right-2 bg-rose-600 text-white text-[9px] font-black px-2 py-1 rounded-md shadow hover:bg-rose-700 cursor-pointer"
                                    >
                                      Eliminar
                                    </button>
                                  </div>
                                ) : (
                                  <label className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-50 hover:bg-emerald-50/30 text-center">
                                    <Upload className="w-5 h-5 text-slate-400 mb-1" />
                                    <span className="text-[10px] font-bold text-slate-600">Subir Fotografía INE (Frente)</span>
                                    <span className="text-[8px] text-slate-400">JPG, PNG o WebP</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={e => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          const reader = new FileReader();
                                          reader.onloadend = () => {
                                            setUserForm(prev => ({ ...prev, ineFrontDoc: reader.result as string }));
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                    />
                                  </label>
                                )}
                              </div>

                              {/* INE Vuelta */}
                              <div className="space-y-2 bg-white p-3 rounded-xl border border-slate-200">
                                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">INE Reverso / Vuelta</label>
                                {userForm.ineBackDoc ? (
                                  <div className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-100 max-h-36 flex items-center justify-center p-2">
                                    <img src={userForm.ineBackDoc} alt="INE Reverso" className="max-h-28 object-contain rounded" />
                                    <button
                                      type="button"
                                      onClick={() => setUserForm(prev => ({ ...prev, ineBackDoc: '' }))}
                                      className="absolute top-2 right-2 bg-rose-600 text-white text-[9px] font-black px-2 py-1 rounded-md shadow hover:bg-rose-700 cursor-pointer"
                                    >
                                      Eliminar
                                    </button>
                                  </div>
                                ) : (
                                  <label className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-50 hover:bg-emerald-50/30 text-center">
                                    <Upload className="w-5 h-5 text-slate-400 mb-1" />
                                    <span className="text-[10px] font-bold text-slate-600">Subir Fotografía INE (Reverso)</span>
                                    <span className="text-[8px] text-slate-400">JPG, PNG o WebP</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={e => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          const reader = new FileReader();
                                          reader.onloadend = () => {
                                            setUserForm(prev => ({ ...prev, ineBackDoc: reader.result as string }));
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                    />
                                  </label>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Seccion 4: Información Bancaria */}
                          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                            <div className="flex justify-between items-center">
                              <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                                🏦 Información Bancaria (Dispersión de Pagos / Comisiones)
                              </h4>
                              <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-full">
                                🚫 Excepto cuentas SPIN by OXXO
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              {/* Account Holder Name */}
                              <div className="space-y-1">
                                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Nombre del Titular de la Cuenta</label>
                                <input
                                  type="text"
                                  value={userForm.bankAccountHolder}
                                  onChange={e => setUserForm(prev => ({ ...prev, bankAccountHolder: e.target.value }))}
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none"
                                  placeholder="Nombre idéntico al estado de cuenta"
                                />
                              </div>

                              {/* Bank Name */}
                              <div className="space-y-1">
                                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">
                                  Institución Bancaria <span className="text-rose-500 font-normal text-[8px]">(No SPIN)</span>
                                </label>
                                <input
                                  type="text"
                                  value={userForm.bankName}
                                  onChange={e => setUserForm(prev => ({ ...prev, bankName: e.target.value }))}
                                  className={`w-full px-3 py-2 border rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none ${
                                    userForm.bankName.toLowerCase().includes('spin') || userForm.bankName.toLowerCase().includes('oxxo')
                                      ? 'bg-rose-50 border-rose-300 text-rose-900'
                                      : 'bg-white border-slate-200'
                                  }`}
                                  placeholder="Ej. BBVA, Banorte, Santander, HSBC..."
                                />
                                {(userForm.bankName.toLowerCase().includes('spin') || userForm.bankName.toLowerCase().includes('oxxo')) && (
                                  <span className="text-[9px] font-black text-rose-600 block">⚠️ Las cuentas SPIN by OXXO no están permitidas.</span>
                                )}
                              </div>

                              {/* CLABE 18 digits */}
                              <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">CLABE Interbancaria</label>
                                  <span className={`text-[8px] font-black ${userForm.bankClabe.replace(/\D/g, '').length === 18 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                    {userForm.bankClabe.replace(/\D/g, '').length}/18 dígitos
                                  </span>
                                </div>
                                <input
                                  type="text"
                                  maxLength={18}
                                  value={userForm.bankClabe}
                                  onChange={e => setUserForm(prev => ({ ...prev, bankClabe: e.target.value.replace(/\D/g, '') }))}
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 placeholder-slate-400 focus:outline-none"
                                  placeholder="18 dígitos numéricos"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Seccion 3: Credenciales de Acceso */}
                          <div className="space-y-3 pt-1">
                            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                              🔑 Acceso al Sistema
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {/* Username */}
                              <div className="space-y-1">
                                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Nombre de Usuario *</label>
                                <input
                                  type="text"
                                  name="solux_adm_new_username"
                                  autoComplete="off"
                                  autoCorrect="off"
                                  spellCheck={false}
                                  value={userForm.username}
                                  onChange={e => {
                                    setIsUserFormUsernameManuallyEdited(true);
                                    setUserForm(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, '') }));
                                  }}
                                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none"
                                  placeholder="Ej. carlos_solux"
                                  required
                                />
                              </div>

                              {/* Password */}
                              <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Contraseña *</label>
                                  <button
                                    type="button"
                                    onClick={generateSecurePassword}
                                    className="text-[8px] font-black uppercase text-emerald-600 hover:text-emerald-700 tracking-wider hover:underline focus:outline-none cursor-pointer"
                                  >
                                    ⚡ Generar Clave Segura
                                  </button>
                                </div>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                  <input
                                    type="text"
                                    name="solux_adm_new_password"
                                    autoComplete="new-password"
                                    value={userForm.password}
                                    onChange={e => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                                    placeholder="Escribe o autogenera"
                                    required
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => setIsUserFormOpen(false)}
                              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md"
                            >
                              {editingUserId ? 'Guardar Cambios' : 'Registrar Colaborador'}
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Modal to share saved/edited user credentials via WhatsApp immediately */}
                  <AnimatePresence>
                    {lastSavedUser && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5 shadow-lg space-y-4 relative overflow-hidden"
                      >
                        {/* Ambient success indicator */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-10 -mt-10 pointer-events-none"></div>
                        
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-black">
                              ✓
                            </div>
                            <div>
                              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                                ¡Guardado Exitosamente!
                              </h3>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                El usuario ha sido registrado/actualizado en el sistema.
                              </p>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => setLastSavedUser(null)}
                            className="p-1 rounded-lg hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer text-[10px] font-black uppercase tracking-wider"
                          >
                            ✕ Cerrar
                          </button>
                        </div>

                        <div className="bg-white border border-emerald-100/80 rounded-2xl p-4 space-y-3 shadow-xs">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                              <span className="text-[8px] font-black uppercase text-slate-400 block tracking-wider">Nombre Completo</span>
                              <span className="text-xs font-extrabold text-slate-800 block">{lastSavedUser.fullName}</span>
                            </div>
                            <div>
                              <span className="text-[8px] font-black uppercase text-slate-400 block tracking-wider">Usuario</span>
                              <span className="text-xs font-mono font-extrabold text-slate-700 block">{lastSavedUser.username}</span>
                            </div>
                            <div>
                              <span className="text-[8px] font-black uppercase text-slate-400 block tracking-wider">Password</span>
                              <span className="text-xs font-mono font-extrabold text-slate-700 block">{lastSavedUser.password}</span>
                            </div>
                            <div>
                              <span className="text-[8px] font-black uppercase text-slate-400 block tracking-wider">WhatsApp</span>
                              <span className="text-xs font-extrabold text-slate-800 block">{lastSavedUser.whatsapp || 'No registrado'}</span>
                            </div>
                          </div>
                          
                          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 text-[10px] text-slate-500 font-bold uppercase tracking-wider text-center">
                            🔗 Enlace de Acceso: <span className="font-mono text-indigo-600 select-all font-black">{window.location.origin}</span>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => setLastSavedUser(null)}
                            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                          >
                            Omitir / Listo
                          </button>
                          {lastSavedUser.whatsapp && (
                            <a
                              href={getWhatsAppShareLink(lastSavedUser)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setLastSavedUser(null)}
                              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                            >
                              <Share2 className="w-3.5 h-3.5" /> Enviar por WhatsApp
                            </a>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Users list grid */}
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                              <span>Nombre Completo</span>
                              <span className="ml-1 text-[8px] text-emerald-600 font-bold lowercase">(recientes arriba)</span>
                            </th>
                            <th className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Correo</th>
                            <th className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Usuario</th>
                            <th className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400">WhatsApp</th>
                            <th className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Jornada / Prospectación</th>
                            <th className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Info Bancaria (CLABE)</th>
                            <th className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Perfil / Jerarquía</th>
                            <th className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Esquema</th>
                            <th className="p-3 text-right text-[9px] font-black uppercase tracking-widest text-slate-400">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredUsers.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="p-8 text-center text-slate-400 font-bold">
                                🔍 No se encontró ningún integrante de personal que coincida con los filtros aplicados.
                              </td>
                            </tr>
                          ) : (
                            filteredUsers.map((u, idx) => {
                            const parent = users.find(parentUsr => parentUsr.id === u.parentId);
                            const isNewest = idx === 0 && getUserRecencyScore(u) > 0;
                            return (
                              <tr 
                                key={`adm_user_row_${u.id || u.username}_${idx}`} 
                                className={`transition-all font-bold cursor-pointer ${
                                  isNewest 
                                    ? 'bg-emerald-50/40 hover:bg-emerald-50/70 border-l-4 border-l-emerald-500' 
                                    : 'hover:bg-slate-100/70'
                                }`} 
                                onClick={() => handleOpenEditUser(u)}
                              >
                                <td className="p-3 text-slate-900 font-extrabold">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 shrink-0 bg-slate-100 flex items-center justify-center">
                                      <img 
                                        src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName)}&background=10B981&color=fff&size=40&bold=true`} 
                                        alt={u.fullName} 
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                      />
                                    </div>
                                    <div className="flex flex-col">
                                      <div className="flex items-center gap-1.5">
                                        <span>{u.fullName}</span>
                                        {isNewest && (
                                          <span className="px-1.5 py-0.5 rounded-md text-[8px] font-black bg-emerald-600 text-white tracking-wider uppercase animate-pulse shadow-xs">
                                            ✨ Recién Registrado
                                          </span>
                                        )}
                                      </div>
                                      {((u.inePhotos && u.inePhotos.length > 0) || u.ineFrontDoc) ? (
                                        <span className="text-[9px] text-emerald-700 font-black flex items-center gap-1">
                                          🪪 INE / Evidencias Disponibles
                                        </span>
                                      ) : (
                                        <span className="text-[9px] text-slate-400 font-normal italic">Sin INE cargada</span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3 text-slate-500 font-medium text-[11px]">{u.email || '—'}</td>
                                <td className="p-3 text-slate-500 font-mono text-[11px]">{u.username}</td>
                                <td className="p-3 text-slate-600 text-[11px]">
                                  <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                                    <span className="font-mono">{u.whatsapp || '—'}</span>
                                    {u.whatsapp && (
                                      <a
                                        href={getWhatsAppShareLink(u)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/50 text-emerald-700 rounded-full text-[9px] font-bold tracking-tight transition-all uppercase"
                                        title="Compartir credenciales por WhatsApp"
                                      >
                                        <Share2 className="w-2.5 h-2.5 text-emerald-600" /> Compartir
                                      </a>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3 text-slate-600 text-[11px]">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-extrabold text-slate-800">{u.workShift || 'Tiempo completo'}</span>
                                    {u.prospectingAreas && <span className="text-[10px] text-slate-500 font-medium truncate max-w-[140px]">📍 {u.prospectingAreas}</span>}
                                  </div>
                                </td>
                                <td className="p-3 text-slate-600 text-[10px] font-mono">
                                  <div className="flex flex-col gap-0.5">
                                    {u.bankAccountHolder && <span className="font-sans font-black text-slate-900 truncate">👤 {u.bankAccountHolder}</span>}
                                    {u.bankName && <span className="font-sans text-slate-600 font-bold">🏛️ {u.bankName}</span>}
                                    {u.bankClabe && <span className="text-emerald-700 font-extrabold select-all">CLABE: {u.bankClabe}</span>}
                                    {!u.bankAccountHolder && !u.bankName && !u.bankClabe && (
                                      <span className="text-slate-300 italic text-[10px]">Sin datos bancarios</span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <div className="flex flex-col gap-0.5">
                                    <span className={`inline-block self-start px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                                      u.role === 'admin'
                                        ? 'bg-violet-50 text-violet-700 border border-violet-100'
                                        : u.role === 'comercial'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                        : u.role === 'enlace'
                                        ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                        : 'bg-teal-50 text-teal-700 border border-teal-100'
                                    }`}>
                                      {u.role === 'admin' ? 'Administrador' : u.role === 'comercial' ? 'Asesor Verde' : u.role === 'enlace' ? 'Asesor de Enlace' : 'Partner de Instalación'}
                                    </span>
                                    {parent && (
                                      <span className="text-[8px] text-slate-400 font-normal">
                                        Asignado a: <span className="font-extrabold text-slate-500">{parent.fullName}</span>
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3 text-slate-600 text-[11px]">
                                  {u.role === 'admin' && <span className="text-slate-400 font-normal">Control total</span>}
                                  {u.role === 'comercial' && <span className="text-emerald-700">Gana sobre utilidad directa</span>}
                                  {u.role === 'enlace' && <span className="text-blue-700 font-semibold">$1,000 pesos por referido instalado</span>}
                                  {u.role === 'partner' && <span className="text-teal-700 font-semibold">Costo por levantamiento y obra</span>}
                                </td>
                                <td className="p-3 text-right" onClick={e => e.stopPropagation()}>
                                  <div className="inline-flex items-center gap-1">
                                    {onSwitchUser && (
                                      <button
                                        type="button"
                                        onClick={() => onSwitchUser(u)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-600 hover:text-white rounded-lg transition-all cursor-pointer text-[10px] font-extrabold uppercase text-emerald-700 border border-emerald-200/60 shadow-2xs"
                                        title={`Ingresar al sistema como ${u.fullName}`}
                                      >
                                        <LogIn className="w-3.5 h-3.5" />
                                        Acceder
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleOpenEditUser(u)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-900 hover:text-white rounded-lg transition-all cursor-pointer text-[10px] font-extrabold uppercase text-slate-700"
                                      title="Ver / Editar Expediente Completo"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      Ver / Editar
                                    </button>
                                    <button
                                      onClick={() => handleDeleteUser(u.id)}
                                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-all cursor-pointer"
                                      title="Dar de baja"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          }))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------- MODULE 2.5: GESTIÓN DE PARTNERS (SOCIOS) ------------------- */}
              {activeTab === 'partners' && (
                <div className="space-y-6 animate-fade-in" id="admin-partners-module-tab">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h2 className="text-sm font-black uppercase tracking-wide text-slate-900 flex items-center gap-2">
                          <Handshake className="w-5 h-5 text-[#10B981]" />
                          <span>Gestión de Socios Partners</span>
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-teal-100 text-teal-800 border border-teal-200 shadow-xs">
                          {partnerUsers.length} Registrados
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Alta rápida, asignación de tarifas de levantamiento/instalación y datos bancarios</p>
                    </div>
                    
                    <button
                      onClick={handleOpenAddPartner}
                      id="btn-add-partner-trigger"
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-[#10B981] text-white text-[10px] font-black uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Dar de Alta Nuevo Partner
                    </button>
                  </div>

                  {/* Success Share credentials banner for new partners */}
                  <AnimatePresence>
                    {lastSavedUser && lastSavedUser.role === 'partner' && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5 shadow-lg space-y-4 relative overflow-hidden"
                        id="partner-success-share-banner"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-10 -mt-10 pointer-events-none"></div>
                        
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-black">
                              ✓
                            </div>
                            <div>
                              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                                ¡Socio Partner Guardado con Éxito!
                              </h3>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                El socio partner ha sido registrado. Comparte sus credenciales de acceso de inmediato.
                              </p>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => setLastSavedUser(null)}
                            className="p-1 rounded-lg hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer text-[10px] font-black uppercase tracking-wider"
                          >
                            ✕ Cerrar
                          </button>
                        </div>

                        <div className="bg-white border border-emerald-100/80 rounded-2xl p-4 space-y-3 shadow-xs">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                              <span className="text-[8px] font-black uppercase text-slate-400 block tracking-wider">Razón Social</span>
                              <span className="text-xs font-extrabold text-slate-800 block">{lastSavedUser.fullName}</span>
                            </div>
                            <div>
                              <span className="text-[8px] font-black uppercase text-slate-400 block tracking-wider">Usuario Creado</span>
                              <span className="text-xs font-mono font-extrabold text-slate-700 block">{lastSavedUser.username}</span>
                            </div>
                            <div>
                              <span className="text-[8px] font-black uppercase text-slate-400 block tracking-wider">Contraseña de Acceso</span>
                              <span className="text-xs font-mono font-extrabold text-emerald-700 select-all">{lastSavedUser.password}</span>
                            </div>
                            <div>
                              <span className="text-[8px] font-black uppercase text-slate-400 block tracking-wider">Teléfono WhatsApp</span>
                              <span className="text-xs font-extrabold text-slate-800 block">{lastSavedUser.whatsapp || 'No registrado'}</span>
                            </div>
                          </div>
                          
                          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 text-[10px] text-slate-500 font-bold uppercase tracking-wider text-center">
                            🔗 Enlace de Acceso: <span className="font-mono text-emerald-600 select-all font-black">{window.location.origin}</span>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => setLastSavedUser(null)}
                            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                          >
                            Omitir
                          </button>
                          {lastSavedUser.whatsapp && (
                            <a
                              href={getWhatsAppShareLink(lastSavedUser)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setLastSavedUser(null)}
                              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                            >
                              <Share2 className="w-3.5 h-3.5" /> Compartir Credenciales por WhatsApp
                            </a>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Summary Bento Stats for Partners */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="partners-stats-bento">
                    <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col justify-between shadow-xs">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Partners de Alta</span>
                      <span className="text-lg font-black text-slate-900 mt-2 block">
                        {users.filter(u => u.role === 'partner').length}
                      </span>
                      <span className="text-[8px] text-emerald-600 font-bold block mt-1">Socios activos</span>
                    </div>
                    <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col justify-between shadow-xs">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Cuadrillas Totales</span>
                      <span className="text-lg font-black text-[#10B981] mt-2 block">
                        {users.filter(u => u.role === 'partner').reduce((acc, u) => acc + (Number(u.crewsCount) || 1), 0)}
                      </span>
                      <span className="text-[8px] text-slate-500 font-bold block mt-1">Capacidad operativa</span>
                    </div>
                    <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col justify-between shadow-xs">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Tarifa Prom. Levantamiento</span>
                      <span className="text-lg font-black text-slate-900 mt-2 block">
                        ${users.filter(u => u.role === 'partner' && u.surveyRate).length > 0
                          ? Math.round(users.filter(u => u.role === 'partner' && u.surveyRate).reduce((acc, u) => acc + Number(u.surveyRate), 0) / users.filter(u => u.role === 'partner' && u.surveyRate).length).toLocaleString('es-MX')
                          : '1,200'} MXN
                      </span>
                      <span className="text-[8px] text-slate-500 font-bold block mt-1">Costo unitario técnico</span>
                    </div>
                    <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col justify-between shadow-xs">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Zonas Cubiertas</span>
                      <span className="text-lg font-black text-indigo-600 mt-2 block">
                        {Array.from(new Set(users.filter(u => u.role === 'partner').map(u => u.coverage || 'NL'))).length}
                      </span>
                      <span className="text-[8px] text-slate-500 font-bold block mt-1">Soberanía de instalación</span>
                    </div>
                  </div>

                  {/* Partner Form Form Modal/Drawer in-place */}
                  <AnimatePresence>
                    {isPartnerFormOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        id="partner-form-container"
                        className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-md overflow-hidden"
                      >
                        <form onSubmit={handleSavePartner} autoComplete="off" className="space-y-5">
                          {/* Anti-browser autofill traps */}
                          <input type="text" name="anti_autofill_partner_user" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
                          <input type="password" name="anti_autofill_partner_pass" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
                          <h3 className="text-xs font-black text-slate-900 uppercase border-b pb-2 flex items-center justify-between">
                            <span>{editingPartnerId ? '📝 Editar Perfil de Partner' : '➕ Alta Rápida de Partner Instalador'}</span>
                            <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                              Socio Estratégico
                            </span>
                          </h3>
                          
                          {/* Sección 1: Datos Generales y Acceso */}
                          <div className="space-y-2">
                            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                              <span>👤</span> 1. Información General y Acceso
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5 bg-slate-50/60 p-3.5 rounded-2xl border border-slate-200/80">
                              {/* Full Name */}
                              <div className="space-y-1">
                                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Razón Social / Nombre Empresa *</label>
                                <input
                                  type="text"
                                  value={partnerForm.fullName}
                                  onChange={e => setPartnerForm(prev => ({ ...prev, fullName: e.target.value }))}
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none"
                                  placeholder="Ej. Soluciones Solares del Norte S.A."
                                  required
                                />
                              </div>

                              {/* Email */}
                              <div className="space-y-1">
                                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Correo Electrónico *</label>
                                <input
                                  type="email"
                                  value={partnerForm.email}
                                  onChange={e => setPartnerForm(prev => ({ ...prev, email: e.target.value }))}
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none"
                                  placeholder="Ej. contacto@partnersolar.mx"
                                  required
                                />
                              </div>

                              {/* Username */}
                              <div className="space-y-1">
                                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Nombre de Usuario *</label>
                                <input
                                  type="text"
                                  name="solux_partner_new_username"
                                  autoComplete="off"
                                  autoCorrect="off"
                                  spellCheck={false}
                                  value={partnerForm.username}
                                  onChange={e => setPartnerForm(prev => ({ ...prev, username: e.target.value }))}
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none"
                                  placeholder="Ej. partnersolar"
                                  required
                                />
                              </div>

                              {/* WhatsApp */}
                              <div className="space-y-1">
                                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">WhatsApp de Contacto *</label>
                                <input
                                  type="tel"
                                  name="solux_partner_new_whatsapp"
                                  autoComplete="off"
                                  value={partnerForm.whatsapp}
                                  onChange={e => setPartnerForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none"
                                  placeholder="Ej. 8112345678"
                                  required
                                />
                              </div>

                              {/* Password */}
                              <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Contraseña de Acceso *</label>
                                  <button
                                    type="button"
                                    onClick={generateSecurePasswordForPartner}
                                    className="text-[8px] font-black uppercase text-[#10B981] hover:underline cursor-pointer"
                                  >
                                    ⚡ Generar segura
                                  </button>
                                </div>
                                <input
                                  type="text"
                                  name="solux_partner_new_password"
                                  autoComplete="new-password"
                                  value={partnerForm.password}
                                  onChange={e => setPartnerForm(prev => ({ ...prev, password: e.target.value }))}
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none font-mono"
                                  placeholder="Ingresa contraseña"
                                  required
                                />
                              </div>

                              {/* Coverage */}
                              <div className="space-y-1">
                                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Cobertura Geográfica *</label>
                                <input
                                  type="text"
                                  value={partnerForm.coverage}
                                  onChange={e => setPartnerForm(prev => ({ ...prev, coverage: e.target.value }))}
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                                  placeholder="Ej. Monterrey, NL y Saltillo, Coah."
                                  required
                                />
                              </div>

                              {/* Crews Count */}
                              <div className="space-y-1">
                                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Cuadrillas Activas *</label>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  value={partnerForm.crewsCount || ''}
                                  onChange={e => {
                                    const val = e.target.value.replace(/[^0-9]/g, '');
                                    setPartnerForm(prev => ({ ...prev, crewsCount: val === '' ? 0 : Number(val) }));
                                  }}
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none [appearance:textfield]"
                                  placeholder="Ej. 1"
                                  required
                                />
                              </div>
                            </div>
                          </div>

                          {/* Sección 2: Domicilio, Ubicación e Identificación Oficial (INE) */}
                          <div className="space-y-2">
                            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                              <span>📍</span> 2. Domicilio, Ubicación e Identificación Oficial (INE)
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-slate-50/60 p-3.5 rounded-2xl border border-slate-200/80">
                              {/* Domicilio */}
                              <div className="space-y-1 md:col-span-2">
                                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Domicilio Fiscal / Físico de la Empresa</label>
                                <input
                                  type="text"
                                  value={partnerForm.address}
                                  onChange={e => setPartnerForm(prev => ({ ...prev, address: e.target.value }))}
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none"
                                  placeholder="Ej. Av. Constitución 1500, Col. Centro, Monterrey, N.L."
                                />
                              </div>

                              {/* Link Ubicación Google Maps */}
                              <div className="space-y-1 md:col-span-2">
                                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Link de Ubicación (Google Maps / Coordenadas)</label>
                                <input
                                  type="url"
                                  value={partnerForm.locationUrl}
                                  onChange={e => setPartnerForm(prev => ({ ...prev, locationUrl: e.target.value }))}
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none"
                                  placeholder="Ej. https://maps.google.com/?q=25.6866,-100.3161"
                                />
                              </div>

                              {/* Upload INE Photos (Multi-image support) */}
                              <div className="space-y-2 md:col-span-2">
                                <div className="flex items-center justify-between">
                                  <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">
                                    Identificación Oficial INE (Cargar de 1 a más imágenes)
                                  </label>
                                  <span className="text-[9px] font-bold text-emerald-700">
                                    {partnerForm.inePhotos?.length || 0} imagen(es) adjunta(s)
                                  </span>
                                </div>

                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                  <label className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-sm transition-all shrink-0">
                                    <span>📸 Subir Fotografía(s) INE</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      multiple
                                      className="hidden"
                                      onChange={handlePartnerIneUpload}
                                    />
                                  </label>
                                  <span className="text-[10px] text-slate-400 font-semibold">
                                    Puedes seleccionar varias fotos a la vez (Frente, Reverso, Comprobante).
                                  </span>
                                </div>

                                {/* Previews of INE Photos */}
                                {partnerForm.inePhotos && partnerForm.inePhotos.length > 0 && (
                                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 pt-2">
                                    {partnerForm.inePhotos.map((imgUrl, idx) => (
                                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white h-20 shadow-2xs">
                                        <img src={imgUrl} alt={`INE ${idx + 1}`} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-1.5 p-1">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setZoomedImage(imgUrl);
                                              setZoomedTitle(`INE Partner - Foto ${idx + 1}`);
                                            }}
                                            className="p-1 bg-white text-slate-800 rounded-lg text-[9px] font-bold hover:scale-110 transition-transform cursor-pointer"
                                            title="Ampliar Foto"
                                          >
                                            🔍
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleRemovePartnerInePhoto(idx)}
                                            className="p-1 bg-rose-600 text-white rounded-lg text-[9px] font-bold hover:scale-110 transition-transform cursor-pointer"
                                            title="Eliminar Foto"
                                          >
                                            🗑️
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Sección 3: Tarifario Operativo y Estatus de Pago */}
                          <div className="space-y-2">
                            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                              <span>💰</span> 3. Tarifario Operativo y Estatus de Pago
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 bg-slate-50/60 p-3.5 rounded-2xl border border-slate-200/80">
                              {/* Survey Rate */}
                              <div className="space-y-1">
                                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Pago por Levantamiento ($ MXN) *</label>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  value={partnerForm.surveyRate || ''}
                                  onChange={e => {
                                    const val = e.target.value.replace(/[^0-9]/g, '');
                                    setPartnerForm(prev => ({ ...prev, surveyRate: val === '' ? 0 : Number(val) }));
                                  }}
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none [appearance:textfield]"
                                  placeholder="Ej. 250"
                                  required
                                />
                              </div>

                              {/* Panel Rate */}
                              <div className="space-y-1">
                                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Costo por Panel Instalado ($ MXN) *</label>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  value={partnerForm.panelRate || ''}
                                  onChange={e => {
                                    const val = e.target.value.replace(/[^0-9]/g, '');
                                    setPartnerForm(prev => ({ ...prev, panelRate: val === '' ? 0 : Number(val) }));
                                  }}
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none [appearance:textfield]"
                                  placeholder="Ej. 600"
                                  required
                                />
                              </div>

                              {/* Estatus de su Pago (Dropdown) */}
                              <div className="space-y-1">
                                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Estatus de su Pago *</label>
                                <select
                                  value={partnerForm.paymentStatusType}
                                  onChange={e => setPartnerForm(prev => ({ ...prev, paymentStatusType: e.target.value }))}
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                                >
                                  <option value="Por proyecto">Por proyecto</option>
                                  <option value="Por referido">Por referido</option>
                                  <option value="5% antes de IVA">5% antes de IVA</option>
                                </select>
                              </div>

                              {/* Partner Status */}
                              <div className="space-y-1">
                                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Estatus de Alianza</label>
                                <select
                                  value={partnerForm.partnerStatus}
                                  onChange={e => setPartnerForm(prev => ({ ...prev, partnerStatus: e.target.value }))}
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                                >
                                  <option value="activo">Activo (Asignable)</option>
                                  <option value="revision">En Revisión Técnica</option>
                                  <option value="suspendido">Suspendido</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* Sección 4: Datos Bancarios */}
                          <div className="space-y-2">
                            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                              <span>🏦</span> 4. Datos Bancarios Completo para Dispersiones
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5 bg-slate-50/60 p-3.5 rounded-2xl border border-slate-200/80">
                              {/* Nombre del Titular de la Cuenta */}
                              <div className="space-y-1 sm:col-span-2 md:col-span-1 xl:col-span-2">
                                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Nombre del Titular de la Cuenta</label>
                                <input
                                  type="text"
                                  value={partnerForm.bankAccountHolder}
                                  onChange={e => setPartnerForm(prev => ({ ...prev, bankAccountHolder: e.target.value }))}
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none"
                                  placeholder="Ej. Juan Pérez García"
                                />
                              </div>

                              {/* Banco */}
                              <div className="space-y-1">
                                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Banco</label>
                                <input
                                  type="text"
                                  value={partnerForm.bankName}
                                  onChange={e => setPartnerForm(prev => ({ ...prev, bankName: e.target.value }))}
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none"
                                  placeholder="Ej. BBVA / Banorte"
                                />
                              </div>

                              {/* Cuenta CLABE */}
                              <div className="space-y-1">
                                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Cuenta CLABE</label>
                                <input
                                  type="text"
                                  value={partnerForm.bankClabe}
                                  onChange={e => setPartnerForm(prev => ({ ...prev, bankClabe: e.target.value }))}
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 placeholder-slate-400 focus:outline-none"
                                  placeholder="18 dígitos"
                                  maxLength={18}
                                />
                              </div>

                              {/* Número de Cuenta */}
                              <div className="space-y-1">
                                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Número de Cuenta</label>
                                <input
                                  type="text"
                                  value={partnerForm.accountNumber}
                                  onChange={e => setPartnerForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 placeholder-slate-400 focus:outline-none"
                                  placeholder="10-12 dígitos"
                                />
                              </div>

                              {/* Número de Tarjeta */}
                              <div className="space-y-1">
                                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Número de Tarjeta</label>
                                <input
                                  type="text"
                                  value={partnerForm.cardNumber}
                                  onChange={e => setPartnerForm(prev => ({ ...prev, cardNumber: e.target.value }))}
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 placeholder-slate-400 focus:outline-none"
                                  placeholder="16 dígitos"
                                  maxLength={16}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => setIsPartnerFormOpen(false)}
                              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-2 bg-[#10B981] hover:bg-emerald-700 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                            >
                              {editingPartnerId ? 'Guardar Cambios' : 'Registrar Socio'}
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>



                  {/* Partners list grid */}
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs" id="partners-table-wrapper">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Razón Social / Empresa</th>
                            <th className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Usuario / Contacto</th>
                            <th className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Domicilio y Ubicación</th>
                            <th className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">INE Cargadas</th>
                            <th className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Tarifario Unitario</th>
                            <th className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Datos Bancarios</th>
                            <th className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Estatus Pago</th>
                            <th className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Estatus Alianza</th>
                            <th className="p-3 text-right text-[9px] font-black uppercase tracking-widest text-slate-400">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {users.filter(u => u.role === 'partner').length === 0 ? (
                            <tr>
                              <td colSpan={9} className="p-8 text-center text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                                No hay socios partners registrados en el sistema. Registra uno arriba.
                              </td>
                            </tr>
                          ) : (
                            users.filter(u => u.role === 'partner').map((u, idx) => (
                              <tr key={`adm_partner_row_${u.id || u.username}_${idx}`} className="hover:bg-slate-50/50 transition-all font-bold">
                                <td className="p-3 text-slate-900 font-extrabold">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs">
                                      🏢
                                    </div>
                                    <div className="flex flex-col">
                                      <span>{u.fullName}</span>
                                      <span className="text-[9px] text-slate-400 font-semibold">{u.coverage || 'Cobertura no especificada'} ({u.crewsCount || 1} cuadrilla/s)</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3 text-slate-500 font-medium text-[11px]">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-mono text-slate-700 font-bold">{u.username}</span>
                                    <span className="text-[9px] text-slate-400">{u.email || '—'}</span>
                                    {u.whatsapp && (
                                      <div className="flex items-center gap-1 mt-0.5">
                                        <span className="font-mono text-[10px] text-slate-600">{u.whatsapp}</span>
                                        <a
                                          href={getWhatsAppShareLink(u)}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 px-1.5 py-0.2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/50 text-emerald-700 rounded-md text-[8px] font-extrabold tracking-tight transition-all uppercase"
                                          title="Compartir credenciales por WhatsApp"
                                        >
                                          <Share2 className="w-2.5 h-2.5 text-emerald-600" /> WhatsApp
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3 text-slate-700 text-[11px] max-w-[180px]">
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[10px] text-slate-700 font-medium line-clamp-2">
                                      📍 {u.address || 'Domicilio no capturado'}
                                    </span>
                                    {u.locationUrl && (
                                      <a
                                        href={u.locationUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[9px] font-extrabold text-blue-600 hover:underline flex items-center gap-1 shrink-0"
                                      >
                                        🌐 Abrir Mapa / Ubicación
                                      </a>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3 text-center">
                                  {u.inePhotos && Array.isArray(u.inePhotos) && u.inePhotos.length > 0 ? (
                                    <div className="flex flex-col items-center gap-1">
                                      <button
                                        onClick={() => {
                                          setZoomedImage(u.inePhotos[0]);
                                          setZoomedTitle(`INE Partner - ${u.fullName}`);
                                        }}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-[10px] font-black uppercase cursor-pointer transition-all"
                                      >
                                        📸 {u.inePhotos.length} Foto(s)
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-slate-300 italic text-[10px]">Sin fotos</span>
                                  )}
                                </td>
                                <td className="p-3 text-slate-600 text-[11px]">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-slate-800">📋 Levantamiento: <span className="font-mono font-black text-slate-950">${(u.surveyRate || 1000).toLocaleString('es-MX')}</span></span>
                                    <span className="text-slate-600">⚡ Por Panel: <span className="font-mono font-black text-slate-800">${(u.panelRate || 1200).toLocaleString('es-MX')}</span></span>
                                  </div>
                                </td>
                                <td className="p-3 text-slate-600 text-[10px] font-mono">
                                  <div className="flex flex-col gap-0.5">
                                    {u.bankAccountHolder && <span className="font-sans font-extrabold text-slate-800 truncate">👤 {u.bankAccountHolder}</span>}
                                    {u.bankName && <span className="font-sans text-slate-500 font-semibold">🏛️ {u.bankName}</span>}
                                    {u.bankClabe && <span className="text-slate-700 select-all font-bold">CLABE: {u.bankClabe}</span>}
                                    {u.accountNumber && <span className="text-slate-500">Cta: {u.accountNumber}</span>}
                                    {u.cardNumber && <span className="text-slate-500">Tarj: **** {u.cardNumber.slice(-4)}</span>}
                                    {!u.bankClabe && !u.bankName && !u.bankAccountHolder && (
                                      <span className="text-slate-300 italic text-[10px]">No capturados</span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider">
                                    {u.paymentStatusType || 'Por proyecto'}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                                    u.partnerStatus === 'activo' || !u.partnerStatus
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                      : u.partnerStatus === 'revision'
                                      ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                      : 'bg-rose-50 text-rose-700 border border-rose-100'
                                  }`}>
                                    {u.partnerStatus === 'activo' || !u.partnerStatus ? 'Activo' : u.partnerStatus === 'revision' ? 'En Revisión' : 'Suspendido'}
                                  </span>
                                </td>
                                <td className="p-3 text-right">
                                  <div className="inline-flex items-center gap-1">
                                    <button
                                      onClick={() => handleOpenEditPartner(u)}
                                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer"
                                      title="Editar Socio Partner"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    {onDeleteUser && (
                                      <button
                                        onClick={() => {
                                          if (window.confirm(`¿Estás seguro de que deseas dar de baja al Partner "${u.fullName}"?`)) {
                                            onDeleteUser(u.id);
                                            showNotification('🤝 Partner eliminado permanentemente.');
                                          }
                                        }}
                                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-all cursor-pointer"
                                        title="Dar de baja Socio Partner"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------- MODULE 3: CONFIGURACIÓN DEL SISTEMA ------------------- */}
              {activeTab === 'configuracion' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Parameter Modification Panel (Requirement 1.2) */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-xs space-y-4">
                    <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-600" />
                      <div>
                        <h2 className="text-xs font-black text-slate-950 uppercase tracking-wide">Parámetros Globales (Configurables)</h2>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Afectan cotizaciones y simuladores en tiempo real</p>
                      </div>
                    </div>

                    <form onSubmit={handleSaveConfig} className="space-y-5">
                      {/* Grid de Parámetros Clave */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Valor base por panel solar */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Valor Base por Panel Solar ($ MXN)</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-xs">$</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={editConfig.panelBasePrice ?? ''}
                              onChange={e => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                setIsConfigDirty(true);
                                setEditConfig(prev => ({ ...prev, panelBasePrice: val }));
                              }}
                              className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 transition-all [appearance:textfield]"
                              placeholder="Ej. 11000"
                              required
                            />
                          </div>
                          <span className="text-[8px] text-slate-400 font-bold block">Inversión base = No. de Paneles × Valor Base.</span>
                        </div>

                        {/* Descuento por Pago de Contado */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-800 block">Descuento Pago de Contado (%)</label>
                            <span className="text-[9px] font-mono font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-300">
                              {editConfig.contadoDiscountPercent !== '' ? `-${editConfig.contadoDiscountPercent}%` : '-'}
                            </span>
                          </div>
                          <div className="relative">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={editConfig.contadoDiscountPercent ?? ''}
                              onChange={e => {
                                const val = e.target.value.replace(/[^0-9.]/g, '');
                                setIsConfigDirty(true);
                                setEditConfig(prev => ({ ...prev, contadoDiscountPercent: val }));
                              }}
                              className="w-full pr-8 px-3 py-2 bg-emerald-50/50 border border-emerald-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 transition-all [appearance:textfield]"
                              placeholder="Ej. 5"
                              required
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 font-extrabold text-xs">%</span>
                          </div>
                          <span className="text-[8px] text-emerald-700 font-bold block">Descuento comercial automático sobre inversión bruta al pagar de contado.</span>
                        </div>

                        {/* Tasa de interés mensual general */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Tasa de Interés Mensual Base (%)</label>
                          <div className="relative">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={editConfig.monthlyInterestRate ?? ''}
                              onChange={e => {
                                const val = e.target.value.replace(/[^0-9.]/g, '');
                                setIsConfigDirty(true);
                                setEditConfig(prev => ({ ...prev, monthlyInterestRate: val }));
                              }}
                              className="w-full pr-8 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 transition-all [appearance:textfield]"
                              placeholder="Ej. 4.9"
                              required
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-xs">%</span>
                          </div>
                          <span className="text-[8px] text-slate-400 font-bold block">Tasa predeterminada aplicada al saldo financiado.</span>
                        </div>

                        {/* Porcentaje de Enganche Predeterminado */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Enganche Mínimo Predeterminado (%)</label>
                            <span className="text-[9px] font-mono font-black text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-300">
                              {editConfig.defaultDownPaymentPercent !== '' ? `${editConfig.defaultDownPaymentPercent}%` : '-'}
                            </span>
                          </div>
                          <div className="relative">
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={editConfig.defaultDownPaymentPercent ?? ''}
                              onChange={e => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                setIsConfigDirty(true);
                                setEditConfig(prev => ({ ...prev, defaultDownPaymentPercent: val }));
                              }}
                              className="w-full pr-8 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 transition-all [appearance:textfield]"
                              placeholder="Ej. 50"
                              required
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-xs">%</span>
                          </div>
                          <span className="text-[8px] text-slate-400 font-bold block">Porcentaje base de enganche para cotizaciones de crédito directo.</span>
                        </div>

                        {/* Costo de levantamiento técnico */}
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Costo de Levantamiento Técnico ($ MXN)</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-xs">$</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={editConfig.siteSurveyCost ?? ''}
                              onChange={e => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                setIsConfigDirty(true);
                                setEditConfig(prev => ({ ...prev, siteSurveyCost: val }));
                              }}
                              className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 transition-all [appearance:textfield]"
                              placeholder="Ej. 250"
                              required
                            />
                          </div>
                          <span className="text-[8px] text-slate-400 font-bold block">Costo de visita técnica presencial pagado para agendar levantamiento.</span>
                        </div>
                      </div>

                      {/* GESTIÓN DINÁMICA DE PLAZOS DE CRÉDITO */}
                      <div className="pt-3 border-t border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                              <span>⚡ Plazos de Crédito Directo Solux</span>
                              <span className="text-[9px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 font-mono rounded-full font-bold">
                                {(editConfig.financingTerms || []).filter(t => t.active).length} Activos
                              </span>
                            </h3>
                            <p className="text-[8px] text-slate-400 font-bold uppercase">
                              Configura los plazos disponibles (3 meses, 6 meses, 12 meses, etc.), sus tasas y enganches
                            </p>
                          </div>
                        </div>

                        {/* Lista de Plazos Configurables */}
                        <div className="space-y-2">
                          {(editConfig.financingTerms || []).length === 0 ? (
                            <div className="p-4 text-center text-xs text-slate-500 border border-dashed border-slate-300 rounded-2xl bg-slate-50/50">
                              <p className="font-bold text-slate-600">No hay esquemas de crédito registrados actualmente.</p>
                              <p className="text-[10px] text-slate-400 mt-1">Usa el formulario inferior para dar de alta los plazos deseados (por ejemplo: 3, 6, 12 meses).</p>
                            </div>
                          ) : (editConfig.financingTerms || []).map((term, idx) => (
                            <div
                              key={`adm_term_config_${term.id || term.months}_${idx}`}
                              className={`p-3 rounded-2xl border transition-all ${
                                term.active 
                                  ? 'bg-slate-50/80 border-slate-200 shadow-2xs' 
                                  : 'bg-slate-100/60 border-dashed border-slate-300 opacity-60'
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                  <input
                                    type="checkbox"
                                    checked={term.active}
                                    onChange={() => handleToggleFinancingTerm(term.id)}
                                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                    title={term.active ? 'Desactivar plazo' : 'Activar plazo'}
                                  />
                                  <div>
                                    <div className="text-[11px] font-black text-slate-900 uppercase flex items-center gap-1.5">
                                      <span>{term.label || `${term.months} Meses`}</span>
                                      <span className="text-[8px] px-1.5 py-0.2 bg-slate-200 text-slate-700 font-bold rounded">
                                        {term.months} meses
                                      </span>
                                    </div>
                                    <div className="text-[8px] text-slate-500 font-medium">
                                      {term.description || `${term.downPaymentPercent}% Enganche • ${term.monthlyInterestRate}% Tasa/mes`}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  {/* Tasa específica del plazo */}
                                  <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 text-[9px]">
                                    <span className="text-slate-400 font-bold uppercase">Tasa:</span>
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      value={term.monthlyInterestRate ?? ''}
                                      onChange={e => {
                                        const val = e.target.value.replace(/[^0-9.]/g, '');
                                        handleUpdateFinancingTermField(term.id, 'monthlyInterestRate', val);
                                      }}
                                      className="w-12 font-mono font-bold text-slate-800 text-right focus:outline-hidden [appearance:textfield]"
                                    />
                                    <span className="font-bold text-slate-500">%</span>
                                  </div>

                                  {/* Enganche específico del plazo */}
                                  <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 text-[9px]">
                                    <span className="text-slate-400 font-bold uppercase">Eng.:</span>
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      pattern="[0-9]*"
                                      value={term.downPaymentPercent ?? ''}
                                      onChange={e => {
                                        const val = e.target.value.replace(/[^0-9]/g, '');
                                        handleUpdateFinancingTermField(term.id, 'downPaymentPercent', val);
                                      }}
                                      className="w-10 font-mono font-bold text-slate-800 text-right focus:outline-hidden [appearance:textfield]"
                                    />
                                    <span className="font-bold text-slate-500">%</span>
                                  </div>

                                  {/* Botón eliminar plazo */}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteFinancingTerm(term.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                    title="Eliminar este plazo"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Sub-formulario para Agregar Nuevo Plazo de Crédito */}
                        <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-2">
                          <div className="text-[9px] font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1">
                            <span>➕ Dar de Alta Nuevo Plazo de Crédito</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <div>
                              <label className="text-[8px] font-bold uppercase text-emerald-800 block">Meses *</label>
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                placeholder="Ej. 12"
                                value={newTermMonths}
                                onChange={e => setNewTermMonths(e.target.value.replace(/[^0-9]/g, ''))}
                                className="w-full px-2 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-slate-800 [appearance:textfield]"
                              />
                            </div>
                            <div>
                              <label className="text-[8px] font-bold uppercase text-emerald-800 block">Tasa Mensual %</label>
                              <input
                                type="text"
                                inputMode="decimal"
                                placeholder="Ej. 2.5"
                                value={newTermRate}
                                onChange={e => setNewTermRate(e.target.value.replace(/[^0-9.]/g, ''))}
                                className="w-full px-2 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-slate-800 [appearance:textfield]"
                              />
                            </div>
                            <div>
                              <label className="text-[8px] font-bold uppercase text-emerald-800 block">Enganche %</label>
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                placeholder="Ej. 50"
                                value={newTermDownPayment}
                                onChange={e => setNewTermDownPayment(e.target.value.replace(/[^0-9]/g, ''))}
                                className="w-full px-2 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-slate-800 [appearance:textfield]"
                              />
                            </div>
                            <div>
                              <label className="text-[8px] font-bold uppercase text-emerald-800 block">Etiqueta (Opcional)</label>
                              <input
                                type="text"
                                placeholder="Ej. 12 Meses Pyme"
                                value={newTermLabel}
                                onChange={e => setNewTermLabel(e.target.value)}
                                className="w-full px-2 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-slate-800"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleAddFinancingTerm}
                            className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                          >
                            + Agregar Esquema de Crédito
                          </button>
                        </div>
                      </div>

                      {/* SIMULADOR EN TIEMPO REAL PARA VERIFICAR CUENTAS (REQUERIDO) */}
                      <div className="pt-3 border-t border-slate-200 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-[10px] font-black uppercase tracking-wide text-slate-800 flex items-center gap-1">
                              <span>🧮 Simulador de Cuentas en Tiempo Real</span>
                            </h3>
                            <p className="text-[8px] text-slate-400 font-bold uppercase">
                              Verifica los cálculos exactos que verán clientes y asesores con los parámetros actuales
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[8px] font-bold text-slate-400 uppercase">Probar con:</span>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 font-bold">$</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={simInvestmentAmount}
                                onChange={e => {
                                  const val = e.target.value.replace(/[^0-9]/g, '');
                                  setSimInvestmentAmount(val);
                                }}
                                className="w-24 pl-4 pr-1 py-1 text-[10px] font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg text-right [appearance:textfield]"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Tarjetas de simulación de cada forma de pago */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {/* Contado */}
                          {(() => {
                            const sim = calculateSoluxFinancing(Number(simInvestmentAmount) || 0, 'contado', editConfig as any);
                            return (
                              <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] font-black text-emerald-900 uppercase">💵 Contado</span>
                                  <span className="text-[8px] font-bold text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded">
                                    -{editConfig.contadoDiscountPercent}%
                                  </span>
                                </div>
                                <div className="text-[12px] font-black text-emerald-800">
                                  ${sim.netInvestment.toLocaleString('es-MX')} MXN
                                </div>
                                <div className="text-[8px] text-emerald-700">
                                  Ahorro: <b>${sim.discountAmount.toLocaleString('es-MX')} MXN</b> en pago único.
                                </div>
                              </div>
                            );
                          })()}

                          {/* Plazos de Crédito Activos */}
                          {(editConfig.financingTerms || []).filter(t => t.active).map((term, idx) => {
                            const sim = calculateSoluxFinancing(Number(simInvestmentAmount) || 0, `directo_${term.months}m`, editConfig as any);
                            return (
                              <div key={`adm_term_active_${term.id || term.months}_${idx}`} className="p-2.5 bg-sky-50/70 border border-sky-200 rounded-xl space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] font-black text-sky-900 uppercase">⚡ {term.label || `${term.months} Meses`}</span>
                                  <span className="text-[8px] font-bold text-sky-700 bg-sky-100 px-1 py-0.2 rounded">
                                    {sim.monthlyInterestRate}% /mes
                                  </span>
                                </div>
                                <div className="text-[12px] font-black text-sky-800">
                                  ${sim.monthlyPayment.toLocaleString('es-MX')} <span className="text-[9px] font-bold">/mes</span>
                                </div>
                                <div className="text-[8px] text-sky-700 space-y-0.5">
                                  <div>Enganche ({sim.downPaymentPercent}%): <b>${sim.downPayment.toLocaleString('es-MX')}</b></div>
                                  <div>Total Crédito: <b>${sim.totalWithInterest.toLocaleString('es-MX')}</b></div>
                                </div>
                              </div>
                            );
                          })}

                          {/* MSI */}
                          {(() => {
                            const sim = calculateSoluxFinancing(simInvestmentAmount, 'msi', editConfig);
                            return (
                              <div className="p-2.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] font-black text-indigo-900 uppercase">💳 12 MSI Bancario</span>
                                  <span className="text-[8px] font-bold text-indigo-700 bg-indigo-100 px-1 py-0.2 rounded">0% Int.</span>
                                </div>
                                <div className="text-[12px] font-black text-indigo-800">
                                  ${sim.monthlyPayment.toLocaleString('es-MX')} <span className="text-[9px] font-bold">/mes</span>
                                </div>
                                <div className="text-[8px] text-indigo-700">
                                  12 mensualidades fijas sin intereses con tarjeta participante.
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {isConfigDirty && (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs font-bold shadow-2xs animate-fade-in">
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                            </span>
                            <span className="text-[11px] font-black uppercase tracking-wider text-amber-800">Tienes cambios pendientes de guardar</span>
                          </div>
                          <button
                            type="button"
                            onClick={handleResetConfig}
                            className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-amber-200 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-2xs active:scale-95"
                          >
                            🔄 Deshacer Cambios
                          </button>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-2">
                        {isConfigDirty && (
                          <button
                            type="button"
                            onClick={handleResetConfig}
                            className="sm:w-1/3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[11px] uppercase tracking-wider rounded-2xl transition-all cursor-pointer text-center"
                          >
                            Deshacer Cambios
                          </button>
                        )}
                        <button
                          type="submit"
                          className={`flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black text-[11px] uppercase tracking-wider rounded-2xl shadow-sm transition-all cursor-pointer text-center flex items-center justify-center gap-2 ${
                            isConfigDirty ? 'ring-2 ring-emerald-500 ring-offset-2 animate-pulse' : ''
                          }`}
                        >
                          <span>💾</span>
                          <span>Guardar y Actualizar Todos los Parámetros Globales</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Push Notifications Catalogue Simulation Panel (Requirement 5) */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-xs space-y-4">
                    <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                      <Bell className="w-4 h-4 text-indigo-600 animate-swing" />
                      <div>
                        <h2 className="text-xs font-black text-slate-950 uppercase tracking-wide">Catálogo de Notificaciones Push</h2>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Simula y prueba el catálogo de eventos automatizados</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {pushNotifications.map((item, idx) => (
                        <div key={`adm_push_notif_${item.id || 'push'}_${idx}`} className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col gap-1 text-[11px]">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-slate-900">{item.title}</span>
                            <span className="text-[8px] font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md">
                              {item.role}
                            </span>
                          </div>
                          <p className="text-slate-500 text-[10px] italic leading-relaxed">{item.body}</p>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-slate-100 pt-3 space-y-3">
                      <h3 className="text-[10px] font-black uppercase text-slate-700 tracking-wider">Probar Evento Notificación</h3>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[8px] font-extrabold uppercase text-slate-400 block mb-1">Elegir Evento</label>
                          <select
                            value={testNotificationId}
                            onChange={e => setTestNotificationId(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold"
                          >
                            {pushNotifications.map((p, idx) => (
                              <option key={`adm_push_opt_${p.id || 'p'}_${idx}`} value={p.id}>{p.title}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[8px] font-extrabold uppercase text-slate-400 block mb-1">Destinatario Simulación</label>
                          <select
                            value={testNotificationTarget}
                            onChange={e => setTestNotificationTarget(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold"
                          >
                            <option value="">Autodetectar por Rol</option>
                            {users.map((u, idx) => (
                              <option key={`adm_user_opt_${u.id || u.username}_${idx}`} value={u.id}>{u.fullName} ({u.role})</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <button
                        onClick={handleSendTestPush}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center"
                      >
                        Simular Envío de Alerta Push
                      </button>
                    </div>
                  </div>

                  {/* Database Maintenance and Cleaning */}
                  <div className="md:col-span-2 bg-rose-50/50 border border-rose-100 rounded-3xl p-5 md:p-6 shadow-xs space-y-4">
                    <div className="border-b border-rose-200/60 pb-3 flex items-center gap-2">
                      <Trash2 className="w-4 h-4 text-rose-600" />
                      <div>
                        <h2 className="text-xs font-black text-rose-950 uppercase tracking-wide">Mantenimiento de Base de Datos</h2>
                        <p className="text-[9px] text-rose-500 font-bold uppercase tracking-wider">Elimina registros de prueba y limpia los módulos del sistema</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Clear Projects */}
                      <div className="bg-white border border-rose-100/50 p-4 rounded-2xl flex flex-col justify-between gap-3 shadow-xs">
                        <div>
                          <span className="text-[9px] font-black text-rose-500 uppercase tracking-wider block">Módulo 1: Prospectos / CRM</span>
                          <span className="text-xs font-extrabold text-slate-800 block mt-1">Registros actuales: {solarProjects.length}</span>
                          <span className="text-[8px] text-slate-400 font-bold block mt-0.5">Elimina permanentemente todos los expedientes solares cargados.</span>
                        </div>
                        <button
                          onClick={() => {
                            if (window.confirm('⚠️ ¿Estás COMPLETAMENTE seguro de que deseas eliminar TODOS los prospectos/expedientes de la base de datos? Esta acción es irreversible.')) {
                              solarProjects.forEach(p => {
                                if (onDeleteSolarProject) onDeleteSolarProject(p.id);
                              });
                              showNotification('🗑️ Todos los expedientes solares han sido eliminados.');
                            }
                          }}
                          className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[9px] uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center"
                        >
                          Borrar Todos los Prospectos
                        </button>
                      </div>

                      {/* Clear Users */}
                      <div className="bg-white border border-rose-100/50 p-4 rounded-2xl flex flex-col justify-between gap-3 shadow-xs">
                        <div>
                          <span className="text-[9px] font-black text-rose-500 uppercase tracking-wider block">Módulo 2: Personal / Usuarios</span>
                          <span className="text-xs font-extrabold text-slate-800 block mt-1">Registros actuales: {users.filter(u => u.id !== 'usr_1').length} asesores/partners</span>
                          <span className="text-[8px] text-slate-400 font-bold block mt-0.5">Elimina todos los asesores y partners de prueba, conservando al Administrador.</span>
                        </div>
                        <button
                          onClick={() => {
                            if (window.confirm('⚠️ ¿Estás COMPLETAMENTE seguro de que deseas eliminar todos los usuarios y personal de prueba? Se conservará únicamente el Administrador principal.')) {
                              users.forEach(u => {
                                if (u.id !== 'usr_1' && onDeleteUser) {
                                  onDeleteUser(u.id);
                                }
                              });
                              showNotification('🗑️ Todos los usuarios de prueba han sido eliminados.');
                            }
                          }}
                          className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[9px] uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center"
                        >
                          Borrar Usuarios de Prueba
                        </button>
                      </div>

                      {/* Clean Slate Reset */}
                      <div className="bg-white border border-rose-100/50 p-4 rounded-2xl flex flex-col justify-between gap-3 shadow-xs">
                        <div>
                          <span className="text-[9px] font-black text-rose-600 uppercase tracking-wider block">Limpieza Total del CRM</span>
                          <span className="text-xs font-extrabold text-rose-800 block mt-1">Vaciar CRM por completo</span>
                          <span className="text-[8px] text-slate-400 font-bold block mt-0.5">Reestablece el sistema eliminando todos los datos de muestra de golpe.</span>
                        </div>
                        <button
                          onClick={() => {
                            if (window.confirm('🚨 ¿DESEAS INICIAR EL PROCESO DE VACIADO TOTAL DEL CRM?\n\nSe eliminarán todos los expedientes, materiales, técnicos, servicios e historial de usuarios cargados para dejar el sistema 100% limpio y listo para producción.')) {
                              // Delete projects
                              solarProjects.forEach(p => {
                                if (onDeleteSolarProject) onDeleteSolarProject(p.id);
                              });
                              // Delete users except admin
                              users.forEach(u => {
                                if (u.id !== 'usr_1' && onDeleteUser) onDeleteUser(u.id);
                              });
                              // Delete technicians
                              if (onDeleteTechnician) {
                                technicians.forEach(t => onDeleteTechnician(t.id));
                              }
                              // Delete materials
                              if (onDeleteMaterial) {
                                materials.forEach(m => onDeleteMaterial(m.id));
                              }
                              // Delete services
                              if (onDeleteService) {
                                services.forEach(s => onDeleteService(s.id));
                              }
                              showNotification('🚨 El CRM ha sido limpiado por completo. Listo para tus registros de producción.');
                            }
                          }}
                          className="w-full py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-extrabold text-[9px] uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center"
                        >
                          Limpieza Completa del CRM
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              )}

                  {/* ------------------- MODULE: COSTO DEL PANEL AL DÍA (Sincronización de Cotizadores) ------------------- */}
              {activeTab === 'costo_panel' && (
                <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-8" id="view-costo-panel-modulo">
                  {/* Encabezado y Estado de Sincronización */}
                  <div className="bg-white border border-slate-200 rounded-[2rem] p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden">
                    <div className="space-y-2 relative z-10 max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-1 bg-amber-500/10 text-amber-800 text-[9px] font-black uppercase tracking-wider rounded-lg border border-amber-500/20 flex items-center gap-1.5">
                          <Sun className="w-3.5 h-3.5 text-amber-700" />
                          Módulo Admin • Costo del Panel al Día
                        </span>
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-wider rounded-lg border border-emerald-200 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Sincronización Automática Activa
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                        Ajuste Manual de Costo del Panel Solar
                      </h2>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        Este módulo permite al Administrador actualizar manualmente el costo vigente del panel solar (módulo Tier 1 de 550W con equipo proporcional). <strong className="text-slate-800 font-bold">El costo establecido aquí es la fuente única de la verdad</strong> y sincroniza inmediatamente el <span className="text-emerald-700 font-bold">Cotizador Normal</span> (Expedientes de Prospectos) y el <span className="text-emerald-700 font-bold">Cotizador Exprés</span> (Calculadora Rápida), eliminando discrepancias.
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-emerald-950 text-white p-5 rounded-2xl border border-emerald-500/30 shadow-lg text-center shrink-0 w-full md:w-auto min-w-[220px]">
                      <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 block mb-1">
                        Costo Oficial Vigente
                      </span>
                      <div className="text-3xl font-black text-white font-mono tracking-tight">
                        ${activePanelPrice.toLocaleString('es-MX')}
                        <span className="text-xs text-slate-300 font-sans font-normal ml-1">MXN</span>
                      </div>
                      <span className="text-[9px] text-slate-300 block mt-1 font-sans">
                        Por módulo fotovoltaico (550W)
                      </span>
                    </div>
                  </div>

                  {/* Tarjeta de Edición y Actualización Manual */}
                  <div className="bg-white border border-slate-200 rounded-[2rem] p-6 sm:p-8 shadow-sm space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-wide text-slate-900 flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-emerald-600" />
                          Actualizar Costo Unitario al Día
                        </h3>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                          Introduce el nuevo valor en Pesos Mexicanos (MXN) y haz clic en guardar para propagarlo por todo el sistema.
                        </p>
                      </div>

                      {panelPriceLastUpdated && (
                        <div className="text-[10px] text-slate-400 font-medium bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                          Último guardado: <span className="font-bold text-slate-700">{new Date(panelPriceLastUpdated).toLocaleString('es-MX')}</span>
                        </div>
                      )}
                    </div>

                    {/* Notificación de Éxito al Guardar */}
                    {panelPriceSavedSuccess && (
                      <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-3 text-emerald-900 animate-fade-in shadow-xs">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                          <div>
                            <span className="text-xs font-black uppercase tracking-wide text-emerald-800 block">
                              ¡Costo del Panel Actualizado con Éxito!
                            </span>
                            <span className="text-[11px] text-emerald-700">
                              El valor de <strong>${(lastSavedPrice || activePanelPrice).toLocaleString('es-MX')} MXN</strong> está activo y sincronizado en Cotizador Exprés, Cotizador Normal y Dossiers PDF.
                            </span>
                          </div>
                        </div>
                        <span className="text-[9px] font-black uppercase px-2 py-1 bg-emerald-600 text-white rounded-lg">
                          SINCRONIZADO
                        </span>
                      </div>
                    )}

                    {/* Formulario de Entrada */}
                    <form onSubmit={e => { e.preventDefault(); handleSavePanelPrice(); }} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-2">
                            Precio Base por Panel Solar ($ MXN)
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-base">$</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={panelPriceInput}
                              onChange={e => setPanelPriceInput(e.target.value.replace(/[^0-9]/g, ''))}
                              placeholder="11000"
                              className="w-full pl-9 pr-16 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xl font-black text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none transition-all font-mono"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-400">MXN</span>
                          </div>
                          <span className="text-[10px] text-slate-400 mt-1.5 block">
                            Fórmula aplicada: <code>Inversión = Paneles * Costo Base</code>
                          </span>
                        </div>

                        {/* Botones de Presets Rápidos */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                            Valores Frecuentes / Atajos de Mercado
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {[11000, 12000, 13000, 13500, 14000, 14500, 15000, 16000].map(val => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => {
                                  setPanelPriceInput(String(val));
                                }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                                  Number(panelPriceInput) === val
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                                }`}
                              >
                                ${val.toLocaleString('es-MX')}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Botón Principal de Guardado */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
                          <span>Al guardar, el cambio impactará de inmediato todos los cálculos en tiempo real.</span>
                        </div>

                        <button
                          type="submit"
                          className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          <span>Guardar y Sincronizar Cotizadores</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Estado de Sincronización en Ambos Cotizadores */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Cotizador Exprés
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[8px] font-black uppercase rounded-md">
                          Sincronizado
                        </span>
                      </div>
                      <div className="text-lg font-black text-slate-900 font-mono">
                        ${activePanelPrice.toLocaleString('es-MX')} <span className="text-[10px] text-slate-400 font-sans">/ panel</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        Calculadora rápida en pestaña "Cotizador Exprés" del Asesor Comercial y enlaces.
                      </p>
                    </div>

                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Cotizador Normal
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[8px] font-black uppercase rounded-md">
                          Sincronizado
                        </span>
                      </div>
                      <div className="text-lg font-black text-slate-900 font-mono">
                        ${activePanelPrice.toLocaleString('es-MX')} <span className="text-[10px] text-slate-400 font-sans">/ panel</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        Formulario oficial de "Registrar Prospecto" y edición de expedientes en CRM.
                      </p>
                    </div>

                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Expedientes & PDF
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[8px] font-black uppercase rounded-md">
                          Sincronizado
                        </span>
                      </div>
                      <div className="text-lg font-black text-slate-900 font-mono">
                        ${activePanelPrice.toLocaleString('es-MX')} <span className="text-[10px] text-slate-400 font-sans">/ panel</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        Ficha técnica imprimible en PDF, corridas financieras de 12 MSI y Contado.
                      </p>
                    </div>
                  </div>

                  {/* Tabla de Simulación de Impacto en Vivo */}
                  <div className="bg-white border border-slate-200 rounded-[2rem] p-6 sm:p-8 shadow-sm space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wide text-slate-900 flex items-center gap-2">
                          <Zap className="w-4 h-4 text-amber-500" />
                          Simulador de Impacto en Vivo (Verificación Inmediata)
                        </h3>
                        <p className="text-[10px] text-slate-400 font-medium">
                          Así es exactamente como ambos cotizadores calcularán las propuestas solares con el costo de ${activePanelPrice.toLocaleString('es-MX')} MXN:
                        </p>
                      </div>
                      <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
                        Tier 1 • 550W Monocristalino
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                            <th className="py-2.5 px-3">Recibo CFE Bimestral</th>
                            <th className="py-2.5 px-3">Paneles (550W)</th>
                            <th className="py-2.5 px-3">Potencia kWp</th>
                            <th className="py-2.5 px-3">Inversión Base Oficial</th>
                            <th className="py-2.5 px-3">Pago Contado (-5%)</th>
                            <th className="py-2.5 px-3">Enganche 50%</th>
                            <th className="py-2.5 px-3">12 MSI / mes</th>
                            <th className="py-2.5 px-3 text-emerald-700">Ahorro Anual Aprox.</th>
                            <th className="py-2.5 px-3">Retorno Estimado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {[
                            { bill: 1000, panels: 2 },
                            { bill: 2000, panels: 4 },
                            { bill: 3000, panels: 6 },
                            { bill: 4000, panels: 8 },
                            { bill: 5000, panels: 10 },
                            { bill: 6000, panels: 12 },
                            { bill: 8000, panels: 16 },
                            { bill: 10000, panels: 20 },
                          ].map(row => {
                            const inv = row.panels * activePanelPrice;
                            const contado = Math.round(inv * 0.95);
                            const down = Math.round(inv * 0.50);
                            const msi = Math.round(inv / 12);
                            const annualSav = Math.round(row.bill * 6 * 0.90);
                            const roi = annualSav > 0 ? (contado / annualSav).toFixed(1) : 'N/A';

                            return (
                              <tr key={row.bill} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-2.5 px-3 font-bold text-slate-900">${row.bill.toLocaleString('es-MX')} MXN</td>
                                <td className="py-2.5 px-3 font-black text-emerald-600">{row.panels} paneles</td>
                                <td className="py-2.5 px-3 text-slate-600 font-mono">{((row.panels * 550) / 1000).toFixed(2)} kWp</td>
                                <td className="py-2.5 px-3 font-black text-slate-900 font-mono">${inv.toLocaleString('es-MX')}</td>
                                <td className="py-2.5 px-3 font-bold text-emerald-700 font-mono">${contado.toLocaleString('es-MX')}</td>
                                <td className="py-2.5 px-3 font-mono text-amber-700">${down.toLocaleString('es-MX')}</td>
                                <td className="py-2.5 px-3 font-mono text-indigo-700">${msi.toLocaleString('es-MX')}/mes</td>
                                <td className="py-2.5 px-3 font-bold text-emerald-700 font-mono">~${annualSav.toLocaleString('es-MX')}/año</td>
                                <td className="py-2.5 px-3 font-mono text-slate-700">{roi} años</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Resumen de Fórmulas y Reglas de Negocio Solux Green */}
                  <div className="bg-slate-900 text-white rounded-[2rem] p-6 sm:p-8 space-y-4 border border-slate-800">
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                        Fórmulas Oficiales del Sistema (Garantía de Sincronización)
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50 space-y-2">
                        <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">
                          1. Dimensionamiento de Paneles
                        </span>
                        <code className="text-emerald-400 font-mono text-xs block bg-black/40 p-2 rounded-lg">
                          Paneles = (Monto CFE / 1,000) * 2
                        </code>
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                          Si la parte decimal es ≥ 0.1, se redondea al entero superior para asegurar la cobertura energética del cliente. Mínimo 1 panel.
                        </p>
                      </div>

                      <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50 space-y-2">
                        <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">
                          2. Cálculo de Inversión y Formas de Pago
                        </span>
                        <code className="text-emerald-400 font-mono text-xs block bg-black/40 p-2 rounded-lg">
                          Inversión = Paneles * Costo Base ({activePanelPrice.toLocaleString('es-MX')} MXN)
                        </code>
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                          Pago de Contado aplica 5% de descuento directo. 12 MSI divide la inversión neta entre 12 meses sin recargo.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------- MODULE 4: ADMIN LANDINGPAGE (Reactivated Hub) ------------------- */}
              {activeTab === 'landingpage' && (
                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 md:p-10 shadow-sm space-y-6" id="view-admin-landingpage">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                        <Layers className="w-7 h-7" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                            Gestión de la Landing Page Oficial
                          </h2>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-extrabold text-[10px] uppercase tracking-wider">
                            100% Activo
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Administra el carrusel de fotografías, títulos, subtítulos, botones, fondos, tipografías y datos de contacto oficiales.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {onChangeRole && (
                        <button
                          onClick={() => onChangeRole('landingpage')}
                          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
                        >
                          <Eye className="w-4 h-4 text-emerald-600" />
                          <span>Ver Landing Pública</span>
                        </button>
                      )}

                      {onChangeRole && (
                        <button
                          onClick={() => onChangeRole('landingadmin')}
                          className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer active:scale-95"
                        >
                          <SlidersHorizontal className="w-4 h-4" />
                          <span>Abrir Editor Completo (CMS)</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* --- CONTROL INDEPENDIENTE DE LOS BOTONES DE LAS 3 IMÁGENES DEL SLIDER --- */}
                  <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-3xl p-6 sm:p-8 space-y-6 text-white shadow-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                      <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider mb-1.5 border border-emerald-500/30">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Control Total e Independiente</span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-black uppercase text-white tracking-tight flex items-center gap-2">
                          <span>Botones de las 3 Imágenes del Slider Hero</span>
                        </h3>
                        <p className="text-xs text-slate-300 font-medium">
                          Modifica aquí de forma independiente el texto, enlace de destino (WhatsApp o formulario) y colores de cada botón.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleSaveDashSlides}
                        disabled={savingDashSlides}
                        className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all cursor-pointer shrink-0 ${
                          saveDashSlidesSuccess 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95'
                        }`}
                      >
                        {savingDashSlides ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : saveDashSlidesSuccess ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        <span>{savingDashSlides ? 'Guardando...' : saveDashSlidesSuccess ? '¡Guardado con Éxito!' : 'Guardar Cambios de Botones'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                      {[0, 1, 2].map((slideIndex) => {
                        const s = dashSlides[slideIndex] || {
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
                            key={`dash_btn_ctrl_${slideIndex}`}
                            className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3.5 relative flex flex-col justify-between"
                          >
                            <div className="space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-mono font-bold">
                                    {slideIndex + 1}
                                  </span>
                                  <span>Botón Imagen #{slideIndex + 1}</span>
                                </span>

                                <span className="text-[9px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-bold">
                                  {slideIndex === 2 ? 'Asesor de Enlace' : slideIndex === 1 ? 'Comercial' : 'Residencial'}
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
                                  onChange={(e) => handleUpdateDashSlide(slideIndex, { ctaText: e.target.value })}
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
                                  onChange={(e) => handleUpdateDashSlide(slideIndex, { ctaLink: e.target.value })}
                                  placeholder="#contacto o URL"
                                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                                />

                                {/* Botones de Selección Rápida de Enlace */}
                                <div className="flex flex-wrap gap-1 pt-1">
                                  {[
                                    { label: 'WhatsApp Asesor Enlace', url: 'https://wa.me/5212293233633?text=Hola%20Solux%20Green,%20quiero%20ser%20Asesor%20de%20Enlace%20y%20solicito%20informes' },
                                    { label: '#contacto (Formulario)', url: '#contacto' },
                                    { label: 'WhatsApp Cotizar Negocio', url: 'https://wa.me/5212293233633?text=Hola%20Solux%20Green,%20quiero%20cotizar%20para%20mi%20empresa' },
                                    { label: 'WhatsApp Cotizar Hogar', url: 'https://wa.me/5212293233633?text=Hola%20Solux%20Green,%20quiero%20cotizar%20un%20sistema%20de%20paneles%20solares' }
                                  ].map(preset => (
                                    <button
                                      key={preset.url}
                                      type="button"
                                      onClick={() => handleUpdateDashSlide(slideIndex, { ctaLink: preset.url })}
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
                                      onChange={(e) => handleUpdateDashSlide(slideIndex, { ctaBgColor: e.target.value })}
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
                                      onChange={(e) => handleUpdateDashSlide(slideIndex, { ctaTextColor: e.target.value })}
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

                  {/* Summary / Fast Cards */}
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Carrusel Principal</span>
                      <h4 className="text-base font-black text-slate-900">Slider & Fotografía</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Sube imágenes en alta definición a Supabase Storage, añade nuevos slides, personaliza botones y textos.
                      </p>
                      {onChangeRole && (
                        <button
                          onClick={() => onChangeRole('landingadmin')}
                          className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 pt-1 cursor-pointer"
                        >
                          <span>Administrar Diapositivas</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Diseño & Tipografía</span>
                      <h4 className="text-base font-black text-slate-900">Colores, Fondos & Alineación</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Cambia colores de botones, fondos claros u oscuros por sección, fuentes tipográficas y justificado de textos.
                      </p>
                      {onChangeRole && (
                        <button
                          onClick={() => onChangeRole('landingadmin')}
                          className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 pt-1 cursor-pointer"
                        >
                          <span>Personalizar Estilos</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Contacto & Canales</span>
                      <h4 className="text-base font-black text-slate-900">Teléfonos, Correos & Ubicación</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Gestiona múltiples teléfonos de atención con WhatsApp directo, correos corporativos y dirección en Google Maps.
                      </p>
                      {onChangeRole && (
                        <button
                          onClick={() => onChangeRole('landingadmin')}
                          className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 pt-1 cursor-pointer"
                        >
                          <span>Actualizar Contacto</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Direct Action Banner */}
                  <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl text-white flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 text-center sm:text-left">
                      <h4 className="text-base font-black text-white">¿Deseas editar el contenido de la landing page ahora?</h4>
                      <p className="text-xs text-slate-300">
                        Puedes modificar cualquier sección de forma visual y guardar en Supabase en un solo clic.
                      </p>
                    </div>

                    {onChangeRole && (
                      <button
                        onClick={() => onChangeRole('landingadmin')}
                        className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer whitespace-nowrap"
                      >
                        Abrir Gestor CMS Completo
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ------------------- PROMOTIONAL MATERIALS MODULE ------------------- */}
              {activeTab === 'promocionales' && (
                <PromotionalMaterialsModule 
                  currentUser={currentUser}
                  solarProjects={solarProjects}
                  isOfflineMode={isOfflineMode}
                  onNotification={showNotification}
                />
              )}

              {/* ------------------- MODULE 5: USER PROFILE ------------------- */}
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
                  role="admin"
                  currentUser={currentUser}
                  onMarkAsRead={onMarkNotificationAsRead}
                  onMarkAllAsRead={onMarkAllNotificationsAsRead}
                  onClearAllNotifications={onClearAllNotifications}
                  onDeleteNotification={onDeleteNotification}
                />
              )}

              {/* ------------------- MODULE 6: ROLES SIMULATION & NAVIGATION ------------------- */}
              {activeTab === 'roles' && (
                <div className="space-y-6 animate-fade-in" id="admin-view-roles">
                  <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-[2rem] shadow-xs">
                    <div className="max-w-2xl">
                      <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">Centro de Control de Simulación</span>
                      <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight mt-1">Navegación e Interconexión de Roles</h2>
                      <p className="text-xs text-slate-500 font-bold mt-2 leading-relaxed">
                        Como Administrador General de Solux Green, tienes la facultad de simular y operar directamente las interfaces de cualquiera de los roles del sistema. Cambia de rol al instante para visualizar, capturar datos o aprobar levantamientos técnicos.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Admin General Card */}
                    <div className="bg-white border border-slate-200 rounded-[2rem] p-6 flex flex-col justify-between shadow-xs transition-all hover:border-violet-300 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-violet-50 rounded-bl-full -z-10 flex items-center justify-center">
                        <Crown className="w-8 h-8 text-violet-400 opacity-20" />
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600">
                            <Crown className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">Administrador General</h3>
                            <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-violet-100 text-violet-700 border border-violet-200">Rol Principal</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                          Acceso total al pipeline del CRM, finanzas globales, tasas de interés, costo base de paneles solares, control de usuarios y configuración integral de avisos.
                        </p>
                      </div>
                      <div className="mt-6">
                        <button
                          disabled={activeRole === 'admin'}
                          onClick={() => onChangeRole?.('admin')}
                          className={`w-full py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all duration-150 cursor-pointer text-center ${
                            activeRole === 'admin'
                              ? 'bg-violet-50 text-violet-600 border border-violet-200 font-black cursor-not-allowed'
                              : 'bg-slate-900 hover:bg-violet-600 text-white shadow-md'
                          }`}
                        >
                          {activeRole === 'admin' ? '✓ Estás en esta Vista' : 'Acceder al Panel Admin'}
                        </button>
                      </div>
                    </div>

                    {/* Asesor Verde Card */}
                    <div className="bg-white border border-slate-200 rounded-[2rem] p-6 flex flex-col justify-between shadow-xs transition-all hover:border-orange-300 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-full -z-10 flex items-center justify-center">
                        <TrendingUp className="w-8 h-8 text-orange-400 opacity-20" />
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                            <TrendingUp className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">Asesor Verde</h3>
                            <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-orange-100 text-orange-700 border border-orange-200">Simulación</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                          Captura nuevos prospectos, utiliza el cotizador solar en tiempo real con amortizaciones y solicita visitas de levantamiento técnico físico al partner.
                        </p>
                      </div>
                      <div className="mt-6">
                        <button
                          onClick={() => onChangeRole?.('comercial')}
                          className={`w-full py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all duration-150 cursor-pointer text-center ${
                            activeRole === 'comercial'
                              ? 'bg-orange-50 text-orange-600 border border-orange-200 font-black'
                              : 'bg-slate-900 hover:bg-orange-600 text-white shadow-md'
                          }`}
                        >
                          {activeRole === 'comercial' ? '✓ Simulación Activa' : 'Simular Asesor Verde'}
                        </button>
                      </div>
                    </div>

                    {/* Partner de Instalación Card */}
                    <div className="bg-white border border-slate-200 rounded-[2rem] p-6 flex flex-col justify-between shadow-xs transition-all hover:border-emerald-300 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-10 flex items-center justify-center">
                        <Wrench className="w-8 h-8 text-emerald-400 opacity-20" />
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                            <Wrench className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">Partner de Instalación</h3>
                            <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-emerald-100 text-emerald-700 border border-emerald-200">Simulación</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                          Consulta los levantamientos técnicos físicos asignados, sube fotos de la azotea, medidor CFE, aprueba viabilidad y detalla costos reales de obra.
                        </p>
                      </div>
                      <div className="mt-6">
                        <button
                          onClick={() => onChangeRole?.('tech')}
                          className={`w-full py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all duration-150 cursor-pointer text-center ${
                            activeRole === 'tech'
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 font-black'
                              : 'bg-slate-900 hover:bg-emerald-600 text-white shadow-md'
                          }`}
                        >
                          {activeRole === 'tech' ? '✓ Simulación Activa' : 'Simular Partner Técnico'}
                        </button>
                      </div>
                    </div>

                    {/* Asesor de Enlace Card */}
                    <div className="bg-white border border-slate-200 rounded-[2rem] p-6 flex flex-col justify-between shadow-xs transition-all hover:border-pink-300 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-pink-50 rounded-bl-full -z-10 flex items-center justify-center">
                        <Handshake className="w-8 h-8 text-pink-400 opacity-20" />
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-600">
                            <Handshake className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">Asesor Enlace</h3>
                            <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-pink-100 text-pink-700 border border-pink-200">Simulación</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                          Registra de forma veloz contactos referidos con su recibo de luz y visualiza el monedero digital donde se reflejan los $1,000 MXN de comisión.
                        </p>
                      </div>
                      <div className="mt-6">
                        <button
                          onClick={() => onChangeRole?.('enlace')}
                          className={`w-full py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all duration-150 cursor-pointer text-center ${
                            activeRole === 'enlace'
                              ? 'bg-pink-50 text-pink-600 border border-pink-200 font-black'
                              : 'bg-slate-900 hover:bg-pink-600 text-white shadow-md'
                          }`}
                        >
                          {activeRole === 'enlace' ? '✓ Simulación Activa' : 'Simular Asesor Enlace'}
                        </button>
                      </div>
                    </div>

                    {/* Cliente Final Card */}
                    <div className="bg-white border border-slate-200 rounded-[2rem] p-6 flex flex-col justify-between shadow-xs transition-all hover:border-sky-300 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-sky-50 rounded-bl-full -z-10 flex items-center justify-center">
                        <User className="w-8 h-8 text-sky-400 opacity-20" />
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">Cliente Final Solar</h3>
                            <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-sky-100 text-sky-700 border border-sky-200">Simulación</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                          La vista que recibirá el usuario final: visualiza el ahorro energético acumulado en gráficos, los estados de trámite CFE y descarga sus contratos.
                        </p>
                      </div>
                      <div className="mt-6">
                        <button
                          onClick={() => onChangeRole?.('client')}
                          className={`w-full py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all duration-150 cursor-pointer text-center ${
                            activeRole === 'client'
                              ? 'bg-sky-50 text-sky-600 border border-sky-200 font-black'
                              : 'bg-slate-900 hover:bg-sky-600 text-white shadow-md'
                          }`}
                        >
                          {activeRole === 'client' ? '✓ Simulación Activa' : 'Simular Cliente Final'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </main>

        {/* 2. BOTTOM NAVIGATION BAR - TABLET AND MOBILE */}
        <nav className="lg:hidden bg-slate-900 border-t border-slate-800 px-3 py-2.5 flex items-center justify-around shrink-0 relative z-20 shadow-lg">
          <button
            onClick={() => {
              setActiveTab('crm');
              if (activeSubTab === 'nuevo') {
                setActiveSubTab('pipeline');
              }
            }}
            className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-all cursor-pointer relative ${activeTab === 'crm' && activeSubTab !== 'nuevo' ? 'text-[#10B981]' : 'text-slate-400'}`}
          >
            <div className="relative">
              <Activity className="w-5 h-5" />
              <span className="absolute -top-1.5 -right-2 px-1 py-0.2 bg-emerald-600 text-white text-[8px] font-black rounded-full leading-tight">
                {solarProjects.length}
              </span>
            </div>
            <span className="text-[8px] font-extrabold uppercase tracking-wider">CRM</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('crm');
              setActiveSubTab('nuevo');
            }}
            className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-all cursor-pointer ${activeTab === 'crm' && activeSubTab === 'nuevo' ? 'text-[#10B981]' : 'text-slate-400'}`}
          >
            <Plus className="w-5 h-5" />
            <span className="text-[8px] font-extrabold uppercase tracking-wider">Registrar</span>
          </button>
          
          <button
            onClick={() => setActiveTab('usuarios')}
            className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-all cursor-pointer relative ${activeTab === 'usuarios' ? 'text-[#10B981]' : 'text-slate-400'}`}
          >
            <div className="relative">
              <Users className="w-5 h-5" />
              <span className="absolute -top-1.5 -right-2 px-1 py-0.2 bg-emerald-600 text-white text-[8px] font-black rounded-full leading-tight">
                {users.length}
              </span>
            </div>
            <span className="text-[8px] font-extrabold uppercase tracking-wider">Personal</span>
          </button>

          <button
            onClick={() => setActiveTab('perfil')}
            className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-all cursor-pointer ${activeTab === 'perfil' ? 'text-[#10B981]' : 'text-slate-400'}`}
          >
            <User className="w-5 h-5" />
            <span className="text-[8px] font-extrabold uppercase tracking-wider">Perfil</span>
          </button>

          <button
            onClick={() => setActiveTab('roles')}
            className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-all cursor-pointer ${activeTab === 'roles' ? 'text-[#10B981]' : 'text-slate-400'}`}
          >
            <Shield className="w-5 h-5" />
            <span className="text-[8px] font-extrabold uppercase tracking-wider">Roles</span>
          </button>

          <button
            onClick={() => setActiveTab('costo_panel')}
            className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-all cursor-pointer ${activeTab === 'costo_panel' ? 'text-[#10B981]' : 'text-slate-400'}`}
          >
            <Sun className="w-5 h-5 text-amber-400" />
            <span className="text-[8px] font-extrabold uppercase tracking-wider">Costo</span>
          </button>

          <button
            onClick={() => setActiveTab('configuracion')}
            className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-all cursor-pointer ${activeTab === 'configuracion' ? 'text-[#10B981]' : 'text-slate-400'}`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[8px] font-extrabold uppercase tracking-wider">Config</span>
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

      {/* ------------------- EXPEDIENTE DIGITAL DETAILS MODAL ------------------- */}
      <AnimatePresence>
        {selectedProject && (() => {
          const clientCreds = getClientCredentials(selectedProject, users);
          const matchedUser = clientCreds.user;
          const activeCredsForExport = matchedUser || { username: clientCreds.username, password: clientCreds.password, fullName: selectedProject.clientName };
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col relative"
              >
                {/* Modal Header */}
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
                      onClick={() => handleOpenEditProject(selectedProject)}
                      className="px-2.5 py-1.5 bg-[#10B981] hover:bg-[#059669] text-white text-[9px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                    >
                      ✍️ Editar Datos / Acceso
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

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
                
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

                {/* Registrant Employee Block for Admin Control */}
                {(() => {
                  const creator = users.find(u => u.id === selectedProject.createdBy || u.fullName === selectedProject.advisorName);
                  const advName = selectedProject.advisorName || creator?.fullName || 'Administración / Solux Green';
                  const advRole = selectedProject.createdByRole || creator?.role || 'comercial';
                  const advPhone = selectedProject.advisorPhone || creator?.whatsapp || creator?.phone || 'Sin registrado';
                  return (
                    <div className="bg-indigo-50/60 border border-indigo-100 rounded-[1.5rem] p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-base font-black shrink-0 shadow-xs">
                          👤
                        </div>
                        <div>
                          <span className="text-[8px] font-black uppercase tracking-wider text-indigo-500 block">Empleado / Registrador del Prospecto</span>
                          <h5 className="text-xs font-black text-indigo-950 uppercase">{advName}</h5>
                          <p className="text-[9px] text-slate-500 font-bold mt-0.5">
                            Rol: <span className="text-indigo-700 font-black uppercase">{advRole}</span> • Teléfono: <span className="font-mono text-slate-800">{advPhone}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[8px] font-sans font-extrabold text-slate-400 uppercase block">Fecha de Registro</span>
                        <span className="font-mono text-xs font-extrabold text-slate-800">{selectedProject.createdDate || 'Hoy'}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Status and Partner assignment header */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs">
                  
                  {/* Status update */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Modificar Estatus CRM</label>
                    <select
                      value={selectedProject.status}
                      onChange={e => {
                        onUpdateSolarProject(selectedProject.id, { status: e.target.value });
                        setSelectedProject(prev => prev ? { ...prev, status: e.target.value } : null);
                        showNotification('Estatus del prospecto modificado con éxito.');
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                    >
                      {pipelineStages.map((s, idx) => (
                        <option key={`adm_pipe_stg_${s.id || 's'}_${idx}`} value={s.id}>{s.label.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>

                  {/* Partner Assignment */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Socio Partner de Instalación</label>
                    <select
                      value={selectedProject.assignedPartnerId || ''}
                      onChange={e => {
                        onUpdateSolarProject(selectedProject.id, { assignedPartnerId: e.target.value || undefined });
                        setSelectedProject(prev => prev ? { ...prev, assignedPartnerId: e.target.value || undefined } : null);
                        showNotification('Partner de instalaciones asignado correctamente.');
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                    >
                      <option value="">Elegir Partner...</option>
                      {partnerUsers.map((p, idx) => (
                        <option key={`adm_partner_opt_${p.id || 'p'}_${idx}`} value={p.id}>{p.fullName}</option>
                      ))}
                    </select>
                  </div>

                  {/* Referido por selector */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Referido por:</label>
                    <select
                      value={selectedProject.referrerCode || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedProject(prev => prev ? { ...prev, referrerCode: val || undefined } : null);
                        if (onUpdateSolarProject) {
                          onUpdateSolarProject(selectedProject.id, { referrerCode: val || undefined });
                        }
                        showNotification('Referido por actualizado correctamente.');
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                    >
                      <option value="">Ninguno (Registro Directo)</option>
                      <optgroup label="👥 Empleados Solux Green">
                        {(users || []).filter(u => u.role === 'admin' || u.role === 'comercial' || u.role === 'enlace').map((emp, idx) => (
                          <option key={`edit_emp_${emp.id || 'e'}_${idx}`} value={emp.fullName || emp.username}>
                            {emp.fullName || emp.username} ({emp.role === 'admin' ? 'Admin' : emp.role === 'comercial' ? 'Asesor Verde' : 'Asesor Enlace'})
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="🤝 Socios Partners de Instalación">
                        {(users || []).filter(u => u.role === 'partner').map((p, idx) => (
                          <option key={`edit_partner_${p.id || 'p'}_${idx}`} value={p.fullName || p.username}>
                            {p.fullName || p.username} (Socio Partner)
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  {/* Asesor Verde / Registrador selector */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-emerald-700 block">Asesor Verde Asignado:</label>
                    <select
                      value={users?.find(u => u.id === selectedProject.createdBy || u.fullName === selectedProject.advisorName)?.id || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const found = users?.find(u => u.id === val);
                        if (found) {
                          const advName = found.fullName || found.username;
                          const advPhone = found.whatsapp || found.phone || '';
                          const updateObj = {
                            createdBy: found.id,
                            createdByRole: found.role,
                            advisorName: advName,
                            advisorPhone: advPhone,
                            assignedCommercialId: found.id
                          };
                          setSelectedProject(prev => prev ? { ...prev, ...updateObj } : null);
                          if (onUpdateSolarProject) {
                            onUpdateSolarProject(selectedProject.id, updateObj);
                          }
                          showNotification('Asesor Verde actualizado correctamente.');
                        }
                      }}
                      className="w-full px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                    >
                      <option value="">Seleccionar Asesor Verde...</option>
                      {(users || []).filter(u => u.role === 'admin' || u.role === 'comercial').map((emp, idx) => (
                        <option key={`adm_verde_opt_${emp.id || 'emp'}_${idx}`} value={emp.id}>
                          {emp.fullName || emp.username} ({emp.role === 'admin' ? 'Admin' : 'Asesor Verde'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Grid for General Info vs simulations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Left Column: Client contact & electric details (Requirement 8) */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-slate-900 tracking-wider border-b pb-1.5 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-600" />
                      Ficha de Contacto y Datos Eléctricos
                    </h4>

                    <div className="grid grid-cols-2 gap-3.5 text-[11px]">
                      <div>
                        <span className="text-[8px] font-extrabold uppercase text-slate-400 block">Teléfono Móvil</span>
                        <a href={`tel:${selectedProject.clientPhone}`} className="font-bold text-slate-800 hover:underline inline-flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" /> {selectedProject.clientPhone}
                        </a>
                      </div>
                      <div>
                        <span className="text-[8px] font-extrabold uppercase text-slate-400 block">WhatsApp direct</span>
                        <a href={`https://wa.me/${formatWhatsAppPhone(selectedProject.clientPhone)}`} target="_blank" rel="noopener noreferrer" className="font-bold text-emerald-600 hover:underline inline-flex items-center gap-1">
                          <Smartphone className="w-3 h-3 text-emerald-500" /> Chatear
                        </a>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[8px] font-extrabold uppercase text-slate-400 block">Correo Electrónico</span>
                        <span className="font-bold text-slate-800 inline-flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" /> {selectedProject.clientEmail || 'Sin registrar'}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[8px] font-extrabold uppercase text-slate-400 block">Ubicación Google Maps</span>
                        {selectedProject.googleMapsUrl ? (
                          <div className="space-y-1">
                            <a href={selectedProject.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-blue-600 hover:underline inline-flex items-center gap-1 break-all">
                              <MapPin className="w-3 h-3 text-blue-500" /> {selectedProject.googleMapsUrl}
                            </a>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic font-bold">No proporcionada por el asesor</span>
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
                        <span className="font-bold text-slate-800 uppercase">
                          {selectedProject.cfeStatus === 'activo_sin_adeudo' ? 'Activo sin Adeudo' : selectedProject.cfeStatus === 'con_adeudo' ? 'Con Adeudo' : 'Inactivo / Nuevo Contrato'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[8px] font-extrabold uppercase text-slate-400 block">Validación de Propiedad</span>
                        <span className="font-bold text-slate-800 uppercase">
                          {selectedProject.propertyOwnership === 'propietario' ? 'Propietario' : 'Arrendatario Autorizado'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-2 text-[11px]">
                      <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 block">Diagnóstico Eléctrico Preliminar</span>
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                        <div>
                          <span className="text-slate-400 font-sans block text-[8px] uppercase">Número de Hilos</span>
                          <span className="font-extrabold text-slate-700">{selectedProject.wiresCount || 2} hilos</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-sans block text-[8px] uppercase">Forma de Pago</span>
                          <span className="font-extrabold text-slate-800">{formatPaymentMethod(selectedProject.paymentMethodDesired)}</span>
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
                        <div className="col-span-2">
                          <span className="text-slate-400 font-sans block text-[8px] uppercase">Cargas Eléctricas Deseadas</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedProject.electricalLoadType && selectedProject.electricalLoadType.length > 0 ? (
                              selectedProject.electricalLoadType.map((load, idx) => (
                                <span key={`adm_load_${load}_${idx}`} className="bg-slate-200 text-slate-700 font-sans font-extrabold px-1.5 py-0.5 rounded text-[8px]">
                                  {load}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400 italic">110V Regular</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Financial Simulations / Partners (Requirement 2.2) */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-slate-900 tracking-wider border-b pb-1.5 flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-indigo-600" />
                      Simulaciones de Crédito en Expediente
                    </h4>

                    <div className="space-y-2 text-[11px]">
                      {selectedProject.savedSimulations && selectedProject.savedSimulations.length > 0 ? (
                        selectedProject.savedSimulations.map((sim, index) => (
                          <div key={`adm_sim_${sim.id || 'sim'}_${index}`} className="bg-indigo-50/50 border border-indigo-100/80 p-3 rounded-2xl flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[8px] bg-indigo-600 text-white font-black px-1.5 py-0.2 rounded">Simulación {index + 1}</span>
                                <span className="font-black text-indigo-950 uppercase">{sim.financialPartner}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 font-bold">
                                Monto: <span className="font-mono">${sim.amount.toLocaleString('es-MX')}</span> • Plazo: <span className="font-mono">{sim.months} meses</span>
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
                        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-center text-slate-400 italic">
                          No se han guardado simulaciones formales de financiamiento aún para este prospecto.
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-[11px] space-y-1.5">
                      <span className="text-[8px] font-black uppercase text-slate-400 block tracking-wider">Viabilidad Técnica Realizada por el Partner</span>
                      {selectedProject.siteSurveyData ? (
                        <div className="space-y-1 font-bold text-slate-700 text-[10px]">
                          <div>• Sin sombras obstruyendo: <span className="text-emerald-600">{selectedProject.siteSurveyData.noShadows ? 'SÍ' : 'NO'}</span></div>
                          <div>• Estado de la loza: <span className="text-slate-900 uppercase font-mono">{selectedProject.siteSurveyData.roofCondition}</span></div>
                          <div>• Distancia al medidor: <span className="text-slate-900 font-mono">{selectedProject.siteSurveyData.wiringDistance} metros</span></div>
                          {selectedProject.siteSurveyData.surveyorNotes && (
                            <div className="mt-1.5 bg-white border p-2 rounded-xl text-slate-500 italic font-normal">
                              Notas: "{selectedProject.siteSurveyData.surveyorNotes}"
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-slate-400 italic font-medium">El levantamiento físico no ha sido dictaminado por el Partner asignado aún.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Multimedia Evidence files (Requirement 8) */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-[10px] font-black uppercase text-slate-900 tracking-wider border-b pb-1.5 flex items-center gap-1.5">
                    <Image className="w-3.5 h-3.5 text-blue-600" />
                    Expediente Multimedia del Cliente (Evidencia)
                  </h4>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    {/* CFE Front */}
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl space-y-2">
                      <span className="text-[8px] font-extrabold text-slate-500 uppercase block">Recibo CFE Frente</span>
                      <div 
                        onClick={() => selectedProject?.evidence?.cfeReceiptFront && isRealImage(selectedProject.evidence.cfeReceiptFront) && (setZoomedImage(selectedProject.evidence.cfeReceiptFront), setZoomedTitle('Recibo CFE Frente'))}
                        className={`w-full h-24 bg-slate-200 rounded-xl overflow-hidden flex items-center justify-center relative group ${selectedProject?.evidence?.cfeReceiptFront && isRealImage(selectedProject.evidence.cfeReceiptFront) ? 'cursor-pointer' : ''}`}
                      >
                        {selectedProject?.evidence?.cfeReceiptFront && isRealImage(selectedProject.evidence.cfeReceiptFront) ? (
                          <>
                            <img src={selectedProject.evidence.cfeReceiptFront} alt="Recibo" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-[9px] font-black uppercase text-white tracking-widest bg-slate-900/70 px-2.5 py-1 rounded-lg">Zoom 🔍</span>
                            </div>
                          </>
                        ) : (
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Sin archivo</div>
                        )}
                      </div>
                    </div>

                    {/* CFE Back */}
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl space-y-2">
                      <span className="text-[8px] font-extrabold text-slate-500 uppercase block">Recibo CFE Reverso</span>
                      <div 
                        onClick={() => selectedProject?.evidence?.cfeReceiptBack && isRealImage(selectedProject.evidence.cfeReceiptBack) && (setZoomedImage(selectedProject.evidence.cfeReceiptBack), setZoomedTitle('Recibo CFE Reverso'))}
                        className={`w-full h-24 bg-slate-200 rounded-xl overflow-hidden flex items-center justify-center relative group ${selectedProject?.evidence?.cfeReceiptBack && isRealImage(selectedProject.evidence.cfeReceiptBack) ? 'cursor-pointer' : ''}`}
                      >
                        {selectedProject?.evidence?.cfeReceiptBack && isRealImage(selectedProject.evidence.cfeReceiptBack) ? (
                          <>
                            <img src={selectedProject.evidence.cfeReceiptBack} alt="Recibo" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-[9px] font-black uppercase text-white tracking-widest bg-slate-900/70 px-2.5 py-1 rounded-lg">Zoom 🔍</span>
                            </div>
                          </>
                        ) : (
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Sin archivo</div>
                        )}
                      </div>
                    </div>

                    {/* Facade */}
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl space-y-2">
                      <span className="text-[8px] font-extrabold text-slate-500 uppercase block">Fachada del Domicilio</span>
                      <div 
                        onClick={() => selectedProject?.evidence?.facade && isRealImage(selectedProject.evidence.facade) && (setZoomedImage(selectedProject.evidence.facade), setZoomedTitle('Fachada del Domicilio'))}
                        className={`w-full h-24 bg-slate-200 rounded-xl overflow-hidden flex items-center justify-center relative group ${selectedProject?.evidence?.facade && isRealImage(selectedProject.evidence.facade) ? 'cursor-pointer' : ''}`}
                      >
                        {selectedProject?.evidence?.facade && isRealImage(selectedProject.evidence.facade) ? (
                          <>
                            <img src={selectedProject.evidence.facade} alt="Fachada" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-[9px] font-black uppercase text-white tracking-widest bg-slate-900/70 px-2.5 py-1 rounded-lg">Zoom 🔍</span>
                            </div>
                          </>
                        ) : (
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Sin archivo</div>
                        )}
                      </div>
                    </div>

                    {/* Roof angle or installation area */}
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl space-y-2">
                      <span className="text-[8px] font-extrabold text-slate-500 uppercase block">Área de Instalación</span>
                      <div 
                        onClick={() => selectedProject?.evidence?.installationAreaPhoto && isRealImage(selectedProject.evidence.installationAreaPhoto) && (setZoomedImage(selectedProject.evidence.installationAreaPhoto), setZoomedTitle('Área de Instalación'))}
                        className={`w-full h-24 bg-slate-200 rounded-xl overflow-hidden flex items-center justify-center relative group ${selectedProject?.evidence?.installationAreaPhoto && isRealImage(selectedProject.evidence.installationAreaPhoto) ? 'cursor-pointer' : ''}`}
                      >
                        {selectedProject?.evidence?.installationAreaPhoto && isRealImage(selectedProject.evidence.installationAreaPhoto) ? (
                          <>
                            <img src={selectedProject.evidence.installationAreaPhoto} alt="Fachada" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-[9px] font-black uppercase text-white tracking-widest bg-slate-900/70 px-2.5 py-1 rounded-lg">Zoom 🔍</span>
                            </div>
                          </>
                        ) : (
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Sin archivo</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Second optional receipts & Partner Technical Document uploads */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex items-center justify-between text-[11px]">
                      <div>
                        <span className="text-[8px] font-extrabold uppercase text-slate-400 block">Segundo Recibo CFE Adicional</span>
                        <span className="font-bold text-slate-600">
                          {selectedProject.evidence.cfeReceipt2Front ? '📁 Dos recibos cargados en expediente' : 'N/A'}
                        </span>
                      </div>
                      {selectedProject.evidence.cfeReceipt2Front && (
                        <button 
                          onClick={() => { setZoomedImage(selectedProject.evidence.cfeReceipt2Front!); setZoomedTitle('Segundo Recibo CFE'); }} 
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 rounded-lg text-[9px] font-extrabold cursor-pointer border border-slate-200"
                        >
                          Ver Zoom
                        </button>
                      )}
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex items-center justify-between text-[11px]">
                      <div>
                        <span className="text-[8px] font-extrabold uppercase text-slate-400 block">Levantamiento Técnico Formal Subido</span>
                        <span className="font-bold text-slate-600">
                          {(selectedProject.evidence?.technicalSurveyDoc || selectedProject.siteSurveyStatus === 'concluido' || selectedProject.siteSurveyData) 
                            ? '📁 Dictamen Técnico Oficial disponible' 
                            : 'Pendiente subir por el Partner / Asesor'}
                        </span>
                      </div>
                      {(selectedProject.evidence?.technicalSurveyDoc || selectedProject.siteSurveyStatus === 'concluido' || selectedProject.siteSurveyData) && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => downloadOrViewTechnicalSurvey(selectedProject, soluxConfig, showNotification)}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-extrabold flex items-center gap-1 shadow-xs cursor-pointer transition-all"
                            title="Descargar Dictamen Técnico Oficial en PDF"
                          >
                            <Download className="w-3 h-3" /> Descargar PDF
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Detalle del Levantamiento Técnico */}
                  <div className="bg-emerald-50/60 border border-emerald-200 p-3.5 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase text-emerald-900 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-emerald-700" /> Dictamen de Viabilidad en Sitio (CRM)
                      </span>
                      <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                        selectedProject.siteSurveyStatus === 'concluido' || selectedProject.evidence.technicalSurveyDoc
                          ? 'bg-emerald-200 text-emerald-900'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {selectedProject.siteSurveyStatus === 'concluido' || selectedProject.evidence.technicalSurveyDoc
                          ? '✅ Concluido'
                          : '⏳ Pendiente'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                      <div className="bg-white p-2 rounded-xl border border-emerald-100">
                        <span className="text-[7px] font-extrabold text-slate-400 uppercase block">Sombras</span>
                        <span className="font-bold text-slate-800">
                          {selectedProject.siteSurveyData?.noShadows !== false ? '☀️ Sin sombras' : '⚠️ Con sombras'}
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-emerald-100">
                        <span className="text-[7px] font-extrabold text-slate-400 uppercase block">Condición Techo</span>
                        <span className="font-bold text-slate-800 uppercase">
                          🏠 {selectedProject.siteSurveyData?.roofCondition || 'Buena'}
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-emerald-100">
                        <span className="text-[7px] font-extrabold text-slate-400 uppercase block">Distancia Medidor</span>
                        <span className="font-bold text-slate-800">
                          ⚡ {selectedProject.siteSurveyData?.wiringDistance || 12}m
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-emerald-100">
                        <span className="text-[7px] font-extrabold text-slate-400 uppercase block">Firma Cliente</span>
                        <span className="font-bold text-emerald-700">
                          {selectedProject.siteSurveyData?.clientSignature ? '✍️ Firmado' : '⏳ Pendiente'}
                        </span>
                      </div>
                    </div>

                    {selectedProject.siteSurveyData?.surveyorNotes && (
                      <p className="text-[10px] text-slate-600 bg-white p-2 rounded-xl border border-slate-100 italic">
                        Notas: "{selectedProject.siteSurveyData.surveyorNotes}"
                      </p>
                    )}
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="bg-slate-50 border-t border-slate-200 p-5 md:p-6 flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center shrink-0">
                <div className="flex flex-col sm:flex-row gap-2">
                  {onDeleteSolarProject && (
                    <button
                      onClick={() => {
                        if (window.confirm(`¿Estás completamente seguro de que deseas eliminar permanentemente el expediente de "${selectedProject.clientName}"?`)) {
                          onDeleteSolarProject(selectedProject.id);
                          setSelectedProject(null);
                          showNotification('🗑️ Expediente eliminado correctamente.');
                        }
                      }}
                      className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 w-full sm:w-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Eliminar Expediente
                    </button>
                  )}
                  <button
                    onClick={() => handleOpenEditProject(selectedProject)}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center w-full sm:w-auto"
                  >
                    ✍️ Editar Datos y Credenciales
                  </button>
                </div>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center w-full sm:w-auto"
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
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
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold text-indigo-600 uppercase">Usuario de Acceso del Cliente *</label>
                  <input
                    type="text"
                    required
                    value={editProjectUsername}
                    onChange={e => setEditProjectUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    className="w-full px-3 py-2 bg-slate-50 border border-indigo-200 rounded-xl font-bold font-mono text-indigo-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold text-emerald-600 uppercase">Contraseña de Acceso del Cliente *</label>
                  <input
                    type="text"
                    required
                    value={editProjectPassword}
                    onChange={e => setEditProjectPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-emerald-200 rounded-xl font-bold font-mono text-emerald-800"
                  />
                </div>

                {/* Resumen Financiero y Cuentas en Tiempo Real (Edición) */}
                {(() => {
                  const billNum = Number(editProjectBill) || 0;
                  const panels = calculatePanels(billNum);
                  const baseInvestment = panels * activePanelPrice;
                  const fin = calculateSoluxFinancing(baseInvestment, editProjectPayMethod, soluxConfig);

                  return (
                    <div className="md:col-span-2 p-3 rounded-2xl bg-slate-900 text-white space-y-2 border border-slate-800">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                          <span>🧮 Cuentas del Proyecto Calculadas</span>
                          <span className="text-[8px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-mono">
                            {formatPaymentMethod(editProjectPayMethod)}
                          </span>
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-300">
                          {panels} Paneles (${baseInvestment.toLocaleString('es-MX')} MXN)
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        {fin.isContado ? (
                          <>
                            <div className="bg-slate-800/60 p-2 rounded-xl">
                              <div className="text-[8px] text-emerald-400 font-bold uppercase">Descuento Contado</div>
                              <div className="font-black text-emerald-300">-{fin.discountPercent}% (-${fin.discountAmount.toLocaleString('es-MX')})</div>
                            </div>
                            <div className="bg-emerald-950/50 p-2 rounded-xl sm:col-span-3">
                              <div className="text-[8px] text-emerald-400 font-bold uppercase">Total Neto de Contado</div>
                              <div className="font-black text-white text-sm">${fin.netInvestment.toLocaleString('es-MX')} MXN</div>
                            </div>
                          </>
                        ) : fin.isDirectFinancing ? (
                          <>
                            <div className="bg-slate-800/60 p-2 rounded-xl">
                              <div className="text-[8px] text-sky-400 font-bold uppercase">Enganche ({fin.downPaymentPercent}%)</div>
                              <div className="font-black text-sky-300">${fin.downPayment.toLocaleString('es-MX')}</div>
                            </div>
                            <div className="bg-slate-800/60 p-2 rounded-xl">
                              <div className="text-[8px] text-slate-400 font-bold uppercase">Saldo Financiado</div>
                              <div className="font-black text-white">${fin.financedAmount.toLocaleString('es-MX')}</div>
                            </div>
                            <div className="bg-sky-950/50 p-2 rounded-xl">
                              <div className="text-[8px] text-sky-300 font-bold uppercase">Mensualidad ({fin.months}m)</div>
                              <div className="font-black text-white text-sm">${fin.monthlyPayment.toLocaleString('es-MX')}/mes</div>
                            </div>
                            <div className="bg-slate-800/60 p-2 rounded-xl">
                              <div className="text-[8px] text-slate-400 font-bold uppercase">Total con Int.</div>
                              <div className="font-black text-white">${fin.totalWithInterest.toLocaleString('es-MX')}</div>
                            </div>
                          </>
                        ) : (
                          <div className="bg-indigo-950/50 p-2 rounded-xl sm:col-span-4">
                            <div className="text-[8px] text-indigo-300 font-bold uppercase">12 Meses Sin Intereses</div>
                            <div className="font-black text-white text-sm">${fin.monthlyPayment.toLocaleString('es-MX')} /mes (Total: ${fin.netInvestment.toLocaleString('es-MX')} MXN)</div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

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
          id="admin-lightbox"
          className="fixed inset-0 bg-black/95 z-100 flex flex-col items-center justify-center p-4 animate-fadeIn" 
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

    </div>
  );
}
