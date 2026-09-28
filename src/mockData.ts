import { Technician, Material, ServiceType, Service, SolarProject } from './types';

export const INITIAL_TECHNICIANS: Technician[] = [
  {
    id: 'tech_1',
    name: 'Carlos Mendoza',
    specialty: 'plomería',
    status: 'free',
    phone: '55-1234-5678',
    avatar: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80',
    completedServicesCount: 24,
    totalEarnings: 15400,
    currentLocation: {
      lat: 19.435,
      lng: -99.141,
      address: 'Centro Histórico, CDMX'
    }
  },
  {
    id: 'tech_2',
    name: 'Alejandro Ruiz',
    specialty: 'electricidad',
    status: 'in_service',
    phone: '55-8765-4321',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    completedServicesCount: 18,
    totalEarnings: 12800,
    currentLocation: {
      lat: 19.418,
      lng: -99.165,
      address: 'Colonia Roma Norte, CDMX'
    }
  },
  {
    id: 'tech_3',
    name: 'Roberto Gómez',
    specialty: 'herrería',
    status: 'on_way',
    phone: '55-4567-8901',
    avatar: 'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=150&auto=format&fit=crop&q=80',
    completedServicesCount: 12,
    totalEarnings: 9800,
    currentLocation: {
      lat: 19.442,
      lng: -99.122,
      address: 'Tlatelolco, CDMX'
    }
  },
  {
    id: 'tech_4',
    name: 'Sofía Lara',
    specialty: 'clima',
    status: 'free',
    phone: '55-9012-3456',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    completedServicesCount: 15,
    totalEarnings: 14200,
    currentLocation: {
      lat: 19.395,
      lng: -99.178,
      address: 'Nápoles, CDMX'
    }
  }
];

export const INITIAL_MATERIALS: Material[] = [
  { id: 'mat_1', name: 'Tubo Cobre 1/2" (metro)', unitPrice: 180, unit: 'm', stock: 15 },
  { id: 'mat_2', name: 'Cable Eléctrico Calibre 12 (metro)', unitPrice: 35, unit: 'm', stock: 100 },
  { id: 'mat_3', name: 'Válvula de Paso 3/4"', unitPrice: 220, unit: 'pza', stock: 8 },
  { id: 'mat_4', name: 'Pastilla Termomagnética 20A', unitPrice: 160, unit: 'pza', stock: 12 },
  { id: 'mat_5', name: 'Soldadura de Estaño (carrete)', unitPrice: 290, unit: 'pza', stock: 5 },
  { id: 'mat_6', name: 'Filtro purificador de agua', unitPrice: 450, unit: 'pza', stock: 4 },
  { id: 'mat_7', name: 'Electrodos para soldar (paquete)', unitPrice: 190, unit: 'pza', stock: 10 },
  { id: 'mat_8', name: 'Cinta de aislar negra 3M', unitPrice: 45, unit: 'pza', stock: 25 }
];

export const SERVICE_CATALOG: ServiceType[] = [
  { id: 'cat_1', name: 'Instalación de Bomba de Agua', category: 'plomería', basePrice: 1200, icon: 'Droplets' },
  { id: 'cat_2', name: 'Cambio de Tubería Dañada', category: 'plomería', basePrice: 850, icon: 'Wrench' },
  { id: 'cat_3', name: 'Lavado de Tinaco y Cisterna', category: 'plomería', basePrice: 750, icon: 'ShieldAlert' },
  { id: 'cat_4', name: 'Reparación de Corto Circuito', category: 'electricidad', basePrice: 950, icon: 'Zap' },
  { id: 'cat_5', name: 'Instalación de Centro de Carga', category: 'electricidad', basePrice: 1400, icon: 'Box' },
  { id: 'cat_6', name: 'Reparación de Portón Metálico', category: 'herrería', basePrice: 1600, icon: 'Hammer' },
  { id: 'cat_7', name: 'Mantenimiento Preventivo de Minisplit', category: 'clima', basePrice: 800, icon: 'Wind' },
  { id: 'cat_8', name: 'Instalación de Calentador Solar', category: 'plomería', basePrice: 1800, icon: 'Sun' },
  { id: 'cat_9', name: 'Revisión y Diagnóstico General', category: 'otro', basePrice: 350, icon: 'CheckSquare' }
];

