import { supabase } from '../supabaseClient';
import { Language, Service, Specialist, Translations, ServiceCategory, Clinic } from '../types';
import { SERVICES as FALLBACK_SERVICES, SPECIALISTS as FALLBACK_SPECIALISTS, TEXTS as FALLBACK_TEXTS, DEFAULT_CLINIC } from '../constants';

// ===========================================
// CONFIG SERVICE: Dynamic Configuration from Supabase
// ===========================================
// Fetches services, specialists, and texts from Supabase tables
// Falls back to hardcoded constants if network fails (resilience)

// Row types matching the new 'services' table
interface ServiceRow {
  id: string;
  clinic_id: string;
  name: Record<string, string>; // jsonb
  description: Record<string, string> | null; // jsonb
  price_cents: number; // Database stores price in cents (4500 = €45.00)
  duration_minutes: number;
  category: ServiceCategory | null;
  icon: string | null;
}

// Row types matching the new 'specialists' table
interface SpecialistRow {
  id: string;
  clinic_id: string;
  name: string;
  role: Record<string, string> | null; // jsonb
  photo_url: string | null;
  specialties: string[] | null;
}

// Row types matching 'clinic_translations'
interface TranslationRow {
  key: string;
  value: Record<string, string>; // jsonb
}

// Infer category from service name if not set in DB
function inferCategoryFromName(nameObj: Record<string, string>): ServiceCategory {
  const name = (nameObj['en'] || Object.values(nameObj)[0] || '').toLowerCase();

  // PREVENTIVE CARE
  if (name.includes('check-up') || name.includes('hygiene') ||
    name.includes('integrated') || name.includes('oral cavity')) {
    return 'preventive';
  }

  // CHILDREN
  if (name.includes('children') || name.includes('pediatric') || name.includes('kid')) {
    return 'children';
  }

  // SURGERY & IMPLANTS
  if (name.includes('surgery') || name.includes('surgical') ||
    name.includes('implant') || name.includes('extraction') ||
    name.includes('jaw bone') || name.includes('bone tissue')) {
    return 'surgery';
  }

  // PROSTHETICS
  if (name.includes('prosthetic') || name.includes('crown') ||
    name.includes('bridge') || name.includes('denture') || name.includes('veneer')) {
    return 'prosthetics';
  }

  // Default to TREATMENT
  return 'treatment';
}

// Transform database row to frontend Service type
function mapServiceRowToService(row: ServiceRow): Service {
  // Ensure we have all required languages, falling back to EN or first available
  const getName = (lang: string) => row.name[lang.toLowerCase()] || row.name['en'] || Object.values(row.name)[0] || '';
  const getDesc = (lang: string) => (row.description ? (row.description[lang.toLowerCase()] || row.description['en'] || '') : '');

  return {
    id: row.id,
    name: {
      [Language.EN]: getName('en'),
      [Language.LV]: getName('lv'),
      [Language.RU]: getName('ru'),
    },
    description: {
      [Language.EN]: getDesc('en'),
      [Language.LV]: getDesc('lv'),
      [Language.RU]: getDesc('ru'),
    },
    price: row.price_cents / 100, // Convert cents to EUR (4500 -> 45.00)
    durationMinutes: row.duration_minutes,
    icon: row.icon || '',
    category: row.category || inferCategoryFromName(row.name), // Infer if not set
  };
}

// Transform database row to frontend Specialist type
function mapSpecialistRowToSpecialist(row: SpecialistRow): Specialist {
  const getRole = (lang: string) => (row.role ? (row.role[lang.toLowerCase()] || row.role['en'] || '') : '');

  return {
    id: row.id,
    name: row.name,
    role: {
      [Language.EN]: getRole('en'),
      [Language.LV]: getRole('lv'),
      [Language.RU]: getRole('ru'),
    },
    photoUrl: row.photo_url || '',
    specialties: row.specialties || [],
  };
}

// In-memory cache for session duration
let cachedServices: Service[] | null = null;
let cachedSpecialists: Specialist[] | null = null;
let cachedTexts: Translations | null = null;
let cachedClinic: Clinic | null = null;
let cacheTimestamp: number = 0;
let cachedClinicId: string | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function isCacheValid(clinicId: string): boolean {
  return Date.now() - cacheTimestamp < CACHE_TTL_MS && cachedClinicId === clinicId;
}

/**
 * Fetch services from Supabase 'services' table
 */
