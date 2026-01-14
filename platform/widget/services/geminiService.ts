import { fetchServices } from './configService';
import { Language, Service } from '../types';
import { SERVICES as FALLBACK_SERVICES } from '../constants';

/**
 * Suggests a service based on patient symptoms using AI.
 * This now calls a secure server-side endpoint instead of exposing the API key.
 */
export const suggestService = async (symptoms: string, language: Language): Promise<string | null> => {
  try {
    // Fetch services dynamically (with fallback)
    let services: Service[];
    try {
      services = await fetchServices();
    } catch (error) {
      services = FALLBACK_SERVICES;
    }

    // Prepare service data for the server
    const serviceData = services.map(s => ({
      id: s.id,
      name: s.name[Language.EN],
      description: s.description[Language.EN]
    }));

    // Call the secure server-side endpoint
    const response = await fetch('/api/suggest-service', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        symptoms,
        services: serviceData
      })
    });

    const data = await response.json();

    if (data.success && data.service_id) {
      // Validate that the returned ID exists in services
      if (services.some(s => s.id === data.service_id)) {
        return data.service_id;
      }
    }

    return 's1'; // Default to consultation
  } catch (error) {
    console.error("Service suggestion error:", error);
    return null;
  }
};