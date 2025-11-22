// Heap Analytics tracking utilities
// TypeScript declarations for Heap Analytics

declare global {
  interface Window {
    heap: {
      track: (eventName: string, properties?: Record<string, any>) => void;
      identify: (identity: string) => void;
      addUserProperties: (properties: Record<string, any>) => void;
      addEventProperties: (properties: Record<string, any>) => void;
      resetIdentity: () => void;
      onReady: (callback: () => void) => void;
    };
  }
}

/**
 * Track a custom event in Heap Analytics
 */
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (typeof window !== 'undefined' && window.heap) {
    try {
      window.heap.track(eventName, properties);
    } catch (error) {
      console.error('Heap tracking error:', error);
    }
  }
}

/**
 * Track vaccine history parsing
 */
export function trackVaccineParsed(vaccineCount: number, hasBirthDate: boolean) {
  trackEvent('Vaccine History Parsed', {
    vaccine_count: vaccineCount,
    has_birth_date: hasBirthDate,
  });
}

/**
 * Track catch-up recommendations generated
 */
export function trackCatchUpGenerated(
  recommendationCount: number,
  actionNeededCount: number,
  patientAge?: string
) {
  trackEvent('Catch-Up Recommendations Generated', {
    recommendation_count: recommendationCount,
    action_needed_count: actionNeededCount,
    patient_age: patientAge,
  });
}

/**
 * Track export action
 */
export function trackExport(format: 'json' | 'csv') {
  trackEvent('Export', {
    format,
  });
}

/**
 * Track sample data loaded
 */
export function trackSampleDataLoaded() {
  trackEvent('Sample Data Loaded');
}

/**
 * Track error
 */
export function trackError(errorType: string, errorMessage: string) {
  trackEvent('Error', {
    error_type: errorType,
    error_message: errorMessage.substring(0, 100), // Limit length
  });
}

/**
 * Track page view (Heap auto-tracks, but we can add custom properties)
 */
export function trackPageView(properties?: Record<string, any>) {
  if (typeof window !== 'undefined' && window.heap) {
    try {
      window.heap.addPageviewProperties?.(properties || {});
    } catch (error) {
      console.error('Heap pageview tracking error:', error);
    }
  }
}

