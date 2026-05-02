import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  uuid,
  numeric,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const searchJobs = pgTable("search_jobs", {
  id: uuid("id").primaryKey(),

  query: text("query").notNull(),
  requestedLimit: integer("requested_limit").notNull(),

  status: text("status").notNull().default("pending"),
  errorMessage: text("error_message"),

  totalFound: integer("total_found").notNull().default(0),
  totalWithWebsite: integer("total_with_website").notNull().default(0),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const businesses = pgTable(
  "businesses",
  {
    id: uuid("id").primaryKey(),

    jobId: uuid("job_id")
      .notNull()
      .references(() => searchJobs.id, { onDelete: "cascade" }),

    googlePlaceId: text("google_place_id").notNull(),

    name: text("name"),
    websiteUrl: text("website_url"),
    phone: text("phone"),
    address: text("address"),
    googleMapsUrl: text("google_maps_url"),

    rating: numeric("rating"),
    reviewCount: integer("review_count"),

    businessStatus: text("business_status"),

    raw: jsonb("raw"),

    fetchedAt: timestamp("fetched_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
  },
  (table: typeof businesses) => ({
    uniqueBusinessPerJob: uniqueIndex("businesses_job_place_unique").on(
      table.jobId,
      table.googlePlaceId,
    ),
  }),
);
