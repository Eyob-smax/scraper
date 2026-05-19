import { eq } from "drizzle-orm";
import { db } from "../db";
import { businesses, searchJobs } from "../db/schema";
import { searchPlaces } from "../providers/scraper";

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
    const places = await searchPlaces({
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
      placeId: place.placeId ?? crypto.randomUUID(),

      // Core info
      name: place.title ?? null,
      description: place.description ?? null,
      price: place.price ?? null,
      websiteUrl: place.website ?? null,
      phone: place.phone ?? null,
      phoneUnformatted: place.phoneUnformatted ?? null,
      mapsUrl: place.url ?? null,
      imageUrl: place.imageUrl ?? null,

      // Address breakdown
      address: place.address ?? null,
      street: place.street ?? null,
      neighborhood: place.neighborhood ?? null,
      city: place.city ?? null,
      postalCode: place.postalCode ?? null,
      state: place.state ?? null,
      countryCode: place.countryCode ?? null,

      // Coordinates
      latitude:
        place.location?.lat == null ? null : String(place.location.lat),
      longitude:
        place.location?.lng == null ? null : String(place.location.lng),

      // Categories
      categoryName: place.categoryName ?? null,
      categories: place.categories ?? null,

      // Ratings & reviews
      rating: place.totalScore == null ? null : String(place.totalScore),
      reviewCount: place.reviewsCount ?? null,
      imagesCount: place.imagesCount ?? null,

      // Status
      businessStatus: place.permanentlyClosed
        ? "CLOSED_PERMANENTLY"
        : place.temporarilyClosed
          ? "CLOSED_TEMPORARILY"
          : "OPERATIONAL",
      permanentlyClosed: place.permanentlyClosed ?? false,
      temporarilyClosed: place.temporarilyClosed ?? false,
      claimThisBusiness: place.claimThisBusiness ?? null,

      // Rich data (JSON)
      openingHours: place.openingHours ?? null,
      additionalInfo: place.additionalInfo ?? null,
      reviewsTags: place.reviewsTags ?? null,
      peopleAlsoSearch: place.peopleAlsoSearch ?? null,

      // Online ordering & reservations
      menu: place.menu ?? null,
      reserveTableUrl: place.reserveTableUrl ?? null,

      // Search metadata
      rank: place.rank ?? null,

      // Raw data
      raw: place,

      // Timestamps
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
        placeId: row.placeId,
        name: row.name,
        description: row.description,
        price: row.price,
        websiteUrl: row.websiteUrl,
        phone: row.phone,
        phoneUnformatted: row.phoneUnformatted,
        mapsUrl: row.mapsUrl,
        imageUrl: row.imageUrl,

        address: row.address,
        street: row.street,
        neighborhood: row.neighborhood,
        city: row.city,
        postalCode: row.postalCode,
        state: row.state,
        countryCode: row.countryCode,

        latitude: row.latitude,
        longitude: row.longitude,

        categoryName: row.categoryName,
        categories: row.categories,

        rating: row.rating,
        reviewCount: row.reviewCount,
        imagesCount: row.imagesCount,

        businessStatus: row.businessStatus,
        permanentlyClosed: row.permanentlyClosed,
        temporarilyClosed: row.temporarilyClosed,

        openingHours: row.openingHours,

        menu: row.menu,
        reserveTableUrl: row.reserveTableUrl,

        rank: row.rank,
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
