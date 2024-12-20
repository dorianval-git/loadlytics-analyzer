import { useState } from "react";
import { UrlInput } from "@/components/UrlInput";
import { MetricsTable } from "@/components/MetricsTable";
import { StoreMetrics, mockFetchMetrics } from "@/lib/metrics";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [metrics, setMetrics] = useState<StoreMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAnalyze = async (url: string) => {
    setIsLoading(true);
    setMetrics(null); // Clear previous data
    try {
      const results = await mockFetchMetrics(url);
      setMetrics(results);
      toast({
        title: "Using Mock Data",
        description: "This is currently using mock data for demonstration purposes. In a production environment, this would fetch real GA4 data.",
        variant: "default",
        duration: 5000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to analyze the store. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container max-w-4xl py-12 space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Shopify Store Performance Analyzer
          </h1>
          <p className="text-sm text-gray-500">
            Enter a Shopify store URL to analyze its performance metrics
          </p>
          <div className="text-xs bg-yellow-50 border border-yellow-200 rounded-md p-2 text-yellow-700">
            Note: Currently using mock data for demonstration. Real implementation would fetch actual GA4 data.
          </div>
        </div>

        <UrlInput onAnalyze={handleAnalyze} isLoading={isLoading} />

        {metrics && (
          <div className="grid gap-6 animate-in fade-in-50 duration-500">
            <MetricsTable title="Homepage" metrics={metrics.homepage} />
            <MetricsTable title="Product Page" metrics={metrics.productPage} />
          </div>
        )}

        {isLoading && (
          <div className="space-y-6">
            <div className="h-[300px] bg-white rounded-lg shadow-sm animate-pulse" />
            <div className="h-[300px] bg-white rounded-lg shadow-sm animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;