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
    window.gtag('config', gaId);
    window.gaInitialized = true;
    console.log("GA4 inicializado con ID:", gaId);
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
    console.log("Meta Pixel inicializado con ID:", pixelId);
  }
}
