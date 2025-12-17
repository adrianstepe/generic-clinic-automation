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

const BookingWidget: React.FC = () => {
    // Get full config context to access clinicId
    const { texts, clinicId } = useConfig();
    const { trackStep, trackLanguageChange, trackBookingComplete } = useAnalytics();

    const [booking, setBooking] = useState<BookingState>(() => {
        // Lazy Initialization: Synchronously read from localStorage to prevent race conditions
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('butkevicaBookingState');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    // Restore Date object
                    if (parsed.selectedDate) {
                        parsed.selectedDate = new Date(parsed.selectedDate);
                    }
                    return parsed;
                } catch (e) {
                    console.error("Failed to parse saved booking state", e);
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

    // Handle browser back button within the widget context (optional enhancement)
    useEffect(() => {
        // Scroll to top on step change
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [booking.step]);

    // Persist state to localStorage to handle redirect flows (like Stripe)
    useEffect(() => {
        localStorage.setItem('butkevicaBookingState', JSON.stringify(booking));
    }, [booking]);

    // Check for success return from Payment provider
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('success') === '1') {
            // State is already loaded via lazy init, just advance step
            setBooking(prev => ({ ...prev, step: 5 }));
            trackBookingComplete();
        }
    }, [trackBookingComplete]);

    // Pre-fetch availability to warm up the n8n workflow
    useEffect(() => {
        const warmUp = async () => {
            if (!clinicId) return; // Wait for clinicId
            try {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const dateStr = tomorrow.toLocaleDateString('en-CA');
                console.log("Warming up availability workflow for:", dateStr);
                await checkAvailability(dateStr, clinicId);
            } catch (e) {
                // Ignore errors during warm-up
                console.log("Warm-up failed (expected if offline):", e);
            }
        };
        warmUp();
    }, [clinicId]);

    const updateBooking = (updates: Partial<BookingState>) => {
        // Track language changes
        if (updates.language && updates.language !== booking.language) {
            trackLanguageChange(updates.language);
        }
        setBooking(prev => ({ ...prev, ...updates }));
    };

    const updatePatientData = (data: Partial<typeof booking.patientData>) => {
        setBooking(prev => ({ ...prev, patientData: { ...prev.patientData, ...data } }));
    };

    const nextStep = () => {
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
                // Phone must be longer than just the country code (e.g. "+371" is 4 chars)
                // Email must look somewhat valid
                return (
                    firstName.trim().length > 0 &&
                    lastName.trim().length > 0 &&
                    email.includes('@') &&
                    phone.length > 5 &&
                    gdprConsent
                );
            case 4: return true; // Payment handled in component
            default: return false;
        }
    };

    // Theme: Always default to light mode for clean medical aesthetic
    // User can toggle manually, persisted to localStorage
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
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

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-20 transition-colors duration-300">
            <Header
                currentLanguage={booking.language}
                setLanguage={(lang) => updateBooking({ language: lang })}
                theme={theme}
                toggleTheme={toggleTheme}
            />

            <main className="max-w-3xl mx-auto bg-white dark:bg-slate-800 min-h-[calc(100vh-64px)] shadow-xl sm:my-8 sm:rounded-2xl sm:min-h-fit overflow-hidden transition-colors duration-300">
                {booking.step < 5 && (
                    <ProgressBar currentStep={booking.step} language={booking.language} />
                )}

                <div className="p-6 sm:p-8">
                    {booking.step === 1 && (
                        <ServiceSelection
                            language={booking.language}
                            selectedService={booking.selectedService}
                            onSelect={(service) => {
                                updateBooking({ selectedService: service });
                                // Auto advance on mobile for better UX
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

                {/* Footer Navigation (Sticky on Mobile) */}
                {booking.step < 5 && booking.step !== 4 && (
                    <div className="sticky bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t dark:border-slate-700 p-4 flex justify-between items-center sm:relative sm:border-0 sm:bg-transparent dark:sm:bg-transparent transition-colors duration-300">
                        <button
                            onClick={prevStep}
                            disabled={booking.step === 1}
                            className={`px-6 py-3 rounded-xl font-medium transition-colors ${booking.step === 1
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            {texts.back[booking.language]}
                        </button>

                        <button
                            onClick={nextStep}
                            disabled={!isStepValid()}
                            className={`px-8 py-3 rounded-xl font-bold text-white shadow-md transition-all transform active:scale-95 ${isStepValid()
                                ? 'bg-primary hover:bg-teal-700'
                                : 'bg-gray-300 cursor-not-allowed shadow-none'
                                }`}
                        >
                            {texts.next[booking.language]}
                        </button>
                    </div>
                )}
            </main>

            {/* Hidden Link for You to Click */}
            <div className="fixed bottom-2 right-2 opacity-50 hover:opacity-100 z-50">
                <a href="/login" className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded shadow-sm">Admin</a>
            </div>
        </div>
    );
};

export default BookingWidget;
