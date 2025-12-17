import React, { useMemo, useState } from 'react';
import { Service, Language, ServiceCategory } from '../types';
import { useConfig } from '../hooks/useConfig';

interface ServiceSelectionProps {
  language: Language;
  selectedService: Service | null;
  onSelect: (service: Service) => void;
}

// Define category display order
const CATEGORY_ORDER: ServiceCategory[] = ['preventive', 'children', 'treatment', 'surgery', 'prosthetics'];

// Map categories to translation keys
const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  preventive: 'categoryPreventive',
  children: 'categoryChildren',
  treatment: 'categoryTreatment',
  surgery: 'categorySurgery',
  prosthetics: 'categoryProsthetics',
};



const ServiceSelection: React.FC<ServiceSelectionProps> = ({ language, selectedService, onSelect }) => {
  const { services, texts, isLoading } = useConfig();
  const [showPriceTooltip, setShowPriceTooltip] = useState<string | null>(null);

  // Group services by category
  const groupedServices = useMemo(() => {
    const groups: Record<ServiceCategory, Service[]> = {
      preventive: [],
      children: [],
      treatment: [],
      surgery: [],
      prosthetics: [],
    };

    services.forEach((service) => {
      if (service.category && groups[service.category]) {
        groups[service.category].push(service);
      }
    });

    return groups;
  }, [services]);

  if (isLoading) {
    return (
      <div className="animate-fade-in w-full flex flex-col items-center justify-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-primary"></div>
        <p className="text-gray-500 dark:text-gray-400 mt-4 text-sm">Loading services...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in w-full">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-secondary dark:text-white mb-2">{texts.selectService[language]}</h2>
        <p className="text-gray-600 dark:text-gray-400">{texts.selectServiceDesc[language]}</p>
      </div>

      {/* Grouped Services */}
      <div className="space-y-8">
        {CATEGORY_ORDER.map((category) => {
          const categoryServices = groupedServices[category];
          if (categoryServices.length === 0) return null;

          const labelKey = CATEGORY_LABELS[category];
          const categoryLabel = texts[labelKey]?.[language] || category;

          return (
            <div key={category}>
              {/* Category Header - Premium uppercase styling */}
              <h3 className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] mb-4 px-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary/60"></span>
                {categoryLabel}
              </h3>

              {/* Service Cards - Premium horizontal layout */}
              <div className="space-y-3">
                {categoryServices.map((service) => {
                  const isSelected = selectedService?.id === service.id;

                  return (
                    <button
                      key={service.id}
                      onClick={() => onSelect(service)}
                      className={`
                        group w-full p-4 rounded-xl border-2 transition-all duration-200 text-left
                        outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                        ${isSelected
                          ? 'border-primary bg-teal-50 dark:bg-teal-900/20 shadow-md'
                          : 'border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-primary/30 hover:shadow-lg hover:-translate-y-0.5'
                        }
                      `}
                      aria-pressed={isSelected}
                    >
                      <div className="flex items-center gap-4">
                        {/* Icon - Larger with subtle background */}
                        {service.icon && (
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 transition-colors ${isSelected
                            ? 'bg-primary/10 dark:bg-teal-800/30'
                            : 'bg-gray-50 dark:bg-slate-700/50 group-hover:bg-primary/5'
                            }`}>
                            {service.icon}
                          </div>
                        )}

                        {/* Content - Main info */}
                        <div className="flex-1 min-w-0">
                          {/* Title */}
                          <h4 className={`font-semibold text-base mb-0.5 ${isSelected ? 'text-primary dark:text-teal-400' : 'text-gray-900 dark:text-white'}`}>
                            {service.name[language]}
                          </h4>

                          {/* Description - Truncated on small screens */}
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                            {service.description[language]}
                          </p>
                        </div>

                        {/* Right side - Duration, Price, Arrow */}
                        <div className="flex items-center gap-4 shrink-0">
                          {/* Duration */}
                          <span className="text-sm text-gray-400 dark:text-gray-500 hidden sm:block">
                            {service.durationMinutes} min
                          </span>

                          {/* Price - Prominent */}
                          <div className="flex items-center gap-1">
                            <span className={`text-lg font-bold ${isSelected ? 'text-primary dark:text-teal-400' : 'text-gray-800 dark:text-white'}`}>
                              €{service.price}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {texts.startingFrom[language]}
                            </span>
                            {/* Info tooltip trigger - using span instead of button to avoid nesting violation */}
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowPriceTooltip(showPriceTooltip === service.id ? null : service.id);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setShowPriceTooltip(showPriceTooltip === service.id ? null : service.id);
                                }
                              }}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-0.5 ml-0.5 cursor-pointer"
                              aria-label="Price information"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </span>
                          </div>

                          {/* Arrow - CTA indicator */}
                          <svg
                            className={`w-5 h-5 shrink-0 transition-all ${isSelected ? 'text-primary dark:text-teal-400' : 'text-gray-300 dark:text-gray-600 group-hover:text-primary group-hover:translate-x-1'}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>

                      {/* Mobile: Duration shown below */}
                      <div className="flex items-center gap-2 mt-2 sm:hidden">
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {service.durationMinutes} min
                        </span>
                      </div>

                      {/* Tooltip */}
                      {showPriceTooltip === service.id && (
                        <div className="mt-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg text-xs text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-slate-600">
                          {texts.priceTooltip?.[language] || 'Final price depends on treatment complexity and materials used.'}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ServiceSelection;