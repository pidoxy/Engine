import "@/styles/globals.css";
import { Poppins } from "next/font/google";
import { AppProvider } from '@/context/AppContext';
import AnalyticsProvider from '@/components/Analytics/AnalyticsProvider';
import Script from 'next/script';

const poppins = Poppins({
  weight: ["300", "400", "500", "600"],
  subsets: ["latin"],
});

export default function App({ Component, pageProps }) {
  return (
    <AppProvider>
      <AnalyticsProvider>
        {/* Google Analytics (client-side) */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="gtag-init" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                anonymize_ip: true,
                allow_google_signals: false,
                allow_ad_personalization_signals: false,
              });
            `}</Script>
          </>
        )}
        <style jsx global>{`
          :root {
            --poppins: ${poppins.style.fontFamily};
          }
        `}</style>
        <Component {...pageProps} />
      </AnalyticsProvider>
    </AppProvider>
  );
}