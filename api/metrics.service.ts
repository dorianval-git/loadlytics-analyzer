import puppeteer from 'puppeteer';
import type { StoreMetrics, PageMetrics, GA4Event } from '../lib/metrics';

export async function analyzeStore(url: string): Promise<StoreMetrics> {
  console.log(`[Analysis] Starting full analysis for URL: ${url}`);
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1920,1080',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ],
      timeout: 60000
    }).catch(error => {
      console.error('[Browser] Failed to launch browser:', error);
      throw new Error(`Browser launch failed: ${error.message}`);
    });
    
    console.log('[Browser] Browser launched successfully');
    const context = await browser.createIncognitoBrowserContext();
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
    
    page.on('request', async request => {
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
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') {
        console.error('[Browser Console Error]', text);
      } else {
        console.log('[Browser Console]', text);
      }
    });

    // Analyze homepage with timeout
    console.log('[Analysis] Starting homepage analysis...');
    const homepage = await Promise.race([
      analyzeUrl(page, url, ga4Events),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Homepage analysis timeout')), 60000))
    ]);
    console.log('[Analysis] Homepage analysis complete:', homepage);
    
    // Find and analyze product page
    console.log('[Analysis] Looking for product page...');
    let productPage = null;
    try {
      const productLink = await page.$eval('a[href*="/products/"]', (el) => el.href);
      console.log(`[Products] Found product link: ${productLink}`);
      productPage = await Promise.race([
        analyzeUrl(page, productLink, ga4Events),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Product page analysis timeout')), 30000))
      ]);
      console.log('[Products] Product page analysis complete:', productPage);
    } catch (error) {
      console.log('[Products] No product page found or analysis failed:', error.message);
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

async function analyzeUrl(page: any, url: string, ga4Events: GA4Event[]): Promise<PageMetrics> {
  console.log(`[Page Analysis] Starting analysis for URL: ${url}`);
  
  try {
    // Navigate to page and wait for load
    console.log('[Navigation] Loading page...');
    const response = await page.goto(url, { 
      waitUntil: ['networkidle0', 'domcontentloaded', 'load'],
      timeout: 45000
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
          const settings = {};
          
          if (entries instanceof Map) {
            entries.forEach((value, key) => {
              settings[key] = value;
            });
          } else if (typeof entries === 'object') {
            Object.assign(settings, entries);
          }
          
          console.log('Consent settings:', JSON.stringify(settings, null, 2));

          const hasConfiguration = Object.values(settings).some(setting => {
            if (typeof setting !== 'object') return false;
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

async function checkForElevarConfig(page: any, maxAttempts = 5): Promise<any> {
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
            if (!response.ok) {
              console.log(`[Elevar] Failed to fetch ${url}: ${response.status}`);
              continue;
            }

            const configText = await response.text();
            console.log('[Elevar] Successfully fetched configuration file');
            console.log('[Elevar] Config file size:', configText.length, 'bytes');

            if (configText.includes('export default') || configText.includes('"signing_key"')) {
              console.log('[Elevar] Valid configuration format detected');
              
              try {
                // Extract the JSON part from the config
                let jsonStr = configText;
                if (configText.includes('export default')) {
                  console.log('[Elevar] Converting export default format to JSON');
                  jsonStr = configText.replace('export default', '').trim();
                  
                  // Remove any trailing semicolon
                  if (jsonStr.endsWith(';')) {
                    jsonStr = jsonStr.slice(0, -1);
                  }
                }

                // Log the exact string we're trying to parse
                console.log('[Elevar] Attempting to parse:', jsonStr.substring(0, 100) + '...');

                const config = JSON.parse(jsonStr);
                console.log('[Elevar] Successfully parsed configuration');
                
                // Validate it's a real Elevar config
                if (config.signing_key && config.market_groups) {
                  console.log('\n[Elevar] Configuration Details:');
                  console.log('----------------------------------------');
                  console.log('Shop URL:', config.shop_url);
                  console.log('GTM Container:', config.market_groups?.[0]?.gtm_container);
                  console.log('Consent Enabled:', config.consent_enabled);
                  console.log('\nEvent Configuration:');
                  Object.entries(config.event_config || {}).forEach(([event, enabled]) => {
                    console.log(`  ${event.padEnd(25)}: ${enabled ? '✅' : '❌'}`);
                  });
                  console.log('----------------------------------------\n');
                  
                  return config;
                } else {
                  console.log('[Elevar] Invalid configuration format - missing required fields');
                }
              } catch (e) {
                console.error('[Elevar] Failed to parse JSON:', e);
                // Log the problematic part of the string
                const errorPosition = (e as any).position || 1202;
                console.log('[Elevar] Problem area:', jsonStr.substring(errorPosition - 20, errorPosition + 20));
              }
            } else {
              console.log('[Elevar] Invalid file format - not a configuration file');
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