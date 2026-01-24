import { Button } from "@/components/ui/button";

interface ToolFooterProps {
  onClose?: () => void;
  onSave?: () => void;
  closeLabel?: string;
  saveLabel?: string;
  isSaving?: boolean;
}

export function ToolFooter({
  onClose,
  onSave,
  closeLabel = "Close",
  saveLabel = "Save",
  isSaving = false,
}: ToolFooterProps) {
  return (
    <div className="bg-white border-t px-6 py-4 flex items-center justify-end gap-3">
      <Button variant="outline" onClick={onClose} disabled={isSaving}>
        {closeLabel}
      </Button>
      <Button onClick={onSave} disabled={isSaving} className="bg-cyan-600 hover:bg-cyan-700">
        {isSaving ? "Saving..." : saveLabel}
      </Button>
    </div>
  );
}
