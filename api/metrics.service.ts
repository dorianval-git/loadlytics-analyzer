import * as puppeteer from 'puppeteer';
import type { StoreMetrics, PageMetrics, GA4Event } from '../src/lib/metrics.ts';
import type { Browser } from 'puppeteer';

export async function analyzeStore(url: string): Promise<StoreMetrics> {
  console.log(`[Analysis] Starting full analysis for URL: ${url}`);
  
  let browser: Browser | undefined;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
        '--no-zygote',
        '--window-size=1920,1080',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ],
      timeout: 30000,
      ignoreHTTPSErrors: true
    }).catch(error => {
      console.error('[Browser] Failed to launch browser:', error);
      throw new Error(`Browser launch failed: ${error.message}`);
    });
    
    console.log('[Browser] Browser launched successfully');
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Setup network interception for GA4
    const ga4Events: GA4Event[] = [];
    let navigationStart: number;

    // Capture navigation start time
    page.on('domcontentloaded', () => {
      navigationStart = Date.now();
    });
    
    await page.setRequestInterception(true);
    
    page.on('request', async (request: puppeteer.HTTPRequest) => {
      try {
        const url = request.url();
        if (url.includes('google-analytics.com/g/collect') || 
            url.includes('analytics.google.com')) {
          console.log('[GA4] Intercepted analytics request:', url);
          const params = new URLSearchParams(url.split('?')[1]);
          const currentTime = Date.now();
          ga4Events.push({
            time: currentTime / 1000,
            measurementId: params.get('tid') || params.get('measurement_id') || '',
            url: params.get('dl') || '',
            parameters: Object.fromEntries(params.entries()),
            timeFromPageLoad: (currentTime - navigationStart) / 1000
          });
          console.log('[GA4] Event captured:', ga4Events[ga4Events.length - 1]);
        }
        await request.continue().catch(console.error);
      } catch (error) {
        console.error('[Network] Request handling error:', error);
        await request.continue().catch(console.error);
      }
    });

    // Add page console logging
    page.on('console', (msg: puppeteer.ConsoleMessage) => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') {
        console.error('[Browser Console Error]', text);
      } else {
        console.log('[Browser Console]', text);
      }
    });

    // Add early cleanup
    process.on('SIGINT', () => {
      if (browser) {
        console.log('[Browser] Cleaning up browser instance');
        browser.close().catch(console.error);
      }
    });

    // Analyze homepage with timeout
    console.log('[Analysis] Starting homepage analysis...');
    const HOMEPAGE_TIMEOUT = 25000;
    const homepage = await Promise.race([
      analyzeUrl(page, url, ga4Events),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Homepage analysis timeout')), HOMEPAGE_TIMEOUT)
      )
    ]);
    console.log('[Analysis] Homepage analysis complete:', homepage);
    
    // Find and analyze product page
    console.log('[Analysis] Looking for product page...');
    let productPage: PageMetrics | null = null;
    try {
      const productLink = await page.$eval('a[href*="/products/"]', 
        (el: HTMLAnchorElement) => el.href
      );
      console.log(`[Products] Found product link: ${productLink}`);
      const PRODUCT_PAGE_TIMEOUT = 20000;
      productPage = await Promise.race([
        analyzeUrl(page, productLink, ga4Events),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Product page analysis timeout')), PRODUCT_PAGE_TIMEOUT)
        )
      ]);
      console.log('[Products] Product page analysis complete:', productPage);
    } catch (error) {
      console.log('[Products] No product page found or analysis failed:', error instanceof Error ? error.message : String(error));
    }

    return { homepage, productPage };
  } catch (error) {
    console.error('[Analysis] Analysis failed:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close().catch(console.error);
    }
  }
}

