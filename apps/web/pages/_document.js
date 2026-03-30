import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Favicons */}
        <link rel="icon" href="/favicon.ico" sizes="16x16 32x32" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/svg+xml" href="/logo.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/logo.svg" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="msapplication-TileColor" content="#5865F2" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        {/* SEO basics */}
        <meta name="theme-color" content="#5865F2" />
        <meta name="format-detection" content="telephone=no" />
        <meta httpEquiv="x-dns-prefetch-control" content="on" />
        {/* Performance hints (adjust hosts to your env) */}
        {process.env.NEXT_PUBLIC_API_URL && (
          <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_URL} crossOrigin="anonymous" />
        )}
        {process.env.NEXT_PUBLIC_API_ENGINE_URL && (
          <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_ENGINE_URL} crossOrigin="anonymous" />
        )}
        {process.env.NEXT_PUBLIC_WEBSOCKET_URL && (
          <link rel="preconnect" href={process.env.NEXT_PUBLIC_WEBSOCKET_URL.replace(/^ws(s)?:/, 'https:')} crossOrigin="anonymous" />
        )}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