// Generamos algunos servicios históricos para poblar las gráficas de inmediato.
export const INITIAL_SERVICES: Service[] = [
  {
    id: 'srv_101',
    clientName: 'María Elena Pérez',
    clientPhone: '55-1122-3344',
    address: 'Av. Coyoacán 1420, Del Valle, CDMX',
    coordinates: { lat: 19.378, lng: -99.172 },
    category: 'plomería',
    description: 'Fuga severa en tubería de cobre debajo de la tarja de cocina.',
    status: 'completed',
    priority: 'urgent',
    assignedTechnicianId: 'tech_1',
    scheduledDate: '2026-06-29T10:00:00Z',
    createdDate: '2026-06-29T08:30:00Z',
    completedDate: '2026-06-29T11:45:00Z',
    beforeImage: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&auto=format&fit=crop&q=80', // water puddle/sink pipe
    afterImage: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&auto=format&fit=crop&q=80',  // clean plumber work
    materialsUsed: [
      { materialId: 'mat_1', name: 'Tubo Cobre 1/2" (metro)', quantity: 2, unitPrice: 180 },
      { materialId: 'mat_5', name: 'Soldadura de Estaño (carrete)', quantity: 1, unitPrice: 290 }
    ],
    basePrice: 850,
    urgencySurcharge: 250, // cargo por urgencia
    paymentSurcharge: 0,
    materialsTotal: 650,
    finalTotal: 1750,
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    clientSignature: 'data:image/png;base64,mock_signature_data_maria_perez'
  },
  {
    id: 'srv_102',
    clientName: 'Juan Carlos Ochoa',
    clientPhone: '55-5544-3322',
    address: 'Calle Sonora 45, Condesa, CDMX',
    coordinates: { lat: 19.415, lng: -99.169 },
    category: 'electricidad',
    description: 'Sin luz en toda la planta alta después de un tronido en la caja de fusibles.',
    status: 'completed',
    priority: 'urgent',
    assignedTechnicianId: 'tech_2',
    scheduledDate: '2026-06-29T14:00:00Z',
    createdDate: '2026-06-29T13:10:00Z',
    completedDate: '2026-06-29T15:30:00Z',
    beforeImage: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop&q=80', // wires
    afterImage: 'https://images.unsplash.com/photo-1558224494-ef8b217500d6?w=400&auto=format&fit=crop&q=80',  // power panel fixed
    materialsUsed: [
      { materialId: 'mat_4', name: 'Pastilla Termomagnética 20A', quantity: 1, unitPrice: 160 },
      { materialId: 'mat_8', name: 'Cinta de aislar negra 3M', quantity: 1, unitPrice: 45 }
    ],
    basePrice: 950,
    urgencySurcharge: 250,
    paymentSurcharge: 60, // cargo por tarjeta (5% aprox)
    materialsTotal: 205,
    finalTotal: 1465,
    paymentMethod: 'card',
    paymentStatus: 'paid',
    clientSignature: 'data:image/png;base64,mock_signature_data_juan_ochoa'
  },
  {
    id: 'srv_103',
    clientName: 'Inmobiliaria Alfa',
    clientPhone: '55-9988-7766',
    address: 'Paseo de la Reforma 250, Juárez, CDMX',
    coordinates: { lat: 19.428, lng: -99.162 },
    category: 'clima',
    description: 'Mantenimiento preventivo anual a 3 unidades minisplit que tiran agua.',
    status: 'completed',
    priority: 'normal',
    assignedTechnicianId: 'tech_4',
    scheduledDate: '2026-06-28T09:00:00Z',
    createdDate: '2026-06-27T16:00:00Z',
    completedDate: '2026-06-28T12:00:00Z',
    beforeImage: 'https://images.unsplash.com/photo-1621905252507-b354bc25edac?w=400&auto=format&fit=crop&q=80',
    afterImage: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop&q=80',
    materialsUsed: [],
    basePrice: 2400, // 800 * 3
    urgencySurcharge: 0,
    paymentSurcharge: 0,
    materialsTotal: 0,
    finalTotal: 2400,
    paymentMethod: 'spei',
    paymentStatus: 'paid',
    clientSignature: 'data:image/png;base64,mock_signature_inmobiliaria'
  },
  {
    id: 'srv_104',
    clientName: 'Patricia Sosa',
    clientPhone: '55-6677-8899',
    address: 'Guanajuato 180, Roma Norte, CDMX',
    coordinates: { lat: 19.416, lng: -99.160 },
    category: 'plomería',
    description: 'Limpieza periódica y desinfección de tinaco de 1100L en azotea.',
    status: 'assigned',
    priority: 'normal',
    assignedTechnicianId: 'tech_1',
    scheduledDate: '2026-06-30T16:00:00Z',
    createdDate: '2026-06-30T10:00:00Z',
    materialsUsed: [],
    basePrice: 750,
    urgencySurcharge: 0,
    paymentSurcharge: 0,
    materialsTotal: 0,
    finalTotal: 750,
    paymentStatus: 'pending'
  },
  {
    id: 'srv_105',
    clientName: 'Eduardo Ramírez',
    clientPhone: '55-3322-1100',
    address: 'Dr. Vertiz 390, Narvarte, CDMX',
    coordinates: { lat: 19.402, lng: -99.151 },
    category: 'herrería',
    description: 'Refuerzo de bisagras dañadas en portón exterior de herrería pesada.',
    status: 'in_progress',
    priority: 'normal',
    assignedTechnicianId: 'tech_3',
    scheduledDate: '2026-06-30T13:00:00Z',
    createdDate: '2026-06-30T11:15:00Z',
    materialsUsed: [],
    basePrice: 1600,
    urgencySurcharge: 0,
    paymentSurcharge: 0,
    materialsTotal: 0,
    finalTotal: 1600,
    paymentStatus: 'pending'
  },
  {
    id: 'srv_106',
    clientName: 'Héctor Gómez',
    clientPhone: '55-7766-5544',
    address: 'Chilpancingo 54, Roma Sur, CDMX',
    coordinates: { lat: 19.407, lng: -99.168 },
    category: 'plomería',
    description: 'URGENTE: Fuga de agua a presión en el tubo principal de suministro de la cisterna.',
    status: 'pending',
    priority: 'urgent',
    scheduledDate: '2026-06-30T15:00:00Z',
    createdDate: '2026-06-30T14:15:00Z',
    materialsUsed: [],
    basePrice: 850,
    urgencySurcharge: 250,
    paymentSurcharge: 0,
    materialsTotal: 0,
    finalTotal: 1100,
    paymentStatus: 'pending'
  }
];

