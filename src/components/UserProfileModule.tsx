import React, { useState, useRef } from 'react';
import { 
  User, 
  Lock, 
  Mail, 
  Phone, 
  Upload, 
  Check, 
  CheckCircle, 
  AlertCircle, 
  Camera, 
  Eye, 
  EyeOff, 
  Save,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UserProfileModuleProps {
  currentUser: any;
  onUpdateProfile: (updatedUser: any) => void;
  isOfflineMode?: boolean;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', // Female Corporate
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', // Male Corporate
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', // Female Modern
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', // Male Modern
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', // Female Specialist
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'  // Male Specialist
];

export default function UserProfileModule({
  currentUser,
  onUpdateProfile,
  isOfflineMode = false
}: UserProfileModuleProps) {
  // Local form states
  const [fullName, setFullName] = useState(currentUser?.fullName || currentUser?.full_name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [whatsapp, setWhatsapp] = useState(currentUser?.whatsapp || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const isProfileDirtyRef = React.useRef(false);

  React.useEffect(() => {
    if (currentUser && !isProfileDirtyRef.current) {
      setFullName(currentUser.fullName || currentUser.full_name || '');
      setEmail(currentUser.email || '');
      setWhatsapp(currentUser.whatsapp || '');
      setAvatar(currentUser.avatar || '');
    }
  }, [currentUser?.id]);
  
  // Password fields
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Status indicators
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Avatar source URL helper
  const getAvatarUrl = () => {
    if (avatar) return avatar;
    // Default fallback letters
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || 'Solux User')}&background=10B981&color=fff&size=128&bold=true`;
  };

  // Drag and Drop photo upload
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showNotice('Por favor sube únicamente archivos de imagen (.jpg, .png, etc.)', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showNotice('La imagen supera el límite de 2MB. Intenta con una de menor tamaño.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setAvatar(e.target.result as string);
        showNotice('Fotografía cargada con éxito. Recuerda guardar tus cambios.', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const showNotice = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Submit changes
  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      showNotice('El nombre completo es obligatorio.', 'error');
      return;
    }

    // WhatsApp length check
    if (whatsapp && !/^\d{10,15}$/.test(whatsapp.replace(/\D/g, ''))) {
      showNotice('Por favor ingresa un número de WhatsApp válido (10 a 15 dígitos).', 'error');
      return;
    }

    // Email check
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showNotice('Por favor ingresa una dirección de correo válida.', 'error');
      return;
    }

    // Prepare updated user object
    const updatedUser: any = {
      ...currentUser,
      fullName: fullName.trim(),
      email: email.trim(),
      whatsapp: whatsapp.trim(),
      avatar: avatar
    };

    // Password validation & updates
    if (newPassword || confirmPassword) {
      // If updating password, must verify current password or match them
      if (currentUser?.password && currentPasswordInput !== currentUser.password) {
        showNotice('La contraseña actual es incorrecta. No se pudo guardar.', 'error');
        return;
      }
      if (newPassword !== confirmPassword) {
        showNotice('La nueva contraseña y su confirmación no coinciden.', 'error');
        return;
      }
      if (newPassword.length < 6) {
        showNotice('La nueva contraseña debe tener al menos 6 caracteres.', 'error');
        return;
      }
      updatedUser.password = newPassword;
    }

    // Reset dirty flag
    isProfileDirtyRef.current = false;

    // Trigger parent callback
    onUpdateProfile(updatedUser);

    // Clear password fields
    setCurrentPasswordInput('');
    setNewPassword('');
    setConfirmPassword('');

    showNotice(
      isOfflineMode 
        ? '✓ Perfil actualizado localmente. Se sincronizará al recuperar señal.' 
        : '✓ ¡Perfil actualizado y sincronizado exitosamente con el sistema!', 
      'success'
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-6" id="user-profile-module">
      
      {/* Module Title */}
      <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500">
            <User className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">Mi Perfil de Operador</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Controla tus datos, fotografía y contraseña de acceso en tiempo real
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${
            currentUser?.role === 'admin' 
              ? 'bg-violet-50 text-violet-700 border-violet-100' 
              : currentUser?.role === 'comercial'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
              : currentUser?.role === 'enlace'
              ? 'bg-blue-50 text-blue-700 border-blue-100'
              : 'bg-teal-50 text-teal-700 border-teal-100'
          }`}>
            Rol: {currentUser?.role === 'admin' ? 'Administrador' : currentUser?.role === 'comercial' ? 'Asesor Verde' : currentUser?.role === 'enlace' ? 'Asesor de Enlace' : 'Partner Instalador'}
          </span>
        </div>
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2.5 ${
              notification.type === 'success' 
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                : 'bg-rose-50 border-rose-100 text-rose-800'
            }`}
          >
            {notification.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span className="uppercase tracking-wide text-[10px]">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSaveChanges} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: PHOTOGRAPH MANAGEMENT */}
        <div className="lg:col-span-4 flex flex-col items-center space-y-6">
          <span className="text-[10px] font-black uppercase text-slate-400 block tracking-widest text-center self-stretch">
            Fotografía de Perfil
          </span>

          {/* Drag & Drop Frame */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`w-44 h-44 rounded-full border-2 border-dashed relative group overflow-hidden flex items-center justify-center transition-all ${
              isDragging 
                ? 'border-emerald-500 bg-emerald-50' 
                : 'border-slate-200 bg-slate-50 hover:border-emerald-400'
            }`}
          >
            <img 
              src={getAvatarUrl()} 
              alt="Profile photograph" 
              className="w-full h-full object-cover select-none pointer-events-none"
              referrerPolicy="no-referrer"
            />

            {/* Hover overlay with Upload action */}
            <button
              type="button"
              onClick={triggerFileSelect}
              className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white gap-2 transition-opacity cursor-pointer duration-200"
            >
              <Camera className="w-6 h-6 animate-bounce" />
              <span className="text-[9px] font-black uppercase tracking-widest">Cambiar Foto</span>
              <span className="text-[7px] text-slate-300">Arrastra o haz click</span>
            </button>

            {/* Hidden Input File */}
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="text-center space-y-1">
            <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Límite de archivo: 2MB</span>
            <span className="text-[8px] text-slate-400 font-bold block">Se auto-convertirá a base64 para guardado seguro.</span>
          </div>

          {/* Preset Avatar Selection */}
          <div className="w-full space-y-2.5">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider text-center block">
              O elige una fotografía profesional:
            </span>
            <div className="grid grid-cols-6 gap-2 justify-center">
              {PRESET_AVATARS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setAvatar(p);
                    showNotice('Fotografía preestablecida seleccionada. Recuerda guardar cambios.', 'success');
                  }}
                  className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                    avatar === p ? 'border-emerald-500 scale-110 shadow-md shadow-emerald-50' : 'border-transparent hover:scale-105'
                  }`}
                >
                  <img src={p} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DATA AND SECURITY FIELDS */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* SECTION A: GENERAL DATA */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              Información Personal (Sincronización en vivo)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  Nombre Completo *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      isProfileDirtyRef.current = true;
                      setFullName(e.target.value);
                    }}
                    placeholder="Ej. Juan Pérez García"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Username (Locked for safety) */}
              <div className="space-y-1.5 opacity-60">
                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Nombre de Usuario (Bloqueado)
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={currentUser?.username || ''}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      isProfileDirtyRef.current = true;
                      setEmail(e.target.value);
                    }}
                    placeholder="Ej. gerente@massmercadeo.com.mx"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              {/* WhatsApp Phone */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  Número de WhatsApp
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => {
                      isProfileDirtyRef.current = true;
                      setWhatsapp(e.target.value);
                    }}
                    placeholder="Ej. 5587654321"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION B: SECURITY & PASSWORD UPDATES */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 md:p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-indigo-500" />
                Seguridad & Acceso
              </h3>
              
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="text-[9px] font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-1.5"
              >
                {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showPasswords ? 'Ocultar campos' : 'Modificar Contraseña'}
              </button>
            </div>

            {showPasswords && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2"
              >
                {/* Current password */}
                <div className="space-y-1">
                  <label className="text-[8px] font-extrabold uppercase text-slate-500 block">
                    Contraseña Actual *
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      value={currentPasswordInput}
                      onChange={(e) => setCurrentPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-3 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                      required={newPassword.length > 0}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      title={showCurrentPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showCurrentPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* New password */}
                <div className="space-y-1">
                  <label className="text-[8px] font-extrabold uppercase text-slate-500 block">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full pl-3 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      title={showNewPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm new password */}
                <div className="space-y-1">
                  <label className="text-[8px] font-extrabold uppercase text-slate-500 block">
                    Confirmar Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite la contraseña"
                      className="w-full pl-3 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                      required={newPassword.length > 0}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      title={showConfirmPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showConfirmPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* SUBMIT BUTTON */}
          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[11px] tracking-wider rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4" /> Guardar Cambios de Perfil
            </button>
          </div>
        </div>

      </form>

    </div>
  );
}
