import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { clearAuth, getSavedToken, getSavedUser, getUserOrganizationId } from '@/utils/auth';
import { normalizePatients } from '@/utils/contracts';

const AppContext = createContext(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === null) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [organizationId, setOrganizationId] = useState(null);
  const [token, setToken] = useState(null);

  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);

  useEffect(() => {
    const storedUser = getSavedUser();
    if (storedUser) {
      setUser(storedUser);
      const nextOrganizationId = getUserOrganizationId(storedUser);
      if (nextOrganizationId) {
        setOrganizationId(nextOrganizationId);
      }
      setToken(getSavedToken());
    } else {
      setToken(getSavedToken());
      const publicPaths = ['/login', '/signup', '/onboard', '/signup/success'];
      if (!publicPaths.includes(router.pathname) && !router.pathname.startsWith('/_error')) {
        // Consider redirecting if not on a public page and no user/token
        // router.replace('/login'); 
      }
    }
  }, [router, router.pathname]);


  const fetchPatients = useCallback(async () => {
    if (!token) return; 
    setLoadingPatients(true);
    try {
      const baseURL = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${baseURL}/api/v1/patients/organization`, { 
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to fetch patients');
      }
      const data = await res.json();
      setPatients(normalizePatients(data.data || data || []));
    } catch (error) {
      console.error("Error fetching patients from context:", error);
      setPatients([]);
    } finally {
      setLoadingPatients(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchPatients();
    }
  }, [token, fetchPatients]);

  const openNewPatientModal = () => setIsNewPatientModalOpen(true);
  const closeNewPatientModal = () => setIsNewPatientModalOpen(false);

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    setOrganizationId(null);
    setToken(null);
    setPatients([]);
    router.push('/login');
  };
  
  const onPatientAdded = () => {
    fetchPatients(); 
    closeNewPatientModal();
  };

  const value = {
    user,
    setUser,
    organizationId,
    token,
    patients,
    loadingPatients,
    fetchPatients,
    isNewPatientModalOpen,
    openNewPatientModal,
    closeNewPatientModal,
    onPatientAdded,
    handleLogout,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
