import { eq } from "drizzle-orm";
import { db } from "../db";
import { businesses, searchJobs } from "../db/schema";
import { searchGooglePlaces } from "../providers/google-places";

export type ScrapeBusinessesInput = {
  query: string;
  location?: string;
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
    const places = await searchGooglePlaces({
      query: input.query,
      location: input.location,
      limit: input.limit,
    });

    const placesWithWebsite = places.filter((place) =>
      Boolean(place.website),
    );

    const rows = placesWithWebsite.map((place) => ({
      id: crypto.randomUUID(),
      jobId,
      googlePlaceId: place.placeId ?? crypto.randomUUID(),

      name: place.name ?? null,
      websiteUrl: place.website ?? null,
      phone: place.phone ?? null,
      address: place.address ?? null,
      googleMapsUrl: place.url ?? null,

      rating: place.rating == null ? null : String(place.rating),
      reviewCount: place.reviewCount ?? null,
      businessStatus: place.permanentlyClosed
        ? "CLOSED_PERMANENTLY"
        : place.temporarilyClosed
          ? "CLOSED_TEMPORARILY"
          : "OPERATIONAL",

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
