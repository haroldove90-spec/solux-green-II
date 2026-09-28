import { supabase } from './supabaseClient';
import { SolarProject, Technician, Material, Service, ServiceType, AppNotification, PromotionalMaterial, LandingConfig } from './types';

// =====================================================================
// SOLAR PROJECTS MAPPING & CRUD
// =====================================================================

export function mapRowToSolarProject(row: any): SolarProject {
  return {
    id: row.id,
    clientName: row.client_name,
    clientPhone: row.client_phone,
    municipalityState: row.municipality_state,
    clientEmail: row.client_email || undefined,
    whatsappPhone: row.whatsapp_phone || undefined,
    googleMapsUrl: row.google_maps_url || undefined,
    electricalLoadType: Array.isArray(row.electrical_load_type) ? row.electrical_load_type : (row.electrical_load_type ? [row.electrical_load_type] : undefined),
    wiresCount: row.wires_count !== null && row.wires_count !== undefined ? Number(row.wires_count) : undefined,
    averageBill: Number(row.average_bill),
    availableSpace: Number(row.available_space),
    metersCount: Number(row.meters_count),
    cfeStatus: row.cfe_status,
    paymentMethodDesired: row.payment_method_desired,
    propertyOwnership: row.property_ownership,
    evidence: row.evidence || {},
    estimatedPanels: Number(row.estimated_panels),
    requiredArea: Number(row.required_area),
    voltageAlert220v: Boolean(row.voltage_alert_220v),
    voltageUpgradeQuoted: Boolean(row.voltage_upgrade_quoted),
    totalInvestment: Number(row.total_investment),
    financing: row.financing || undefined,
    savedSimulations: row.saved_simulations || undefined,
    siteSurveyPaid: Boolean(row.site_survey_paid),
    siteSurveyReceipt: row.site_survey_receipt || undefined,
    siteSurveyStatus: row.site_survey_status,
    siteSurveyData: row.site_survey_data || undefined,
    referrerCode: row.referrer_code || undefined,
    assignedEnlaceId: row.assigned_enlace_id || undefined,
    enlaceName: row.enlace_name || undefined,
    isRecommendedByAdvisor: Boolean(row.is_recommended_by_advisor),
    recommendationNotes: row.recommendation_notes || undefined,
    status: row.status,
    assignedPartnerId: row.assigned_partner_id || undefined,
    monitoringAppUrl: row.monitoring_app_url || undefined,
    monitoringAppUser: row.monitoring_app_user || undefined,
    monitoringAppPass: row.monitoring_app_pass || undefined,
    payments: row.payments || [],
    createdDate: row.created_date,
    createdBy: row.created_by || undefined,
    createdByRole: row.created_by_role || undefined,
    advisorName: row.advisor_name || undefined,
    advisorPhone: row.advisor_phone || undefined,
  };
}

export function mapSolarProjectToRow(project: SolarProject): any {
  return {
    id: project.id,
    client_name: project.clientName,
    client_phone: project.clientPhone,
    municipality_state: project.municipalityState,
    client_email: project.clientEmail || null,
    whatsapp_phone: project.whatsappPhone || null,
    google_maps_url: project.googleMapsUrl || null,
    electrical_load_type: Array.isArray(project.electricalLoadType) ? project.electricalLoadType : (project.electricalLoadType ? [project.electricalLoadType] : null),
    wires_count: project.wiresCount !== undefined ? project.wiresCount : null,
    average_bill: project.averageBill,
    available_space: project.availableSpace,
    meters_count: project.metersCount,
    cfe_status: project.cfeStatus,
    payment_method_desired: project.paymentMethodDesired,
    property_ownership: project.propertyOwnership,
    evidence: project.evidence || {},
    estimated_panels: project.estimatedPanels,
    required_area: project.requiredArea,
    voltage_alert_220v: project.voltageAlert220v,
    voltage_upgrade_quoted: project.voltageUpgradeQuoted,
    total_investment: project.totalInvestment,
    financing: project.financing || null,
    saved_simulations: project.savedSimulations || [],
    site_survey_paid: project.siteSurveyPaid,
    site_survey_receipt: project.siteSurveyReceipt || null,
    site_survey_status: project.siteSurveyStatus,
    site_survey_data: project.siteSurveyData || {},
    referrer_code: project.referrerCode || null,
    assigned_enlace_id: project.assignedEnlaceId || null,
    enlace_name: project.enlaceName || null,
    is_recommended_by_advisor: Boolean(project.isRecommendedByAdvisor),
    recommendation_notes: project.recommendationNotes || null,
    status: project.status,
    assigned_partner_id: project.assignedPartnerId || null,
    monitoring_app_url: project.monitoringAppUrl || null,
    monitoring_app_user: project.monitoringAppUser || null,
    monitoring_app_pass: project.monitoringAppPass || null,
    payments: project.payments || [],
    created_date: project.createdDate,
    created_by: project.createdBy || null,
    created_by_role: project.createdByRole || null,
    advisor_name: project.advisorName || null,
    advisor_phone: project.advisorPhone || null,
  };
}

