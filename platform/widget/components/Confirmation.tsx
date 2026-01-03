import React from 'react';
import { Language, BookingState } from '../types';
import { useTexts, useConfig } from '../hooks/useConfig';
// REMOVED: saveBookingToSupabase import - n8n webhook is now the single source of truth
// This fixes the dual-write race condition that could cause duplicate entries

interface ConfirmationProps {
  language: Language;
  booking: BookingState;
}

const Confirmation: React.FC<ConfirmationProps> = ({ language, booking }) => {
  const texts = useTexts();
  const { clinicId } = useConfig();

  // ARCHITECTURE NOTE:
  // The frontend does NOT write to the database anymore.
  // The Stripe webhook -> n8n workflow is the single source of truth.
  // This prevents:
  //   1. Duplicate entries (if both frontend and webhook succeed)
  //   2. Orphaned records (if frontend succeeds but webhook fails - no email/calendar)
  // 
  // The webhook.js correctly returns 502 if n8n fails, so Stripe will retry for 72h.

  React.useEffect(() => {
    // Clear sessionStorage booking state after successful payment redirect
    // The booking is now handled entirely by the Stripe webhook -> n8n flow
    console.log('[Confirmation] Payment successful - booking will be saved via Stripe webhook -> n8n');
    // Clear the clinic-specific booking state so user can book again
    const storageKey = `${clinicId}_booking_state`;
    sessionStorage.removeItem(storageKey);
    // Also clear legacy keys for backwards compatibility
    sessionStorage.removeItem('butkevicaBookingState');
    localStorage.removeItem('butkevicaBookingState');
  }, [clinicId]);

  const getEventDetails = () => {
    if (!booking.selectedDate || !booking.selectedTime || !booking.selectedService) return null;

    const [hours, minutes] = booking.selectedTime.split(':').map(Number);
    const startDate = new Date(booking.selectedDate);
    startDate.setHours(hours, minutes);

    const endDate = new Date(startDate);
    endDate.setMinutes(startDate.getMinutes() + (booking.selectedService.durationMinutes || 60));

    return {
      title: `Dentist: ${booking.selectedService.name[language]}`,
      description: `Appointment with ${booking.selectedSpecialist?.name || 'Specialist'}. Service: ${booking.selectedService.name[language]}`,
      location: 'Butkeviča Dental Practice',
      start: startDate,
      end: endDate
    };
  };

  const addToGoogleCalendar = () => {
    // Generate a Google Calendar link for the patient to add the appointment to their own calendar
    // Note: We cannot automatically add to a user's calendar without their OAuth consent
    // The standard approach is to open a pre-filled Google Calendar URL

    const eventDetails = getEventDetails();
    if (!eventDetails) {
      alert('Booking data missing. Please refresh');
      return;
    }

    // Format dates for Google Calendar URL (YYYYMMDDTHHmmss format)
    const formatGoogleDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const startStr = formatGoogleDate(eventDetails.start);
    const endStr = formatGoogleDate(eventDetails.end);

    // Clinic address for location
    const clinicAddress = 'Dzirnavu iela 45, Centra rajons, Rīga, LV-1010';

    // Build the Google Calendar URL
    const calendarUrl = new URL('https://calendar.google.com/calendar/render');
    calendarUrl.searchParams.set('action', 'TEMPLATE');
    calendarUrl.searchParams.set('text', eventDetails.title);
    calendarUrl.searchParams.set('dates', `${startStr}/${endStr}`);
    calendarUrl.searchParams.set('details', eventDetails.description);
    calendarUrl.searchParams.set('location', clinicAddress);

    // Open in new tab - user will see their Google Calendar with the event pre-filled
    window.open(calendarUrl.toString(), '_blank');
  };

  return (
    <div className="animate-fade-in text-center py-10">
      <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 dark:text-green-400 text-4xl">
        ✓
      </div>
      <h2 className="text-2xl font-bold text-secondary dark:text-white mb-2">{texts.successTitle[language]}</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-4">{texts.successMsg[language]}</p>

      {/* Booking confirmation message - data saved via Stripe webhook -> n8n */}
      <div className="mb-6">
        <span className="text-green-600 dark:text-green-400 text-sm">✅ {(texts as any).bookingConfirmed?.[language] || 'Pieraksts apstiprināts!'}</span>
      </div>

      <div className="bg-gray-50 dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 max-w-sm mx-auto text-left mb-8">
        <div className="space-y-3">
          <div className="flex justify-between gap-4">
            <span className="text-gray-500 dark:text-gray-400 text-sm">{texts.stepService[language]}</span>
            <span className="font-medium text-gray-900 dark:text-white text-right">{booking.selectedService?.name[language]}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-500 dark:text-gray-400 text-sm">{texts.selectSpecialist[language]}</span>
            <span className="font-medium text-gray-900 dark:text-white text-right">{booking.selectedSpecialist?.name || texts.anySpecialist[language]}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-500 dark:text-gray-400 text-sm">{texts.stepDate[language]}</span>
            <span className="font-medium text-gray-900 dark:text-white text-right">{booking.selectedDate?.toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-500 dark:text-gray-400 text-sm">{texts.timeLabel[language]}</span>
            <span className="font-medium text-gray-900 dark:text-white text-right">{booking.selectedTime}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={addToGoogleCalendar}
          className="w-full max-w-xs mx-auto block py-3 px-4 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800"
        >
          📅 {texts.addToCalendar[language]} (Google)
        </button>
      </div>
    </div>
  );
};

export default Confirmation;