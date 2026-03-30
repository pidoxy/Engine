import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { pageview, trackUserEngagement } from '@/lib/gtag';

// Analytics Provider Component
export default function AnalyticsProvider({ children }) {
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = (url) => {
      pageview(url);
      
      // Track page-specific events
      if (url.includes('/login')) {
        trackUserEngagement.pageView('Login Page');
      } else if (url.includes('/signup')) {
        trackUserEngagement.pageView('Signup Page');
      } else if (url.includes('/app')) {
        trackUserEngagement.pageView('Dashboard');
      } else if (url.includes('/patient/')) {
        trackUserEngagement.pageView('Patient Detail');
      } else if (url.includes('/consultation/')) {
        trackUserEngagement.pageView('Consultation');
      } else if (url === '/') {
        trackUserEngagement.pageView('Landing Page');
      }
    };

    // Track initial page load
    handleRouteChange(router.asPath);

    // Track route changes
    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events, router.asPath]);

  return children;
}