async function analyzeUrl(page: puppeteer.Page, url: string, ga4Events: GA4Event[]): Promise<PageMetrics> {
  console.log(`[Page Analysis] Starting analysis for URL: ${url}`);
  
  try {
    // Navigate to page and wait for load
    console.log('[Navigation] Loading page...');
    const PAGE_NAVIGATION_TIMEOUT = 15000;
    const response = await page.goto(url, { 
      waitUntil: ['networkidle0', 'domcontentloaded'],
      timeout: PAGE_NAVIGATION_TIMEOUT
    });
    
    if (!response) {
      throw new Error('Navigation failed - no response received');
    }
    
    console.log(`[Navigation] Page loaded with status: ${response.status()}`);

    // Wait for network to be relatively idle
    await page.waitForTimeout(3000);

    // Check for consent mode configuration with retry
    let consentMode;
    for (let i = 0; i < 3; i++) {
      consentMode = await page.evaluate(() => {
        try {
          // @ts-ignore
          const googleTagData = window?.google_tag_data;
          console.log('google_tag_data:', JSON.stringify(googleTagData, null, 2));
          
          if (!googleTagData?.ics) {
            console.log('No consent data found, attempt:', i + 1);
            return { isConfigured: false };
          }

          const entries = googleTagData.ics.entries;
          const settings: Record<string, unknown> = {};
          
          if (entries instanceof Map) {
            entries.forEach((value, key) => {
              settings[key] = value;
            });
          } else if (typeof entries === 'object') {
            Object.assign(settings, entries);
          }
          
          console.log('Consent settings:', JSON.stringify(settings, null, 2));

          const hasConfiguration = Object.values(settings).some(setting => {
            if (!setting || typeof setting !== 'object') return false;
            return Object.keys(setting).some(key => 
              key === 'update' || key === 'default'
            );
          });

          return {
            isConfigured: hasConfiguration,
            settings
          };
        } catch (error) {
          console.error('Error checking consent:', error);
          return null;
        }
      });

      if (consentMode) break;
      await page.waitForTimeout(1000);
    }

    // Rest of the metrics collection...
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      const fcp = paint.find(entry => entry.name === 'first-contentful-paint');
      
      return {
        ttfb: navigation.responseStart,
        fcp: fcp?.startTime || 0,
        domLoad: navigation.domContentLoadedEventEnd,
        windowLoad: navigation.loadEventEnd
      };
    });

    // Fix URL matching for GA4 events
    const normalizedPageUrl = new URL(url).pathname;
    const urlEvents = ga4Events.filter(event => {
      try {
        const eventUrl = new URL(event.parameters.dl || '').pathname;
        return eventUrl === normalizedPageUrl;
      } catch {
        return false;
      }
    });

    // Check for Elevar configuration
    console.log('[Elevar] Starting Elevar configuration detection...');
    const elevarConfig = await checkForElevarConfig(page);

    if (elevarConfig) {
      console.log('[Elevar] Configuration successfully detected and parsed');
    } else {
      console.log('[Elevar] No valid configuration found');
    }

    return {
      url,
      ttfb: performanceMetrics.ttfb / 1000,
      fcp: performanceMetrics.fcp / 1000,
      domLoad: performanceMetrics.domLoad / 1000,
      windowLoad: performanceMetrics.windowLoad / 1000,
      resources: 0,
      ga4Events: {
        pageView: urlEvents.find(e => e.parameters.en === 'page_view'),
        viewItem: urlEvents.find(e => e.parameters.en === 'view_item')
      },
      allGA4Events: urlEvents,
      consentMode: consentMode || { isConfigured: false },
      elevar: elevarConfig ? {
        isConfigured: true,
        shopUrl: elevarConfig.shop_url,
        gtmContainer: elevarConfig.market_groups?.[0]?.gtm_container,
        consentEnabled: elevarConfig.consent_enabled,
        eventConfig: elevarConfig.event_config
      } : {
        isConfigured: false
      }
    };
  } catch (error) {
    console.error(`[Page Analysis] Failed to analyze ${url}:`, error);
    throw error;
  }
}

async function checkForElevarConfig(page: puppeteer.Page, maxAttempts = 5): Promise<any> {
  console.log('[Elevar] Starting search for configuration...');
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`[Elevar] Attempt ${attempt}/${maxAttempts} to find configuration...`);
    
    try {
      // Check network requests
      const requests = await page.evaluate(() => {
        // @ts-ignore
        return performance.getEntriesByType('resource')
          .filter(entry => 
            entry.name.includes('elevar') && 
            (entry.name.includes('config.js') || entry.name.includes('configs'))
          )
          .map(entry => entry.name);
      });

      if (requests.length > 0) {
        console.log('[Elevar] Found potential config URLs:', requests);
        
        for (const url of requests) {
          console.log(`[Elevar] Attempting to fetch config from: ${url}`);
          try {
            const response = await fetch(url);
            const configText = await response.text();
            
            if (configText.includes('export default') || configText.includes('"signing_key"')) {
              try {
                let jsonStr = configText;
                if (configText.includes('export default')) {
                  jsonStr = configText.replace('export default', '').trim();
                  if (jsonStr.endsWith(';')) {
                    jsonStr = jsonStr.slice(0, -1);
                  }
                }
                
                const config = JSON.parse(jsonStr);
                return config;
              } catch (e) {
                console.error('[Elevar] Failed to parse JSON:', e);
                const errorPosition = (e as any).position || 1202;
                console.log('[Elevar] Problem area:', jsonStr.substring(errorPosition - 20, errorPosition + 20));
              }
            }
          } catch (e) {
            console.error(`[Elevar] Error fetching ${url}:`, e);
          }
        }
      } else {
        console.log('[Elevar] No configuration URLs found in this attempt');
      }

      await page.waitForTimeout(1000);
    } catch (error) {
      console.error('[Elevar] Error during configuration check:', error);
    }
  }

  console.log('[Elevar] Failed to find configuration after all attempts');
  return null;
} 