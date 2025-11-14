"use client";

import { ToolHeader } from "@/components/tool-header";
import { ToolFooter } from "@/components/tool-footer";

interface ToolContainerProps {
  title: string;
  infoContent?: React.ReactNode;
  onClose?: () => void;
  onSave?: () => void;
  closeLabel?: string;
  saveLabel?: string;
  isSaving?: boolean;
  children: React.ReactNode;
}

export function ToolContainer({
  title,
  infoContent,
  onClose,
  onSave,
  closeLabel,
  saveLabel,
  isSaving,
  children,
}: ToolContainerProps) {
  return (
    <div className="flex flex-col h-screen">
      <ToolHeader title={title} infoContent={infoContent} />
      
      <div className="flex-1 overflow-auto bg-gray-50">
        {children}
      </div>

      <ToolFooter
        onClose={onClose}
        onSave={onSave}
        closeLabel={closeLabel}
        saveLabel={saveLabel}
        isSaving={isSaving}
      />
    </div>
  );
}
