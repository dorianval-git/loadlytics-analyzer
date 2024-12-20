import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { isValidShopifyUrl } from "@/lib/metrics";

interface UrlInputProps {
  onAnalyze: (url: string) => void;
  isLoading: boolean;
}

export const UrlInput = ({ onAnalyze, isLoading }: UrlInputProps) => {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      setError("Please enter a URL");
      return;
    }
    if (!isValidShopifyUrl(url)) {
      setError("Please enter a valid Shopify store URL");
      return;
    }
    setError("");
    onAnalyze(url);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <Input
          type="url"
          placeholder="Enter Shopify store URL (e.g., https://store.com)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="font-mono"
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Analyzing..." : "Analyze"}
        </Button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </form>
  );
};