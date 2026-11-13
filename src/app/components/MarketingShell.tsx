'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import FloatingController from '@/components/premium/FloatingController';
import GrainOverlay from '@/components/premium/GrainOverlay';
import SmoothScroll from '@/components/premium/SmoothScroll';

export default function MarketingShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  useEffect(() => {
    // Hide or clean up third-party chatbot/WhatsApp widgets if user navigated from a marketing page to /admin
    if (isAdmin) {
      document.body.classList.add('admin-mode');
      const botElements = document.querySelectorAll(
        '[id*="kenyt"], [class*="kenyt"], iframe[src*="kenyt"], [id*="whatsapp"], [class*="whatsapp"]'
      );
      botElements.forEach((el) => {
        (el as HTMLElement).style.display = 'none';
      });
    } else {
      document.body.classList.remove('admin-mode');
      const botElements = document.querySelectorAll(
        '[id*="kenyt"], [class*="kenyt"], iframe[src*="kenyt"]'
      );
      botElements.forEach((el) => {
        (el as HTMLElement).style.display = '';
      });
    }
  }, [isAdmin]);

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <FloatingController />
      <GrainOverlay />
      <SmoothScroll>{children}</SmoothScroll>

      {/* Kenyt AI Chatbot & WhatsApp Widget - Marketing pages only */}
      <Script
        src="https://india.kenyt.ai/botapp/ChatbotUI/dist/js/bot-loader.js"
        strategy="lazyOnload"
        data-bot="116027152"
      />
    </>
  );
}

