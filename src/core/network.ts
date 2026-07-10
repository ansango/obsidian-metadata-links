import { requestUrl } from "obsidian";
import { parseMetadata, type UrlMetadata } from "../utils/logic";

/**
 * Retrieves metadata for a list of URLs.
 */
export const getMetadataUrls = async (urls: string[]): Promise<UrlMetadata[]> => {
	const results = await Promise.allSettled(
		urls.map(async (url) => {
			const { text } = await requestUrl(url);
			return parseMetadata(text, url);
		})
	);

	return results.map((result, index) =>
		result.status === "fulfilled" ? result.value : { url: urls[index] }
	);
};