export async function fetchSolarProjects(): Promise<SolarProject[] | null> {
  try {
    const { data, error } = await supabase
      .from('solar_projects')
      .select('*')
      .order('created_date', { ascending: false });

    if (error) {
      console.warn('Error fetching solar projects from Supabase:', error.message);
      return null;
    }
    return (data || []).map(mapRowToSolarProject);
  } catch (err: any) {
    console.warn('Exception fetching solar projects from Supabase:', err.message);
    return null;
  }
}

export async function upsertSolarProject(project: SolarProject): Promise<boolean> {
  try {
    const row = mapSolarProjectToRow(project);
    let attempts = 0;
    let currentPayload = { ...row };

    while (attempts < 20) {
      const { error } = await supabase
        .from('solar_projects')
        .upsert(currentPayload);

      if (!error) {
        return true;
      }

      console.warn(`[Supabase Upsert Solar Project Attempt ${attempts + 1}]:`, error.message);

      // If conflict or primary key issue, attempt direct update
      if (error.message.includes('solar_projects_pkey') || error.message.includes('duplicate key') || error.code === '23505') {
        const updatePayload = { ...currentPayload };
        delete updatePayload.id;
        const { error: updateErr } = await supabase
          .from('solar_projects')
          .update(updatePayload)
          .eq('id', project.id);

        if (!updateErr) {
          console.log(`✅ Proyecto solar "${project.id}" actualizado exitosamente mediante update.`);
          return true;
        }
      }

      // Robust extraction of missing column name across all PostgreSQL and PostgREST schema cache error formats
      const missingColumnMatch = 
        error.message.match(/Could not find the '([^']+)' column of '[^']+' in the schema cache/i) ||
        error.message.match(/Could not find the "([^"]+)" column of '[^']+' in the schema cache/i) ||
        error.message.match(/Could not find the '([^']+)' column/i) ||
        error.message.match(/column "([^"]+)" of relation "[^"]+" does not exist/i) ||
        error.message.match(/column "([^"]+)" does not exist/i) ||
        error.message.match(/column ([a-zA-Z0-9_]+) does not exist/i) ||
        error.message.match(/has no column named "([^"]+)"/i) ||
        error.message.match(/column "([^"]+)"/i);

      if (missingColumnMatch) {
        const columnName = missingColumnMatch[1];
        console.log(`🧹 Dynamic Healing: Removing missing column "${columnName}" and retrying...`);
        delete (currentPayload as any)[columnName];
        attempts++;
      } else if (error.message.includes('foreign key constraint') || error.message.includes('violates foreign key') || error.code === '23503' || error.message.includes('assigned_partner_id')) {
        console.log(`🧹 Dynamic Healing (Solar FK): Removing foreign key field assigned_partner_id and retrying...`);
        delete (currentPayload as any).assigned_partner_id;
        attempts++;
      } else {
        console.error('Non-column-existence error occurred during solar project save, cannot auto-heal:', error.message);
        break;
      }
    }
    return false;
  } catch (err: any) {
    console.warn('Exception upserting solar project to Supabase:', err.message);
    return false;
  }
}

// =====================================================================
// TECHNICIANS MAPPING & CRUD
// =====================================================================

export function mapRowToTechnician(row: any): Technician {
  return {
    id: row.id,
    name: row.name,
    specialty: row.specialty,
    status: row.status,
    phone: row.phone,
    avatar: row.avatar,
    completedServicesCount: Number(row.completed_services_count || 0),
    totalEarnings: Number(row.total_earnings || 0),
    currentLocation: row.current_location || { lat: 19.435, lng: -99.141, address: 'Centro Histórico, CDMX' }
  };
}

