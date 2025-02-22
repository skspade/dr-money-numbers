CREATE TYPE "public"."amount_threshold" AS ENUM('NORMAL', 'HIGH', 'VERY_HIGH');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('debit', 'credit', 'transfer');--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "confidence" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "merchantId" text;--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "recurringId" text;--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "originalDescription" text NOT NULL;--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "transactionType" "transaction_type" DEFAULT 'debit' NOT NULL;--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "processingTimestamp" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "schemaVersion" text DEFAULT '1.0.0' NOT NULL;--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "source" text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "amountThreshold" "amount_threshold" DEFAULT 'NORMAL' NOT NULL;--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "isWithinLimits" boolean DEFAULT true NOT NULL;