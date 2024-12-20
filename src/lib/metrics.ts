export interface PageMetrics {
  ttfb: number;
  fcp: number;
  domLoad: number;
  windowLoad: number;
  resources: number;
  ga4Events: {
    pageView?: number;
    viewItem?: number;
  };
}

export interface StoreMetrics {
  homepage: PageMetrics | null;
  productPage: PageMetrics | null;
}

export const isValidShopifyUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    return (
      parsedUrl.protocol === "https:" &&
      !parsedUrl.pathname.includes("/products/") &&
      !parsedUrl.hostname.includes("myshopify.com")
    );
  } catch {
    return false;
  }
};

export const formatTime = (seconds: number): string => {
  return `${seconds.toFixed(2)}s`;
};

export const mockFetchMetrics = async (url: string): Promise<StoreMetrics> => {
  // This is a mock implementation. In a real app, you'd use Selenium or similar
  await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate network delay

  return {
    homepage: {
      ttfb: 0.342,
      fcp: 0.891,
      domLoad: 1.234,
      windowLoad: 2.456,
      resources: 45,
      ga4Events: {
        pageView: 0.567,
      },
    },
    productPage: {
      ttfb: 0.298,
      fcp: 0.765,
      domLoad: 1.123,
      windowLoad: 2.234,
      resources: 38,
      ga4Events: {
        pageView: 0.456,
        viewItem: 0.789,
      },
    },
  };
};