export function mapTechnicianToRow(tech: Technician): any {
  return {
    id: tech.id,
    name: tech.name,
    specialty: tech.specialty,
    status: tech.status,
    phone: tech.phone,
    avatar: tech.avatar,
    completed_services_count: tech.completedServicesCount,
    total_earnings: tech.totalEarnings,
    current_location: tech.currentLocation
  };
}

export async function fetchTechnicians(): Promise<Technician[] | null> {
  try {
    const { data, error } = await supabase
      .from('technicians')
      .select('*');

    if (error) {
      console.warn('Error fetching technicians from Supabase:', error.message);
      return null;
    }
    return (data || []).map(mapRowToTechnician);
  } catch (err: any) {
    console.warn('Exception fetching technicians from Supabase:', err.message);
    return null;
  }
}

export async function upsertTechnician(tech: Technician): Promise<boolean> {
  try {
    const row = mapTechnicianToRow(tech);
    const { error } = await supabase
      .from('technicians')
      .upsert(row);

    if (error) {
      console.warn('Error upserting technician to Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn('Exception upserting technician to Supabase:', err.message);
    return false;
  }
}

// =====================================================================
// MATERIALS CRUD
// =====================================================================

export async function fetchMaterials(): Promise<Material[] | null> {
  try {
    const { data, error } = await supabase
      .from('materials')
      .select('*');

    if (error) {
      console.warn('Error fetching materials from Supabase:', error.message);
      return null;
    }
    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      unitPrice: Number(row.unit_price),
      unit: row.unit,
      stock: Number(row.stock || 0)
    }));
  } catch (err: any) {
    console.warn('Exception fetching materials from Supabase:', err.message);
    return null;
  }
}

