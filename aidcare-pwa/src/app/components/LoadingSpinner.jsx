// components/LoadingSpinner.js
import React, { useState, useEffect } from 'react';
import { FaStethoscope, FaBrain, FaClipboardCheck, FaHeartbeat, FaMicrophone } from 'react-icons/fa';
import { MdLocalHospital, MdHealthAndSafety } from 'react-icons/md';

export default function LoadingSpinner({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);

  const analysisSteps = [
    {
      icon: <FaMicrophone size={24} />,
      title: "Processing Audio",
      description: "Converting voice to text...",
      duration: 1500,
      progressTarget: 20
    },
    {
      icon: <FaBrain size={24} />,
      title: "AI Analysis",
      description: "Analyzing symptoms and medical history...",
      duration: 2500,
      progressTarget: 50
    },
    {
      icon: <FaStethoscope size={24} />,
      title: "Medical Assessment",
      description: "Evaluating clinical data...",
      duration: 2000,
      progressTarget: 75
    },
    {
      icon: <FaClipboardCheck size={24} />,
      title: "Generating Report",
      description: "Preparing triage recommendations...",
      duration: 0, // This step waits for actual completion
      progressTarget: 90
    }
  ];

  useEffect(() => {
    let elapsed = 0;
    let stepIndex = 0;
    let stepStartTime = 0;

    const progressTimer = setInterval(() => {
      elapsed += 100;

      // Calculate which step we should be on
      let cumulativeTime = 0;
      let newStepIndex = 0;
      
      for (let i = 0; i < analysisSteps.length - 1; i++) { // Exclude last step from auto-progression
        cumulativeTime += analysisSteps[i].duration;
        if (elapsed <= cumulativeTime) {
          newStepIndex = i;
          break;
        } else {
          newStepIndex = i + 1;
        }
      }

      // Update step if changed
      if (newStepIndex !== stepIndex) {
        stepIndex = newStepIndex;
        stepStartTime = elapsed;
        setCurrentStep(stepIndex);
      }

      // Calculate progress based on current step
      let newProgress = 0;
      
      if (stepIndex < analysisSteps.length - 1) {
        // Normal progression for first 3 steps
        const step = analysisSteps[stepIndex];
        const stepElapsed = elapsed - stepStartTime;
        const stepProgress = Math.min(stepElapsed / step.duration, 1);
        
        const previousTarget = stepIndex > 0 ? analysisSteps[stepIndex - 1].progressTarget : 0;
        const currentTarget = step.progressTarget;
        
        newProgress = previousTarget + (currentTarget - previousTarget) * stepProgress;
      } else {
        // Final step - cap at 90% and slow down significantly
        const timeInFinalStep = elapsed - stepStartTime;
        const slowProgressRate = 0.5; // Much slower progress
        const additionalProgress = Math.min(timeInFinalStep * slowProgressRate / 1000, 10);
        newProgress = Math.min(80 + additionalProgress, 90); // Cap at 90%
        
        // Move to final step
        if (currentStep < analysisSteps.length - 1) {
          setCurrentStep(analysisSteps.length - 1);
        }
      }

      setProgress(newProgress);

      // Stop auto-progression once we reach the final step
      if (stepIndex >= analysisSteps.length - 1 && newProgress >= 90) {
        clearInterval(progressTimer);
      }
    }, 100);

    return () => clearInterval(progressTimer);
  }, []);

  // This effect would be triggered by the parent when the API call completes
  useEffect(() => {
    if (onComplete) {
      setIsCompleting(true);
      
      // Animate to 100% when actually complete
      const completeTimer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(completeTimer);
            return 100;
          }
          return Math.min(prev + 2, 100);
        });
      }, 50);

      return () => clearInterval(completeTimer);
    }
  }, [onComplete]);

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '3rem 2rem',
      textAlign: 'center',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)',
      borderRadius: '1rem',
      border: '1px solid #e2e8f0'
    },
    header: {
      marginBottom: '2rem'
    },
    mainIcon: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '4rem',
      height: '4rem',
      background: 'linear-gradient(135deg, #2563eb, #059669)',
      borderRadius: '50%',
      marginBottom: '1rem',
      color: 'white',
      animation: 'pulse 2s infinite'
    },
    title: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#1f2937',
      marginBottom: '0.5rem',
      margin: 0
    },
    subtitle: {
      fontSize: '1rem',
      color: '#6b7280',
      margin: 0
    },
    progressSection: {
      width: '100%',
      maxWidth: '400px',
      marginBottom: '2rem'
    },
    progressBar: {
      width: '100%',
      height: '8px',
      background: '#e5e7eb',
      borderRadius: '4px',
      overflow: 'hidden',
      marginBottom: '1rem'
    },
    progressFill: {
      height: '100%',
      background: progress >= 100 
        ? 'linear-gradient(90deg, #059669, #10b981)' 
        : 'linear-gradient(90deg, #2563eb, #059669)',
      borderRadius: '4px',
      transition: 'width 0.3s ease, background 0.5s ease',
      width: `${progress}%`
    },
    progressText: {
      fontSize: '0.875rem',
      color: progress >= 100 ? '#059669' : '#6b7280',
      fontWeight: '500',
      transition: 'color 0.3s ease'
    },
    stepsContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      width: '100%',
      maxWidth: '350px'
    },
    step: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      padding: '0.75rem',
      borderRadius: '0.5rem',
      transition: 'all 0.3s ease'
    },
    activeStep: {
      background: 'rgba(37, 99, 235, 0.1)',
      border: '1px solid rgba(37, 99, 235, 0.2)'
    },
    completedStep: {
      background: 'rgba(16, 185, 129, 0.1)',
      border: '1px solid rgba(16, 185, 129, 0.2)'
    },
    pendingStep: {
      background: 'rgba(107, 114, 128, 0.05)',
      border: '1px solid rgba(107, 114, 128, 0.1)'
    },
    stepIcon: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '2.5rem',
      height: '2.5rem',
      borderRadius: '50%',
      flexShrink: 0
    },
    activeStepIcon: {
      background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
      color: 'white',
      animation: currentStep === analysisSteps.length - 1 && progress < 90 
        ? 'pulse 1s infinite' 
        : 'pulse 1.5s infinite'
    },
    completedStepIcon: {
      background: 'linear-gradient(135deg, #059669, #047857)',
      color: 'white'
    },
    pendingStepIcon: {
      background: '#f3f4f6',
      color: '#9ca3af'
    },
    stepContent: {
      textAlign: 'left',
      flex: 1
    },
    stepTitle: {
      fontSize: '0.875rem',
      fontWeight: '600',
      margin: 0,
      marginBottom: '0.25rem'
    },
    activeStepTitle: {
      color: '#2563eb'
    },
    completedStepTitle: {
      color: '#059669'
    },
    pendingStepTitle: {
      color: '#6b7280'
    },
    stepDescription: {
      fontSize: '0.75rem',
      margin: 0,
      color: '#6b7280'
    },
    finalStepDescription: {
      fontSize: '0.75rem',
      margin: 0,
      color: currentStep === analysisSteps.length - 1 && progress < 90 
        ? '#f59e0b' 
        : '#6b7280'
    },
    footer: {
      marginTop: '2rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      color: '#6b7280',
      fontSize: '0.875rem'
    },
    heartbeat: {
      color: '#ef4444',
      animation: 'heartbeat 1.5s infinite'
    },
    waitingMessage: {
      fontSize: '0.75rem',
      color: '#f59e0b',
      fontStyle: 'italic',
      marginTop: '0.5rem'
    }
  };

  // Update descriptions for more realistic messaging
  const getStepDescription = (step, index) => {
    if (index === analysisSteps.length - 1 && currentStep === index) {
      if (progress < 90) {
        return "Finalizing analysis, please wait...";
      }
      return step.description;
    }
    return step.description;
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.mainIcon}>
          <MdLocalHospital size={28} />
        </div>
        <h2 style={styles.title}>AI Analysis in Progress</h2>
        <p style={styles.subtitle}>
          Our medical AI is carefully analyzing the patient information
        </p>
      </div>

      {/* Progress Bar */}
      <div style={styles.progressSection}>
        <div style={styles.progressBar}>
          <div style={styles.progressFill}></div>
        </div>
        <div style={styles.progressText}>
          {progress >= 100 ? 'Analysis Complete!' : `${Math.round(progress)}% Complete`}
        </div>
      </div>

      {/* Analysis Steps */}
      <div style={styles.stepsContainer}>
        {analysisSteps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isPending = index > currentStep;

          let stepStyle = { ...styles.step };
          let iconStyle = { ...styles.stepIcon };
          let titleStyle = { ...styles.stepTitle };

          if (isActive) {
            stepStyle = { ...stepStyle, ...styles.activeStep };
            iconStyle = { ...iconStyle, ...styles.activeStepIcon };
            titleStyle = { ...titleStyle, ...styles.activeStepTitle };
          } else if (isCompleted) {
            stepStyle = { ...stepStyle, ...styles.completedStep };
            iconStyle = { ...iconStyle, ...styles.completedStepIcon };
            titleStyle = { ...titleStyle, ...styles.completedStepTitle };
          } else {
            stepStyle = { ...stepStyle, ...styles.pendingStep };
            iconStyle = { ...iconStyle, ...styles.pendingStepIcon };
            titleStyle = { ...titleStyle, ...styles.pendingStepTitle };
          }

          return (
            <div key={index} style={stepStyle}>
              <div style={iconStyle}>
                {step.icon}
              </div>
              <div style={styles.stepContent}>
                <h3 style={titleStyle}>{step.title}</h3>
                <p style={index === analysisSteps.length - 1 ? styles.finalStepDescription : styles.stepDescription}>
                  {getStepDescription(step, index)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Waiting message for final step */}
      {currentStep === analysisSteps.length - 1 && progress < 90 && (
        <div style={styles.waitingMessage}>
          Processing may take a few more moments depending on complexity...
        </div>
      )}

      {/* Footer */}
      <div style={styles.footer}>
        <MdHealthAndSafety size={16} />
        <span>HIPAA Compliant Processing</span>
        <FaHeartbeat style={styles.heartbeat} size={16} />
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        @keyframes heartbeat {
          0%, 100% {
            transform: scale(1);
          }
          25% {
            transform: scale(1.1);
          }
          50% {
            transform: scale(1);
          }
          75% {
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
}