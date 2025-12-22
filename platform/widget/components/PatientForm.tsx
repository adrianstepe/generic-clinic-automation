import React, { useState } from 'react';
import { Language, PatientData } from '../types';
import { useTexts } from '../hooks/useConfig';

interface PatientFormProps {
  language: Language;
  data: PatientData;
  updateData: (data: Partial<PatientData>) => void;
}

const COUNTRY_CODES = [
  { code: '+371', flag: '🇱🇻', name: 'Latvia' },
  { code: '+370', flag: '🇱🇹', name: 'Lithuania' },
  { code: '+372', flag: '🇪🇪', name: 'Estonia' },
  { code: '+44', flag: '🇬🇧', name: 'UK' },
  { code: '+353', flag: '🇮🇪', name: 'Ireland' },
  { code: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: '+1', flag: '🇺🇸', name: 'USA' },
  { code: '+7', flag: '🇷🇺', name: 'Russia' },
];

const PatientForm: React.FC<PatientFormProps> = ({ language, data, updateData }) => {
  const texts = useTexts();
  const [countryCode, setCountryCode] = useState('+371');

  // Get placeholder text based on language
  const getSymptomPlaceholder = () => {
    switch (language) {
      case Language.LV:
        return 'Piem., pastāvīgas galvassāpes, asins analīžu kontrole...';
      case Language.RU:
        return 'Напр., постоянная головная боль, контроль анализов крови...';
      default:
        return 'E.g., persistent headache, follow-up on blood tests...';
    }
  };

  // Get email placeholder based on language
  const getEmailPlaceholder = () => {
    switch (language) {
      case Language.LV:
        return 'piem., piemers@epasts.lv';
      case Language.RU:
        return 'напр., example@mail.ru';
      default:
        return 'e.g., example@domain.com';
    }
  };

  // Get security text based on language
  const getSecurityText = () => {
    switch (language) {
      case Language.LV:
        return 'Jūsu informācija ir droša un tiek izmantota tikai jūsu vizītei.';
      case Language.RU:
        return 'Ваша информация защищена и используется только для вашего визита.';
      default:
        return 'Your information is secure and used only for your appointment.';
    }
  };

  // Get section titles
  const getPatientInfoTitle = () => {
    switch (language) {
      case Language.LV: return 'Pacienta Informācija';
      case Language.RU: return 'Информация о Пациенте';
      default: return 'Patient Information';
    }
  };

  const getContactInfoTitle = () => {
    switch (language) {
      case Language.LV: return 'Kontaktinformācija';
      case Language.RU: return 'Контактная Информация';
      default: return 'Contact Information';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Patient Information Section */}
      <div>
        <h2 className="text-xl font-bold text-secondary dark:text-white mb-5">{getPatientInfoTitle()}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {texts.firstName[language]} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder={texts.firstName[language]}
              className="w-full p-3.5 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-gray-400"
              value={data.firstName}
              onChange={(e) => updateData({ firstName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {texts.lastName[language]} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder={texts.lastName[language]}
              className="w-full p-3.5 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-gray-400"
              value={data.lastName}
              onChange={(e) => updateData({ lastName: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Contact Information Section */}
      <div>
        <h2 className="text-xl font-bold text-secondary dark:text-white mb-5">{getContactInfoTitle()}</h2>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {texts.email[language]} <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            required
            placeholder={getEmailPlaceholder()}
            className="w-full p-3.5 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-gray-400"
            value={data.email}
            onChange={(e) => updateData({ email: e.target.value })}
          />
        </div>

        {/* Phone Number */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {texts.phone[language]} <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="min-w-[140px] p-3.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all cursor-pointer"
            >
              {COUNTRY_CODES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.code} {c.name}
                </option>
              ))}
            </select>
            <div className="flex-1 relative">
              <input
                type="tel"
                required
                className="w-full p-3.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                value={data.phone.replace(countryCode, '')}
                onChange={(e) => updateData({ phone: `${countryCode}${e.target.value}` })}
                placeholder="2000 0000"
              />
              {/* Validation indicator */}
              {data.phone.replace(countryCode, '').length >= 8 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reason for Visit */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {texts.symptoms[language]}
        </label>
        <textarea
          rows={4}
          className="w-full p-3.5 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none placeholder:text-gray-400"
          value={data.details}
          onChange={(e) => updateData({ details: e.target.value })}
          placeholder={getSymptomPlaceholder()}
        />
      </div>

      {/* Security Trust Signal */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <svg className="w-4 h-4 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
        <span>{getSecurityText()}</span>
      </div>

      {/* GDPR Consent */}
      <div className="pt-4 border-t border-gray-100 dark:border-slate-700">
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative flex items-center mt-0.5">
            <input
              type="checkbox"
              required
              className="peer h-5 w-5 cursor-pointer appearance-none rounded border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 checked:bg-primary checked:border-primary transition-all"
              checked={data.gdprConsent}
              onChange={(e) => updateData({ gdprConsent: e.target.checked })}
            />
            <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none opacity-0 peer-checked:opacity-100 text-white" viewBox="0 0 14 14" fill="none">
              <path d="M3 8L6 11L11 3.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors select-none leading-relaxed">
            {texts.gdprLabel[language]}
          </span>
        </label>
      </div>
    </div>
  );
};

export default PatientForm;