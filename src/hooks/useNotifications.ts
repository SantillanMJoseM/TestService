"use client";

import { useEffect, useState } from "react";

interface Notification {
  id: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (message: string, type: Notification["type"] = "info") => {
    const id = crypto.randomUUID();
    setNotifications((prev) => [...prev, { id, message, type }]);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Poll for critical defects every 30 seconds
  useEffect(() => {
    const checkCriticalDefects = async () => {
      try {
        const res = await fetch("/api/defects?status=Open");
        if (res.ok) {
          const defects = await res.json();
          const critical = defects.filter((d: { severity: string }) => d.severity === "Critical");
          if (critical.length > 0) {
            addNotification(
              `Hay ${critical.length} incidencia(s) crítica(s) abierta(s)`,
              "warning"
            );
          }
        }
      } catch {
        // Silently fail
      }
    };

    checkCriticalDefects();
    const interval = setInterval(checkCriticalDefects, 30000);
    return () => clearInterval(interval);
  }, []);

  return { notifications, addNotification, removeNotification };
}