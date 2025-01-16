import { API_BASE_URL } from './config';

export interface GA4Event {
  time: number;
  measurementId: string;
  url: string;
  parameters: Record<string, string>;
  timeFromPageLoad: number;
}

export interface GA4Events {
  pageView?: GA4Event;
  viewItem?: GA4Event;
}

export interface ConsentModeConfig {
  isConfigured: boolean;
  settings?: {
    ad_storage?: { implicit?: boolean; update?: boolean; default?: boolean };
    analytics_storage?: { implicit?: boolean; update?: boolean; default?: boolean };
    ad_user_data?: { implicit?: boolean; update?: boolean; default?: boolean };
    ad_personalization?: { implicit?: boolean; update?: boolean; default?: boolean };
    functionality_storage?: { implicit?: boolean; update?: boolean; default?: boolean };
    personalization_storage?: { implicit?: boolean; update?: boolean; default?: boolean };
    security_storage?: { implicit?: boolean; update?: boolean; default?: boolean };
    region?: { implicit?: boolean; update?: boolean; default?: boolean };
  };
}

export interface ElevarEventConfig {
  cart_reconcile: boolean;
  cart_view: boolean;
  checkout_complete: boolean;
  collection_view: boolean;
  product_add_to_cart: boolean;
  product_add_to_cart_ajax: boolean;
  product_remove_from_cart: boolean;
  product_select: boolean;
  product_view: boolean;
  search_results_view: boolean;
  user: boolean;
  save_order_notes: boolean;
}

export interface ElevarConfig {
  isConfigured: boolean;
  shopUrl?: string;
  gtmContainer?: string;
  consentEnabled?: boolean;
  eventConfig?: ElevarEventConfig;
}

export interface GTMConfig {
  isConfigured: boolean;
  containerId?: string;
  loadTime?: number;
  scriptUrl?: string;
  status?: number;
}

export interface PageMetrics {
  url: string;
  ttfb: number;
  fcp: number;
  domLoad: number;
  windowLoad: number;
  resources: number;
  ga4Events: GA4Events;
  allGA4Events: GA4Event[];
  consentMode: ConsentModeConfig;
  elevar: ElevarConfig;
  gtm: GTMConfig;
}

export interface StoreMetrics {
  homepage: PageMetrics | null;
  productPage: PageMetrics | null;
}

export const isValidShopifyUrl = (url: string): boolean => {
  try {
    // Remove any leading/trailing whitespace
    let cleanUrl = url.trim();
    
    // Add https:// if no protocol is specified
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }
    
    // Remove www. if present
    cleanUrl = cleanUrl.replace('www.', '');
    
    const parsedUrl = new URL(cleanUrl);
    return (
      !parsedUrl.pathname.includes("/products/") &&
      !parsedUrl.hostname.includes("myshopify.com")
    );
  } catch {
    return false;
  }
};

export const normalizeUrl = (url: string): string => {
  let cleanUrl = url.trim();
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = 'https://' + cleanUrl;
  }
  return cleanUrl.replace('www.', '');
};

export const formatTime = (seconds: number): string => {
  return `${seconds.toFixed(2)}s`;
};

export const fetchMetrics = async (url: string, onStageChange: (stage: number) => void) => {
  console.log('[Metrics] Starting analysis for URL:', url);
  console.log('[Metrics] Using API endpoint:', `${API_BASE_URL}/index`);
  
  try {
    onStageChange(0);
    const response = await fetch(`${API_BASE_URL}/index`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ url })
    });

    console.log('[Metrics] Response status:', response.status);
    
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let errorMessage = '';
      
      try {
        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.details || errorData.error || `HTTP error! status: ${response.status}`;
        } else {
          errorMessage = await response.text();
        }
      } catch (parseError) {
        console.error('[Metrics] Error parsing response:', parseError);
        errorMessage = `Failed to parse error response (${response.status})`;
      }

      console.error('[Metrics] API error:', errorMessage);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('[Metrics] Analysis data received:', data);

    if (!data) {
      throw new Error('No data received from analysis');
    }

    if (data.homepage) onStageChange(1);
    if (data.homepage?.performance) onStageChange(2);
    if (data.productPage) onStageChange(3);
    onStageChange(4);
    
    return data;
  } catch (error: any) {
    console.error('[Metrics] Failed to fetch metrics:', error);
    throw new Error(error.message || 'Failed to analyze the store');
  }
};
