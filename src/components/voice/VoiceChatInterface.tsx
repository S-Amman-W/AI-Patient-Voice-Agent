'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  MessageCircle,
  Clock,
  User,
  Bot
} from 'lucide-react';
import Vapi from '@vapi-ai/web';
import { createVapiInstance, VapiMessage, ConversationSummary, generatePatientContext } from '@/lib/vapi';
import { PatientProfile, MedicalCondition, PastConsultation } from '@/db/schema';
import ConsultationSummary from './ConsultationSummary';

interface VoiceChatInterfaceProps {
  profile: PatientProfile | null;
  conditions: MedicalCondition[];
  pastConsultations: PastConsultation[];
  onConsultationEnd?: (summary: ConversationSummary) => void;
}

interface TranscriptMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isPartial?: boolean;
}

export default function VoiceChatInterface({
  profile,
  conditions,
  pastConsultations,
  onConsultationEnd
}: VoiceChatInterfaceProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [initialContext, setInitialContext] = useState<string>('');
  const [transcript, setTranscript] = useState<TranscriptMessage | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [finalCallDuration, setFinalCallDuration] = useState(0);
  // const [showTranscript, setShowTranscript] = useState(true); // Always showing transcript during calls
  const [consultationSummary, setConsultationSummary] = useState<ConversationSummary | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [vapiAnalysisSummary, setVapiAnalysisSummary] = useState<string | null>(null);
  const [endOfCallReport, setEndOfCallReport] = useState<any | null>(null);
  const [userEndedCall, setUserEndedCall] = useState(false);
  
  const vapiRef = useRef<Vapi | null>(null);
  const callStartTimeRef = useRef<Date | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Initialize VAPI only once
    try {
      vapiRef.current = createVapiInstance();
      setIsConnected(true);
    } catch (err) {
      setError('Failed to initialize voice assistant. Please check your VAPI configuration.');
      console.error('VAPI initialization error:', err);
    }

    return () => {
      if (vapiRef.current) {
        vapiRef.current.stop();
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []); // Empty dependency array - initialize only once

  useEffect(() => {
    if (!vapiRef.current) return;

    const handleMessage = (message: any) => {

      switch (message.type) {
        case 'call-start':
          console.log('Call started');
          setIsCallActive(true);
          setError('');
          callStartTimeRef.current = new Date();
          startDurationTimer();
          break;

        case 'call-end':
          console.log('Call ended', message);
          // Note: We now handle call completion via end-of-call-report
          // This case might still fire, but we'll primarily rely on end-of-call-report
          if (!endOfCallReport) {
            // Only process if we haven't received an end-of-call-report yet
            // Capture final duration before stopping timer
            if (callStartTimeRef.current) {
              const now = new Date().getTime();
              const start = callStartTimeRef.current.getTime();
              const duration = Math.floor((now - start) / 1000);
              setFinalCallDuration(duration);
              setCallDuration(duration);
            }
            setIsCallActive(false);
            if (durationIntervalRef.current) {
              clearInterval(durationIntervalRef.current);
            }
            // Only set generating summary if not already set (to avoid overriding user-initiated end)
            if (!isGeneratingSummary) {
              setIsGeneratingSummary(true);
            }
            handleCallEnd();
          }
          break;

        case 'speech-start':
          console.log('Speech started:', message);
          if (message.role === 'assistant') {
            setIsSpeaking(true);
          }
          break;

        case 'speech-end':
          console.log('Speech ended:', message);
          if (message.role === 'assistant') {
            setIsSpeaking(false);
          }
          break;

        case 'transcript':
          console.log('Transcript received:', message);
          if (message.transcript) {
            // Check if this is a partial transcript (still being spoken)
            const {role, transcript, transcriptType} = message;
            if (transcriptType === 'partial') {
              setTranscript({id: Date.now().toString(), role, content: transcript, timestamp: new Date()});
            } else if (transcriptType === 'final') {
              setMessages(prev => {
                const newMessages = [...prev, {id: Date.now().toString(), role, content: transcript, timestamp: new Date()}];
                // Auto-scroll transcript to bottom
                setTimeout(() => {
                  if (transcriptScrollRef.current) {
                    transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
                  }
                }, 100);
                return newMessages;
              });
              setTranscript(null);
            }
          }
          break;

        case 'error':
          console.error('VAPI Error in message:', message);
          setError('Voice assistant error occurred');
          break;

        case 'call-analysis':
          console.log('Call analysis received:', message);
          if (message.analysis && message.analysis.summary) {
            setVapiAnalysisSummary(message.analysis.summary);
            console.log('VAPI Analysis Summary from analysis event:', message.analysis.summary);
          }
          break;

        case 'end-of-call-report':
          console.log('End-of-call-report received - FULL MESSAGE:', JSON.stringify(message, null, 2));
          setEndOfCallReport(message);
          // Capture final duration before stopping timer
          if (callStartTimeRef.current) {
            const now = new Date().getTime();
            const start = callStartTimeRef.current.getTime();
            const duration = Math.floor((now - start) / 1000);
            setFinalCallDuration(duration);
            setCallDuration(duration);
          }
          // Stop the call and show summary immediately
          setIsCallActive(false);
          if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
          }
          // Only set generating summary if not already set (to avoid overriding user-initiated end)
          if (!isGeneratingSummary) {
            setIsGeneratingSummary(true);
          }
          handleCallEnd();
          break;

        default:
          console.log('Unhandled VAPI message type:', message.type);
          break;
      }
    };

    const handleError = (error: Error) => {
      console.error('VAPI Error:', error);
      setError(`Voice assistant error: ${error.message}`);
      setIsCallActive(false);
      setIsLoading(false);
    };

    const handleCallStart = () => {
      console.log('Call start event triggered');
      setIsCallActive(true);
      setError('');
      setIsLoading(false);
      callStartTimeRef.current = new Date();
      startDurationTimer();
    };

    const handleCallEndEvent = (callEndData?: any) => {
      console.log('Call end event triggered', callEndData);
      // Note: We now handle call completion via end-of-call-report
      // This event might still fire, but we'll primarily rely on end-of-call-report
      if (!endOfCallReport) {
        // Only process if we haven't received an end-of-call-report yet
        // Capture final duration before stopping timer
        if (callStartTimeRef.current) {
          const now = new Date().getTime();
          const start = callStartTimeRef.current.getTime();
          const duration = Math.floor((now - start) / 1000);
          setFinalCallDuration(duration);
          setCallDuration(duration);
        }
        setIsCallActive(false);
        setIsLoading(false);
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
        }
        // Only set generating summary if not already set (to avoid overriding user-initiated end)
        if (!isGeneratingSummary) {
          setIsGeneratingSummary(true);
        }
        handleCallEnd();
      }
    };

    // Register event listeners
    vapiRef.current.on('message', handleMessage);
    vapiRef.current.on('error', handleError);
    vapiRef.current.on('call-start', handleCallStart);
    vapiRef.current.on('call-end', handleCallEndEvent);

    return () => {
      if (vapiRef.current) {
        vapiRef.current.off('message', handleMessage);
        vapiRef.current.off('error', handleError);
        vapiRef.current.off('call-start', handleCallStart);
        vapiRef.current.off('call-end', handleCallEndEvent);
      }
    };
  }, []);

  const startDurationTimer = () => {
    console.log('Starting duration timer');
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    durationIntervalRef.current = setInterval(() => {
      if (callStartTimeRef.current) {
        const now = new Date().getTime();
        const start = callStartTimeRef.current.getTime();
        const duration = Math.floor((now - start) / 1000);
        console.log('Timer update - Duration:', duration);
        setCallDuration(duration);
      }
    }, 1000);
  };

  const startCall = async () => {
    console.log('startCall function called - this should only happen when user clicks the button');
    
    if (!vapiRef.current || !initialContext.trim()) {
      setError('Please provide context about your current health concern before starting the consultation.');
      return;
    }
    
    // Additional safeguard - ensure we're not already in a call
    if (isCallActive) {
      console.log('Call already active, preventing duplicate call initiation');
      return;
    }

    setIsLoading(true);
    setError('');
    setTranscript(null);
    setCallDuration(0);
    
    // Clear any existing timer
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    try {
      // Clean the assistant key by removing any trailing characters
      const assistantKey = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_KEY;
      
      if (!assistantKey) {
        throw new Error('VAPI assistant key not configured');
      }

      console.log('Starting VAPI call with assistant key:', assistantKey);
      
      // Generate patient context for the assistant
      const patientContext = generatePatientContext(profile, conditions, pastConsultations, initialContext);
      console.log('Generated patient context:', patientContext);
      
      // For VAPI, we'll use the assistant ID from environment
      // The patient context will be handled by the assistant's system message
      await vapiRef.current.start(assistantKey, {
        // You can pass additional options here if needed
        // variableValues: { patientContext }
      });
      
      console.log('VAPI call started successfully');
    } catch (err) {
      console.error('Failed to start call:', err);
      setError(`Failed to start voice consultation: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`);
      setIsLoading(false);
    }
  };

  const endCall = async () => {
    if (vapiRef.current && isCallActive) {
      console.log('Ending call...');
      
      // Mark that user manually ended the call
      setUserEndedCall(true);
      
      // Show loading summary immediately when user clicks end call
      setIsGeneratingSummary(true);
      
      try {
        vapiRef.current.stop();
        // The end-of-call-report should be received automatically
        // Set a longer timeout to wait for the end-of-call-report
        setTimeout(() => {
          if (isCallActive && !endOfCallReport) {
            console.log('Force ending call due to timeout - no end-of-call-report received');
            // Capture final duration before stopping timer
            if (callStartTimeRef.current) {
              const now = new Date().getTime();
              const start = callStartTimeRef.current.getTime();
              const duration = Math.floor((now - start) / 1000);
              setFinalCallDuration(duration);
              setCallDuration(duration);
            }
            setIsCallActive(false);
            if (durationIntervalRef.current) {
              clearInterval(durationIntervalRef.current);
            }
            handleCallEnd();
          }
        }, 5000); // Increased timeout to wait for end-of-call-report
      } catch (err) {
        console.error('Error ending call:', err);
        // Force end the call
        // Capture final duration before stopping timer
        if (callStartTimeRef.current) {
          const now = new Date().getTime();
          const start = callStartTimeRef.current.getTime();
          const duration = Math.floor((now - start) / 1000);
          setFinalCallDuration(duration);
          setCallDuration(duration);
        }
        setIsCallActive(false);
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
        }
        // Loading summary is already set at the beginning of endCall
        handleCallEnd();
      }
    }
  };

  const handleCallEnd = async () => {
    try {
      // Shorter delay since we now get end-of-call-report directly
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate consultation summary
      const summary = await generateConsultationSummary();
      
      if (summary) {
        console.log('Generated consultation summary:', summary);
        setConsultationSummary(summary);
        
        // Save consultation to database
        try {
          const response = await fetch('/api/patient/consultations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
            },
            body: JSON.stringify(summary),
          });

          if (response.ok) {
            console.log('Consultation saved successfully');
            onConsultationEnd?.(summary);
          } else {
            const errorResult = await response.json();
            console.error('Failed to save consultation:', errorResult);
            setError(`Failed to save consultation summary: ${errorResult.error || 'Unknown error'}`);
          }
        } catch (err) {
          console.error('Failed to save consultation:', err);
          setError('Failed to save consultation summary due to network error');
        }
      } else {
        console.warn('No summary generated - no messages found');
      }
    } catch (error) {
      console.error('Error in handleCallEnd:', error);
      setError('Failed to process consultation summary');
    } finally {
      setIsGeneratingSummary(false);
      setShowSummary(true);
    }
  };

  const generateConsultationSummary = async (): Promise<ConversationSummary | null> => {
    if (messages.length === 0) return null;

    const transcriptText = messages
      .map(msg => `${msg.role === 'user' ? 'Patient' : 'AI Nurse'}: ${msg.content}`)
      .join('\n');

    let symptoms = 'No specific symptoms mentioned';
    let followUpContacts = profile?.city && profile?.state 
      ? `Recommended to contact local healthcare providers in ${profile.city}, ${profile.state}` 
      : 'Contact your primary care physician or local healthcare provider';

    // Use end-of-call-report data if available (highest priority)
    if (endOfCallReport && endOfCallReport.summary) {
      console.log('Using end-of-call-report summary:', endOfCallReport.summary);
      symptoms = endOfCallReport.summary;
      // You can customize this further based on the actual structure of the summary
    } else if (vapiAnalysisSummary) {
      // Fallback to VAPI analysis summary
      const sentences = vapiAnalysisSummary.split('. ').filter(s => s.trim().length > 0);
      if (sentences.length >= 2) {
        // First two sentences for symptoms
        symptoms = sentences.slice(0, 2).join('. ');
        if (!symptoms.endsWith('.')) symptoms += '.';
        
        // Last sentence for follow-up
        if (sentences.length > 2) {
          followUpContacts = sentences.slice(-1)[0];
          if (!followUpContacts.endsWith('.')) followUpContacts += '.';
        }
      } else if (sentences.length === 1) {
        symptoms = sentences[0];
        if (!symptoms.endsWith('.')) symptoms += '.';
      }
    } else {
      // Final fallback to extracting from user messages
      const userMessages = messages.filter(msg => msg.role === 'user');
      if (userMessages.length > 0) {
        symptoms = userMessages.map(msg => msg.content).join('; ');
      }
    }

    // Use transcript from end-of-call-report if available
    let finalTranscript = transcriptText;
    if (endOfCallReport && endOfCallReport.artifact && endOfCallReport.artifact.transcript) {
      console.log('Using end-of-call-report transcript');
      finalTranscript = endOfCallReport.artifact.transcript;
    }

    return {
      summary: `Voice consultation regarding: ${initialContext}`,
      symptoms,
      diagnosis: 'General consultation - no diagnosis provided',
      followUpContacts,
      disclaimer: 'This consultation was with an AI assistant and does not constitute professional medical advice. Please consult with a qualified healthcare professional for proper medical diagnosis and treatment.',
      duration: finalCallDuration || callDuration,
      transcript: finalTranscript,
    };
  };

  const toggleMute = () => {
    // Note: VAPI handles mute/unmute through the browser's media controls
    // For now, we'll just toggle the UI state
    setIsMuted(!isMuted);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSummaryClose = () => {
    console.log('Closing summary and resetting state');
    setShowSummary(false);
    setConsultationSummary(null);
    setTranscript(null);
    setInitialContext('');
    setCallDuration(0);
    setFinalCallDuration(0);
    setMessages([]);
    setIsGeneratingSummary(false);
    setVapiAnalysisSummary(null);
    setEndOfCallReport(null);
    setUserEndedCall(false); // Reset user ended call flag
    setIsCallActive(false); // Ensure call is not active
    setIsLoading(false); // Ensure loading is false
    
    // Clear any existing timers
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  };

  const handleSummarySave = async (editedSummary: ConversationSummary) => {
    try {
      // Update the consultation in the database
      const response = await fetch('/api/patient/consultations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        },
        body: JSON.stringify(editedSummary),
      });

      if (response.ok) {
        setConsultationSummary(editedSummary);
      }
    } catch (err) {
      console.error('Failed to update consultation:', err);
      setError('Failed to update consultation summary');
    }
  };

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Alert variant="destructive">
            <AlertDescription>
              Voice assistant is not available. Please check your configuration.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Show loading state when generating summary
  if (isGeneratingSummary) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Generating Consultation Summary...</h3>
            <p className="text-gray-600">Please wait while we process your consultation</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show consultation summary after call ends
  if (showSummary && consultationSummary) {
    return (
      <ConsultationSummary
        summary={consultationSummary}
        onClose={handleSummaryClose}
        onSave={handleSummarySave}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Initial Context Input */}
      {!isCallActive && (
        <Card>
          <CardHeader>
            <CardTitle>Start Voice Consultation</CardTitle>
            <CardDescription>
              Describe your current health concern or what you&apos;d like to discuss with the AI nurse
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="I've been experiencing headaches for the past few days..."
              value={initialContext}
              onChange={(e) => setInitialContext(e.target.value)}
              disabled={isCallActive}
              rows={3}
            />
            
            {error && (
              <Alert variant="destructive">
                <AlertDescription>
                  {error}
                  {error.includes('Failed to start voice consultation') && (
                    <div className="mt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setError('');
                          startCall();
                        }}
                      >
                        Try Again
                      </Button>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={startCall}
              disabled={isLoading || !initialContext.trim()}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                'Starting consultation...'
              ) : (
                <>
                  <Phone className="w-4 h-4 mr-2" />
                  Start Voice Consultation
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && !isCallActive && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">Connecting to AI Nurse...</h3>
              <p className="text-gray-600">Please wait while we establish the connection</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Call Interface */}
      {isCallActive && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse" />
                  Active Consultation
                </CardTitle>
                <CardDescription>
                  Speaking with AI Nurse Assistant
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatDuration(callDuration)}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Call Controls */}
            <div className="flex justify-center space-x-4">
              <Button
                variant={isMuted ? "destructive" : "outline"}
                size="lg"
                onClick={toggleMute}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>

              <Button
                variant="destructive"
                size="lg"
                onClick={endCall}
                style={{ cursor: "pointer" }}
              >
                <PhoneOff className="w-5 h-5 mr-2" />
                End Consultation
              </Button>

            </div>

            {/* Live Transcript - Always visible during call */}
            <Card className="bg-white shadow-lg border-2 border-blue-100">
              <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg flex items-center">
                    <MessageCircle className="w-5 h-5 mr-2 text-blue-600" />
                    Live Conversation
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-500">Recording</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="max-h-80 overflow-y-auto" ref={transcriptScrollRef}>
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageCircle className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500">Conversation will appear here...</p>
                      <p className="text-xs text-gray-400 mt-2">Start speaking to begin the transcript</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
                            message.role === 'user'
                              ? 'bg-blue-500 text-white rounded-br-md'
                              : 'bg-gray-100 text-gray-900 rounded-bl-md'
                          }`}
                        >
                          <div className="flex items-center mb-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${
                              message.role === 'user' ? 'bg-blue-400' : 'bg-gray-300'
                            }`}>
                              {message.role === 'user' ? (
                                <User className="w-3 h-3" />
                              ) : (
                                <Bot className="w-3 h-3" />
                              )}
                            </div>
                            <span className={`text-xs font-medium ${
                              message.role === 'user' ? 'text-blue-100' : 'text-gray-600'
                            }`}>
                              {message.role === 'user' ? 'You' : 'AI Nurse'}
                            </span>
                            <span className={`text-xs ml-2 ${
                              message.role === 'user' ? 'text-blue-200' : 'text-gray-500'
                            }`}>
                              {message.timestamp.toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed">{message.content}</p>
                        </div>
                      </div>
                    ))
                  )}

                  {transcript && (
                    <div className={`flex ${transcript.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm opacity-70 ${transcript.role === 'user' ? 'bg-blue-500 text-white rounded-br-md' : 'bg-gray-100 text-gray-900 rounded-bl-md'}`}>
                        <div className="flex items-center mb-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${transcript.role === 'user' ? 'bg-blue-400' : 'bg-gray-300'}`}>
                            {transcript.role === 'user' ? (
                              <User className="w-3 h-3" />
                            ) : (
                              <Bot className="w-3 h-3" />
                            )}
                          </div>
                          <span className={`text-xs font-medium ${transcript.role === 'user' ? 'text-blue-100' : 'text-gray-600'}`}>
                            {transcript.role === 'user' ? 'You' : 'AI Nurse'}
                          </span>
                          <span className={`text-xs ml-2 ${transcript.role === 'user' ? 'text-blue-200' : 'text-gray-500'}`}>
                            speaking...
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed">{transcript.content}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* AI Typing Indicator */}
                  {isSpeaking && (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] p-4 rounded-2xl rounded-bl-md bg-gray-100 text-gray-900 shadow-sm">
                        <div className="flex items-center mb-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center mr-2 bg-gray-300">
                            <Bot className="w-3 h-3" />
                          </div>
                          <span className="text-xs font-medium text-gray-600">AI Nurse</span>
                          <span className="text-xs ml-2 text-gray-500">speaking...</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-xs text-gray-500 ml-2">AI is thinking and speaking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
