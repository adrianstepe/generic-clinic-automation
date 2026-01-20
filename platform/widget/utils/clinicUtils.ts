/**
 * Clinic Resolution Utility
 * 
 * Determines the current Clinic ID based on the following priority:
 * 1. URL Query Parameter (?clinicId=... or ?clinic_id=...)
 * 2. Environment Variable (VITE_CLINIC_ID)
 * 3. Subdomain (e.g. nordic-smile.pages.dev -> nordic-smile)
 * 4. Fallback ('sample')
 */

export const getClinicId = (): string => {
    // 1. URL Query Parameter (Runtime Override)
    if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const queryId = params.get('clinicId') || params.get('clinic_id');
        if (queryId) {
            console.log('[ClinicUtils] Using Clinic ID from URL query param:', queryId);
            return queryId;
        }
    }

    // 2. Environment variable (Build time / Dev override)
    // Note: We check this before subdomain to allow local .env overrides
    if (import.meta.env.VITE_CLINIC_ID) {
        console.log('[ClinicUtils] Using Clinic ID from VITE_CLINIC_ID:', import.meta.env.VITE_CLINIC_ID);
        return import.meta.env.VITE_CLINIC_ID;
    }

    // 3. Subdomain (Runtime SaaS)
    // e.g. nordic-smile.pages.dev -> nordic-smile
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        // Ignore localhost and IP addresses
        if (!hostname.includes('localhost') && !hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
            const parts = hostname.split('.');
            if (parts.length > 2) {
                // Strip -test, -dev, -staging suffixes to match DB ID
                // e.g. nordic-smile-test -> nordic-smile
                const subdomain = parts[0].replace(/-test$/, '').replace(/-dev$/, '').replace(/-staging$/, '');
                console.log('[ClinicUtils] Derived Clinic ID from subdomain:', subdomain);
                return subdomain;
            }
        }
    }

    // 4. Fallback default
    console.warn('[ClinicUtils] No Clinic ID found, using fallback "sample"');
    return 'sample';
};

// Helper for pure testing or non-browser contexts (if needed)
export const parseClinicIdFromUrl = (url: string): string | null => {
    try {
        const urlObj = new URL(url);
        return urlObj.searchParams.get('clinicId') || urlObj.searchParams.get('clinic_id');
    } catch {
        return null;
    }
};
