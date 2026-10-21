import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

export interface ClassroomDirectoryEntry {
  classroom: string;          // e.g. "A101"
  phone: string;              // e.g. "+919975004101"
  source: 'live' | 'uploaded'; // "Live Feed" vs "Uploaded Video"
  updatedAt: string;
}

const DEFAULT_DIRECTORY: ClassroomDirectoryEntry[] = [
  {
    classroom: 'A101',
    phone: '+919975004101',
    source: 'live',
    updatedAt: new Date().toISOString(),
  },
  {
    classroom: 'Lab 201',
    phone: '+919975004101',
    source: 'uploaded',
    updatedAt: new Date().toISOString(),
  },
];

interface ClassroomContextType {
  classroomName: string;
  activePhone: string;
  directory: ClassroomDirectoryEntry[];
  setClassroomName: (name: string) => Promise<boolean>;
  setActivePhone: (phone: string) => void;
  upsertClassroom: (classroom: string, phone: string, source: 'live' | 'uploaded') => Promise<void>;
  updateClassroomPhone: (classroom: string, phone: string) => void;
  removeClassroom: (classroom: string) => void;
  getPhoneForClassroom: (classroom: string) => string;
  fetchClassroom: () => Promise<void>;
}

const ClassroomContext = createContext<ClassroomContextType | undefined>(undefined);

export const ClassroomProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  const [classroomName, setClassroomNameState] = useState<string>(() => {
    return localStorage.getItem('idlealert_classroom') || localStorage.getItem('smartclassroom_classroom') || 'A101';
  });

  const [activePhone, setActivePhoneState] = useState<string>(() => {
    return localStorage.getItem('idlealert_active_phone') || localStorage.getItem('smartclassroom_active_phone') || user?.phone || '+919975004101';
  });

  const [directory, setDirectory] = useState<ClassroomDirectoryEntry[]>(() => {
    try {
      const saved = localStorage.getItem('idlealert_directory') || localStorage.getItem('smartclassroom_directory');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse directory from storage:', e);
    }
    return DEFAULT_DIRECTORY;
  });

  // Keep activePhone synced if user object arrives
  useEffect(() => {
    if (user?.phone && !localStorage.getItem('idlealert_active_phone')) {
      setActivePhoneState(user.phone);
    }
  }, [user]);

  // Persist directory
  useEffect(() => {
    localStorage.setItem('idlealert_directory', JSON.stringify(directory));
  }, [directory]);

  // Persist active classroom
  useEffect(() => {
    if (classroomName) {
      localStorage.setItem('idlealert_classroom', classroomName);
    }
  }, [classroomName]);

  // Persist active phone
  useEffect(() => {
    if (activePhone) {
      localStorage.setItem('idlealert_active_phone', activePhone);
    }
  }, [activePhone]);

  const fetchClassroom = async () => {
    try {
      const response = await api.classroom.get();
      if (response.data.name) {
        setClassroomNameState(response.data.name);
      }
    } catch (error) {
      console.error('Error fetching classroom', error);
    }
  };

  const setClassroomName = async (name: string): Promise<boolean> => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    setClassroomNameState(trimmed);
    try {
      const response = await api.classroom.set(trimmed);
      return response.data.success;
    } catch (error) {
      console.error('Error setting classroom in backend', error);
      return true; // Still store locally
    }
  };

  const setActivePhone = (phone: string) => {
    const trimmed = phone.trim();
    if (trimmed) {
      setActivePhoneState(trimmed);
    }
  };

  const getPhoneForClassroom = (roomName: string): string => {
    const found = directory.find(
      (d) => d.classroom.toLowerCase() === roomName.trim().toLowerCase()
    );
    return found ? found.phone : activePhone;
  };

  const upsertClassroom = async (
    classroom: string,
    phone: string,
    source: 'live' | 'uploaded'
  ): Promise<void> => {
    const cleanRoom = classroom.trim();
    const cleanPhone = phone.trim() || activePhone;
    if (!cleanRoom) return;

    setClassroomNameState(cleanRoom);
    setActivePhoneState(cleanPhone);

    setDirectory((prev) => {
      const existingIdx = prev.findIndex(
        (e) => e.classroom.toLowerCase() === cleanRoom.toLowerCase()
      );
      const updatedEntry: ClassroomDirectoryEntry = {
        classroom: cleanRoom,
        phone: cleanPhone,
        source,
        updatedAt: new Date().toISOString(),
      };

      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = updatedEntry;
        return copy;
      } else {
        return [updatedEntry, ...prev];
      }
    });

    try {
      await api.classroom.set(cleanRoom);
    } catch (err) {
      console.warn('Backend classroom sync warning:', err);
    }
  };

  const updateClassroomPhone = (classroom: string, newPhone: string) => {
    const cleanPhone = newPhone.trim();
    if (!cleanPhone) return;

    setDirectory((prev) =>
      prev.map((item) =>
        item.classroom.toLowerCase() === classroom.trim().toLowerCase()
          ? { ...item, phone: cleanPhone, updatedAt: new Date().toISOString() }
          : item
      )
    );

    if (classroomName.toLowerCase() === classroom.trim().toLowerCase()) {
      setActivePhoneState(cleanPhone);
    }
  };

  const removeClassroom = (classroom: string) => {
    setDirectory((prev) =>
      prev.filter((item) => item.classroom.toLowerCase() !== classroom.trim().toLowerCase())
    );
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchClassroom();
    }
  }, [isAuthenticated]);

  return (
    <ClassroomContext.Provider
      value={{
        classroomName,
        activePhone,
        directory,
        setClassroomName,
        setActivePhone,
        upsertClassroom,
        updateClassroomPhone,
        removeClassroom,
        getPhoneForClassroom,
        fetchClassroom,
      }}
    >
      {children}
    </ClassroomContext.Provider>
  );
};

export const useClassroom = () => {
  const context = useContext(ClassroomContext);
  if (context === undefined) {
    throw new Error('useClassroom must be used within a ClassroomProvider');
  }
  return context;
};
