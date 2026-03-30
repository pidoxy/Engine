# Analytics Setup Guide

## Google Analytics 4 (GA4) Setup

### 1. Create a GA4 Property
1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a new GA4 property for your website
3. Get your Measurement ID (format: `G-XXXXXXXXXX`)

### 2. Environment Variables
Add the following to your `.env.local` file:

```bash
# Google Analytics 4 (GA4) Configuration
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Optional: Analytics Configuration
NEXT_PUBLIC_ANALYTICS_ENABLED=true

# Optional: Privacy Settings
NEXT_PUBLIC_ANALYTICS_CONSENT_REQUIRED=false
```

### 3. What's Already Implemented

#### Automatic Tracking
- **Page Views**: All page navigation is automatically tracked
- **User Authentication**: Login and signup events
- **Landing Page Conversions**: CTA button clicks and form submissions

#### Custom Events
The following events are tracked:

**Authentication Events:**
- `login` - User login
- `signup` - User registration
- `logout` - User logout

**Navigation Events:**
- `page_view` - Page visits with page names

**Patient Management:**
- `create_patient` - New patient creation
- `view_patient` - Patient detail views

**Consultation Events:**
- `start_consultation` - Consultation initiation
- `send_message` - Message sending
- `record_audio` - Audio recording
- `upload_document` - Document uploads

**Feature Usage:**
- `use_voice_to_text` - Voice-to-text usage
- `generate_report` - Report generation

**Conversion Events:**
- `landing_page_view` - Landing page visits
- `signup_from_landing` - Signups from landing page
- `login_from_landing` - Logins from landing page
- `watch_demo` - Demo video views

### 4. Privacy Compliance

The analytics implementation includes:
- **IP Anonymization**: Enabled by default
- **No Advertising Features**: Disabled by default
- **Consent Management**: Ready for GDPR/CCPA compliance

### 5. Viewing Analytics Data

1. **Google Analytics Dashboard**: Visit your GA4 property dashboard
2. **Real-time Reports**: See live user activity
3. **Custom Events**: View tracked events in the Events section
4. **Conversion Tracking**: Monitor signup and login conversions

### 6. Custom Analytics Dashboard

A simple internal analytics dashboard is available at `/components/Analytics/SimpleAnalytics.js`. 
You can integrate this into your admin panel to show key metrics.

### 7. Testing Analytics

1. **GA4 Debug View**: Enable debug mode in GA4
2. **Real-time Reports**: Check real-time data in GA4
3. **Browser DevTools**: Check Network tab for gtag requests
4. **Google Tag Assistant**: Use browser extension to verify tracking

### 8. Advanced Configuration

#### Custom Dimensions
You can add custom dimensions for:
- User roles (CHW, Clinician, Admin)
- Organization information
- Feature usage patterns

#### Enhanced Ecommerce
For future ecommerce features, you can track:
- Subscription purchases
- Plan upgrades
- Feature usage by plan

### 9. Troubleshooting

**Analytics not working?**
1. Check `NEXT_PUBLIC_GA_ID` is set correctly
2. Verify the GA4 property is active
3. Check browser console for errors
4. Ensure ad blockers aren't blocking gtag

**Events not showing?**
1. Check event names match GA4 configuration
2. Verify custom event parameters
3. Wait 24-48 hours for data to appear in GA4

### 10. Next Steps

1. Set up your GA4 property and get your Measurement ID
2. Add the ID to your environment variables
3. Deploy and test the tracking
4. Set up custom reports and goals in GA4
5. Consider adding more specific event tracking for your use case

## Support

For questions about analytics setup, refer to:
- [Google Analytics Help Center](https://support.google.com/analytics/)
- [GA4 Implementation Guide](https://developers.google.com/analytics/devguides/collection/ga4)