export async function upsertMaterial(material: Material): Promise<boolean> {
  try {
    const row = {
      id: material.id,
      name: material.name,
      unit_price: material.unitPrice,
      unit: material.unit,
      stock: material.stock
    };
    const { error } = await supabase
      .from('materials')
      .upsert(row);

    if (error) {
      console.warn('Error upserting material to Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn('Exception upserting material to Supabase:', err.message);
    return false;
  }
}

// =====================================================================
// SERVICES CRUD
// =====================================================================

export function mapRowToService(row: any): Service {
  return {
    id: row.id,
    clientName: row.client_name,
    clientPhone: row.client_phone,
    address: row.address,
    coordinates: row.coordinates || { lat: 19.435, lng: -99.141 },
    category: row.category,
    description: row.description,
    status: row.status,
    priority: row.priority,
    assignedTechnicianId: row.assigned_technician_id || undefined,
    scheduledDate: row.scheduled_date,
    createdDate: row.created_date,
    completedDate: row.completed_date || undefined,
    beforeImage: row.before_image || undefined,
    afterImage: row.after_image || undefined,
    materialsUsed: row.materials_used || [],
    basePrice: Number(row.base_price || 0),
    urgencySurcharge: Number(row.urgency_surcharge || 0),
    paymentSurcharge: Number(row.payment_surcharge || 0),
    materialsTotal: Number(row.materials_total || 0),
    finalTotal: Number(row.final_total || 0),
    paymentMethod: row.payment_method || undefined,
    paymentStatus: row.payment_status,
    clientSignature: row.client_signature || undefined,
  };
}

export function mapServiceToRow(srv: Service): any {
  return {
    id: srv.id,
    client_name: srv.clientName,
    client_phone: srv.clientPhone,
    address: srv.address,
    coordinates: srv.coordinates,
    category: srv.category,
    description: srv.description,
    status: srv.status,
    priority: srv.priority,
    assigned_technician_id: srv.assignedTechnicianId || null,
    scheduled_date: srv.scheduledDate,
    created_date: srv.createdDate,
    completed_date: srv.completedDate || null,
    before_image: srv.beforeImage || null,
    after_image: srv.afterImage || null,
    materials_used: srv.materialsUsed,
    base_price: srv.basePrice,
    urgency_surcharge: srv.urgencySurcharge,
    payment_surcharge: srv.paymentSurcharge,
    materials_total: srv.materialsTotal,
    final_total: srv.finalTotal,
    payment_method: srv.paymentMethod || null,
    payment_status: srv.paymentStatus,
    client_signature: srv.clientSignature || null,
  };
}

export async function fetchServices(): Promise<Service[] | null> {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*');

    if (error) {
      console.log('Info: No se pudieron cargar los servicios (puede que la tabla aún no exista o esté vacía):', error.message);
      return [];
    }

    if (!data) return [];

    const services = data.map(mapRowToService);
    // Sort client-side to guarantee ordering
    services.sort((a, b) => {
      const dateA = a.createdDate ? new Date(a.createdDate).getTime() : 0;
      const dateB = b.createdDate ? new Date(b.createdDate).getTime() : 0;
      return dateB - dateA;
    });

    return services;
  } catch (err: any) {
    console.log('Exception fetching services:', err.message);
    return [];
  }
}

export async function upsertService(service: Service): Promise<boolean> {
  try {
    const row = mapServiceToRow(service);
    const { error } = await supabase
      .from('services')
      .upsert(row);

    if (error) {
      console.warn('Error upserting service to Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn('Exception upserting service to Supabase:', err.message);
    return false;
  }
}

// =====================================================================
// GLOBAL CONFIG & USERS
// =====================================================================

export async function fetchSoluxConfig(): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('app_config')
      .select('*')
      .limit(1);

    if (error) {
      // Table might not exist or be restricted; fail silently without console spam
      return null;
    }
    if (!data || data.length === 0) {
      return null;
    }
    const configRow = data[0];
    const defaultTerms = [
      { id: 'term_3', months: 3, label: '3 Meses', monthlyInterestRate: configRow.monthly_interest_rate ? Number(configRow.monthly_interest_rate) : 4.9, downPaymentPercent: configRow.default_down_payment_percent ? Number(configRow.default_down_payment_percent) : 50, active: true, description: '50% Enganche + Amortización a 3 meses' },
      { id: 'term_6', months: 6, label: '6 Meses', monthlyInterestRate: configRow.monthly_interest_rate ? Number(configRow.monthly_interest_rate) : 4.9, downPaymentPercent: configRow.default_down_payment_percent ? Number(configRow.default_down_payment_percent) : 50, active: true, description: '50% Enganche + Amortización a 6 meses' }
    ];

    let financingTerms = defaultTerms;
    if (Array.isArray(configRow.financing_terms) && configRow.financing_terms.length > 0) {
      financingTerms = configRow.financing_terms;
    } else if (Array.isArray(configRow.financing_term_months) && configRow.financing_term_months.length > 0) {
      financingTerms = configRow.financing_term_months.map((m: number) => ({
        id: `term_${m}`,
        months: m,
        label: `${m} Meses`,
        monthlyInterestRate: configRow.monthly_interest_rate ? Number(configRow.monthly_interest_rate) : 4.9,
        downPaymentPercent: configRow.default_down_payment_percent ? Number(configRow.default_down_payment_percent) : 50,
        active: true,
        description: `${configRow.default_down_payment_percent || 50}% Enganche + Amortización a ${m} meses`
      }));
    }

    const fetchedPrice = configRow.panel_base_price ? Number(configRow.panel_base_price) : 11000;

    return {
      panelBasePrice: fetchedPrice,
      monthlyInterestRate: configRow.monthly_interest_rate ? Number(configRow.monthly_interest_rate) : 4.9,
      siteSurveyCost: configRow.site_survey_cost ? Number(configRow.site_survey_cost) : 250,
      defaultDownPaymentPercent: configRow.default_down_payment_percent ? Number(configRow.default_down_payment_percent) : 50,
      contadoDiscountPercent: configRow.contado_discount_percent ? Number(configRow.contado_discount_percent) : 5,
      financingTermMonths: Array.isArray(configRow.financing_term_months) ? configRow.financing_term_months : [3, 6],
      financingTerms,
      updatedAt: configRow.updated_at || undefined
    };
  } catch (_err: any) {
    return null;
  }
}

export async function upsertSoluxConfig(config: any): Promise<boolean> {
  try {
    const termsMonths = config.financingTerms && Array.isArray(config.financingTerms)
      ? config.financingTerms.filter((t: any) => t.active).map((t: any) => t.months)
      : (config.financingTermMonths || [3, 6]);

    const nowIso = new Date().toISOString();

    const fullPayload: any = {
      id: 'main_config',
      panel_base_price: Number(config.panelBasePrice) || 11000,
      monthly_interest_rate: Number(config.monthlyInterestRate) || 4.9,
      site_survey_cost: Number(config.siteSurveyCost) || 250,
      default_down_payment_percent: Number(config.defaultDownPaymentPercent) ?? 50,
      contado_discount_percent: Number(config.contadoDiscountPercent) ?? 5,
      financing_term_months: termsMonths,
      financing_terms: config.financingTerms || [],
      updated_at: nowIso
    };

    const { error } = await supabase
      .from('app_config')
      .upsert(fullPayload);

    if (error) {
      // Intento de fallback si las nuevas columnas aún no existen en la base de datos de Supabase
      const fallbackPayload: any = {
        id: 'main_config',
        panel_base_price: Number(config.panelBasePrice) || 11000,
        monthly_interest_rate: Number(config.monthlyInterestRate) || 4.9,
        site_survey_cost: Number(config.siteSurveyCost) || 250,
        default_down_payment_percent: Number(config.defaultDownPaymentPercent) ?? 50,
        financing_term_months: termsMonths,
        updated_at: nowIso
      };
      const { error: fallbackError } = await supabase
        .from('app_config')
        .upsert(fallbackPayload);

      if (fallbackError) {
        // Fallback básico original
        const basicPayload = {
          id: 'main_config',
          panel_base_price: Number(config.panelBasePrice) || 11000,
          monthly_interest_rate: Number(config.monthlyInterestRate) || 4.9,
          site_survey_cost: Number(config.siteSurveyCost) || 250,
          updated_at: nowIso
        };
        const { error: basicError } = await supabase
          .from('app_config')
          .upsert(basicPayload);
        return !basicError;
      }
      return true;
    }
    return true;
  } catch (_err: any) {
    return false;
  }
}

export async function fetchUsers(): Promise<any[] | null> {
  try {
    const { data, error } = await supabase
      .from('users_list')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.warn('Error fetching users from Supabase:', error.message);
      return null;
    }
    return (data || []).map(row => ({
      id: row.id,
      username: row.username,
      email: row.email,
      password: row.password,
      role: row.role,
      fullName: row.full_name,
      parentId: row.parent_id,
      whatsapp: row.whatsapp,
      avatar: row.avatar || null,
      coverage: row.coverage || undefined,
      crewsCount: row.crews_count !== undefined && row.crews_count !== null ? Number(row.crews_count) : undefined,
      surveyRate: row.survey_rate !== undefined && row.survey_rate !== null ? Number(row.survey_rate) : undefined,
      panelRate: row.panel_rate !== undefined && row.panel_rate !== null ? Number(row.panel_rate) : undefined,
      bankClabe: row.bank_clabe || undefined,
      partnerStatus: row.partner_status || undefined,
      address: row.address || undefined,
      locationUrl: row.location_url || undefined,
      inePhotos: row.ine_photos ? (Array.isArray(row.ine_photos) ? row.ine_photos : (typeof row.ine_photos === 'string' ? JSON.parse(row.ine_photos) : [])) : [],
      bankAccountHolder: row.bank_account_holder || undefined,
      bankName: row.bank_name || undefined,
      accountNumber: row.account_number || undefined,
      cardNumber: row.card_number || undefined,
      paymentStatusType: row.payment_status_type || undefined,
      prospectingAreas: row.prospecting_areas || undefined,
      workShift: row.work_shift || undefined,
      streetAndNumber: row.street_and_number || undefined,
      colonia: row.colonia || undefined,
      municipio: row.municipio || undefined,
      zipCode: row.zip_code || undefined,
      ineFrontDoc: row.ine_front_doc || undefined,
      ineBackDoc: row.ine_back_doc || undefined,
      referralCode: row.referral_code || undefined,
      createdAt: row.created_at || row.created_date || undefined,
      createdDate: row.created_at || row.created_date || undefined
    }));
  } catch (err: any) {
    console.warn('Exception fetching users from Supabase:', err.message);
    return null;
  }
}

