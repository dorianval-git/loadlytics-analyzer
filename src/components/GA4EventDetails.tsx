import { GA4Event } from "@/lib/metrics";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { formatTime } from "@/lib/metrics";

interface GA4EventDetailsProps {
  event: GA4Event;
  eventName: string;
}

export const GA4EventDetails = ({ event, eventName }: GA4EventDetailsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="space-y-2">
      <div
        className="flex items-center justify-between cursor-pointer hover:bg-gray-50 py-1"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <div className="text-sm text-gray-600">{eventName}</div>
          <div className="text-sm font-mono text-right">
            {formatTime(event.time)}
          </div>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-gray-500 transition-transform ${
            isExpanded ? "transform rotate-180" : ""
          }`}
        />
      </div>

      {isExpanded && (
        <div className="pl-4 space-y-2 text-sm animate-in slide-in-from-top-1 duration-200">
          <div className="text-xs font-mono text-gray-500">
            Measurement ID: {event.measurementId}
          </div>
          <div className="text-xs font-mono text-gray-500 break-all">
            URL: {event.url}
          </div>
          <div className="space-y-1">
            <div className="text-xs font-semibold text-gray-600">Parameters:</div>
            {Object.entries(event.parameters).map(([key, value]) => (
              <div key={key} className="grid grid-cols-2 text-xs font-mono">
                <span className="text-gray-500">{key}:</span>
                <span className="text-gray-700">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};