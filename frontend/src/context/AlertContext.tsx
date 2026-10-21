import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { api } from '../services/api';
import { Alert } from '../types';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface AlertContextType {
  alerts: Alert[];
  activeCount: number;
  fetchAlerts: () => Promise<void>;
  acknowledgeAlert: (id: number) => Promise<boolean>;
  resolveAlert: (id: number) => Promise<boolean>;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const knownAlertIds = useRef<Set<number>>(new Set());

  const activeCount = alerts.filter(a => a.status === 'Active').length;

  const fetchAlerts = async () => {
    try {
      const response = await api.alerts.getAll();
      const currentAlerts: Alert[] = response.data;
      setAlerts(currentAlerts);

      // Check for new active alerts
      currentAlerts.forEach(alert => {
        if (alert.status === 'Active' && !knownAlertIds.current.has(alert.id)) {
          knownAlertIds.current.add(alert.id);
          addToast({ title: `New Alert: ${alert.condition}`, type: 'error' });
        }
      });
    } catch (error) {
      console.error('Error fetching alerts', error);
    }
  };

  const acknowledgeAlert = async (id: number) => {
    try {
      await api.alerts.acknowledge(id);
      await fetchAlerts();
      return true;
    } catch (error) {
      console.error('Error acknowledging alert', error);
      return false;
    }
  };

  const resolveAlert = async (id: number) => {
    try {
      await api.alerts.resolve(id);
      await fetchAlerts();
      return true;
    } catch (error) {
      console.error('Error resolving alert', error);
      return false;
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isAuthenticated) {
      fetchAlerts();
      interval = setInterval(fetchAlerts, 10000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAuthenticated]);

  return (
    <AlertContext.Provider value={{ alerts, activeCount, fetchAlerts, acknowledgeAlert, resolveAlert }}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlerts = () => {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlerts must be used within an AlertProvider');
  }
  return context;
};