export async function upsertUser(user: any): Promise<boolean> {
  try {
    const payload: any = {
      id: user.id,
      username: user.username,
      email: user.email || null,
      password: user.password || 'password123',
      role: user.role,
      full_name: user.fullName || user.full_name || null,
      parent_id: (user.parentId && typeof user.parentId === 'string' && user.parentId.trim() !== '') ? user.parentId.trim() : null,
      whatsapp: user.whatsapp || null,
      avatar: user.avatar || null,
      coverage: user.coverage || null,
      crews_count: user.crewsCount !== undefined && user.crewsCount !== null ? Number(user.crewsCount) : null,
      survey_rate: user.surveyRate !== undefined && user.surveyRate !== null ? Number(user.surveyRate) : null,
      panel_rate: user.panelRate !== undefined && user.panelRate !== null ? Number(user.panelRate) : null,
      bank_clabe: user.bankClabe || null,
      partner_status: user.partnerStatus || null,
      address: user.address || null,
      location_url: user.locationUrl || null,
      ine_photos: user.inePhotos || [],
      bank_account_holder: user.bankAccountHolder || null,
      bank_name: user.bankName || null,
      account_number: user.accountNumber || null,
      card_number: user.cardNumber || null,
      payment_status_type: user.paymentStatusType || null,
      prospecting_areas: user.prospectingAreas || null,
      work_shift: user.workShift || null,
      street_and_number: user.streetAndNumber || null,
      colonia: user.colonia || null,
      municipio: user.municipio || null,
      zip_code: user.zipCode || null,
      ine_front_doc: user.ineFrontDoc || null,
      ine_back_doc: user.ineBackDoc || null,
      referral_code: user.referralCode || user.referral_code || null,
      created_at: user.createdAt || user.createdDate || undefined
    };

    let attempts = 0;
    let currentPayload = { ...payload };

    // 1. Try direct update first if user exists (by username or id)
    if (user.username || user.id) {
      try {
        const updatePayload = { ...currentPayload };
        delete updatePayload.id; // Do NOT try to modify the primary key ID during an UPDATE statement

        if (user.username) {
          const { data: updatedRows, error: updateErr } = await supabase
            .from('users_list')
            .update(updatePayload)
            .eq('username', user.username)
            .select();
          if (!updateErr && updatedRows && updatedRows.length > 0) {
            console.log(`✅ Perfil de "${user.username}" actualizado en Supabase por username.`);
            return true;
          }
        }

        if (user.id) {
          const { data: updatedRows, error: updateErr } = await supabase
            .from('users_list')
            .update(updatePayload)
            .eq('id', user.id)
            .select();
          if (!updateErr && updatedRows && updatedRows.length > 0) {
            console.log(`✅ Perfil de "${user.id}" actualizado en Supabase por ID.`);
            return true;
          }
        }
      } catch (e) {
        // Continue to upsert loop
      }
    }

    while (attempts < 20) {
      const { error } = await supabase
        .from('users_list')
        .upsert(currentPayload, { onConflict: 'username' });

      if (!error) {
        return true;
      }

      console.warn(`[Supabase User Upsert Attempt ${attempts + 1} Failed]:`, error.message);

      if (error.message.includes('users_list_username_key') || error.message.includes('duplicate key') || error.code === '23505' || error.message.includes('users_list_pkey') || error.message.includes('pkey')) {
        console.log(`🔄 Resolving constraint for "${user.username}": updating existing user record in Supabase without ID...`);
        const updatePayload = { ...currentPayload };
        delete updatePayload.id;
        const { error: updateErr } = await supabase
          .from('users_list')
          .update(updatePayload)
          .eq('username', user.username);

        if (!updateErr) {
          return true;
        } else {
          console.warn('Fallback update by username also failed:', updateErr.message);
        }
      }

      // Try to extract the missing column name from the error message.
      const missingColumnMatch = 
        error.message.match(/Could not find the '([^']+)' column of '[^']+' in the schema cache/i) ||
        error.message.match(/Could not find the "([^"]+)" column of '[^']+' in the schema cache/i) ||
        error.message.match(/Could not find the '([^']+)' column/i) ||
        error.message.match(/column "([^"]+)" of relation "[^"]+" does not exist/i) ||
        error.message.match(/column "([^"]+)" does not exist/i) ||
        error.message.match(/column ([a-zA-Z0-9_]+) does not exist/i) ||
        error.message.match(/has no column named "([^"]+)"/i) ||
        error.message.match(/column "([^"]+)"/i);

      if (missingColumnMatch) {
        const columnName = missingColumnMatch[1];
        console.log(`🧹 Dynamic Healing (User): Removing missing column "${columnName}" and retrying...`);
        delete (currentPayload as any)[columnName];
        attempts++;
      } else if (error.message.includes('foreign key constraint') || error.message.includes('violates foreign key') || error.message.includes('parent_id') || error.code === '23503') {
        console.log(`🧹 Dynamic Healing (User FK): Setting parent_id to null / removing parent_id and retrying...`);
        if (currentPayload.parent_id !== null && currentPayload.parent_id !== undefined) {
          currentPayload.parent_id = null;
        } else {
          delete currentPayload.parent_id;
        }
        attempts++;
      } else if (error.message.includes('pkey') || error.message.includes('primary key') || error.message.includes('id')) {
        console.log(`🧹 Dynamic Healing (User ID): Removing id and retrying...`);
        delete currentPayload.id;
        attempts++;
      } else {
        console.error('Non-column-existence error occurred during user save, cannot auto-heal:', error.message);
        attempts++;
      }
    }
    return false;
  } catch (err: any) {
    console.warn('Exception saving user to Supabase:', err.message);
    return false;
  }
}

