import React, { useState, useEffect, useRef } from 'react';
import { Language, Service, BookingState } from '../types';
import { useConfig } from '../hooks/useConfig';

// Turnstile site key - replace with your actual key from Cloudflare dashboard
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';

// Declare Stripe on window object to avoid TS errors without installing types
declare global {
  interface Window {
    Stripe?: (key: string) => any;
  }
}

interface PaymentMockProps {
  language: Language;
  service: Service;
  booking: BookingState;
  onConfirm: () => void; // Kept for prop compatibility
}

const PaymentMock: React.FC<PaymentMockProps> = ({ language, service, booking }) => {
  const { texts, clinicId } = useConfig();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const depositAmount = 30; // Fixed deposit
  const remainingBalance = service.price - depositAmount;

  // Load Turnstile script and initialize widget
  useEffect(() => {
    // Skip if no site key configured
    if (!TURNSTILE_SITE_KEY) {
      console.log('[Turnstile] No site key configured, skipping CAPTCHA');
      return;
    }

    // Load Turnstile script if not already loaded
    if (!document.getElementById('turnstile-script')) {
      const script = document.createElement('script');
      script.id = 'turnstile-script';
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.onload = () => renderTurnstile();
      document.head.appendChild(script);
    } else {
      renderTurnstile();
    }

    function renderTurnstile() {
      if (turnstileRef.current && (window as any).turnstile) {
        (window as any).turnstile.render(turnstileRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (token: string) => {
            console.log('[Turnstile] Token received');
            setTurnstileToken(token);
          },
          theme: 'light',
          size: 'normal' // Horizontal layout like on other websites
        });
      }
    }
  }, []);

  const handlePay = async () => {
    setLoading(true);
    setErrorMsg(null);
    setPaymentUrl(null);

    try {
      const amountInCents = depositAmount * 100;

      // Determine a safe Base URL
      const getBaseUrl = () => {
        if (typeof window !== 'undefined') {
          return window.location.origin + window.location.pathname;
        }
        return ''; // No fallback to external domains
      };

      const baseUrl = getBaseUrl();
      const successUrl = `${baseUrl}?success=1`;
      const cancelUrl = `${baseUrl}?cancel=1`;

      // 1. Format the date to ISO string (YYYY-MM-DD) using LOCAL date components
      // CRITICAL: Do NOT use toISOString() as it converts to UTC, shifting dates backwards
      // for timezones ahead of UTC (e.g., user selects Dec 22 in UTC+2, toISOString gives Dec 21)
      let isoDate = '';
      if (booking.selectedDate) {
        const d = new Date(booking.selectedDate);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0'); // getMonth() is 0-indexed
        const day = String(d.getDate()).padStart(2, '0');
        isoDate = `${year}-${month}-${day}`; // Local date, timezone-safe
      }

      // 2. Format start and end times for slot reservation
      // Use string manipulation to avoid timezone conversion issues
      const startTimeIso = booking.selectedDate && booking.selectedTime
        ? `${isoDate}T${booking.selectedTime}:00`
        : null;

      // Calculate end time by adding service duration (default 60 minutes)
      // Using string manipulation to avoid Date object timezone conversion
      let endTimeIso: string | null = null;
      if (startTimeIso && booking.selectedTime) {
        const [hours, minutes] = booking.selectedTime.split(':').map(Number);
        const durationMinutes = service.durationMinutes || 60;
        const totalMinutes = hours * 60 + minutes + durationMinutes;
        const endHours = Math.floor(totalMinutes / 60) % 24;
        const endMinutes = totalMinutes % 60;
        const endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
        endTimeIso = `${isoDate}T${endTime}:00`;
      }

      // 3. SLOT LOCK: Reserve the slot atomically BEFORE creating Stripe session
      // This prevents race conditions where two users book the same slot
      let pendingBookingId: string | null = null;

      if (startTimeIso && endTimeIso) {
        const reserveApiUrl = import.meta.env.VITE_RESERVE_SLOT_URL ||
          (import.meta.env.VITE_API_URL?.replace('/api/create-session', '/api/reserve-slot') ||
            'https://test1-3oj.pages.dev/api/reserve-slot');

        try {
          const reserveResponse = await fetch(reserveApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            mode: 'cors',
            body: JSON.stringify({
              clinic_id: clinicId, // SaaS: Identify clinic
              start_time: startTimeIso,
              end_time: endTimeIso,
              customer_email: booking.patientData.email,
              customer_name: `${booking.patientData.firstName} ${booking.patientData.lastName}`,
              service_id: service.id,
              service_name: service.name[booking.language] || service.name[Language.EN],
              cf_turnstile_token: turnstileToken // CAPTCHA token for bot protection
            })
          });

          const reserveData = await reserveResponse.json();

          if (!reserveResponse.ok || !reserveData.success) {
            // Slot is already taken - show user-friendly error
            const slotTakenMessages = {
              [Language.EN]: 'This time slot is no longer available. Please select a different time.',
              [Language.LV]: 'Šis laika slots vairs nav pieejams. Lūdzu, izvēlieties citu laiku.',
              [Language.RU]: 'Это время больше недоступно. Пожалуйста, выберите другое время.'
            };
            throw new Error(reserveData.error === 'SLOT_ALREADY_BOOKED'
              ? slotTakenMessages[language]
              : reserveData.error || 'Slot reservation failed');
          }

          pendingBookingId = reserveData.pending_booking_id;
          console.log('[SlotLock] Slot reserved:', pendingBookingId);
        } catch (reserveError: any) {
          // If it's a slot-taken error, re-throw it
          if (reserveError.message.includes('no longer available') ||
            reserveError.message.includes('nav pieejams') ||
            reserveError.message.includes('недоступно')) {
            throw reserveError;
          }
          // For other errors (network issues), log and continue without slot lock
          // This maintains backward compatibility if the endpoint isn't deployed yet
          console.warn('[SlotLock] Reserve-slot failed, continuing without lock:', reserveError);
        }
      }

      // 4. Call Backend to create Checkout Session
      const apiUrl = import.meta.env.VITE_API_URL || 'https://stripe-mvp-proxy.adriansbusinessw.workers.dev/';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify({
          amount: amountInCents,
          service: service.name[Language.EN],
          success_url: successUrl,
          cancel_url: cancelUrl,
          customer: {
            name: `${booking.patientData.firstName} ${booking.patientData.lastName}`,
            email: booking.patientData.email,
            phone: booking.patientData.phone
          },
          booking: {
            // UPDATED: Send the clean ISO date string
            date: isoDate,
            time: booking.selectedTime,
            serviceId: service.id,
            // OPTIONAL: Pass the translated service name for the Calendar Event Title
            serviceName: service.name[booking.language] || service.name[Language.EN],
            language: booking.language,
            duration: service.durationMinutes || 60,
            doctor_id: booking.selectedSpecialist?.id || null,
            doctor_name: booking.selectedSpecialist?.name || null,
            // SLOT LOCK: Pass pending booking ID so n8n can promote to confirmed
            pending_booking_id: pendingBookingId,
            clinic_id: clinicId // SaaS: Identify clinic
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        let errorMessage = response.statusText;
        try {
          const errJson = JSON.parse(errText);
          errorMessage = errJson.error || response.statusText;
        } catch (e) {
          errorMessage = errText || response.statusText;
        }
        throw new Error(`Server Error: ${errorMessage}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.url) {
        throw new Error("Invalid response from payment server (no checkout URL).");
      }

      console.log("Payment URL received:", data.url); // Debug log

      // 5. Direct Redirect
      // We try to set window.location.href. 
      // If this is blocked (e.g. by sandbox permissions), we catch the error 
      // and show a manual button instead.
      try {
        window.location.href = data.url;
      } catch (navigationError: any) {
        console.warn("Auto-redirect blocked. Falling back to manual link.", navigationError);
        setPaymentUrl(data.url);
        setLoading(false); // Stop loading to show the link
      }

    } catch (err: any) {
      console.error("Payment initiation failed:", err);
      if (err.message === 'Failed to fetch') {
        setErrorMsg("Network Error: Could not connect to the payment server. Please ensure the Cloudflare Worker URL is correct and deployed.");
      } else {
        setErrorMsg(err.message || "An unexpected error occurred. Please try again.");
      }
      setLoading(false);
    }
  };

  // Format date for display - cleaner format: "Mon, 8 Dec • 09:00"
  const formatDisplayDate = (date: Date | null, time: string | null) => {
    if (!date) return '-';
    const locale = language === Language.EN ? 'en-US' : language === Language.LV ? 'lv-LV' : 'ru-RU';
    const weekday = date.toLocaleDateString(locale, { weekday: 'short' });
    const day = date.getDate();
    const month = date.toLocaleDateString(locale, { month: 'short' });
    return `${weekday}, ${day} ${month}${time ? ` • ${time}` : ''}`;
  };

  return (
    <div className="animate-fade-in max-w-md mx-auto pb-28 sm:pb-0">
      {/* Clean Receipt Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{texts.appointmentSummary[language]}</h2>
      </div>

      {/* Appointment Details - Clean List with Dividers (No Card Container) */}
      <div className="space-y-0 mb-8">
        {/* Date & Time Row */}
        <div className="flex items-center gap-3 py-4 border-b border-gray-100 dark:border-slate-700">
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div className="flex-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">{texts.dateLabel[language]} & {texts.timeLabel[language]}</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatDisplayDate(booking.selectedDate, booking.selectedTime)}</p>
          </div>
        </div>

        {/* Service Row */}
        <div className="flex items-center gap-3 py-4 border-b border-gray-100 dark:border-slate-700">
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <div className="flex-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">{texts.serviceLabel[language]}</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{service.name[language]}</p>
          </div>
        </div>

        {/* Specialist Row (if selected) */}
        {booking.selectedSpecialist && (
          <div className="flex items-center gap-3 py-4 border-b border-gray-100 dark:border-slate-700">
            <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <div className="flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">{texts.specialistLabel[language]}</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{booking.selectedSpecialist.name}</p>
            </div>
          </div>
        )}

        {/* Patient Row */}
        <div className="flex items-center gap-3 py-4 border-b border-gray-100 dark:border-slate-700">
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">{texts.personalInfo[language]}</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{booking.patientData.firstName} {booking.patientData.lastName}</p>
          </div>
        </div>
      </div>

      {/* Receipt-Style Pricing Section */}
      <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-5 mb-6">
        {/* Total Cost */}
        <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-slate-700">
          <span className="text-sm text-gray-600 dark:text-gray-400">{texts.total[language]}</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">€{service.price}</span>
        </div>

        {/* Remaining Balance */}
        <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-slate-700">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {language === Language.EN ? 'Balance Due at Clinic' : language === Language.LV ? 'Atlikusī summa klīnikā' : 'Остаток в клинике'}
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">€{remainingBalance}</span>
        </div>

        {/* Due Now - Large and Bold */}
        <div className="flex justify-between items-center pt-4">
          <div>
            <span className="text-base font-bold text-gray-900 dark:text-white block">
              {language === Language.EN ? 'Due Now' : language === Language.LV ? 'Maksājams tagad' : 'К оплате сейчас'}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {language === Language.EN ? 'Deposit to secure your slot' : language === Language.LV ? 'Depozīts rezervācijai' : 'Депозит для бронирования'}
            </span>
          </div>
          <span className="text-2xl font-bold text-primary">€{depositAmount}</span>
        </div>
      </div>

      {/* Trust Signal - Compact Info */}
      <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400 mb-6 px-1">
        <svg className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <span>{texts.reservationFeeDesc2[language]}</span>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
          {errorMsg}
        </div>
      )}

      {/* Turnstile CAPTCHA widget - positioned just above payment button */}
      {TURNSTILE_SITE_KEY && (
        <div ref={turnstileRef} className="flex justify-center mb-4" />
      )}

      {/* Sticky Payment Button - Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t dark:border-slate-700 p-4 shadow-lg sm:relative sm:border-0 sm:shadow-none sm:bg-transparent dark:sm:bg-transparent sm:p-0 z-50">
        <div className="max-w-md mx-auto">
          {paymentUrl ? (
            <a
              href={paymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 rounded-xl font-bold text-white shadow-lg bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 flex items-center justify-center gap-2 no-underline transition-all"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span>Continue to Payment</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          ) : (
            <button
              onClick={handlePay}
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 ${loading ? 'bg-gray-400 cursor-wait' : 'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700'
                }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span>{texts.paySecure[language]} • €{depositAmount}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          )}
          <div className="mt-3 flex items-center justify-center gap-1.5 text-gray-400 dark:text-gray-500">
            <span className="text-xs font-semibold">Powered by</span>
            <span className="font-bold italic text-lg">Stripe</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMock;