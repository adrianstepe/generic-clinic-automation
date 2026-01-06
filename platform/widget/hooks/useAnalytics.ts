import { useState, useEffect, useCallback, useRef } from 'react';

// Generate or retrieve session ID
const getSessionId = (): string => {
    const key = 'demo_analytics_session';
    let sessionId = sessionStorage.getItem(key);

    if (!sessionId) {
        sessionId = crypto.randomUUID();
        sessionStorage.setItem(key, sessionId);
    }

    return sessionId;
};

interface TrackEventOptions {
    event_data?: Record<string, unknown>;
    booking_id?: string;
}

export const useAnalytics = () => {
    const sessionId = useRef<string>('');
    const trackedEvents = useRef<Set<string>>(new Set());

    useEffect(() => {
        sessionId.current = getSessionId();

        // Track widget open on mount (only once per session)
        if (!trackedEvents.current.has('widget_open')) {
            trackEvent('widget_open');
            trackedEvents.current.add('widget_open');
        }
    }, []);

    const trackEvent = useCallback(async (
        eventType: string,
        options: TrackEventOptions = {}
    ) => {
        // Skip tracking in development (Cloudflare Functions not available)
        if (import.meta.env.DEV) {
            return;
        }

        try {
            await fetch('/api/track-event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: sessionId.current || getSessionId(),
                    event_type: eventType,
                    event_data: options.event_data,
                    booking_id: options.booking_id
                })
            });
        } catch (error) {
            // Fail silently - analytics should never block UX
        }
    }, []);

    const trackStep = useCallback((step: number, context?: Record<string, unknown>) => {
        const stepMap: Record<number, string> = {
            1: 'step_1_service',
            2: 'step_2_specialist',
            3: 'step_3_datetime',
            4: 'step_4_details',
            5: 'step_5_payment'
        };

        const eventType = stepMap[step];
        if (eventType && !trackedEvents.current.has(eventType)) {
            trackEvent(eventType, { event_data: context });
            trackedEvents.current.add(eventType);
        }
    }, [trackEvent]);

    const trackBookingComplete = useCallback((bookingId?: string) => {
        trackEvent('booking_complete', { booking_id: bookingId });
    }, [trackEvent]);

    const trackLanguageChange = useCallback((language: string) => {
        trackEvent('language_change', { event_data: { language } });
    }, [trackEvent]);

    return {
        trackEvent,
        trackStep,
        trackBookingComplete,
        trackLanguageChange,
        sessionId: sessionId.current
    };
};
