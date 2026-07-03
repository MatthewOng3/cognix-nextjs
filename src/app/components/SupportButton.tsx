"use client";

import { MessageCircle, Send, X } from "lucide-react";
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

/**
 * @description Support Button Overlay that sticks to bottom left on all screens. Allows user to send
 * support requests with images. Log it in our DB and send an email to us.
 * @returns
 */
export function SupportButton() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [supportData, setSupportData] = useState<SupportRequest>({
    type: "Bugfix",
    description: "",
    images: [],
  });
  //const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { showAlert } = useAlert();

  /**
   * @description Function to handle support request submit, sends request to nextjs backend
   * @returns
   */
  async function handleSubmit() {
    if (!supportData.description.trim()) {
      alert("Please provide a description");
      return;
    }

    setIsSubmitting(true);

    try {
      // Use form data since we potentially will allow screenshot upload
      const formData = new FormData();
      formData.append("type", supportData.type);
      formData.append("description", supportData.description);
      formData.append("userEmail", user?.email || "anonymous");
      formData.append("userId", user?.id || "anonymous");

      // Append images
      supportData.images.forEach((image, index) => {
        formData.append(`image-${index}`, image);
      });
 
      // Send to your API endpoint
      const response = await fetch("/api/support", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        //Use alert component to display result
        showAlert("Message Sent! We will get back to you ASAP", "success");
        handleClose();
      } else {
        //Use alert component to display result
        showAlert("Error sending message", "error");
        throw new Error("Failed to submit support request");
      }
    } catch (error) {
      console.error("Error submitting support request:", error);
      showAlert(`Error sending message: ${error}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  //Handle close and set default state
  const handleClose = () => {
    setIsExpanded(false);
    setSupportData({
      type: "Bugfix",
      description: "",
      images: [],
    });
  };

  // const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const files = Array.from(event.target.files || []);
  //   const validFiles = files.filter(
  //     (file) => file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024, // 5MB limit
  //   );

  //   if (validFiles.length !== files.length) {
  //     alert("Some files were skipped. Only images under 5MB are allowed.");
  //   }

  //   setSupportData((prev) => ({
  //     ...prev,
  //     images: [...prev.images, ...validFiles],
  //   }));
  // };

  // const removeImage = (index: number) => {
  //   setSupportData((prev) => ({
  //     ...prev,
  //     images: prev.images.filter((_, i) => i !== index),
  //   }));
  // };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {!isExpanded ? (
        <Button
          onClick={() => setIsExpanded(true)}
          className="bg-indigo-700 hover:bg-indigo-900 text-white rounded-full shadow-lg cursor-pointer"
          size="lg"
        >
          <MessageCircle className="w-5 h-5 mr-2" />
          Chat with Founder :D
        </Button>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-80 max-w-sm">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
             Chat with Founder :D
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
                placeholder="Please describe your issue or feature request and I will get back to you ASAP"
                value={supportData.description}
                onChange={(e) =>
                  setSupportData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Image Upload */}
            {/* <div className="flex flex-col gap-2">
				<label className="text-sm font-medium text-gray-700 dark:text-gray-300 ">
					Screenshots (Optional)
				</label>
				<div className="space-y-2">
					<Button
					type="button"
					variant="outline"
					onClick={() => fileInputRef.current?.click()}
					className="w-full cursor-pointer"
					>
					<Upload className="w-4 h-4 mr-2" />
					Upload Images
					</Button>
					<input
					ref={fileInputRef}
					type="file"
					multiple
					accept="image/*"
					onChange={handleImageUpload}
					className="hidden"
					/>
				</div> */}

            {/* Image Preview */}
            {/* {supportData.images.length > 0 && (
				<div className="space-y-2">
                  
				  <p className="text-xs text-gray-500">
                    {supportData.images.length} image(s) selected
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {supportData.images.map((image, index) => (
                      <div
                        key={index}
                        className="relative group w-16 h-16 border rounded overflow-hidden"
                      >
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div> */}

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
      )}
    </div>
  );
}
