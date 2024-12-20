export interface GA4Event {
  time: number;
  measurementId: string;
  url: string;
  parameters: Record<string, string>;
}

export interface GA4Events {
  pageView?: GA4Event;
  viewItem?: GA4Event;
}

export interface PageMetrics {
  ttfb: number;
  fcp: number;
  domLoad: number;
  windowLoad: number;
  resources: number;
  ga4Events: GA4Events;
  allGA4Events: GA4Event[];
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
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return {
    homepage: {
      ttfb: 0.342,
      fcp: 0.891,
      domLoad: 1.234,
      windowLoad: 2.456,
      resources: 45,
      ga4Events: {
        pageView: {
          time: 0.567,
          measurementId: "G-D62M79ZZEG",
          url: "https://alohas.com/",
          parameters: {
            event_name: "page_view",
            page_title: "ALOHAS | On-demand Fashion",
            page_location: "https://alohas.com/",
            visitor_type: "guest",
            language: "en-gb",
            screen_resolution: "1512x982",
            client_id: "70765470.1734709897",
            engagement_time_msec: "4569",
            session_id: "1734709896",
            session_number: "1"
          }
        }
      },
      allGA4Events: [
        {
          time: 0.567,
          measurementId: "G-D62M79ZZEG",
          url: "https://alohas.com/",
          parameters: {
            event_name: "page_view",
            page_title: "ALOHAS | On-demand Fashion",
            page_location: "https://alohas.com/",
            visitor_type: "guest",
            language: "en-gb",
            screen_resolution: "1512x982",
            client_id: "70765470.1734709897",
            engagement_time_msec: "4569",
            session_id: "1734709896",
            session_number: "1"
          }
        },
        {
          time: 1.234,
          measurementId: "G-D62M79ZZEG",
          url: "https://alohas.com/",
          parameters: {
            event_name: "user_engagement",
            engagement_time_msec: "1234",
            page_location: "https://alohas.com/",
            visitor_type: "guest"
          }
        }
      ]
    },
    productPage: {
      ttfb: 0.298,
      fcp: 0.765,
      domLoad: 1.123,
      windowLoad: 2.234,
      resources: 38,
      ga4Events: {
        pageView: {
          time: 0.456,
          measurementId: "G-D62M79ZZEG",
          url: "https://alohas.com/products/tb-490-rife-shimmer-silver-cream-leather-sneakers",
          parameters: {
            event_name: "page_view",
            page_title: "Tb.490 Rife Shimmer Silver Cream Leather Sneakers | ALOHAS",
            page_location: "https://alohas.com/products/tb-490-rife-shimmer-silver-cream-leather-sneakers",
            visitor_type: "guest",
            language: "en-gb",
            screen_resolution: "1512x982",
            client_id: "70765470.1734709897",
            engagement_time_msec: "4797",
            session_id: "1734709896",
            session_number: "1"
          }
        },
        viewItem: {
          time: 0.789,
          measurementId: "G-D62M79ZZEG",
          url: "https://alohas.com/products/tb-490-rife-shimmer-silver-cream-leather-sneakers",
          parameters: {
            event_name: "view_item",
            item_name: "Tb.490 Rife Shimmer Silver Cream Leather Sneakers",
            item_brand: "ALOHAS",
            item_category: "Sneakers",
            price: "863.00",
            currency: "RON",
            item_variant_id: "46966090694992",
            item_product_id: "8596796539216",
            item_list_name: "",
            product_category: "Sneakers",
            gtm_tag: "GA4 - Item View"
          }
        }
      },
      allGA4Events: [
        {
          time: 0.456,
          measurementId: "G-D62M79ZZEG",
          url: "https://alohas.com/products/tb-490-rife-shimmer-silver-cream-leather-sneakers",
          parameters: {
            event_name: "page_view",
            page_title: "Tb.490 Rife Shimmer Silver Cream Leather Sneakers | ALOHAS",
            page_location: "https://alohas.com/products/tb-490-rife-shimmer-silver-cream-leather-sneakers",
            visitor_type: "guest",
            language: "en-gb",
            screen_resolution: "1512x982",
            client_id: "70765470.1734709897",
            engagement_time_msec: "4797",
            session_id: "1734709896",
            session_number: "1"
          }
        },
        {
          time: 0.789,
          measurementId: "G-D62M79ZZEG",
          url: "https://alohas.com/products/tb-490-rife-shimmer-silver-cream-leather-sneakers",
          parameters: {
            event_name: "view_item",
            item_name: "Tb.490 Rife Shimmer Silver Cream Leather Sneakers",
            item_brand: "ALOHAS",
            item_category: "Sneakers",
            price: "863.00",
            currency: "RON",
            item_variant_id: "46966090694992",
            item_product_id: "8596796539216",
            item_list_name: "",
            product_category: "Sneakers",
            gtm_tag: "GA4 - Item View"
          }
        },
        {
          time: 1.123,
          measurementId: "G-D62M79ZZEG",
          url: "https://alohas.com/products/tb-490-rife-shimmer-silver-cream-leather-sneakers",
          parameters: {
            event_name: "user_engagement",
            engagement_time_msec: "1123",
            page_location: "https://alohas.com/products/tb-490-rife-shimmer-silver-cream-leather-sneakers",
            visitor_type: "guest"
          }
        }
      ]
    }
  };
};