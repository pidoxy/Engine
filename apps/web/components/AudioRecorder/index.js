import { useState, useEffect, useRef } from 'react';
import { FaMicrophone, FaStop } from 'react-icons/fa';
import styles from './AudioRecorder.module.css';
import ConfirmationModal from '../ConfirmationModal';
import { getSavedToken } from '@/utils/auth';

const AudioRecorder = ({ onToggle, initialRecording = false, onTranscription }) => {
  const [isRecording, setIsRecording] = useState(initialRecording);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  // Mic-permission / unsupported-browser fallback messaging (harvested from aidcare-pwa)
  const [micError, setMicError] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const isRecordingSupported = () =>
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== 'undefined';

  const messageForMicError = (error) => {
    switch (error?.name) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        return 'Microphone permission was denied. Enable it in your browser site settings and reload, or type your input instead.';
      case 'NotFoundError':
      case 'DevicesNotFoundError':
        return 'No microphone found. Connect a microphone, or type your input instead.';
      case 'NotReadableError':
        return 'Your microphone is already in use by another app. Close it and try again, or type your input instead.';
      default:
        return 'Could not access the microphone. You can type your input instead.';
    }
  };

  useEffect(() => {
    if (isRecording) {
      startRecording();
    } else if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      stopRecording();
    }
  }, [isRecording]);

  const handleTranscriptionResponse = async (transcript) => {
    if (onTranscription) {
      onTranscription(transcript);
    }
  };

  const handleConfirmation = () => {
    setShowConfirmation(false);
    if (pendingAction === 'stop') {
      setIsRecording(false);
    }
    setPendingAction(null);
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setPendingAction(null);
  };

  const handleStopRecording = () => {
    setPendingAction('stop');
    setShowConfirmation(true);
  };

  const startRecording = async () => {
    if (!isRecordingSupported()) {
      setMicError('Your browser does not support audio recording. Please type your input instead.');
      setIsRecording(false);
      return;
    }
    setMicError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], 'recording.mp3', { type: 'audio/mpeg' });
        const formData = new FormData();
        formData.append('audio_file', audioFile);
        try {
          setIsProcessing(true);
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/transcribe/audio`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${getSavedToken()}` },
            body: formData,
          });
          if (!response.ok) {
            throw new Error('Transcription failed');
          }
          const data = await response.json();
          if (data.transcript) {
            await handleTranscriptionResponse(data.transcript);
          }
        } catch (error) {
          console.error('Error during transcription:', error);
        } finally {
          setIsProcessing(false);
        }
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setMicError(messageForMicError(error));
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleToggle = () => {
    if (isRecording) {
      handleStopRecording();
    } else {
      const newIsRecording = !isRecording;
      setIsRecording(newIsRecording);
      onToggle && onToggle(newIsRecording);
    }
  };

  return (
    <>
      <div className={styles.recorderContainer}>
        <button
          onClick={handleToggle}
          className={`${styles.recordButton} ${isRecording ? styles.recording : ''}`}
          title={isRecording ? "Stop Recording" : "Start Recording"}
          disabled={isProcessing}
        >
          {isRecording ? <FaStop /> : <FaMicrophone />}
        </button>
        {isRecording && (
          <div className={styles.recordingIndicator}>
            Recording...
          </div>
        )}
        {isProcessing && (
          <div className={styles.recordingIndicator}>
            Processing audio...
          </div>
        )}
        {micError && (
          <div className={styles.recordingIndicator} role="alert" style={{ color: '#d97706' }}>
            {micError}
          </div>
        )}
      </div>
      <ConfirmationModal
        isOpen={showConfirmation}
        onConfirm={handleConfirmation}
        onCancel={handleCancel}
        title="Send Consultation Data"
        message="Are you sure you want to stop and transcribe the current audio recording?"
        confirmText="Stop & Transcribe"
        cancelText="Cancel"
      />
    </>
  );
};

export default AudioRecorder;