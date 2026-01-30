import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";
import { Button } from "./Button";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info" | "success";
  isLoading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "warning",
  isLoading = false,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "danger":
        return <XCircle className="w-12 h-12 text-red-500" />;
      case "warning":
        return <AlertTriangle className="w-12 h-12 text-yellow-500" />;
      case "success":
        return <CheckCircle className="w-12 h-12 text-green-500" />;
      case "info":
        return <Info className="w-12 h-12 text-blue-500" />;
      default:
        return <AlertTriangle className="w-12 h-12 text-yellow-500" />;
    }
  };

  const getButtonVariant = (): "primary" | "secondary" | "ghost" => {
    switch (type) {
      case "danger":
      case "warning":
        return "primary"; // We'll use primary with red/warning styling
      default:
        return "primary";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full animate-zoom-in-95 animate-slide-in-from-bottom-4">
        {/* Content */}
        <div className="p-6 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div
              className="animate-zoom-in-95"
              style={{ animationDelay: "100ms" }}
            >
              {getIcon()}
            </div>
          </div>

      

          {/* Message */}
          <p className="text-gray-600 mb-6 leading-relaxed">{message}</p>

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
              className="min-w-[100px]"
            >
              {cancelText}
            </Button>
            <Button
              variant={getButtonVariant()}
              onClick={onConfirm}
              loading={isLoading}
              className="min-w-[100px]"
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
