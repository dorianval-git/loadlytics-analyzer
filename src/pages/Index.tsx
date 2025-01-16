import { useState } from "react";
import { UrlInput } from "@/components/UrlInput";
import { MetricsTable } from "@/components/MetricsTable";
import { StoreMetrics, fetchMetrics } from "@/lib/metrics";
import { useToast } from "@/hooks/use-toast";
import { AnalysisProgress, AnalysisStage } from "@/components/AnalysisProgress";

const ANALYSIS_STAGES: AnalysisStage[] = [
  { label: "Launching browser", progress: 0 },
  { label: "Analyzing homepage", progress: 25 },
  { label: "Collecting GA4 events", progress: 50 },
  { label: "Finding product page", progress: 75 },
  { label: "Finalizing analysis", progress: 90 }
];

const Index = () => {
  const [metrics, setMetrics] = useState<StoreMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const { toast } = useToast();

  const handleAnalyze = async (url: string) => {
    setIsLoading(true);
    setMetrics(null);
    setCurrentStage(0);
    
    try {
      const results = await fetchMetrics(url, (stage) => {
        setCurrentStage(stage);
      });
      setMetrics(results);
      toast({
        title: "Analysis Complete",
        description: "Performance metrics and GA4 events have been collected.",
        variant: "default",
        duration: 5000,
      });
    } catch (error: any) {
      console.error('Analysis failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to analyze the store. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container max-w-6xl py-12 space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Shopify Store Performance Analyzer
          </h1>
          <p className="text-sm text-gray-500">
            Enter a Shopify store URL to analyze its performance metrics and GA4 events
          </p>
        </div>

        <UrlInput onAnalyze={handleAnalyze} isLoading={isLoading} />

        {isLoading && (
          <div className="space-y-6">
            <AnalysisProgress 
              stages={ANALYSIS_STAGES} 
              currentStage={currentStage} 
            />
            <div className="h-[100px] bg-white rounded-lg shadow-sm animate-pulse" />
          </div>
        )}

        {metrics && (
          <div className="grid gap-6 animate-in fade-in-50 duration-500">
            <MetricsTable title="Homepage" metrics={metrics.homepage} />
            <MetricsTable title="Product Page" metrics={metrics.productPage} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;

