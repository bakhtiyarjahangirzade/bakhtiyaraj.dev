/* Known layouts. `cards` tells the content script what one listing looks like on that site,
 * `ads` lists site-specific ad slots. Sites not listed here use the automatic card detector,
 * and any site can be taught a card selector from the popup or the element picker. */
(function (root) {
  'use strict';

  const PRESETS = [
    { name: 'Tap.az', match: /(^|\.)tap\.az$/, cards: '.products-i', ads: ['.banner', '[class*="banner-"]'] },
    { name: 'Turbo.az', match: /(^|\.)turbo\.az$/, cards: '.products-i', ads: ['.banner', '[class*="banner-"]'] },
    { name: 'Bina.az', match: /(^|\.)bina\.az$/, cards: '.items-i', ads: ['.banner', '[class*="banner-"]'] },
    { name: 'Lalafo', match: /(^|\.)lalafo\.(az|kg|rs|gr)$/, cards: 'article[class*="ad-tile"], [class*="AdTileHorizontal"], [class*="ad-tile-horizontal"]' },
    { name: 'Sahibinden', match: /(^|\.)sahibinden\.com$/, cards: 'tr.searchResultsItem, li.searchResultsGalleryItem', ads: ['tr.nativeAd', '.searchResultsPromoNative', '[id^="div-gpt-ad"]'] },
    { name: 'Arabam', match: /(^|\.)arabam\.com$/, cards: 'tr.listing-list-item, [class*="listing-item"]' },
    { name: 'Hepsiemlak', match: /(^|\.)hepsiemlak\.com$/, cards: 'li.listing-item, [class*="listing-item"]' },
    { name: 'Emlakjet', match: /(^|\.)emlakjet\.com$/, cards: '[data-id][class*="listing"], [class*="_listing_"]' },
    { name: 'Trendyol', match: /(^|\.)trendyol\.com$/, cards: '.p-card-wrppr, [class*="p-card-wrppr"]', ads: ['[class*="advertisement"]'] },
    { name: 'Hepsiburada', match: /(^|\.)hepsiburada\.com$/, cards: 'li[class*="productListContent"], [data-test-id="product-card"]' },
    { name: 'N11', match: /(^|\.)n11\.com$/, cards: 'li.column, .listView li' },
    { name: 'Letgo', match: /(^|\.)letgo\.com$/, cards: '[data-aut-id="itemBox"], li[data-aut-id]' },
    { name: 'OLX', match: /(^|\.)olx\.[a-z.]+$/, cards: '[data-cy="l-card"], [data-aut-id="itemBox"]' },
    { name: 'Avito', match: /(^|\.)avito\.ru$/, cards: '[data-marker="item"]', ads: ['[data-marker*="banner"]', '[class*="advert-banner"]'] },
    { name: 'Kolesa', match: /(^|\.)(kolesa|krisha)\.kz$/, cards: '.a-card, [data-id].a-list__item' },
    { name: 'eBay', match: /(^|\.)ebay\.[a-z.]+$/, cards: 'li.s-item, li.s-card, .srp-results > li' },
    { name: 'Amazon', match: /(^|\.)amazon\.[a-z.]+$/, cards: 'div[data-component-type="s-search-result"]', ads: ['.AdHolder', '[data-component-type="sp-sponsored-result"]', '[cel_widget_id*="adplacements"]', '#ape_Search_auto-header-desktop-search-atf_placement'] },
    { name: 'AliExpress', match: /(^|\.)aliexpress\.[a-z.]+$/, cards: '[class*="search-item-card-wrapper"], .search-card-item' },
    { name: 'Etsy', match: /(^|\.)etsy\.com$/, cards: 'li.wt-list-unstyled div.v2-listing-card, [data-listing-id]' },
    { name: 'Facebook Marketplace', match: /(^|\.)facebook\.com$/, cards: 'a[href*="/marketplace/item/"]' },
    { name: 'YouTube', match: /(^|\.)youtube\.com$/, cards: 'ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer, ytm-shorts-lockup-view-model', ads: ['ytd-ad-slot-renderer', 'ytd-in-feed-ad-layout-renderer', 'ytd-promoted-sparkles-web-renderer', '#masthead-ad', 'ytd-banner-promo-renderer'] },
    { name: 'Google', match: /(^|\.)google\.[a-z.]+$/, cards: '#search .g, #rso > div > div[data-hveid]', ads: ['#tads', '#bottomads', '#tvcap', '.commercial-unit-desktop-top', '.cu-container'] }
  ];

  /* Ad slots used across the web. Conservative on purpose: no bare "ad" class guesses. */
  const GENERIC_ADS = [
    'ins.adsbygoogle', '.adsbygoogle',
    '[id^="google_ads_iframe"]', '[id^="google_ads_"]', '[id^="div-gpt-ad"]', '[data-google-query-id]',
    'iframe[src*="doubleclick.net"]', 'iframe[src*="googlesyndication.com"]', 'iframe[src*="amazon-adsystem.com"]',
    'a[href*="doubleclick.net/"]', 'a[href*="googleadservices.com/"]',
    '[data-ad-slot]', '[data-ad-client]', 'amp-ad', 'amp-embed[type="taboola"]',
    '[id^="yandex_rtb"]', '[id^="adfox_"]', '[id^="adriver_"]',
    '[id^="taboola-"]', '.trc_related_container', '[id^="outbrain_widget"]', '.OUTBRAIN',
    '[aria-label="Advertisement"]', '[aria-label="Advertisements"]', '[aria-label="Reklam"]', '[aria-label="Реклама"]',
    '[id^="ad-banner"]', '[class^="ad-banner"]', '[class*=" ad-banner"]',
    '[id^="ad_banner"]', '[class^="adbanner"]', '[class*=" adbanner"]'
  ];

  function presetFor(host) {
    const h = String(host || '').toLowerCase();
    return PRESETS.find((p) => p.match.test(h)) || null;
  }

  root.SiteFilterPresets = { PRESETS, GENERIC_ADS, presetFor };
})(globalThis);
