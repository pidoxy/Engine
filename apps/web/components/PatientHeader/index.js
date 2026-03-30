import styles from './PatientHeader.module.css';

const PatientHeader = ({ patient }) => {
  if (!patient) return null;

  return (
    <div className={styles.header}>
      <div className={styles.patientInfo}>
        <span className={styles.patientName}>{patient.firstName} {patient.lastName}</span>
        <span className={styles.patientGender}>{patient.gender}</span>
      </div>
    </div>
  );
};

export default PatientHeader; 