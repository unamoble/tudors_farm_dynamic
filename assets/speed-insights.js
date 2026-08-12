/**
 * Vercel Speed Insights Integration
 * 
 * This module initializes Vercel Speed Insights to track Core Web Vitals
 * and page performance metrics for this site.
 */
import { injectSpeedInsights } from '@vercel/speed-insights';

// Initialize Speed Insights
// This will automatically track page views and Core Web Vitals
injectSpeedInsights({
  // Enable debug mode in development (will be ignored in production)
  debug: false,
  
  // Sample rate: 1.0 means 100% of events are tracked
  // Reduce this value (e.g., 0.5 for 50%) to sample fewer events if needed
  sampleRate: 1.0
});
