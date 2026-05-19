import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  uuid,
  numeric,
  boolean,
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

    placeId: text("place_id").notNull(),

    // ── Core info ──
    name: text("name"),
    description: text("description"),
    price: text("price"),
    websiteUrl: text("website_url"),
    phone: text("phone"),
    phoneUnformatted: text("phone_unformatted"),
    mapsUrl: text("maps_url"),
    imageUrl: text("image_url"),

    // ── Address breakdown ──
    address: text("address"),
    street: text("street"),
    neighborhood: text("neighborhood"),
    city: text("city"),
    postalCode: text("postal_code"),
    state: text("state"),
    countryCode: text("country_code"),

    // ── Coordinates ──
    latitude: numeric("latitude"),
    longitude: numeric("longitude"),

    // ── Categories ──
    categoryName: text("category_name"),
    categories: jsonb("categories"),

    // ── Ratings & reviews ──
    rating: numeric("rating"),
    reviewCount: integer("review_count"),
    imagesCount: integer("images_count"),

    // ── Status ──
    businessStatus: text("business_status"),
    permanentlyClosed: boolean("permanently_closed"),
    temporarilyClosed: boolean("temporarily_closed"),
    claimThisBusiness: boolean("claim_this_business"),

    // ── Rich data (JSON) ──
    openingHours: jsonb("opening_hours"),
    additionalInfo: jsonb("additional_info"),
    reviewsTags: jsonb("reviews_tags"),
    peopleAlsoSearch: jsonb("people_also_search"),

    // ── Online ordering & reservations ──
    menu: text("menu"),
    reserveTableUrl: text("reserve_table_url"),

    // ── Search metadata ──
    rank: integer("rank"),

    // ── Raw data ──
    raw: jsonb("raw"),

    // ── Timestamps ──
    fetchedAt: timestamp("fetched_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
  },
  (table: typeof businesses) => ({
    uniqueBusinessPerJob: uniqueIndex("businesses_job_place_unique").on(
      table.jobId,
      table.placeId,
    ),
  }),
);
