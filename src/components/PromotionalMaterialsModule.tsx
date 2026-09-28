import React, { useState, useEffect } from 'react';
import { 
  Award, FileText, Image, Layers, Upload, Download, Share2, Trash2, Plus, X, MessageSquare, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PromotionalMaterial, User, SolarProject } from '../types';
import { fetchPromotionalMaterials, upsertPromotionalMaterial, deletePromotionalMaterial } from '../supabaseService';
import { exportPromotionalPDF } from '../pdfUtils';

interface PromotionalMaterialsModuleProps {
  currentUser?: User | null;
  solarProjects?: SolarProject[];
  isOfflineMode?: boolean;
  onNotification?: (msg: string) => void;
}

export default function PromotionalMaterialsModule({
  currentUser,
  solarProjects = [],
  isOfflineMode = false,
  onNotification
}: PromotionalMaterialsModuleProps) {
  const [promotionalMaterials, setPromotionalMaterials] = useState<PromotionalMaterial[]>([]);
  const [loadingPromo, setLoadingPromo] = useState(false);
  const [showAddPromoForm, setShowAddPromoForm] = useState(false);

  // New Material Form States
  const [newPromoTitle, setNewPromoTitle] = useState('');
  const [newPromoCategory, setNewPromoCategory] = useState<'folleto' | 'ficha_tecnica' | 'redes'>('folleto');
  const [newPromoDescription, setNewPromoDescription] = useState('');
  const [newPromoFileBase64, setNewPromoFileBase64] = useState('');
  const [newPromoFileName, setNewPromoFileName] = useState('');
  const [uploadProgress, setUploadProgress] = useState(false);

  // Share Modal States
  const [selectedShareMaterial, setSelectedShareMaterial] = useState<PromotionalMaterial | null>(null);
  const [shareClientPhone, setShareClientPhone] = useState('');
  const [shareCustomName, setShareCustomName] = useState('');

  const notify = (msg: string) => {
    if (onNotification) {
      onNotification(msg);
    } else {
      console.log('Notification:', msg);
    }
  };

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
            description: 'Folleto oficial con los beneficios de ahorro, garantías y financiamiento Solux Green.',
            fileUrl: 'solux_promo_generated_folleto',
            fileName: 'Folleto_Comercial_Solux_Green_2026.pdf',
            createdBy: 'sistema_solux',
            createdByName: 'Solux Green Oficial',
            createdByRole: 'admin'
          },
          {
            id: 'promo_2',
            title: 'Ficha Técnica Oficial',
            category: 'ficha_tecnica',
            description: 'Ficha de especificaciones y garantías de módulos fotovoltaicos e inversores interconectados.',
            fileUrl: 'solux_promo_generated_ficha',
            fileName: 'Ficha_Tecnica_Oficial_Solux_Green.pdf',
            createdBy: 'sistema_solux',
            createdByName: 'Solux Green Oficial',
            createdByRole: 'admin'
          },
          {
            id: 'promo_3',
            title: 'Material para Redes',
            category: 'redes',
            description: 'Guía y beneficios visuales para compartir en redes sociales y WhatsApp.',
            fileUrl: 'solux_promo_generated_redes',
            fileName: 'Guia_Redes_Solux_Green.pdf',
            createdBy: 'sistema_solux',
            createdByName: 'Solux Green Oficial',
            createdByRole: 'admin'
          }
        ];
        setPromotionalMaterials(initial);
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

  const isAdmin = currentUser?.role === 'admin';
  const isComercial = currentUser?.role === 'comercial';
  const canUpload = isAdmin;

  const handlePromoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canUpload) {
      alert('🔒 Los Asesores Verdes no tienen permisos para subir material publicitario.');
      return;
    }
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
    if (!canUpload) {
      alert('🔒 Los Asesores Verdes no tienen permisos para subir material publicitario. Esta función es administrada por la dirección central.');
      return;
    }
    if (!newPromoTitle || !newPromoDescription || !newPromoFileBase64) {
      alert('⚠️ Por favor completa todos los campos y selecciona un archivo.');
      return;
    }

    setUploadProgress(true);
    const creatorId = currentUser?.id || 'usr_anon';
    const creatorName = currentUser?.fullName || currentUser?.username || 'Usuario Solux';
    const creatorRole = currentUser?.role || 'admin';

    const newMaterial: PromotionalMaterial = {
      id: 'promo_' + Date.now(),
      title: newPromoTitle,
      category: newPromoCategory,
      description: newPromoDescription,
      fileUrl: newPromoFileBase64,
      fileName: newPromoFileName,
      createdDate: new Date().toISOString().split('T')[0],
      createdBy: creatorId,
      createdByName: creatorName,
      createdByRole: creatorRole
    };

    try {
      let success = true;
      if (!isOfflineMode) {
        success = await upsertPromotionalMaterial(newMaterial);
      }

      if (success) {
        setPromotionalMaterials(prev => [newMaterial, ...prev]);
        notify('🚀 ¡Material promocional publicado con éxito!');
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

  const handleDeletePromo = async (mat: PromotionalMaterial) => {
    // Check ownership: only creator can delete
    const currentUserId = currentUser?.id;
    const isOwner = mat.createdBy === currentUserId || (!mat.createdBy && currentUserId);

    if (!isOwner) {
      alert(`🔒 No puedes eliminar este material.\n\nFue subido por: ${mat.createdByName || 'otro usuario'} (${mat.createdByRole || 'rol'}).\n\nCada usuario solo puede eliminar los materiales que él mismo haya publicado.`);
      return;
    }

    if (!window.confirm(`¿Estás seguro de que deseas eliminar tu material "${mat.title}"?`)) return;

    try {
      let success = true;
      if (!isOfflineMode) {
        success = await deletePromotionalMaterial(mat.id);
      }
      if (success) {
        setPromotionalMaterials(prev => prev.filter(p => p.id !== mat.id));
        notify('🗑️ Material promocional eliminado correctamente.');
      } else {
        alert('❌ Error al eliminar el material en la base de datos.');
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const downloadMaterial = async (mat: PromotionalMaterial) => {
    if (mat.fileUrl.includes('appdesignproyectos.com') || mat.fileUrl.startsWith('solux_promo_generated')) {
      notify(`⏳ Generando y descargando ${mat.title}...`);
      await exportPromotionalPDF(mat.category as any);
      notify(`✅ ${mat.title} descargado con éxito.`);
      return;
    }

    if (mat.fileUrl.startsWith('data:')) {
      try {
        const parts = mat.fileUrl.split(',');
        if (parts.length > 1) {
          const mimeMatch = parts[0].match(/:(.*?);/);
          const mimeType = mimeMatch ? mimeMatch[1] : 'application/pdf';
          const byteCharacters = atob(parts[1]);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: mimeType });
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = mat.fileName || `${mat.title.replace(/\s+/g, '_')}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
          notify(`✅ ${mat.title} descargado exitosamente.`);
          return;
        }
      } catch (e) {
        console.warn('Error downloading data URL, generating PDF...', e);
      }
      await exportPromotionalPDF(mat.category as any);
      return;
    }

    window.open(mat.fileUrl, '_blank');
  };

  const handleShareMaterialWhatsApp = (mat: PromotionalMaterial) => {
    setSelectedShareMaterial(mat);
    if (solarProjects.length > 0) {
      setShareClientPhone(solarProjects[0].clientPhone);
      setShareCustomName(solarProjects[0].clientName);
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

    // Attempt native file share for mobile devices
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
          notify('💬 ¡Folleto adjuntado y compartido por WhatsApp!');
          setSelectedShareMaterial(null);
          return;
        }
      } catch (err) {
        console.warn('Native share fallback to URL link:', err);
      }
    }

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
    notify('💬 Abriendo WhatsApp para compartir el material promocional...');
  };

  const currentUserId = currentUser?.id;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-md relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2 relative z-10 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded-full">
              {isAdmin ? 'Catálogo Oficial y Publicación Directa' : '🌿 Asesor Verde: Catálogo de Difusión Autorizado'}
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight flex items-center gap-2">
            <Award className="w-6 h-6 text-emerald-400 shrink-0" />
            Material Promocional y Fichas Técnicas
          </h2>
          <p className="text-xs md:text-sm text-slate-300 font-medium leading-relaxed">
            {isAdmin 
              ? 'Descarga, comparte y publica folletos comerciales oficiales, fichas técnicas y contenido para redes sociales para toda la fuerza comercial.' 
              : 'Consulta, descarga y comparte con tus clientes y prospectos los folletos oficiales, fichas técnicas y contenido para redes autorizados por Solux Green.'}
          </p>
        </div>

        {canUpload ? (
          <button
            onClick={() => setShowAddPromoForm(!showAddPromoForm)}
            className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-sm flex items-center gap-2 cursor-pointer shrink-0 z-10 border border-emerald-400/40"
          >
            {showAddPromoForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAddPromoForm ? 'Cancelar Registro' : 'Subir Nuevo Material'}
          </button>
        ) : (
          <div className="px-4 py-2 bg-white/10 backdrop-blur-xs border border-white/20 rounded-2xl text-[10px] font-extrabold uppercase tracking-wider text-emerald-200 flex items-center gap-2 shrink-0 z-10">
            <span>🔒 Modo Difusión y Descargas</span>
          </div>
        )}

        <Award className="w-48 h-48 text-white/5 absolute -right-10 -bottom-10 pointer-events-none" />
      </div>

      {/* Upload Form Modal / Panel (Admin Only) */}
      {canUpload && showAddPromoForm && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-emerald-200 rounded-3xl p-6 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-xs uppercase text-slate-900 tracking-wider flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-600" />
              Publicar Nuevo Material Promocional
            </h3>
            <span className="text-[10px] font-bold text-slate-400">
              Publicado por: <span className="text-emerald-700 font-extrabold">{currentUser?.fullName || currentUser?.username}</span>
            </span>
          </div>

          <form onSubmit={handleAddPromotionalMaterial} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Título del Material *</label>
                <input 
                  type="text" 
                  required
                  value={newPromoTitle}
                  onChange={(e) => setNewPromoTitle(e.target.value)}
                  placeholder="Ej. Ficha Técnica Inversor Solux 5kW" 
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all shadow-2xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Categoría *</label>
                <select 
                  value={newPromoCategory}
                  onChange={(e: any) => setNewPromoCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all shadow-2xs"
                >
                  <option value="folleto">Folleto Comercial (PDF)</option>
                  <option value="ficha_tecnica">Ficha Técnica Oficial (PDF)</option>
                  <option value="redes">Material para Redes (ZIP / Imagen)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Descripción / Detalles *</label>
              <textarea 
                required
                value={newPromoDescription}
                onChange={(e) => setNewPromoDescription(e.target.value)}
                placeholder="Describe brevemente el contenido de este material para que tus compañeros o clientes comprendan su valor."
                rows={2}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all shadow-2xs resize-none"
              />
            </div>

            {/* File upload box */}
            <div className="space-y-1">
              <label className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Archivo Multimedia (PDF, ZIP, PNG, JPG) *</label>
              <div className="border-2 border-dashed border-slate-200 hover:border-emerald-500 bg-slate-50/50 rounded-2xl p-5 transition-all text-center relative cursor-pointer group">
                <input 
                  type="file" 
                  accept=".pdf,.zip,.png,.jpg,.jpeg"
                  onChange={handlePromoFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="flex flex-col items-center gap-1.5 pointer-events-none">
                  <Upload className="w-7 h-7 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                  {newPromoFileName ? (
                    <p className="text-xs font-black text-emerald-700 max-w-xs truncate">{newPromoFileName}</p>
                  ) : (
                    <>
                      <p className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">Arrastra tu archivo o haz clic para buscar</p>
                      <p className="text-[9px] font-medium text-slate-400">Soporta PDF, ZIP, PNG, JPG de hasta 15MB</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddPromoForm(false);
                  setNewPromoTitle('');
                  setNewPromoDescription('');
                  setNewPromoFileBase64('');
                  setNewPromoFileName('');
                }}
                className="px-4 py-2 border border-slate-200 text-slate-500 font-extrabold text-[10px] uppercase tracking-wider rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="submit"
                disabled={uploadProgress}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {uploadProgress ? 'Publicando...' : 'Guardar y Publicar'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* List of Promotional Materials */}
      {loadingPromo ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Cargando catálogo de materiales...</p>
        </div>
      ) : promotionalMaterials.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center space-y-3">
          <FileText className="w-12 h-12 text-slate-350 mx-auto" />
          <div className="space-y-1">
            <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">No hay materiales registrados</h4>
            <p className="text-[10px] text-slate-500 font-semibold max-w-sm mx-auto leading-normal">
              Aún no se han cargado folletos o fichas técnicas. ¡Haz clic en "Subir Nuevo Material" para publicar el primero!
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {promotionalMaterials.map((item) => {
            let categoryText = 'Material General';
            let gradientClass = 'from-slate-600 to-zinc-700';
            let IconComponent = Layers;

            if (item.category === 'folleto') {
              categoryText = 'Folleto Comercial';
              gradientClass = 'from-emerald-600 to-teal-700';
              IconComponent = Award;
            } else if (item.category === 'ficha_tecnica') {
              categoryText = 'Ficha Técnica';
              gradientClass = 'from-indigo-600 to-blue-700';
              IconComponent = FileText;
            } else if (item.category === 'redes') {
              categoryText = 'Material Redes';
              gradientClass = 'from-purple-600 to-pink-700';
              IconComponent = Image;
            }

            // Ownership check for delete button
            const isOwner = item.createdBy === currentUserId || (!item.createdBy && currentUserId);

            return (
              <div key={item.id} className="bg-white border border-slate-200 rounded-3xl p-5 space-y-3.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between relative group">
                
                {/* Delete button (trash2 icon) - ONLY visible if admin and owner */}
                {isAdmin && isOwner ? (
                  <button
                    onClick={() => handleDeletePromo(item)}
                    className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-full transition-all shadow-2xs cursor-pointer border border-slate-100 z-10"
                    title="Eliminar Mi Material"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <div className="absolute top-4 right-4 px-2 py-0.5 bg-emerald-50 text-[8px] font-bold text-emerald-700 rounded-full border border-emerald-200" title="Material oficial verificado">
                    ✨ Oficial
                  </div>
                )}

                <div className="space-y-3.5">
                  <div className={`h-36 bg-gradient-to-tr ${gradientClass} rounded-2xl flex flex-col items-center justify-center text-white relative overflow-hidden p-4 text-center gap-1.5`}>
                    <IconComponent className="w-10 h-10 opacity-30 absolute -right-3 -bottom-3" />
                    <span className="text-[8px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full">{categoryText}</span>
                    <h3 className="font-extrabold text-xs uppercase tracking-wider line-clamp-2 px-2">{item.title}</h3>
                  </div>
                  
                  <div className="space-y-1.5">
                    <h4 className="font-extrabold text-xs text-slate-900 tracking-wide">{item.title}</h4>
                    <p className="text-[10px] text-slate-500 leading-normal line-clamp-2">{item.description}</p>
                    
                    {/* Creator tag */}
                    <div className="pt-1 flex items-center justify-between text-[9px] font-bold text-slate-400 border-t border-slate-100">
                      <span>Subido por:</span>
                      <span className="text-slate-700 font-extrabold truncate max-w-[140px]">
                        {item.createdByName || 'Solux Green'} ({item.createdByRole?.toUpperCase() || 'OFICIAL'})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => downloadMaterial(item)}
                    className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-black uppercase tracking-wider rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    Descargar
                  </button>
                  <button
                    onClick={() => handleShareMaterialWhatsApp(item)}
                    className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Share2 className="w-3.5 h-3.5 text-white" />
                    Compartir
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Share Modal */}
      <AnimatePresence>
        {selectedShareMaterial && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4 relative"
            >
              <button
                onClick={() => setSelectedShareMaterial(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md inline-block">
                  💬 Compartir por WhatsApp
                </span>
                <h3 className="font-extrabold text-base text-slate-900">
                  {selectedShareMaterial.title}
                </h3>
              </div>

              {solarProjects.length > 0 && (
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase text-slate-500 tracking-wider block">Seleccionar Prospecto Existente</label>
                  <select
                    onChange={(e) => {
                      const selected = solarProjects.find(p => p.id === e.target.value);
                      if (selected) {
                        setShareClientPhone(selected.clientPhone);
                        setShareCustomName(selected.clientName);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="">Selecciona de la lista de prospectos...</option>
                    {solarProjects.map((proj, idx) => (
                      <option key={`promo_proj_${proj.id || 'p'}_${idx}`} value={proj.id}>
                        {proj.clientName} ({proj.clientPhone})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase text-slate-500 tracking-wider block">Nombre del Cliente / Prospecto</label>
                  <input
                    type="text"
                    value={shareCustomName}
                    onChange={(e) => setShareCustomName(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase text-slate-500 tracking-wider block">Teléfono / WhatsApp (10 dígitos) *</label>
                  <input
                    type="tel"
                    required
                    value={shareClientPhone}
                    onChange={(e) => setShareClientPhone(e.target.value)}
                    placeholder="Ej. 4421234567"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedShareMaterial(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={executeShareWhatsApp}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Enviar por WhatsApp
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
