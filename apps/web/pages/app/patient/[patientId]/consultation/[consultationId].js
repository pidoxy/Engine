import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import ChatDashboard from '@/components/ChatDashboard';
import Loader from '@/components/Loader';
import NewPatientModal from '@/components/patients/NewPatientModal';

export default function ConsultationView() {
  const router = useRouter();
  const { patientId, consultationId } = router.query;
  const { 
    user, 
    token,
    isNewPatientModalOpen,
    openNewPatientModal,
    closeNewPatientModal,
    onPatientAdded
  } = useAppContext();
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    if (patientId && token) {
      const fetchPatientDetails = async () => {
        try {
          const baseURL = process.env.NEXT_PUBLIC_API_URL;
          const res = await fetch(`${baseURL}/api/v1/patients/${patientId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (!res.ok) throw new Error('Failed to fetch patient details');
          const data = await res.json();
          // console.log("Patient data:", data);
          setPatientData(data.data || data);
        } catch (error) {
          console.error("Error fetching patient details:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchPatientDetails();
    }
  }, [patientId, token]);

  const handlePatientCreated = (newPatient) => {
    onPatientAdded();
    if (newPatient && (newPatient._id || newPatient.id)) {
      router.push(`/app/patient/${newPatient._id || newPatient.id}`);
    }
  };

  if (!user || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="bg-white">
      <ChatDashboard
        showDefaultView={false}
        token={token}
        patientId={patientId}
        patientData={patientData}
        currentConsultationId={consultationId}
        sidebarProps={{
          isNewPatientModalOpen,
          openNewPatientModal,
          closeNewPatientModal,
          onPatientCreated: handlePatientCreated
        }}
      />
      <NewPatientModal
        isOpen={isNewPatientModalOpen}
        onClose={closeNewPatientModal}
        onPatientCreated={handlePatientCreated}
      />
    </div>
  );
} 