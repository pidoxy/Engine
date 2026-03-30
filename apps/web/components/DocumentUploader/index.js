import { useState, useRef } from 'react';
import { IoAttach } from 'react-icons/io5';
import styles from './DocumentUploader.module.css';

const DocumentUploader = ({ onUpload, patientId, token }) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size (2MB = 2 * 1024 * 1024 bytes)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB');
      return;
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image (JPEG, PNG, GIF) or PDF file');
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_ENGINE_URL}/patients/${patientId}/upload_document/`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      console.log('Document upload response:', data);
      
      // Call the onUpload callback with the response
      onUpload && onUpload(data);
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={styles.uploaderContainer}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".jpg,.jpeg,.png,.gif,.pdf"
        className={styles.hiddenInput}
      />
      <button
        onClick={triggerFileInput}
        className={`${styles.uploadButton} ${isUploading ? styles.uploading : ''}`}
        disabled={isUploading}
        title="Upload document"
      >
        <IoAttach size={24} />
      </button>
      {isUploading && (
        <div className={styles.uploadingIndicator}>
          Uploading...
        </div>
      )}
    </div>
  );
};

export default DocumentUploader; 