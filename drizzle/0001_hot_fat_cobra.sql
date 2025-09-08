CREATE TABLE "allergies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"allergen" varchar(255) NOT NULL,
	"allergen_type" varchar(50),
	"severity" varchar(20),
	"reaction" text,
	"onset_date" date,
	"status" varchar(20) DEFAULT 'active',
	"verification_status" varchar(20) DEFAULT 'unconfirmed',
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"relationship" varchar(50) NOT NULL,
	"condition" varchar(255) NOT NULL,
	"age_of_onset" varchar(20),
	"age_at_death" varchar(20),
	"cause_of_death" varchar(255),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medical_conditions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"condition_name" varchar(255) NOT NULL,
	"condition_code" varchar(50),
	"severity" varchar(20),
	"status" varchar(20) DEFAULT 'active',
	"onset_date" date,
	"diagnosis_date" date,
	"resolution_date" date,
	"description" text,
	"notes" text,
	"diagnosed_by" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"medication_name" varchar(255) NOT NULL,
	"generic_name" varchar(255),
	"dosage" varchar(100),
	"frequency" varchar(100),
	"route" varchar(50),
	"start_date" date,
	"end_date" date,
	"status" varchar(20) DEFAULT 'active',
	"prescribed_by" varchar(255),
	"purpose" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date_of_birth" date,
	"gender" varchar(20),
	"phone_number" varchar(20),
	"alternate_phone" varchar(20),
	"street_address" varchar(255),
	"city" varchar(100),
	"state" varchar(50),
	"zip_code" varchar(10),
	"country" varchar(50) DEFAULT 'United States',
	"emergency_contact_name" varchar(200),
	"emergency_contact_phone" varchar(20),
	"emergency_contact_relationship" varchar(50),
	"insurance_provider" varchar(200),
	"insurance_policy_number" varchar(100),
	"insurance_group_number" varchar(100),
	"medical_record_number" varchar(50),
	"preferred_language" varchar(50) DEFAULT 'English',
	"communication_preference" varchar(20) DEFAULT 'email',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "patient_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
DROP TABLE "patient_history" CASCADE;--> statement-breakpoint
ALTER TABLE "allergies" ADD CONSTRAINT "allergies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_history" ADD CONSTRAINT "family_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_conditions" ADD CONSTRAINT "medical_conditions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medications" ADD CONSTRAINT "medications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_profiles" ADD CONSTRAINT "patient_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;