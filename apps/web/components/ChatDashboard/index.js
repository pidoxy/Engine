import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { RxHamburgerMenu } from 'react-icons/rx';
import { IoSend } from 'react-icons/io5';
import { IoChevronDown } from 'react-icons/io5';
import { IoAttach } from 'react-icons/io5';
import Sidebar from '@/components/Sidebar';
import appStyles from "@/styles/app.module.css";
import styles from "./ChatDashboard.module.css";
import Logo from '../Logo';
import { io } from "socket.io-client";
import AudioRecorder from '../AudioRecorder';
import PatientHeader from '../PatientHeader';
import LoadingToast from '../LoadingToast';
import DocumentUploader from '../DocumentUploader';
import ConfirmationModal from '../ConfirmationModal';
import ReportGenerator from '../ReportGenerator';
import { useAppContext } from '@/context/AppContext';

const ChatDashboard = ({ 
  children,
  showDefaultView: propShowDefaultView,
  setShowDefaultView: propSetShowDefaultView,
  sidebarProps = {},
  onAudioClick,
  onMediaClick,
  onInputFocus,
  token,
  patientId,
  patientData,
  currentConsultationId: propConsultationId,
}) => {
  const router = useRouter();
  const { user } = useAppContext();
  const [openSidebar, setOpenSidebar] = useState(false);
  const [inputText, setInputText] = useState('');
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentInference, setCurrentInference] = useState(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentConsultationId, setCurrentConsultationId] = useState(propConsultationId);
  const [consultations, setConsultations] = useState([]);
  const [internalShowDefaultView, setInternalShowDefaultView] = useState(propShowDefaultView);
  const [isRecording, setIsRecording] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [toastState, setToastState] = useState({
    isVisible: false,
    message: '',
    type: 'loading'
  });
  // New state to store pending send action
  const [pendingSend, setPendingSend] = useState(false);
  // New state to store the transcript when ready
  const transcriptRef = useRef("");

  // Use either the prop setter or internal state setter
  const setShowDefaultView = propSetShowDefaultView || setInternalShowDefaultView;
  const showDefaultView = propShowDefaultView ?? internalShowDefaultView;

  // Determine triage setting based on user role
  const isTriageEnabled = user?.role === 'chw';

  const handleAudioClick = (startRecording) => {
    if (startRecording) {
      setShowDefaultView(false);
      setIsRecording(true);
    } else {
      setIsRecording(false);
    }
    onAudioClick && onAudioClick(startRecording);
  };

  useEffect(() => {
    if (!token || !patientId) {
      return;
    }

    // Set up consultations from patient data
    if (patientData.consultations && patientData.consultations.length > 0) {
      const formattedConsultations = patientData.consultations.map(consultation => ({
        id: consultation._id,
        firstMessage: consultation.chats[0].userMessage || 'No messages',
        date: new Date(consultation.createdAt).toLocaleDateString(),
        time: new Date(consultation.createdAt).toLocaleTimeString()
      }));
      // console.log("Formatted consultations:", formattedConsultations);
      setConsultations(formattedConsultations);
      setShowDefaultView(false);
    } else {
      setShowDefaultView(true);
    }

    // If we have a consultation ID, fetch the consultation details
    if (propConsultationId) {
      const fetchConsultationDetails = async () => {
        try {
          const baseURL = process.env.NEXT_PUBLIC_API_URL;
          const res = await fetch(`${baseURL}/api/v1/patients/${patientId}/consultation/${propConsultationId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (!res.ok) throw new Error('Failed to fetch consultation details');
          const data = await res.json();
          console.log(data)

          // Format and set messages from the consultation
          if (data.data?.consultation?.messages) {
            let lastInference = null;
            const formattedMessages = data.data.consultation.messages.map(msg => {
              if (msg.sender === 'user') {
                return {
                  timeSent: msg.createdAt,
                  content: msg.userMessage
                };
              } else if (msg.sender === 'system') {
                // Check the actual data structure to determine which inference to use
                if (msg.triageData && msg.triageData.triage_recommendation && msg.triageData.triage_recommendation.urgency_level) {
                  // This is a triage response
                  lastInference = msg.triageData;
                } else if (msg.clinicalData && msg.clinicalData.clinical_support_details && msg.clinicalData.clinical_support_details.potential_conditions) {
                  // This is a clinical response
                  lastInference = msg.clinicalData;
                } else {
                  // Fallback: check which data has more meaningful content
                  const triageHasContent = msg.triageData && (
                    msg.triageData.triage_recommendation?.urgency_level ||
                    msg.triageData.triage_recommendation?.summary_of_findings ||
                    msg.triageData.triage_recommendation?.recommended_actions_for_chw?.length > 0
                  );
                  
                  const clinicalHasContent = msg.clinicalData && (
                    msg.clinicalData.clinical_support_details?.potential_conditions?.length > 0 ||
                    msg.clinicalData.clinical_support_details?.suggested_investigations?.length > 0 ||
                    msg.clinicalData.clinical_support_details?.alerts_and_flags?.length > 0
                  );
                  
                  if (triageHasContent) {
                lastInference = msg.triageData;
                  } else if (clinicalHasContent) {
                    lastInference = msg.clinicalData;
                  }
                }
              }
            }).filter(Boolean);
            console.log(lastInference)
            setCurrentInference(lastInference);
            setMessages(formattedMessages);
          }
        } catch (error) {
          console.error("Error fetching consultation details:", error);
        }
      };
      fetchConsultationDetails();
    }

    const socket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL, {
      reconnectionDelayMax: 10000,
      query: {
        "token": token,
        "patientId": patientId,
        ...(propConsultationId && { "consultationId": propConsultationId })
      }
    });

    socket.on("connect", () => {
      console.log("WebSocket connected for patient:", patientId, propConsultationId ? `and consultation: ${propConsultationId}` : '');
      setSocket(socket);
    });

    socket.on("consultationId", (data) => {
      console.log("Received consultation ID:", data);
      setCurrentConsultationId(data);
    });

    socket.on("message", (data) => {
      console.log("Message sent:", data);
      if (data.sender === 'user') {
        setMessages(prev => [...prev, { 
          timeSent: data.createdAt,
          content: data.userMessage
        }]);
      }
    });

    socket.on("response", (data) => {
      console.log("Received response:", data);
      if (data.sender === 'system') {
        const testId = data.consultationId;
        // If we have a new consultation ID and we're not already on a consultation page,
        // navigate to the consultation page after receiving the system response
        if (testId && !propConsultationId) {
          setInputText('');
          setIsProcessing(false);
          router.push(`/app/patient/${patientId}/consultation/${testId}`);
        }
        console.log(data)
        
        // Use user role to determine which data to display
        let inferenceData = null;
        if (isTriageEnabled) {
          // CHW user - show triage data
          inferenceData = data.triageData;
        } else {
          // Consultant/other users - show clinical data
          inferenceData = data.clinicalData;
        }
        
        setCurrentInference(inferenceData);
        
        setShowDefaultView(false);
        setIsProcessing(false);
      }
    });
    
    socket.on("disconnect", () => {
      console.log("WebSocket disconnected for patient:", patientId);
      setSocket(null);
    });

    // Store socket in state but don't clean up here
    setSocket(socket);

    // Only return a cleanup function that doesn't disconnect the socket
    return () => {
      // Remove event listeners but don't disconnect
      socket.off("connect");
      socket.off("consultationId");
      socket.off("message");
      socket.off("response");
      socket.off("disconnect");
    };
  }, [token, patientId, setShowDefaultView, propConsultationId, router]);

  // Handle consultation ID changes separately
  useEffect(() => {
    if (socket) {
      socket.on("consultationId", (data) => {
        setCurrentConsultationId(data);
      });
    }
  }, [socket]);

  // Separate useEffect for WebSocket cleanup on component unmount
  useEffect(() => {
    return () => {
      if (socket) {
        console.log("Cleaning up WebSocket connection for patient:", patientId);
        socket.disconnect();
        setSocket(null);
      }
    };
  }, [socket, patientId]);

  // useEffect(() => {
  //   if (currentConsultationId && currentConsultationId !== propConsultationId) {
  //     console.log("New consultation ID:", currentConsultationId);
  //     router.push(`/app/patient/${patientId}/consultation/${currentConsultationId}`);
  //     setInputText('');
  //     setIsProcessing(false);
  //   }
  // }, [currentConsultationId, patientId, router, propConsultationId, inputText, socket]);

  useEffect(() => {
    if (propConsultationId) {
      setCurrentConsultationId(propConsultationId);
    }
  }, [propConsultationId]);

  const toggleSidebar = () => {
    setOpenSidebar(!openSidebar);
  };

  // Called by AudioRecorder when transcription is ready
  const handleTranscription = (transcript) => {
    transcriptRef.current = transcript;
    actuallySendMessage(transcript, inputText);
  };

  // Send message through socket
  const actuallySendMessage = (transcript, manualContext) => {
    if (!socket) return;
        setIsProcessing(true);
          const messageData = {
      transcript_text: transcript,
      consultant_note: manualContext,
      triage: isTriageEnabled
          };
    if (!currentConsultationId) {
          socket.emit("startConsultation", messageData);
        } else {
          socket.emit("message", messageData);
        }
    setInputText("");
    // Do not set isProcessing to false here; wait for websocket response
  };

  const handleConsultationClick = (consultationId) => {
    router.push(`/app/patient/${patientId}/consultation/${consultationId}`);
  };

  const handleDocumentUpload = (response) => {
    console.log('Document uploaded:', response);
    // Show success toast
    setToastState({
      isVisible: true,
      message: 'Document uploaded successfully',
      type: 'success'
    });
    // Exit default view after successful upload
    setShowDefaultView(false);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="fixed top-4 right-4 z-50">
        <LoadingToast 
          isVisible={isProcessing || toastState.isVisible} 
          message={isProcessing ? 'Processing...' : toastState.message}
          type={isProcessing ? 'loading' : toastState.type}
        />
      </div>
      
      <button
        onClick={toggleSidebar}
        className={`${appStyles.sidebarBtn} ${openSidebar ? appStyles.activeSidebarBtn : ''} absolute top-4 left-4 z-50`}
      >
        <RxHamburgerMenu className={appStyles.sidebarIcon} />
      </button>

      <Sidebar 
        isOpen={openSidebar} 
        onClose={() => setOpenSidebar(false)}
        {...sidebarProps}
      />

      <main className={styles.mainContent}>
        <Logo compact={!showDefaultView} />

        {patientData && (
          <PatientHeader patient={patientData} />
        )}

        {!showDefaultView && (
          <AudioRecorder 
            onToggle={handleAudioClick} 
            initialRecording={isRecording}
            onTranscription={handleTranscription}
          />
        )}

        {/* Past Consultations Section */}
        {!showDefaultView && consultations.length > 0 && (
          <div className="max-w-2xl md:max-w-3xl mx-auto px-4">
            <div 
              className={styles.collapsibleHeader}
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            >
              <span className="font-medium">Past Consultations</span>
              <IoChevronDown 
                className={`${styles.chevronIcon} ${isHistoryOpen ? styles.open : ''}`}
                size={20}
              />
            </div>
            <div className={`${styles.collapsibleContent} ${isHistoryOpen ? styles.open : ''}`}>
              <div className="px-4">
                {consultations.map((consultation) => (
                  <div 
                    key={consultation.id}
                    onClick={() => handleConsultationClick(consultation.id)}
                    className={`mb-2 p-3 rounded bg-gray-50 text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors`}
                  >
                    <div className="flex justify-between gap-3 items-center">
                      <p className={`text-sm ${styles.consultationMessage}`}>{consultation.firstMessage}</p>
                      <div className="text-xs text-gray-500">
                        <p>{consultation.date}</p>
                        <p>{consultation.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Inference Section */}
        {!showDefaultView && currentInference && (
          <div className="max-w-2xl md:max-w-3xl mx-auto px-4 mt-4">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 space-y-6">
              {/* Session Info */}
              {(currentInference.session_uuid || currentInference.mode) && (
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border-l-4 border-l-blue-500 border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
                  <h4 className="font-bold text-gray-700 mb-3 text-lg">Session Information</h4>
                  <div className="text-xs text-gray-600 space-y-1">
                    {currentInference.session_uuid && (
                      <p><span className="font-medium">UUID:</span> <span className="font-mono break-all">{currentInference.session_uuid}</span></p>
                    )}
                    {currentInference.mode && (
                      <p><span className="font-medium">Mode:</span> {String(currentInference.mode).replaceAll('_', ' ')}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Transcript */}
              {currentInference.input_transcript && (
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border-l-4 border-l-green-500 border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
                  <h4 className="font-bold text-gray-700 mb-3 text-lg">Consultation Transcript (Summary)</h4>
                  <p className="text-gray-700 text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">{currentInference.input_transcript}</p>
                </div>
              )}

              {/* Manual Context */}
              {currentInference.manual_context_provided && currentInference.manual_context_provided !== 'string' && (
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border-l-4 border-l-blue-500 border border-blue-200 shadow-md hover:shadow-lg transition-shadow">
                  <h4 className="font-bold text-blue-700 mb-3 text-lg">Manually Entered Context</h4>
                  <p className="text-blue-700 text-sm whitespace-pre-wrap">{currentInference.manual_context_provided}</p>
                </div>
              )}
              {/* For Triage Responses - check if triage data exists */}
              {currentInference.triage_recommendation && (
                <>
                  {/* Urgency Level */}
                  {currentInference.triage_recommendation?.urgency_level && (
                    <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-xl border-l-4 border-l-red-500 border border-red-200 shadow-md hover:shadow-lg transition-shadow">
                      <h4 className="font-bold text-red-700 mb-3 text-lg">Urgency Level</h4>
                      <p className="text-red-600">{currentInference.triage_recommendation.urgency_level}</p>
                    </div>
                  )}

                  {/* Summary of Findings */}
                  {currentInference.triage_recommendation?.summary_of_findings && (
                    <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border-l-4 border-l-green-500 border border-green-200 shadow-md hover:shadow-lg transition-shadow">
                      <h4 className="font-bold text-green-700 mb-3 text-lg">Summary of Findings</h4>
                      <p className="text-green-600">{currentInference.triage_recommendation.summary_of_findings}</p>
                    </div>
                  )}

                  {/* Recommended Actions */}
                  {currentInference.triage_recommendation?.recommended_actions_for_chw?.length > 0 && (
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border-l-4 border-l-blue-500 border border-blue-200 shadow-md hover:shadow-lg transition-shadow">
                      <h4 className="font-bold text-blue-700 mb-3 text-lg">Recommended Actions</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {currentInference.triage_recommendation.recommended_actions_for_chw.map((action, idx) => (
                          <li key={idx} className="text-blue-600">{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Important Notes */}
                  {currentInference.triage_recommendation?.important_notes_for_chw?.length > 0 && (
                    <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-xl border-l-4 border-l-yellow-500 border border-yellow-200 shadow-md hover:shadow-lg transition-shadow">
                      <h4 className="font-bold text-yellow-700 mb-3 text-lg">Important Notes</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {currentInference.triage_recommendation.important_notes_for_chw.map((note, idx) => (
                          <li key={idx} className="text-yellow-700">{note}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Key Guideline References */}
                  {currentInference.triage_recommendation?.key_guideline_references?.length > 0 && (
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border-l-4 border-l-gray-500 border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
                      <h4 className="font-bold text-gray-700 mb-3 text-lg">Key Guideline References</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {currentInference.triage_recommendation.key_guideline_references.map((ref, idx) => (
                          <li key={idx} className="text-gray-700">{ref}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}

              {/* For Clinical Responses - check if clinical data exists */}
              {currentInference.clinical_support_details && (
                <>
                  {/* 1. Differential Summary for Doctor */}
                  {currentInference.clinical_support_details?.differential_summary_for_doctor && (
                    <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border-l-4 border-l-green-500 border border-green-200 shadow-md hover:shadow-lg transition-shadow">
                      <h4 className="font-bold text-green-700 mb-3 text-lg">Differential Summary for Doctor</h4>
                      <div className="bg-white p-3 rounded-lg border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                        <p className="text-green-600">{currentInference.clinical_support_details.differential_summary_for_doctor}</p>
                      </div>
                    </div>
                  )}

                  {/* 2. Potential Conditions */}
                  {currentInference.clinical_support_details?.potential_conditions?.length > 0 && (
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl border-l-4 border-l-purple-500 border border-purple-200 shadow-md hover:shadow-lg transition-shadow">
                      <h4 className="font-bold text-purple-700 mb-3 text-lg">Potential Conditions</h4>
                      <div className="space-y-2">
                        {currentInference.clinical_support_details.potential_conditions.map((condition, idx) => (
                          <div key={idx} className="bg-white p-3 rounded-lg border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
                            <p className="text-purple-700 font-medium">{condition.name || condition.condition}</p>
                            <p className="text-purple-600 text-sm mb-2">{condition.reasoning || condition.reason}</p>
                            {(condition.sources || condition.source_ref) && (condition.sources || condition.source_ref).length > 0 && (
                              <div className="text-xs text-purple-500">
                                <span className="font-medium">Source(s):</span> {(condition.sources || condition.source_ref).join(', ')}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. Suggested Investigations */}
                  {currentInference.clinical_support_details?.suggested_investigations?.length > 0 && (
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border-l-4 border-l-blue-500 border border-blue-200 shadow-md hover:shadow-lg transition-shadow">
                      <h4 className="font-bold text-blue-700 mb-3 text-lg">Suggested Investigations</h4>
                      <div className="space-y-2">
                        {currentInference.clinical_support_details.suggested_investigations.map((investigation, idx) => {
                          const title = investigation.test || investigation.investigation || 'Investigation';
                          const rationale = investigation.rationale || investigation.reason || investigation.description;
                          return (
                            <div key={idx} className="bg-white p-3 rounded-lg border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                              <p className="text-blue-700 font-medium">{title}</p>
                              {rationale && (
                                <p className="text-blue-600 text-sm mb-2">{rationale}</p>
                              )}
                              {(investigation.sources || investigation.source_ref) && (investigation.sources || investigation.source_ref).length > 0 && (
                                <div className="text-xs text-blue-500">
                                  <span className="font-medium">Source(s):</span> {(investigation.sources || investigation.source_ref).join(', ')}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 4. Medication Considerations & Info */}
                  {(currentInference.clinical_support_details?.medication_considerations_info?.length > 0 ||
                    currentInference.clinical_support_details?.medication_considerations?.length > 0) && (
                    <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-4 rounded-xl border-l-4 border-l-indigo-500 border border-indigo-200 shadow-md hover:shadow-lg transition-shadow">
                      <h4 className="font-bold text-indigo-700 mb-3 text-lg">Medication Considerations & Info</h4>
                      <div className="space-y-2">
                        {(currentInference.clinical_support_details.medication_considerations_info || currentInference.clinical_support_details.medication_considerations).map((item, idx) => {
                          const name = item.medication_name || item.medication || 'Consideration';
                          const details = item.details || item.description || item.info;
                          return (
                            <div key={idx} className="bg-white p-3 rounded-lg border border-indigo-200 shadow-sm hover:shadow-md transition-shadow">
                              <p className="text-indigo-700 font-medium">{name}</p>
                              {details && (
                                <p className="text-indigo-600 text-sm mb-2">{details}</p>
                              )}
                              {(item.sources || item.source_ref) && (item.sources || item.source_ref).length > 0 && (
                                <div className="text-xs text-indigo-500">
                                  <span className="font-medium">Source(s):</span> {(item.sources || item.source_ref).join(', ')}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 5. Alerts and Flags */}
                  {currentInference.clinical_support_details?.alerts_and_flags?.length > 0 && (
                    <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-xl border-l-4 border-l-red-500 border border-red-200 shadow-md hover:shadow-lg transition-shadow">
                      <h4 className="font-bold text-red-700 mb-3 text-lg">⚠️ Alerts & Flags</h4>
                      <div className="space-y-2">
                        {currentInference.clinical_support_details.alerts_and_flags.map((alert, idx) => (
                          <div key={idx} className="bg-white p-3 rounded-lg border border-red-200 shadow-sm hover:shadow-md transition-all duration-200 relative group">
                            {/* Subtle left accent */}
                            <div className="absolute top-0 left-0 w-1 h-full bg-red-400 rounded-r-full"></div>
                            
                            {/* Content with icon */}
                            <div className="flex items-start gap-2 ml-2">
                              <span className="text-red-500 text-sm">⚠️</span>
                              <p className="text-red-700 text-sm">{alert}</p>
                            </div>
                            

                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 6. Historical Context Summary */}
                  {currentInference.clinical_support_details?.historical_context_summary?.length > 0 && (
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border-l-4 border-l-gray-500 border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
                      <h4 className="font-bold text-gray-700 mb-3 text-lg">Historical Context Summary</h4>
                      <div className="space-y-2">
                        {currentInference.clinical_support_details.historical_context_summary.map((item, idx) => (
                          <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <p className="text-gray-700 text-sm">{item}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Common sections for both response types */}
              {/* Extracted Symptoms */}
              {currentInference.extracted_symptoms?.length > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl border-l-4 border-l-purple-500 border border-purple-200 shadow-md hover:shadow-lg transition-shadow">
                  <h4 className="font-bold text-purple-700 mb-3 text-lg">Extracted Symptoms</h4>
                  <div className="flex flex-wrap gap-2">
                    {currentInference.extracted_symptoms.map((symptom, idx) => (
                      <span key={idx} className="bg-white text-purple-700 px-4 py-2 rounded-full text-sm font-medium border-2 border-purple-200 shadow-sm hover:shadow-md transition-shadow">
                        {symptom}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Retrieved Guidelines */}
              {currentInference.retrieved_guidelines_summary?.length > 0 && (
                <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-xl border-l-4 border-l-yellow-500 border border-yellow-200 shadow-md hover:shadow-lg transition-shadow">
                  <h4 className="font-bold text-yellow-700 mb-3 text-lg">Retrieved Guidelines</h4>
                  <div className="space-y-2">
                    {currentInference.retrieved_guidelines_summary.map((guideline, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-lg border border-yellow-200 shadow-sm hover:shadow-md transition-shadow flex items-start justify-between gap-2">
                        <div>
                          <p className="text-yellow-700 font-medium">{guideline.source} - {guideline.code}</p>
                          <p className="text-yellow-600 text-sm">{guideline.case}</p>
                        </div>
                        {typeof guideline.score === 'number' && (
                          <span className="text-[10px] px-2 py-1 rounded bg-yellow-200 text-yellow-800 self-start">score: {guideline.score.toFixed(3)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Extracted Clinical Information (from transcript) - Only show if has content */}
              {currentInference.extracted_clinical_info && (() => {
                const hasContent = Object.values(currentInference.extracted_clinical_info).some(value => 
                  value && (Array.isArray(value) ? value.length > 0 : String(value).trim() !== '')
                );
                
                if (!hasContent) return null;
                
                                  return (
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border-l-4 border-l-gray-500 border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
                      <h4 className="font-bold text-gray-700 mb-3 text-lg">Extracted Clinical Information (from transcript)</h4>
                    <div className="space-y-3">
                      {Object.entries(currentInference.extracted_clinical_info).map(([key, value]) => {
                        // Skip empty arrays and null/undefined values
                        if (!value || (Array.isArray(value) && value.length === 0)) {
                          return null;
                        }
                        
                        // Format the key for display
                        const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                        
                        return (
                          <div key={key} className="bg-white p-2 rounded border border-gray-200">
                            <h5 className="font-medium text-gray-800 mb-1">{displayKey}</h5>
                            {Array.isArray(value) ? (
                              <div className="space-y-1">
                                {value.map((item, idx) => (
                                  <div key={idx} className="text-sm text-gray-700">
                                    {typeof item === 'object' ? (
                                      <div className="ml-2">
                                        {Object.entries(item).map(([subKey, subValue]) => {
                                          if (!subValue || (Array.isArray(subValue) && subValue.length === 0)) {
                                            return null;
                                          }
                                          const subDisplayKey = subKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                                          return (
                                            <div key={subKey} className="text-xs">
                                              <span className="font-medium text-gray-600">{subDisplayKey}:</span>{' '}
                                              <span className="text-gray-700">
                                                {Array.isArray(subValue) ? subValue.join(', ') : String(subValue)}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <span>{String(item)}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-700">{String(value)}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Report Generator */}
        {!showDefaultView && currentInference && (
          <div className="max-w-2xl md:max-w-3xl mx-auto px-4 mt-4">
            <ReportGenerator 
              patientData={patientData}
              currentInference={currentInference}
              consultationData={consultations.find(c => c.id === currentConsultationId)}
            />
          </div>
        )}

        {/* Default View or Children */}
        <div className="mt-8">
          {showDefaultView ? (
            <DefaultView 
              onAudioClick={handleAudioClick} 
              onMediaClick={onMediaClick}
              patientId={patientId}
            />
          ) : (
            children
          )}
        </div>
      </main>

      {/* Bottom Input Area */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
        <div className="max-w-2xl md:max-w-3xl mx-auto flex gap-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onFocus={onInputFocus}
            placeholder="Enter notes or symptoms manually."
            className="flex-1 p-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#6366F1] resize-none min-h-[48px] max-h-[120px]"
            rows={2}
          />
          {!showDefaultView && (
            <DocumentUploader
              onUpload={handleDocumentUpload}
              patientId={patientId}
              token={token}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// DefaultView component
const DefaultView = ({ onAudioClick, onMediaClick, patientId }) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // If we're not on a patient screen, just trigger the new patient modal
    if (!patientId) {
      onMediaClick && onMediaClick();
      return;
    }

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
      
      // Call the onMediaClick callback with the response
      onMediaClick && onMediaClick(data);
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document, Please try again.');
    } finally {
      setIsUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileInput = () => {
    // If we're not on a patient screen, just trigger the new patient modal
    if (!patientId) {
      onMediaClick && onMediaClick();
      return;
    }
    fileInputRef.current?.click();
  };

  return (
    <div className="w-9/10 max-w-md mx-auto space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".jpg,.jpeg,.png,.gif,.pdf"
        className="hidden"
      />
      <button 
        className="w-full p-4 bg-gray-50 rounded-xl text-left hover:bg-gray-100 transition-colors cursor-pointer"
        onClick={() => {
          onAudioClick(true);
        }}
      >
        <h3 className="font-medium mb-1">Use audio</h3>
        <p className="text-sm text-gray-600">Let us listen and extract key points</p>
      </button>

      <button 
        className="w-full p-4 bg-gray-50 rounded-xl text-left hover:bg-gray-100 transition-colors cursor-pointer"
        onClick={triggerFileInput}
        disabled={isUploading}
      >
        <h3 className="font-medium mb-1">Upload media</h3>
        <p className="text-sm text-gray-600">
          {isUploading ? 'Uploading...' : 'Add files, images of lab results, etc'}
        </p>
      </button>
    </div>
  );
};

export default ChatDashboard; 