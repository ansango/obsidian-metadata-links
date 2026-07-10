import metadata from "metadata-scraper";
import { requestUrl } from "obsidian";
import type { UrlMetadata } from "../utils/logic";

/**
 * Retrieves metadata for a list of URLs.
 */
export const getMetadataUrls = async (urls: string[]): Promise<UrlMetadata[]> => {
	const promises = await Promise.allSettled(
		urls.map((url) => requestUrl(url).then(({ text }) => ({ html: text, url })))
	);

	const values = promises.map((result) =>
		result.status === "fulfilled" ? result.value : result.reason
	);

	const data = await Promise.allSettled(
		values.map(({ html, url }) =>
			metadata({ html, url }).then(({ title, description, icon, image, url }) => ({
				title,
				description,
				icon,
				image,
				url,
			}))
		)
	);

	return data.map((result) =>
		result.status === "fulfilled" ? result.value : result.reason
	);
};
