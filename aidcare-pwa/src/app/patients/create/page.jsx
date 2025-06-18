"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { patientService } from '../../lib/services';
import { useRouter } from 'next/navigation';

export default function CreatePatientPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    phoneNumber: '',
    address: '',
    emergencyContact: '',
    emergencyContactPhone: '',
    medicalHistory: '',
    allergies: '',
    currentMedications: ''
  });

  const [medicalFiles, setMedicalFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const validTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp'
      ];
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (!validTypes.includes(file.type)) {
        setError(`File ${file.name} is not a supported format. Please upload PDF, JPEG, PNG, GIF, or WebP files.`);
        return false;
      }
      
      if (file.size > maxSize) {
        setError(`File ${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      
      return true;
    });

    if (validFiles.length > 0) {
      setMedicalFiles(prev => [...prev, ...validFiles.map(file => ({
        file,
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
      }))]);
      setError(''); // Clear any previous errors
    }
  };

  const removeFile = (fileId) => {
    setMedicalFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove && fileToRemove.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const event = {
        target: {
          files: e.dataTransfer.files
        }
      };
      handleFileUpload(event);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Create patient in main backend first
      const mainBackendResponse = await patientService.createPatient({
        ...formData,
        organization: user?.organization,
      });
      console.log('Create Patient API response:', mainBackendResponse);
      const createdPatient = mainBackendResponse.data || mainBackendResponse;
      
      // If there are medical files or additional medical data, also create in AI backend
      if (medicalFiles.length > 0 || formData.medicalHistory || formData.allergies || formData.currentMedications) {
        setUploadingFiles(true);
        
        try {
          // Create patient with documents in AI backend
          const aiPatientData = {
            ...formData,
            id: createdPatient.id // Use the ID from main backend
          };
          
          const aiBackendResponse = await patientService.createPatientWithDocuments(aiPatientData, medicalFiles);
          console.log('AI backend patient created:', aiBackendResponse);
          
        } catch (aiError) {
          console.error('Error creating patient in AI backend:', aiError);
          // Don't fail the whole process if AI backend fails
          setError(`Patient created successfully, but there was an issue with medical document processing: ${aiError.message}`);
        }
        
        setUploadingFiles(false);
      }
      
      setSuccess(`Patient created successfully! ${medicalFiles.length > 0 ? 'Medical documents are being processed.' : ''}`);
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: '',
        phoneNumber: '',
        address: '',
        emergencyContact: '',
        emergencyContactPhone: '',
        medicalHistory: '',
        allergies: '',
        currentMedications: ''
      });

      // Clear medical files and revoke object URLs
      medicalFiles.forEach(fileData => {
        if (fileData.preview) {
          URL.revokeObjectURL(fileData.preview);
        }
      });
      setMedicalFiles([]);

      // Redirect to patient list after 3 seconds
      setTimeout(() => {
        router.push('/patients');
      }, 3000);

    } catch (err) {
      console.error('Error creating patient:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create patient');
    } finally {
      setLoading(false);
      setUploadingFiles(false);
    }
  };

  const handleCancel = () => {
    // Clean up object URLs before leaving
    medicalFiles.forEach(fileData => {
      if (fileData.preview) {
        URL.revokeObjectURL(fileData.preview);
      }
    });
    router.back();
  };

  // Cleanup effect for object URLs
  useEffect(() => {
    return () => {
      medicalFiles.forEach(fileData => {
        if (fileData.preview) {
          URL.revokeObjectURL(fileData.preview);
        }
      });
    };
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <div style={{ 
        background: 'white', 
        padding: '1rem 2rem', 
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: 0, color: '#333' }}>Create New Patient</h1>
          <p style={{ margin: '0.5rem 0 0 0', color: '#666' }}>
            Add a new patient to the system
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ 
            padding: '0.25rem 0.75rem',
            background: user?.role === 'admin' ? '#dc3545' : user?.role === 'consultant' ? '#007bff' : '#28a745',
            color: 'white',
            borderRadius: '12px',
            fontSize: '0.8rem',
            textTransform: 'uppercase',
            fontWeight: '600'
          }}>
            {user?.role || 'User'}
          </span>
          <button 
            onClick={logout}
            style={{
              padding: '0.5rem 1rem',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        {error && (
          <div style={{
            background: '#f8d7da',
            color: '#721c24',
            padding: '1rem',
            borderRadius: '4px',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            background: '#d4edda',
            color: '#155724',
            padding: '1rem',
            borderRadius: '4px',
            marginBottom: '1rem'
          }}>
            {success}
            {medicalFiles.length > 0 && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                <strong>Note:</strong> Medical documents are being processed by our AI system and will be available for clinical decision support.
              </div>
            )}
          </div>
        )}

        <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <form onSubmit={handleSubmit}>
            {/* Personal Information */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#333', borderBottom: '2px solid #007bff', paddingBottom: '0.5rem' }}>
                Personal Information
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#333' }}>
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '1rem',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Enter first name"
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#333' }}>
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '1rem',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#333' }}>
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '1rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#333' }}>
                    Gender *
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '1rem',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#333' }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Enter phone number"
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#333' }}>
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows="2"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                  placeholder="Enter address"
                />
              </div>
            </div>

            {/* Emergency Contact */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#333', borderBottom: '2px solid #28a745', paddingBottom: '0.5rem' }}>
                Emergency Contact
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#333' }}>
                    Emergency Contact Name
                  </label>
                  <input
                    type="text"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '1rem',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Enter emergency contact name"
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#333' }}>
                    Emergency Contact Phone
                  </label>
                  <input
                    type="tel"
                    name="emergencyContactPhone"
                    value={formData.emergencyContactPhone}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '1rem',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Enter emergency contact phone"
                  />
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#333', borderBottom: '2px solid #ffc107', paddingBottom: '0.5rem' }}>
                Medical Information
              </h3>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#333' }}>
                  Medical History
                </label>
                <textarea
                  name="medicalHistory"
                  value={formData.medicalHistory}
                  onChange={handleInputChange}
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                  placeholder="Enter medical history"
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#333' }}>
                  Allergies
                </label>
                <textarea
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleInputChange}
                  rows="2"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                  placeholder="Enter known allergies"
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#333' }}>
                  Current Medications
                </label>
                <textarea
                  name="currentMedications"
                  value={formData.currentMedications}
                  onChange={handleInputChange}
                  rows="2"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                  placeholder="Enter current medications"
                />
              </div>

              {/* Medical Documents Upload */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#333' }}>
                  Medical Documents
                </label>
                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                  Upload medical records, test results, prescriptions, or other relevant documents (PDF, JPEG, PNG, GIF, WebP - Max 10MB each)
                </p>
                
                <div 
                  style={{
                    border: `2px dashed ${dragActive ? '#007bff' : '#ddd'}`,
                    borderRadius: '8px',
                    padding: '2rem',
                    textAlign: 'center',
                    background: dragActive ? '#f0f8ff' : '#fafafa',
                    transition: 'all 0.3s ease'
                  }}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                    id="medical-files-upload"
                    disabled={loading || uploadingFiles}
                  />
                  <label 
                    htmlFor="medical-files-upload" 
                    style={{
                      cursor: loading || uploadingFiles ? 'not-allowed' : 'pointer',
                      display: 'inline-block'
                    }}
                  >
                    <div style={{ fontSize: '3rem', marginBottom: '1rem', color: dragActive ? '#007bff' : '#007bff' }}>
                      {dragActive ? '📤' : '📄'}
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '500', marginBottom: '0.5rem', color: '#333' }}>
                      {dragActive ? 'Drop files here' : loading || uploadingFiles ? 'Processing...' : 'Click to upload medical documents'}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>
                      {dragActive ? 'Release to upload' : 'or drag and drop files here'}
                    </div>
                  </label>
                </div>

                {/* Uploaded Files Display */}
                {medicalFiles.length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>Uploaded Files ({medicalFiles.length})</h4>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}>
                      {medicalFiles.map((fileData) => (
                        <div key={fileData.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0.75rem',
                          borderBottom: '1px solid #f0f0f0',
                          background: 'white'
                        }}>
                          {/* File Icon/Preview */}
                          <div style={{ marginRight: '1rem', minWidth: '40px' }}>
                            {fileData.preview ? (
                              <img 
                                src={fileData.preview} 
                                alt={fileData.name}
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  objectFit: 'cover',
                                  borderRadius: '4px',
                                  border: '1px solid #ddd'
                                }}
                              />
                            ) : (
                              <div style={{
                                width: '40px',
                                height: '40px',
                                background: '#f8f9fa',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.5rem'
                              }}>
                                📄
                              </div>
                            )}
                          </div>
                          
                          {/* File Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ 
                              fontWeight: '500', 
                              color: '#333',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {fileData.name}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#666' }}>
                              {formatFileSize(fileData.size)} • {fileData.type.split('/')[1].toUpperCase()}
                            </div>
                          </div>
                          
                          {/* Remove Button */}
                          <button
                            type="button"
                            onClick={() => removeFile(fileData.id)}
                            disabled={loading || uploadingFiles}
                            style={{
                              background: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '0.25rem 0.5rem',
                              cursor: loading || uploadingFiles ? 'not-allowed' : 'pointer',
                              fontSize: '0.8rem',
                              opacity: loading || uploadingFiles ? 0.5 : 1
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500',
                  opacity: loading ? 0.7 : 1
                }}
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={loading || uploadingFiles}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: (loading || uploadingFiles) ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500',
                  opacity: (loading || uploadingFiles) ? 0.7 : 1
                }}
              >
                {uploadingFiles ? 'Uploading Documents...' : loading ? 'Creating Patient...' : 'Create Patient'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 