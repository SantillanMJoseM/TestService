"use client";

import { useEffect, useState } from "react";

interface NotificationProps {
  message: string;
  type: "success" | "error" | "warning" | "info";
  onClose: () => void;
  duration?: number;
}

export default function Notification({ message, type, onClose, duration = 5000 }: NotificationProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = {
    success: "bg-green-50 border-green-200 text-green-700",
    error: "bg-red-50 border-red-200 text-red-700",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-700",
    info: "bg-blue-50 border-blue-200 text-blue-700",
  }[type];

  if (!visible) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg border shadow-lg transition-opacity duration-300 ${bgColor}`}>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">{message}</span>
        <button onClick={() => { setVisible(false); setTimeout(onClose, 300); }} className="text-lg font-bold opacity-50 hover:opacity-100">
          &times;
        </button>
      </div>
    </div>
  );
}