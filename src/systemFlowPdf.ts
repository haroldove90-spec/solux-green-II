import html2pdf from 'html2pdf.js';
import { SOLUX_LOGO_URL, SOLUX_LOGO_FALLBACK } from './logoConfig';

export function generateSystemFlowPDF(onSuccess?: () => void, onError?: (msg: string) => void) {
  try {
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'fixed';
    tempContainer.style.left = '0';
    tempContainer.style.top = '0';
    tempContainer.style.zIndex = '999999';
    tempContainer.style.opacity = '1';
    tempContainer.style.pointerEvents = 'none';
    tempContainer.style.width = '794px';
    tempContainer.style.backgroundColor = '#ffffff';
    tempContainer.style.color = '#0f172a';
    tempContainer.style.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    tempContainer.style.fontSize = '11px';
    tempContainer.style.lineHeight = '1.5';
    tempContainer.style.padding = '35px 40px';
    tempContainer.style.boxSizing = 'border-box';

    tempContainer.innerHTML = `
      <style>
        .flow-page { page-break-after: always; padding-bottom: 20px; }
        .flow-page:last-child { page-break-after: avoid; }
        .flow-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #10b981; padding-bottom: 14px; margin-bottom: 20px; }
        .flow-title { font-size: 20px; font-weight: 900; color: #064e3b; margin: 0; text-transform: uppercase; letter-spacing: -0.5px; }
        .flow-subtitle { font-size: 11px; font-weight: 700; color: #059669; margin: 2px 0 0 0; text-transform: uppercase; letter-spacing: 0.5px; }
        .badge { display: inline-block; background-color: #ecfdf5; color: #047857; font-size: 9px; font-weight: 800; padding: 3px 8px; border-radius: 6px; border: 1px solid #a7f3d0; text-transform: uppercase; }
        .section-title { font-size: 13px; font-weight: 900; color: #0f172a; text-transform: uppercase; border-left: 4px solid #10b981; padding-left: 8px; margin: 20px 0 10px 0; letter-spacing: 0.3px; }
        .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; margin-bottom: 12px; }
        .role-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
        .role-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; }
        .role-name { font-size: 11px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 4px; display: flex; align-items: center; gap: 6px; }
        .step-num { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; background-color: #10b981; color: #ffffff; font-weight: 900; font-size: 11px; border-radius: 50%; margin-right: 8px; flex-shrink: 0; }
        .step-row { display: flex; align-items: flex-start; margin-bottom: 10px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; }
        .step-content { flex: 1; }
        .step-title { font-size: 11px; font-weight: 800; color: #0f172a; margin: 0 0 3px 0; text-transform: uppercase; }
        .step-desc { font-size: 10px; color: #475569; margin: 0; line-height: 1.4; }
        .step-deliverable { font-size: 9px; font-weight: 700; color: #059669; margin-top: 4px; }
        .footer-note { font-size: 9px; text-align: center; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; margin-top: 20px; font-weight: 600; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 10px; }
        th { background-color: #f1f5f9; text-align: left; padding: 7px 10px; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; color: #334155; }
        td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; color: #1e293b; }
      </style>

      <!-- PÁGINA 1: PORTADA Y ROLES DEL SISTEMA -->
      <div class="flow-page">
        <div class="flow-header">
          <div>
            <h1 class="flow-title">Solux Green • Flujo Operativo</h1>
            <p class="flow-subtitle">Manual y Arquitectura de Procesos del Sistema Solar</p>
          </div>
          <div style="text-align: right;">
            <img src="${SOLUX_LOGO_URL}" style="height: 38px; object-fit: contain;" onerror="this.onerror=null; this.src='${SOLUX_LOGO_FALLBACK}';" />
            <div style="margin-top: 4px;"><span class="badge">Documento Oficial 2026</span></div>
          </div>
        </div>

        <div class="card" style="background: linear-gradient(135deg, #064e3b 0%, #047857 100%); color: #ffffff; border: none; padding: 16px;">
          <h2 style="font-size: 13px; font-weight: 900; margin: 0 0 6px 0; text-transform: uppercase; color: #a7f3d0;">Objetivo de la Plataforma</h2>
          <p style="font-size: 10.5px; margin: 0; line-height: 1.5; color: #f0fdf4;">
            La plataforma tecnológica de <b>Solux Green</b> automatiza y transparenta todo el ciclo comercial y técnico de proyectos fotovoltaicos interconectados a CFE. Centraliza en una sola nube segura la prospección, el cálculo de ingeniería solar, el financiamiento bancario, el levantamiento en sitio, la instalación física y el monitoreo en tiempo real, garantizando máxima eficiencia, cero burocracia y total satisfacción del cliente.
          </p>
        </div>

        <div class="section-title">Estructura de Roles y Accesos en la Plataforma</div>
        <div class="role-grid">
          <div class="role-card">
            <div class="role-name"><span style="font-size: 14px;">🤝</span> Socio Enlace (Promotor)</div>
            <p style="font-size: 9.5px; color: #475569; margin: 0;">
              Captura recibos de luz CFE de prospectos, genera su enlace de recomendación único y da seguimiento a sus comisiones ($1,000 MXN por proyecto cerrado).
            </p>
          </div>
          <div class="role-card">
            <div class="role-name"><span style="font-size: 14px;">⚡</span> Asesor Verde (Comercial)</div>
            <p style="font-size: 9.5px; color: #475569; margin: 0;">
              Calcula sistemas con el cotizador solar inteligente, formula propuestas formales, gestiona simulaciones de financiamiento bancario y atiende dudas del cliente.
            </p>
          </div>
          <div class="role-card">
            <div class="role-name"><span style="font-size: 14px;">🔧</span> Socio Partner (Instalador)</div>
            <p style="font-size: 9.5px; color: #475569; margin: 0;">
              Realiza el levantamiento técnico en sitio con evidencias fotográficas (techo, sombras, medidor, centro de carga) y ejecuta la instalación bajo normativa NOM/CFE.
            </p>
          </div>
          <div class="role-card">
            <div class="role-name"><span style="font-size: 14px;">🏢</span> Dirección y Administración</div>
            <p style="font-size: 9.5px; color: #475569; margin: 0;">
              Control del CRM general Kanban, asignación de cuadrillas de instalación, aprobación de pagos y contratos, y gestión formal de interconexión con CFE.
            </p>
          </div>
        </div>

        <div class="card" style="border-color: #cbd5e1; background-color: #f8fafc; padding: 12px;">
          <div class="role-name" style="color: #064e3b;"><span style="font-size: 14px;">👤</span> Portal Exclusivo del Cliente Final</div>
          <p style="font-size: 10px; color: #334155; margin: 0;">
            Cada cliente recibe sus <b>credenciales personalizadas únicas</b> (Usuario y Contraseña) con las que puede ingresar en cualquier momento para consultar su cotización formal, descargar su expediente técnico, verificar el avance de su trámite ante CFE y acceder al monitoreo en vivo de sus paneles solares.
          </p>
        </div>

        <div class="footer-note">
          Solux Green • Energía Solar Inteligente • www.soluxgreen.com.mx • Página 1 de 2
        </div>
      </div>

      <!-- PÁGINA 2: LAS 8 ETAPAS DEL FLUJO OPERATIVO -->
      <div class="flow-page">
        <div class="flow-header">
          <div>
            <h1 class="flow-title">Etapas del Ciclo de Vida del Proyecto</h1>
            <p class="flow-subtitle">Paso a paso desde el primer contacto hasta el ahorro garantizado</p>
          </div>
          <div style="text-align: right;">
            <img src="${SOLUX_LOGO_URL}" style="height: 34px; object-fit: contain;" onerror="this.onerror=null; this.src='${SOLUX_LOGO_FALLBACK}';" />
          </div>
        </div>

        <div class="step-row">
          <div class="step-num">1</div>
          <div class="step-content">
            <h4 class="step-title">1. Prospección y Captura de Recibo CFE</h4>
            <p class="step-desc">El Socio Enlace o el Asesor Verde ingresa los datos del cliente, fotografía del recibo CFE y ubicación en Google Maps. El sistema valida el consumo bimestral en pesos y kWh.</p>
            <div class="step-deliverable">✓ Entregable: Expediente digital creado con ID único (ej. PROJ_REF_1001).</div>
          </div>
        </div>

        <div class="step-row">
          <div class="step-num">2</div>
          <div class="step-content">
            <h4 class="step-title">2. Cálculo Inteligente y Cotización Preliminar</h4>
            <p class="step-desc">El algoritmo calcula el número exacto de paneles requeridos (módulos Tier-1 de 550W+), área requerida en azotea (m²), ahorro bimestral de hasta 95% y monto de inversión total estimada.</p>
            <div class="step-deliverable">✓ Entregable: Propuesta técnica digital y cotización base en formato PDF/WhatsApp.</div>
          </div>
        </div>

        <div class="step-row">
          <div class="step-num">3</div>
          <div class="step-content">
            <h4 class="step-title">3. Simulación de Financiamiento y Crédito</h4>
            <p class="step-desc">Se evalúan las opciones de pago deseadas: Pago de Contado, Meses Sin Intereses (MSI) o Crédito Solar con financieras aliadas. La mensualidad suele ser menor que el recibo de luz actual.</p>
            <div class="step-deliverable">✓ Entregable: Comparativa de financiamiento hasta 3 escenarios guardados en expediente.</div>
          </div>
        </div>

        <div class="step-row">
          <div class="step-num">4</div>
          <div class="step-content">
            <h4 class="step-title">4. Levantamiento Técnico en Sitio (Visita de Validación)</h4>
            <p class="step-desc">Un Socio Partner o Ingeniero de Campo visita el domicilio para certificar: estado de la azotea/losa, ausencia de sombras, distancia de cableado, calibre de acometida y centro de carga (110V/220V).</p>
            <div class="step-deliverable">✓ Entregable: Dictamen técnico fotográfico y firma digital de conformidad.</div>
          </div>
        </div>

        <div class="step-row">
          <div class="step-num">5</div>
          <div class="step-content">
            <h4 class="step-title">5. Formalización del Contrato y Anticipo</h4>
            <p class="step-desc">Aceptación de la propuesta final, firma del contrato de instalación solar y registro del anticipo correspondiente según la modalidad de pago elegida.</p>
            <div class="step-deliverable">✓ Entregable: Contrato firmado, recibo oficial de pago y asignación de cuadrilla.</div>
          </div>
        </div>

        <div class="step-row">
          <div class="step-num">6</div>
          <div class="step-content">
            <h4 class="step-title">6. Instalación y Montaje del Sistema Solar</h4>
            <p class="step-desc">La cuadrilla certificada monta las estructuras de aluminio anodizado, los módulos solares monocristalinos, el inversor/microinversores, cableado solar fotovoltaico y tierras físicas.</p>
            <div class="step-deliverable">✓ Entregable: Sistema instalado, probado y álbum de evidencia de obra concluida.</div>
          </div>
        </div>

        <div class="step-row">
          <div class="step-num">7</div>
          <div class="step-content">
            <h4 class="step-title">7. Trámite e Interconexión con CFE (Medidor Bidireccional)</h4>
            <p class="step-desc">Solux Green gestiona todo el trámite administrativo ante CFE: solicitud de interconexión en contrato de pequeña o mediana escala y canje oficial por el medidor bidireccional digital.</p>
            <div class="step-deliverable">✓ Entregable: Contrato de interconexión con CFE y nuevo medidor instalado.</div>
          </div>
        </div>

        <div class="step-row">
          <div class="step-num">8</div>
          <div class="step-content">
            <h4 class="step-title">8. Entrega Final y Monitoreo de Generación en Vivo</h4>
            <p class="step-desc">Se entrega al cliente su acceso a la aplicación móvil de monitoreo para supervisar en tiempo real cuántos kWh produce su sistema cada hora, además de pólizas de garantía de hasta 25 años.</p>
            <div class="step-deliverable">✓ Entregable: Acceso de monitoreo activado, póliza de garantía y ahorro activo.</div>
          </div>
        </div>

        <div class="card" style="background-color: #ecfdf5; border-color: #a7f3d0; margin-top: 10px; padding: 10px 14px;">
          <h5 style="margin: 0 0 3px 0; font-size: 10px; font-weight: 800; color: #064e3b; text-transform: uppercase;">Garantía y Transparencia Solux Green</h5>
          <p style="margin: 0; font-size: 9px; color: #047857;">
            Todos los procesos cuentan con respaldo en la nube con Supabase, cifrado de accesos por cliente y trazabilidad completa para asegurar que cada inversión solar cumpla con los estándares más rigurosos del país.
          </p>
        </div>

        <div class="footer-note">
          Solux Green • Energía Solar Inteligente • www.soluxgreen.com.mx • Página 2 de 2
        </div>
      </div>
    `;

    document.body.appendChild(tempContainer);

    const opt = {
      margin: [8, 8, 8, 8],
      filename: `Flujo_del_Sistema_Solux_Green_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    setTimeout(() => {
      (html2pdf as any)().set(opt).from(tempContainer).save().then(() => {
        if (onSuccess) onSuccess();
      }).catch((err: any) => {
        console.error('Error al generar PDF de flujo:', err);
        if (onError) onError('No se pudo generar el archivo PDF.');
      }).finally(() => {
        if (document.body.contains(tempContainer)) {
          document.body.removeChild(tempContainer);
        }
      });
    }, 150);
  } catch (error: any) {
    console.error('Excepción al generar PDF de flujo:', error);
    if (onError) onError(error?.message || 'Error inesperado');
  }
}
