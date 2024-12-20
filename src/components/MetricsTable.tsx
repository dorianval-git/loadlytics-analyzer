import { PageMetrics } from "@/lib/metrics";
import { formatTime } from "@/lib/metrics";
import { GA4EventDetails } from "./GA4EventDetails";
import { GA4EventsList } from "./GA4EventsList";

interface MetricsTableProps {
  title: string;
  metrics: PageMetrics | null;
}

export const MetricsTable = ({ title, metrics }: MetricsTableProps) => {
  if (!metrics) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
      <div className="flex items-center space-x-2">
        <div className="px-2 py-1 bg-gray-100 rounded text-xs font-mono text-gray-600">
          {title}
        </div>
      </div>
      <table className="w-full">
        <tbody className="divide-y divide-gray-100">
          <tr>
            <td className="py-2 text-sm text-gray-600">Time to First Byte</td>
            <td className="py-2 text-sm font-mono text-right">
              {formatTime(metrics.ttfb)}
            </td>
          </tr>
          <tr>
            <td className="py-2 text-sm text-gray-600">First Contentful Paint</td>
            <td className="py-2 text-sm font-mono text-right">
              {formatTime(metrics.fcp)}
            </td>
          </tr>
          <tr>
            <td className="py-2 text-sm text-gray-600">DOM Content Loaded</td>
            <td className="py-2 text-sm font-mono text-right">
              {formatTime(metrics.domLoad)}
            </td>
          </tr>
          <tr>
            <td className="py-2 text-sm text-gray-600">Full Page Load</td>
            <td className="py-2 text-sm font-mono text-right">
              {formatTime(metrics.windowLoad)}
            </td>
          </tr>
          <tr>
            <td className="py-2 text-sm text-gray-600">Resources Loaded</td>
            <td className="py-2 text-sm font-mono text-right">
              {metrics.resources}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="space-y-4 pt-4">
        <div className="text-sm font-semibold text-gray-600">GA4 Events</div>
        {metrics.ga4Events.pageView && (
          <GA4EventDetails event={metrics.ga4Events.pageView} eventName="page_view" />
        )}
        {metrics.ga4Events.viewItem && (
          <GA4EventDetails event={metrics.ga4Events.viewItem} eventName="view_item" />
        )}
      </div>

      <GA4EventsList events={metrics.allGA4Events} />
    </div>
  );
};