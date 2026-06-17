/**
 * analytics.js — Comprehensive conversion tracking for Querube
 * Integrates Google Analytics 4 and Meta Pixel with lazy loading.
 */

export function initAnalytics(gaId, pixelId) {
  if (!gaId && !pixelId) return;

  // 1. Google Analytics 4
  if (gaId && !window.gaInitialized) {
    const gaScript = document.createElement('script');
    gaScript.async = true;
    gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(gaScript);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function() { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', gaId, {
      'anonymize_ip': true,
      'allow_google_signals': false,
      'allow_ad_personalization_signals': false
    });
    window.gaInitialized = true;
  }

  // 2. Meta Pixel
  if (pixelId && !window.pixelInitialized) {
    /* eslint-disable */
    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = "2.0";
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    /* eslint-enable */
    window.fbq('init', pixelId);
    window.fbq('track', 'PageView');
    window.pixelInitialized = true;
  }
}

// ─── Conversion Event Tracking ───────────────────────────────────

/**
 * Generic track function — sends to both GA4 and Meta Pixel
 */
export function trackEvent(eventName, params = {}) {
  // GA4
  if (window.gtag) {
    window.gtag('event', eventName, params);
  }

  // Console in dev
  if (import.meta.env.DEV) {
    console.log(`[Analytics] ${eventName}`, params);
  }

  // Also expose on window for easy component access
  window.trackEvent = trackEvent;
}

/**
 * Track lot viewed — user opens LotDetails
 */
export function trackLotViewed(lotId, area, manzana, status) {
  trackEvent('lot_viewed', { lot_id: lotId, area, manzana, status });
  if (window.fbq) window.fbq('track', 'ViewContent', { content_name: `Lote ${lotId}`, content_category: 'lot' });
}

/**
 * Track tour started — drone flight begins
 */
export function trackTourStarted(mode) {
  trackEvent('tour_started', { mode });
  if (window.fbq) window.fbq('trackCustom', 'TourStarted', { mode });
}

/**
 * Track WhatsApp clicked — lead conversion
 */
export function trackWhatsAppClicked(lotId, qualifierAnswers = null) {
  trackEvent('whatsapp_clicked', { lot_id: lotId, qualifier: qualifierAnswers });
  if (window.fbq) window.fbq('track', 'Lead', { content_name: `Lote ${lotId}` });
}

/**
 * Track lot shared — social distribution
 */
export function trackLotShared(lotId, platform) {
  trackEvent('lot_shared', { lot_id: lotId, platform });
  if (window.fbq) window.fbq('trackCustom', 'LotShared', { lot_id: lotId, platform });
}

/**
 * Track ROI visualizer viewed
 */
export function trackRoiViewed(lotId, years) {
  trackEvent('roi_viewed', { lot_id: lotId, years });
}

/**
 * Track comparator usage
 */
export function trackComparatorUsed(lotIds) {
  trackEvent('comparator_used', { lot_ids: lotIds.join(',') });
}

/**
 * Track qualifier completed — pre-WhatsApp funnel step
 */
export function trackQualifierCompleted(lotId, answers) {
  trackEvent('qualifier_completed', { lot_id: lotId, ...answers });
  if (window.fbq) window.fbq('track', 'InitiateCheckout', { content_name: `Lote ${lotId}` });
}

/**
 * Track hero landing CTA click
 */
export function trackHeroCtaClicked() {
  trackEvent('hero_cta_clicked', {});
}

// Initialize global trackEvent accessor
window.trackEvent = trackEvent;
