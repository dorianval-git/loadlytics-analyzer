import { API_BASE_URL } from './config';

export interface GA4Event {
  time: number;
  measurementId: string;
  url: string;
  parameters: Record<string, string>;
  timeFromPageLoad: number;
}

export interface PageMetrics {
  url: string;
  ttfb: number;
  fcp: number;
  domLoad: number;
  windowLoad: number;
  resources: number;
  ga4Events: {
    pageView?: GA4Event;
    viewItem?: GA4Event;
  };
  allGA4Events: GA4Event[];
  consentMode: {
    isConfigured: boolean;
    settings?: Record<string, any>;
  };
  elevar: {
    isConfigured: boolean;
    shopUrl?: string;
    gtmContainer?: string;
    consentEnabled?: boolean;
    eventConfig?: Record<string, boolean>;
  };
}

export interface StoreMetrics {
  homepage: PageMetrics;
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
    
    // Add request debugging
    const requestOptions = {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ url })
    };
    
    console.log('[Metrics] Request options:', requestOptions);
    
    const response = await fetch(`${API_BASE_URL}/index`, requestOptions);
    console.log('[Metrics] Response status:', response.status);
    console.log('[Metrics] Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let errorMessage = '';
      
      try {
        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          console.log('[Metrics] Error response data:', errorData);
          errorMessage = errorData.details || errorData.error || `HTTP error! status: ${response.status}`;
        } else {
          errorMessage = await response.text();
          console.log('[Metrics] Error response text:', errorMessage);
        }
      } catch (parseError) {
        console.error('[Metrics] Error parsing response:', parseError);
        errorMessage = `Failed to parse error response (${response.status})`;
      }

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
    throw error;
  }
};
