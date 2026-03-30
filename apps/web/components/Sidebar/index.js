// frontend/components/Sidebar/index.js
import { IoLogOutOutline, IoSearch, IoPersonAddOutline } from "react-icons/io5";
import styles from "./Sidebar.module.css"; //
import { useEffect, useState } from "react"; // Removed useCallback as fetchPatients comes from context
import { FaUserMd, FaUserPlus } from "react-icons/fa";
import { useRouter } from "next/router";
import { useAppContext } from '@/context/AppContext'; // Use the context
import Loader from "@/components/Loader"; //

// Removed onOpenNewPatientModal and refreshPatientsTrigger from props
const Sidebar = ({ isOpen, onClose }) => { 
  const {
    user, // Get user from context
    patients, // Get patients from context
    loadingPatients, // Get loading state from context
    openNewPatientModal, // Get modal opener from context
    handleLogout, // Get logout from context
    // fetchPatients, // Only if manual refresh is needed FROM sidebar, otherwise context handles it
  } = useAppContext();

  const [patientQuery, setPatientQuery] = useState('');
  const router = useRouter();

  // Fetching logic is now in AppContext.
  // Sidebar will re-render when 'patients' or 'loadingPatients' from context changes.

  if (!isOpen) return null;

  const searchPatient = (e) => {
    e.preventDefault();
    console.log("Searching for patient:", patientQuery);
    // Filter context's `patients` array or make an API call if backend supports search
  };

  const handlePatientClick = (patientId) => {
    router.push(`/app/patient/${patientId}`);
    onClose(); 
  };

  const handleOnboardingClick = () => {
    if (user?.organization) {
      router.push(`/onboard?orgId=${user.organization}`);
      onClose();
    }
  };
  
  const userName = user ? `${user.firstName} ${user.lastName}` : "Loading...";
  const userRole = user ? user.role : "";

  // Check if user can access onboarding (admin or organization roles)
  const canAccessOnboarding = userRole === 'admin' || userRole === 'organization';

  let rolesDisplay = {
    consultant: "Clinical Consultant",
    chw: "Community Health Worker",
    organization: "Organization Admin", //
    admin: "Admin"
  };

  return (
    <div className={styles.overlay} onClick={onClose}> {/* */}
      <aside className={styles.sidebar} onClick={e => e.stopPropagation()}> {/* */}
        <div className={styles.sidebarTop}> {/* */}
          <form onSubmit={searchPatient} className={styles.searchForm}> {/* */}
            <button type="submit" aria-label="Search patients" className={styles.searchButton}> {/* */}
              <IoSearch />
            </button>
            <input
              type="search"
              name="patientName"
              id="patientName"
              value={patientQuery}
              onChange={(e) => setPatientQuery(e.target.value)}
              placeholder="Search patients"
              className={styles.searchInput}
            />
          </form>

          <button
            className={styles.createNewPatientBtn}
            onClick={() => {
                openNewPatientModal(); // Use directly from context
                // onClose(); // Optionally close sidebar when opening modal
            }}
          >
            <FaUserPlus style={{ marginRight: '8px' }} />
            New Patient
          </button>

          {/* Onboarding Link for Admin/Organization Users */}
          {canAccessOnboarding && (
            <button
              className={styles.onboardingBtn}
              onClick={handleOnboardingClick}
            >
              <IoPersonAddOutline style={{ marginRight: '8px' }} />
              Invite Team Members
            </button>
          )}
        </div>

        <div className={styles.sidebarMain}> {/* */}
          <h3 className={styles.patientListTitle || "text-lg font-semibold p-3 border-b"}>Patients</h3> {/* */}
          {loadingPatients ? (
            <div className="flex justify-center items-center p-4">
              <Loader size="sm" /> {/* */}
            </div>
          ) : patients.length > 0 ? (
            <ul className={styles.patientList || "divide-y"}> {/* */}
              {patients.map((patient) => (
                <li key={patient._id || patient.id} className={styles.patientListItem || "p-0"}> {/* */}
                  <button
                    onClick={() => handlePatientClick(patient._id || patient.id)}
                    className={styles.patientListItemButton || "w-full text-left p-3 hover:bg-gray-100"} /* */
                  >
                    {patient.firstName} {patient.lastName}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.noPatientsText || "p-3 text-gray-500"}>No patients found.</p> /* */
          )}
        </div>

        <div className={styles.sidebarBottom}> {/* */}
          <div className={styles.userSection}> {/* */}
            <div className={styles.userAvatar}> {/* */}
              <FaUserMd />
            </div>
            <div className={styles.userDetails}>
              <p className={styles.userName}>{userName}</p> {/* */}
              <p className={styles.userRole}>{rolesDisplay[userRole] || "User"}</p> {/* */}
            </div>
          </div>
          <button
            className={styles.logOutBtn} /* */
            onClick={handleLogout} // Use logout from context
            aria-label="Log out"
          >
            <IoLogOutOutline />
            Log out
          </button>
        </div>
      </aside>
    </div>
  );
};

export default Sidebar;