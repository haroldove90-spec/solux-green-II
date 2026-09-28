import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, ShieldCheck, User, Lock, Phone, Mail, MapPin, 
  DollarSign, Wrench, Layers, Image, CheckCircle, Info, Sparkles,
  Upload, Trash, Eye, EyeOff, X
} from 'lucide-react';
import { SolarProject } from '../types';

interface PublicClientRegistrationProps {
  users: any[];
  soluxConfig: {
    panelBasePrice: number;
    monthlyInterestRate: number;
    siteSurveyCost: number;
  };
  onRegisterSuccess: (newProject: SolarProject, newUser: any) => void;
  onCancel: () => void;
  onLoginSuccess?: (user: any) => void;
}

export default function PublicClientRegistration({
  users,
  soluxConfig,
  onRegisterSuccess,
  onCancel,
  onLoginSuccess
}: PublicClientRegistrationProps) {
  // Mode selection state (login vs registration)
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);

  // Form States
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [mapsUrl, setMapsUrl] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [referrerCode, setReferrerCode] = useState('');
  const [averageBill, setAverageBill] = useState('');
  const [wiresCount, setWiresCount] = useState<number>(2);
  const [selectedLoads, setSelectedLoads] = useState<string[]>([]);
  
  // Credentials
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Evidence Simulation State
  const [cfeFront, setCfeFront] = useState('');
  const [cfeBack, setCfeBack] = useState('');
  const [facade, setFacade] = useState('');

  // Zoom lightbox state
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [zoomedTitle, setZoomedTitle] = useState('');

  // File loading handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        alert('⚠️ El archivo es demasiado grande. El tamaño máximo permitido es 8MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // UI States
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  
  // Saved data reference to show credentials on success
  const [createdData, setCreatedData] = useState<any>(null);

  const calculatePanels = (bill: number) => {
    if (bill <= 0) return 0;
    const rawPanels = (bill / 1000) * 2;
    const dec = rawPanels - Math.floor(rawPanels);
    const p = dec >= 0.1 ? Math.ceil(rawPanels) : Math.floor(rawPanels);
    return Math.max(1, p);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Field validation
    if (!fullName || !phone || !email || !municipality || !username || !password) {
      setErrorMsg('⚠️ Por favor completa todos los campos requeridos (*).');
      return;
    }

    // Check username duplicate
    const trimUser = username.trim().toLowerCase();
    const isDuplicate = users.some(u => u.username.toLowerCase() === trimUser);
    if (isDuplicate) {
      setErrorMsg('⚠️ El nombre de usuario ingresado ya está en uso. Por favor elige otro.');
      return;
    }

    setIsSubmitting(true);

    try {
      const billNum = Number(averageBill) || 0;
      const panelsCount = calculatePanels(billNum);
      const investment = panelsCount * (Number(soluxConfig.panelBasePrice) || 11000);

      // Create SolarProject
      const nextProjectId = `proj_client_${Date.now()}`;
      const newProject: SolarProject = {
        id: nextProjectId,
        clientName: fullName.trim(),
        clientPhone: phone.trim(),
        clientEmail: email.trim() || undefined,
        whatsappPhone: phone.trim(),
        googleMapsUrl: mapsUrl.trim() || undefined,
        municipalityState: municipality.trim(),
        electricalLoadType: selectedLoads,
        wiresCount: wiresCount,
        averageBill: billNum,
        availableSpace: 40,
        metersCount: 1,
        cfeStatus: 'activo_sin_adeudo',
        paymentMethodDesired: 'directo',
        propertyOwnership: 'propietario',
        estimatedPanels: panelsCount,
        requiredArea: Number((panelsCount * 2.88).toFixed(2)),
        voltageAlert220v: panelsCount > 4,
        voltageUpgradeQuoted: panelsCount > 4,
        totalInvestment: investment,
        siteSurveyPaid: false,
        siteSurveyStatus: 'pendiente',
        status: 'validacion',
        evidence: {
          cfeReceiptFront: cfeFront || 'https://appdesign.appdesignproyectos.com/recibo_cfe_placeholder.jpg',
          cfeReceiptBack: cfeBack || 'https://appdesign.appdesignproyectos.com/recibo_cfe_placeholder.jpg',
          facade: facade || 'https://appdesign.appdesignproyectos.com/fachada_placeholder.jpg'
        },
        payments: [],
        referrerCode: referrerCode || undefined,
        createdDate: new Date().toISOString().split('T')[0],
        createdBy: 'public_client',
        createdByRole: 'client',
      };

      // Create User
      const newClientUser = {
        id: `usr_client_${Date.now()}`,
        username: username.trim(),
        email: email.trim(),
        password: password.trim(),
        role: 'client',
        fullName: fullName.trim(),
        whatsapp: phone.trim()
      };

      // Set finish state
      setCreatedData({ project: newProject, user: newClientUser });
      setIsFinished(true);
    } catch (err: any) {
      setErrorMsg(`⚠️ Error durante el registro: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimUser = loginUser.trim().toLowerCase();
    const foundUser = users.find((u: any) => 
      (u.username.toLowerCase() === trimUser || (u.email && u.email.toLowerCase() === trimUser)) && 
      u.password === loginPass
    );

    if (foundUser) {
      if (foundUser.role === 'client') {
        if (onLoginSuccess) {
          onLoginSuccess(foundUser);
        }
      } else {
        setErrorMsg('⚠️ Esta cuenta no pertenece al rol de cliente.');
      }
    } else {
      setErrorMsg('⚠️ Nombre de usuario, correo o contraseña incorrectos.');
    }
  };

  const handleGoToRole = () => {
    if (createdData) {
      onRegisterSuccess(createdData.project, createdData.user);
    }
  };

  // Generate secure password
  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
  };

  // Autocomplete username based on name
  const handleNameChange = (val: string) => {
    setFullName(val);
    if (!username) {
      // Suggest username
      const suggested = val.toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 15);
      setUsername(suggested);
    }
  };

  if (isFinished && createdData) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans relative antialiased items-center justify-center p-4">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30 pointer-events-none"></div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-10 shadow-xl max-w-lg w-full text-center relative z-10 space-y-6"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 mx-auto">
            <CheckCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">¡Registro Exitoso!</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
              Tu expediente digital ha sido iniciado en Solux Green
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left space-y-3.5">
            <div className="border-b pb-2 text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Tus Datos de Acceso
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div>
                <span className="text-[9px] text-slate-400 font-sans uppercase block">Nombre Completo:</span>
                <span className="font-extrabold text-slate-800">{createdData.user.fullName}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 font-sans uppercase block">Usuario:</span>
                <span className="font-extrabold text-indigo-600">{createdData.user.username}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 font-sans uppercase block">Contraseña:</span>
                <span className="font-extrabold text-emerald-600">{createdData.user.password}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 font-sans uppercase block">Municipio:</span>
                <span className="font-extrabold text-slate-800">{createdData.project.municipalityState}</span>
              </div>
            </div>

            <div className="pt-2 border-t flex items-center gap-2 text-[10px] font-bold text-slate-500">
              <Info className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Utiliza estas credenciales para iniciar sesión en cualquier momento.</span>
            </div>
          </div>

          <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 text-left">
            <h4 className="text-[10px] font-black uppercase text-emerald-800 tracking-wider mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" /> Pre-Cálculo de Tu Sistema
            </h4>
            <p className="text-[11px] text-emerald-900 font-bold leading-relaxed">
              Basado en tu consumo de ${createdData.project.averageBill.toLocaleString('es-MX')} MXN, requerirás aproximadamente <span className="font-extrabold">{createdData.project.estimatedPanels} paneles solares</span>. Tu inversión estimada es de <span className="font-extrabold">${createdData.project.totalInvestment.toLocaleString('es-MX')} MXN</span>.
            </p>
          </div>

          <button
            onClick={handleGoToRole}
            className="w-full py-3.5 bg-slate-900 hover:bg-emerald-600 text-white font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" /> Entrar a Mi Rol de Cliente
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans relative overflow-y-auto antialiased py-8 px-4" id="public-reg-portal">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-35 pointer-events-none"></div>

      <div className="max-w-3xl w-full mx-auto space-y-6 relative z-10">
        
        {/* Back Button */}
        {!(typeof window !== 'undefined' && (window.location.pathname === '/clientes' || window.location.href.includes('/clientes') || window.location.hash === '#/clientes' || window.location.hash.includes('clientes'))) && (
          <button
            onClick={onCancel}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200/80 rounded-xl text-slate-700 font-extrabold uppercase text-[9px] tracking-wider transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Volver al Inicio
          </button>
        )}

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3.5 py-1 rounded-full text-emerald-700">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span className="text-[8px] font-black uppercase tracking-widest">
              {isLoginMode ? 'Acceso de Cliente' : 'Ficha de Auto-Registro'}
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
            {isLoginMode ? 'ACCESO PARA CLIENTES REGISTRADOS' : 'REGISTRO DE NUEVO CLIENTE SOLAR'}
          </h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider max-w-md mx-auto leading-relaxed">
            {isLoginMode 
              ? 'Ingresa con tu usuario y contraseña de cliente para acceder a tu expediente solar digital.' 
              : 'Completa la ficha técnica para crear tu expediente y acceder a tu panel de cliente personalizado.'}
          </p>
        </div>

        {/* Registration Card */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 md:p-10 shadow-lg space-y-6">
          
          {/* Mode Switcher */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl max-w-md mx-auto mb-2 border border-slate-200">
            <button
              type="button"
              onClick={() => { setIsLoginMode(false); setErrorMsg(''); }}
              className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${!isLoginMode ? 'bg-white text-slate-900 shadow-xs animate-none' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Nuevo Registro
            </button>
            <button
              type="button"
              onClick={() => { setIsLoginMode(true); setErrorMsg(''); }}
              className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${isLoginMode ? 'bg-white text-slate-900 shadow-xs animate-none' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Ya estoy registrado (Entrar)
            </button>
          </div>

          {isLoginMode ? (
            <form onSubmit={handleLoginSubmit} className="space-y-6 max-w-md mx-auto py-4">
              {/* Error banner */}
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-[10px] font-bold text-rose-600 uppercase tracking-wide text-center">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-4">
                {/* Username or Email Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                    Nombre de Usuario o Correo *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={loginUser}
                      onChange={(e) => setLoginUser(e.target.value)}
                      placeholder="Ej. roberto_solar o correo"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                    Contraseña *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showLoginPass ? 'text' : 'password'}
                      required
                      value={loginPass}
                      onChange={(e) => setLoginPass(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPass(!showLoginPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      {showLoginPass ? <Eye className="w-4 h-4 text-slate-600" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className="w-full py-3.5 bg-slate-950 hover:bg-[#10B981] text-white font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 mt-4"
              >
                <ShieldCheck className="w-4 h-4" /> Iniciar Sesión en Mi Panel
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-6">
              
              {/* Error banner */}
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-[10px] font-bold text-rose-600 uppercase tracking-wide text-center">
                  {errorMsg}
                </div>
              )}

              {/* Section 1: Contact info */}
              <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase text-slate-900 tracking-wider border-b pb-1">
                1. Información General del Cliente
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Full name */}
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Nombre del Cliente *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={e => handleNameChange(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 placeholder-slate-450 focus:outline-none"
                      placeholder="Ej. Roberto Sánchez Ruiz"
                    />
                  </div>
                </div>

                {/* WhatsApp Phone */}
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Teléfono Celular (WhatsApp) *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 placeholder-slate-450 focus:outline-none"
                      placeholder="Ej. 5589123456"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Correo Electrónico *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 placeholder-slate-450 focus:outline-none"
                      placeholder="Ej. roberto.s@gmail.com"
                    />
                  </div>
                </div>

                {/* Google Maps link */}
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Enlace de Ubicación Google Maps</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="url"
                      value={mapsUrl}
                      onChange={e => setMapsUrl(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 placeholder-slate-450 focus:outline-none"
                      placeholder="Ej. https://maps.google.com/?q=..."
                    />
                  </div>
                </div>

                {/* City/Municipality */}
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Municipio y Estado de Residencia *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={municipality}
                      onChange={e => setMunicipality(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 placeholder-slate-450 focus:outline-none"
                      placeholder="Ej. Querétaro, Qro."
                    />
                  </div>
                </div>

                {/* Referido por */}
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Referido por (Empleado o Partner)</label>
                  <select
                    value={referrerCode}
                    onChange={e => setReferrerCode(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:outline-none"
                  >
                    <option value="">Ninguno (Registro Directo)</option>
                    <optgroup label="👥 Empleados Solux Green">
                      {(users || []).filter((u: any) => u.role === 'admin' || u.role === 'comercial' || u.role === 'enlace').map((emp: any, idx: number) => (
                        <option key={`emp_${emp.id || 'emp'}_${idx}`} value={emp.fullName || emp.username}>
                          {emp.fullName || emp.username} ({emp.role === 'admin' ? 'Admin' : emp.role === 'comercial' ? 'Asesor Verde' : 'Asesor Enlace'})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="🤝 Socios Partners de Instalación">
                      {(users || []).filter((u: any) => u.role === 'partner').map((p: any, idx: number) => (
                        <option key={`partner_${p.id || 'p'}_${idx}`} value={p.fullName || p.username}>
                          {p.fullName || p.username} (Socio Partner)
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Technical data */}
            <div className="space-y-4 pt-2">
              <h3 className="text-[10px] font-black uppercase text-slate-900 tracking-wider border-b pb-1">
                2. Ficha Técnica de Consumo Solar
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Average Bill */}
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Monto Promedio Pago Recibo CFE ($ MXN) *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      required
                      value={averageBill}
                      onChange={e => setAverageBill(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none [appearance:textfield]"
                      placeholder="Ej. 2500"
                    />
                  </div>
                </div>

                {/* Wires */}
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Número de Hilos en Acometida</label>
                  <div className="relative">
                    <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                      value={wiresCount}
                      onChange={e => setWiresCount(Number(e.target.value))}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none"
                    >
                      <option value={2}>2 Hilos (Monofásico 110V)</option>
                      <option value={3}>3 Hilos (Bifásico 220V)</option>
                      <option value={4}>4 Hilos (Trifásico 220V/440V)</option>
                    </select>
                  </div>
                </div>

                {/* Electric loads selection */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Cargas Eléctricas Deseadas en Tu Hogar/Negocio</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {['Aire Acondicionado 220V', 'Estufa Eléctrica', 'Cargador Auto Eléctrico', 'Bomba de Agua'].map(load => {
                      const hasLoad = selectedLoads.includes(load);
                      return (
                        <button
                          key={load}
                          type="button"
                          onClick={() => {
                            if (hasLoad) {
                              setSelectedLoads(selectedLoads.filter(l => l !== load));
                            } else {
                              setSelectedLoads([...selectedLoads, load]);
                            }
                          }}
                          className={`text-[9px] p-2 rounded-lg border font-extrabold text-center transition-all ${
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
              </div>
            </div>

            {/* Section 3: Evidence uploads */}
            <div className="space-y-4 pt-2">
              <h3 className="text-[10px] font-black uppercase text-slate-900 tracking-wider border-b pb-1">
                3. Carga de Evidencia Obligatoria
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center text-xs">
                {/* CFE Front */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between h-40">
                  <span className="text-[8px] font-extrabold uppercase text-slate-500 block">Recibo CFE Frente *</span>
                  {cfeFront ? (
                    <div className="space-y-2 flex-1 flex flex-col justify-between pt-1">
                      <div className="relative group w-full h-20 bg-slate-100 rounded-lg overflow-hidden border border-emerald-100">
                        <img src={cfeFront} alt="CFE Frente" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => { setZoomedImage(cfeFront); setZoomedTitle('Recibo CFE Frente'); }}
                            className="p-1 bg-white rounded-md text-slate-700 hover:text-emerald-600 transition-colors"
                            title="Ampliar"
                          >
                            <Eye className="w-4.5 h-4.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setCfeFront('')}
                            className="p-1 bg-white rounded-md text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Eliminar"
                          >
                            <Trash className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      </div>
                      <span className="text-[9px] text-emerald-600 font-extrabold uppercase block">¡Cargado con éxito!</span>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col justify-center items-center">
                      <input
                        type="file"
                        accept="image/*"
                        id="cfe-front-file"
                        onChange={(e) => handleFileChange(e, setCfeFront)}
                        className="hidden"
                      />
                      <label
                        htmlFor="cfe-front-file"
                        className="w-full py-3 px-4 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-[9px] uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                      >
                        <Upload className="w-3.5 h-3.5 text-slate-450" />
                        <span>Subir / Foto Frente</span>
                      </label>
                      <span className="text-[8px] text-slate-400 mt-2 font-semibold">Toma foto o sube archivo</span>
                    </div>
                  )}
                </div>

                {/* CFE Back */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between h-40">
                  <span className="text-[8px] font-extrabold uppercase text-slate-500 block">Recibo CFE Reverso *</span>
                  {cfeBack ? (
                    <div className="space-y-2 flex-1 flex flex-col justify-between pt-1">
                      <div className="relative group w-full h-20 bg-slate-100 rounded-lg overflow-hidden border border-emerald-100">
                        <img src={cfeBack} alt="CFE Reverso" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => { setZoomedImage(cfeBack); setZoomedTitle('Recibo CFE Reverso'); }}
                            className="p-1 bg-white rounded-md text-slate-700 hover:text-emerald-600 transition-colors"
                            title="Ampliar"
                          >
                            <Eye className="w-4.5 h-4.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setCfeBack('')}
                            className="p-1 bg-white rounded-md text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Eliminar"
                          >
                            <Trash className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      </div>
                      <span className="text-[9px] text-emerald-600 font-extrabold uppercase block">¡Cargado con éxito!</span>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col justify-center items-center">
                      <input
                        type="file"
                        accept="image/*"
                        id="cfe-back-file"
                        onChange={(e) => handleFileChange(e, setCfeBack)}
                        className="hidden"
                      />
                      <label
                        htmlFor="cfe-back-file"
                        className="w-full py-3 px-4 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-[9px] uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                      >
                        <Upload className="w-3.5 h-3.5 text-slate-450" />
                        <span>Subir / Foto Reverso</span>
                      </label>
                      <span className="text-[8px] text-slate-400 mt-2 font-semibold">Toma foto o sube archivo</span>
                    </div>
                  )}
                </div>

                {/* Facade */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between h-40">
                  <span className="text-[8px] font-extrabold uppercase text-slate-500 block">Foto Fachada Calle *</span>
                  {facade ? (
                    <div className="space-y-2 flex-1 flex flex-col justify-between pt-1">
                      <div className="relative group w-full h-20 bg-slate-100 rounded-lg overflow-hidden border border-emerald-100">
                        <img src={facade} alt="Fachada" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => { setZoomedImage(facade); setZoomedTitle('Foto Fachada Calle'); }}
                            className="p-1 bg-white rounded-md text-slate-700 hover:text-emerald-600 transition-colors"
                            title="Ampliar"
                          >
                            <Eye className="w-4.5 h-4.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setFacade('')}
                            className="p-1 bg-white rounded-md text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Eliminar"
                          >
                            <Trash className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      </div>
                      <span className="text-[9px] text-emerald-600 font-extrabold uppercase block">¡Cargado con éxito!</span>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col justify-center items-center">
                      <input
                        type="file"
                        accept="image/*"
                        id="facade-file"
                        onChange={(e) => handleFileChange(e, setFacade)}
                        className="hidden"
                      />
                      <label
                        htmlFor="facade-file"
                        className="w-full py-3 px-4 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-[9px] uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                      >
                        <Upload className="w-3.5 h-3.5 text-slate-450" />
                        <span>Subir / Foto Fachada</span>
                      </label>
                      <span className="text-[8px] text-slate-400 mt-2 font-semibold">Toma foto o sube archivo</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 4: Create User Credentials */}
            <div className="space-y-4 pt-2">
              <h3 className="text-[10px] font-black uppercase text-slate-900 tracking-wider border-b pb-1">
                4. Crea Tus Credenciales de Acceso
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Username */}
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Nombre de Usuario de Acceso *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-850 font-mono"
                      placeholder="Escribe tu usuario (ej. robertosolar)"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Contraseña de Acceso *</label>
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="text-[8px] font-black uppercase text-emerald-600 hover:underline cursor-pointer"
                    >
                      ⚡ Generar segura
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-850 font-mono"
                      placeholder="Ingresa tu contraseña"
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
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-slate-950 hover:bg-[#10B981] disabled:bg-slate-400 text-white font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 mt-4"
            >
              {isSubmitting ? 'Guardando expediente...' : '🚀 Enviar y Crear Expediente Digital'}
            </button>

          </form>
          )}
        </div>
      </div>

      {/* Lightbox Zoom Modal */}
      {zoomedImage && (
        <div 
          id="registration-lightbox"
          className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4 animate-fadeIn" 
          onClick={() => setZoomedImage(null)}
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
