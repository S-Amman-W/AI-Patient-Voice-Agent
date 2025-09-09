import Vapi from '@vapi-ai/web';
import { PatientProfile, MedicalCondition, PastConsultation } from '@/db/schema';

// VAPI Configuration
export const createVapiInstance = () => {
  if (!process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY) {
    throw new Error('VAPI_PUBLIC_KEY is required');
  }
  
  return new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY);
};

// Generate patient context for the AI assistant
export const generatePatientContext = (
  profile: PatientProfile | null,
  conditions: MedicalCondition[],
  pastConsultations: PastConsultation[],
  initialContext?: string
): string => {
  let context = `You are a compassionate AI nurse assistant helping a patient. You should provide helpful, general medical guidance while always emphasizing that this is not a substitute for professional medical care.

IMPORTANT DISCLAIMERS TO ALWAYS REMEMBER:
- Always remind patients that this is general guidance, not professional medical advice
- Encourage patients to consult with healthcare professionals for proper diagnosis and treatment
- Provide local hospital/clinic contact information when appropriate
- Be empathetic and supportive while maintaining professional boundaries

`;

  // Add patient profile information
  if (profile) {
    context += `PATIENT PROFILE:
- Name: Patient (keep confidential)
- Age: ${profile.dateOfBirth ? calculateAge(profile.dateOfBirth) : 'Unknown'}
- Gender: ${profile.gender || 'Not specified'}
- Location: ${profile.city && profile.state ? `${profile.city}, ${profile.state}` : 'Not specified'}
- Preferred Language: ${profile.preferredLanguage || 'English'}
- Emergency Contact: ${profile.emergencyContactName ? `${profile.emergencyContactName} (${profile.emergencyContactRelationship})` : 'Not provided'}

`;
  }

  // Add current medical conditions
  if (conditions.length > 0) {
    context += `CURRENT MEDICAL CONDITIONS:
`;
    conditions.forEach(condition => {
      context += `- ${condition.conditionName}`;
      if (condition.severity) context += ` (${condition.severity})`;
      if (condition.status) context += ` - Status: ${condition.status}`;
      if (condition.onsetDate) context += ` - Since: ${condition.onsetDate}`;
      if (condition.description) context += ` - ${condition.description}`;
      context += '\n';
    });
    context += '\n';
  }

  // Add recent consultation history (last 3)
  if (pastConsultations.length > 0) {
    context += `RECENT CONSULTATION HISTORY (Last 3):
`;
    pastConsultations.slice(-3).forEach((consultation, index) => {
      context += `${index + 1}. ${new Date(consultation.createdAt).toLocaleDateString()}:
   - Summary: ${consultation.summary}
   - Symptoms: ${consultation.symptoms || 'None recorded'}
   - Follow-up: ${consultation.followUpContacts || 'None specified'}
`;
    });
    context += '\n';
  }

  // Add current consultation context
  if (initialContext) {
    context += `CURRENT CONSULTATION CONTEXT:
The patient has indicated: "${initialContext}"

Please address their current concern while considering their medical history and past consultations.

`;
  }

  context += `RESPONSE GUIDELINES:
- Be warm, empathetic, and professional
- Ask clarifying questions to better understand their situation
- Provide general health guidance and comfort
- Always remind them to seek professional medical care for proper diagnosis
- If they mention symptoms that could be serious, gently encourage immediate medical attention
- Offer to help them find local healthcare resources
- Keep responses conversational and not overly clinical
- End conversations with a summary and next steps

Remember: You are providing supportive guidance, not medical diagnosis or treatment.`;

  return context;
};

// Helper function to calculate age
const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// VAPI Assistant Configuration (handled in VAPI dashboard)
// The patient context will be sent to the assistant via system message or variables

// Types for VAPI events
export interface VapiMessage {
  type: 'conversation-update' | 'speech-update' | 'transcript' | 'hang' | 'call-start' | 'call-end';
  transcript?: string;
  role?: 'user' | 'assistant';
  content?: string;
  timestamp?: string;
}

export interface ConversationSummary {
  summary: string;
  symptoms: string;
  diagnosis: string;
  followUpContacts: string;
  disclaimer: string;
  duration: number;
  transcript: string;
}
