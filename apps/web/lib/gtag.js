// Google Analytics 4 (GA4) configuration and utilities
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;

// Initialize Google Analytics
export const initGA = () => {
  if (typeof window !== 'undefined' && GA_TRACKING_ID) {
    // Load gtag script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_TRACKING_ID, {
      page_title: document.title,
      page_location: window.location.href,
    });
  }
};

// Track page views
export const pageview = (url) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

// Track custom events
export const event = ({ action, category, label, value }) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Track user engagement events
export const trackUserEngagement = {
  // Authentication events
  login: (method = 'email') => {
    event({
      action: 'login',
      category: 'Authentication',
      label: method,
    });
  },
  
  signup: (method = 'email') => {
    event({
      action: 'sign_up',
      category: 'Authentication',
      label: method,
    });
  },

  logout: () => {
    event({
      action: 'logout',
      category: 'Authentication',
    });
  },

  // Navigation events
  pageView: (pageName) => {
    event({
      action: 'page_view',
      category: 'Navigation',
      label: pageName,
    });
  },

  // Patient management events
  createPatient: () => {
    event({
      action: 'create_patient',
      category: 'Patient Management',
    });
  },

  viewPatient: (patientId) => {
    event({
      action: 'view_patient',
      category: 'Patient Management',
      label: patientId,
    });
  },

  // Consultation events
  startConsultation: (patientId) => {
    event({
      action: 'start_consultation',
      category: 'Consultation',
      label: patientId,
    });
  },

  sendMessage: (messageType = 'text') => {
    event({
      action: 'send_message',
      category: 'Consultation',
      label: messageType,
    });
  },

  recordAudio: () => {
    event({
      action: 'record_audio',
      category: 'Consultation',
    });
  },

  uploadDocument: (fileType) => {
    event({
      action: 'upload_document',
      category: 'Consultation',
      label: fileType,
    });
  },

  // Feature usage events
  useVoiceToText: () => {
    event({
      action: 'use_voice_to_text',
      category: 'Feature Usage',
    });
  },

  generateReport: () => {
    event({
      action: 'generate_report',
      category: 'Feature Usage',
    });
  },

  // Error tracking
  error: (errorType, errorMessage) => {
    event({
      action: 'error',
      category: 'Error Tracking',
      label: `${errorType}: ${errorMessage}`,
    });
  },

  // Performance events
  slowLoad: (pageName, loadTime) => {
    event({
      action: 'slow_load',
      category: 'Performance',
      label: pageName,
      value: Math.round(loadTime),
    });
  },
};

// Track conversion events
export const trackConversions = {
  // Landing page conversions
  landingPageView: () => {
    event({
      action: 'landing_page_view',
      category: 'Conversion',
    });
  },

  signupFromLanding: () => {
    event({
      action: 'signup_from_landing',
      category: 'Conversion',
    });
  },

  loginFromLanding: () => {
    event({
      action: 'login_from_landing',
      category: 'Conversion',
    });
  },

  // Product demo interactions
  watchDemo: () => {
    event({
      action: 'watch_demo',
      category: 'Conversion',
    });
  },

  // Contact/engagement
  contactSupport: () => {
    event({
      action: 'contact_support',
      category: 'Conversion',
    });
  },
};

// Privacy-compliant analytics (respects user consent)
export const initPrivacyCompliantGA = (hasConsent = false) => {
  if (hasConsent) {
    initGA();
  } else {
    // Initialize with anonymized IP and disabled advertising features
    if (typeof window !== 'undefined' && GA_TRACKING_ID) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      function gtag() {
        window.dataLayer.push(arguments);
      }
      window.gtag = gtag;
      gtag('js', new Date());
      gtag('config', GA_TRACKING_ID, {
        anonymize_ip: true,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      });
    }
  }
};
