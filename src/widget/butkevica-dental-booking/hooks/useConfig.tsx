import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Service, Specialist, Translations } from '../types';
import { fetchAllConfig } from '../services/configService';
import { SERVICES as FALLBACK_SERVICES, SPECIALISTS as FALLBACK_SPECIALISTS, TEXTS as FALLBACK_TEXTS } from '../constants';

// ===========================================
// CONFIG CONTEXT: React Context for Dynamic Configuration
// ===========================================
// Provides services, specialists, and texts to all components
// Fetches from Supabase on mount with loading state

interface ConfigContextType {
    services: Service[];
    specialists: Specialist[];
    texts: Translations;
    isLoading: boolean;
    error: string | null;
    clinicId: string;
    refresh: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

interface ConfigProviderProps {
    children: ReactNode;
    clinicId: string;
}

export function ConfigProvider({ children, clinicId }: ConfigProviderProps) {
    const [services, setServices] = useState<Service[]>(FALLBACK_SERVICES);
    const [specialists, setSpecialists] = useState<Specialist[]>(FALLBACK_SPECIALISTS);
    const [texts, setTexts] = useState<Translations>(FALLBACK_TEXTS);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadConfig = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const config = await fetchAllConfig(clinicId);
            setServices(config.services);
            setSpecialists(config.specialists);
            setTexts(config.texts);
        } catch (err) {
            console.error('[ConfigProvider] Failed to load config:', err);
            setError('Failed to load configuration');
            // Keep fallback values already set
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (clinicId) {
            loadConfig();
        }
    }, [clinicId]);

    const value: ConfigContextType = {
        services,
        specialists,
        texts,
        isLoading,
        error,
        clinicId,
        refresh: loadConfig,
    };

    return (
        <ConfigContext.Provider value={value}>
            {children}
        </ConfigContext.Provider>
    );
}

/**
 * Hook to access dynamic configuration
 * Must be used within ConfigProvider
 */
export function useConfig(): ConfigContextType {
    const context = useContext(ConfigContext);
    if (context === undefined) {
        throw new Error('useConfig must be used within a ConfigProvider');
    }
    return context;
}

/**
 * Hook to get just services (convenience)
 */
export function useServices(): { services: Service[]; isLoading: boolean } {
    const { services, isLoading } = useConfig();
    return { services, isLoading };
}

/**
 * Hook to get just specialists (convenience)
 */
export function useSpecialists(): { specialists: Specialist[]; isLoading: boolean } {
    const { specialists, isLoading } = useConfig();
    return { specialists, isLoading };
}

/**
 * Hook to get just texts (convenience)
 */
export function useTexts(): Translations {
    const { texts } = useConfig();
    return texts;
}
