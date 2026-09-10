'use strict';

// Analytics is loaded only after a visitor explicitly chooses "Allow analytics".
const analyticsConsentKey = 'babybaby-analytics-consent';
const analyticsMeasurementId = 'G-BDWN0QQHB5';

function loadAnalytics() {
  if (window.babyBabyAnalyticsLoaded) return;
  window.babyBabyAnalyticsLoaded = true;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${analyticsMeasurementId}`;
  script.addEventListener('load', () => {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', analyticsMeasurementId);
  });
  document.head.append(script);
}

function createConsentBanner() {
  const banner = document.createElement('aside');
  banner.className = 'analytics-consent';
  banner.setAttribute('aria-label', 'Website analytics preferences');
  banner.innerHTML = `
    <p>We’d like to use analytics to understand how our website is used. You can say no and still use every part of the site.</p>
    <div class="analytics-consent-actions">
      <button type="button" class="analytics-consent-decline">No thanks</button>
      <button type="button" class="analytics-consent-accept">Allow analytics</button>
    </div>
    <a href="privacy.html">Privacy details</a>`;

  banner.querySelector('.analytics-consent-decline').addEventListener('click', () => {
    localStorage.setItem(analyticsConsentKey, 'denied');
    banner.remove();
  });
  banner.querySelector('.analytics-consent-accept').addEventListener('click', () => {
    localStorage.setItem(analyticsConsentKey, 'granted');
    loadAnalytics();
    banner.remove();
  });
  document.body.append(banner);
}

const analyticsConsent = localStorage.getItem(analyticsConsentKey);
if (analyticsConsent === 'granted') {
  loadAnalytics();
} else if (analyticsConsent !== 'denied') {
  createConsentBanner();
}
