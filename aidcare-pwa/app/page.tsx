'use client';

import { useState, useEffect, useRef } from 'react';

const API_BASE_URL = 'http://localhost:8000';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  isAudio?: boolean;
}

interface TriageResult {
  urgency_level: string;
  summary_of_findings: string;
  recommended_actions_for_chw: string[];
  extracted_symptoms: string[];
  evidence_based_notes?: string;
  risk_level?: 'high' | 'moderate' | 'low';
}

type RecordingState = 'idle' | 'recording' | 'processing' | 'recorded';

export default function Home() {
  // Onboarding state
  const [hasAgreedToDisclaimer, setHasAgreedToDisclaimer] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);

  // Conversation state
  const [conversationStarted, setConversationStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [conversationContext, setConversationContext] = useState<string[]>([]);
  const [autoCompleting, setAutoCompleting] = useState(false);

  // Audio recording state
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if user has seen disclaimer before
  useEffect(() => {
    const agreed = localStorage.getItem('aidcare_disclaimer_agreed');
    if (agreed === 'true') {
      setHasAgreedToDisclaimer(true);
      setShowOnboarding(false);
    }
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleAgreeToDisclaimer = () => {
    localStorage.setItem('aidcare_disclaimer_agreed', 'true');
    setHasAgreedToDisclaimer(true);
    setShowOnboarding(false);
  };

  const startConversation = () => {
    setConversationStarted(true);
    setMessages([
      {
        role: 'assistant',
        content: 'Hello! I\'m here to help assess your symptoms. You can type your message or use the microphone button to record your voice. Please tell me what symptoms you\'re experiencing.'
      }
    ]);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        setRecordingState('recorded');
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecordingState('recording');
      setRecordingTime(0);

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Microphone access error:', err);
      setMessages(prev => [...prev, {
        role: 'system',
        content: 'Unable to access microphone. Please check your browser permissions and try again.'
      }]);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop();
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop();
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
    setRecordingState('idle');
    setAudioBlob(null);
    setRecordingTime(0);
    audioChunksRef.current = [];
  };

  const sendAudioMessage = async () => {
    if (!audioBlob) return;

    setRecordingState('processing');
    setLoading(true);

    try {
      // Create FormData for audio upload
      const formData = new FormData();
      formData.append('audio_file', audioBlob, 'recording.webm');

      // Send to backend for transcription
      const response = await fetch(`${API_BASE_URL}/triage/process_audio/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Audio transcription failed');
      }

      const data = await response.json();
      // Backend returns "transcript" field in the response
      const transcribedText = data.transcript || data.transcribed_text || 'Audio transcribed successfully';

      // Add transcribed message to conversation
      const newMessages = [
        ...messages,
        { role: 'user' as const, content: transcribedText, isAudio: true }
      ];
      setMessages(newMessages);
      setConversationContext(prev => [...prev, transcribedText]);

      // Generate AI follow-up response
      await continueConversation(transcribedText, newMessages);

      // Reset audio state
      setAudioBlob(null);
      setRecordingTime(0);
      setRecordingState('idle');
      audioChunksRef.current = [];

    } catch (err) {
      console.error('Audio processing error:', err);
      setMessages(prev => [...prev, {
        role: 'system',
        content: 'I\'m having trouble processing your audio. Please try again or type your message instead.'
      }]);
      setRecordingState('recorded');
    } finally {
      setLoading(false);
    }
  };

  const continueConversation = async (userMessage: string, currentMessages: Message[]) => {
    // Build simple conversation history
    const conversationHistory = currentMessages
      .filter(m => m.role !== 'system')
      .map(m => `${m.role === 'user' ? 'PATIENT' : 'YOU'}: ${m.content}`)
      .join('\n');

    console.log('=== Sending to backend ===');
    console.log('Conversation History:', conversationHistory);
    console.log('Latest Message:', userMessage);

    try {
      // Use Gemini to continue the conversation
      const response = await fetch(`${API_BASE_URL}/triage/continue_conversation/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_history: conversationHistory,
          latest_message: userMessage,
        }),
      });

      if (!response.ok) {
        throw new Error('Conversation continuation failed');
      }

      const data = await response.json();

      console.log('=== Backend Response ===');
      console.log('Response:', data.response);
      console.log('Should Auto-Complete:', data.should_auto_complete);
      console.log('Conversation Complete:', data.conversation_complete);

      // Add AI response to conversation
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response || data.followup_question || 'Please tell me more about your symptoms.'
      }]);

      // Check if AI wants to auto-complete the assessment
      if (data.should_auto_complete === true || data.conversation_complete === true) {
        console.log('🟢 AUTO-COMPLETING ASSESSMENT');
        setAutoCompleting(true);
        // Wait a moment for user to read the message, then auto-complete
        setTimeout(() => {
          completeAssessment();
        }, 3000); // 3 second delay to read the message
      }

    } catch (err) {
      console.error('Conversation error:', err);
      // Improved fallback with more variety
      const fallbacks = [
        'Are there any other symptoms you\'re experiencing?',
        'How long have you been feeling this way?',
        'Is there anything that makes these symptoms better or worse?',
        'Have you noticed any changes in the symptoms over time?'
      ];
      const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: randomFallback
      }]);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || loading) return;

    const userMessage = inputText.trim();
    setInputText('');
    setLoading(true);

    // Add user message to conversation
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(newMessages);
    setConversationContext(prev => [...prev, userMessage]);

    // Continue the conversation with AI follow-up
    await continueConversation(userMessage, newMessages);
    setLoading(false);
  };

  const completeAssessment = async () => {
    setLoading(true);

    try {
      // Combine all conversation context for final assessment
      const fullSymptomDescription = conversationContext.join(' ');

      const response = await fetch(`${API_BASE_URL}/triage/process_text/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript_text: fullSymptomDescription,
        }),
      });

      if (!response.ok) {
        throw new Error('Triage request failed');
      }

      const data = await response.json();

      // Determine risk level from urgency
      const urgencyLower = data.triage_recommendation.urgency_level.toLowerCase();
      let risk_level: 'high' | 'moderate' | 'low' = 'moderate';

      if (urgencyLower.includes('emergency') || urgencyLower.includes('immediate')) {
        risk_level = 'high';
      } else if (urgencyLower.includes('urgent') || urgencyLower.includes('refer')) {
        risk_level = 'moderate';
      } else if (urgencyLower.includes('routine') || urgencyLower.includes('monitor')) {
        risk_level = 'low';
      }

      setTriageResult({
        urgency_level: data.triage_recommendation.urgency_level,
        summary_of_findings: data.triage_recommendation.summary_of_findings,
        recommended_actions_for_chw: data.triage_recommendation.recommended_actions_for_chw,
        extracted_symptoms: data.extracted_symptoms || [],
        evidence_based_notes: data.triage_recommendation.evidence_based_notes,
        risk_level
      });

    } catch (err) {
      console.error('Triage error:', err);
      setMessages(prev => [
        ...prev,
        {
          role: 'system',
          content: 'I\'m having trouble connecting to the assessment service. Please make sure you\'re connected to the internet and try again.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setConversationStarted(false);
    setMessages([]);
    setTriageResult(null);
    setInputText('');
    setConversationContext([]);
    cancelRecording();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRiskColor = (level: 'high' | 'moderate' | 'low') => {
    switch (level) {
      case 'high':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-900',
          badge: 'bg-red-100 text-red-800'
        };
      case 'moderate':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-900',
          badge: 'bg-yellow-100 text-yellow-800'
        };
      case 'low':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-900',
          badge: 'bg-green-100 text-green-800'
        };
    }
  };

  const getRiskLabel = (level: 'high' | 'moderate' | 'low') => {
    switch (level) {
      case 'high':
        return 'High Risk - Immediate Attention Recommended';
      case 'moderate':
        return 'Moderate Risk - Consult Healthcare Provider';
      case 'low':
        return 'Low Risk - Monitor Symptoms';
    }
  };

  // Onboarding/Disclaimer Screen
  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full medical-card">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-3xl">A</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to AidCare</h1>
            <p className="text-lg text-gray-600">AI-Powered Health Assessment</p>
          </div>

          <div className="space-y-6 mb-8">
            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Describe Your Symptoms</h3>
                <p className="text-sm text-gray-600">Tell us what you're experiencing in your own words</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Get an Assessment</h3>
                <p className="text-sm text-gray-600">Our AI analyzes your symptoms and provides a risk assessment</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Take Action</h3>
                <p className="text-sm text-gray-600">Receive clear guidance on your next steps</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
            <h3 className="font-semibold text-red-900 mb-2">Important Medical Disclaimer</h3>
            <p className="text-sm text-red-800 mb-4">
              AidCare is an informational tool and is NOT a substitute for professional medical diagnosis or advice from a doctor.
              This assessment is meant to help you understand potential risks, but should not replace professional medical care.
            </p>
            <p className="text-sm text-red-800">
              If you are experiencing a medical emergency, please call emergency services or go to the nearest hospital immediately.
            </p>
          </div>

          <label className="flex items-start gap-3 mb-6 cursor-pointer">
            <input
              type="checkbox"
              checked={hasAgreedToDisclaimer}
              onChange={(e) => setHasAgreedToDisclaimer(e.target.checked)}
              className="mt-1 w-5 h-5"
            />
            <span className="text-sm text-gray-700">
              I understand and agree that AidCare is not a replacement for professional medical advice, and I will seek proper medical care when needed.
            </span>
          </label>

          <button
            onClick={handleAgreeToDisclaimer}
            disabled={!hasAgreedToDisclaimer}
            className="btn-primary w-full"
          >
            I Understand - Continue
          </button>
        </div>
      </div>
    );
  }

  // Home Screen (before conversation starts)
  if (!conversationStarted && !triageResult) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AidCare</h1>
                <p className="text-sm text-gray-500">AI-Powered Health Assessment</p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How are you feeling today?
            </h2>
            <p className="text-lg text-gray-600">
              Describe your symptoms and get an instant health assessment
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <button
              onClick={startConversation}
              className="btn-primary w-full text-lg py-4"
            >
              Start Health Assessment
            </button>

            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900 text-center">
                <strong className="font-semibold">Remember:</strong> This is not a medical diagnosis. Always consult a healthcare professional for medical advice.
              </p>
            </div>
          </div>
        </main>

        <footer className="mt-12 pb-8 text-center text-sm text-gray-500">
          <p>AidCare - Powered by Gemini AI and Valyu Medical Search</p>
        </footer>
      </div>
    );
  }

  // Conversation or Results Screen
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">A</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">AidCare</h1>
            </div>
            {!triageResult && (
              <button
                onClick={handleReset}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </header>

      {!triageResult ? (
        /* Conversation View */
        <>
          <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 overflow-y-auto">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : message.role === 'system'
                        ? 'bg-red-50 text-red-900 border border-red-200'
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="spinner" />
                      <span className="text-sm text-gray-600">Analyzing your symptoms...</span>
                    </div>
                  </div>
                </div>
              )}
              {autoCompleting && (
                <div className="flex justify-center">
                  <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="spinner" style={{ borderTopColor: '#10b981' }} />
                      <span className="text-sm text-green-900 font-semibold">Completing your assessment...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </main>

          <div className="bg-white border-t border-gray-200 p-4">
            <div className="max-w-4xl mx-auto space-y-3">
              {/* Recording States */}
              {recordingState === 'idle' && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !loading && handleSendMessage()}
                    placeholder="Type your message or use the microphone..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={loading || !inputText.trim()}
                    className="btn-primary px-6"
                  >
                    Send
                  </button>
                  <button
                    onClick={startRecording}
                    disabled={loading}
                    className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold border border-gray-300"
                    title="Record audio message"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )}

              {recordingState === 'recording' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
                      <span className="font-semibold text-red-900">Recording</span>
                      <span className="text-red-700">{formatTime(recordingTime)}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={cancelRecording}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={stopRecording}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
                      >
                        Stop Recording
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {recordingState === 'recorded' && audioBlob && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                      </svg>
                      <span className="font-semibold text-blue-900">Audio Recorded ({formatTime(recordingTime)})</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={cancelRecording}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold"
                      >
                        Record Again
                      </button>
                      <button
                        onClick={sendAudioMessage}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                      >
                        Send Audio
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {recordingState === 'processing' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="spinner" />
                    <span className="text-blue-900">Processing your audio...</span>
                  </div>
                </div>
              )}

              {/* Complete Assessment Button */}
              {messages.length > 3 && !loading && !autoCompleting && (
                <button
                  onClick={completeAssessment}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold"
                >
                  Complete Assessment
                </button>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Results Screen */
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 overflow-y-auto">
          <div className="space-y-6">
            {/* Risk Level Card */}
            <div className={`medical-card border-2 ${getRiskColor(triageResult.risk_level!).border} ${getRiskColor(triageResult.risk_level!).bg}`}>
              <div className="text-center mb-4">
                <span className={`inline-block px-4 py-2 rounded-full font-semibold text-lg ${getRiskColor(triageResult.risk_level!).badge}`}>
                  {getRiskLabel(triageResult.risk_level!)}
                </span>
              </div>

              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Assessment Summary:</h3>
                <p className={`${getRiskColor(triageResult.risk_level!).text}`}>
                  {triageResult.summary_of_findings}
                </p>
              </div>

              {triageResult.extracted_symptoms.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Identified Symptoms:</h3>
                  <div className="flex flex-wrap gap-2">
                    {triageResult.extracted_symptoms.map((symptom, i) => (
                      <span key={i} className="badge badge-blue">
                        {symptom}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Recommended Actions */}
            <div className="medical-card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended Next Steps:</h3>
              <ol className="space-y-3">
                {triageResult.recommended_actions_for_chw.map((action, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-semibold">
                      {i + 1}
                    </span>
                    <span className="text-gray-700 pt-0.5">{action}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Action Buttons */}
            <div className="medical-card space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Take Action:</h3>

              {triageResult.risk_level === 'high' && (
                <>
                  <a
                    href="tel:112"
                    className="block w-full py-3 px-4 bg-red-600 text-white text-center rounded-lg font-semibold hover:bg-red-700"
                  >
                    Call Emergency Services
                  </a>
                  <button
                    onClick={() => window.open('https://www.google.com/maps/search/hospital+near+me', '_blank')}
                    className="block w-full py-3 px-4 bg-red-100 text-red-900 text-center rounded-lg font-semibold hover:bg-red-200"
                  >
                    Find Nearest Hospital
                  </button>
                </>
              )}

              {triageResult.risk_level === 'moderate' && (
                <button
                  onClick={() => window.open('https://www.google.com/maps/search/clinic+near+me', '_blank')}
                  className="block w-full py-3 px-4 bg-yellow-600 text-white text-center rounded-lg font-semibold hover:bg-yellow-700"
                >
                  Find a Nearby Clinic
                </button>
              )}

              {triageResult.risk_level === 'low' && (
                <button
                  onClick={() => window.open('https://www.nhs.uk/conditions/cough/', '_blank')}
                  className="block w-full py-3 px-4 bg-green-600 text-white text-center rounded-lg font-semibold hover:bg-green-700"
                >
                  Learn More About Your Symptoms
                </button>
              )}
            </div>

            {/* Disclaimer */}
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-900">
                <strong className="font-semibold">Reminder:</strong> This assessment is not a medical diagnosis. Always seek professional medical advice for health concerns.
              </p>
            </div>

            {/* New Assessment Button */}
            <button
              onClick={handleReset}
              className="btn-primary w-full"
            >
              Start New Assessment
            </button>
          </div>
        </main>
      )}
    </div>
  );
}
