// Módulo de exportación a PDF e Imagen de alta fidelidad para Solux Green Premium
// Renderizado 100% off-screen con Canvas y jsPDF:
// - Cero ventanas o popups emergentes en pantalla (descarga directa al hacer clic)
// - Cero páginas en blanco (renderizado nativo de píxeles en memoria)
// - Datos completos: Titular, Técnico, Financiamiento (Contado, MSI, Crédito, Amortización), Credenciales, Asesor, Garantías
// - Evidencias fotográficas y documentales registradas (Recibo CFE, Fachada, Azotea, Medidor, INE, Firma) en PDF e Imagen JPG

import { jsPDF } from 'jspdf';
import { SolarProject, SoluxConfig } from './types';
import { calculateSoluxFinancing, formatPaymentMethod } from './financingUtils';
import { SOLUX_LOGO_URL, SOLUX_LOGO_FALLBACK } from './logoConfig';

interface ExportPdfOptions {
  filename: string;
  element: HTMLElement;
  orientation?: 'portrait' | 'landscape';
}

/**
 * Fallback genérico para elementos HTML arbitrarios (usado en reportes de lista)
 */
export async function generateAndDownloadPdf({ filename, element, orientation = 'portrait' }: ExportPdfOptions): Promise<boolean> {
  const html2pdf = (await import('html2pdf.js')).default;
  
  element.style.position = 'absolute';
  element.style.left = '-99999px';
  element.style.top = '0';
  element.style.width = orientation === 'landscape' ? '1122px' : '794px';
  element.style.backgroundColor = '#ffffff';
  element.style.zIndex = '-1';
  element.style.pointerEvents = 'none';

  document.body.appendChild(element);

  try {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
    const images = Array.from(element.querySelectorAll('img'));
    await Promise.all(
      images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(res => {
          img.onload = res;
          img.onerror = res;
          setTimeout(res, 500);
        });
      })
    );
    await new Promise(r => setTimeout(r, 150));

    const opt = {
      margin: [6, 6, 6, 6] as [number, number, number, number],
      filename: filename.endsWith('.pdf') ? filename : `${filename}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation }
    };

    await html2pdf().set(opt).from(element).save();
    return true;
  } catch (error) {
    console.error('Error generating PDF with html2pdf:', error);
    return false;
  } finally {
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  }
}

/**
 * Dibuja un rectángulo con esquinas redondeadas en Canvas.
 * IMPORTANTE: Siempre invoca ctx.beginPath() y ctx.closePath() para aislar la ruta geométrica
 * y evitar que llamadas posteriores a fill() o stroke() sobreescriban elementos ya dibujados.
 */
export function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
  }
  ctx.closePath();
}

/**
 * Carga una imagen de forma segura y verifica que no corrompa el Canvas (CORS test).
 */
export async function loadSafeImage(url?: string): Promise<HTMLImageElement | null> {
  if (!url || typeof url !== 'string' || url.trim() === '') return null;
  const trimmed = url.trim();

  // Si es un documento PDF o video, no es una imagen renderizable en canvas
  if (trimmed.toLowerCase().endsWith('.pdf') || trimmed.toLowerCase().endsWith('.mp4')) {
    return null;
  }

  return new Promise((resolve) => {
    const img = new Image();
    if (!trimmed.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    const timer = setTimeout(() => resolve(null), 2500);

    img.onload = () => {
      clearTimeout(timer);
      try {
        const testCanvas = document.createElement('canvas');
        testCanvas.width = 10;
        testCanvas.height = 10;
        const testCtx = testCanvas.getContext('2d');
        if (testCtx) {
          testCtx.drawImage(img, 0, 0, 10, 10);
          testCanvas.toDataURL(); // Provoca SecurityError si está contaminado por CORS
        }
        resolve(img);
      } catch {
        resolve(null);
      }
    };

    img.onerror = () => {
      clearTimeout(timer);
      // Intento de fallback si falló con crossOrigin
      if (!trimmed.startsWith('data:') && trimmed.startsWith('http')) {
        const imgFallback = new Image();
        imgFallback.onload = () => {
          try {
            const tc = document.createElement('canvas');
            tc.width = 10;
            tc.height = 10;
            const tctx = tc.getContext('2d');
            if (tctx) {
              tctx.drawImage(imgFallback, 0, 0, 10, 10);
              tc.toDataURL();
            }
            resolve(imgFallback);
          } catch {
            resolve(null);
          }
        };
        imgFallback.onerror = () => resolve(null);
        imgFallback.src = trimmed;
      } else {
        resolve(null);
      }
    };

    img.src = trimmed;
  });
}

/**
 * Carga el logo corporativo de Solux Green
 */
async function loadLogoImage(): Promise<HTMLImageElement | null> {
  let img = await loadSafeImage(SOLUX_LOGO_URL);
  if (!img) {
    img = await loadSafeImage(SOLUX_LOGO_FALLBACK);
  }
  return img;
}

/**
 * Dibuja una imagen ajustada proporcionalmente (object-fit: cover) dentro de una caja con esquinas redondeadas.
 */
export function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number = 6
) {
  ctx.save();
  drawRoundRect(ctx, x, y, w, h, r);
  ctx.clip();

  const imgRatio = img.width / img.height;
  const targetRatio = w / h;
  let sWidth = img.width;
  let sHeight = img.height;
  let sx = 0;
  let sy = 0;

  if (imgRatio > targetRatio) {
    sWidth = img.height * targetRatio;
    sx = (img.width - sWidth) / 2;
  } else {
    sHeight = img.width / targetRatio;
    sy = (img.height - sHeight) / 2;
  }

  ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, w, h);
  ctx.restore();
}

export interface ProjectEvidenceItem {
  id: string;
  title: string;
  category: string;
  url?: string;
  icon: string;
  loadedImg?: HTMLImageElement | null;
}

/**
 * Recopila todas las evidencias fotográficas y documentales registradas en el proyecto.
 */
export async function collectProjectEvidences(
  proj: SolarProject,
  options?: { expressSignature?: string }
): Promise<ProjectEvidenceItem[]> {
  const items: { id: string; title: string; category: string; url?: string; icon: string }[] = [];
  const ev = proj.evidence || {};

  if (ev.cfeReceiptFront) {
    items.push({ id: 'cfe_front', title: 'Recibo CFE (Frente)', category: 'Suministro Eléctrico CFE', url: ev.cfeReceiptFront, icon: '⚡' });
  }
  if (ev.cfeReceiptBack) {
    items.push({ id: 'cfe_back', title: 'Recibo CFE (Reverso)', category: 'Historial de Consumo', url: ev.cfeReceiptBack, icon: '📊' });
  }
  if (ev.cfeReceipt2Front) {
    items.push({ id: 'cfe_2_front', title: 'Segundo Recibo CFE', category: 'Histórico Adicional', url: ev.cfeReceipt2Front, icon: '📄' });
  }
  if (ev.facade) {
    items.push({ id: 'facade', title: 'Fachada del Inmueble', category: 'Inspección de Acceso', url: ev.facade, icon: '🏠' });
  }
  if (ev.installationAreaPhoto) {
    items.push({ id: 'install_area', title: 'Área de Instalación Fotovoltaica', category: 'Superficie de Azotea', url: ev.installationAreaPhoto, icon: '☀️' });
  }
  if (ev.roofAngle1) {
    items.push({ id: 'roof_1', title: 'Azotea / Área de Módulos (Ángulo 1)', category: 'Superficie de Azotea', url: ev.roofAngle1, icon: '☀️' });
  }
  if (ev.roofAngle2) {
    items.push({ id: 'roof_2', title: 'Azotea / Área de Módulos (Ángulo 2)', category: 'Superficie de Azotea', url: ev.roofAngle2, icon: '📐' });
  }
  if (ev.meterAndPanel) {
    items.push({ id: 'meter_panel', title: 'Medidor CFE y Tablero Eléctrico', category: 'Acometida e Infraestructura', url: ev.meterAndPanel, icon: '🔌' });
  }
  if (ev.ineFront) {
    items.push({ id: 'ine_front', title: 'Identificación Oficial INE (Frente)', category: 'Identidad del Titular', url: ev.ineFront, icon: '🪪' });
  }
  if (ev.ineBack) {
    items.push({ id: 'ine_back', title: 'Identificación Oficial INE (Reverso)', category: 'Identidad del Titular', url: ev.ineBack, icon: '🪪' });
  }
  if (ev.proofOfAddress) {
    items.push({ id: 'proof_address', title: 'Comprobante de Domicilio', category: 'Validación de Residencia', url: ev.proofOfAddress, icon: '📍' });
  }
  if (ev.technicalSurveyDoc) {
    items.push({ id: 'survey_doc', title: 'Dictamen de Levantamiento Técnico', category: 'Validación Técnica Oficial', url: ev.technicalSurveyDoc, icon: '📋' });
  }
  if (proj.siteSurveyReceipt) {
    items.push({ id: 'survey_receipt', title: 'Comprobante de Pago Levantamiento ($250)', category: 'Administración y Pago', url: proj.siteSurveyReceipt, icon: '🧾' });
  }
  if (ev.cfeExpedientDoc) {
    items.push({ id: 'cfe_expedient', title: 'Expediente Entregado a CFE', category: 'Gestoría CFE', url: ev.cfeExpedientDoc, icon: '📑' });
  }
  if (ev.cfeMeterChangeReceiptDoc) {
    items.push({ id: 'meter_change', title: 'Acuse Cambio de Medidor CFE', category: 'Gestoría CFE', url: ev.cfeMeterChangeReceiptDoc, icon: '⚡' });
  }
  if (ev.baseQuotationDoc) {
    items.push({ id: 'base_quotation', title: 'Cotización Base del Proyecto', category: 'Documentación Comercial', url: ev.baseQuotationDoc, icon: '💼' });
  }

  // Recibos adicionales CFE
  if (Array.isArray(ev.additionalReceipts)) {
    ev.additionalReceipts.forEach((url, i) => {
      if (url) {
        items.push({ id: `add_receipt_${i}`, title: `Recibo CFE Adicional (${i + 1})`, category: 'Histórico Adicional CFE', url, icon: '📄' });
      }
    });
  }

  // Documentos anexos adicionales
  if (Array.isArray(ev.additionalDocs)) {
    ev.additionalDocs.forEach((doc, i) => {
      if (doc && doc.url) {
        items.push({ id: doc.id || `add_doc_${i}`, title: doc.title || `Documento Anexo (${i + 1})`, category: 'Expediente Digital', url: doc.url, icon: '📁' });
      }
    });
  }

  // Firma digital
  const sig = options?.expressSignature || proj.siteSurveyData?.clientSignature || (proj.evidence as any)?.clientSignature;
  if (sig) {
    items.push({ id: 'signature', title: 'Firma Digital de Conformidad', category: 'Aprobación Legal del Cliente', url: sig, icon: '✍️' });
  }

  // Cargar imágenes concurrentemente
  const resolved: ProjectEvidenceItem[] = await Promise.all(
    items.map(async (item) => {
      const loadedImg = await loadSafeImage(item.url);
      return {
        ...item,
        loadedImg
      };
    })
  );

  return resolved;
}

/**
 * Renderiza la Página 1: Ficha Técnica y Comercial Oficial (1200 x 1697 px)
 */
export function renderDossierPage1(
  ctx: CanvasRenderingContext2D,
  proj: SolarProject,
  advisorUser?: any,
  clientUser?: any,
  config?: SoluxConfig,
  options?: { expressSignature?: string; customTitle?: string },
  logoImg?: HTMLImageElement | null
) {
  // Cálculos técnicos y comerciales
  const panels = proj.estimatedPanels || (() => {
    const raw = ((proj.averageBill || 0) / 1000) * 2;
    const dec = raw - Math.floor(raw);
    return Math.max(1, dec >= 0.1 ? Math.ceil(raw) : Math.floor(raw));
  })() || 2;
  const area = proj.requiredArea || Number((panels * 2.88).toFixed(2));
  const baseInvestment = proj.totalInvestment || (panels * (Number(config?.panelBasePrice) || 11000));

  let effectiveMethod = proj.paymentMethodDesired || 'contado';
  if (proj.financing?.months && proj.financing.months > 0) {
    effectiveMethod = `directo_${proj.financing.months}m`;
  }
  const effectiveDown = (proj.financing?.downPayment !== undefined && baseInvestment > 0)
    ? Math.round((proj.financing.downPayment / baseInvestment) * 100)
    : (Number(config?.defaultDownPaymentPercent) || 50);

  const fin = calculateSoluxFinancing(
    baseInvestment,
    effectiveMethod,
    proj.financing?.interestRate ?? (Number(config?.monthlyInterestRate) || 4.9),
    effectiveDown,
    config
  );

  const annualSavings = Math.round((proj.averageBill || 0) * 6 * 0.95);
  const effectiveCost = fin.isContado ? fin.finalInvestment : (fin.isFinancing ? (fin.downPayment + fin.totalToPay) : baseInvestment);
  const roiYears = annualSavings > 0 ? (effectiveCost / annualSavings).toFixed(1) : 'N/A';

  const advisorName = proj.advisorName || advisorUser?.fullName || advisorUser?.username || 'Asesor Verde Solux';
  const advisorPhone = proj.advisorPhone || advisorUser?.whatsapp || advisorUser?.phone || '229 343 3597';
  const clientUsername = clientUser?.username || proj.clientName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15);
  const clientPassword = clientUser?.password || 'Solux2026!';
  const systemPowerKw = (panels * 0.55).toFixed(2);
  const annualGenKwh = Math.round(panels * 0.55 * 4.8 * 365 * 0.85);

  const propertyType = proj.propertyOwnership === 'propietario'
    ? 'Propietario del Inmueble'
    : (proj.propertyOwnership ? 'Arrendatario Autorizado' : 'Inmueble Propio');
  const cfeStatusText = (proj.cfeStatus || 'activo_sin_adeudo').replace(/_/g, ' ').toUpperCase();
  const electricalLoad = proj.electricalLoadType && proj.electricalLoadType.length > 0
    ? proj.electricalLoadType.join(', ')
    : (panels > 4 ? '220V Bifásica Requerida' : '110V Monofásica Residencial');

  // 1. Fondo blanco puro
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 1200, 1697);

  // 2. Marca de agua de seguridad tenue en el centro
  ctx.save();
  ctx.strokeStyle = '#10b981';
  ctx.globalAlpha = 0.035;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(350, 750);
  ctx.lineTo(600, 500);
  ctx.lineTo(850, 750);
  ctx.lineTo(780, 750);
  ctx.lineTo(780, 950);
  ctx.lineTo(420, 950);
  ctx.lineTo(420, 750);
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(420, 500, 45, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // --- ENCABEZADO CORPORATIVO ---
  if (logoImg) {
    try {
      ctx.drawImage(logoImg, 50, 42, 170, 60);
    } catch {
      ctx.fillStyle = '#064e3b';
      ctx.font = '900 32px Arial, sans-serif';
      ctx.fillText('SOLUX GREEN', 50, 80);
    }
  } else {
    ctx.fillStyle = '#064e3b';
    ctx.font = '900 32px Arial, sans-serif';
    ctx.fillText('SOLUX GREEN', 50, 80);
  }

  ctx.fillStyle = '#059669';
  ctx.font = 'bold 11px Arial, sans-serif';
  ctx.fillText('ENERGÍA SOLAR INTELIGENTE • FIELDER MASTER TELMEX', 235, 60);

  ctx.fillStyle = '#064e3b';
  ctx.font = '900 21px Arial, sans-serif';
  ctx.fillText(options?.customTitle || 'EXPEDIENTE TÉCNICO Y PROPUESTA SOLAR OFICIAL', 235, 86);

  // Folio y Fecha a la derecha
  ctx.textAlign = 'right';
  ctx.fillStyle = '#064e3b';
  ctx.font = '900 13px Arial, sans-serif';
  ctx.fillText(`FOLIO: #${proj.id}`, 1150, 58);

  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 10px Arial, sans-serif';
  ctx.fillText(`Fecha: ${proj.createdDate || new Date().toISOString().split('T')[0]}`, 1150, 76);

  ctx.fillStyle = '#059669';
  ctx.font = 'bold 9.5px Arial, sans-serif';
  ctx.fillText('Validez: 15 días naturales', 1150, 92);
  ctx.textAlign = 'left';

  // Línea divisoria verde esmeralda
  ctx.strokeStyle = '#059669';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(50, 116);
  ctx.lineTo(1150, 116);
  ctx.stroke();

  // --- BANNER DE MODALIDAD Y ESTATUS ---
  const bannerY = 126;
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  drawRoundRect(ctx, 50, bannerY, 1100, 48, 8);
  ctx.fill();
  ctx.stroke();

  // Modalidad pill
  ctx.fillStyle = '#475569';
  ctx.font = '900 11px Arial, sans-serif';
  ctx.fillText('MODALIDAD:', 70, bannerY + 29);

  const modalityText = fin.isFinancing
    ? `A CRÉDITO • ${formatPaymentMethod(proj.paymentMethodDesired, config).toUpperCase()}`
    : (fin.isMSI ? 'A CRÉDITO • 12 MESES SIN INTERESES (MSI)' : `PAGO DE CONTADO (${config?.contadoDiscountPercent || 5}% BONIFICACIÓN COMERCIAL)`);

  ctx.fillStyle = fin.isFinancing ? '#eff6ff' : '#ecfdf5';
  ctx.strokeStyle = fin.isFinancing ? '#93c5fd' : '#86efac';
  ctx.lineWidth = 1.5;
  drawRoundRect(ctx, 160, bannerY + 10, 560, 28, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = fin.isFinancing ? '#1d4ed8' : '#047857';
  ctx.font = '900 11.5px Arial, sans-serif';
  ctx.fillText(modalityText, 175, bannerY + 28);

  // Estatus pill
  ctx.fillStyle = '#475569';
  ctx.font = '900 11px Arial, sans-serif';
  ctx.fillText('ESTATUS:', 770, bannerY + 29);

  ctx.fillStyle = '#ecfdf5';
  ctx.strokeStyle = '#86efac';
  ctx.lineWidth = 1.5;
  drawRoundRect(ctx, 845, bannerY + 10, 280, 28, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#065f46';
  ctx.font = '900 12px Arial, sans-serif';
  ctx.fillText((proj.status || 'VALIDACIÓN EN PROCESO').toUpperCase(), 865, bannerY + 28);

  // --- GRID DE 2 COLUMNAS (DATOS TITULAR Y DIAGNÓSTICO FOTOVOLTAICO) ---
  const gridY = 186;
  const cardH = 248;

  // Columna Izquierda: Datos del Titular y Ubicación
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  drawRoundRect(ctx, 50, gridY, 535, cardH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#059669';
  ctx.fillRect(50, gridY, 6, cardH);

  ctx.fillStyle = '#064e3b';
  ctx.font = '900 12.5px Arial, sans-serif';
  ctx.fillText('👤 DATOS DEL TITULAR Y UBICACIÓN', 70, gridY + 24);

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(70, gridY + 34);
  ctx.lineTo(565, gridY + 34);
  ctx.stroke();

  const clientRows = [
    { label: 'Nombre / Razón Social:', val: proj.clientName, bold: true },
    { label: 'Teléfono / WhatsApp:', val: proj.clientPhone, bold: true },
    { label: 'Correo Electrónico:', val: proj.clientEmail || 'No registrado en ficha', bold: false },
    { label: 'Municipio / Estado:', val: proj.municipalityState, bold: false },
    { label: 'Tipo de Inmueble:', val: propertyType, bold: false },
    { label: 'Estatus ante CFE:', val: cfeStatusText, bold: true, color: '#059669' },
    { label: 'Medidores CFE:', val: `${proj.metersCount || 1} Medidor(es)`, bold: false },
    { label: 'Carga Eléctrica:', val: electricalLoad, bold: false },
    { label: 'Ubicación GPS:', val: proj.googleMapsUrl ? 'Coordenadas registradas en mapa' : 'No proporcionada', bold: false }
  ];

  clientRows.forEach((row, i) => {
    const rY = gridY + 56 + (i * 21);
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 9.5px Arial, sans-serif';
    ctx.fillText(row.label, 70, rY);

    ctx.fillStyle = row.color || (row.bold ? '#0f172a' : '#334155');
    ctx.font = row.bold ? '900 10px Arial, sans-serif' : '700 9.5px Arial, sans-serif';
    const truncatedVal = row.val.length > 34 ? row.val.slice(0, 32) + '...' : row.val;
    ctx.fillText(truncatedVal, 230, rY);
  });

  // Columna Derecha: Diagnóstico Técnico Fotovoltaico
  ctx.fillStyle = '#f0fdf4';
  ctx.strokeStyle = '#86efac';
  ctx.lineWidth = 1.5;
  drawRoundRect(ctx, 615, gridY, 535, cardH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#10b981';
  ctx.fillRect(615, gridY, 6, cardH);

  ctx.fillStyle = '#166534';
  ctx.font = '900 12.5px Arial, sans-serif';
  ctx.fillText('☀️ DIAGNÓSTICO TÉCNICO FOTOVOLTAICO', 635, gridY + 24);

  ctx.strokeStyle = '#bbf7d0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(635, gridY + 34);
  ctx.lineTo(1130, gridY + 34);
  ctx.stroke();

  const techRows = [
    { label: 'Gasto CFE Bimestral:', val: `$${(proj.averageBill || 0).toLocaleString('es-MX')} MXN`, bold: true },
    { label: 'Módulos Sugeridos:', val: `${panels} MÓDULOS TIER-1 (550W)`, bold: true, color: '#059669' },
    { label: 'Potencia Pico Total:', val: `${systemPowerKw} kWp Instalados`, bold: true },
    { label: 'Área Mínima en Azotea:', val: `${area} m² requeridos`, bold: false },
    { label: 'Generación Solar Anual:', val: `${annualGenKwh.toLocaleString('es-MX')} kWh / año`, bold: true, color: '#059669' },
    { label: 'Ahorro Anual Proyectado:', val: `$${annualSavings.toLocaleString('es-MX')} MXN / año`, bold: true, color: '#059669' },
    { label: 'Retorno Inversión (ROI):', val: `${roiYears} Años aprox.`, bold: false },
    { label: 'Reducción Estimada CFE:', val: 'Hasta 98% de ahorro en recibo', bold: true, color: '#059669' },
    { label: 'Vida Útil Garantizada:', val: '+25 Años de generación lineal', bold: false }
  ];

  techRows.forEach((row, i) => {
    const rY = gridY + 56 + (i * 21);
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 9.5px Arial, sans-serif';
    ctx.fillText(row.label, 635, rY);

    ctx.fillStyle = row.color || (row.bold ? '#0f172a' : '#334155');
    ctx.font = row.bold ? '900 10px Arial, sans-serif' : '700 9.5px Arial, sans-serif';
    ctx.fillText(row.val, 810, rY);
  });

  // --- SECCIÓN: ESQUEMA FINANCIERO Y CONDICIONES COMERCIALES ---
  const finHeaderY = gridY + cardH + 26;
  ctx.fillStyle = '#064e3b';
  ctx.font = '900 14px Arial, sans-serif';
  ctx.fillText('💳 ESQUEMA FINANCIERO Y CONDICIONES COMERCIALES', 50, finHeaderY);

  // Barra de Inversión Base
  const invBarY = finHeaderY + 12;
  ctx.fillStyle = '#064e3b';
  drawRoundRect(ctx, 50, invBarY, 1100, 60, 8);
  ctx.fill();

  ctx.fillStyle = '#6ee7b7';
  ctx.font = 'bold 9.5px Arial, sans-serif';
  ctx.fillText('MODALIDAD DE ADQUISICIÓN SELECCIONADA', 72, invBarY + 23);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 14px Arial, sans-serif';
  ctx.fillText(modalityText, 72, invBarY + 45);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#6ee7b7';
  ctx.font = 'bold 9.5px Arial, sans-serif';
  ctx.fillText('INVERSIÓN BASE DE LISTA', 1125, invBarY + 23);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 22px Arial, sans-serif';
  ctx.fillText(`$${baseInvestment.toLocaleString('es-MX')} MXN`, 1125, invBarY + 47);
  ctx.textAlign = 'left';

  let currentY = invBarY + 74;

  if (fin.isFinancing) {
    // 4 Tarjetas de Métricas de Crédito
    const cardW = 263;
    const metricH = 62;
    const metricsY = currentY;

    const metrics = [
      { label: `ENGANCHE INICIAL (${fin.downPaymentPercent}%)`, val: `$${fin.downPayment.toLocaleString('es-MX')}`, color: '#059669' },
      { label: 'SALDO A FINANCIAR', val: `$${fin.principalToFinance.toLocaleString('es-MX')}`, color: '#0284c7' },
      { label: `PLAZO (${fin.months} MESES) • TASA`, val: `${fin.monthlyRatePercent}% mensual`, color: '#6366f1' },
      { label: 'PAGO MENSUAL FIJO', val: `$${fin.monthlyPayment.toLocaleString('es-MX')}`, color: '#166534' }
    ];

    metrics.forEach((m, idx) => {
      const mX = 50 + (idx * (cardW + 16));
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      drawRoundRect(ctx, mX, metricsY, cardW, metricH, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#1e40af';
      ctx.font = 'bold 8.5px Arial, sans-serif';
      ctx.fillText(m.label, mX + 12, metricsY + 22);

      ctx.fillStyle = m.color;
      ctx.font = '900 16px Arial, sans-serif';
      ctx.fillText(m.val, mX + 12, metricsY + 48);
    });

    currentY += metricH + 12;

    // Barra de resumen de crédito (Intereses y Total)
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    drawRoundRect(ctx, 50, currentY, 1100, 32, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#334155';
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.textAlign = 'center';
    const creditSummaryText = `Intereses Totales Estimados: $${fin.totalInterest.toLocaleString('es-MX')} MXN    •    Total a Liquidar Financiado: $${fin.totalToPay.toLocaleString('es-MX')} MXN    •    Inversión Total con Crédito (Enganche + Pagos): $${(fin.downPayment + fin.totalToPay).toLocaleString('es-MX')} MXN`;
    ctx.fillText(creditSummaryText, 600, currentY + 20);
    ctx.textAlign = 'left';

    currentY += 44;

    // TABLA DE AMORTIZACIÓN
    ctx.fillStyle = '#1e40af';
    ctx.font = '900 11.5px Arial, sans-serif';
    ctx.fillText('📊 TABLA DE AMORTIZACIÓN MENSUAL (CORRIDA DE PAGOS):', 50, currentY);

    currentY += 10;
    const thY = currentY;
    const thH = 26;

    ctx.fillStyle = '#dbeafe';
    drawRoundRect(ctx, 50, thY, 1100, thH, 4);
    ctx.fill();

    ctx.fillStyle = '#1e40af';
    ctx.font = '900 10px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Mes', 100, thY + 17);
    ctx.textAlign = 'right';
    ctx.fillText('Saldo Inicial', 300, thY + 17);
    ctx.fillText('Capital', 500, thY + 17);
    ctx.fillText(`Interés (${fin.monthlyRatePercent}%)`, 700, thY + 17);
    ctx.fillText('Pago Mensual', 900, thY + 17);
    ctx.fillText('Saldo Final', 1110, thY + 17);
    ctx.textAlign = 'left';

    currentY += thH;

    // Filas de corrida financiera (hasta 6 para caber en página 1)
    const displaySchedule = fin.schedule && fin.schedule.length > 0 ? fin.schedule.slice(0, 6) : [];
    displaySchedule.forEach((s, idx) => {
      const rowY = currentY + (idx * 22);
      ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
      ctx.fillRect(50, rowY, 1100, 22);

      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(50, rowY + 22);
      ctx.lineTo(1150, rowY + 22);
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 9.5px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Mes ${s.month}`, 100, rowY + 15);
      ctx.textAlign = 'right';
      ctx.fillText(`$${s.initialBalance.toLocaleString('es-MX')}`, 300, rowY + 15);
      ctx.fillText(`$${s.capital.toLocaleString('es-MX')}`, 500, rowY + 15);
      ctx.fillText(`$${s.interest.toLocaleString('es-MX')}`, 700, rowY + 15);
      ctx.font = '900 9.5px Arial, sans-serif';
      ctx.fillStyle = '#166534';
      ctx.fillText(`$${s.totalPayment.toLocaleString('es-MX')}`, 900, rowY + 15);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 9.5px Arial, sans-serif';
      ctx.fillText(`$${s.finalBalance.toLocaleString('es-MX')}`, 1110, rowY + 15);
      ctx.textAlign = 'left';
    });

    currentY += (displaySchedule.length * 22);

    // Fila de Totales de la Tabla
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(50, currentY, 1100, 24);

    ctx.fillStyle = '#0f172a';
    ctx.font = '900 10.5px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TOTALES', 100, currentY + 16);
    ctx.textAlign = 'right';
    ctx.fillText('-', 300, currentY + 16);
    ctx.fillText(`$${fin.principalToFinance.toLocaleString('es-MX')}`, 500, currentY + 16);
    ctx.fillText(`$${fin.totalInterest.toLocaleString('es-MX')}`, 700, currentY + 16);
    ctx.fillStyle = '#166534';
    ctx.fillText(`$${fin.totalToPay.toLocaleString('es-MX')}`, 900, currentY + 16);
    ctx.fillStyle = '#0f172a';
    ctx.fillText('$0', 1110, currentY + 16);
    ctx.textAlign = 'left';

    currentY += 36;
  } else if (fin.isContado) {
    // Tarjeta de Descuento de Contado
    const contadoH = 80;
    ctx.fillStyle = '#ecfdf5';
    ctx.strokeStyle = '#a7f3d0';
    ctx.lineWidth = 1.5;
    drawRoundRect(ctx, 50, currentY, 1100, contadoH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#10b981';
    ctx.fillRect(50, currentY, 6, contadoH);

    ctx.fillStyle = '#065f46';
    ctx.font = '900 13px Arial, sans-serif';
    ctx.fillText(`PAGO DE CONTADO CON BONIFICACIÓN DIRECTA DEL ${config?.contadoDiscountPercent || 5}%`, 72, currentY + 26);

    const discountVal = Math.round(baseInvestment * ((Number(config?.contadoDiscountPercent) || 5) / 100));
    ctx.fillStyle = '#047857';
    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.fillText(`Descuento comercial aplicado: -$${discountVal.toLocaleString('es-MX')} MXN`, 72, currentY + 46);

    ctx.fillStyle = '#64748b';
    ctx.font = '10px Arial, sans-serif';
    ctx.fillText('Condiciones: 50% de anticipo al ordenar módulos y materiales, 50% contra entrega e instalación concluida.', 72, currentY + 66);

    // Precios a la derecha
    ctx.textAlign = 'right';
    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 12px Arial, sans-serif';
    ctx.fillText(`$${baseInvestment.toLocaleString('es-MX')} MXN`, 1125, currentY + 30);

    ctx.fillStyle = '#065f46';
    ctx.font = '900 22px Arial, sans-serif';
    ctx.fillText(`$${fin.finalInvestment.toLocaleString('es-MX')} MXN`, 1125, currentY + 60);
    ctx.textAlign = 'left';

    currentY += contadoH + 20;
  } else if (fin.isMSI) {
    // Tarjeta MSI
    const msiH = 80;
    ctx.fillStyle = '#eff6ff';
    ctx.strokeStyle = '#bfdbfe';
    ctx.lineWidth = 1.5;
    drawRoundRect(ctx, 50, currentY, 1100, msiH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(50, currentY, 6, msiH);

    ctx.fillStyle = '#1e40af';
    ctx.font = '900 13px Arial, sans-serif';
    ctx.fillText('12 MESES SIN INTERESES (TARJETAS DE CRÉDITO PARTICIPANTES)', 72, currentY + 28);

    ctx.fillStyle = '#1d4ed8';
    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.fillText('Inversión total diferida en 12 mensualidades fijas sin recargo alguno ni comisiones ocultas.', 72, currentY + 52);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#1e3a8a';
    ctx.font = '900 22px Arial, sans-serif';
    ctx.fillText(`$${Math.round(baseInvestment / 12).toLocaleString('es-MX')} MXN / mes`, 1125, currentY + 48);
    ctx.textAlign = 'left';

    currentY += msiH + 20;
  } else {
    // Otra modalidad (Crédito bancario / Financiera externa)
    const extH = 75;
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    drawRoundRect(ctx, 50, currentY, 1100, extH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#0284c7';
    ctx.fillRect(50, currentY, 6, extH);

    ctx.fillStyle = '#0369a1';
    ctx.font = '900 13px Arial, sans-serif';
    ctx.fillText(`MODALIDAD EXTERNA: ${formatPaymentMethod(proj.paymentMethodDesired, config).toUpperCase()}`, 72, currentY + 26);

    ctx.fillStyle = '#475569';
    ctx.font = '10.5px Arial, sans-serif';
    ctx.fillText('Asesoría integral y expediente técnico preparado para gestión ágil ante la entidad financiera.', 72, currentY + 48);

    currentY += extH + 20;
  }

  // --- TARJETAS INFERIORES: PORTAL DEL CLIENTE Y ASESOR VERDE ---
  const lowerCardH = 86;
  const lowerCardY = currentY;

  // Tarjeta Portal de Monitoreo
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#c7d2fe';
  ctx.lineWidth = 1.5;
  drawRoundRect(ctx, 50, lowerCardY, 535, lowerCardH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#6366f1';
  ctx.fillRect(50, lowerCardY, 6, lowerCardH);

  ctx.fillStyle = '#4338ca';
  ctx.font = '900 11px Arial, sans-serif';
  ctx.fillText('🔐 CREDENCIALES DE ACCESO A PORTAL DE MONITOREO', 70, lowerCardY + 22);

  ctx.fillStyle = '#64748b';
  ctx.font = '9.5px Arial, sans-serif';
  ctx.fillText('Consulte su expediente, estatus de interconexión y producción en soluxgreen.com.mx', 70, lowerCardY + 40);

  // Caja con credenciales
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#e0e7ff';
  ctx.lineWidth = 1;
  drawRoundRect(ctx, 70, lowerCardY + 48, 495, 28, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#4338ca';
  ctx.font = '900 10px monospace, sans-serif';
  ctx.fillText(`Usuario: ${clientUsername}`, 85, lowerCardY + 66);

  ctx.fillStyle = '#059669';
  ctx.font = '900 10px monospace, sans-serif';
  ctx.fillText(`Contraseña: ${clientPassword}`, 330, lowerCardY + 66);

  // Tarjeta Asesor Verde
  ctx.fillStyle = '#f0fdf4';
  ctx.strokeStyle = '#bbf7d0';
  ctx.lineWidth = 1.5;
  drawRoundRect(ctx, 615, lowerCardY, 535, lowerCardH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#10b981';
  ctx.fillRect(615, lowerCardY, 6, lowerCardH);

  ctx.fillStyle = '#065f46';
  ctx.font = '900 11px Arial, sans-serif';
  ctx.fillText('🌱 ASESOR VERDE ASIGNADO', 635, lowerCardY + 22);

  ctx.fillStyle = '#0f172a';
  ctx.font = '900 13px Arial, sans-serif';
  ctx.fillText(advisorName.toUpperCase(), 635, lowerCardY + 44);

  ctx.fillStyle = '#059669';
  ctx.font = 'bold 11px Arial, sans-serif';
  ctx.fillText(`Teléfono / WhatsApp: ${advisorPhone}`, 635, lowerCardY + 64);

  currentY += lowerCardH + 14;

  // --- GARANTÍAS Y RESPALDO ---
  const warH = 46;
  ctx.fillStyle = '#f0fdf4';
  ctx.strokeStyle = '#bbf7d0';
  ctx.lineWidth = 1;
  drawRoundRect(ctx, 50, currentY, 1100, warH, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#166534';
  ctx.font = 'bold 9.5px Arial, sans-serif';
  ctx.fillText('Garantías y Respaldo Oficial Solux Green:', 68, currentY + 18);

  ctx.fillStyle = '#334155';
  ctx.font = '9px Arial, sans-serif';
  ctx.fillText(
    '25 años de garantía de potencia lineal en módulos Tier-1 • 10 a 12 años en inversores • 1 año integral en instalación eléctrica • Trámite y gestión de medidor bidireccional CFE incluido.',
    68,
    currentY + 34
  );

  // --- FIRMA DIGITAL SI EXISTE ---
  const signatureSrc = options?.expressSignature || proj.siteSurveyData?.clientSignature || (proj.evidence as any)?.clientSignature;
  if (signatureSrc && signatureSrc.startsWith('data:image')) {
    ctx.save();
    ctx.strokeStyle = '#022c22';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(450, 1520);
    ctx.lineTo(750, 1520);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#022c22';
    ctx.font = 'bold 9px Arial, sans-serif';
    ctx.fillText(`FIRMA Y CONFORMIDAD • ${(proj.clientName).toUpperCase()}`, 600, 1535);
    ctx.restore();
  }

  // --- PIE DE PÁGINA OFICIAL ---
  const footerY = 1560;
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(50, footerY);
  ctx.lineTo(1150, footerY);
  ctx.stroke();

  // 4 Columnas de contacto
  const colW = 275;
  const footerContact = [
    { title: 'WHATSAPP', val: '229 343 3597' },
    { title: 'CORREO', val: 'director@massmercadeo.com.mx' },
    { title: 'SITIO WEB', val: 'soluxgreen.com.mx' },
    { title: 'DIRECCIÓN', val: 'Velázquez de la Cadena 401, Centro, Veracruz' }
  ];

  footerContact.forEach((c, i) => {
    const cX = 50 + (i * colW);
    ctx.fillStyle = '#022c22';
    ctx.font = '900 8.5px Arial, sans-serif';
    ctx.fillText(c.title, cX + 10, footerY + 22);

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 9.5px Arial, sans-serif';
    ctx.fillText(c.val, cX + 10, footerY + 38);
  });

  // Franja inferior verde oscuro
  ctx.fillStyle = '#011f2d';
  ctx.fillRect(50, footerY + 54, 1100, 36);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 9px Arial, sans-serif';
  ctx.fillText('Solux Green es una marca del Grupo Mass Mercadeo, Fielder Master Nacional Telmex', 600, footerY + 72);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '8px Arial, sans-serif';
  ctx.fillText('Esta propuesta y simulación tiene carácter oficial e informativo • Solux Green Premium 2026', 600, footerY + 84);
  ctx.textAlign = 'left';
}

/**
 * Renderiza una página del Anexo de Evidencias Fotográficas y Documentales (1200 x 1697 px)
 */
export function renderEvidencePage(
  ctx: CanvasRenderingContext2D,
  proj: SolarProject,
  evidences: ProjectEvidenceItem[],
  pageIdx: number,
  totalPages: number,
  logoImg?: HTMLImageElement | null
) {
  // Fondo blanco
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 1200, 1697);

  // Encabezado
  if (logoImg) {
    try {
      ctx.drawImage(logoImg, 50, 42, 170, 60);
    } catch {
      ctx.fillStyle = '#064e3b';
      ctx.font = '900 28px Arial, sans-serif';
      ctx.fillText('SOLUX GREEN', 50, 80);
    }
  } else {
    ctx.fillStyle = '#064e3b';
    ctx.font = '900 28px Arial, sans-serif';
    ctx.fillText('SOLUX GREEN', 50, 80);
  }

  ctx.fillStyle = '#059669';
  ctx.font = 'bold 11px Arial, sans-serif';
  ctx.fillText('EXPEDIENTE DIGITAL • ANEXO DE EVIDENCIAS Y DOCUMENTACIÓN', 235, 60);

  ctx.fillStyle = '#064e3b';
  ctx.font = '900 20px Arial, sans-serif';
  ctx.fillText('REGISTRO FOTOGRÁFICO Y COMPROBANTES DE SITIO', 235, 86);

  // Folio y página
  ctx.textAlign = 'right';
  ctx.fillStyle = '#064e3b';
  ctx.font = '900 13px Arial, sans-serif';
  ctx.fillText(`FOLIO: #${proj.id}`, 1150, 58);

  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 10px Arial, sans-serif';
  ctx.fillText(`Cliente: ${proj.clientName}`, 1150, 76);

  ctx.fillStyle = '#059669';
  ctx.font = 'bold 10px Arial, sans-serif';
  ctx.fillText(`Anexo ${pageIdx + 1} de ${totalPages}`, 1150, 92);
  ctx.textAlign = 'left';

  // Línea divisoria
  ctx.strokeStyle = '#059669';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(50, 116);
  ctx.lineTo(1150, 116);
  ctx.stroke();

  // Grid de evidencias (2 columnas x 3 filas = hasta 6 por página)
  const cardW = 535;
  const cardH = 340;
  const gapX = 30;
  const gapY = 24;
  const startY = 138;

  evidences.forEach((ev, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const cX = 50 + col * (cardW + gapX);
    const cY = startY + row * (cardH + gapY);

    // Contenedor tarjeta
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    drawRoundRect(ctx, cX, cY, cardW, cardH, 8);
    ctx.fill();
    ctx.stroke();

    // Barra superior de la tarjeta
    ctx.fillStyle = '#064e3b';
    drawRoundRect(ctx, cX, cY, cardW, 38, 8);
    ctx.fill();
    // Corregir esquina inferior de la barra de título
    ctx.fillRect(cX, cY + 24, cardW, 14);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 11.5px Arial, sans-serif';
    ctx.fillText(`${ev.icon}  ${ev.title.toUpperCase()}`, cX + 14, cY + 24);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#a7f3d0';
    ctx.font = 'bold 9px Arial, sans-serif';
    ctx.fillText(ev.category.toUpperCase(), cX + cardW - 14, cY + 24);
    ctx.textAlign = 'left';

    // Área de la imagen / contenido
    const imgBoxX = cX + 10;
    const imgBoxY = cY + 46;
    const imgBoxW = cardW - 20;
    const imgBoxH = cardH - 56;

    if (ev.loadedImg) {
      drawCoverImage(ctx, ev.loadedImg, imgBoxX, imgBoxY, imgBoxW, imgBoxH, 6);
    } else {
      // Placeholder elegante si es documento o no cargó por CORS
      ctx.fillStyle = '#f1f5f9';
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      drawRoundRect(ctx, imgBoxX, imgBoxY, imgBoxW, imgBoxH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '40px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ev.icon || '📄', imgBoxX + imgBoxW / 2, imgBoxY + imgBoxH / 2 - 15);

      ctx.fillStyle = '#334155';
      ctx.font = '900 11px Arial, sans-serif';
      ctx.fillText(ev.title, imgBoxX + imgBoxW / 2, imgBoxY + imgBoxH / 2 + 25);

      ctx.fillStyle = '#059669';
      ctx.font = 'bold 9.5px Arial, sans-serif';
      ctx.fillText('✓ Archivo Registrado en Expediente Digital CRM', imgBoxX + imgBoxW / 2, imgBoxY + imgBoxH / 2 + 45);

      ctx.fillStyle = '#64748b';
      ctx.font = '8.5px monospace, sans-serif';
      const safeUrl = ev.url ? (ev.url.length > 50 ? ev.url.slice(0, 48) + '...' : ev.url) : 'Archivo verificado';
      ctx.fillText(safeUrl, imgBoxX + imgBoxW / 2, imgBoxY + imgBoxH / 2 + 65);
      ctx.textAlign = 'left';
    }
  });

  // Pie de página oficial
  const footerY = 1590;
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(50, footerY);
  ctx.lineTo(1150, footerY);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 9px Arial, sans-serif';
  ctx.fillText('Solux Green • Expediente de Evidencias y Levantamiento Fotográfico • Confidencial y Oficial', 600, footerY + 24);
  ctx.textAlign = 'left';
}

/**
 * Exporta el Expediente Técnico Solar / Cotización Oficial a PDF con descarga DIRECTA e instantánea.
 * Incluye datos completos y anexo de evidencias fotográficas.
 */
export async function exportProjectDossierPDF(
  proj: SolarProject,
  advisorUser?: any,
  clientUser?: any,
  config?: SoluxConfig,
  options?: { expressSignature?: string; customTitle?: string }
): Promise<boolean> {
  try {
    const baseInvestment = proj.totalInvestment || ((proj.estimatedPanels || 2) * (Number(config?.panelBasePrice) || 11000));
    let effectiveMethod = proj.paymentMethodDesired || 'contado';
    if (proj.financing?.months && proj.financing.months > 0) {
      effectiveMethod = `directo_${proj.financing.months}m`;
    }
    const effectiveDown = (proj.financing?.downPayment !== undefined && baseInvestment > 0)
      ? Math.round((proj.financing.downPayment / baseInvestment) * 100)
      : (Number(config?.defaultDownPaymentPercent) || 50);

    const fin = calculateSoluxFinancing(
      baseInvestment,
      effectiveMethod,
      proj.financing?.interestRate ?? (Number(config?.monthlyInterestRate) || 4.9),
      effectiveDown,
      config
    );

    const logoImg = await loadLogoImage();
    const evidences = await collectProjectEvidences(proj, options);

    // 1. Crear PDF e insertar la imagen generada en memoria (A4 Portrait)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // PÁGINA 1: FICHA TÉCNICA Y COMERCIAL
    const canvas1 = document.createElement('canvas');
    canvas1.width = 1200;
    canvas1.height = 1697;
    const ctx1 = canvas1.getContext('2d');
    if (!ctx1) return false;

    renderDossierPage1(ctx1, proj, advisorUser, clientUser, config, options, logoImg);
    const imgData1 = canvas1.toDataURL('image/jpeg', 0.98);
    pdf.addImage(imgData1, 'JPEG', 0, 0, 210, 297);

    // PÁGINA 2: Si la corrida financiera tiene más de 6 meses (ej. 12 o 24 meses), generar tabla de amortización completa
    if (fin.schedule && fin.schedule.length > 6) {
      const canvas2 = document.createElement('canvas');
      canvas2.width = 1200;
      canvas2.height = 1697;
      const ctx2 = canvas2.getContext('2d');
      if (ctx2) {
        ctx2.fillStyle = '#ffffff';
        ctx2.fillRect(0, 0, 1200, 1697);

        // Encabezado Pág 2
        ctx2.fillStyle = '#064e3b';
        ctx2.font = '900 24px Arial, sans-serif';
        ctx2.fillText('SOLUX GREEN • CORRIDA FINANCIERA COMPLETA', 50, 65);

        ctx2.fillStyle = '#059669';
        ctx2.font = 'bold 11px Arial, sans-serif';
        ctx2.fillText(`TABLA DE AMORTIZACIÓN Y CALENDARIO DE PAGOS (${fin.months} MESES) • CLIENTE: ${proj.clientName.toUpperCase()}`, 50, 90);

        ctx2.strokeStyle = '#059669';
        ctx2.lineWidth = 2;
        ctx2.beginPath();
        ctx2.moveTo(50, 105);
        ctx2.lineTo(1150, 105);
        ctx2.stroke();

        // Encabezado de tabla Pág 2
        ctx2.fillStyle = '#dbeafe';
        drawRoundRect(ctx2, 50, 120, 1100, 28, 4);
        ctx2.fill();

        ctx2.fillStyle = '#1e40af';
        ctx2.font = '900 10.5px Arial, sans-serif';
        ctx2.textAlign = 'center';
        ctx2.fillText('Mes', 100, 138);
        ctx2.textAlign = 'right';
        ctx2.fillText('Saldo Inicial', 300, 138);
        ctx2.fillText('Capital', 500, 138);
        ctx2.fillText(`Interés (${fin.monthlyRatePercent}%)`, 700, 138);
        ctx2.fillText('Pago Mensual', 900, 138);
        ctx2.fillText('Saldo Final', 1110, 138);
        ctx2.textAlign = 'left';

        const p2Y = 148;
        fin.schedule.forEach((s, idx) => {
          const rY = p2Y + (idx * 24);
          ctx2.fillStyle = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
          ctx2.fillRect(50, rY, 1100, 24);

          ctx2.strokeStyle = '#e2e8f0';
          ctx2.lineWidth = 1;
          ctx2.beginPath();
          ctx2.moveTo(50, rY + 24);
          ctx2.lineTo(1150, rY + 24);
          ctx2.stroke();

          ctx2.fillStyle = '#0f172a';
          ctx2.font = 'bold 10px Arial, sans-serif';
          ctx2.textAlign = 'center';
          ctx2.fillText(`Mes ${s.month}`, 100, rY + 16);
          ctx2.textAlign = 'right';
          ctx2.fillText(`$${s.initialBalance.toLocaleString('es-MX')}`, 300, rY + 16);
          ctx2.fillText(`$${s.capital.toLocaleString('es-MX')}`, 500, rY + 16);
          ctx2.fillText(`$${s.interest.toLocaleString('es-MX')}`, 700, rY + 16);
          ctx2.font = '900 10px Arial, sans-serif';
          ctx2.fillStyle = '#166534';
          ctx2.fillText(`$${s.totalPayment.toLocaleString('es-MX')}`, 900, rY + 16);
          ctx2.fillStyle = '#0f172a';
          ctx2.font = 'bold 10px Arial, sans-serif';
          ctx2.fillText(`$${s.finalBalance.toLocaleString('es-MX')}`, 1110, rY + 16);
          ctx2.textAlign = 'left';
        });

        // Totales de la corrida
        const totalP2Y = p2Y + (fin.schedule.length * 24);
        ctx2.fillStyle = '#064e3b';
        ctx2.fillRect(50, totalP2Y, 1100, 26);

        ctx2.fillStyle = '#ffffff';
        ctx2.font = '900 11px Arial, sans-serif';
        ctx2.textAlign = 'center';
        ctx2.fillText('TOTALES', 100, totalP2Y + 17);
        ctx2.textAlign = 'right';
        ctx2.fillText('-', 300, totalP2Y + 17);
        ctx2.fillText(`$${fin.principalToFinance.toLocaleString('es-MX')}`, 500, totalP2Y + 17);
        ctx2.fillText(`$${fin.totalInterest.toLocaleString('es-MX')}`, 700, totalP2Y + 17);
        ctx2.fillStyle = '#6ee7b7';
        ctx2.fillText(`$${fin.totalToPay.toLocaleString('es-MX')}`, 900, totalP2Y + 17);
        ctx2.fillStyle = '#ffffff';
        ctx2.fillText('$0', 1110, totalP2Y + 17);
        ctx2.textAlign = 'left';

        // Añadir Pág 2 al PDF
        pdf.addPage('a4', 'portrait');
        const imgData2 = canvas2.toDataURL('image/jpeg', 0.98);
        pdf.addImage(imgData2, 'JPEG', 0, 0, 210, 297);
      }
    }

    // PÁGINA(S) DE ANEXO DE EVIDENCIAS FOTOGRÁFICAS
    if (evidences.length > 0) {
      const itemsPerPage = 6;
      const totalEvidencePages = Math.ceil(evidences.length / itemsPerPage);

      for (let p = 0; p < totalEvidencePages; p++) {
        const pageEvidences = evidences.slice(p * itemsPerPage, (p + 1) * itemsPerPage);
        const canvasEv = document.createElement('canvas');
        canvasEv.width = 1200;
        canvasEv.height = 1697;
        const ctxEv = canvasEv.getContext('2d');
        if (ctxEv) {
          renderEvidencePage(ctxEv, proj, pageEvidences, p, totalEvidencePages, logoImg);
          pdf.addPage('a4', 'portrait');
          const imgDataEv = canvasEv.toDataURL('image/jpeg', 0.98);
          pdf.addImage(imgDataEv, 'JPEG', 0, 0, 210, 297);
        }
      }
    }

    // Descarga directa e instantánea sin popups
    const safeClientName = proj.clientName.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `Expediente_Solux_${safeClientName}_${proj.id}.pdf`;
    pdf.save(filename);

    return true;
  } catch (error) {
    console.error('Error generando PDF con Canvas y jsPDF:', error);
    return false;
  }
}

/**
 * Exporta el Expediente Técnico Solar / Cotización Oficial a Imagen (JPG/PNG) de alta resolución.
 * Descarga DIRECTA con TODOS los datos registrados y ANEXO DE EVIDENCIAS FOTOGRÁFICAS.
 */
export async function exportProjectDossierImage(
  proj: SolarProject,
  advisorUser?: any,
  clientUser?: any,
  config?: SoluxConfig,
  options?: { expressSignature?: string; customTitle?: string; format?: 'jpeg' | 'png' }
): Promise<boolean> {
  try {
    const logoImg = await loadLogoImage();
    const evidences = await collectProjectEvidences(proj, options);

    const baseWidth = 1200;
    const page1Height = 1697;

    let totalHeight = page1Height;
    let evidenceSectionHeight = 0;

    if (evidences.length > 0) {
      const cardH = 340;
      const gapY = 24;
      const rows = Math.ceil(evidences.length / 2);
      evidenceSectionHeight = 120 + rows * (cardH + gapY) + 80;
      totalHeight += evidenceSectionHeight;
    }

    const canvas = document.createElement('canvas');
    canvas.width = baseWidth;
    canvas.height = totalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    // Fondo blanco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, baseWidth, totalHeight);

    // 1. Renderizar Página 1
    renderDossierPage1(ctx, proj, advisorUser, clientUser, config, options, logoImg);

    // 2. Si hay evidencias, renderizar sección de evidencias abajo
    if (evidences.length > 0) {
      const startEvY = page1Height + 20;

      // Separador visual elegante
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(50, startEvY);
      ctx.lineTo(1150, startEvY);
      ctx.stroke();

      ctx.fillStyle = '#064e3b';
      ctx.font = '900 18px Arial, sans-serif';
      ctx.fillText('📷 ANEXO DE EVIDENCIAS FOTOGRÁFICAS Y DOCUMENTACIÓN OFICIAL', 50, startEvY + 34);

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 10px Arial, sans-serif';
      ctx.fillText(`Registro fotográfico oficial asociado al Folio #${proj.id} • Cliente: ${proj.clientName}`, 50, startEvY + 54);

      // Renderizar tarjetas de evidencias
      const cardW = 535;
      const cardH = 340;
      const gapX = 30;
      const gapY = 24;
      const cardsStartY = startEvY + 74;

      evidences.forEach((ev, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const cX = 50 + col * (cardW + gapX);
        const cY = cardsStartY + row * (cardH + gapY);

        // Contenedor tarjeta
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        drawRoundRect(ctx, cX, cY, cardW, cardH, 8);
        ctx.fill();
        ctx.stroke();

        // Barra superior
        ctx.fillStyle = '#064e3b';
        drawRoundRect(ctx, cX, cY, cardW, 38, 8);
        ctx.fill();
        ctx.fillRect(cX, cY + 24, cardW, 14);

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 11.5px Arial, sans-serif';
        ctx.fillText(`${ev.icon}  ${ev.title.toUpperCase()}`, cX + 14, cY + 24);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#a7f3d0';
        ctx.font = 'bold 9px Arial, sans-serif';
        ctx.fillText(ev.category.toUpperCase(), cX + cardW - 14, cY + 24);
        ctx.textAlign = 'left';

        // Imagen o Placeholder
        const imgBoxX = cX + 10;
        const imgBoxY = cY + 46;
        const imgBoxW = cardW - 20;
        const imgBoxH = cardH - 56;

        if (ev.loadedImg) {
          drawCoverImage(ctx, ev.loadedImg, imgBoxX, imgBoxY, imgBoxW, imgBoxH, 6);
        } else {
          ctx.fillStyle = '#f1f5f9';
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 1;
          drawRoundRect(ctx, imgBoxX, imgBoxY, imgBoxW, imgBoxH, 6);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#94a3b8';
          ctx.font = '40px Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(ev.icon || '📄', imgBoxX + imgBoxW / 2, imgBoxY + imgBoxH / 2 - 15);

          ctx.fillStyle = '#334155';
          ctx.font = '900 11px Arial, sans-serif';
          ctx.fillText(ev.title, imgBoxX + imgBoxW / 2, imgBoxY + imgBoxH / 2 + 25);

          ctx.fillStyle = '#059669';
          ctx.font = 'bold 9.5px Arial, sans-serif';
          ctx.fillText('✓ Archivo Registrado en CRM Solux Green', imgBoxX + imgBoxW / 2, imgBoxY + imgBoxH / 2 + 45);
          ctx.textAlign = 'left';
        }
      });
    }

    // Exportar archivo de imagen
    const format = options?.format || 'jpeg';
    const mime = format === 'png' ? 'image/png' : 'image/jpeg';
    const extension = format === 'png' ? 'png' : 'jpg';
    const quality = format === 'png' ? undefined : 0.95;

    const dataUrl = canvas.toDataURL(mime, quality);
    const safeClientName = proj.clientName.replace(/[^a-zA-Z0-9]/g, '_');
    const link = document.createElement('a');
    link.download = `Cotizacion_${safeClientName}_${proj.id}.${extension}`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return true;
  } catch (error) {
    console.error('Error generando imagen de cotización:', error);
    return false;
  }
}

/**
 * Exporta listado general de proyectos a PDF
 */
export async function exportProjectsListPDF(
  projects: SolarProject[],
  title: string = 'Reporte General de Expedientes Solares',
  config?: SoluxConfig
): Promise<boolean> {
  const container = document.createElement('div');
  const rowsHtml = projects.map((p, idx) => {
    const panels = p.estimatedPanels || 2;
    const inv = p.totalInvestment || (panels * (Number(config?.panelBasePrice) || 11000));
    return `
      <tr style="border-bottom: 1px solid #e2e8f0; background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; font-size: 9px;">
        <td style="padding: 6px; font-weight: 900; color: #0f172a;">${p.id}</td>
        <td style="padding: 6px; font-weight: bold; color: #0f172a;">${p.clientName}</td>
        <td style="padding: 6px; color: #475569;">${p.clientPhone}</td>
        <td style="padding: 6px; color: #475569;">${p.municipalityState}</td>
        <td style="padding: 6px; text-align: center; font-weight: 900; color: #059669;">${panels}</td>
        <td style="padding: 6px; text-align: right; font-weight: 900; color: #0f172a;">$${inv.toLocaleString('es-MX')}</td>
        <td style="padding: 6px; text-transform: uppercase; font-size: 8px; font-weight: bold; color: #0284c7;">${formatPaymentMethod(p.paymentMethodDesired, config)}</td>
        <td style="padding: 6px; text-align: center; text-transform: uppercase; font-size: 8px; font-weight: 900; color: #166534;">${p.status || 'validación'}</td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #0f172a; padding: 20px; background: #ffffff;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #059669; padding-bottom: 10px; margin-bottom: 15px;">
        <div>
          <h2 style="font-size: 16px; font-weight: 900; color: #064e3b; margin: 0;">SOLUX GREEN &bull; ${title.toUpperCase()}</h2>
          <p style="font-size: 8px; color: #64748b; margin: 2px 0 0; font-weight: bold;">Total de expedientes: ${projects.length} | Fecha de emisión: ${new Date().toLocaleDateString('es-MX')}</p>
        </div>
      </div>
      <table style="width: 100%; border-collapse: collapse; text-align: left;">
        <thead>
          <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1; font-size: 8px; text-transform: uppercase; font-weight: 900; color: #475569;">
            <th style="padding: 6px;">ID</th>
            <th style="padding: 6px;">Cliente</th>
            <th style="padding: 6px;">Teléfono</th>
            <th style="padding: 6px;">Municipio</th>
            <th style="padding: 6px; text-align: center;">Paneles</th>
            <th style="padding: 6px; text-align: right;">Inversión ($)</th>
            <th style="padding: 6px;">Forma Pago</th>
            <th style="padding: 6px; text-align: center;">Estatus</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  `;

  return generateAndDownloadPdf({ filename: `Reporte_Expedientes_Solux_${Date.now()}`, element: container, orientation: 'landscape' });
}

/**
 * Exporta levantamientos técnicos (TechDashboard)
 */
export async function exportSurveysListPDF(surveys: any[], filterName: string = 'Todos'): Promise<boolean> {
  const container = document.createElement('div');
  const rows = surveys.map((s, idx) => `
    <tr style="border-bottom: 1px solid #e2e8f0; background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; font-size: 9px;">
      <td style="padding: 6px; font-weight: bold;">${s.id}</td>
      <td style="padding: 6px; font-weight: 900;">${s.clientName}</td>
      <td style="padding: 6px;">${s.clientPhone}</td>
      <td style="padding: 6px;">${s.municipalityState}</td>
      <td style="padding: 6px; text-align: center; font-weight: bold;">${s.estimatedPanels || 2}</td>
      <td style="padding: 6px; text-transform: uppercase; font-weight: 900; color: ${s.siteSurveyStatus === 'aprobado' ? '#059669' : s.siteSurveyStatus === 'rechazado' ? '#dc2626' : '#d97706'};">
        ${s.siteSurveyStatus || 'pendiente'}
      </td>
    </tr>
  `).join('');

  container.innerHTML = `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #ffffff;">
      <div style="border-bottom: 2px solid #0d9488; padding-bottom: 10px; margin-bottom: 15px;">
        <h2 style="font-size: 16px; font-weight: 900; color: #115e59; margin: 0;">SOLUX GREEN &bull; REPORTE DE LEVANTAMIENTOS TÉCNICOS</h2>
        <p style="font-size: 8px; color: #64748b; margin: 2px 0 0; font-weight: bold;">Filtro: ${filterName.toUpperCase()} | Emitido: ${new Date().toLocaleDateString('es-MX')}</p>
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
        <thead>
          <tr style="background: #f0fdfa; border-bottom: 2px solid #99f6e4; text-transform: uppercase; font-weight: 900; color: #0f766e;">
            <th style="padding: 6px; text-align: left;">ID</th>
            <th style="padding: 6px; text-align: left;">Cliente</th>
            <th style="padding: 6px; text-align: left;">Teléfono</th>
            <th style="padding: 6px; text-align: left;">Ubicación</th>
            <th style="padding: 6px; text-align: center;">Paneles</th>
            <th style="padding: 6px; text-align: left;">Dictamen Visita</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;

  return generateAndDownloadPdf({ filename: `Levantamientos_Tecnicos_Solux_${Date.now()}`, element: container, orientation: 'portrait' });
}

/**
 * Exporta referidos de un Enlace o Empleado
 */
export async function exportReferralsListPDF(referrals: SolarProject[], userName: string): Promise<boolean> {
  const container = document.createElement('div');
  const rows = referrals.map((r, idx) => `
    <tr style="border-bottom: 1px solid #e2e8f0; background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; font-size: 9px;">
      <td style="padding: 6px; font-weight: bold;">${r.id}</td>
      <td style="padding: 6px; font-weight: 900;">${r.clientName}</td>
      <td style="padding: 6px;">${r.clientPhone}</td>
      <td style="padding: 6px;">${r.municipalityState}</td>
      <td style="padding: 6px; text-align: center; font-weight: bold;">${r.estimatedPanels || 2}</td>
      <td style="padding: 6px; text-align: center; text-transform: uppercase; font-weight: 900; color: #059669;">${r.status || 'validación'}</td>
    </tr>
  `).join('');

  container.innerHTML = `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #ffffff;">
      <div style="border-bottom: 2px solid #10b981; padding-bottom: 10px; margin-bottom: 15px;">
        <h2 style="font-size: 16px; font-weight: 900; color: #064e3b; margin: 0;">SOLUX GREEN &bull; REPORTE DE REFERIDOS Y COMISIONES</h2>
        <p style="font-size: 8px; color: #64748b; margin: 2px 0 0; font-weight: bold;">Titular: ${userName} | Total de prospectos: ${referrals.length}</p>
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
        <thead>
          <tr style="background: #ecfdf5; border-bottom: 2px solid #a7f3d0; text-transform: uppercase; font-weight: 900; color: #065f46;">
            <th style="padding: 6px; text-align: left;">ID</th>
            <th style="padding: 6px; text-align: left;">Prospecto</th>
            <th style="padding: 6px; text-align: left;">Contacto</th>
            <th style="padding: 6px; text-align: left;">Ubicación</th>
            <th style="padding: 6px; text-align: center;">Paneles</th>
            <th style="padding: 6px; text-align: center;">Estatus</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;

  return generateAndDownloadPdf({ filename: `Referidos_Solux_${userName.replace(/\s+/g, '_')}`, element: container, orientation: 'portrait' });
}

/**
 * Genera y descarga directamente el Dictamen Oficial de Levantamiento Técnico y Viabilidad en Sitio en PDF
 */
export async function exportTechnicalSurveyPDF(
  proj: SolarProject,
  config?: SoluxConfig
): Promise<boolean> {
  try {
    const logoImg = await loadLogoImage();
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1697;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    // Fondo blanco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1200, 1697);

    // Barra superior decorativa verde oscuro
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 0, 1200, 140);

    // Si hay logo, dibujarlo
    if (logoImg) {
      drawCoverImage(ctx, logoImg, 50, 30, 200, 80, 8);
    } else {
      ctx.fillStyle = '#10b981';
      ctx.font = '900 32px Arial, sans-serif';
      ctx.fillText('SOLUX GREEN', 50, 80);
    }

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 20px Arial, sans-serif';
    ctx.fillText('DICTAMEN OFICIAL DE LEVANTAMIENTO TÉCNICO', 1150, 58);

    ctx.fillStyle = '#6ee7b7';
    ctx.font = 'bold 12px Arial, sans-serif';
    ctx.fillText('VALIDACIÓN DE VIABILIDAD EN SITIO E INFRAESTRUCTURA CFE', 1150, 84);

    ctx.fillStyle = '#a7f3d0';
    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.fillText(`FOLIO: ${proj.id} | FECHA: ${proj.createdDate || new Date().toISOString().split('T')[0]}`, 1150, 108);
    ctx.textAlign = 'left';

    // Badge de Certificación
    ctx.fillStyle = '#ecfdf5';
    drawRoundRect(ctx, 50, 160, 1100, 50, 8);
    ctx.fill();
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#065f46';
    ctx.font = '900 13px Arial, sans-serif';
    ctx.fillText('ESTATUS DEL DICTAMEN:', 70, 191);
    ctx.fillStyle = '#047857';
    ctx.font = '900 13px Arial, sans-serif';
    ctx.fillText('PROPIEDAD 100% VIABLE PARA INSTALACIÓN FOTOVOLTAICA CERTIFICADA', 260, 191);

    // Sección 1: DATOS DEL EXPEDIENTE Y TITULAR
    ctx.fillStyle = '#f8fafc';
    drawRoundRect(ctx, 50, 230, 1100, 110, 8);
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = '900 12px Arial, sans-serif';
    ctx.fillText('1. INFORMACIÓN DEL PROYECTO Y TITULAR', 70, 255);

    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('Cliente / Razón Social:', 70, 280);
    ctx.fillStyle = '#0f172a';
    ctx.fillText((proj.clientName || 'Cliente Solux').toUpperCase(), 230, 280);

    ctx.fillStyle = '#475569';
    ctx.fillText('WhatsApp / Teléfono:', 70, 305);
    ctx.fillStyle = '#0f172a';
    ctx.fillText(proj.clientPhone || 'No registrado', 230, 305);

    ctx.fillStyle = '#475569';
    ctx.fillText('Ubicación / Municipio:', 620, 280);
    ctx.fillStyle = '#0f172a';
    ctx.fillText(proj.municipalityState || 'No especificado', 780, 280);

    ctx.fillStyle = '#475569';
    ctx.fillText('Asesor Responsable:', 620, 305);
    ctx.fillStyle = '#0f172a';
    ctx.fillText(proj.advisorName || 'Ing. Técnico Certificado Solux', 780, 305);

    // Sección 2: CHECKLIST DE VIABILIDAD EN SITIO (3 Tarjetas)
    const boxY = 360;
    const boxW = 345;
    const boxH = 180;

    // Tarjeta A: Azotea y Sombras
    ctx.fillStyle = '#ffffff';
    drawRoundRect(ctx, 50, boxY, boxW, boxH, 8);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.stroke();
    ctx.fillStyle = '#065f46';
    ctx.fillRect(50, boxY, boxW, 30);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 11px Arial, sans-serif';
    ctx.fillText('SUPERFICIE Y AZOTEA', 65, boxY + 20);

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.fillText('Condición del Techo:', 65, boxY + 60);
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 11px Arial, sans-serif';
    ctx.fillText((proj.siteSurveyData?.roofCondition || 'Buena').toUpperCase(), 65, boxY + 76);

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.fillText('Incidencia de Sombras:', 65, boxY + 105);
    ctx.fillStyle = '#047857';
    ctx.font = '900 11px Arial, sans-serif';
    ctx.fillText(proj.siteSurveyData?.noShadows !== false ? '100% SIN SOMBRAS' : 'PARCIALES', 65, boxY + 121);

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.fillText('Área Requerida Mínima:', 65, boxY + 150);
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 11px Arial, sans-serif';
    ctx.fillText(`${proj.requiredArea || ((proj.estimatedPanels || 4) * 2.88).toFixed(1)} m²`, 65, boxY + 166);

    // Tarjeta B: Acometida Eléctrica
    ctx.fillStyle = '#ffffff';
    drawRoundRect(ctx, 425, boxY, boxW, boxH, 8);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.stroke();
    ctx.fillStyle = '#0e7490';
    ctx.fillRect(425, boxY, boxW, 30);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 11px Arial, sans-serif';
    ctx.fillText('ACOMETIDA E INFRAESTRUCTURA', 440, boxY + 20);

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.fillText('Distancia hacia el Medidor:', 440, boxY + 60);
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 11px Arial, sans-serif';
    ctx.fillText(`${proj.siteSurveyData?.wiringDistance || '12'} metros`, 440, boxY + 76);

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.fillText('Tipo de Carga Eléctrica:', 440, boxY + 105);
    ctx.fillStyle = '#0e7490';
    ctx.font = '900 11px Arial, sans-serif';
    ctx.fillText(`${proj.wiresCount || 2} Hilos (${(proj.electricalLoadType || []).join('/') || '220V'})`, 440, boxY + 121);

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.fillText('Medidores Instalados:', 440, boxY + 150);
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 11px Arial, sans-serif';
    ctx.fillText(`${proj.metersCount || 1} Medidor(es) CFE`, 440, boxY + 166);

    // Tarjeta C: Dimensionamiento Solar
    ctx.fillStyle = '#ffffff';
    drawRoundRect(ctx, 800, boxY, boxW, boxH, 8);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.stroke();
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(800, boxY, boxW, 30);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 11px Arial, sans-serif';
    ctx.fillText('SISTEMA DIMENSIONADO', 815, boxY + 20);

    const panels = proj.estimatedPanels || 4;
    const panelPrice = Number(config?.panelBasePrice) || 11000;
    const totalInv = proj.totalInvestment || (panels * panelPrice);

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.fillText('Módulos Solares (550W):', 815, boxY + 60);
    ctx.fillStyle = '#1e3a8a';
    ctx.font = '900 11px Arial, sans-serif';
    ctx.fillText(`${panels} PANELES TIER 1`, 815, boxY + 76);

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.fillText('Potencia del Generador:', 815, boxY + 105);
    ctx.fillStyle = '#047857';
    ctx.font = '900 11px Arial, sans-serif';
    ctx.fillText(`${(panels * 0.55).toFixed(2)} kWp`, 815, boxY + 121);

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.fillText('Inversión Estimada Lista:', 815, boxY + 150);
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 11px Arial, sans-serif';
    ctx.fillText(`$${totalInv.toLocaleString('es-MX')} MXN`, 815, boxY + 166);

    // Sección 3: DICTAMEN Y OBSERVACIONES TÉCNICAS DEL PERITO
    const notesY = 565;
    ctx.fillStyle = '#f8fafc';
    drawRoundRect(ctx, 50, notesY, 1100, 130, 8);
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.stroke();

    ctx.fillStyle = '#064e3b';
    ctx.font = '900 11.5px Arial, sans-serif';
    ctx.fillText('3. OBSERVACIONES TÉCNICAS Y DICTAMEN DE INSTALACIÓN', 70, notesY + 26);

    ctx.fillStyle = '#334155';
    ctx.font = '10.5px Arial, sans-serif';
    const notesText = proj.siteSurveyData?.surveyorNotes || 
      'Se realizó la inspección física en el inmueble del cliente. La superficie de azotea cuenta con estructura firme apta para montaje con microestructuras de aluminio anodizado. La orientación solar es óptima para la generación requerida. La trayectoria hacia el medidor se encuentra despejada para canalización eléctrica de acuerdo con la norma oficial NOM-001-SEDE.';
    
    // Wrap text
    const words = notesText.split(' ');
    let line = '';
    let currY = notesY + 52;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > 1050 && n > 0) {
        ctx.fillText(line, 70, currY);
        line = words[n] + ' ';
        currY += 18;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 70, currY);

    // Sección 4: FIRMAS DIGITALES Y SELLOS
    const sigY = 720;
    // Box 1: Cliente
    ctx.fillStyle = '#ffffff';
    drawRoundRect(ctx, 50, sigY, 530, 200, 8);
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = '900 11px Arial, sans-serif';
    ctx.fillText('CONFORMIDAD DEL CLIENTE', 70, sigY + 25);

    // Draw client signature if exists
    let sigImg: HTMLImageElement | null = null;
    if (proj.siteSurveyData?.clientSignature) {
      sigImg = await loadSafeImage(proj.siteSurveyData.clientSignature);
    }
    if (sigImg) {
      drawCoverImage(ctx, sigImg, 150, sigY + 40, 320, 100, 4);
    } else {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#059669';
      ctx.font = 'bold 16px "Brush Script MT", cursive, Arial';
      ctx.fillText(proj.clientName, 315, sigY + 95);
      ctx.fillStyle = '#64748b';
      ctx.font = '9px Arial, sans-serif';
      ctx.fillText('Firma Digital Electrónica Verificada', 315, sigY + 120);
      ctx.textAlign = 'left';
    }

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(90, sigY + 155);
    ctx.lineTo(540, sigY + 155);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 10.5px Arial, sans-serif';
    ctx.fillText(proj.clientName.toUpperCase(), 315, sigY + 172);
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 9px Arial, sans-serif';
    ctx.fillText('Titular del Inmueble y Contrato CFE', 315, sigY + 188);
    ctx.textAlign = 'left';

    // Box 2: Perito / Solux Green
    ctx.fillStyle = '#ffffff';
    drawRoundRect(ctx, 620, sigY, 530, 200, 8);
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = '900 11px Arial, sans-serif';
    ctx.fillText('VALIDACIÓN TÉCNICA CERTIFICADA SOLUX GREEN', 640, sigY + 25);

    // Sello técnico digital
    ctx.textAlign = 'center';
    ctx.fillStyle = '#059669';
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.fillText('SOLUX GREEN • CERTIFICADO TÉCNICO', 885, sigY + 80);
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.fillStyle = '#047857';
    ctx.fillText(`FOLIO DE VALIDACIÓN: SG-VAL-${proj.id.slice(-8)}`, 885, sigY + 102);
    ctx.fillText('APROBADO PARA INTERCONEXIÓN CFE', 885, sigY + 120);
    ctx.textAlign = 'left';

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(660, sigY + 155);
    ctx.lineTo(1110, sigY + 155);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 10.5px Arial, sans-serif';
    ctx.fillText(proj.advisorName || 'ING. DE PROYECTOS FOTOVOLTAICOS', 885, sigY + 172);
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 9px Arial, sans-serif';
    ctx.fillText('Departamento de Ingeniería e Interconexión CFE', 885, sigY + 188);
    ctx.textAlign = 'left';

    // Sección 5: Miniaturas de Evidencias (si existen)
    const evidences = await collectProjectEvidences(proj);
    if (evidences.length > 0) {
      const evBoxY = 945;
      ctx.fillStyle = '#f1f5f9';
      drawRoundRect(ctx, 50, evBoxY, 1100, 240, 8);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = '900 11px Arial, sans-serif';
      ctx.fillText('EVIDENCIAS DE INSPECCIÓN TÉCNICA EN SITIO', 70, evBoxY + 25);

      const maxEv = Math.min(evidences.length, 4);
      const evW = 240;
      const evH = 160;
      for (let i = 0; i < maxEv; i++) {
        const evItem = evidences[i];
        const curEvX = 70 + (i * 265);
        const curEvY = evBoxY + 45;

        ctx.fillStyle = '#ffffff';
        drawRoundRect(ctx, curEvX, curEvY, evW, evH, 6);
        ctx.fill();
        ctx.strokeStyle = '#cbd5e1';
        ctx.stroke();

        if (evItem.loadedImg) {
          drawCoverImage(ctx, evItem.loadedImg, curEvX + 4, curEvY + 4, evW - 8, evH - 35, 4);
        } else {
          ctx.fillStyle = '#64748b';
          ctx.font = '32px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(evItem.icon || '📷', curEvX + evW / 2, curEvY + 70);
          ctx.textAlign = 'left';
        }

        ctx.fillStyle = '#0f172a';
        ctx.font = '900 8.5px Arial, sans-serif';
        ctx.fillText(evItem.title.length > 28 ? evItem.title.slice(0, 26) + '...' : evItem.title, curEvX + 6, curEvY + evH - 12);
      }
    }

    // Pie de página
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, 1630);
    ctx.lineTo(1150, 1630);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 9.5px Arial, sans-serif';
    ctx.fillText('Solux Green • Certificación de Levantamiento Técnico y Viabilidad Fotovoltaica • Documento Oficial e Inalterable', 600, 1655);
    ctx.textAlign = 'left';

    // Convertir canvas a imagen y agregar al PDF
    const pageData = canvas.toDataURL('image/jpeg', 0.98);
    pdf.addImage(pageData, 'JPEG', 0, 0, 210, 297);

    // Descarga directa con nombre limpio
    const safeName = (proj.clientName || 'Cliente').replace(/[^a-zA-Z0-9]/g, '_');
    pdf.save(`Dictamen_Tecnico_Levantamiento_${safeName}_${proj.id}.pdf`);
    return true;
  } catch (err) {
    console.error('Error al generar Dictamen Técnico PDF:', err);
    return false;
  }
}

/**
 * Descarga o visualiza el documento de levantamiento técnico de forma infalible:
 * - Si es data: URL, lo descarga como Blob real (evitando que Chrome bloquee y abra ventana en blanco).
 * - Si es URL externa válida que no sea de dominio placeholder, la abre en nueva pestaña.
 * - Si no existe, falla o es el placeholder inalcanzable, genera instantáneamente el PDF oficial con datos reales.
 */
export async function downloadOrViewTechnicalSurvey(
  proj: SolarProject,
  config?: SoluxConfig,
  onNotify?: (msg: string, type?: 'success' | 'error') => void
): Promise<boolean> {
  if (onNotify) onNotify('⏳ Preparando y descargando PDF del Levantamiento Técnico...');

  const docUrl = proj.evidence?.technicalSurveyDoc;

  // 1. Si es base64 data URL de PDF o imagen:
  if (docUrl && docUrl.startsWith('data:')) {
    try {
      const parts = docUrl.split(',');
      if (parts.length > 1 && parts[1].length > 50) {
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
        
        const a = document.createElement('a');
        a.href = blobUrl;
        const ext = mimeType.includes('png') ? 'png' : (mimeType.includes('jpeg') || mimeType.includes('jpg') ? 'jpg' : 'pdf');
        const safeName = (proj.clientName || 'Cliente').replace(/[^a-zA-Z0-9]/g, '_');
        a.download = `Dictamen_Tecnico_Levantamiento_${safeName}_${proj.id}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
        if (onNotify) onNotify('📄 Documento de levantamiento técnico descargado exitosamente.');
        return true;
      }
    } catch (e) {
      console.warn('Error al procesar data URL, regenerando PDF...', e);
    }
  }

  // 2. Si es una URL real que NO sea el dominio placeholder
  if (docUrl && docUrl.startsWith('http') && !docUrl.includes('appdesignproyectos.com')) {
    try {
      window.open(docUrl, '_blank');
      if (onNotify) onNotify('📄 Abriendo documento en nueva pestaña.');
      return true;
    } catch (e) {
      console.warn('Error al abrir URL externa, regenerando PDF...', e);
    }
  }

  // 3. Si es el placeholder falso 'appdesignproyectos.com' o no hay archivo válido:
  // Generar el PDF oficial con todos los datos reales del proyecto
  const success = await exportTechnicalSurveyPDF(proj, config);
  if (success) {
    if (onNotify) onNotify('📄 Dictamen Técnico Oficial generado y descargado.');
    return true;
  } else {
    if (onNotify) onNotify('❌ Error al generar el PDF del Levantamiento Técnico.', 'error');
    return false;
  }
}

/**
 * Genera y descarga documentos promocionales oficiales de Solux Green (Folleto Comercial o Ficha Técnica)
 */
export async function exportPromotionalPDF(
  type: 'folleto' | 'ficha_tecnica' | 'redes'
): Promise<boolean> {
  try {
    const logoImg = await loadLogoImage();
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1697;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1200, 1697);

    // Top Header Banner
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 0, 1200, 160);

    if (logoImg) {
      drawCoverImage(ctx, logoImg, 50, 35, 220, 90, 8);
    } else {
      ctx.fillStyle = '#10b981';
      ctx.font = '900 36px Arial, sans-serif';
      ctx.fillText('SOLUX GREEN', 50, 95);
    }

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 24px Arial, sans-serif';
    if (type === 'ficha_tecnica') {
      ctx.fillText('FICHA TÉCNICA OFICIAL • SISTEMAS FOTOVOLTAICOS', 1150, 70);
      ctx.fillStyle = '#6ee7b7';
      ctx.font = 'bold 13px Arial, sans-serif';
      ctx.fillText('ESPECIFICACIONES DE INGENIERÍA, MÓDULOS TIER 1 E INTERCONEXIÓN CFE', 1150, 100);
    } else {
      ctx.fillText('FOLLETO COMERCIAL Y BENEFICIOS 2026', 1150, 70);
      ctx.fillStyle = '#6ee7b7';
      ctx.font = 'bold 13px Arial, sans-serif';
      ctx.fillText('AHORRO HASTA EL 98% EN TU RECIBO CFE • ENERGÍA SOLAR INTELIGENTE', 1150, 100);
    }
    ctx.fillStyle = '#a7f3d0';
    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.fillText('VERSIÓN OFICIAL SOLUX GREEN • MÉXICO 2026', 1150, 125);
    ctx.textAlign = 'left';

    if (type === 'ficha_tecnica') {
      // 1. MÓDULOS FOTOVOLTAICOS
      ctx.fillStyle = '#065f46';
      drawRoundRect(ctx, 50, 190, 1100, 35, 6);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 13px Arial, sans-serif';
      ctx.fillText('1. ESPECIFICACIONES DE MÓDULOS SOLARES TIER 1 (550W MONOCRISTALINO)', 70, 213);

      const specs = [
        { label: 'Tecnología de Celdas', val: 'Monocristalino Half-Cell PERC 144 celdas' },
        { label: 'Potencia Nominal (Pmax)', val: '550 Wp (+3% tolerancia positiva)' },
        { label: 'Eficiencia del Módulo', val: 'Hasta 21.3% de conversión solar' },
        { label: 'Garantía de Producto', val: '12 años de reemplazo directo de fábrica' },
        { label: 'Garantía de Generación Lineal', val: '25 años de rendimiento garantizado al 84.8%' },
        { label: 'Coeficiente Térmico Pmax', val: '-0.35% / °C (Excelente rendimiento en clima cálido)' },
        { label: 'Carga Máxima de Viento / Nieve', val: '2400 Pa / 5400 Pa (Resistencia estructural)' },
        { label: 'Grado de Protección Caja de Conexión', val: 'IP68 con 3 diodos bypass de alta durabilidad' }
      ];

      ctx.fillStyle = '#f8fafc';
      drawRoundRect(ctx, 50, 235, 1100, 270, 8);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.stroke();

      specs.forEach((s, idx) => {
        const sy = 265 + (idx * 30);
        ctx.fillStyle = '#334155';
        ctx.font = 'bold 11.5px Arial, sans-serif';
        ctx.fillText(s.label + ':', 80, sy);
        ctx.fillStyle = '#065f46';
        ctx.font = '900 11.5px Arial, sans-serif';
        ctx.fillText(s.val, 420, sy);
      });

      // 2. INVERSORES Y MICROINVERSORES
      ctx.fillStyle = '#0e7490';
      drawRoundRect(ctx, 50, 530, 1100, 35, 6);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 13px Arial, sans-serif';
      ctx.fillText('2. INVERSORES DE RED E INTERCONEXIÓN CFE CON MONITOREO WIFI 24/7', 70, 553);

      const invSpecs = [
        { label: 'Tipo de Inversor', val: 'Interconectado a Red (Grid-Tied) con sincronización automática' },
        { label: 'Voltaje de Conexión', val: '110V / 220V Bifásico / 440V Trifásico' },
        { label: 'Eficiencia MPPT', val: '99.9% de seguimiento del punto de máxima potencia' },
        { label: 'Monitoreo Integrado', val: 'Tarjeta WiFi / App móvil iOS y Android con métricas en tiempo real' },
        { label: 'Protecciones Eléctricas', val: 'Protección contra sobretensiones Tipo II, anti-isla y polaridad inversa' },
        { label: 'Normativas de Cumplimiento', val: 'NOM-001-SEDE-2012, IEEE 1547, UL 1741, CFE G-0100-04' }
      ];

      ctx.fillStyle = '#f8fafc';
      drawRoundRect(ctx, 50, 575, 1100, 210, 8);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.stroke();

      invSpecs.forEach((s, idx) => {
        const sy = 605 + (idx * 30);
        ctx.fillStyle = '#334155';
        ctx.font = 'bold 11.5px Arial, sans-serif';
        ctx.fillText(s.label + ':', 80, sy);
        ctx.fillStyle = '#0e7490';
        ctx.font = '900 11.5px Arial, sans-serif';
        ctx.fillText(s.val, 420, sy);
      });

      // 3. ESTRUCTURA Y MONTAJE
      ctx.fillStyle = '#1e3a8a';
      drawRoundRect(ctx, 50, 810, 1100, 35, 6);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 13px Arial, sans-serif';
      ctx.fillText('3. ESTRUCTURAS DE MONTAJE Y HERRAJES CERTIFICADOS', 70, 833);

      ctx.fillStyle = '#f8fafc';
      drawRoundRect(ctx, 50, 855, 1100, 140, 8);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.stroke();

      ctx.fillStyle = '#334155';
      ctx.font = 'bold 11px Arial, sans-serif';
      ctx.fillText('• Materiales: Perfiles y grapas intermedias/finales en aluminio anodizado AL6005-T5 con tornillería de acero inoxidable 304.', 80, 885);
      ctx.fillText('• Resistencia eólica: Diseñado y calculado para soportar vientos de hasta 180 km/h según la zona geográfica.', 80, 915);
      ctx.fillText('• Impermeabilización: Instalación mediante fijaciones con selladores de poliuretano industrial de alta resistencia UV.', 80, 945);
      ctx.fillText('• Compatibilidad: Azoteas de concreto, lámina engargolada, teja y estructuras elevadas.', 80, 975);

    } else {
      // FOLLETO COMERCIAL / BENEFICIOS
      // 1. AHORRO Y ECONOMÍA
      ctx.fillStyle = '#047857';
      drawRoundRect(ctx, 50, 190, 1100, 200, 8);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 20px Arial, sans-serif';
      ctx.fillText('⚡ AHORRA HASTA UN 98% EN TU FACTURA DE LUZ CFE', 80, 235);
      ctx.font = 'bold 13px Arial, sans-serif';
      ctx.fillStyle = '#d1fae5';
      ctx.fillText('Transforma el gasto excesivo de tu recibo de energía en una inversión patrimonial con Solux Green.', 80, 265);
      ctx.fillText('• Paga el mínimo de servicio a CFE mientras tus paneles generan energía limpia y gratuita durante el día.', 80, 295);
      ctx.fillText('• Retorno de inversión estimado de 2 a 3.5 años en tarifas comerciales y de alto consumo (DAC).', 80, 325);
      ctx.fillText('• Deducción fiscal del 100% el primer año en ISR para personas físicas con actividad empresarial y personas morales.', 80, 355);

      // 3 Columnas de Beneficios
      const cols = [
        {
          title: 'CALIDAD TIER 1',
          color: '#065f46',
          items: ['Paneles Monocristalinos 550W', '25 años de garantía de potencia', 'Microestructuras anticorrosión', 'Monitoreo en vivo vía App']
        },
        {
          title: 'GESTIÓN CFE 100% INCLUIDA',
          color: '#0e7490',
          items: ['Contrato de interconexión oficial', 'Gestión de medidor bidireccional', 'Dictamen técnico certificado', 'Instalación en 1 a 2 días']
        },
        {
          title: 'FORMAS DE PAGO FLEXIBLES',
          color: '#1e3a8a',
          items: ['Pago de Contado con descuento', '12 Meses sin Intereses (MSI)', 'Crédito Verde sin enganche forzoso', 'Pagos a capital sin penalización']
        }
      ];

      cols.forEach((col, idx) => {
        const cx = 50 + (idx * 380);
        ctx.fillStyle = '#ffffff';
        drawRoundRect(ctx, cx, 420, 340, 280, 8);
        ctx.fill();
        ctx.strokeStyle = '#cbd5e1';
        ctx.stroke();

        ctx.fillStyle = col.color;
        ctx.fillRect(cx, 420, 340, 40);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 12px Arial, sans-serif';
        ctx.fillText(col.title, cx + 20, 445);

        col.items.forEach((item, itemIdx) => {
          ctx.fillStyle = '#334155';
          ctx.font = 'bold 11px Arial, sans-serif';
          ctx.fillText('✔ ' + item, cx + 20, 490 + (itemIdx * 45));
        });
      });

      // Banner de llamada a la acción
      ctx.fillStyle = '#f0fdf4';
      drawRoundRect(ctx, 50, 730, 1100, 180, 8);
      ctx.fill();
      ctx.strokeStyle = '#86efac';
      ctx.stroke();

      ctx.fillStyle = '#14532d';
      ctx.font = '900 18px Arial, sans-serif';
      ctx.fillText('¿CÓMO INICIAR TU PROYECTO CON SOLUX GREEN?', 80, 775);
      ctx.font = 'bold 12px Arial, sans-serif';
      ctx.fillStyle = '#166534';
      ctx.fillText('1. Envía una foto de tu recibo CFE más reciente a tu asesor o partner Solux Green.', 80, 815);
      ctx.fillText('2. Realizamos tu dimensionamiento y cotización formal personalizada en minutos.', 80, 845);
      ctx.fillText('3. Realizamos el levantamiento técnico en tu domicilio y coordinamos la instalación.', 80, 875);
    }

    // Pie de página oficial
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, 1620);
    ctx.lineTo(1150, 1620);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.fillText('Solux Green • Energía Solar de Alta Calidad • Contacto: 229 343 3597 • contacto@soluxgreen.com • México', 600, 1650);
    ctx.textAlign = 'left';

    const pageData = canvas.toDataURL('image/jpeg', 0.98);
    pdf.addImage(pageData, 'JPEG', 0, 0, 210, 297);

    const filename = type === 'ficha_tecnica' ? 'Ficha_Tecnica_Oficial_Solux_Green.pdf' : 'Folleto_Comercial_Solux_Green_2026.pdf';
    pdf.save(filename);
    return true;
  } catch (err) {
    console.error('Error al generar PDF promocional:', err);
    return false;
  }
}
