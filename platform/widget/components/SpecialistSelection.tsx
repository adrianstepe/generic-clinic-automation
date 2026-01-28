import React, { useState, useEffect, useCallback } from 'react';
import { Language, Specialist, Service, TimeSlot } from '../types';
import { useConfig } from '../hooks/useConfig';
import { checkAvailability, getWeekAvailability, getFirstAvailableDate } from '../services/api';

interface SpecialistSelectionProps {
  language: Language;
  selectedService: Service;
  selectedSpecialist: Specialist | null;
  selectedDate: Date | null;
  selectedTime: string | null;
  onSelectSpecialist: (s: Specialist | null) => void;
  onSelectDate: (d: Date) => void;
  onSelectTime: (t: string) => void;
}

const SpecialistSelection: React.FC<SpecialistSelectionProps> = ({
  language,
  selectedService,
  selectedSpecialist,
  selectedDate,
  selectedTime,
  onSelectSpecialist,
  onSelectDate,
  onSelectTime,
}) => {
  const { specialists, texts, clinicId } = useConfig();

  // Filter specialists who can perform the selected service
  const availableSpecialists = specialists.filter(s => s.specialties.includes(selectedService.id));

  // Week navigation state - allows booking up to 8 months (35 weeks) ahead
  const [weekOffset, setWeekOffset] = useState(0);
  const MAX_WEEKS_AHEAD = 35; // ~8 months

  // Generate 7 days for current week view
  const [dates, setDates] = useState<Date[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [findingNext, setFindingNext] = useState(false);

  // Week availability for "traffic light" indicators
  const [weekAvailability, setWeekAvailability] = useState<Record<string, number>>({});
  const [loadingWeekAvailability, setLoadingWeekAvailability] = useState(false);

  // Generate months for dropdown (current month + 8 months ahead)
  const generateMonthOptions = useCallback(() => {
    const months: { value: string; label: string }[] = [];
    const today = new Date();

    for (let i = 0; i <= 8; i++) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const value = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
      const label = monthDate.toLocaleDateString(
        language === Language.EN ? 'en-US' : language === Language.LV ? 'lv-LV' : 'ru-RU',
        { month: 'long', year: 'numeric' }
      );
      months.push({ value, label });
    }
    return months;
  }, [language]);

  const monthOptions = generateMonthOptions();

  // Calculate current month value based on weekOffset
  const getCurrentMonthValue = () => {
    if (dates.length === 0) return monthOptions[0]?.value || '';
    const midDate = dates[3] || dates[0]; // Use middle of week
    return `${midDate.getFullYear()}-${String(midDate.getMonth() + 1).padStart(2, '0')}`;
  };

  // Jump to a specific month
  const jumpToMonth = (monthValue: string) => {
    const [year, month] = monthValue.split('-').map(Number);
    const targetDate = new Date(year, month - 1, 15); // Middle of month
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate week offset from today to target date
    const diffDays = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const newWeekOffset = Math.max(0, Math.min(MAX_WEEKS_AHEAD, Math.floor(diffDays / 7)));
    setWeekOffset(newWeekOffset);
  };

  useEffect(() => {
    const nextDays = [];
    const startOffset = weekOffset * 7 + 1; // Start from tomorrow + week offset
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + startOffset + i);
      nextDays.push(d);
    }
    setDates(nextDays);
    // Only auto-select first date if no date is selected or if selected date is not in current view
    if (!selectedDate || !nextDays.some(d => d.toDateString() === selectedDate.toDateString())) {
      onSelectDate(nextDays[0]);
    }
  }, [weekOffset]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch week availability for traffic light indicators
  useEffect(() => {
    const fetchWeekAvailability = async () => {
      if (dates.length === 0 || !clinicId) return;

      setLoadingWeekAvailability(true);
      try {
        const startDate = dates[0].toLocaleDateString('en-CA');
        const endDate = dates[dates.length - 1].toLocaleDateString('en-CA');
        const availability = await getWeekAvailability(startDate, endDate, clinicId, selectedService.id);
        setWeekAvailability(availability);
      } catch (error) {
        console.error("Failed to load week availability", error);
      } finally {
        setLoadingWeekAvailability(false);
      }
    };

    fetchWeekAvailability();
  }, [dates, clinicId]);

  // Handle "Next Available" shortcut
  const handleNextAvailable = async () => {
    if (!clinicId) return;
    setFindingNext(true);
    try {
      const result = await getFirstAvailableDate(60, clinicId, selectedService.id);
      if (result) {
        const targetDate = new Date(result.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Calculate week offset
        const diffDays = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const newWeekOffset = Math.max(0, Math.floor((diffDays - 1) / 7));

        setWeekOffset(newWeekOffset);

        // Wait a tick for dates to update, then select
        setTimeout(() => {
          onSelectDate(targetDate);
          onSelectTime(result.time);
        }, 100);
      }
    } catch (error) {
      console.error("Failed to find next available slot", error);
    } finally {
      setFindingNext(false);
    }
  };

  // REAL AVAILABILITY CHECK
  useEffect(() => {
    const fetchRealSlots = async () => {
      if (!selectedDate || !clinicId) return;

      setLoading(true);
      setSlots([]); // Clear old slots while loading

      try {
        // Format YYYY-MM-DD (Local Time) to ensure n8n gets the correct day
        const dateStr = selectedDate.toLocaleDateString('en-CA');

        // Call the service
        const data = await checkAvailability(dateStr, clinicId, selectedService.id);

        if (data && data.slots) {
          setSlots(data.slots);
        }
      } catch (error) {
        console.error("Failed to load slots", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRealSlots();
  }, [selectedDate, selectedSpecialist]);

  const formatDate = (date: Date) => {
    const dayName = date.toLocaleDateString(language === Language.EN ? 'en-US' : language === Language.LV ? 'lv-LV' : 'ru-RU', { weekday: 'short' });
    const dayNum = date.getDate();
    return { dayName, dayNum };
  };

  // Get traffic light dot color based on availability count
  const getAvailabilityIndicator = (date: Date) => {
    // Weekend validation
    const dateStr = date.toLocaleDateString('en-CA');
    const count = weekAvailability[dateStr];

    if (count === undefined) return null; // Still loading
    if (count === 0) return 'disabled';
    if (count <= 2) return 'limited'; // Yellow/amber
    return 'available'; // Green
  };

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Specialist Selection */}
      <div>
        <h2 className="text-xl font-serif font-bold text-secondary mb-6">{texts.selectSpecialist[language]}</h2>
        <div className="flex gap-4 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide">
          {/* Option for "Any Specialist" */}
          <button
            onClick={() => onSelectSpecialist(null)}
            className={`min-w-[150px] p-5 rounded-2xl border transition-all duration-300 snap-start flex flex-col items-center justify-center
             ${selectedSpecialist === null
                ? 'border-primary bg-surface shadow-md scale-105'
                : 'border-transparent bg-white/50 backdrop-blur-sm grayscale opacity-70 hover:grayscale-0 hover:opacity-100 hover:scale-105'
              } `}
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-3 transition-colors ${selectedSpecialist === null ? 'bg-white text-primary' : 'bg-gray-100 text-gray-400'}`}>
              {/* Vector Clinic Icon */}
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 22H22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 2V22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 22V8L12 2L20 8V22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9.5 14H14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 11.5V16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-sm font-bold text-secondary text-center font-sans tracking-wide">{texts.anySpecialist[language]}</span>
          </button>

          {availableSpecialists.map((spec) => (
            <button
              key={spec.id}
              onClick={() => onSelectSpecialist(spec)}
              className={`min-w-[150px] p-5 rounded-2xl border transition-all duration-300 snap-start flex flex-col items-center
               ${selectedSpecialist?.id === spec.id
                  ? 'border-primary bg-surface shadow-md scale-105'
                  : 'border-transparent bg-white/50 backdrop-blur-sm opacity-80 hover:opacity-100 hover:scale-105'
                } `}
            >
              {spec.photoUrl ? (
                <img src={spec.photoUrl} alt={spec.name} className="w-16 h-16 rounded-full object-cover mb-3 border-2 border-white shadow-sm" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-200 mb-3 flex items-center justify-center text-xl font-serif">
                  {spec.name.charAt(0)}
                </div>
              )}
              <span className="text-sm font-bold text-secondary text-center font-serif">{spec.name}</span>
              <span className="text-xs text-gray-500 text-center font-sans mt-1 uppercase tracking-wider text-[10px]">{spec.role[language]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Date Selection */}
      <div>
        {/* Header with Title and "Next Available" Shortcut */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-serif font-bold text-secondary">{texts.stepDate[language]}</h2>
          <button
            onClick={handleNextAvailable}
            disabled={findingNext}
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-secondary transition-colors disabled:opacity-50"
          >
            {findingNext ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{texts.findingSlot[language]}</span>
              </>
            ) : (
              <>
                <span className="text-xs font-bold uppercase tracking-wider">{texts.nextAvailable[language]}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
        </div>

        {/* Week Navigation - Arrows on edges, month centered */}
        <div className="flex items-center justify-between mb-4 bg-white/50 p-2 rounded-xl backdrop-blur-sm">
          {/* Previous Week Button */}
          <button
            onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))}
            disabled={weekOffset === 0}
            className={`p-2 rounded-lg transition-all flex-shrink-0 ${weekOffset === 0
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-500 hover:text-primary hover:bg-white'
              }`}
            aria-label="Previous week"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Month Selector - Centered with Calendar Icon */}
          <div className="flex items-center gap-2">
            <select
              value={getCurrentMonthValue()}
              onChange={(e) => jumpToMonth(e.target.value)}
              className="appearance-none bg-transparent text-sm font-bold text-secondary cursor-pointer hover:text-primary focus:outline-none transition-colors uppercase tracking-widest text-center"
            >
              {monthOptions.map(opt => (
                <option key={opt.value} value={opt.value} className="capitalize">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Next Week Button */}
          <button
            onClick={() => setWeekOffset(Math.min(MAX_WEEKS_AHEAD, weekOffset + 1))}
            disabled={weekOffset >= MAX_WEEKS_AHEAD}
            className={`p-2 rounded-lg transition-all flex-shrink-0 ${weekOffset >= MAX_WEEKS_AHEAD
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-500 hover:text-primary hover:bg-white'
              }`}
            aria-label="Next week"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Date Buttons with Availability Indicators */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {dates.map((date) => {
            const { dayName, dayNum } = formatDate(date);
            const isSelected = selectedDate?.toDateString() === date.toDateString();
            const availability = getAvailabilityIndicator(date);
            const isDisabled = availability === 'disabled';

            return (
              <button
                key={date.toISOString()}
                onClick={() => !isDisabled && onSelectDate(date)}
                disabled={isDisabled}
                className={`min-w-[65px] p-3 rounded-xl transition-all flex flex-col items-center relative group ${isSelected
                  ? 'bg-primary text-white shadow-lg'
                  : isDisabled
                    ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                    : 'bg-white text-gray-600 hover:bg-surface hover:text-primary hover:shadow-md'
                  }`}
              >
                <span className="text-[10px] uppercase font-bold mb-1 opacity-70 tracking-wider">{dayName}</span>
                <span className="text-xl font-serif font-bold">{dayNum}</span>

                {/* Traffic Light Dot - Only show for available dates */}
                {!isSelected && !loadingWeekAvailability && availability && availability !== 'disabled' && (
                  <span
                    className={`absolute bottom-2 w-1.5 h-1.5 rounded-full ${availability === 'available'
                      ? 'bg-emerald-500' // Subtle green
                      : 'bg-amber-400' // Soft amber
                      }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Slots */}
      <div>
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-primary"></div>
            <p className="text-gray-400 mt-2 text-xs font-serif italic">{texts.checkingAvailability[language]}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {slots.map((slot) => (
                <button
                  key={slot.time}
                  disabled={!slot.available}
                  onClick={() => onSelectTime(slot.time)}
                  className={`py-3 px-2 rounded-xl text-sm font-medium transition-all ${!slot.available
                    ? 'bg-transparent text-gray-300 cursor-not-allowed border border-dashed border-gray-200'
                    : selectedTime === slot.time
                      ? 'bg-secondary text-primary shadow-lg ring-1 ring-primary'
                      : 'bg-white text-gray-700 hover:border-primary hover:text-primary border border-transparent shadow-sm hover:shadow-md'
                    }`}
                >
                  {slot.time}
                </button>
              ))}
            </div>
            {selectedDate && slots.length === 0 && (
              <p className="text-center text-gray-400 mt-6 text-sm italic font-serif">{texts.noSlotsDate[language]}</p>
            )}
            {selectedDate && slots.length > 0 && slots.every(s => !s.available) && (
              <p className="text-center text-gray-400 mt-6 text-sm italic font-serif">{texts.allBooked[language]}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SpecialistSelection;