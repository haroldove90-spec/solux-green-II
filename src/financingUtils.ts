import { FinancingTerm, SoluxConfig } from './types';

// Utilidades para cálculo de financiamiento, enganche y métodos de pago de Solux Green

export type FinancingTermConfig = FinancingTerm;

export const ACTIVE_PAYMENT_METHODS = ['contado', 'directo_3m', 'directo_6m', 'directo_12m', 'msi'];

export interface AmortizationRow {
  month: number;
  initialBalance: number;
  capital: number;
  interest: number;
  totalPayment: number;
  finalBalance: number;
}

export interface FinancingSimulationResult {
  isFinancing: boolean;
  isDirectFinancing: boolean;
  isContado: boolean;
  isMSI: boolean;
  months: number;
  downPercent: number;
  downPaymentPercent: number;
  downPayment: number;
  principalToFinance: number;
  financedAmount: number;
  monthlyRatePercent: number;
  monthlyInterestRate: number;
  monthlyPayment: number;
  totalInterest: number;
  totalWithInterest: number;
  totalToPay: number;
  discountPercent: number;
  discountAmount: number;
  originalInvestment: number;
  netInvestment: number;
  finalInvestment: number;
  schedule?: AmortizationRow[];
}

export const DEFAULT_FINANCING_TERMS: FinancingTerm[] = [];

export function getPaymentMethodOptions(configOrTerms?: any, defaultDownFallback: number = 50) {
  let terms: FinancingTerm[] = [];
  let defaultDown = defaultDownFallback;
  let monthlyRate = 4.9;
  let contadoDiscount = 5;

  if (Array.isArray(configOrTerms)) {
    terms = configOrTerms;
  } else if (configOrTerms && typeof configOrTerms === 'object') {
    if (configOrTerms.financingTerms && Array.isArray(configOrTerms.financingTerms)) {
      terms = configOrTerms.financingTerms;
    }
    if (configOrTerms.defaultDownPaymentPercent != null && configOrTerms.defaultDownPaymentPercent !== '') {
      defaultDown = Number(configOrTerms.defaultDownPaymentPercent);
    }
    if (configOrTerms.monthlyInterestRate != null && configOrTerms.monthlyInterestRate !== '') {
      monthlyRate = Number(configOrTerms.monthlyInterestRate);
    }
    if (configOrTerms.contadoDiscountPercent != null && configOrTerms.contadoDiscountPercent !== '') {
      contadoDiscount = Number(configOrTerms.contadoDiscountPercent);
    }
  }

  const options = [
    { 
      value: 'contado', 
      label: `💵 Pago de Contado (${contadoDiscount}% Descuento Comercial)`,
      isCredit: false,
      months: 0 
    }
  ];

  const activeTerms = terms.filter(t => t.active !== false);
  const seenValues = new Set<string>(['contado']);

  activeTerms.forEach(t => {
    const val = `directo_${t.months}m`;
    if (!seenValues.has(val)) {
      seenValues.add(val);
      const down = t.downPaymentPercent ?? defaultDown;
      const rate = t.monthlyInterestRate ?? monthlyRate;
      options.push({
        value: val,
        label: `⚡ Financiamiento Directo Solux - ${t.label || `${t.months} Meses`} (${down}% Enganche • ${rate}% mens.)`,
        isCredit: true,
        months: t.months
      });
    }
  });

  if (!seenValues.has('msi')) {
    seenValues.add('msi');
    options.push({
      value: 'msi',
      label: '💳 Meses sin Intereses (MSI con Tarjeta Bancaria)',
      isCredit: true,
      months: 12
    });
  }

  return options;
}

export function formatPaymentMethod(method?: string, config?: any): string {
  if (!method) return 'Pago de Contado';
  if (method === 'contado') {
    const disc = config?.contadoDiscountPercent ?? 5;
    return `Pago de Contado (${disc}% Descto. Comercial)`;
  }
  if (method.startsWith('directo_') || method.startsWith('financiamiento_')) {
    const parsed = parseInt(method.replace(/[^0-9]/g, ''), 10);
    const months = !isNaN(parsed) && parsed > 0 ? parsed : 3;
    const matchedTerm = config?.financingTerms?.find((t: any) => t.months === months);
    const down = matchedTerm?.downPaymentPercent ?? config?.defaultDownPaymentPercent ?? 50;
    return `Financiamiento Directo Solux (${months} Meses - ${down}% Enganche)`;
  }
  if (method === 'directo' || method === 'financiamiento_solux') {
    const down = config?.defaultDownPaymentPercent ?? 50;
    return `Financiamiento Directo Solux (3 Meses - ${down}% Enganche)`;
  }
  switch (method) {
    case 'msi':
      return 'Meses sin Intereses (MSI con Tarjeta)';
    case 'bancario':
    case 'bancario_personal':
      return 'Crédito Bancario Externo';
    case 'financieras_externas':
      return 'Financieras Especializadas';
    case 'infonavit_verde':
      return 'Hipoteca Verde / Infonavit';
    case 'suscripcion_solar':
      return 'Suscripción Solar PPA';
    default:
      return method;
  }
}