// =====================================================================
// DELETION OPERATIONS
// =====================================================================

export async function deleteSolarProject(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('solar_projects')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn(`Error deleting solar project ${id} from Supabase:`, error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn(`Exception deleting solar project ${id}:`, err.message);
    return false;
  }
}

export async function deleteUser(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('users_list')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn(`Error deleting user ${id} from Supabase:`, error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn(`Exception deleting user ${id}:`, err.message);
    return false;
  }
}

export async function deleteTechnician(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('technicians')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn(`Error deleting technician ${id} from Supabase:`, error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn(`Exception deleting technician ${id}:`, err.message);
    return false;
  }
}

export async function deleteMaterial(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn(`Error deleting material ${id} from Supabase:`, error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn(`Exception deleting material ${id}:`, err.message);
    return false;
  }
}

export async function deleteService(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn(`Error deleting service ${id} from Supabase:`, error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn(`Exception deleting service ${id}:`, err.message);
    return false;
  }
}

// =====================================================================
// NOTIFICATIONS MAPPING & CRUD
// =====================================================================

export function mapRowToNotification(row: any): AppNotification {
  return {
    id: row.id,
    title: row.title || 'Notificación',
    message: row.message || '',
    createdDate: row.created_date || row.created_at || new Date().toISOString().split('T')[0],
    isRead: Boolean(row.is_read !== undefined ? row.is_read : (row.read !== undefined ? row.read : false)),
    role: row.role || 'all',
    userId: row.user_id || row.userId || undefined
  };
}

