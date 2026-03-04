"use client";

import Script from 'next/script';
import { useEffect, useState, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-XXXXXXXXXX';
export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID || 'XXXXXXXXXXXXXXXX';

export default function Analytics() {
    return (
        <Suspense fallback={null}>
            <AnalyticsContent />
        </Suspense>
    );
}

function AnalyticsContent() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [consentGranted, setConsentGranted] = useState(true);

    useEffect(() => {
        // Check initial consent. If rejected, we disable tracking.
        const consent = localStorage.getItem('cookie-consent');
        if (consent === 'rejected') {
            setConsentGranted(false);
        } else {
            setConsentGranted(true);
        }

        // Listen for changes
        const handleConsentChange = () => {
            const updatedConsent = localStorage.getItem('cookie-consent');
            setConsentGranted(updatedConsent !== 'rejected');
        };

        window.addEventListener('cookie-consent-changed', handleConsentChange);
        return () => window.removeEventListener('cookie-consent-changed', handleConsentChange);
    }, []);

    useEffect(() => {
        if (consentGranted && typeof window !== 'undefined') {
            const url = pathname + searchParams.toString();
            // @ts-ignore
            if (window.gtag) {
                // @ts-ignore
                window.gtag('config', GA_MEASUREMENT_ID, {
                    page_path: url,
                });
            }
            // @ts-ignore
            if (window.fbq) {
                // @ts-ignore
                window.fbq('track', 'PageView');
            }
        }
    }, [pathname, searchParams, consentGranted]);

    if (!consentGranted) return null;

    return (
        <>
            {/* Google Analytics */}
            <Script
                strategy="afterInteractive"
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            />
            <Script
                id="google-analytics"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
            });
          `,
                }}
            />

            {/* Meta Pixel */}
            <Script
                id="meta-pixel"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${FB_PIXEL_ID}');
            fbq('track', 'PageView');
          `,
                }}
            />
        </>
    );
}
