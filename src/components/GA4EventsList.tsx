import { GA4Event } from "@/lib/metrics";
import { Button } from "./ui/button";
import { useState } from "react";
import { GA4EventDetails } from "./GA4EventDetails";

interface GA4EventsListProps {
  events: GA4Event[];
}

export const GA4EventsList = ({ events }: GA4EventsListProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (events.length === 0) return null;

  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        className="w-full"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? "Hide" : "Show"} All GA4 Events ({events.length})
      </Button>

      {isExpanded && (
        <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
          {events.map((event, index) => (
            <GA4EventDetails
              key={index}
              event={event}
              eventName={event.parameters.event_name || "Unknown Event"}
            />
          ))}
        </div>
      )}
    </div>
  );
};