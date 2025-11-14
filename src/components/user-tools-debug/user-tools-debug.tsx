"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Wrench, Info, Loader2, AlertTriangle } from "lucide-react";
import { getUserTools } from "./actions";

export function UserToolsDebug() {
  const pathname = usePathname();
  const [toolPaths, setToolPaths] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserTools() {
      try {
        const paths = await getUserTools();
        setToolPaths(paths);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchUserTools();
  }, []);
  
  const isAuthorized = toolPaths?.some(path => path.includes(pathname)) ?? false;

  const bgColor = isAuthorized ? "bg-blue-50" : "bg-red-50";
  const borderColor = isAuthorized ? "border-blue-300" : "border-red-300";
  const iconColor = isAuthorized ? "text-blue-600" : "text-red-600";
  const textColor = isAuthorized ? "text-blue-900" : "text-red-900";
  const subtextColor = isAuthorized ? "text-blue-700" : "text-red-700";
  const hoverBg = isAuthorized ? "hover:bg-blue-100" : "hover:bg-red-100";
  const itemBorderColor = isAuthorized ? "border-blue-200" : "border-red-200";
  const dividerColor = isAuthorized ? "border-blue-200" : "border-red-200";
  const linkColor = isAuthorized ? "text-blue-700 hover:text-blue-900" : "text-red-700 hover:text-red-900";

  if (loading) {
    return (
      <div className={`${bgColor} border-2 border-dashed ${borderColor} rounded-lg p-4 mb-6`}>
        <div className="flex items-start gap-3">
          <Loader2 className={`w-5 h-5 ${iconColor} mt-0.5 animate-spin`} />
          <div>
            <h3 className={`font-semibold ${textColor} text-sm mb-1`}>
              Development Mode - Loading User Tools
            </h3>
            <p className={`text-xs ${subtextColor}`}>
              Fetching your authorized tools from Ministry Platform...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-dashed border-red-300 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 text-sm mb-1">
              Development Mode - Error Loading User Tools
            </h3>
            <p className="text-xs text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!toolPaths || toolPaths.length === 0) {
    return (
      <div className="bg-amber-50 border-2 border-dashed border-amber-300 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900 text-sm mb-1">
              Development Mode - No Tools Found
            </h3>
            <p className="text-xs text-amber-700">
              No tool paths found for your user account. Check your role assignments in Ministry Platform.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${bgColor} border-2 border-dashed ${borderColor} rounded-lg mb-6`}>
      <details className="group">
        <summary className={`flex items-center gap-3 p-4 cursor-pointer ${hoverBg} rounded-lg transition-colors`}>
          {isAuthorized ? (
            <Wrench className={`w-5 h-5 ${iconColor}`} />
          ) : (
            <AlertTriangle className={`w-5 h-5 ${iconColor}`} />
          )}
          <div className="flex-1">
            <h3 className={`font-semibold ${textColor} text-sm`}>
              Development Mode - Your Authorized Tools ({toolPaths.length})
              {!isAuthorized && " - ⚠️ NOT AUTHORIZED"}
            </h3>
            <p className={`text-xs ${subtextColor}`}>
              {isAuthorized 
                ? "Tool paths from your Ministry Platform roles"
                : `Current page "${pathname}" is NOT in your authorized tool paths`
              }
            </p>
          </div>
          <svg className={`w-5 h-5 ${iconColor} transition-transform group-open:rotate-180`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        
        <div className="px-4 pb-4 space-y-3">
          {!isAuthorized && (
            <div className="bg-red-100 border border-red-300 rounded-lg p-3 mb-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-700 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-red-900 mb-1">Authorization Warning</p>
                  <p className="text-xs text-red-800">
                    No matching authorized tool path exists for <code className="bg-red-200 px-1 rounded">{pathname}</code>
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    This tool may not be accessible to you in Ministry Platform.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {toolPaths.map((path, index) => (
              <div
                key={index}
                className={`bg-white rounded border ${itemBorderColor} px-3 py-2 ${path.includes(pathname) ? 'ring-2 ring-green-400' : ''}`}
              >
                <div className={`text-xs font-mono ${textColor} break-all`}>
                  {path.includes(pathname) && <span className="text-green-600 font-bold mr-1">✓</span>}
                  {path}
                </div>
              </div>
            ))}
          </div>

          <div className={`pt-3 border-t ${dividerColor}`}>
            <details className="text-xs">
              <summary className={`cursor-pointer ${linkColor} font-medium`}>
                View Raw JSON
              </summary>
              <pre className={`mt-2 bg-white p-3 rounded border ${itemBorderColor} overflow-x-auto text-xs`}>
                {JSON.stringify(toolPaths, null, 2)}
              </pre>
            </details>
          </div>

          <p className={`text-xs ${subtextColor} italic`}>
            💡 Remove this component before deploying to production
          </p>
        </div>
      </details>
    </div>
  );
}
