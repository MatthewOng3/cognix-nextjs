"use client";

import { Send, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../hooks/use-auth";
import { useAlert } from "./AlertNotif";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";

interface SupportRequest {
  type: "Feature" | "Bugfix";
  description: string;
  images: File[];
}

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * @description Support Modal that allows user to send support requests
 * @returns
 */
export function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [supportData, setSupportData] = useState<SupportRequest>({
    type: "Bugfix",
    description: "",
    images: [],
  });
  const { user } = useAuth();
  const { showAlert } = useAlert();

  /**
   * @description Function to handle support request submit
   */
  async function handleSubmit() {
    if (!supportData.description.trim()) {
      showAlert("Please provide a description", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("type", supportData.type);
      formData.append("description", supportData.description);
      formData.append("userEmail", user?.email || "anonymous");
      formData.append("userId", user?.id || "anonymous");

      supportData.images.forEach((image, index) => {
        formData.append(`image-${index}`, image);
      });

      const response = await fetch("/api/support", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        showAlert("Message Sent! We will get back to you ASAP", "success");
        handleClose();
      } else {
        showAlert("Error sending message", "error");
      }
    } catch (error) {
      console.error("Error submitting support request:", error);
      showAlert(`Error sending message: ${error}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleClose = () => {
    onClose();
    setSupportData({
      type: "Bugfix",
      description: "",
      images: [],
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Chat with support
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Form */}
          <div className="p-4 space-y-3">
            {/* Issue Type Dropdown */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Issue Type
              </label>
              <Select
                value={supportData.type}
                onValueChange={(value: "Feature" | "Bugfix") =>
                  setSupportData((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bugfix">Bug Report</SelectItem>
                  <SelectItem value="Feature">Feature Request</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <Textarea
                placeholder="Please describe your issue/complaint or feature request and we will get back to you ASAP."
                value={supportData.description}
                onChange={(e) =>
                  setSupportData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={6}
                className="resize-none"
              />
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !supportData.description.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Request
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}