export function calculateSoluxFinancing(
  totalInvestment: number,
  method: string,
  monthlyRateOrConfig: number | any = 4.9,
  downPercentFallback: number = 50,
  configOrTerms?: any
): FinancingSimulationResult {
  let monthlyRatePercent = 4.9;
  let downPercent = downPercentFallback;
  let terms: FinancingTerm[] = DEFAULT_FINANCING_TERMS;
  let contadoDiscountPercent = 5;

  if (typeof monthlyRateOrConfig === 'object' && monthlyRateOrConfig !== null) {
    if (monthlyRateOrConfig.monthlyInterestRate != null) monthlyRatePercent = monthlyRateOrConfig.monthlyInterestRate;
    if (monthlyRateOrConfig.defaultDownPaymentPercent != null) downPercent = monthlyRateOrConfig.defaultDownPaymentPercent;
    if (monthlyRateOrConfig.contadoDiscountPercent != null) contadoDiscountPercent = monthlyRateOrConfig.contadoDiscountPercent;
    if (Array.isArray(monthlyRateOrConfig.financingTerms)) terms = monthlyRateOrConfig.financingTerms;
  } else {
    if (typeof monthlyRateOrConfig === 'number') monthlyRatePercent = monthlyRateOrConfig;
    if (typeof downPercentFallback === 'number' && downPercentFallback > 0) downPercent = downPercentFallback;
    if (configOrTerms) {
      if (Array.isArray(configOrTerms)) {
        terms = configOrTerms;
      } else if (typeof configOrTerms === 'object') {
        if (configOrTerms.contadoDiscountPercent != null) contadoDiscountPercent = configOrTerms.contadoDiscountPercent;
        if (Array.isArray(configOrTerms.financingTerms)) terms = configOrTerms.financingTerms;
      }
    }
  }

  const isContado = method === 'contado';
  const isMSI = method === 'msi';
  let isFinancing = false;
  let months = 3;

  if (method === 'directo_3m' || method === 'financiamiento_3') {
    isFinancing = true;
    months = 3;
  } else if (method === 'directo_6m' || method === 'financiamiento_6') {
    isFinancing = true;
    months = 6;
  } else if (method === 'directo' || method === 'financiamiento_solux') {
    isFinancing = true;
    months = 3;
  } else if (method && (method.startsWith('directo_') || method.startsWith('financiamiento_'))) {
    const parsed = parseInt(method.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(parsed) && parsed > 0) {
      isFinancing = true;
      months = parsed;
    }
  }

  // Buscar plazo configurado correspondiente
  const matchedTerm = terms.find(t => t.months === months);
  const effectiveMonthlyRate = matchedTerm?.monthlyInterestRate ?? monthlyRatePercent ?? 4.9;
  const effectiveDownPercent = matchedTerm?.downPaymentPercent ?? (downPercent > 0 ? downPercent : 50);

  let discountPercent = 0;
  let discountAmount = 0;
  let finalInvestment = totalInvestment;

  if (isContado) {
    discountPercent = contadoDiscountPercent;
    discountAmount = Math.round(totalInvestment * (discountPercent / 100));
    finalInvestment = Math.max(0, totalInvestment - discountAmount);
  }

  if (isMSI) {
    const msiMonths = 12;
    const mPayment = totalInvestment > 0 ? Math.round(totalInvestment / msiMonths) : 0;
    const msiSchedule: AmortizationRow[] = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      initialBalance: Math.max(0, totalInvestment - (mPayment * i)),
      capital: i === 11 ? Math.max(0, totalInvestment - (mPayment * 11)) : mPayment,
      interest: 0,
      totalPayment: mPayment,
      finalBalance: Math.max(0, totalInvestment - (mPayment * (i + 1)))
    }));

    return {
      isFinancing: true,
      isDirectFinancing: false,
      isContado: false,
      isMSI: true,
      months: 12,
      downPercent: 0,
      downPaymentPercent: 0,
      downPayment: 0,
      principalToFinance: totalInvestment,
      financedAmount: totalInvestment,
      monthlyRatePercent: 0,
      monthlyInterestRate: 0,
      monthlyPayment: mPayment,
      totalInterest: 0,
      totalWithInterest: totalInvestment,
      totalToPay: totalInvestment,
      discountPercent: 0,
      discountAmount: 0,
      originalInvestment: totalInvestment,
      netInvestment: totalInvestment,
      finalInvestment: totalInvestment,
      schedule: msiSchedule
    };
  }

  const downPayment = isFinancing ? Math.round(totalInvestment * (effectiveDownPercent / 100)) : 0;
  const principalToFinance = isFinancing ? Math.max(0, totalInvestment - downPayment) : 0;
  const monthlyRateDecimal = effectiveMonthlyRate / 100;

  let currentBalance = principalToFinance;
  const standardCapital = months > 0 ? Math.round((principalToFinance / months) * 100) / 100 : 0;
  let totalInterest = 0;
  let firstMonthPayment = 0;
  const schedule: AmortizationRow[] = [];

  if (isFinancing && months > 0) {
    for (let i = 1; i <= months; i++) {
      const initialBalance = currentBalance;
      const capital = i === months ? Math.round(currentBalance * 100) / 100 : standardCapital;
      const interest = Math.round(initialBalance * monthlyRateDecimal * 100) / 100;
      const totalPayment = Math.round((capital + interest) * 100) / 100;
      currentBalance = Math.max(0, Math.round((currentBalance - capital) * 100) / 100);
      totalInterest += interest;
      if (i === 1) {
        firstMonthPayment = totalPayment;
      }
      schedule.push({
        month: i,
        initialBalance,
        capital,
        interest,
        totalPayment,
        finalBalance: currentBalance
      });
    }
  }

  const totalFinancedWithInterest = principalToFinance + Math.round(totalInterest);
  const totalWithInterest = isFinancing ? (downPayment + totalFinancedWithInterest) : finalInvestment;

  return {
    isFinancing,
    isDirectFinancing: isFinancing,
    isContado,
    isMSI,
    months: isFinancing ? months : 0,
    downPercent: isFinancing ? effectiveDownPercent : 0,
    downPaymentPercent: isFinancing ? effectiveDownPercent : 0,
    downPayment,
    principalToFinance,
    financedAmount: principalToFinance,
    monthlyRatePercent: effectiveMonthlyRate,
    monthlyInterestRate: effectiveMonthlyRate,
    monthlyPayment: isFinancing ? firstMonthPayment : 0,
    totalInterest: Math.round(totalInterest),
    totalWithInterest,
    totalToPay: isFinancing ? totalFinancedWithInterest : finalInvestment,
    discountPercent,
    discountAmount,
    originalInvestment: totalInvestment,
    netInvestment: finalInvestment,
    finalInvestment,
    schedule
  };
}

