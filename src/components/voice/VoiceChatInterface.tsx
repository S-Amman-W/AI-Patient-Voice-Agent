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
import { createVapiInstance, ConversationSummary, generatePatientContext } from '@/lib/vapi';
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
  const [callDuration, setCallDuration] = useState(0);
  // const [showTranscript, setShowTranscript] = useState(true); // Always showing transcript during calls
  const [consultationSummary, setConsultationSummary] = useState<ConversationSummary | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentRole, setCurrentRole] = useState<string|null>(null);
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);

  const vapiRef = useRef<Vapi | null>(null);
  const callStartTimeRef = useRef<Date | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize VAPI
    try {
      vapiRef.current = createVapiInstance();
      setIsConnected(true);
    } catch (err) {
      setError('Failed to initialize voice assistant. Please check your VAPI configuration.');
      console.error('VAPI initialization error:', err);
    }

    return () => {
      if (vapiRef.current && isCallActive) {
        vapiRef.current.stop();
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [isCallActive]);

  useEffect(() => {
    if (!vapiRef.current) return;

    const handleMessage = (message: any) => {
      console.log('VAPI Message:', message);

      switch (message.type) {
        case 'call-start':
          console.log('Call started');
          setIsCallActive(true);
          setError('');
          callStartTimeRef.current = new Date();
          startDurationTimer();
          break;

        case 'call-end':
          console.log('Call ended');
          setIsCallActive(false);
          if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
          }
          handleCallEnd();
          break;

        case 'speech-start':
          console.log('Speech started:', message);
          setIsSpeaking(true);
          setCurrentRole('assistant');
          break;

        case 'speech-end':
          console.log('Speech ended:', message);
          setIsSpeaking(false);
          setCurrentRole('user');
          break;

        case 'transcript':
          console.log('Transcript received:', message);
          if (message.transcript) {
            // Check if this is a partial transcript (still being spoken)
            const {role, transcript, transcriptType} = message;
            if (transcriptType === 'partial') {
              setCurrentTranscript(transcript);
              setCurrentRole(role);
            } else if (transcriptType === 'final') {
              setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: role || 'user',
                content: transcript,
                timestamp: new Date(),
              }]);
              setCurrentTranscript('');
              setCurrentRole(null);
            }
          }
          break;

        case 'error':
          console.error('VAPI Error in message:', message);
          setError('Voice assistant error occurred');
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

    const handleCallEndEvent = () => {
      console.log('Call end event triggered');
      setIsCallActive(false);
      setIsLoading(false);
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      handleCallEnd();
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
    durationIntervalRef.current = setInterval(() => {
      if (callStartTimeRef.current) {
        const duration = Math.floor((new Date().getTime() - callStartTimeRef.current.getTime()) / 1000);
        setCallDuration(duration);
      }
    }, 1000);
  };

  const startCall = async () => {
    if (!vapiRef.current || !initialContext.trim()) {
      setError('Please provide context about your current health concern before starting the consultation.');
      return;
    }

    setIsLoading(true);
    setError('');
    setCallDuration(0);

    try {
      // Clean the assistant key by removing any trailing characters
      const assistantKey = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_KEY?.trim().replace(/[%\s]+$/, '');
      
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
      try {
        vapiRef.current.stop();
        // Set a timeout to handle call end if the event doesn't fire
        setTimeout(() => {
          if (isCallActive) {
            console.log('Force ending call due to timeout');
            setIsCallActive(false);
            if (durationIntervalRef.current) {
              clearInterval(durationIntervalRef.current);
            }
            handleCallEnd();
          }
        }, 2000);
      } catch (err) {
        console.error('Error ending call:', err);
        // Force end the call
        setIsCallActive(false);
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
        }
        handleCallEnd();
      }
    }
  };

  const handleCallEnd = async () => {
    // Generate consultation summary
    const summary = await generateConsultationSummary();
    
    if (summary) {
      setConsultationSummary(summary);
      setShowSummary(true);
      
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
    }
  };

  const generateConsultationSummary = async (): Promise<ConversationSummary | null> => {
    if (messages.length === 0) return null;

    const transcriptText = messages
      .map(msg => `${msg.role === 'user' ? 'Patient' : 'AI Nurse'}: ${msg.content}`)
      .join('\n');

    // Extract key information (you could enhance this with AI summarization)
    const userMessages = messages.filter(msg => msg.role === 'user');
    const symptoms = userMessages.map(msg => msg.content).join('; ');

    return {
      summary: `Voice consultation regarding: ${initialContext}`,
      symptoms: symptoms || 'No specific symptoms mentioned',
      diagnosis: 'General consultation - no diagnosis provided',
      followUpContacts: profile?.city && profile?.state 
        ? `Recommended to contact local healthcare providers in ${profile.city}, ${profile.state}` 
        : 'Contact your primary care physician or local healthcare provider',
      disclaimer: 'This consultation was with an AI assistant and does not constitute professional medical advice. Please consult with a qualified healthcare professional for proper medical diagnosis and treatment.',
      duration: callDuration,
      transcript: transcriptText,
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
    setShowSummary(false);
    setConsultationSummary(null);
    setMessages([]);
    setCurrentTranscript('');
    setCurrentRole(null);
    setInitialContext('');
    setCallDuration(0);
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
              <CardContent className="max-h-80 overflow-y-auto">
                <div className="space-y-4">
                  {currentTranscript.length === 0 ? (
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

                  {currentTranscript.length > 0 && (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] p-4 rounded-2xl rounded-bl-md bg-gray-100 text-gray-900 shadow-sm">
                        <p className="text-sm leading-relaxed">{currentTranscript}</p>
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
                {/* Auto-scroll to bottom */}
                <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })} />
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
