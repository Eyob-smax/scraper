import { env } from "../env";

const GOOGLE_TEXT_SEARCH_URL =
  "https://places.googleapis.com/v1/places:searchText";

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.websiteUri",
  "places.internationalPhoneNumber",
  "places.googleMapsUri",
  "places.rating",
  "places.userRatingCount",
  "places.businessStatus",
].join(",");

export type GooglePlaceResult = {
  id?: string;
  displayName?: {
    text?: string;
    languageCode?: string;
  };
  formattedAddress?: string;
  websiteUri?: string;
  internationalPhoneNumber?: string;
  googleMapsUri?: string;
  rating?: number;
  userRatingCount?: number;
  businessStatus?: string;
};

export async function searchGooglePlacesText(params: {
  query: string;
  limit: number;
}): Promise<GooglePlaceResult[]> {
  const pageSize = Math.min(Math.max(params.limit, 1), 20);

  const response = await fetch(GOOGLE_TEXT_SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": env.GOOGLE_PLACES_API_KEY,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery: params.query,
      pageSize,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Google Places request failed with status ${response.status}: ${errorText}`,
    );
  }

  const data = await response.json();

  return data.places ?? [];
}
