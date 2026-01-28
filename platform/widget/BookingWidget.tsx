import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ProgressBar from './components/ProgressBar';
import ServiceSelection from './components/ServiceSelection';
import SpecialistSelection from './components/SpecialistSelection';
import PatientForm from './components/PatientForm';
import PaymentMock from './components/PaymentMock';
import Confirmation from './components/Confirmation';
import { Language, BookingState } from './types';
import { useConfig } from './hooks/useConfig';
import { useAnalytics } from './hooks/useAnalytics';
import { checkAvailability } from './services/api';
import { supabase } from './supabaseClient';

interface BookingWidgetProps {
    /**
     * Display mode for the widget:
     * - 'popup': Default floating/modal style with shadows and rounded corners
     * - 'inline': Flat, full-width embed mode for seamless integration into landing pages
     */
    mode?: 'popup' | 'inline';
}

const BookingWidget: React.FC<BookingWidgetProps> = ({ mode = 'popup' }) => {
    const isInline = mode === 'inline';

    // Get full config context to access clinicId
    const { texts, clinicId } = useConfig();
    const { trackStep, trackLanguageChange, trackBookingComplete } = useAnalytics();

    const STORAGE_KEY = `${clinicId}_booking_state`;

    const [booking, setBooking] = useState<BookingState>(() => {
        // Check for reset flag immediately
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('reset') === 'true') {
                sessionStorage.removeItem(STORAGE_KEY);
            } else {
                // Only try to load if NOT resetting
                const saved = sessionStorage.getItem(STORAGE_KEY);
                if (saved) {
                    try {
                        const parsed = JSON.parse(saved);
                        if (parsed.selectedDate) {
                            parsed.selectedDate = new Date(parsed.selectedDate);
                        }
                        return parsed;
                    } catch (e) {
                        console.error("Failed to parse saved booking state", e);
                    }
                }
            }
        }
        // Default State
        return {
            step: 1,
            language: Language.LV,
            selectedService: null,
            selectedSpecialist: null,
            selectedDate: null,
            selectedTime: null,
            patientData: {
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                details: '',
                gdprConsent: false,
                marketingConsent: false,
                medicalPhoto: null
            }
        };
    });

    // Track step changes for funnel analytics
    useEffect(() => {
        const contextData = {
            service_id: booking.selectedService?.id,
            specialist_id: booking.selectedSpecialist?.id,
            has_date: !!booking.selectedDate,
            has_time: !!booking.selectedTime
        };
        trackStep(booking.step, contextData);
    }, [booking.step, trackStep]);

    // Handle browser back button within the widget context
    useEffect(() => {
        // Scroll to top on step change (only in popup mode to avoid jarring UX in inline)
        if (!isInline) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [booking.step, isInline]);

    // Persist state to sessionStorage
    useEffect(() => {
        if (booking.step === 5) {
            sessionStorage.removeItem(STORAGE_KEY);
        } else {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
        }
    }, [booking, STORAGE_KEY]);

    // Check for success return from Payment provider
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('success') === '1') {
            setBooking(prev => ({ ...prev, step: 5 }));
            trackBookingComplete();
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        }
    }, [trackBookingComplete]);

    // Pre-fetch availability to warm up the n8n workflow
    useEffect(() => {
        const warmUp = async () => {
            if (!clinicId) return;
            try {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const dateStr = tomorrow.toLocaleDateString('en-CA');
                console.log("Warming up availability workflow for:", dateStr);
                await checkAvailability(dateStr, clinicId);
            } catch (e) {
                console.log("Warm-up failed (expected if offline):", e);
            }
        };
        warmUp();
    }, [clinicId]);

    const updateBooking = (updates: Partial<BookingState>) => {
        if (updates.language && updates.language !== booking.language) {
            trackLanguageChange(updates.language);
        }
        setBooking(prev => ({ ...prev, ...updates }));
    };

    const updatePatientData = (data: Partial<typeof booking.patientData>) => {
        setBooking(prev => ({ ...prev, patientData: { ...prev.patientData, ...data } }));
    };

    // Lead Capture: Save patient data to Supabase before payment step
    const saveLeadToSupabase = async () => {
        const { firstName, lastName, email, phone } = booking.patientData;
        if (!email || !clinicId) return;

        try {
            await supabase.from('leads').upsert({
                clinic_id: clinicId,
                email: email.toLowerCase().trim(),
                phone: phone || null,
                first_name: firstName || null,
                last_name: lastName || null,
                service_id: booking.selectedService?.id || null,
                captured_at_step: 3
            }, { onConflict: 'clinic_id,email' });
            console.log('[Lead Capture] Saved lead to Supabase');
        } catch (error) {
            console.error('[Lead Capture] Failed (fail-open):', error);
        }
    };

    const nextStep = () => {
        if (booking.step === 3) {
            saveLeadToSupabase();
        }
        if (booking.step < 5) {
            updateBooking({ step: booking.step + 1 });
        }
    };

    const prevStep = () => {
        if (booking.step > 1) {
            updateBooking({ step: booking.step - 1 });
        }
    };

    const isStepValid = () => {
        switch (booking.step) {
            case 1: return !!booking.selectedService;
            case 2: return !!booking.selectedDate && !!booking.selectedTime;
            case 3:
                const { firstName, lastName, email, phone, gdprConsent } = booking.patientData;
                return (
                    firstName.trim().length > 0 &&
                    lastName.trim().length > 0 &&
                    email.includes('@') &&
                    phone.length > 5 &&
                    gdprConsent
                );
            case 4: return true;
            default: return false;
        }
    };

    // Theme: Always default to light mode for clean medical aesthetic
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        if (clinicId === 'demo-clinic') return 'light';
        if (typeof window !== 'undefined' && localStorage.theme === 'dark') {
            return 'dark';
        }
        return 'light';
    });

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.theme = newTheme;
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    // ========================================================================
    // INLINE MODE: Flat, full-width, seamless embed for landing pages
    // POPUP MODE: Standalone page with shadows, rounded corners, padding
    // ========================================================================

    // Container classes
    const containerClasses = isInline
        ? 'w-full h-full min-h-[600px] bg-white dark:bg-slate-900'
        : 'min-h-[100dvh] bg-surface dark:bg-slate-900 pb-20 transition-colors duration-300';

    // Main content area classes
    const mainClasses = isInline
        ? 'w-full h-full bg-white dark:bg-slate-800 overflow-hidden'
        : 'max-w-3xl mx-auto min-h-[calc(100dvh-64px)] bg-white/80 backdrop-blur-md dark:bg-slate-800 overflow-hidden shadow-2xl sm:my-8 sm:rounded-3xl sm:min-h-fit border border-white/50 transition-colors duration-300';

    return (
        <div className={containerClasses}>
            <Header
                currentLanguage={booking.language}
                setLanguage={(lang) => updateBooking({ language: lang })}
                theme={theme}
                toggleTheme={toggleTheme}
            />

            <main className={mainClasses}>
                {booking.step < 5 && (
                    <ProgressBar currentStep={booking.step} language={booking.language} />
                )}

                <div className={isInline ? 'p-4 sm:p-6' : 'p-6 sm:p-10'}>
                    {booking.step === 1 && (
                        <ServiceSelection
                            language={booking.language}
                            selectedService={booking.selectedService}
                            onSelect={(service) => {
                                updateBooking({ selectedService: service });
                                setTimeout(() => nextStep(), 200);
                            }}
                        />
                    )}

                    {booking.step === 2 && booking.selectedService && (
                        <SpecialistSelection
                            language={booking.language}
                            selectedService={booking.selectedService}
                            selectedSpecialist={booking.selectedSpecialist}
                            selectedDate={booking.selectedDate}
                            selectedTime={booking.selectedTime}
                            onSelectSpecialist={(s) => updateBooking({ selectedSpecialist: s })}
                            onSelectDate={(d) => updateBooking({ selectedDate: d, selectedTime: null })}
                            onSelectTime={(t) => updateBooking({ selectedTime: t })}
                        />
                    )}

                    {booking.step === 3 && (
                        <PatientForm
                            language={booking.language}
                            data={booking.patientData}
                            updateData={updatePatientData}
                        />
                    )}

                    {booking.step === 4 && booking.selectedService && (
                        <PaymentMock
                            language={booking.language}
                            service={booking.selectedService}
                            booking={booking}
                            onConfirm={nextStep}
                        />
                    )}

                    {booking.step === 5 && (
                        <Confirmation language={booking.language} booking={booking} />
                    )}
                </div>

                {/* Footer Navigation */}
                {booking.step < 5 && booking.step !== 4 && (
                    <div className={`sticky bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg dark:bg-slate-800 border-t dark:border-slate-700 p-4 sm:p-6 pb-[max(1rem,env(safe-area-inset-bottom))] flex justify-between items-center transition-colors duration-300 ${isInline ? '' : 'sm:relative sm:border-0 sm:bg-transparent dark:sm:bg-transparent'}`}>
                        <button
                            onClick={prevStep}
                            disabled={booking.step === 1}
                            className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium transition-colors font-sans ${booking.step === 1
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-500 hover:text-secondary hover:bg-surface'
                                }`}
                        >
                            {texts.back[booking.language]}
                        </button>

                        <button
                            onClick={nextStep}
                            disabled={!isStepValid()}
                            className={`px-6 sm:px-10 py-2.5 sm:py-3.5 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 font-sans tracking-wide ${isStepValid()
                                ? 'bg-primary hover:bg-[#8e7159] hover:shadow-xl'
                                : 'bg-gray-200 cursor-not-allowed shadow-none text-gray-400'
                                }`}
                        >
                            {texts.next[booking.language]}
                        </button>
                    </div>
                )}
            </main>

            {/* Hidden Login Link - Only show in popup mode */}
            {!isInline && (
                <div className="fixed bottom-2 right-2 opacity-30 hover:opacity-100 z-50 transition-opacity">
                    <a href="/login" className="text-xs text-gray-500 dark:text-slate-600 bg-gray-200 dark:bg-slate-800 px-2 py-1 rounded shadow-sm dark:shadow-none border dark:border-slate-700">Login</a>
                </div>
            )}
        </div>
    );
};

export default BookingWidget;