export function mapNotificationToRow(notification: AppNotification): any {
  return {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    created_date: notification.createdDate,
    is_read: notification.isRead,
    role: notification.role,
    user_id: notification.userId || null
  };
}

export async function fetchNotifications(): Promise<AppNotification[] | null> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*');

    if (error) {
      console.warn('Error fetching notifications from Supabase:', error.message);
      return [];
    }
    const notifs = (data || []).map(mapRowToNotification);
    notifs.sort((a, b) => {
      const timeA = a.createdDate ? new Date(a.createdDate).getTime() : 0;
      const timeB = b.createdDate ? new Date(b.createdDate).getTime() : 0;
      return timeB - timeA;
    });
    return notifs;
  } catch (err: any) {
    console.warn('Exception fetching notifications:', err.message);
    return [];
  }
}

export async function upsertNotification(notification: AppNotification): Promise<boolean> {
  try {
    const row = mapNotificationToRow(notification);
    let attempts = 0;
    let currentPayload = { ...row };

    while (attempts < 10) {
      const { error } = await supabase
        .from('notifications')
        .upsert(currentPayload);

      if (!error) {
        return true;
      }

      const missingColumnMatch = 
        error.message.match(/Could not find the '([^']+)' column of '[^']+' in the schema cache/i) ||
        error.message.match(/Could not find the "([^"]+)" column of '[^']+' in the schema cache/i) ||
        error.message.match(/Could not find the '([^']+)' column/i) ||
        error.message.match(/column "([^"]+)" of relation "[^"]+" does not exist/i) ||
        error.message.match(/column "([^"]+)" does not exist/i) ||
        error.message.match(/column ([a-zA-Z0-9_]+) does not exist/i) ||
        error.message.match(/has no column named "([^"]+)"/i) ||
        error.message.match(/column "([^"]+)"/i);

      if (missingColumnMatch) {
        const col = missingColumnMatch[1];
        delete (currentPayload as any)[col];
        attempts++;
      } else {
        console.warn('Error upserting notification to Supabase:', error.message);
        break;
      }
    }
    return false;
  } catch (err: any) {
    console.warn('Exception upserting notification:', err.message);
    return false;
  }
}

export async function deleteNotification(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn(`Error deleting notification ${id} from Supabase:`, error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn(`Exception deleting notification ${id}:`, err.message);
    return false;
  }
}