// Hermosas imágenes simuladas antes/después por categoría
export const EV_PRESETS: Record<string, { before: string; after: string; title: string }> = {
  'plomería_tinaco': {
    before: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&auto=format&fit=crop&q=80', // sucio/puddle
    after: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&auto=format&fit=crop&q=80', // limpio
    title: 'Lavado de Tinaco'
  },
  'plomería_tubería': {
    before: 'https://images.unsplash.com/photo-1542013936693-8848e5740a7a?w=400&auto=format&fit=crop&q=80', // óxido/tubería rota
    after: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?w=400&auto=format&fit=crop&q=80', // cobre reluciente reparado
    title: 'Fuga Reparada'
  },
  'electricidad_corto': {
    before: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop&q=80', // cables sueltos
    after: 'https://images.unsplash.com/photo-1558224494-ef8b217500d6?w=400&auto=format&fit=crop&q=80', // panel ordenado
    title: 'Instalación Eléctrica'
  },
  'clima_manto': {
    before: 'https://images.unsplash.com/photo-1621905252507-b354bc25edac?w=400&auto=format&fit=crop&q=80', // clima sucio
    after: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop&q=80', // clima limpio soplando
    title: 'Mantenimiento Clima'
  },
  'herrería_soldar': {
    before: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&auto=format&fit=crop&q=80', // metal roto
    after: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&auto=format&fit=crop&q=80', // soldadura terminada
    title: 'Soldadura de Portón'
  }
};

