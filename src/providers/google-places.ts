import { ApifyClient } from "apify-client";
import { env } from "../env";

const client = new ApifyClient({
  token: env.APIFY_API_TOKEN,
});

const ACTOR_ID = "compass/crawler-google-places";

export type ApifyPlaceResult = {
  placeId?: string;
  name?: string;
  address?: string;
  website?: string;
  phone?: string;
  url?: string; // Google Maps URL
  rating?: number;
  reviewCount?: number;
  permanentlyClosed?: boolean;
  temporarilyClosed?: boolean;
  categoryMain?: string;
  categories?: string[];
  city?: string;
  postalCode?: string;
  state?: string;
  countryCode?: string;
  location?: {
    lat?: number;
    lng?: number;
  };
};

export async function searchGooglePlaces(params: {
  query: string;
  location?: string;
  limit: number;
}): Promise<ApifyPlaceResult[]> {
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

  return items as ApifyPlaceResult[];
}