export async function fetchServices(clinicId: string): Promise<Service[]> {
  if (cachedServices && isCacheValid(clinicId)) return cachedServices;

  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_active', true);

    if (error) {
      console.warn('[ConfigService] Supabase error services:', error);
      return FALLBACK_SERVICES;
    }
    if (!data || data.length === 0) return FALLBACK_SERVICES;

    const mapped = data.map(mapServiceRowToService);
    cachedServices = mapped;
    return mapped;
  } catch (err) {
    console.warn('[ConfigService] Network error services:', err);
    return FALLBACK_SERVICES;
  }
}

/**
 * Fetch specialists from Supabase 'specialists' table
 */
export async function fetchSpecialists(clinicId: string): Promise<Specialist[]> {
  if (cachedSpecialists && isCacheValid(clinicId)) return cachedSpecialists;

  try {
    const { data, error } = await supabase
      .from('specialists')
      .select('*')
      .eq('clinic_id', clinicId);

    if (error) {
      console.warn('[ConfigService] Supabase error specialists:', error);
      return FALLBACK_SPECIALISTS;
    }
    if (!data || data.length === 0) return FALLBACK_SPECIALISTS;

    const mapped = data.map(mapSpecialistRowToSpecialist);
    cachedSpecialists = mapped;
    return mapped;
  } catch (err) {
    console.warn('[ConfigService] Network error specialists:', err);
    return FALLBACK_SPECIALISTS;
  }
}

/**
 * Fetch translations from Supabase 'clinic_translations' table
 */
export async function fetchTranslations(clinicId: string): Promise<Translations> {
  if (cachedTexts && isCacheValid(clinicId)) return cachedTexts;

  try {
    const { data, error } = await supabase
      .from('clinic_translations')
      .select('*')
      .eq('clinic_id', clinicId);

    if (error) {
      console.warn('[ConfigService] Supabase error translations:', error);
      return FALLBACK_TEXTS;
    }

    // Merge DB translations on top of fallback
    const newTexts = { ...FALLBACK_TEXTS };
    if (data && data.length > 0) {
      data.forEach((row: TranslationRow) => {
        // row.value is { en: "Val", lv: "Val" }
        // We need to cast it to Record<Language, string>
        // Assuming row.value keys match Language enum or we map them
        const val = row.value as any;
        newTexts[row.key] = {
          [Language.EN]: val.en || val.EN || newTexts[row.key]?.[Language.EN] || '',
          [Language.LV]: val.lv || val.LV || newTexts[row.key]?.[Language.LV] || '',
          [Language.RU]: val.ru || val.RU || newTexts[row.key]?.[Language.RU] || '',
        };
      });
    }

    cachedTexts = newTexts;
    return newTexts;

  } catch (err) {
    console.warn('[ConfigService] Network error translations:', err);
    return FALLBACK_TEXTS;
  }
}

/**
 * Fetch clinic details from Supabase 'clinics' table
 */
export async function fetchClinicDetails(clinicId: string): Promise<Clinic> {
  if (cachedClinic && isCacheValid(clinicId)) return cachedClinic;

  try {
    const { data, error } = await supabase
      .from('clinics')
      .select('*')
      .eq('id', clinicId)
      .single();

    if (error) {
      console.warn('[ConfigService] Supabase error clinic:', error);
      return DEFAULT_CLINIC;
    }
    if (!data) return DEFAULT_CLINIC;

    const clinic: Clinic = {
      id: data.id,
      name: data.name,
      domain: data.domain,
      logoUrl: data.logo_url,
      clinicEmail: data.clinic_email,
      theme: data.theme,
      settings: data.settings
    };

    cachedClinic = clinic;
    return clinic;
  } catch (err) {
    console.warn('[ConfigService] Network error clinic:', err);
    return DEFAULT_CLINIC;
  }
}

/**
 * Fetch all configuration at once
 */
export async function fetchAllConfig(clinicId: string): Promise<{
  services: Service[];
  specialists: Specialist[];
  texts: Translations;
  clinic: Clinic;
}> {
  // Reset cache if clinic changed (implicit in isCacheValid, but ensuring consistency)
  if (cachedClinicId !== clinicId) {
    cachedServices = null;
    cachedSpecialists = null;
    cachedTexts = null;
    cachedClinic = null;
  }

  const [services, specialists, texts, clinic] = await Promise.all([
    fetchServices(clinicId),
    fetchSpecialists(clinicId),
    fetchTranslations(clinicId),
    fetchClinicDetails(clinicId)
  ]);

  cachedClinicId = clinicId;
  cacheTimestamp = Date.now();

  return { services, specialists, texts, clinic };
}

export function clearConfigCache(): void {
  cachedServices = null;
  cachedSpecialists = null;
  cachedTexts = null;
  cachedClinic = null;
  cachedClinicId = null;
  cacheTimestamp = 0;
}