export function buildWhatsAppFinancialSummary(
  totalInvestment: number,
  method: string,
  monthlyRatePercent: number = 4.9,
  downPercent: number = 50,
  config?: any
): string {
  const methodLabel = formatPaymentMethod(method, config);
  const fin = calculateSoluxFinancing(totalInvestment, method, monthlyRatePercent, downPercent, config);

  if (fin.isContado) {
    return `💰 *Inversión Total:* *$${fin.originalInvestment.toLocaleString('es-MX')} MXN*
🎁 *Descuento de Contado (${fin.discountPercent}%):* *-$${fin.discountAmount.toLocaleString('es-MX')} MXN*
💳 *Total a Pagar:* *$${fin.finalInvestment.toLocaleString('es-MX')} MXN*
📋 *Método de Adquisición:* *${methodLabel}*`;
  }

  if (fin.isMSI) {
    return `💰 *Inversión Total:* *$${fin.originalInvestment.toLocaleString('es-MX')} MXN*
💳 *Esquema:* *12 Meses sin Intereses (MSI Bancario)*
📅 *Mensualidad Fija:* *$${fin.monthlyPayment.toLocaleString('es-MX')} MXN / mes* (12 Pagos)
⚡ *Enganche:* *$0.00 MXN (0%)* • *Tasa 0%*
📋 *Método de Adquisición:* *${methodLabel}*`;
  }

  if (!fin.isFinancing) {
    return `💰 *Inversión Total Estimada:* *$${totalInvestment.toLocaleString('es-MX')} MXN*
💳 *Método de Adquisición:* *${methodLabel}*`;
  }

  return `💰 *Inversión Total:* *$${totalInvestment.toLocaleString('es-MX')} MXN*
💳 *Esquema de Financiamiento:* *${methodLabel}*
  • *Enganche Requerido (${fin.downPercent}%):* *$${fin.downPayment.toLocaleString('es-MX')} MXN*
  • *Saldo a Financiar:* *$${fin.principalToFinance.toLocaleString('es-MX')} MXN*
  • *Plazo de Financiamiento:* *${fin.months} Meses*
  • *Tasa Mensual:* *${fin.monthlyRatePercent}%*
  • *Mensualidad Estimada:* *$${fin.monthlyPayment.toLocaleString('es-MX')} MXN / mes*
  • *Total Amortizado:* *$${(fin.downPayment + fin.totalToPay).toLocaleString('es-MX')} MXN*`;
}
