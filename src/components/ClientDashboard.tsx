import React, { useState, useRef, useEffect } from 'react';
import { 
  Zap, Hammer, Calendar, MapPin, Clock, AlertTriangle, 
  ArrowRight, UserCheck, ShieldCheck, Sparkles, CheckSquare, 
  FileText, Phone, Download, TrendingUp, Coins, Award, Check, PenTool, X, Share2,
  User, LogOut, Eye, Wrench, DollarSign, Image
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SolarProject, AppNotification } from '../types';
import { SOLUX_LOGO_URL, SOLUX_LOGO_FALLBACK } from '../logoConfig';
import { exportProjectDossierPDF, exportProjectDossierImage } from '../pdfUtils';
import { formatWhatsAppPhone } from '../phoneUtils';
import UserProfileModule from './UserProfileModule';
import { NotificationsBell } from './NotificationsBell';
import NotificationsModule from './NotificationsModule';
import { Bell } from 'lucide-react';

interface ClientDashboardProps {
  solarProjects: SolarProject[];
  users?: any[];
  onUpdateSolarProject: (id: string, updated: Partial<SolarProject>) => void;
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
  onDeleteSolarProject?: (id: string) => void;
}

export default function ClientDashboard({
  solarProjects,
  users,
  onUpdateSolarProject,
  onExit,
  currentUser,
  onUpdateProfile,
  isOfflineMode = false,

  notifications,
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  onClearAllNotifications,
  onDeleteNotification
}: ClientDashboardProps) {
  const isRealImage = (url?: string) => {
    return !!url && url.trim() !== '' && !url.includes('placeholder') && !url.includes('PLACEHOLDER') && (url.startsWith('http') || url.startsWith('data:'));
  };

  const [activeTab, setActiveTab] = useState<'mi_proyecto' | 'simulador' | 'registro' | 'perfil' | 'notificaciones'>(() => {
    const saved = localStorage.getItem('solux_client_active_tab');
    return (saved as any) || 'mi_proyecto';
  });

  // Zoom / lightbox states for evidence images
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [zoomedTitle, setZoomedTitle] = useState('');

  useEffect(() => {
    localStorage.setItem('solux_client_active_tab', activeTab);
  }, [activeTab]);

  // Find project strictly associated with the logged-in client user
  const matchedProject = solarProjects.find(p => {
    const nameMatch = Boolean(currentUser?.fullName && p.clientName.toLowerCase().trim() === currentUser.fullName.toLowerCase().trim());
    const phoneMatch = Boolean(currentUser?.whatsapp && p.clientPhone === currentUser.whatsapp);
    const emailMatch = Boolean(currentUser?.email && p.clientEmail?.toLowerCase().trim() === currentUser.email.toLowerCase().trim());
    const creatorMatch = Boolean(currentUser?.id && p.createdBy === currentUser.id);
    return nameMatch || phoneMatch || emailMatch || creatorMatch;
  });

  // Fallback project if logged-in user is previewing or testing client view
  const fallbackProject: SolarProject = solarProjects.length > 0 ? solarProjects[0] : {
    id: 'SOL-DEMO-01',
    clientName: currentUser?.fullName || 'Cliente Solux Green',
    clientPhone: currentUser?.whatsapp || currentUser?.phone || '2293433597',
    clientEmail: currentUser?.email || 'cliente@soluxgreen.com.mx',
    municipalityState: 'Veracruz, Ver.',
    averageBill: 0,
    availableSpace: 0,
    metersCount: 1,
    cfeStatus: 'activo_sin_adeudo',
    paymentMethodDesired: 'directo',
    propertyOwnership: 'propietario',
    evidence: {},
    requiredArea: 0,
    voltageAlert220v: false,
    voltageUpgradeQuoted: false,
    estimatedPanels: 0,
    totalInvestment: 0,
    wiresCount: 2,
    status: 'analisis',
    siteSurveyStatus: 'concluido',
    siteSurveyPaid: true,
    payments: [],
    createdDate: new Date().toISOString().split('T')[0],
    createdBy: currentUser?.id || 'admin',
    createdByRole: 'comercial',
    advisorName: 'Asesor Verde Solux',
    advisorPhone: '2293433597'
  };

  const selectedBaseProject = matchedProject || fallbackProject;

  // Active project guarantees modules stay active
  const activeProject = {
    ...selectedBaseProject,
    clientName: (currentUser?.role === 'client' && currentUser?.fullName) ? currentUser.fullName : selectedBaseProject.clientName
  };

  // Resolve assigned advisor for active project
  const creatorUser = users?.find((u: any) => u.id === activeProject?.createdBy || u.fullName === activeProject?.advisorName);
  const advisorName = activeProject?.advisorName || creatorUser?.fullName || 'Asesor Verde Solux';
  const advisorPhone = activeProject?.advisorPhone || creatorUser?.whatsapp || creatorUser?.phone || '2293433597';

  // Evidence upload state
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, keyName: string) => {
    const file = e.target.files?.[0];
    if (!file || !activeProject) return;

    if (file.size > 12 * 1024 * 1024) {
      alert('⚠️ El archivo no debe superar los 12 MB.');
      return;
    }

    setUploadingKey(keyName);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      const currentEvidence = activeProject.evidence || {};
      const updatedEv = { ...currentEvidence, [keyName]: dataUrl };
      onUpdateSolarProject(activeProject.id, { evidence: updatedEv });
      setUploadingKey(null);
      alert('✅ ¡Evidencia subida exitosamente a tu expediente digital!');
    };
    reader.readAsDataURL(file);
  };

  // Canvas drawing variables/states for the client's signature
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [isSigningModalOpen, setIsSigningModalOpen] = useState(false);

  // Local simulated panels state inside ClientDashboard
  const [simulatedPanels, setSimulatedPanels] = useState<number>(4);

  // Sync simulated panels with activeProject only when project ID changes
  useEffect(() => {
    if (activeProject) {
      setSimulatedPanels(activeProject.estimatedPanels || 4);
    }
  }, [activeProject?.id]);

  const exportProjectToPDF = async (proj: SolarProject) => {
    const advisorObj = {
      fullName: advisorName,
      phone: advisorPhone
    };
    await exportProjectDossierPDF(proj, advisorObj, currentUser);
  };

  const exportProjectToExcel = (proj: SolarProject) => {
    const csvContent = "\uFEFF"
      + [
          ["ID Expediente", "Nombre del Cliente", "WhatsApp / Telefono", "Correo", "Municipio y Estado", "Consumo CFE Promedio", "Paneles Estimados", "Inversion Total", "Hilos Acometida", "Metodo Pago Deseado", "Estatus del Expediente", "Usuario Acceso", "Contrasena Acceso"].join(","),
          [
            proj.id,
            `"${proj.clientName.replace(/"/g, '""')}"`,
            `"${proj.clientPhone}"`,
            `"${proj.clientEmail || 'N/A'}"`,
            `"${proj.municipalityState.replace(/"/g, '""')}"`,
            proj.averageBill,
            proj.estimatedPanels || 4,
            proj.totalInvestment || ((proj.estimatedPanels || 4) * 14500),
            proj.wiresCount,
            `"${proj.paymentMethodDesired}"`,
            `"${proj.status.toUpperCase()}"`,
            `"${currentUser?.username || 'N/A'}"`,
            `"${currentUser?.password || 'N/A'}"`
          ].join(",")
        ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Mi_Cotizacion_Solux_${proj.clientName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportProjectToImage = async (proj: SolarProject) => {
    try {
      const creatorUser = users?.find((u: any) => u.id === proj.createdBy || u.fullName === proj.advisorName);
      const advName = proj.advisorName || creatorUser?.fullName || 'Asesor Verde Solux';
      const advPhone = proj.advisorPhone || creatorUser?.whatsapp || '229 343 3597';

      const advisorObj = {
        fullName: advName,
        phone: advPhone
      };

      await exportProjectDossierImage(proj, advisorObj, currentUser, undefined);
    } catch (e) {
      console.error('Error al exportar imagen:', e);
    }
    return;
  };

  const _legacyExportProjectToImage = (proj: SolarProject) => {
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
        ctx.roundRect(50, 180, 700, 120, 10);
      } else {
        ctx.rect(50, 180, 700, 120);
      }
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#10b981';
      ctx.fillRect(50, 180, 5, 120);

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('NOMBRE O RAZÓN SOCIAL:', 80, 215);
      ctx.fillText('TELÉFONO DE REGISTRO:', 80, 245);
      ctx.fillText('UBICACIÓN / ESTADO:', 80, 275);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(proj.clientName.toUpperCase(), 280, 215);
      ctx.fillText(proj.clientPhone || 'No registrado', 280, 245);
      ctx.fillText((proj.municipalityState || 'No especificado').toUpperCase(), 280, 275);

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

      if (currentUser) {
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
        ctx.fillText(`USUARIO: ${currentUser.username || 'N/A'}`, 75, 695);
        
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(`CONTRASEÑA: ${currentUser.password || 'N/A'}`, 380, 695);
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
        // Fallback to external url if local fails
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

  const shareProjectOnWhatsApp = (proj: SolarProject) => {
    const panels = proj.estimatedPanels || 4;
    const investment = proj.totalInvestment || (panels * 14500);
    const averageBill = proj.averageBill || 0;
    const credentialText = currentUser 
      ? `\n\n🔐 *Acceso a tu Portal de Cliente:* \n🌐 Link: ${window.location.origin}\n👤 Usuario: *${currentUser.username || 'N/A'}*\n🔑 Contraseña: *${currentUser.password || 'N/A'}*`
      : '';

    const message = `☀️ *MI PROPUESTA COMERCIAL - SOLUX GREEN* ☀️

Hola, te comparto el resumen de mi diagnóstico solar de Solux Green:

📈 *Consumo Bimestral Promedio CFE:* $${averageBill.toLocaleString('es-MX')} MXN
⚡ *Sistema Fotovoltaico Recomendado:* *${panels} Paneles Solares*
📐 *Área Requerida Mínima:* *${(proj.requiredArea || (panels * 2.88)).toFixed(2)} m²*
🌱 *Reducción de Co2 Estimada:* *98% de ahorro bimestral*

💰 *Inversión Total Estimada:* *$${investment.toLocaleString('es-MX')} MXN*
💳 *Método de Adquisición de Interés:* *${proj.paymentMethodDesired}*${credentialText}

📍 *Ubicación del Proyecto:* ${proj.municipalityState}

*¡Generando mi propia energía limpia hoy mismo con Solux Green!* 🌍🍃`;

    const encodedText = encodeURIComponent(message);
    let cleanPhone = (proj.clientPhone || '').replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = '52' + cleanPhone;
    }
    
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
  };

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

  // Helper to calculate solar metrics
  const calculateSolarProduction = (panels: number) => {
    // 550W panels * 5.3 peak sun hours * 60 days (bimonthly) * efficiency (0.8)
    const bimonthlyKWh = Math.round((panels * 550 * 5.3 * 60 * 0.8) / 1000);
    // 0.45 kg of CO2 offset per kWh
    const co2Offset = Math.round(bimonthlyKWh * 0.45);
    // Each tree absorbs roughly 20kg of CO2 per year
    const treesEquivalent = Math.round(co2Offset / 20);

    return {
      bimonthlyKWh,
      co2Offset,
      treesEquivalent
    };
  };

  // Status timeline mapping
  const stages = [
    { key: 'validacion', label: 'Validación Inicial', desc: 'Verificación de expediente, fotos y recibo de CFE.' },
    { key: 'levantamiento', label: 'Levantamiento Técnico', desc: 'Inspección de sombras, azotea y distancias en sitio.' },
    { key: 'contrato', label: 'Firma de Contrato', desc: 'Autorización legal y selección de plan de pagos.' },
    { key: 'instalacion', label: 'Instalación Física', desc: 'Montaje de racks de aluminio, módulos e inversor.' },
    { key: 'tramite_cfe', label: 'Trámite de Interconexión', desc: 'Aprobación del medidor bilateral ante CFE.' },
    { key: 'operacion', label: 'Generación Activa', desc: 'Sistema encendido produciendo energía sustentable.' }
  ];

  const getStageIndex = (currentStatus?: string) => {
    if (!currentStatus) return 0;
    const s = String(currentStatus).toLowerCase().trim();

    // Stage 0: Validación Inicial
    if (['validacion', 'prospecto', 'cotizacion_enviada', 'analisis', 'nuevo', 'new', 'prospecto_creado'].includes(s)) {
      return 0;
    }
    // Stage 1: Levantamiento Técnico
    if (['levantamiento', 'levantamiento_tecnico', 'levantamiento_pendiente', 'inspeccion'].includes(s)) {
      return 1;
    }
    // Stage 2: Firma de Contrato
    if (['contrato', 'firma_contrato', 'financiamiento_enviado', 'cotizacion_final', 'validado', 'contratado'].includes(s)) {
      return 2;
    }
    // Stage 3: Instalación Física
    if (['instalacion', 'instalacion_proceso', 'instalado', 'en_instalacion'].includes(s)) {
      return 3;
    }
    // Stage 4: Trámite de Interconexión CFE
    if (['tramite_cfe', 'interconexion', 'tramite_interconexion', 'medidor_cfe'].includes(s)) {
      return 4;
    }
    // Stage 5: Generación Activa
    if (['operacion', 'generacion_activa', 'completado', 'finalizado', 'activo'].includes(s)) {
      return 5;
    }

    const idx = stages.findIndex(st => st.key === s);
    return idx >= 0 ? idx : 0;
  };

  const rawActiveStageIndex = activeProject ? getStageIndex(activeProject.status) : 0;
  const activeStageIndex = Math.max(0, Math.min(rawActiveStageIndex, stages.length - 1));
  const progressPercent = Math.round(((activeStageIndex + 1) / stages.length) * 100);

  // Simulate signing the legal contract in the client portal
  const handleSignContract = () => {
    setIsSigningModalOpen(true);
  };

  const handleConfirmSignature = () => {
    if (!activeProject) return;
    if (!hasSigned) {
      alert('⚠️ Por favor dibuja tu firma en el recuadro antes de confirmar.');
      return;
    }
    
    let signatureStr = '';
    const canvas = canvasRef.current;
    if (canvas && hasSigned) {
      try {
        signatureStr = canvas.toDataURL('image/png');
      } catch (e) {
        signatureStr = 'data:image/png;base64,simulated_client_signature';
      }
    } else if (hasSigned) {
      signatureStr = 'data:image/png;base64,simulated_client_signature';
    }
    const update: Partial<SolarProject> = {
      status: 'instalacion',
      siteSurveyData: {
        ...(activeProject.siteSurveyData || { noShadows: true, roofCondition: 'buena', wiringDistance: 12 }),
        clientSignature: signatureStr
      }
    };
    onUpdateSolarProject(activeProject.id, update);
    setIsSigningModalOpen(false);
    setHasSigned(false);
    alert('✍️ ¡Contrato Digital Firmado con Éxito!\nTu firma ha quedado registrada legalmente. Tu proyecto ha avanzado a la fase de: Instalación Física de Módulos.');
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
        className="h-9 w-auto object-contain shrink-0 select-none"
        referrerPolicy="no-referrer"
      />
    </button>
  );

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-slate-50 text-slate-800 font-sans overflow-hidden" id="client-solar-root">
      
      {/* 1. SIDEBAR FOR DESKTOP */}
      <aside className="hidden lg:flex flex-col w-72 bg-white/95 border-r border-slate-200 p-6 shrink-0 justify-between h-full overflow-y-auto">
        <div className="space-y-8">
          {/* Branding */}
          <div className="flex items-center gap-3">
            <SoluxLogo />
            <div>
              <span className="text-sm font-black tracking-tight text-slate-900 block">SOLUX GREEN</span>
              <span className="text-[9px] text-[#10B981] font-extrabold tracking-widest uppercase">Portal Cliente</span>
            </div>
          </div>

          {/* Current User Profile Widget */}
          <div 
            onClick={() => setActiveTab('perfil')}
            className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'perfil' 
                ? 'bg-emerald-50 border-emerald-100 text-emerald-700 shadow-xs' 
                : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
              <img 
                src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.fullName || 'Cliente')}&background=10B981&color=fff&size=80&bold=true`} 
                alt="My profile" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[9px] font-black uppercase text-[#10B981] block tracking-wider font-mono">Cliente Activo</span>
              <span className="text-xs font-black block truncate leading-tight text-slate-800">{currentUser?.fullName || 'Cliente Solar'}</span>
            </div>
          </div>
 
          {/* Navigation Items */}
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('mi_proyecto')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'mi_proyecto' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <Sparkles className="w-4.5 h-4.5 shrink-0" />
              <span>Mi Proyecto</span>
            </button>

            <button
              onClick={() => setActiveTab('registro')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'registro' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <FileText className="w-4.5 h-4.5 shrink-0" />
              <span>Registro</span>
            </button>
 
            <button
              onClick={() => setActiveTab('simulador')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'simulador' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <TrendingUp className="w-4.5 h-4.5 shrink-0" />
              <span>Simulador</span>
            </button>

            <button
              onClick={() => setActiveTab('perfil')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'perfil' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-xs' 
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
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <Bell className="w-4.5 h-4.5 shrink-0" />
              <span>Notificaciones</span>
              {notifications.filter(n => !n.isRead && (n.role === 'all' || n.role === 'client' || n.userId === currentUser?.id)).length > 0 && (
                <span className="absolute right-4 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
              )}
            </button>
          </nav>
        </div>

        {/* Bottom exit */}
        <div className="space-y-4">
          <button
            onClick={onExit}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all cursor-pointer"
          >
            <Download className="w-4.5 h-4.5 rotate-90 shrink-0" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
 
      {/* 2. MAIN CONTAINER AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 min-w-0">
        
        {/* Unified Top Header */}
        <header className="bg-white border-b border-slate-200 px-3 sm:px-5 py-3 sm:py-4 flex items-center justify-between shrink-0 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="lg:hidden shrink-0"><SoluxLogo /></span>
            <div className="min-w-0">
              <span className="text-[10px] font-black text-emerald-600 uppercase block tracking-wider truncate max-w-[120px] sm:max-w-[180px]">{currentUser?.fullName || 'Cliente Solux'}</span>
              <h1 className="text-xs sm:text-sm font-black text-slate-800 uppercase truncate max-w-[150px] sm:max-w-[250px] mt-0.5">
                {matchedProject ? matchedProject.clientName : 'Mi Proyecto'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <NotificationsBell
              notifications={notifications}
              role="client"
              currentUser={currentUser}
              onMarkAsRead={onMarkNotificationAsRead}
              onMarkAllAsRead={onMarkAllNotificationsAsRead}
              onViewAll={() => setActiveTab('notificaciones')}
            />

            <div className="flex items-center gap-1.5 sm:gap-2 border-l border-slate-200 pl-2 sm:pl-3 ml-0.5 sm:ml-1 shrink-0">
              <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                <img 
                  src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.fullName || 'Cliente')}&background=10B981&color=fff&size=80&bold=true`} 
                  alt="Perfil" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-[10px] font-black text-slate-800 truncate max-w-[60px] sm:max-w-[150px] uppercase tracking-tight hidden sm:inline">{currentUser?.fullName || 'Cliente'}</span>
            </div>
          </div>
        </header>

        {/* Content View Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pb-20 md:pb-8">
          {activeProject ? (
            <AnimatePresence mode="wait">
            
              {/* VIEW: NOTIFICACIONES */}
              {activeTab === 'notificaciones' && (
                <NotificationsModule
                  notifications={notifications}
                  role="client"
                  currentUser={currentUser}
                  onMarkAsRead={onMarkNotificationAsRead}
                  onMarkAllAsRead={onMarkAllNotificationsAsRead}
                  onClearAllNotifications={onClearAllNotifications}
                  onDeleteNotification={onDeleteNotification}
                />
              )}

              {/* VIEW 1: MI PROYECTO SOLAR - HITOS DE SEGUIMIENTO */}
              {activeTab === 'mi_proyecto' && (
              <motion.div
                key="mi_proyecto"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 w-full max-w-none"
              >
                
                {/* Visual Status Banner Card */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
                  <div className="space-y-3 flex-1 w-full">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs font-extrabold uppercase text-emerald-800 tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60 inline-flex items-center gap-1">
                        🚦 Semáforo de Progreso: {progressPercent}% Completado
                      </span>
                      <span className="text-xs font-black text-slate-400 font-mono">Paso {activeStageIndex + 1} de {stages.length}</span>
                    </div>

                    <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                      <Sparkles className="w-6 h-6 text-emerald-600 shrink-0" />
                      Fase Actual: {stages[activeStageIndex]?.label}
                    </h2>
                    <p className="text-sm text-slate-600 font-semibold leading-relaxed">{stages[activeStageIndex]?.desc}</p>
                    
                    {/* Visual Semáforo Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200/80 mt-2">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 h-full rounded-full transition-all duration-500 shadow-xs"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 px-5 py-3 rounded-2xl border border-slate-200 text-sm text-slate-600 font-medium shrink-0 self-stretch md:self-auto flex flex-col justify-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Estado del Expediente</span>
                    <span className="font-extrabold text-slate-800 text-xs md:text-sm">📍 {activeProject.municipalityState}</span>
                  </div>
                </div>

                {/* TIMELINE PROGRESS FLOW */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-10 space-y-8 shadow-sm">
                  <span className="text-xs md:text-sm font-black text-slate-400 uppercase block tracking-wider mb-2">Línea del Tiempo del Proyecto</span>

                  <div className="relative border-l-2 border-slate-100 pl-8 ml-4 space-y-10 text-sm text-slate-600">
                    {stages.map((stage, idx) => {
                      const isCompleted = idx < activeStageIndex;
                      const isActive = idx === activeStageIndex;
                      const isUpcoming = idx > activeStageIndex;

                      return (
                        <div key={stage.key} className="relative">
                          
                          {/* Left node dot */}
                          <span className={`absolute -left-[41px] top-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            isCompleted 
                              ? 'bg-emerald-500 border-emerald-400 text-white shadow-xs text-xs' 
                              : isActive 
                              ? 'bg-amber-500 border-amber-300 text-slate-950 font-black animate-pulse text-xs' 
                              : 'bg-slate-100 border-slate-200 text-slate-400 text-xs'
                          }`}>
                            {isCompleted ? <Check className="w-3.5 h-3.5 text-white" /> : (isActive ? '●' : '')}
                          </span>

                          <div className={`space-y-2 ${isUpcoming ? 'opacity-40' : ''}`}>
                            <div className="flex items-center gap-3">
                              <h4 className={`font-black uppercase tracking-wide text-sm md:text-base ${isActive ? 'text-amber-600' : isCompleted ? 'text-emerald-600' : 'text-slate-500'}`}>
                                {stage.label}
                              </h4>
                              {isActive && (
                                <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-xs font-black uppercase tracking-wider animate-pulse">
                                  En Curso
                                </span>
                              )}
                            </div>
                            <p className="text-xs md:text-sm text-slate-500 font-semibold leading-relaxed">{stage.desc}</p>
                            
                            {/* Special context block embedded inside stages */}
                            
                            {/* Stage: Levantamiento Technical survey findings */}
                            {stage.key === 'levantamiento' && activeProject.siteSurveyStatus === 'concluido' && (
                              <div className="mt-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs md:text-sm text-slate-600 font-semibold w-full">
                                <div className="text-slate-800 uppercase font-black tracking-wide text-xs md:text-sm flex items-center gap-1.5">
                                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                                  Dictamen Técnico Confirmado
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-500">
                                  <span>Sombras en Sitio: <span className="text-slate-800 font-extrabold">{activeProject.siteSurveyData?.noShadows ? 'Ninguna' : 'Sombras menores'}</span></span>
                                  <span>Estado Azotea: <span className="text-slate-800 font-extrabold uppercase">{activeProject.siteSurveyData?.roofCondition}</span></span>
                                  <span className="col-span-1 md:col-span-2">Distancia de cableado medida: <span className="text-slate-800 font-extrabold font-mono">{activeProject.siteSurveyData?.wiringDistance} metros</span></span>
                                </div>
                                {activeProject.siteSurveyData?.surveyorNotes && (
                                  <p className="border-t border-slate-200 pt-3 text-xs text-slate-500 italic">" {activeProject.siteSurveyData.surveyorNotes} "</p>
                                )}
                              </div>
                            )}

                            {/* Stage: Contrato (Client signs legally) */}
                            {stage.key === 'contrato' && isActive && (
                              <div className="mt-4 p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 w-full">
                                <div className="text-slate-800 uppercase font-black text-xs md:text-sm tracking-wide flex items-center gap-1.5">
                                  <FileText className="w-5 h-5 text-orange-500" />
                                  Contrato Digital de Adhesión Solux Green
                                </div>
                                <p className="text-xs md:text-sm text-slate-600 font-semibold leading-relaxed">
                                  Tu propuesta comercial ha sido aprobada. Por favor firma digitalmente el contrato para programar la instalación física de tus módulos solares.
                                </p>
                                <div className="flex flex-wrap gap-3">
                                  <button
                                    onClick={handleSignContract}
                                    className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs tracking-wider rounded-xl cursor-pointer shadow-sm transition-all flex items-center gap-2"
                                  >
                                    <CheckSquare className="w-4 h-4" />
                                    <span>Firmar Contrato On-Screen</span>
                                  </button>
                                  <button
                                    onClick={() => alert('📄 Descargando copia PDF del contrato legal Solux Green...')}
                                    className="px-4 py-3 bg-white hover:bg-slate-100 text-slate-700 font-bold uppercase text-xs tracking-wider rounded-xl border border-slate-200 cursor-pointer shadow-sm"
                                  >
                                    Ver Contrato (PDF)
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Stage: CFE Interconnection */}
                            {stage.key === 'tramite_cfe' && !isUpcoming && (
                              <div className="mt-4 p-5 bg-amber-50 border border-amber-200 rounded-2xl w-full space-y-2 text-xs md:text-sm text-slate-700">
                                <span className="font-black text-amber-800 uppercase text-xs md:text-sm tracking-wide block">Solicitud de Medidor Bidireccional ante CFE</span>
                                <p className="font-semibold text-slate-600 leading-relaxed">
                                  Nuestros ingenieros ya ingresaron el expediente técnico ante el Centro de Atención CFE. El trámite de cambio de medidor se encuentra en: <span className="text-amber-700 font-bold">Espera de Unidad de Inspección</span>.
                                </p>
                              </div>
                            )}

                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </motion.div>
            )}

            {/* VIEW 2: SIMULADOR DE GENERACION Y AHORRO REAL */}
            {activeTab === 'simulador' && (
              <motion.div
                key="simulador"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 w-full max-w-none"
              >
                
                {/* 1. Ecological impact dashboard widgets */}
                {(() => {
                  const production = calculateSolarProduction(simulatedPanels);
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      
                      {/* Generation capacity */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center justify-between shadow-sm">
                        <div className="space-y-2">
                          <span className="text-xs text-slate-400 font-black block uppercase tracking-wider">Generación Bimestral</span>
                          <span className="text-2xl md:text-3xl font-black text-slate-800 block font-mono">{production.bimonthlyKWh} kWh</span>
                          <span className="text-xs text-slate-500 font-semibold block">Proyección climatológica regional</span>
                        </div>
                        <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center">
                          <Zap className="w-7 h-7 animate-bounce" />
                        </div>
                      </div>

                      {/* Carbon footprint */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center justify-between shadow-sm">
                        <div className="space-y-2">
                          <span className="text-xs text-slate-400 font-black block uppercase tracking-wider">CO₂ Evitado</span>
                          <span className="text-2xl md:text-3xl font-black text-emerald-600 block font-mono">{production.co2Offset} kg CO₂</span>
                          <span className="text-xs text-slate-500 font-semibold block">Gases de efecto invernadero prevenidos</span>
                        </div>
                        <div className="w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center">
                          <Award className="w-7 h-7" />
                        </div>
                      </div>

                      {/* Equivalency trees */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center justify-between shadow-sm">
                        <div className="space-y-2">
                          <span className="text-xs text-slate-400 font-black block uppercase tracking-wider">Árboles Plantados</span>
                          <span className="text-2xl md:text-3xl font-black text-slate-800 block font-mono">{production.treesEquivalent} Árboles</span>
                          <span className="text-xs text-slate-500 font-semibold block">Equivalencia de reforestación</span>
                        </div>
                        <div className="w-14 h-14 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-600 flex items-center justify-center">
                          <Sparkles className="w-7 h-7" />
                        </div>
                      </div>

                    </div>
                  );
                })()}

                {/* 1.5. Dynamic Sandbox Slider Panel */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xs space-y-6">
                  <div className="border-b border-slate-100 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-black uppercase text-emerald-650 tracking-wider block">Sandbox de Simulación Solar</span>
                      <h3 className="text-base md:text-lg font-black text-slate-900 uppercase tracking-wide">Personaliza tu Capacidad</h3>
                      <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                        Ajusta la cantidad de paneles solares para ver cómo cambia tu ahorro y generación bimestral proyectada en tiempo real.
                      </p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3 flex items-center gap-3 self-start md:self-center">
                      <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">Capacidad Configurada:</span>
                      <span className="text-sm font-mono font-black text-emerald-800">{simulatedPanels} Módulos</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    {/* Slider Control */}
                    <div className="md:col-span-8 space-y-4">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-extrabold uppercase">Cantidad de Paneles Solares</span>
                        <span className="font-mono font-black text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md">{simulatedPanels}</span>
                      </div>
                      <input 
                        type="range"
                        min="1"
                        max="30"
                        value={simulatedPanels}
                        onChange={e => setSimulatedPanels(Number(e.target.value))}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                      />
                      <div className="flex justify-between text-[9px] font-mono text-slate-400 font-bold uppercase">
                        <span>1 Panel</span>
                        <span>15 Paneles (Consumo Alto)</span>
                        <span>30 Paneles (DAC / Pyme)</span>
                      </div>
                    </div>

                    {/* Quick Scenario Additions */}
                    <div className="md:col-span-4 bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-3">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Escenarios de Carga Eléctrica Futura</span>
                      
                      <button
                        onClick={() => setSimulatedPanels(prev => Math.min(30, prev + 2))}
                        className="w-full py-2 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-extrabold text-[10px] uppercase rounded-xl transition-all cursor-pointer text-left flex items-center justify-between"
                      >
                        <span>❄️ Añadir 1 Aire Acondicionado</span>
                        <span className="text-emerald-600 font-mono">+2 Paneles</span>
                      </button>

                      <button
                        onClick={() => setSimulatedPanels(prev => Math.min(30, prev + 4))}
                        className="w-full py-2 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-extrabold text-[10px] uppercase rounded-xl transition-all cursor-pointer text-left flex items-center justify-between"
                      >
                        <span>🚗 Añadir Cargador Auto Eléctrico</span>
                        <span className="text-emerald-600 font-mono">+4 Paneles</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Visual comparative financial charts */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  
                  {/* Left: Interactive comparison card */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 lg:col-span-5 flex flex-col justify-between shadow-sm">
                    <div className="space-y-4">
                      <span className="text-xs font-black uppercase text-amber-600 tracking-wider block">Simulación de Factura CFE</span>
                      <h3 className="text-base md:text-lg font-black text-slate-900 uppercase tracking-wide">El Impacto en tus Finanzas</h3>
                      <p className="text-xs md:text-sm text-slate-500 leading-relaxed font-semibold">
                        Una vez interconectado tu medidor bidireccional, toda la energía excedente producida por tus paneles solares Solux se inyecta a la red de CFE, reduciendo tu tarifa bimestral a la tarifa mínima de servicio básico.
                      </p>
                    </div>

                    <div className="space-y-4 mt-8">
                      <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl">
                        <span className="text-xs text-slate-500 font-bold block uppercase tracking-wide">Gasto Bimestral Tradicional</span>
                        <span className="text-xl md:text-2xl font-black text-rose-600 font-mono">${activeProject.averageBill.toLocaleString('es-MX')} MXN</span>
                      </div>

                      <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                        <span className="text-xs text-slate-500 font-bold block uppercase tracking-wide">Cargo Mínimo Fijo con Solux</span>
                        <span className="text-xl md:text-2xl font-black text-emerald-600 font-mono">$54 MXN</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: SVG Bar Chart comparing the two */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 lg:col-span-7 flex flex-col justify-between shadow-sm">
                    <div className="space-y-1">
                      <span className="text-xs font-black uppercase text-emerald-600 tracking-wider block">Comparador de Consumo Bimestral</span>
                      <h3 className="text-base md:text-lg font-black text-slate-900 uppercase tracking-wide">Gráfica de Reducción Proyectada</h3>
                    </div>

                    {/* SVG Graphic layout */}
                    <div className="flex items-end justify-around h-56 border-b border-slate-200 pb-4 mt-6">
                      
                      {/* Bar 1: CFE Traditional */}
                      <div className="flex flex-col items-center gap-3 w-1/3">
                        <div className="w-16 bg-gradient-to-t from-rose-600 to-rose-400 rounded-t-xl transition-all duration-1000 h-44 relative group">
                          {/* Hover tooltip */}
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-xs font-bold py-1 px-2 rounded text-white border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            ${activeProject.averageBill}
                          </div>
                        </div>
                        <span className="text-xs md:text-sm text-slate-600 font-bold uppercase block text-center">CFE Tradicional</span>
                      </div>

                      {/* Bar 2: Solux Green minimum */}
                      <div className="flex flex-col items-center gap-3 w-1/3">
                        {/* Minimum height representing $54 pesos */}
                        <div className="w-16 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-xl transition-all duration-1000 h-4.5 relative group">
                          {/* Hover tooltip */}
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-xs font-bold py-1 px-2 rounded text-white border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            $54
                          </div>
                        </div>
                        <span className="text-xs md:text-sm text-slate-600 font-bold uppercase block text-center">Con Solux Green</span>
                      </div>

                    </div>

                    <p className="text-xs md:text-sm text-slate-500 italic font-semibold leading-relaxed text-center mt-4 block">
                      * El ahorro neto bimestral proyectado es de: <span className="text-emerald-600 font-bold font-mono">${(activeProject.averageBill - 54).toLocaleString('es-MX')} pesos</span>.
                    </p>
                  </div>

                </div>

              </motion.div>
            )}

            {/* ------------------- VIEW 3: REGISTRO DE CLIENTE (MIS DATOS Y EVIDENCIAS) ------------------- */}
            {activeTab === 'registro' && (
              <motion.div
                key="registro"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 w-full max-w-none pb-8"
              >
                {/* Header widget */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
                  <div className="space-y-2">
                    <span className="text-xs font-extrabold uppercase text-slate-450 font-mono tracking-wider block">Expediente Oficial</span>
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                      <FileText className="w-6 h-6 text-emerald-600" />
                      Mis Datos de Registro y Evidencias
                    </h2>
                    <p className="text-sm md:text-base text-slate-600 font-semibold">Consulte la información técnica de su contrato y los documentos adjuntos en su expediente.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Column: General & Technical Info (2 cols span on lg) */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* General info */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
                      <h3 className="text-sm font-black uppercase text-slate-950 tracking-wider border-b pb-2 flex items-center gap-2">
                        <User className="w-4.5 h-4.5 text-emerald-600" />
                        1. Información General del Cliente
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs md:text-sm">
                        <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block">Nombre del Cliente</span>
                          <span className="font-extrabold text-slate-800">{activeProject.clientName}</span>
                        </div>
                        <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block">Teléfono / WhatsApp</span>
                          <span className="font-extrabold text-slate-800">{activeProject.clientPhone || activeProject.whatsappPhone || 'No registrado'}</span>
                        </div>
                        <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block">Correo Electrónico</span>
                          <span className="font-extrabold text-slate-800">{activeProject.clientEmail || 'No registrado'}</span>
                        </div>
                        <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block">Municipio y Estado</span>
                          <span className="font-extrabold text-slate-800">{activeProject.municipalityState}</span>
                        </div>
                        <div className="space-y-1 bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 p-4 rounded-2xl border border-emerald-200/80 md:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                          <div>
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider bg-emerald-100/90 px-2 py-0.5 rounded-md">
                                👨‍💼 ASESOR VERDE QUE REGISTRÓ AL CLIENTE
                              </span>
                            </div>
                            <h4 className="font-black text-slate-900 text-base uppercase">{advisorName}</h4>
                            <p className="text-xs text-slate-600 font-bold mt-0.5">
                              Rol: <span className="text-indigo-700 font-extrabold uppercase">Asesor Verde Solux</span>
                              {advisorPhone && <> • Tel/WA: <span className="font-mono text-slate-900">{advisorPhone}</span></>}
                            </p>
                          </div>
                          {advisorPhone && (
                            <a
                              href={`https://wa.me/${formatWhatsAppPhone(advisorPhone)}?text=${encodeURIComponent(`Hola ${advisorName}, soy ${activeProject.clientName}. Quisiera consultar detalles sobre mi proyecto solar.`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all text-center shrink-0 cursor-pointer"
                            >
                              💬 Contactar a mi Asesor
                            </a>
                          )}
                        </div>
                        {activeProject.googleMapsUrl && (
                          <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100 md:col-span-2">
                            <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block">Enlace de Ubicación Google Maps</span>
                            <a 
                              href={activeProject.googleMapsUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-emerald-600 hover:underline font-extrabold truncate block text-xs"
                            >
                              📍 {activeProject.googleMapsUrl}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Technical details */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
                      <h3 className="text-sm font-black uppercase text-slate-950 tracking-wider border-b pb-2 flex items-center gap-2">
                        <Wrench className="w-4.5 h-4.5 text-emerald-600" />
                        2. Ficha Técnica de Consumo Solar
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs md:text-sm">
                        <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block">Monto Promedio Pago CFE</span>
                          <span className="font-extrabold text-slate-800 font-mono">${activeProject.averageBill?.toLocaleString('es-MX')} MXN</span>
                        </div>
                        <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block">Hilos en Acometida</span>
                          <span className="font-extrabold text-slate-800">
                            {activeProject.wiresCount === 2 ? '2 Hilos (Monofásico 110V)' : 
                             activeProject.wiresCount === 3 ? '3 Hilos (Bifásico 220V)' : 
                             activeProject.wiresCount === 4 ? '4 Hilos (Trifásico 220V/440V)' : `${activeProject.wiresCount} Hilos`}
                          </span>
                        </div>
                        <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block">Módulos Solares Estimados</span>
                          <span className="font-extrabold text-[#10B981]">{activeProject.estimatedPanels || 'Calculando...'} Paneles</span>
                        </div>
                        <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block">Inversión Total Proyectada</span>
                          <span className="font-extrabold text-slate-800 font-mono">${activeProject.totalInvestment?.toLocaleString('es-MX')} MXN</span>
                        </div>
                        <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100 md:col-span-2">
                          <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block">Cargas Eléctricas en Hogar/Negocio</span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {activeProject.electricalLoadType && activeProject.electricalLoadType.length > 0 ? (
                              activeProject.electricalLoadType.map((load: string, idx: number) => (
                                <span key={`load_${load}_${idx}`} className="text-[9px] font-extrabold uppercase px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg">
                                  {load}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400 italic">Ninguna carga seleccionada</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Evidence Images (1 col span) */}
                  <div className="space-y-6">
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                      <div className="border-b pb-2 flex items-center justify-between">
                        <h3 className="text-sm font-black uppercase text-slate-950 tracking-wider flex items-center gap-2">
                          <Image className="w-4.5 h-4.5 text-emerald-600" />
                          3. Expediente Digital y Evidencias
                        </h3>
                        <span className="text-[9px] font-extrabold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                          Cliente Editable
                        </span>
                      </div>
                      
                      <p className="text-[11px] text-slate-500 font-semibold leading-snug">
                        Sube o actualiza tus documentos (recibo CFE, identificaciones INE, comprobante de domicilio) para agilizar tu trámite solar.
                      </p>

                      <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
                        {[
                          { key: 'cfeReceiptFront', title: 'Recibo CFE Frente' },
                          { key: 'cfeReceiptBack', title: 'Recibo CFE Reverso' },
                          { key: 'facade', title: 'Foto Fachada Calle' },
                          { key: 'installationAreaPhoto', title: 'Foto Techo / Azotea' },
                          { key: 'ineFront', title: 'Identificación INE Frente' },
                          { key: 'ineBack', title: 'Identificación INE Reverso' },
                          { key: 'proofOfAddress', title: 'Comprobante Domicilio' },
                        ].map((item) => (
                          <div key={item.key} className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider block">{item.title}</span>
                              {uploadingKey === item.key && <span className="text-[9px] font-bold text-emerald-600 animate-pulse">Guardando...</span>}
                            </div>

                            <div className="relative group rounded-xl overflow-hidden bg-white border border-slate-200 h-28 flex items-center justify-center">
                              {activeProject.evidence?.[item.key] && isRealImage(activeProject.evidence[item.key]) ? (
                                <>
                                  <img src={activeProject.evidence[item.key]} alt={item.title} className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => { setZoomedImage(activeProject.evidence[item.key]); setZoomedTitle(item.title); }}
                                      className="px-3 py-1.5 bg-white text-slate-900 font-extrabold rounded-lg text-[9px] uppercase tracking-wider flex items-center gap-1 shadow-sm hover:scale-105 transition-all cursor-pointer"
                                    >
                                      <Eye className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>Ampliar</span>
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <div className="text-center p-2">
                                  <span className="text-slate-400 font-extrabold uppercase text-[9px] block">Pendiente de Subir</span>
                                </div>
                              )}
                            </div>

                            <label className="w-full py-2 px-3 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl text-slate-700 font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-2xs">
                              <Download className="w-3.5 h-3.5 text-emerald-600 rotate-180" />
                              <span>{activeProject.evidence?.[item.key] && isRealImage(activeProject.evidence[item.key]) ? 'Reemplazar Documento' : 'Subir Archivo'}</span>
                              <input
                                type="file"
                                accept="image/*,.pdf"
                                className="hidden"
                                onChange={(e) => handleFileUpload(e, item.key)}
                              />
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Export and Share card */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                      <h3 className="text-sm font-black uppercase text-slate-950 tracking-wider border-b pb-2 flex items-center gap-2">
                        <Share2 className="w-4.5 h-4.5 text-emerald-600" />
                        4. Compartir y Exportar
                      </h3>
                      <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                        Exporta tu cotización oficial y plan de generación solar en el formato de tu preferencia, o compártelo directamente por WhatsApp.
                      </p>
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <button
                          onClick={() => exportProjectToPDF(activeProject)}
                          className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-extrabold rounded-xl text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        >
                          📄 PDF
                        </button>
                        <button
                          onClick={() => exportProjectToExcel(activeProject)}
                          className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-extrabold rounded-xl text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        >
                          📊 Excel
                        </button>
                        <button
                          onClick={() => exportProjectToImage(activeProject)}
                          className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-extrabold rounded-xl text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        >
                          🖼️ Imagen JPG
                        </button>
                        <button
                          onClick={() => shareProjectOnWhatsApp(activeProject)}
                          className="px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        >
                          💬 WhatsApp
                        </button>
                      </div>
                    </div>

                  </div>

                </div>
              </motion.div>
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
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500 text-center space-y-2">
            <AlertTriangle className="w-12 h-12 text-slate-700" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">Proyectos Solares No Encontrados</span>
            <p className="text-[10px] text-slate-500 max-w-xs">Por favor, registra un proyecto en la pestaña "Asesor Verde" primero.</p>
          </div>
        )}
      </div>

      {/* 3. BOTTOM TAB NAVIGATION FOR TABLET/MOBILE (lg:hidden) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200 z-50 flex justify-around items-center px-4 shadow-lg">
        <button
          onClick={() => setActiveTab('mi_proyecto')}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-colors relative py-1 px-3 rounded-xl ${
            activeTab === 'mi_proyecto' ? 'text-emerald-600 font-black' : 'text-slate-400'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[8px] tracking-wider uppercase font-black">Proyecto</span>
          {activeTab === 'mi_proyecto' && (
            <motion.div 
              layoutId="bottom-nav-active-indicator-client"
              className="absolute bottom-0 w-8 h-0.5 bg-emerald-500 rounded-full"
            />
          )}
        </button>

        <button
          onClick={() => setActiveTab('registro')}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-colors relative py-1 px-3 rounded-xl ${
            activeTab === 'registro' ? 'text-emerald-600 font-black' : 'text-slate-400'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span className="text-[8px] tracking-wider uppercase font-black">Registro</span>
          {activeTab === 'registro' && (
            <motion.div 
              layoutId="bottom-nav-active-indicator-client"
              className="absolute bottom-0 w-8 h-0.5 bg-emerald-500 rounded-full"
            />
          )}
        </button>

        <button
          onClick={() => setActiveTab('simulador')}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-colors relative py-1 px-3 rounded-xl ${
            activeTab === 'simulador' ? 'text-emerald-600 font-black' : 'text-slate-400'
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          <span className="text-[8px] tracking-wider uppercase font-black">Simulador</span>
          {activeTab === 'simulador' && (
            <motion.div 
              layoutId="bottom-nav-active-indicator-client"
              className="absolute bottom-0 w-8 h-0.5 bg-emerald-500 rounded-full"
            />
          )}
        </button>

        <button
          onClick={() => setActiveTab('perfil')}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-colors relative py-1 px-3 rounded-xl ${
            activeTab === 'perfil' ? 'text-emerald-600 font-black' : 'text-slate-400'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[8px] tracking-wider uppercase font-black">Perfil</span>
          {activeTab === 'perfil' && (
            <motion.div 
              layoutId="bottom-nav-active-indicator-client"
              className="absolute bottom-0 w-8 h-0.5 bg-emerald-500 rounded-full"
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

      {/* ------------------- EXPEDIENTE DIGITAL DE CONTRATO DIRECTO MODAL ------------------- */}
      <AnimatePresence>
        {isSigningModalOpen && activeProject && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col relative"
            >
              {/* Header */}
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <PenTool className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wide text-white">Firma de Contrato Digital</h3>
                    <p className="text-[9px] text-slate-400 font-extrabold uppercase font-mono">SOLUX GREEN • EXPEDIENTE DE {activeProject.clientName.toUpperCase()}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSigningModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 md:p-6 space-y-4 text-xs">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Términos y Condiciones del Servicio</span>
                <div className="h-28 overflow-y-auto border border-slate-150 rounded-xl bg-slate-50 p-3 text-slate-500 leading-relaxed font-semibold font-mono text-[9px] select-none">
                  CONTRATO DE ADHESIÓN DE ENERGÍA SUSTENTABLE SOLUX GREEN S.A. DE C.V.<br/><br/>
                  1. DECLARACIONES: Solux Green declara contar con equipos certificados bajo estándar FIDE y ANCE de alta eficiencia (550W), garantizados por 25 años contra degradación lineal.<br/><br/>
                  2. OBJETO: Instalación y conexión bidireccional de un sistema de generación fotovoltaica interconectada a la red de CFE en el domicilio indicado en el levantamiento técnico.<br/><br/>
                  3. AHORROS: Se proyecta una reducción del gasto de consumo bimonthly tradicional de un aproximado del 95%, garantizando una tarifa fija de servicio mínimo bimestral de aproximadamente $54 MXN.<br/><br/>
                  Al dibujar tu firma en el panel de abajo, declaras estar de acuerdo con las cláusulas técnicas, los términos de instalación y autorizas el avance de la obra.
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Dibuja tu Firma Legal *</label>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2">
                    <canvas
                      ref={canvasRef}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="w-full h-28 bg-white border border-slate-150 rounded-lg cursor-crosshair touch-none"
                    />
                    <div className="flex justify-between items-center mt-2 px-1">
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                        {hasSigned ? '✏️ Firma registrada' : 'Firma con tu mouse o dedo'}
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
              </div>

              {/* Footer */}
              <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsSigningModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-250 text-slate-700 font-extrabold text-[9px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSignature}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[9px] uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  Confirmar Firma Legal y Avanzar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lightbox Zoom Modal */}
      {zoomedImage && (
        <div 
          id="client-lightbox"
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
