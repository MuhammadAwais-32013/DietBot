import '../styles/globals.css';
import { AuthProvider } from '../context/AuthContext';
import Head from 'next/head';

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Head>
        <title>DiaBP Diet Consultant</title>
        <meta name="description" content="AI-powered personalized diet plans and health tracking" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#4F46E5" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Open Graph / Social Media Meta Tags */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://DiaBPai-consultant.com/" />
        <meta property="og:title" content="DiaBP Diet Consultant" />
        <meta property="og:description" content="AI-powered personalized diet plans and health tracking" />
        <meta property="og:image" content="https://DiaBP-consultant.com/og-image.jpg" />
        
        {/* Twitter Card data */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="DiaBP Diet Consultant" />
        <meta name="twitter:description" content="AI-powered personalized diet plans and health tracking" />
        <meta name="twitter:image" content="https://DiaBP-consultant.com/twitter-image.jpg" />
        
        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp; 