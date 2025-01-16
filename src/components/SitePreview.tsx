import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/config';

interface SitePreviewProps {
  url: string | null;
  label: string;
  isLoading?: boolean;
}

export const SitePreview = ({ url, label, isLoading }: SitePreviewProps) => {
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    if (!url) return;

    const fetchScreenshot = async () => {
      try {
        setError(null);
        setScreenshot(null);
        
        console.log(`[Preview] Requesting screenshot for: ${url} (attempt ${retryCount + 1}/${maxRetries})`);
        const response = await fetch(`${API_BASE_URL}/screenshot`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.details || `Screenshot failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('[Preview] Screenshot received');
        setScreenshot(data.screenshot);
        setRetryCount(0); // Reset retry count on success
      } catch (err: any) {
        console.error('[Preview] Screenshot error:', err);
        if (retryCount < maxRetries - 1) {
          setRetryCount(prev => prev + 1);
          console.log(`[Preview] Retrying... (${retryCount + 1}/${maxRetries})`);
        } else {
          setError(err.message);
        }
      }
    };

    fetchScreenshot();
  }, [url, retryCount]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">{label}</h3>
        <span className="text-xs text-gray-500">{url}</span>
      </div>
      <div className="relative bg-white rounded-lg shadow-sm overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 bg-gray-50/50 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        )}
        {error ? (
          <div className="w-full h-[400px] bg-red-50 flex items-center justify-center text-red-500 p-4 text-center">
            {error}
          </div>
        ) : url ? (
          screenshot ? (
            <img 
              src={`data:image/png;base64,${screenshot}`} 
              alt={`Screenshot of ${url}`}
              className="w-full h-[400px] object-contain"
            />
          ) : (
            <div className="w-full h-[400px] bg-gray-50 flex items-center justify-center">
              <div className="flex flex-col items-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <span className="text-sm text-gray-500">Capturing preview...</span>
              </div>
            </div>
          )
        ) : (
          <div className="w-full h-[400px] bg-gray-50 flex items-center justify-center text-gray-400">
            No URL loaded
          </div>
        )}
      </div>
    </div>
  );
}; 