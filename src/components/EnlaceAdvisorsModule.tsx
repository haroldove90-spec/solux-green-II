import React, { useState, useMemo } from 'react';
import { 
  Users, UserPlus, Phone, Share2, Copy, Check, Sparkles, 
  Key, Mail, MapPin, Clock, Search, ShieldCheck, 
  RefreshCw, Edit2, AlertCircle, CheckCircle2, MessageCircle,
  CreditCard, Building2, LogIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SolarProject, User } from '../types';
import { upsertUser } from '../supabaseService';
import { formatWhatsAppPhone } from '../phoneUtils';

interface EnlaceAdvisorsModuleProps {
  users: any[];
  currentUser: any;
  solarProjects: SolarProject[];
  onUpdateUsers?: (users: any[] | ((prev: any[]) => any[])) => void;
  onDeleteUser?: (id: string) => void;
  onTriggerNotification?: (title: string, message: string, role: string, userId?: string) => void;
  onSwitchUser?: (user: any) => void;
  isOfflineMode?: boolean;
}

export default function EnlaceAdvisorsModule({
  users = [],
  currentUser,
  solarProjects = [],
  onUpdateUsers,
  onTriggerNotification,
  onSwitchUser
}: EnlaceAdvisorsModuleProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterScope, setFilterScope] = useState<'mis_asesores' | 'todos'>('mis_asesores');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAdvisorId, setEditingAdvisorId] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [prospectingAreas, setProspectingAreas] = useState('');
  const [workShift, setWorkShift] = useState('Tiempo completo');
  const [referralCode, setReferralCode] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Bank Account State
  const [bankAccountHolder, setBankAccountHolder] = useState('');
  const [bankName, setBankName] = useState('BBVA México');
  const [bankClabe, setBankClabe] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [copiedInviteLink, setCopiedInviteLink] = useState(false);
  const [isUsernameManuallyEdited, setIsUsernameManuallyEdited] = useState(false);

  // Credential Share Modal / Banner state
  const [lastSavedAdvisor, setLastSavedAdvisor] = useState<any | null>(null);
  const [copiedCreds, setCopiedCreds] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Auto-generate helper utilities
  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let pass = 'Solux#';
    for (let i = 0; i < 4; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
  };

  const generateReferralCodeForName = (name: string, uname: string) => {
    const clean = (name || uname || 'ENL').replace(/[^a-zA-Z]/g, '').toUpperCase();
    const tag = clean.slice(0, 4) || 'ENL';
    const rand = Math.floor(100 + Math.random() * 900);
    return `ENLACE-${tag}${rand}-MX`;
  };

  // Helper to open form for a new advisor
  const handleOpenNewForm = () => {
    setEditingAdvisorId(null);
    setFullName('');
    setWhatsapp('');
    setUsername('');
    setEmail('');
    setMunicipio('');
    setProspectingAreas('');
    setWorkShift('Tiempo completo');
    setReferralCode(generateReferralCodeForName('', ''));
    generatePassword();
    setBankAccountHolder('');
    setBankName('BBVA México');
    setBankClabe('');
    setAccountNumber('');
    setFormError(null);
    setIsUsernameManuallyEdited(false);
    setIsFormOpen(true);
  };

  // Helper to edit existing advisor
  const handleOpenEditForm = (advisor: any) => {
    setEditingAdvisorId(advisor.id);
    setFullName(advisor.fullName || '');
    setWhatsapp(advisor.whatsapp || advisor.phone || '');
    setUsername(advisor.username || '');
    setPassword(advisor.password || '');
    setEmail(advisor.email || '');
    setMunicipio(advisor.municipio || '');
    setProspectingAreas(advisor.prospectingAreas || '');
    setWorkShift(advisor.workShift || 'Tiempo completo');
    setReferralCode(advisor.referralCode || '');
    setBankAccountHolder(advisor.bankAccountHolder || advisor.fullName || '');
    setBankName(advisor.bankName || 'BBVA México');
    setBankClabe(advisor.bankClabe || '');
    setAccountNumber(advisor.accountNumber || '');
    setFormError(null);
    setIsUsernameManuallyEdited(true);
    setIsFormOpen(true);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  // When typing Full Name, automatically suggest username & referral code if empty
  const handleFullNameChange = (val: string) => {
    setFullName(val);
    if (!editingAdvisorId) {
      const slug = val
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, '_')
        .replace(/__+/g, '_')
        .replace(/^_|_$/g, '');
      
      const shouldUpdateUsername = 
        !isUsernameManuallyEdited ||
        !username || 
        username.toLowerCase() === 'gustavo' ||
        username.toLowerCase() === 'admin' ||
        username === slug.slice(0, -1) || 
        username.startsWith(slug.slice(0, 3));

      if (shouldUpdateUsername) {
        setUsername(slug);
        if (!email || email.includes('@soluxgreen.com.mx')) {
          setEmail(slug ? `${slug}@soluxgreen.com.mx` : '');
        }
      }
      if (!referralCode || referralCode.startsWith('ENLACE-')) {
        setReferralCode(generateReferralCodeForName(val, slug));
      }
      if (!password || password === 'SOLUX2026' || password === 'password123') {
        generatePassword();
      }
    }
  };

  // Save advisor handler
  const handleSaveAdvisor = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = fullName.trim();
    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();
    const cleanPhone = whatsapp.replace(/\D/g, '');

    if (!cleanName) {
      setFormError('El nombre completo es obligatorio.');
      return;
    }
    if (cleanPhone.length < 10) {
      setFormError('Ingresa un teléfono WhatsApp válido de 10 dígitos.');
      return;
    }
    if (!cleanUsername) {
      setFormError('El nombre de usuario es obligatorio para el inicio de sesión.');
      return;
    }
    if (!cleanPassword || cleanPassword.length < 4) {
      setFormError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    // Check username uniqueness
    const existing = users.find(u => u.username?.toLowerCase() === cleanUsername && u.id !== editingAdvisorId);
    if (existing) {
      setFormError(`El usuario "${cleanUsername}" ya existe en el sistema. Elige otro diferente.`);
      return;
    }

    const nowIso = new Date().toISOString();
    const advisorId = editingAdvisorId || `usr_enl_${Date.now()}`;
    const code = referralCode.trim() || generateReferralCodeForName(cleanName, cleanUsername);

    const advisorData: User = {
      id: advisorId,
      username: cleanUsername,
      password: cleanPassword,
      pin: '1234',
      fullName: cleanName,
      whatsapp: cleanPhone,
      email: email.trim() || `${cleanUsername}@soluxgreen.com.mx`,
      role: 'enlace',
      parentId: currentUser?.id || 'usr_harold',
      municipio: municipio.trim() || 'Monterrey / Área Metropolitana',
      prospectingAreas: prospectingAreas.trim() || 'Zona Metropolitana',
      workShift: workShift,
      referralCode: code,
      partnerStatus: 'activo',
      bankAccountHolder: bankAccountHolder.trim() || cleanName,
      bankName: bankName.trim(),
      bankClabe: bankClabe.replace(/\D/g, '') || undefined,
      accountNumber: accountNumber.trim() || undefined,
      paymentStatusType: 'Por proyecto',
      createdAt: nowIso,
      createdDate: nowIso
    };

    // Persist to Supabase
    upsertUser(advisorData).catch(err => console.error('Error saving enlace to supabase:', err));

    if (onUpdateUsers) {
      if (editingAdvisorId) {
        onUpdateUsers(prevUsers => {
          const arr = Array.isArray(prevUsers) ? prevUsers : users;
          return arr.map(u => u.id === editingAdvisorId ? { ...u, ...advisorData } : u);
        });
      } else {
        onUpdateUsers(prevUsers => {
          const arr = Array.isArray(prevUsers) ? prevUsers : users;
          return [advisorData, ...arr.filter(u => u.id !== advisorId)];
        });
      }
    }

    if (onTriggerNotification) {
      onTriggerNotification(
        '👤 Nuevo Asesor de Enlace Registrado',
        `El asesor ${cleanName} ha sido dado de alta exitosamente con usuario @${cleanUsername}.`,
        'enlace',
        currentUser?.id
      );
    }

    setLastSavedAdvisor(advisorData);
    setIsFormOpen(false);
    setEditingAdvisorId(null);
  };

  // WhatsApp share link generator
  const getAdvisorWhatsAppShareLink = (advisor: any) => {
    const rawPhone = (advisor.whatsapp || advisor.phone || '').replace(/\D/g, '');
    const phone = rawPhone.length === 10 ? '52' + rawPhone : rawPhone;
    const portalUrl = window.location.origin;
    
    const text = `¡Hola ${advisor.fullName}! 👋 Te doy la bienvenida a *Solux Green* como *Asesor de Enlace*.

Aquí están tus credenciales para ingresar a la plataforma y registrar tus prospectos:

👤 *Usuario:* ${advisor.username}
🔑 *Contraseña:* ${advisor.password}
📱 *Rol:* Asesor de Enlace
🏷️ *Tu Código de Enlace:* ${advisor.referralCode || 'Sin código'}
🌐 *Portal de Acceso:* ${portalUrl}

💡 *¿Cómo funciona?*
1. Ingresa al portal con tu usuario y contraseña.
2. Registra los datos de tus prospectos con recibo CFE.
3. El Asesor Verde y Solux atenderán la propuesta técnica.
4. Al concretarse la instalación física, se libera tu bono de *$1,000 MXN* en tu monedero.

¡Mucho éxito en tus prospecciones! 🌱`;

    return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;
  };

  // Copy full credentials to clipboard
  const handleCopyCredentials = (advisor: any) => {
    const portalUrl = window.location.origin;
    const text = `Credenciales de Acceso Solux Green:
Nombre: ${advisor.fullName}
Usuario: ${advisor.username}
Contraseña: ${advisor.password}
Rol: Asesor de Enlace
Código: ${advisor.referralCode || 'N/A'}
Acceso: ${portalUrl}`;

    navigator.clipboard.writeText(text);
    setCopiedCreds(true);
    setTimeout(() => setCopiedCreds(false), 2500);
  };

  // Copy individual referral code
  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // Filtered advisors
  const enlaceAdvisors = useMemo(() => {
    return users.filter(u => {
      if (u.role !== 'enlace') return false;
      
      if (filterScope === 'mis_asesores') {
        const isChild = u.parentId === currentUser?.id || u.parentId === currentUser?.username;
        const isSelf = u.id === currentUser?.id;
        return isChild && !isSelf;
      }
      return u.id !== currentUser?.id;
    });
  }, [users, currentUser, filterScope]);

  const filteredAdvisors = useMemo(() => {
    if (!searchTerm.trim()) return enlaceAdvisors;
    const q = searchTerm.toLowerCase();
    return enlaceAdvisors.filter(u => 
      (u.fullName || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q) ||
      (u.whatsapp || '').includes(q) ||
      (u.municipio || '').toLowerCase().includes(q) ||
      (u.referralCode || '').toLowerCase().includes(q)
    );
  }, [enlaceAdvisors, searchTerm]);

  // Advisor statistics
  const teamProjectsCount = useMemo(() => {
    const codes = new Set(enlaceAdvisors.map(a => a.referralCode).filter(Boolean));
    const ids = new Set(enlaceAdvisors.map(a => a.id));
    return solarProjects.filter(p => codes.has(p.referrerCode) || (p.createdBy && ids.has(p.createdBy)) || ((p as any).created_by && ids.has((p as any).created_by))).length;
  }, [solarProjects, enlaceAdvisors]);

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto" id="enlace-advisors-module-root">
      
      {/* 1. HEADER & HERO BENTO */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-pink-500/10 to-emerald-500/5 rounded-full -mr-20 -mt-20 pointer-events-none blur-2xl"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-pink-50 text-pink-700 border border-pink-200/80 rounded-full text-[10px] font-black uppercase tracking-wider">
                <Users className="w-3.5 h-3.5 text-pink-600" />
                <span>Gestión de Equipo Enlace</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400 font-mono">
                Líder: {currentUser?.fullName || 'Enlace'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
              Red de Asesores de Enlace
            </h2>
            <p className="text-xs text-slate-600 max-w-2xl font-medium leading-relaxed">
              Registra y da de alta a tus Asesores de Enlace. Al registrarse, se les genera automáticamente su usuario, contraseña y código de referido, listos para <span className="font-bold text-emerald-700">compartir sus credenciales por WhatsApp</span> con un solo clic.
            </p>
          </div>

          <div className="shrink-0 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={handleOpenNewForm}
              className="px-5 py-3.5 bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-pink-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Registrar Nuevo Asesor</span>
            </button>
          </div>
        </div>

        {/* Bento Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 sm:p-4">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Asesores Registrados</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-slate-800 font-mono">{enlaceAdvisors.length}</span>
              <span className="text-[10px] font-bold text-slate-500">en tu red</span>
            </div>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-3.5 sm:p-4">
            <span className="text-[9px] font-black text-emerald-700 uppercase tracking-wider block">Asesores Activos</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-emerald-700 font-mono">
                {enlaceAdvisors.filter(a => a.partnerStatus !== 'suspendido').length}
              </span>
              <span className="text-[10px] font-bold text-emerald-600">disponibles</span>
            </div>
          </div>

          <div className="bg-pink-50/60 border border-pink-100 rounded-2xl p-3.5 sm:p-4">
            <span className="text-[9px] font-black text-pink-700 uppercase tracking-wider block">Prospectos Generados</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-pink-700 font-mono">{teamProjectsCount}</span>
              <span className="text-[10px] font-bold text-pink-600">referidos</span>
            </div>
          </div>

          <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-3.5 sm:p-4">
            <span className="text-[9px] font-black text-amber-800 uppercase tracking-wider block">Bono por Instalación</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-amber-700 font-mono">$1,000</span>
              <span className="text-[10px] font-bold text-amber-600">MXN c/u</span>
            </div>
          </div>
        </div>

        {/* --- LINK ÚNICO DE REGISTRO PARA COMPARTIR --- */}
        <div className="mt-6 pt-6 border-t border-slate-100 bg-gradient-to-r from-pink-50/80 via-white to-emerald-50/80 border border-pink-100/90 rounded-2xl p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Share2 className="w-3 h-3" /> Enlace Único de Registro
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-500">
                  Ref: {currentUser?.referralCode || currentUser?.username || 'OFICIAL'}
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-900 uppercase">
                Invita a Nuevos Asesores de Enlace con tu Link Personal
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Comparte este enlace. Al abrirlo, el formulario solicitará su <strong className="text-slate-800">nombre, teléfono WhatsApp y cuenta bancaria (Banco y CLABE)</strong> para sus depósitos de comisiones, quedando <strong className="text-pink-700">vinculado automáticamente a tu red</strong> en la base de datos.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
              <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-700 select-all truncate max-w-xs shadow-xs">
                {typeof window !== 'undefined' ? `${window.location.origin}/?registro=enlace&ref=${encodeURIComponent(currentUser?.referralCode || currentUser?.username || currentUser?.id || 'asesor')}` : ''}
              </div>

              <button
                type="button"
                onClick={() => {
                  const url = `${window.location.origin}/?registro=enlace&ref=${encodeURIComponent(currentUser?.referralCode || currentUser?.username || currentUser?.id || 'asesor')}`;
                  navigator.clipboard.writeText(url);
                  setCopiedInviteLink(true);
                  setTimeout(() => setCopiedInviteLink(false), 2500);
                }}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
              >
                {copiedInviteLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-300" />}
                <span>{copiedInviteLink ? '¡Link Copiado!' : 'Copiar Link'}</span>
              </button>

              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `¡Hola! 👋 Te invito a formar parte de mi equipo como *Asesor de Enlace* en *Solux Green*. 

🌱 Solo recomienda a conocidos o empresas interesadas en ahorrar hasta un 98% en su recibo CFE con paneles solares. Nosotros nos encargamos de cotizar e instalar.
💰 Recibes un bono de *$1,000 MXN* por cada cliente instalado.

📝 Regístrate aquí con tus datos y cuenta bancaria para tus depósitos directos:
${typeof window !== 'undefined' ? `${window.location.origin}/?registro=enlace&ref=${encodeURIComponent(currentUser?.referralCode || currentUser?.username || currentUser?.id || 'asesor')}` : ''}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Compartir en WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SUCCESS SHARE MODAL / BANNER (AFTER CREATING OR WHEN SHARING) */}
      <AnimatePresence>
        {lastSavedAdvisor && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="bg-emerald-50 border-2 border-emerald-400/80 rounded-3xl p-5 sm:p-7 shadow-xl space-y-4 relative overflow-hidden"
            id="advisor-credentials-success-banner"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-emerald-950 uppercase">
                    ¡Credenciales del Asesor Generadas con Éxito!
                  </h3>
                  <p className="text-xs text-emerald-800 font-medium">
                    Comparte de inmediato el acceso por WhatsApp al asesor para que inicie sesión y empiece a recomendar prospectos.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLastSavedAdvisor(null)}
                className="self-end sm:self-auto px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-black uppercase tracking-wider cursor-pointer"
              >
                ✕ Cerrar
              </button>
            </div>

            {/* Credential summary card */}
            <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-xs">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-[8px] font-black text-slate-400 uppercase block tracking-wider">Nombre del Asesor</span>
                  <span className="font-extrabold text-slate-800 block mt-0.5 truncate">{lastSavedAdvisor.fullName}</span>
                </div>
                <div>
                  <span className="text-[8px] font-black text-slate-400 uppercase block tracking-wider">Usuario Login</span>
                  <span className="font-mono font-black text-emerald-700 block mt-0.5 select-all">{lastSavedAdvisor.username}</span>
                </div>
                <div>
                  <span className="text-[8px] font-black text-slate-400 uppercase block tracking-wider">Contraseña</span>
                  <span className="font-mono font-black text-slate-900 block mt-0.5 select-all">{lastSavedAdvisor.password}</span>
                </div>
                <div>
                  <span className="text-[8px] font-black text-slate-400 uppercase block tracking-wider">Código de Enlace</span>
                  <span className="font-mono font-black text-pink-600 block mt-0.5 select-all">{lastSavedAdvisor.referralCode}</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-600">
                <span>
                  🌐 Portal Web de Acceso: <strong className="font-mono text-emerald-700 select-all">{window.location.origin}</strong>
                </span>
                <span className="text-slate-400 text-[10px]">
                  WhatsApp Destino: <strong className="text-slate-700 font-mono">{lastSavedAdvisor.whatsapp || 'No registrado'}</strong>
                </span>
              </div>
            </div>

            {/* Action buttons for WhatsApp */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => handleCopyCredentials(lastSavedAdvisor)}
                className="w-full sm:w-auto px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                {copiedCreds ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                <span>{copiedCreds ? '¡Credenciales Copiadas!' : 'Copiar Credenciales'}</span>
              </button>

              <a
                href={getAdvisorWhatsAppShareLink(lastSavedAdvisor)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>📲 Compartir Credenciales por WhatsApp</span>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. ADVISOR REGISTRATION & EDITING FORM */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form 
              onSubmit={handleSaveAdvisor}
              autoComplete="off"
              className="bg-white border-2 border-pink-300/80 rounded-3xl p-5 sm:p-7 shadow-lg space-y-5"
              id="advisor-registration-form"
            >
              {/* Anti-browser autofill traps */}
              <input type="text" name="anti_autofill_enlace_user" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
              <input type="password" name="anti_autofill_enlace_pass" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center shrink-0">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-slate-800 uppercase">
                      {editingAdvisorId ? 'Editar Asesor de Enlace' : 'Formulario: Registrar Nuevo Asesor de Enlace'}
                    </h3>
                    <span className="text-[10px] text-slate-500 font-medium">
                      El asesor quedará asignado a tu red y se le otorgarán permisos de Enlace para prospección.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingAdvisorId(null);
                  }}
                  className="text-xs font-black uppercase text-slate-400 hover:text-slate-600 px-3 py-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
              </div>

              {formError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* Nombre Completo */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block">
                    Nombre Completo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => handleFullNameChange(e.target.value)}
                    placeholder="Ej. Lic. Fernando Salgado"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-pink-500 focus:bg-white transition-all"
                  />
                </div>

                {/* WhatsApp */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block">
                    Teléfono WhatsApp (10 Dígitos) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={whatsapp}
                      onChange={e => setWhatsapp(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="Ej. 5512345678"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-pink-500 focus:bg-white transition-all"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                  <span className="text-[9px] text-slate-400">Se usará para enviarle sus credenciales por WhatsApp.</span>
                </div>

                {/* Username */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block">
                    Usuario de Acceso <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="solux_enlace_mod_username"
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      required
                      value={username}
                      onChange={e => {
                        setIsUsernameManuallyEdited(true);
                        setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''));
                      }}
                      placeholder="Ej. fernando_salgado"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-pink-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Contraseña */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block">
                      Contraseña <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="text-[9px] font-black text-pink-600 hover:text-pink-700 flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-2.5 h-2.5" /> Generar
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      name="solux_enlace_mod_password"
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Contraseña del asesor"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-pink-500 focus:bg-white transition-all"
                    />
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                {/* Correo Electrónico */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block">
                    Correo Electrónico (Opcional)
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="correo@soluxgreen.com.mx"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-pink-500 focus:bg-white transition-all"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                {/* Código de Enlace */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block">
                      Código de Enlace Asignado
                    </label>
                    <button
                      type="button"
                      onClick={() => setReferralCode(generateReferralCodeForName(fullName, username))}
                      className="text-[9px] font-black text-pink-600 hover:text-pink-700 flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-2.5 h-2.5" /> Nuevo
                    </button>
                  </div>
                  <input
                    type="text"
                    value={referralCode}
                    onChange={e => setReferralCode(e.target.value.toUpperCase())}
                    placeholder="Ej. ENLACE-FERN-MX"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-pink-700 focus:outline-none focus:border-pink-500 focus:bg-white transition-all"
                  />
                </div>

                {/* Municipio / Zona */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block">
                    Municipio / Ciudad Principal
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={municipio}
                      onChange={e => setMunicipio(e.target.value)}
                      placeholder="Ej. Monterrey / San Pedro"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-pink-500 focus:bg-white transition-all"
                    />
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                {/* Zonas de Prospección */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block">
                    Colonias / Zonas de Prospección
                  </label>
                  <input
                    type="text"
                    value={prospectingAreas}
                    onChange={e => setProspectingAreas(e.target.value)}
                    placeholder="Ej. Cumbres, San Jerónimo, Mitras"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-pink-500 focus:bg-white transition-all"
                  />
                </div>

                {/* Jornada */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block">
                    Jornada Laboral / Modalidad
                  </label>
                  <div className="relative">
                    <select
                      value={workShift}
                      onChange={e => setWorkShift(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-pink-500 focus:bg-white transition-all cursor-pointer"
                    >
                      <option value="Tiempo completo">Tiempo completo</option>
                      <option value="Medio tiempo">Medio tiempo</option>
                      <option value="Fines de semana">Fines de semana</option>
                      <option value="Comisionista libre">Comisionista libre / Remoto</option>
                    </select>
                    <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

              </div>

              {/* SECCIÓN DATOS BANCARIOS PARA PAGO DE COMISIONES */}
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 bg-amber-50/50 p-4 rounded-2xl border border-amber-200/60">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-800 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-950">
                      Cuenta Bancaria para Pago de Bonos y Comisiones
                    </h4>
                    <p className="text-[10px] text-amber-800/80">
                      Aquí se le depositarán los $1,000 MXN por cada proyecto solar instalado.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-600 block">
                      Nombre del Titular
                    </label>
                    <input
                      type="text"
                      value={bankAccountHolder}
                      onChange={e => setBankAccountHolder(e.target.value)}
                      placeholder="Nombre como aparece en banco"
                      className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-600 block">
                      Banco Receptor
                    </label>
                    <select
                      value={bankName}
                      onChange={e => setBankName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 transition-all cursor-pointer"
                    >
                      <option value="BBVA México">BBVA México</option>
                      <option value="Santander">Santander</option>
                      <option value="Banorte">Banorte</option>
                      <option value="Citibanamex">Citibanamex</option>
                      <option value="HSBC México">HSBC México</option>
                      <option value="Scotiabank">Scotiabank</option>
                      <option value="Banco Azteca">Banco Azteca</option>
                      <option value="Nu México">Nu México</option>
                      <option value="Mercado Pago / STP">Mercado Pago / STP</option>
                      <option value="Hey Banco / Banregio">Hey Banco / Banregio</option>
                      <option value="Otro Banco">Otro Banco</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[9px] font-black uppercase tracking-wider text-slate-600 block">
                        CLABE Interbancaria
                      </label>
                      <span className={`text-[9px] font-mono font-black ${bankClabe.replace(/\D/g, '').length === 18 ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {bankClabe.replace(/\D/g, '').length}/18
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={18}
                      value={bankClabe}
                      onChange={e => setBankClabe(e.target.value.replace(/\D/g, ''))}
                      placeholder="18 dígitos"
                      className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-amber-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-600 block">
                      Cuenta / Tarjeta (Opcional)
                    </label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={e => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="16 dígitos tarjeta o 10 cuenta"
                      className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-amber-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Rol asignado: Asesor de Enlace (Comisión $1,000 MXN / instalación)
                </span>

                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFormOpen(false);
                      setEditingAdvisorId(null);
                    }}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{editingAdvisorId ? 'Guardar Cambios' : 'Guardar y Generar Credenciales'}</span>
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. SEARCH & FILTER CONTROLS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, usuario, teléfono o código..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-pink-500 focus:bg-white transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => setFilterScope('mis_asesores')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              filterScope === 'mis_asesores'
                ? 'bg-pink-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            Mis Asesores ({enlaceAdvisors.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterScope('todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              filterScope === 'todos'
                ? 'bg-pink-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            Todos los Enlaces
          </button>
        </div>
      </div>

      {/* 5. ADVISORS LIST / DIRECTORY */}
      {filteredAdvisors.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-8 sm:p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-pink-50 border border-pink-100 text-pink-600 flex items-center justify-center mx-auto shadow-xs">
            <Users className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-black text-slate-800 uppercase">
              {searchTerm ? 'No se encontraron asesores con ese criterio' : 'Aún no tienes asesores de enlace registrados'}
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {searchTerm 
                ? 'Intenta con otro nombre, usuario o teléfono en el buscador.'
                : 'Empieza a armar tu red de prospección. Haz clic en "Registrar Nuevo Asesor" para dar de alta a tu primer miembro y compartirle sus credenciales por WhatsApp.'}
            </p>
          </div>
          {!searchTerm && (
            <button
              type="button"
              onClick={handleOpenNewForm}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-md mt-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Registrar mi Primer Asesor</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAdvisors.map((advisor, idx) => {
            const advisorProjects = solarProjects.filter(p => 
              p.referrerCode === advisor.referralCode || p.createdBy === advisor.id || ((p as any).created_by && (p as any).created_by === advisor.id)
            );
            const isSelf = advisor.id === currentUser?.id;

            return (
              <div
                key={`adv_${advisor.id || advisor.username}_${idx}`}
                className="bg-white border border-slate-200 hover:border-pink-300 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all space-y-4 relative flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top card header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 text-white font-black text-base flex items-center justify-center shrink-0 shadow-xs uppercase">
                        {(advisor.fullName || 'A').slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] font-black uppercase tracking-wider text-pink-600 block">
                          Asesor de Enlace
                        </span>
                        <h4 className="text-sm font-black text-slate-900 truncate leading-tight">
                          {advisor.fullName}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-400 font-bold block">
                          @{advisor.username}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenEditForm(advisor)}
                      title="Editar datos del asesor"
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Details grid */}
                  <div className="bg-slate-50/70 rounded-2xl p-3 space-y-2 border border-slate-100 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">WhatsApp:</span>
                      <a
                        href={`https://wa.me/${formatWhatsAppPhone(advisor.whatsapp)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono font-black text-emerald-700 hover:underline flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3 text-emerald-600" />
                        <span>{advisor.whatsapp || 'No registrado'}</span>
                      </a>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Código:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-pink-700 bg-pink-50 px-2 py-0.5 rounded-md border border-pink-100">
                          {advisor.referralCode || 'Sin código'}
                        </span>
                        {advisor.referralCode && (
                          <button
                            type="button"
                            onClick={() => handleCopyCode(advisor.referralCode, advisor.id)}
                            className="p-1 rounded text-slate-400 hover:text-pink-600 cursor-pointer"
                            title="Copiar código"
                          >
                            {copiedCodeId === advisor.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {advisor.municipio && (
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Zona:</span>
                        <span className="font-bold truncate max-w-[140px]">{advisor.municipio}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Modalidad:</span>
                      <span className="font-medium text-slate-700">{advisor.workShift || 'Tiempo completo'}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/50">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Prospectos:</span>
                      <span className="font-black text-slate-800 font-mono">
                        {advisorProjects.length} referidos
                      </span>
                    </div>

                    {/* Datos Bancarios para Comisiones */}
                    <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-wider text-amber-800 flex items-center gap-1">
                          <CreditCard className="w-3 h-3 text-amber-600" />
                          <span>Comisiones:</span>
                        </span>
                        <span className="font-bold text-[10px] text-amber-900 truncate max-w-[120px]">
                          {advisor.bankName || 'Por registrar'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-slate-500 font-mono">CLABE:</span>
                        <div className="flex items-center gap-1">
                          <span className="font-mono font-bold text-[10px] text-slate-800">
                            {advisor.bankClabe ? `${advisor.bankClabe.slice(0, 4)}••••${advisor.bankClabe.slice(-4)}` : 'Sin CLABE'}
                          </span>
                          {advisor.bankClabe && (
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(advisor.bankClabe);
                                setCopiedCodeId(`clabe_${advisor.id}`);
                                setTimeout(() => setCopiedCodeId(null), 2000);
                              }}
                              className="p-1 text-amber-700 hover:text-amber-900 cursor-pointer"
                              title="Copiar CLABE interbancaria completa"
                            >
                              {copiedCodeId === `clabe_${advisor.id}` ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                      {advisor.bankAccountHolder && (
                        <div className="text-[9px] text-slate-500 truncate">
                          Titular: <span className="text-slate-700 font-semibold">{advisor.bankAccountHolder}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom WhatsApp Share & Actions */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyCredentials(advisor)}
                      className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copiar Acceso</span>
                    </button>

                    <a
                      href={getAdvisorWhatsAppShareLink(advisor)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                  
                  {!isSelf && onSwitchUser && (
                    <button
                      type="button"
                      onClick={() => onSwitchUser(advisor)}
                      className="w-full py-2.5 px-3 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98]"
                      title={`Ingresar y ver el sistema como ${advisor.fullName}`}
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Acceder a su Sesión</span>
                    </button>
                  )}

                  {isSelf && (
                    <span className="text-[8px] text-pink-600 font-black uppercase tracking-wider block text-center">
                      ★ Tu cuenta principal de enlace
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
