import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, User, Lock, Phone, Mail, MapPin, 
  CheckCircle2, AlertCircle, Eye, EyeOff, Sparkles, 
  ArrowLeft, CreditCard, Building2, Share2, Copy, Check,
  Send, RefreshCw
} from 'lucide-react';
import { SOLUX_LOGO_URL, SOLUX_LOGO_FALLBACK } from '../logoConfig';
import { User as UserType } from '../types';
import { upsertUser } from '../supabaseService';

interface PublicEnlaceRegistrationProps {
  users: any[];
  onRegisterSuccess: (newUser: any) => void;
  onCancel: () => void;
  onLoginSuccess?: (user: any) => void;
  onTriggerNotification?: (title: string, message: string, role: string, userId?: string) => void;
}

const POPULAR_BANKS = [
  'BBVA México',
  'Santander',
  'Banorte',
  'Citibanamex',
  'HSBC México',
  'Scotiabank',
  'Banco Azteca',
  'Nu México',
  'Mercado Pago / STP',
  'Hey Banco / Banregio',
  'Inbursa',
  'Otro Banco'
];

export default function PublicEnlaceRegistration({
  users = [],
  onRegisterSuccess,
  onCancel,
  onLoginSuccess,
  onTriggerNotification
}: PublicEnlaceRegistrationProps) {
  // Extract referral advisor from URL params
  const [refParam, setRefParam] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      let ref = urlParams.get('ref') || urlParams.get('asesor') || urlParams.get('invitado_por') || '';
      
      // Fallback check hash for #/registro-enlace?ref=...
      if (!ref && window.location.hash.includes('ref=')) {
        const hashQuery = window.location.hash.split('?')[1];
        if (hashQuery) {
          const hashParams = new URLSearchParams(hashQuery);
          ref = hashParams.get('ref') || '';
        }
      }
      setRefParam(ref);
    }
  }, []);

  // Find inviting Asesor Verde
  const availableVerdeAdvisors = useMemo(() => {
    return users.filter(u => u.role === 'comercial' || u.role === 'admin');
  }, [users]);

  const matchedAdvisor = useMemo(() => {
    if (!refParam) return null;
    const cleanRef = refParam.trim().toLowerCase();
    return users.find(u => 
      u.id?.toLowerCase() === cleanRef ||
      u.username?.toLowerCase() === cleanRef ||
      (u.referralCode && u.referralCode.toLowerCase() === cleanRef)
    ) || null;
  }, [users, refParam]);

  const [selectedAdvisorId, setSelectedAdvisorId] = useState<string>('');

  useEffect(() => {
    if (matchedAdvisor) {
      setSelectedAdvisorId(matchedAdvisor.id);
    } else if (availableVerdeAdvisors.length > 0 && !selectedAdvisorId) {
      setSelectedAdvisorId(availableVerdeAdvisors[0].id);
    }
  }, [matchedAdvisor, availableVerdeAdvisors]);

  // Form State
  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [prospectingAreas, setProspectingAreas] = useState('');

  // Credentials State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUsernameManuallyEdited, setIsUsernameManuallyEdited] = useState(false);

  // Bank Details State
  const [bankAccountHolder, setBankAccountHolder] = useState('');
  const [bankName, setBankName] = useState('BBVA México');
  const [bankClabe, setBankClabe] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  // Form helpers
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<any | null>(null);
  const [copiedCreds, setCopiedCreds] = useState(false);

  // Anti-autofill cleanup: if browser filled credentials of an existing administrator on mount, clear them
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!fullName) {
        setUsername(prev => (prev.toLowerCase() === 'gustavo' || prev.toLowerCase() === 'admin' ? '' : prev));
        setPassword(prev => (prev === 'SOLUX2026' || prev === 'password123' ? '' : prev));
        setConfirmPassword(prev => (prev === 'SOLUX2026' || prev === 'password123' ? '' : prev));
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [fullName]);

  const generateAutoPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let pass = 'Solux#';
    for (let i = 0; i < 4; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
    setConfirmPassword(pass);
    return pass;
  };

  // Auto-generate username from fullName
  const handleFullNameChange = (val: string) => {
    setFullName(val);
    if (!bankAccountHolder || bankAccountHolder === fullName) {
      setBankAccountHolder(val);
    }
    const cleanSlug = val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '_')
      .replace(/__+/g, '_')
      .replace(/^_|_$/g, '');

    const shouldAutoUpdateUsername = 
      !isUsernameManuallyEdited || 
      !username || 
      username.toLowerCase() === 'gustavo' || 
      username.toLowerCase() === 'admin' ||
      username === cleanSlug.slice(0, -1) || 
      username.startsWith(cleanSlug.slice(0, 3));

    if (shouldAutoUpdateUsername) {
      setUsername(cleanSlug);
      if (!email || email.includes('@soluxgreen.com.mx')) {
        setEmail(cleanSlug ? `${cleanSlug}@soluxgreen.com.mx` : '');
      }
    }

    // If password was autofilled with admin password 'SOLUX2026' or is empty, generate a fresh unique password for this new user
    if (!password || password === 'SOLUX2026' || password === 'password123') {
      generateAutoPassword();
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = fullName.trim();
    const cleanPhone = whatsapp.replace(/\D/g, '');
    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();
    const cleanClabe = bankClabe.replace(/\D/g, '');

    if (!cleanName) {
      setFormError('Por favor ingresa tu nombre completo.');
      return;
    }

    if (cleanPhone.length < 10) {
      setFormError('Ingresa un número de WhatsApp válido de 10 dígitos.');
      return;
    }

    if (!cleanUsername) {
      setFormError('Ingresa un nombre de usuario para acceder al CRM.');
      return;
    }

    if (!password || password.length < 4) {
      setFormError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Las contraseñas no coinciden. Verifícalas cuidadosamente.');
      return;
    }

    if (cleanClabe && cleanClabe.length !== 18) {
      setFormError('La CLABE interbancaria debe tener exactamente 18 dígitos.');
      return;
    }

    // Check unique username
    const exists = users.find(u => u.username?.toLowerCase() === cleanUsername);
    if (exists) {
      setFormError(`El usuario "${cleanUsername}" ya está en uso. Por favor elige otro.`);
      return;
    }

    setIsSubmitting(true);

    try {
      // Determine parent Asesor Verde
      const parentAdvisor = users.find(u => u.id === selectedAdvisorId) || matchedAdvisor || availableVerdeAdvisors[0];
      const parentId = parentAdvisor?.id || 'usr_verde';
      const parentName = parentAdvisor?.fullName || parentAdvisor?.username || 'Asesor Verde';

      // Generate unique referral code
      const nameTag = (cleanName.replace(/[^a-zA-Z]/g, '').slice(0, 4) || 'ENL').toUpperCase();
      const randNum = Math.floor(100 + Math.random() * 900);
      const uniqueCode = `ENLACE-${nameTag}${randNum}-MX`;

      const nowIso = new Date().toISOString();
      const newAdvisorUser: UserType = {
        id: `usr_enl_${Date.now()}`,
        username: cleanUsername,
        password: password,
        fullName: cleanName,
        whatsapp: cleanPhone,
        email: cleanEmail || `${cleanUsername}@soluxgreen.com.mx`,
        role: 'enlace',
        parentId: parentId,
        municipio: municipio.trim() || 'Monterrey / Área Metropolitana',
        prospectingAreas: prospectingAreas.trim() || 'Zona Metropolitana',
        workShift: 'Tiempo completo',
        referralCode: uniqueCode,
        partnerStatus: 'activo',
        // Bank details
        bankAccountHolder: bankAccountHolder.trim() || cleanName,
        bankName: bankName.trim(),
        bankClabe: cleanClabe || undefined,
        accountNumber: accountNumber.trim() || undefined,
        paymentStatusType: 'Por proyecto',
        createdAt: nowIso,
        createdDate: nowIso
      };

      // Save to Supabase
      await upsertUser(newAdvisorUser);

      // Trigger notifications
      if (onTriggerNotification) {
        onTriggerNotification(
          '🎉 ¡Nuevo Asesor de Enlace Registrado!',
          `${cleanName} se ha registrado en tu red de enlaces con usuario @${cleanUsername}.`,
          'comercial',
          parentId
        );
        onTriggerNotification(
          '👤 Nuevo Asesor de Enlace en el Sistema',
          `El asesor ${cleanName} se unió a la red del Asesor Verde ${parentName}.`,
          'admin'
        );
      }

      setRegisteredUser(newAdvisorUser);
      setIsSubmitting(false);

      // Notify parent app
      onRegisterSuccess(newAdvisorUser);
    } catch (err: any) {
      console.error('Error al registrar asesor de enlace:', err);
      setFormError(`Ocurrió un error al registrarte: ${err.message || 'Intenta de nuevo.'}`);
      setIsSubmitting(false);
    }
  };

  // Copy credentials helper
  const handleCopyCredentials = () => {
    if (!registeredUser) return;
    const text = `Credenciales de Acceso Solux Green:
👤 Nombre: ${registeredUser.fullName}
🔑 Usuario: ${registeredUser.username}
🔒 Contraseña: ${registeredUser.password}
🏷️ Código de Enlace: ${registeredUser.referralCode}
🏦 Banco: ${registeredUser.bankName || 'N/A'}
💳 CLABE: ${registeredUser.bankClabe || 'N/A'}
🌐 Acceso: ${window.location.origin}`;

    navigator.clipboard.writeText(text);
    setCopiedCreds(true);
    setTimeout(() => setCopiedCreds(false), 2500);
  };

  const activeInviter = matchedAdvisor || users.find(u => u.id === selectedAdvisorId) || availableVerdeAdvisors[0];

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col font-sans relative overflow-x-hidden antialiased" id="public-enlace-reg-root">
      
      {/* Subtle Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Top Navbar */}
      <header className="relative z-10 w-full border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src={SOLUX_LOGO_URL} 
            alt="Solux Green" 
            onError={(e) => { e.currentTarget.src = SOLUX_LOGO_FALLBACK; }}
            className="h-8 sm:h-9 object-contain"
          />
          <div className="h-5 w-[1px] bg-slate-700 hidden sm:block"></div>
          <span className="hidden sm:inline-block text-[11px] font-black uppercase tracking-wider text-pink-400 bg-pink-950/60 border border-pink-800/50 px-2.5 py-0.5 rounded-full">
            Registro Oficial • Asesor de Enlace
          </span>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all border border-slate-700 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al Portal</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12">
        
        {/* SUCCESS STATE MODAL / BANNER */}
        {registeredUser ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border-2 border-emerald-500/80 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 text-center"
          >
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-3 py-1 rounded-full">
                ¡Bienvenido al Equipo!
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                ¡Registro Completado con Éxito!
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
                Hola <strong className="text-white">{registeredUser.fullName}</strong>, has sido dado de alta como <strong className="text-pink-400">Asesor de Enlace</strong> vinculado al Asesor Verde <strong className="text-emerald-400">{activeInviter?.fullName || 'Líder Solux'}</strong>.
              </p>
            </div>

            {/* Credential summary card */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 text-left max-w-lg mx-auto space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase block">Usuario</span>
                  <span className="font-mono font-black text-emerald-400 select-all text-sm">{registeredUser.username}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase block">Contraseña</span>
                  <span className="font-mono font-black text-slate-200 select-all text-sm">{registeredUser.password}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase block">Código de Enlace</span>
                  <span className="font-mono font-black text-pink-400 select-all text-sm">{registeredUser.referralCode}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase block">Cuenta CLABE para Bonos</span>
                  <span className="font-mono font-bold text-slate-300 select-all text-xs">
                    {registeredUser.bankClabe ? `${registeredUser.bankClabe.slice(0, 4)}...${registeredUser.bankClabe.slice(-4)}` : 'Por registrar'}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-700/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>Bono por Cliente Instalado:</span>
                <span className="font-black text-emerald-400 text-sm">$1,000 MXN</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="w-full sm:w-auto px-5 py-3.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl text-xs font-black uppercase tracking-wider text-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {copiedCreds ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                <span>{copiedCreds ? '¡Credenciales Copiadas!' : 'Copiar Credenciales'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onLoginSuccess) {
                    onLoginSuccess(registeredUser);
                  }
                }}
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-500 hover:to-pink-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-pink-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Ingresar de Inmediato a Mi Panel</span>
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-6">
            
            {/* INVITATION HERO BANNER */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-pink-950/70 border border-pink-700/60 rounded-full text-[10px] font-black uppercase tracking-wider text-pink-300">
                  <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                  <span>Programa Oficial de Enlaces Solux</span>
                </div>

                <div className="space-y-1">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
                    Únete como Asesor de Enlace
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                    Recomienda prospectos residenciales o comerciales interesados en paneles solares. Nosotros realizamos la cotización y la instalación, y tú ganas <strong className="text-emerald-400">$1,000 MXN de bono directo</strong> por cada cliente instalado.
                  </p>
                </div>

                {/* Inviting Advisor Info Box */}
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-black text-sm">
                      🌱
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 block">
                        Invitado Oficialmente por tu Asesor Verde
                      </span>
                      <span className="text-sm font-extrabold text-white block">
                        {activeInviter?.fullName || 'Asesor Comercial Solux'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {activeInviter?.municipio || 'Zona Metropolitana'} • Código: <strong className="font-mono text-slate-200">{activeInviter?.referralCode || activeInviter?.id || 'OFICIAL'}</strong>
                      </span>
                    </div>
                  </div>

                  {!matchedAdvisor && availableVerdeAdvisors.length > 1 && (
                    <div className="space-y-1 sm:text-right">
                      <label className="text-[9px] font-extrabold uppercase text-slate-400 block">
                        Cambiar Asesor Verde
                      </label>
                      <select
                        value={selectedAdvisorId}
                        onChange={(e) => setSelectedAdvisorId(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-200 focus:outline-none focus:border-pink-500"
                      >
                        {availableVerdeAdvisors.map((adv, idx) => (
                          <option key={`pub_adv_${adv.id || adv.username}_${idx}`} value={adv.id}>
                            {adv.fullName || adv.username} ({adv.municipio || 'Asesor'})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* REGISTRATION FORM */}
            <form onSubmit={handleSubmit} autoComplete="off" className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
              {/* Anti-browser autofill traps to prevent Chrome from injecting saved admin credentials */}
              <input type="text" name="anti_autofill_user_trap" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
              <input type="password" name="anti_autofill_pass_trap" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
              
              {formError && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-rose-950/80 border border-rose-800/80 rounded-2xl flex items-center gap-3 text-rose-200 text-xs font-bold"
                >
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  <span>{formError}</span>
                </motion.div>
              )}

              {/* SECCIÓN 1: DATOS PERSONALES */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <span className="w-6 h-6 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center font-black text-xs">1</span>
                  <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                    Datos Personales y de Contacto
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Nombre Completo <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => handleFullNameChange(e.target.value)}
                      placeholder="Ej. Juan Manuel Pérez Rodríguez"
                      className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:bg-slate-800 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      WhatsApp (10 Dígitos) <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="tel"
                        required
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="Ej. 8112345678"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:bg-slate-800 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Correo Electrónico <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="correo@ejemplo.com"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:bg-slate-800 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Municipio / Ciudad <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={municipio}
                        onChange={(e) => setMunicipio(e.target.value)}
                        placeholder="Ej. Monterrey, N.L. o CDMX"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:bg-slate-800 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Zonas o Colonias de Prospección (Opcional)
                  </label>
                  <input
                    type="text"
                    value={prospectingAreas}
                    onChange={(e) => setProspectingAreas(e.target.value)}
                    placeholder="Ej. Cumbres, San Jerónimo, San Pedro, Contry..."
                    className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:bg-slate-800 transition-all"
                  />
                </div>
              </div>

              {/* SECCIÓN 2: ACCESO AL CRM */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs">2</span>
                    <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                      Credenciales de Acceso al CRM
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={generateAutoPassword}
                    className="text-[10px] font-black text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Sugerir Contraseña
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Nombre de Usuario <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        name="new_enlace_advisor_username"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                        required
                        value={username}
                        onChange={(e) => {
                          setIsUsernameManuallyEdited(true);
                          setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''));
                        }}
                        placeholder="ej. juan_perez"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs font-mono font-bold text-emerald-400 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:bg-slate-800 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Contraseña <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="new_enlace_advisor_pass"
                        autoComplete="new-password"
                        required
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (!confirmPassword || confirmPassword === password) {
                            setConfirmPassword(e.target.value);
                          }
                        }}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-9 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:bg-slate-800 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Confirmar Contraseña <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="new_enlace_advisor_confirm_pass"
                        autoComplete="new-password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:bg-slate-800 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: CUENTA BANCARIA PARA PAGO DE COMISIONES */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs">3</span>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-amber-400" />
                      <span>Datos Bancarios para Pago de Comisiones</span>
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      Aquí se depositarán tus bonos de $1,000 MXN por cada proyecto solar instalado.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Titular */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Nombre del Titular de la Cuenta
                    </label>
                    <input
                      type="text"
                      value={bankAccountHolder}
                      onChange={(e) => setBankAccountHolder(e.target.value)}
                      placeholder="Nombre como aparece en tu banco"
                      className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:bg-slate-800 transition-all"
                    />
                  </div>

                  {/* Banco */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Banco Receptor
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <select
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-500 transition-all cursor-pointer"
                      >
                        {POPULAR_BANKS.map((b, idx) => (
                          <option key={`bank_${b}_${idx}`} value={b} className="bg-slate-900 text-white">{b}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* CLABE */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                        Cuenta CLABE Interbancaria (18 Dígitos)
                      </label>
                      <span className={`text-[9px] font-mono font-black ${
                        bankClabe.replace(/\D/g, '').length === 18 ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {bankClabe.replace(/\D/g, '').length}/18 dígitos
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={18}
                      value={bankClabe}
                      onChange={(e) => setBankClabe(e.target.value.replace(/\D/g, ''))}
                      placeholder="012180012345678901"
                      className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs font-mono font-bold text-amber-300 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:bg-slate-800 transition-all"
                    />
                  </div>

                  {/* Número de Cuenta o Tarjeta */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Número de Cuenta o Tarjeta (Opcional)
                    </label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="16 dígitos de tarjeta o 10 de cuenta"
                      className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:bg-slate-800 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-[11px] text-slate-400 text-center sm:text-left">
                  Al registrarte, aceptas los términos del programa de Asesores de Enlace y vinculación al Asesor Verde.
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-pink-600 via-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-xl shadow-pink-600/30 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Registrando tu cuenta...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Completar Registro de Asesor de Enlace</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-900/60 py-4 px-4 text-center text-slate-500 text-[11px]">
        Solux Green Energy Solutions • Sistema Integral de Asesores Verdes y Red de Enlaces
      </footer>
    </div>
  );
}
