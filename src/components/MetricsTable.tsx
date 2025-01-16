import { PageMetrics, GA4Event } from "@/lib/metrics";
import { Button } from "./ui/button";
import { ChevronDown, ChevronRight, ExternalLink, Activity, Globe, Clock, Zap, Shield, AlertTriangle } from "lucide-react";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { cn } from "@/lib/utils";

interface MetricsTableProps {
  title: string;
  metrics: PageMetrics | null;
}

export const MetricsTable = ({ title, metrics }: MetricsTableProps) => {
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [showConsentDetails, setShowConsentDetails] = useState(false);
  const [showElevarDetails, setShowElevarDetails] = useState(false);
  
  if (!metrics) return null;

  const mainEvents = {
    'Page View': metrics.ga4Events.pageView,
    'View Item': metrics.ga4Events.viewItem
  };

  const otherEvents = metrics.allGA4Events.filter(
    event => event !== metrics.ga4Events.pageView && event !== metrics.ga4Events.viewItem
  );

  return (
    <div className="bg-white/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 p-6 space-y-6 transition-all duration-300 hover:shadow-xl">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <h2 className="text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
          {title}
        </h2>
        <div className="text-sm text-gray-500 flex items-center gap-2">
          <Globe className="h-4 w-4" />
          {metrics.url}
        </div>
      </div>

      {/* Performance Metrics Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Activity className="h-4 w-4 text-blue-500" />
          Performance Metrics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard 
            label="TTFB" 
            value={`${metrics.ttfb.toFixed(2)}s`}
            icon={<Zap className="h-4 w-4 text-yellow-500" />}
            color="yellow"
          />
          <MetricCard 
            label="FCP" 
            value={`${metrics.fcp.toFixed(2)}s`}
            icon={<Clock className="h-4 w-4 text-green-500" />}
            color="green"
          />
          <MetricCard 
            label="DOM Load" 
            value={`${metrics.domLoad.toFixed(2)}s`}
            icon={<Activity className="h-4 w-4 text-blue-500" />}
            color="blue"
          />
          <MetricCard 
            label="Window Load" 
            value={`${metrics.windowLoad.toFixed(2)}s`}
            icon={<Globe className="h-4 w-4 text-purple-500" />}
            color="purple"
          />
        </div>
      </div>

      {/* Consent Mode Status */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Shield className="h-4 w-4 text-blue-500" />
          Consent Mode
        </h3>
        <div className={cn(
          "p-4 rounded-lg border flex items-center gap-3",
          metrics.consentMode.isConfigured 
            ? "bg-green-50 border-green-200" 
            : "bg-yellow-50 border-yellow-200"
        )}>
          {metrics.consentMode.isConfigured ? (
            <>
              <Shield className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">
                  Consent Mode Configured
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Advanced consent settings detected
                </p>
              </div>
            </>
          ) : (
            <>
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-900">
                  Basic Consent Mode
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Only default/implicit settings found
                </p>
              </div>
            </>
          )}
          
          {metrics.consentMode.settings && Object.keys(metrics.consentMode.settings).length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowConsentDetails(!showConsentDetails)}
              className="ml-auto"
            >
              {showConsentDetails ? 'Hide' : 'Show'} Details
            </Button>
          )}
        </div>

        {showConsentDetails && metrics.consentMode.settings && (
          <div className="space-y-2 animate-in slide-in-from-top duration-200">
            {Object.entries(metrics.consentMode.settings).map(([key, value]) => (
              <div key={key} className="grid grid-cols-3 gap-4 text-sm p-2 rounded-lg hover:bg-gray-50">
                <span className="font-medium text-gray-700">{key}</span>
                <div className="col-span-2 space-y-1">
                  {Object.entries(value).map(([setting, enabled]) => (
                    <div key={setting} className="flex items-center gap-2">
                      <span className="text-gray-500">{setting}:</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        enabled 
                          ? "bg-green-100 text-green-700" 
                          : "bg-gray-100 text-gray-700"
                      )}>
                        {enabled ? 'Yes' : 'No'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Elevar Configuration */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Activity className="h-4 w-4 text-purple-500" />
          Elevar Configuration
        </h3>
        <div className={cn(
          "p-4 rounded-lg border flex items-center gap-3",
          metrics.elevar.isConfigured 
            ? "bg-purple-50 border-purple-200" 
            : "bg-gray-50 border-gray-200"
        )}>
          {metrics.elevar.isConfigured ? (
            <>
              <Activity className="h-5 w-5 text-purple-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-purple-900">
                  Elevar Detected
                </p>
                <p className="text-xs text-purple-700 mt-1">
                  Shop: {metrics.elevar.shopUrl}
                </p>
                {metrics.elevar.gtmContainer && (
                  <p className="text-xs text-purple-700">
                    GTM: {metrics.elevar.gtmContainer}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowElevarDetails(!showElevarDetails)}
                className="ml-auto"
              >
                {showElevarDetails ? 'Hide' : 'Show'} Details
              </Button>
            </>
          ) : (
            <>
              <AlertTriangle className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700">
                  No Elevar Configuration
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Elevar GTM Suite not detected
                </p>
              </div>
            </>
          )}
        </div>

        {showElevarDetails && metrics.elevar.eventConfig && (
          <div className="space-y-2 animate-in slide-in-from-top duration-200">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-purple-900 mb-2">Event Configuration</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(metrics.elevar.eventConfig).map(([event, enabled]) => (
                  <div key={event} className="flex items-center gap-2">
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      enabled ? "bg-green-500" : "bg-red-500"
                    )} />
                    <span className="text-xs text-gray-700">
                      {event.split('_').join(' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* GA4 Configuration Section */}
      {metrics.allGA4Events.length > 0 && (
        <div className="space-y-4 animate-in fade-in-50 duration-500">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-blue-500/10 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse" />
              </div>
              GA4 Configuration
            </h3>
            <a 
              href={`https://analytics.google.com/analytics/web/#/p${metrics.allGA4Events[0].measurementId.replace('G-', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors duration-200"
            >
              {metrics.allGA4Events[0].measurementId}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Main GA4 Events */}
          <div className="space-y-3">
            {Object.entries(mainEvents).map(([eventName, event], index) => (
              event && (
                <div key={eventName} 
                  className="animate-in slide-in-from-bottom-2 duration-300"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <GA4EventCard name={eventName} event={event} />
                </div>
              )
            ))}
          </div>

          {/* Other GA4 Events */}
          {otherEvents.length > 0 && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllEvents(!showAllEvents)}
                className="w-full flex items-center justify-center gap-2 hover:bg-gray-50 transition-all duration-200"
              >
                {showAllEvents ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                {showAllEvents ? "Hide" : "Show"} Other Events ({otherEvents.length})
              </Button>
              
              {showAllEvents && (
                <div className="mt-3 space-y-3">
                  {otherEvents.map((event, index) => (
                    <div
                      key={index}
                      className="animate-in slide-in-from-bottom-2 duration-300"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <GA4EventCard 
                        name={event.parameters.en || 'Unknown Event'} 
                        event={event}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const MetricCard = ({ 
  label, 
  value, 
  icon,
  color 
}: { 
  label: string; 
  value: string;
  icon: React.ReactNode;
  color: 'yellow' | 'green' | 'blue' | 'purple';
}) => {
  const colorClasses = {
    yellow: 'from-yellow-50 to-yellow-100/50 text-yellow-700 border-yellow-200',
    green: 'from-green-50 to-green-100/50 text-green-700 border-green-200',
    blue: 'from-blue-50 to-blue-100/50 text-blue-700 border-blue-200',
    purple: 'from-purple-50 to-purple-100/50 text-purple-700 border-purple-200',
  };

  return (
    <div className={cn(
      "rounded-lg border p-4 text-center transition-all duration-300",
      "bg-gradient-to-br hover:shadow-md",
      colorClasses[color]
    )}>
      <div className="text-xs text-gray-500 mb-2 flex items-center justify-center gap-1">
        {icon}
        {label}
      </div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
};

const GA4EventCard = ({ name, event }: { name: string; event: GA4Event }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const commonParams = ['en', 'dl', '_et', 'ep.value'];
  const commonParameters = Object.entries(event.parameters)
    .filter(([key]) => commonParams.includes(key));
  const additionalParameters = Object.entries(event.parameters)
    .filter(([key]) => !commonParams.includes(key));

  // Format the timing information
  const timing = event.timeFromPageLoad.toFixed(2);
  const timingColor = event.timeFromPageLoad < 1 
    ? 'text-green-600 bg-green-50' 
    : event.timeFromPageLoad < 2 
      ? 'text-yellow-600 bg-yellow-50' 
      : 'text-red-600 bg-red-50';

  return (
    <Collapsible>
      <div className="border rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md">
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer">
            <div className="flex items-center gap-3">
              <ChevronRight 
                className={cn(
                  "h-4 w-4 text-gray-400 transition-transform duration-200",
                  isExpanded && "rotate-90"
                )} 
              />
              <span className="font-medium text-sm">{name}</span>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full font-medium",
                timingColor
              )}>
                +{timing}s
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                {new Date(event.time * 1000).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-3 pt-1 border-t bg-gradient-to-b from-gray-50 to-white">
            <div className="space-y-2">
              {/* Timing Information */}
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                <Clock className="h-3 w-3" />
                <span>Fired {timing} seconds after page load</span>
              </div>
              
              {/* Rest of the parameters... */}
              {commonParameters.map(([key, value]) => (
                <div key={key} 
                  className="grid grid-cols-3 gap-2 text-xs animate-in slide-in-from-left duration-200"
                >
                  <span className="text-gray-500">{key}</span>
                  <span className="col-span-2 font-mono break-all">{value}</span>
                </div>
              ))}
              
              {additionalParameters.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="w-full mt-2 text-xs hover:bg-blue-50 hover:text-blue-600"
                >
                  {isExpanded ? "Hide" : "Show"} All Parameters ({additionalParameters.length})
                </Button>
              )}
              
              {isExpanded && (
                <div className="space-y-2 mt-2 pt-2 border-t border-gray-200">
                  {additionalParameters.map(([key, value], index) => (
                    <div key={key} 
                      className="grid grid-cols-3 gap-2 text-xs animate-in slide-in-from-left duration-200"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <span className="text-gray-500">{key}</span>
                      <span className="col-span-2 font-mono break-all">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};