// =====================================================================
// PROMOTIONAL MATERIALS CRUD
// =====================================================================

export async function fetchPromotionalMaterials(): Promise<PromotionalMaterial[] | null> {
  try {
    const { data, error } = await supabase
      .from('promotional_materials')
      .select('*');

    if (error) {
      console.warn('Error fetching promotional materials from Supabase:', error.message);
      return null;
    }

    return (data || []).map(row => ({
      id: row.id,
      title: row.title,
      category: row.category,
      description: row.description || '',
      fileUrl: row.file_url,
      fileName: row.file_name || undefined,
      createdDate: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : undefined,
      createdBy: row.created_by || undefined,
      createdByName: row.created_by_name || undefined,
      createdByRole: row.created_by_role || undefined,
    }));
  } catch (err: any) {
    console.warn('Exception fetching promotional materials from Supabase:', err.message);
    return null;
  }
}

export async function upsertPromotionalMaterial(material: PromotionalMaterial): Promise<boolean> {
  try {
    const row = {
      id: material.id,
      title: material.title,
      category: material.category,
      description: material.description,
      file_url: material.fileUrl,
      file_name: material.fileName || null,
      created_by: material.createdBy || null,
      created_by_name: material.createdByName || null,
      created_by_role: material.createdByRole || null,
    };

    const { error } = await supabase
      .from('promotional_materials')
      .upsert(row);

    if (error) {
      console.warn('Error upserting promotional material:', error.message);
      throw new Error(error.message);
    }
    return true;
  } catch (err: any) {
    console.warn('Exception upserting promotional material:', err.message);
    throw err;
  }
}

export async function deletePromotionalMaterial(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('promotional_materials')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn(`Error deleting promotional material ${id}:`, error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn(`Exception deleting promotional material ${id}:`, err.message);
    return false;
  }
}

// =====================================================================
// LANDING PAGE CONFIG & SUPABASE STORAGE UPLOADS
// =====================================================================

export async function fetchLandingConfig(): Promise<LandingConfig | null> {
  try {
    const { data, error } = await supabase
      .from('landing_config')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('Notice: landing_config table might not exist yet:', error.message);
      return null;
    }

    if (!data) return null;

    if (data.config && typeof data.config === 'object') {
      return {
        ...data.config,
        id: data.id || 'default',
        updatedAt: data.updated_at || data.config.updatedAt
      };
    }
    return data as any;
  } catch (err: any) {
    console.warn('Exception fetching landing config from Supabase:', err.message);
    return null;
  }
}

export async function upsertLandingConfig(config: LandingConfig): Promise<boolean> {
  try {
    const payload = {
      id: 'default',
      config: config,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('landing_config')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('Error upserting landing config to Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn('Exception upserting landing config:', err.message);
    return false;
  }
}

/**
 * Uploads an image to Supabase Storage bucket 'landing-images'.
 * If the bucket is not available, gracefully falls back to Base64 data URL
 * so that the user's edits are never lost while they configure their bucket.
 */
export async function uploadLandingImageToSupabase(file: File): Promise<{ url: string | null; error?: string }> {
  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const cleanExt = fileExt.toLowerCase().replace(/[^a-z0-9]/g, '');
    const fileName = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${cleanExt}`;
    const filePath = `uploads/${fileName}`;

    // Attempt direct upload to 'landing-images' Supabase Storage bucket
    const { data, error } = await supabase.storage
      .from('landing-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.warn('[Supabase Storage upload warning]:', error.message);
      // Fallback: convert file to Base64 so the preview and landing page work immediately!
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            url: reader.result as string,
            error: `Bucket 'landing-images' no encontrado aún. Se guardó temporalmente en memoria local. Ejecuta el script SQL en Supabase para habilitar almacenamiento permanente.`
          });
        };
        reader.onerror = () => {
          resolve({ url: null, error: 'Error al leer el archivo seleccionado' });
        };
        reader.readAsDataURL(file);
      });
    }

    const { data: publicUrlData } = supabase.storage
      .from('landing-images')
      .getPublicUrl(filePath);

    return { url: publicUrlData.publicUrl };
  } catch (err: any) {
    console.warn('Exception in uploadLandingImageToSupabase:', err.message);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({ url: reader.result as string, error: err.message });
      };
      reader.onerror = () => {
        resolve({ url: null, error: err.message });
      };
      reader.readAsDataURL(file);
    });
  }
}

