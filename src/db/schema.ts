import { pgTable, varchar, timestamp, text, uuid, date } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Users table for authentication
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// HL7 FHIR US Core Patient compliant profile
export const patientProfiles = pgTable('patient_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull().unique(),
  
  // Basic Demographics (HL7 FHIR required)
  dateOfBirth: date('date_of_birth'),
  gender: varchar('gender', { length: 20 }), // male, female, other, unknown
  
  // Contact Information
  phoneNumber: varchar('phone_number', { length: 20 }),
  alternatePhone: varchar('alternate_phone', { length: 20 }),
  
  // Address Information (US Core Patient)
  streetAddress: varchar('street_address', { length: 255 }),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 50 }),
  zipCode: varchar('zip_code', { length: 10 }),
  country: varchar('country', { length: 50 }).default('United States'),
  
  // Emergency Contact
  emergencyContactName: varchar('emergency_contact_name', { length: 200 }),
  emergencyContactPhone: varchar('emergency_contact_phone', { length: 20 }),
  emergencyContactRelationship: varchar('emergency_contact_relationship', { length: 50 }),
  
  // Insurance Information
  insuranceProvider: varchar('insurance_provider', { length: 200 }),
  insurancePolicyNumber: varchar('insurance_policy_number', { length: 100 }),
  insuranceGroupNumber: varchar('insurance_group_number', { length: 100 }),
  
  // Medical Identifiers
  medicalRecordNumber: varchar('medical_record_number', { length: 50 }),
  
  // Preferences
  preferredLanguage: varchar('preferred_language', { length: 50 }).default('English'),
  communicationPreference: varchar('communication_preference', { length: 20 }).default('email'), // email, phone, sms
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Medical History Conditions
export const medicalConditions = pgTable('medical_conditions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  
  // Condition Information
  conditionName: varchar('condition_name', { length: 255 }).notNull(),
  conditionCode: varchar('condition_code', { length: 50 }), // ICD-10 or SNOMED codes
  severity: varchar('severity', { length: 20 }), // mild, moderate, severe
  status: varchar('status', { length: 20 }).default('active'), // active, inactive, resolved
  
  // Dates
  onsetDate: date('onset_date'),
  diagnosisDate: date('diagnosis_date'),
  resolutionDate: date('resolution_date'),
  
  // Additional Information
  description: text('description'),
  notes: text('notes'),
  diagnosedBy: varchar('diagnosed_by', { length: 255 }), // Healthcare provider
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Current Medications
export const medications = pgTable('medications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  
  // Medication Information
  medicationName: varchar('medication_name', { length: 255 }).notNull(),
  genericName: varchar('generic_name', { length: 255 }),
  dosage: varchar('dosage', { length: 100 }),
  frequency: varchar('frequency', { length: 100 }),
  route: varchar('route', { length: 50 }), // oral, injection, topical, etc.
  
  // Dates
  startDate: date('start_date'),
  endDate: date('end_date'),
  
  // Status and Notes
  status: varchar('status', { length: 20 }).default('active'), // active, inactive, discontinued
  prescribedBy: varchar('prescribed_by', { length: 255 }),
  purpose: text('purpose'),
  notes: text('notes'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Allergies and Adverse Reactions
export const allergies = pgTable('allergies', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  
  // Allergy Information
  allergen: varchar('allergen', { length: 255 }).notNull(),
  allergenType: varchar('allergen_type', { length: 50 }), // food, medication, environmental, other
  severity: varchar('severity', { length: 20 }), // mild, moderate, severe, life-threatening
  
  // Reaction Information
  reaction: text('reaction'),
  onsetDate: date('onset_date'),
  
  // Status
  status: varchar('status', { length: 20 }).default('active'), // active, inactive, resolved
  verificationStatus: varchar('verification_status', { length: 20 }).default('unconfirmed'), // confirmed, unconfirmed, refuted
  
  // Additional Information
  notes: text('notes'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Family Medical History
export const familyHistory = pgTable('family_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  
  // Relationship and Condition
  relationship: varchar('relationship', { length: 50 }).notNull(), // mother, father, sibling, etc.
  condition: varchar('condition', { length: 255 }).notNull(),
  ageOfOnset: varchar('age_of_onset', { length: 20 }),
  ageAtDeath: varchar('age_at_death', { length: 20 }),
  causeOfDeath: varchar('cause_of_death', { length: 255 }),
  
  // Additional Information
  notes: text('notes'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Past Consultations table for storing AI conversation summaries
export const pastConsultations = pgTable('past_consultations', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  summary: text('summary').notNull(),
  symptoms: text('symptoms'),
  diagnosis: text('diagnosis'),
  followUpContacts: text('follow_up_contacts'),
  disclaimer: text('disclaimer').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users, {
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Invalid email format'),
  passwordHash: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
});

export const selectUserSchema = createSelectSchema(users);

// Patient Profile Schema (includes userId for database operations)
export const insertPatientProfileSchema = createInsertSchema(patientProfiles, {
  dateOfBirth: z.string().optional().refine((date) => !date || date === '' || !isNaN(Date.parse(date)), 'Invalid date format'),
  gender: z.enum(['male', 'female', 'other', 'unknown']).optional(),
  phoneNumber: z.string().optional().refine((phone) => !phone || phone === '' || /^[\+]?[1-9][\d]{0,15}$/.test(phone), 'Invalid phone number format'),
  alternatePhone: z.string().optional().refine((phone) => !phone || phone === '' || /^[\+]?[1-9][\d]{0,15}$/.test(phone), 'Invalid phone number format'),
  zipCode: z.string().optional().refine((zip) => !zip || zip === '' || /^\d{5}(-\d{4})?$/.test(zip), 'Invalid ZIP code format'),
  emergencyContactPhone: z.string().optional().refine((phone) => !phone || phone === '' || /^[\+]?[1-9][\d]{0,15}$/.test(phone), 'Invalid phone number format'),
  communicationPreference: z.enum(['email', 'phone', 'sms']).optional().default('email'),
});

// Patient Profile Schema for client input (excludes userId)
export const insertPatientProfileClientSchema = insertPatientProfileSchema.omit({ userId: true });

// Medical Condition Schema (includes userId for database operations)
export const insertMedicalConditionSchema = createInsertSchema(medicalConditions, {
  conditionName: z.string().min(1, 'Condition name is required').max(255),
  severity: z.enum(['mild', 'moderate', 'severe']).optional(),
  status: z.enum(['active', 'inactive', 'resolved']).optional().default('active'),
  onsetDate: z.string().optional().refine((date) => !date || date === '' || !isNaN(Date.parse(date)), 'Invalid date format'),
  diagnosisDate: z.string().optional().refine((date) => !date || date === '' || !isNaN(Date.parse(date)), 'Invalid date format'),
  resolutionDate: z.string().optional().refine((date) => !date || date === '' || !isNaN(Date.parse(date)), 'Invalid date format'),
});

// Medical Condition Schema for client input (excludes userId)
export const insertMedicalConditionClientSchema = insertMedicalConditionSchema.omit({ userId: true });

// Medication Schema
export const insertMedicationSchema = createInsertSchema(medications, {
  medicationName: z.string().min(1, 'Medication name is required').max(255),
  dosage: z.string().max(100).optional(),
  frequency: z.string().max(100).optional(),
  route: z.enum(['oral', 'injection', 'topical', 'inhalation', 'other']).optional(),
  status: z.enum(['active', 'inactive', 'discontinued']).default('active'),
  startDate: z.string().optional().refine((date) => !date || !isNaN(Date.parse(date)), 'Invalid date format'),
  endDate: z.string().optional().refine((date) => !date || !isNaN(Date.parse(date)), 'Invalid date format'),
});

// Allergy Schema
export const insertAllergySchema = createInsertSchema(allergies, {
  allergen: z.string().min(1, 'Allergen is required').max(255),
  allergenType: z.enum(['food', 'medication', 'environmental', 'other']).optional(),
  severity: z.enum(['mild', 'moderate', 'severe', 'life-threatening']).optional(),
  status: z.enum(['active', 'inactive', 'resolved']).default('active'),
  verificationStatus: z.enum(['confirmed', 'unconfirmed', 'refuted']).default('unconfirmed'),
  onsetDate: z.string().optional().refine((date) => !date || !isNaN(Date.parse(date)), 'Invalid date format'),
});

// Family History Schema
export const insertFamilyHistorySchema = createInsertSchema(familyHistory, {
  relationship: z.string().min(1, 'Relationship is required').max(50),
  condition: z.string().min(1, 'Condition is required').max(255),
  ageOfOnset: z.string().max(20).optional(),
  ageAtDeath: z.string().max(20).optional(),
});

// Consultation Schema (includes userId for database operations)
export const insertConsultationSchema = createInsertSchema(pastConsultations, {
  summary: z.string().min(1),
  symptoms: z.string().optional(),
  diagnosis: z.string().optional(),
  followUpContacts: z.string().optional(),
  disclaimer: z.string().min(1),
});

// Consultation Schema for client input (excludes userId)
export const insertConsultationClientSchema = insertConsultationSchema.omit({ userId: true });

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type PatientProfile = typeof patientProfiles.$inferSelect;
export type NewPatientProfile = typeof patientProfiles.$inferInsert;

export type MedicalCondition = typeof medicalConditions.$inferSelect;
export type NewMedicalCondition = typeof medicalConditions.$inferInsert;

export type Medication = typeof medications.$inferSelect;
export type NewMedication = typeof medications.$inferInsert;

export type Allergy = typeof allergies.$inferSelect;
export type NewAllergy = typeof allergies.$inferInsert;

export type FamilyHistory = typeof familyHistory.$inferSelect;
export type NewFamilyHistory = typeof familyHistory.$inferInsert;

export type PastConsultation = typeof pastConsultations.$inferSelect;
export type NewPastConsultation = typeof pastConsultations.$inferInsert;
