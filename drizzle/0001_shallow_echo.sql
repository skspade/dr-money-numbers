CREATE TABLE "userBudget" (
	"userId" text PRIMARY KEY NOT NULL,
	"monthlyIncome" integer DEFAULT 0 NOT NULL,
	"targetSavings" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "userBudget" ADD CONSTRAINT "userBudget_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;