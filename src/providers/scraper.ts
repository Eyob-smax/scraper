import { ApifyClient } from "apify-client";
import { env } from "../env";

const client = new ApifyClient({
  token: env.APIFY_API_TOKEN,
});

const ACTOR_ID = "compass/crawler-google-places";

export type ScrapedPlace = {
  placeId?: string;

  // Core info
  title?: string;
  subTitle?: string;
  description?: string;
  price?: string;
  website?: string;
  phone?: string;
  phoneUnformatted?: string;
  url?: string;
  imageUrl?: string;

  // Address
  address?: string;
  street?: string;
  neighborhood?: string;
  city?: string;
  postalCode?: string;
  state?: string;
  countryCode?: string;

  // Coordinates
  location?: {
    lat?: number;
    lng?: number;
  };

  // Categories
  categoryName?: string;
  categories?: string[];

  // Ratings & reviews
  totalScore?: number;
  reviewsCount?: number;
  imagesCount?: number;
  reviewsTags?: unknown[];

  // Status
  permanentlyClosed?: boolean;
  temporarilyClosed?: boolean;
  claimThisBusiness?: boolean;

  // Rich data
  openingHours?: unknown[];
  additionalInfo?: Record<string, unknown>;
  peopleAlsoSearch?: unknown[];

  // Online ordering & reservations
  menu?: string;
  reserveTableUrl?: string;

  // Search metadata
  rank?: number;
  searchString?: string;
  isAdvertisement?: boolean;
};

export async function searchPlaces(params: {
  query: string;
  location?: string;
  limit: number;
}): Promise<ScrapedPlace[]> {
  const input = {
    searchStringsArray: [params.query],
    locationQuery: params.location ?? "",
    maxCrawledPlacesPerSearch: params.limit,
    language: "en",
    scrapeSocialMediaProfiles: {
      facebooks: false,
      instagrams: false,
      youtubes: false,
      tiktoks: false,
      twitters: false,
    },
    maximumLeadsEnrichmentRecords: 0,
  };

  const run = await client
    .actor(ACTOR_ID)
    .call(input);

  const { items } = await client
    .dataset(run.defaultDatasetId)
    .listItems();

  return items as ScrapedPlace[];
}
