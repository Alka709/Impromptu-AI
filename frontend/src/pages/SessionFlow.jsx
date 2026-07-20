import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import SpeechPrepScreen from './SpeechPrepScreen';
import LiveRecordingScreen from './LiveRecordingScreen';
import SpeechAnalysisScreen from './SpeechAnalysisScreen';
import PerformanceReportScreen from './PerformanceReportScreen';

const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? '/api' : 'http://localhost:4000/api');

export default function SessionFlow({ user, logout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [sessionData, setSessionData] = useState(location.state?.session || null);
  const [flowState, setFlowState] = useState('prep'); // prep | recording | analyzing | report
  const [timeLeft, setTimeLeft] = useState(120); // 2 mins prep
  const [evaluationResult, setEvaluationResult] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    const initSession = async () => {
      try {
        const res = await fetch(`${API_BASE}/sessions/${id}`, { credentials: 'include' });
        if (!res.ok) throw new Error();
        const freshSession = await res.json();
        setSessionData(freshSession);

        // Restore state if session was already recorded
        if (freshSession.audio_url) {
          const evalRes = await fetch(`${API_BASE}/sessions/${id}/evaluation`, { credentials: 'include' });
          if (evalRes.ok) {
            const evalData = await evalRes.json();
            if (evalData && evalData.status === 'completed') {
              setEvaluationResult(evalData);
              setFlowState('report');
            } else {
              setFlowState('analyzing');
              pollEvaluation();
            }
          }
        }
      } catch (err) {
        console.error(err);
        if (!sessionData) {
          navigate('/');
        }
      }
    };
    initSession();
    // eslint-disable-next-line
  }, [id, navigate]);

  useEffect(() => {
    let timer;
    if (flowState === 'prep' || flowState === 'recording') {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            if (flowState === 'prep') {
              startRecording();
            } else if (flowState === 'recording') {
              stopRecording();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [flowState]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // Upload audio
        setFlowState('analyzing');
        const formData = new FormData();
        formData.append('audio', audioBlob, 'speech.webm');
        
        try {
          await fetch(`${API_BASE}/sessions/${id}/audio`, {
            method: 'POST',
            body: formData,
            credentials: 'include'
          });
          pollEvaluation();
        } catch (err) {
          console.error('Failed to upload audio');
        }
      };

      audioChunksRef.current = [];
      mediaRecorderRef.current.start();
      setFlowState('recording');
      setTimeLeft(300); // 5 minutes max recording
    } catch (err) {
      alert('Microphone permission is required.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const pollEvaluation = () => {
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/sessions/${id}/evaluation`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.status === 'completed') {
            clearInterval(pollInterval);
            setEvaluationResult(data);
            setFlowState('report');
          }
        }
      } catch (e) {
        console.error(e);
      }
    }, 3000);
  };

  if (!sessionData) return <div>Loading session...</div>;

  const props = { user, logout, sessionData, timeLeft, startRecording, stopRecording, evaluationResult };

  switch (flowState) {
    case 'prep':
      return <SpeechPrepScreen {...props} />;
    case 'recording':
      return <LiveRecordingScreen {...props} />;
    case 'analyzing':
      return <SpeechAnalysisScreen {...props} />;
    case 'report':
      return <PerformanceReportScreen {...props} />;
    default:
      return <div>Invalid state</div>;
  }
}
