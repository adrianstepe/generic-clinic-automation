export enum Language {
  EN = 'EN',
  LV = 'LV',
  RU = 'RU'
}

export type ServiceCategory = 'preventive' | 'children' | 'treatment' | 'surgery' | 'prosthetics';

export interface Service {
  id: string;
  name: Record<Language, string>;
  description: Record<Language, string>;
  price: number;
  durationMinutes: number;
  icon: string;
  category: ServiceCategory;
}

export interface Specialist {
  id: string;
  name: string;
  role: Record<Language, string>;
  photoUrl: string;
  specialties: string[];
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface BookingState {
  step: number;
  language: Language;
  selectedService: Service | null;
  selectedSpecialist: Specialist | null;
  selectedDate: Date | null;
  selectedTime: string | null;
  patientData: PatientData;
}

export interface PatientData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  details: string;
  gdprConsent: boolean;
  marketingConsent: boolean;
  medicalPhoto: File | null;
}

export interface Translations {
  [key: string]: Record<Language, string>;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'doctor' | 'receptionist';
  avatar_url?: string;
  color_code?: string;
  clinic_id?: string; // SaaS: Clinic ID for multi-tenancy
}