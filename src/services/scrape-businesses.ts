import { eq } from "drizzle-orm";
import { db } from "../db";
import { businesses, searchJobs } from "../db/schema";
import { searchGooglePlacesText } from "../providers/google-places";

export type ScrapeBusinessesInput = {
  query: string;
  limit: number;
};

export async function scrapeBusinesses(input: ScrapeBusinessesInput) {
  const jobId = crypto.randomUUID();

  await db.insert(searchJobs).values({
    id: jobId,
    query: input.query,
    requestedLimit: input.limit,
    status: "running",
  });

  try {
    const places = await searchGooglePlacesText({
      query: input.query,
      limit: input.limit,
    });

    const placesWithWebsite = places.filter((place) =>
      Boolean(place.websiteUri),
    );

    const rows = placesWithWebsite.map((place) => ({
      id: crypto.randomUUID(),
      jobId,
      googlePlaceId: place.id ?? crypto.randomUUID(),

      name: place.displayName?.text ?? null,
      websiteUrl: place.websiteUri ?? null,
      phone: place.internationalPhoneNumber ?? null,
      address: place.formattedAddress ?? null,
      googleMapsUrl: place.googleMapsUri ?? null,

      rating: place.rating == null ? null : String(place.rating),
      reviewCount: place.userRatingCount ?? null,
      businessStatus: place.businessStatus ?? null,

      raw: place,

      // Temporary cache example: 30 days.
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    }));

    if (rows.length > 0) {
      await db.insert(businesses).values(rows).onConflictDoNothing();
    }

    await db
      .update(searchJobs)
      .set({
        status: "completed",
        totalFound: places.length,
        totalWithWebsite: placesWithWebsite.length,
        completedAt: new Date(),
      })
      .where(eq(searchJobs.id, jobId));

    return {
      jobId,
      query: input.query,
      totalFound: places.length,
      totalWithWebsite: placesWithWebsite.length,
      businesses: rows.map((row) => ({
        name: row.name,
        websiteUrl: row.websiteUrl,
        phone: row.phone,
        address: row.address,
        googleMapsUrl: row.googleMapsUrl,
        rating: row.rating,
        reviewCount: row.reviewCount,
        googlePlaceId: row.googlePlaceId,
      })),
    };
  } catch (error) {
    await db
      .update(searchJobs)
      .set({
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        completedAt: new Date(),
      })
      .where(eq(searchJobs.id, jobId));

    throw error;
  }
}
