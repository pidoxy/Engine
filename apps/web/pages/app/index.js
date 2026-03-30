// frontend/pages/app/index.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAppContext } from '@/context/AppContext';
import ChatDashboard from '@/components/ChatDashboard';
import NewPatientModal from '@/components/patients/NewPatientModal';
import Loader from '@/components/Loader';

export default function AppHome() {
  const router = useRouter();
  const { 
    user, 
    isNewPatientModalOpen, 
    openNewPatientModal, 
    closeNewPatientModal,
    onPatientAdded
  } = useAppContext();

  useEffect(() => {
    if (user === null && !localStorage.getItem("aidcare_token")) {
      // router.replace('/login');
    }
  }, [user, router]);

  const handlePatientCreatedAndNavigate = (newPatient) => {
    onPatientAdded();
    if (newPatient && (newPatient._id || newPatient.id)) {
      router.push(`/app/patient/${newPatient._id || newPatient.id}`);
    }
  };

  // Store the last action to be executed after patient creation
  let lastAction = null;

  const handleSendMessage = (message) => {
    if (!isNewPatientModalOpen) {
      lastAction = () => {
        console.log('Message sent:', message);
        // Actual message handling will go here
      };
      openNewPatientModal();
    }
  };

  const handleAudioClick = () => {
    if (!isNewPatientModalOpen) {
      lastAction = () => {
        // Handle audio feature
        console.log('Audio feature clicked');
      };
      openNewPatientModal();
    }
  };

  const handleMediaClick = () => {
    if (!isNewPatientModalOpen) {
      lastAction = () => {
        // Handle media upload
        console.log('Media upload clicked');
      };
      openNewPatientModal();
    }
  };

  const handleInputFocus = () => {
    if (!isNewPatientModalOpen) {
      openNewPatientModal();
    }
  };

  const handlePatientCreated = (newPatient) => {
    onPatientAdded();
    if (newPatient && (newPatient._id || newPatient.id)) {
      router.push(`/app/patient/${newPatient._id || newPatient.id}`);
      // Execute the last action if it exists
      if (lastAction) {
        lastAction();
        lastAction = null;
      }
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <>
      <ChatDashboard
        showDefaultView={true}
        onSendMessage={handleSendMessage}
        onAudioClick={handleAudioClick}
        onMediaClick={handleMediaClick}
        onInputFocus={handleInputFocus}
      />
      <NewPatientModal
        isOpen={isNewPatientModalOpen}
        onClose={closeNewPatientModal}
        onPatientCreated={handlePatientCreated}
      />
    </>
  );
}