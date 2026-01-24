import { ToolParams, isNewRecord, isEditMode } from "@/lib/tool-params";
import { Code2, Info } from "lucide-react";

interface ToolParamsDebugProps {
  params: ToolParams;
}

const PARAM_DESCRIPTIONS: Record<string, string> = {
  pageID: "MP PageID",
  s: "Selection ID",
  sc: "Selection Count",
  v: "View ID",
  recordID: "Record ID",
  p: "unknown / unused",
  q: "Query",
  addl: "Additional Data",
};

export function ToolParamsDebug({ params }: ToolParamsDebugProps) {
  const hasAnyParams = Object.values(params).some((value) => value !== undefined);

  if (!hasAnyParams) {
    return (
      <div className="bg-amber-50 border-2 border-dashed border-amber-300 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900 text-sm mb-1">
              Development Mode - No Parameters
            </h3>
            <p className="text-xs text-amber-700">
              No query string parameters detected. Try adding parameters like:{" "}
              <code className="bg-amber-100 px-1 py-0.5 rounded">
                ?recordID=123&pageID=292
              </code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-purple-50 border-2 border-dashed border-purple-300 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3 mb-3">
        <Code2 className="w-5 h-5 text-purple-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-purple-900 text-sm mb-1">
            Development Mode - Tool Parameters
          </h3>
          <div className="flex gap-4 text-xs mb-2">
            <span className={`font-medium ${isNewRecord(params) ? "text-green-700" : "text-gray-500"}`}>
              {isNewRecord(params) ? "✓ New Record" : "○ New Record"}
            </span>
            <span className={`font-medium ${isEditMode(params) ? "text-blue-700" : "text-gray-500"}`}>
              {isEditMode(params) ? "✓ Edit Mode" : "○ Edit Mode"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {Object.entries(params).map(([key, value]) => {
          // Skip pageData - it's rendered inline with pageID
          if (key === 'pageData' || key === 'recordDescription') return null;

          return (
            <div
              key={key}
              className={`bg-white rounded border px-3 py-2 ${
                value !== undefined ? "border-purple-200" : "border-gray-200"
              }`}
            >
              <div className="text-xs font-mono text-gray-500 mb-1">{key}</div>
              <div
                className={`text-sm font-medium mb-1 ${
                  value !== undefined ? "text-purple-900" : "text-gray-400"
                }`}
              >
                {value !== undefined ? (
                  typeof value === "string" ? (
                    <span className="break-all">{value}</span>
                  ) : key === "pageID" && params.pageData?.Table_Name ? (
                    <span>{value} - {params.pageData.Table_Name}</span>
                  ) : (
                    value
                  )
                ) : (
                  <span className="italic">undefined</span>
                )}
              </div>
              {PARAM_DESCRIPTIONS[key] && (
                <div className="text-xs text-gray-500 italic">
                  {PARAM_DESCRIPTIONS[key]}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-purple-200">
        <details className="text-xs">
          <summary className="cursor-pointer text-purple-700 font-medium hover:text-purple-900">
            View Raw JSON
          </summary>
          <pre className="mt-2 bg-white p-3 rounded border border-purple-200 overflow-x-auto text-xs">
            {JSON.stringify(params, null, 2)}
          </pre>
        </details>
      </div>

      <p className="text-xs text-purple-600 mt-3 italic">
        💡 Remove this component before deploying to production
      </p>
    </div>
  );
}
