"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ToolContainer } from "@/components/tool-container";
import { ToolParamsDebug } from "@/components/tool-params-debug";
import { UserToolsDebug } from "@/components/user-tools-debug";
import { Users } from "lucide-react";
import { ToolParams, isNewRecord } from "@/lib/tool-params";

interface TemplateToolProps {
  params: ToolParams;
}

export function TemplateTool({ params }: TemplateToolProps) {
  const router = useRouter();  
  const [isSaving, setIsSaving] = useState(false);
  const isNew = isNewRecord(params);

  useEffect(() => {
    console.log("Tool launched with params:", params);
    console.log("Mode:", isNew ? "Create New" : "Edit Existing");
    if (params.recordDescription) {
      console.log("Editing record:", params.recordDescription);
    }
  }, [params, isNew]);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    console.log("Saved!", { params });
  };

  const handleClose = () => {
    router.back();
  };

  const toolTitle = "Template Tool";

  return (
    <ToolContainer
      title={toolTitle}
      infoContent={
        <div className="space-y-2">
          <p className="font-semibold">Template Tool</p>
          <p className="text-sm">
            {isNew ? "Create a new record" : "Edit an existing record"} in Ministry Platform.
          </p>
          {params.pageID && (
            <p className="text-xs text-gray-400 mt-2">
              Launched from Page ID: {params.pageID}
              {params.s !== undefined && ` | Selection: ${params.s}`}
            </p>
          )}
        </div>
      }
      onSave={handleSave}
      onClose={handleClose}
      isSaving={isSaving}
    >

      {/* Main Tool Window */}
      <div className="p-6 space-y-6 max-w-7xl mx-auto">

        {/* Development Helper - Remove before production */}
        <ToolParamsDebug params={params} />
        
        {/* User Tools Debug - Remove before production */}
        <UserToolsDebug />

        {/* Tool Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Tool Section
            </h2>

          </div>
        </div>
      </div>
    </ToolContainer>
  );
}
