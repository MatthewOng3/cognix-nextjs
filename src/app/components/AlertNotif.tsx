"use client";
import { CheckCircle, Info, XCircle } from "lucide-react";
import React, {
  createContext,
  type ReactNode,
  useContext,
  useState,
} from "react";

type AlertType = "success" | "error" | "info";

interface AlertState {
  open: boolean;
  message: string;
  type: AlertType;
}

interface AlertContextProps {
  showAlert: (message: string, type?: AlertType) => void;
}

const AlertContext = createContext<AlertContextProps | undefined>(undefined);

export function useAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error("useAlert must be used within AlertProvider");
  return ctx;
}

/**
 * @description Alert
 * @param
 * @returns
 */
export function AlertProvider({ children }: { children: ReactNode }) {
  const [alert, setAlert] = useState<AlertState>({
    open: false,
    message: "",
    type: "info",
  });

  /**
   * @description Function to display alert message, to be called in other components when you need to display alert
   * @param message Alert Message
   * @param type Alert type
   */
  const showAlert = (message: string, type: AlertType = "info") => {
    setAlert({ open: true, message, type });
    setTimeout(() => setAlert((a) => ({ ...a, open: false })), 3500);
  };

  let Icon;
  switch (alert.type) {
    case "success":
      Icon = CheckCircle;
      break;
    case "error":
      Icon = XCircle;
      break;
    default:
      Icon = Info;
  }

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <div
        className={`fixed top-6 left-1/2 z-[9999] transform -translate-x-1/2 transition-all duration-300 ${
          alert.open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        style={{ minWidth: 300, maxWidth: 400 }}
      >
        <div
          className={`rounded px-4 py-3 shadow-lg text-white font-medium flex items-center gap-2
                    ${
                      alert.type === "success"
                        ? "bg-green-600"
                        : alert.type === "error"
                          ? "bg-red-600"
                          : "bg-blue-600"
                    }
                `}
        >
          <Icon className="w-5 h-5" />
          {alert.message}
        </div>
      </div>
    </AlertContext.Provider>
  );
}
