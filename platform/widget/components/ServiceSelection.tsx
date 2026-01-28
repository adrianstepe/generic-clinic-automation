import React, { useMemo, useState, useRef, MouseEvent } from 'react';
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
  const { services, texts, isLoading, clinic } = useConfig();
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
        <p className="text-gray-500 mt-4 text-sm font-serif italic">Loading services...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in w-full">
      {/* Header */}
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-serif font-bold text-secondary mb-3">{texts.selectService[language]}</h2>
        <p className="text-gray-500 font-light tracking-wide">{texts.selectServiceDesc[language]}</p>
      </div>

      {/* Grouped Services */}
      <div className="space-y-10">
        {CATEGORY_ORDER.map((category) => {
          const categoryServices = groupedServices[category];
          if (categoryServices.length === 0) return null;

          const labelKey = CATEGORY_LABELS[category];
          const categoryLabel = texts[labelKey]?.[language] || category;

          return (
            <div key={category}>
              {/* Category Header - Minimalist Elegant */}
              <div className="flex items-center gap-4 mb-6">
                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-primary/20"></div>
                <h3 className="text-xs font-bold text-secondary uppercase tracking-[0.25em] font-sans">
                  {categoryLabel}
                </h3>
                <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-primary/20"></div>
              </div>

              {/* Service Cards - Luxury Layout */}
              <div className="space-y-4">
                {categoryServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    isSelected={selectedService?.id === service.id}
                    onSelect={onSelect}
                    language={language}
                    clinicCurrency={clinic.settings?.currency || 'EUR'}
                    texts={texts}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Extracted Card Component for clean logic
const ServiceCard = ({ service, isSelected, onSelect, language, clinicCurrency, texts }: any) => {
  const cardRef = useRef<HTMLButtonElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: MouseEvent<HTMLButtonElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <button
      ref={cardRef}
      onClick={() => onSelect(service)}
      onMouseMove={handleMouseMove}
      className={`
        relative group w-full p-6 rounded-2xl transition-all duration-500 text-left overflow-hidden
        outline-none border
        ${isSelected
          ? 'border-primary bg-surface shadow-2xl scale-[1.02]'
          : 'border-transparent bg-white/40 backdrop-blur-md hover:bg-white/60 hover:scale-[1.01] hover:shadow-xl hover:border-primary/20'
        }
      `}
    >
      {/* Spotlight Effect Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(161, 130, 103, 0.08), transparent 40%)`
        }}
      />

      <div className="relative z-10 flex items-center justify-between gap-6">
        <div className="flex items-center gap-6 flex-1">
          {/* Icon - Minimalist Box */}
          {service.icon && (
            <div className={`
              w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0 transition-all duration-300
              ${isSelected
                ? 'bg-primary text-white shadow-lg rotate-3'
                : 'bg-surface text-primary group-hover:bg-primary/10'
              }
            `}>
              {service.icon}
            </div>
          )}

          {/* Texts */}
          <div className="flex-1">
            <h4 className={`text-lg font-serif font-bold mb-1 transition-colors ${isSelected ? 'text-secondary' : 'text-gray-800'}`}>
              {service.name[language]}
            </h4>
            <div className="flex items-center gap-4 text-sm font-sans text-gray-500">
              <span>{service.durationMinutes} min</span>
              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
              <span className="line-clamp-1">{service.description[language]}</span>
            </div>
          </div>
        </div>

        {/* Price & Magnetic Indicator */}
        <div className="flex items-center gap-6">
          <div className={`text-right transition-transform duration-300 ${isSelected ? 'translate-x-0' : 'group-hover:-translate-x-2'}`}>
            <span className="block text-xl font-bold font-serif text-secondary">
              {clinicCurrency === 'USD' ? '$' : '€'}{service.price}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-gray-400">
              {texts.startingFrom[language]}
            </span>
          </div>

          {/* Magnetic "Follow" Indicator - Replaces Chevron */}
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
            ${isSelected ? 'bg-primary text-white shadow-lg' : 'bg-transparent border border-gray-200 text-gray-300 group-hover:border-primary group-hover:text-primary'}
          `}>
            <svg
              width="20" height="20" viewBox="0 0 24 24" fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={`transition-transform duration-300 ${isSelected ? 'rotate-0' : '-rotate-45 group-hover:rotate-0'}`}
            >
              <path d="M5 12H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
    </button>
  );
};

export default ServiceSelection;