CREATE TABLE "businesses" (
	"id" uuid PRIMARY KEY NOT NULL,
	"job_id" uuid NOT NULL,
	"google_place_id" text NOT NULL,
	"name" text,
	"website_url" text,
	"phone" text,
	"address" text,
	"google_maps_url" text,
	"rating" numeric,
	"review_count" integer,
	"business_status" text,
	"raw" jsonb,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "search_jobs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"query" text NOT NULL,
	"requested_limit" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"total_found" integer DEFAULT 0 NOT NULL,
	"total_with_website" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_job_id_search_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."search_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "businesses_job_place_unique" ON "businesses" USING btree ("job_id","google_place_id");