export const INITIAL_SOLAR_PROJECTS: SolarProject[] = [
  {
    id: 'proj_1',
    clientName: 'Roberto Sánchez',
    clientPhone: '55-4433-2211',
    municipalityState: 'Monterrey, Nuevo León',
    averageBill: 3500,
    availableSpace: 45,
    metersCount: 1,
    cfeStatus: 'activo_sin_adeudo',
    paymentMethodDesired: 'directo',
    propertyOwnership: 'propietario',
    evidence: {
      cfeReceiptFront: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=400&auto=format&fit=crop&q=60',
      cfeReceiptBack: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=400&auto=format&fit=crop&q=60',
      facade: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&auto=format&fit=crop&q=60',
      accessVideo: 'video_acceso_azotea.mp4',
      roofAngle1: 'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=400&auto=format&fit=crop&q=60',
      roofAngle2: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=400&auto=format&fit=crop&q=60',
      meterAndPanel: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop&q=60'
    },
    estimatedPanels: 8,
    requiredArea: 17.6,
    voltageAlert220v: true,
    voltageUpgradeQuoted: true,
    totalInvestment: 68000,
    financing: {
      type: 'directo',
      downPayment: 20400,
      months: 6,
      interestRate: 4.9,
      monthlyPayment: 8320
    },
    siteSurveyPaid: true,
    siteSurveyReceipt: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=400&auto=format&fit=crop&q=60',
    siteSurveyStatus: 'concluido',
    siteSurveyData: {
      noShadows: true,
      roofCondition: 'buena',
      wiringDistance: 15,
      clientSignature: 'data:image/png;base64,mock_signature_roberto',
      surveyorNotes: 'Estructura en buenas condiciones. Loza de concreto lista para montaje.'
    },
    referrerCode: 'SOCIO-889-MX',
    status: 'instalacion',
    payments: [
      { id: 'pay_1', concept: 'Levantamiento Técnico', amount: 250, date: '2026-06-15', status: 'pagado' },
      { id: 'pay_2', concept: 'Enganche Financiamiento Solux', amount: 20400, date: '2026-06-20', status: 'pagado' },
      { id: 'pay_3', concept: 'Mensualidad 1 de 6', amount: 8320, date: '2026-07-01', status: 'pagado' }
    ],
    createdDate: '2026-06-14'
  },
  {
    id: 'proj_2',
    clientName: 'Mauricio Alcocer',
    clientPhone: '55-3344-5566',
    municipalityState: 'Zapopan, Jalisco',
    averageBill: 1800,
    availableSpace: 30,
    metersCount: 1,
    cfeStatus: 'activo_sin_adeudo',
    paymentMethodDesired: 'msi',
    propertyOwnership: 'propietario',
    evidence: {
      cfeReceiptFront: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=400&auto=format&fit=crop&q=60',
      facade: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&auto=format&fit=crop&q=60',
      accessVideo: 'video_escalera.mp4',
      roofAngle1: 'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=400&auto=format&fit=crop&q=60',
      meterAndPanel: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop&q=60'
    },
    estimatedPanels: 4,
    requiredArea: 8.8,
    voltageAlert220v: false,
    voltageUpgradeQuoted: false,
    totalInvestment: 34000,
    financing: {
      type: 'msi',
      downPayment: 0,
      months: 12,
      interestRate: 0,
      monthlyPayment: 2833.33
    },
    siteSurveyPaid: true,
    siteSurveyStatus: 'pendiente',
    referrerCode: 'SOCIO-889-MX',
    status: 'levantamiento',
    payments: [
      { id: 'pay_1', concept: 'Levantamiento Técnico', amount: 250, date: '2026-06-28', status: 'pagado' }
    ],
    createdDate: '2026-06-27'
  },
  {
    id: 'proj_3',
    clientName: 'Alejandra Torres',
    clientPhone: '55-9012-3456',
    municipalityState: 'Querétaro, Querétaro',
    averageBill: 5000,
    availableSpace: 60,
    metersCount: 2,
    cfeStatus: 'activo_sin_adeudo',
    paymentMethodDesired: 'contado',
    propertyOwnership: 'arrendatario_autorizado',
    evidence: {
      cfeReceiptFront: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=400&auto=format&fit=crop&q=60',
      facade: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=400&auto=format&fit=crop&q=60'
    },
    estimatedPanels: 10,
    requiredArea: 22,
    voltageAlert220v: true,
    voltageUpgradeQuoted: true,
    totalInvestment: 85000,
    siteSurveyPaid: false,
    siteSurveyStatus: 'pendiente',
    status: 'validacion',
    payments: [],
    createdDate: '2026-07-01'
  }
];

