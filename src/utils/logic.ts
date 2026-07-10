// Pure logic, free of Obsidian imports, so it can be unit tested in plain Node/Bun.

export interface UrlMetadata {
	title?: string;
	description?: string;
	icon?: string;
	image?: string;
	url?: string;
}

/**
 * Checks if a given string is a valid URL.
 */
export const isValidURL = (url: string): boolean =>
	/^(https?:\/\/)?([a-zA-Z\d-]+\.)+[a-zA-Z]{2,6}(\/[\w .-]*)*(\?[\w=&%.-]*)?(#[\w-]*)?$/.test(
		url
	);

/**
 * Retrieves all valid URLs from the given text.
 */
export const getUrls = (text: string): string[] => {
	const urls = text.match(/(https?:\/\/[^\s]+)/g) || [];
	return urls.filter((url) => isValidURL(url));
};

const decodeHtmlEntities = (value: string): string =>
	value
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#0?39;/g, "'");

const matchMetaContent = (html: string, patterns: RegExp[]): string | undefined => {
	for (const pattern of patterns) {
		const match = html.match(pattern);
		if (match?.[1]) return decodeHtmlEntities(match[1].trim());
	}
	return undefined;
};

const resolveUrl = (value: string | undefined, baseUrl: string): string | undefined => {
	if (!value) return undefined;
	try {
		return new URL(value, baseUrl).toString();
	} catch {
		return undefined;
	}
};

/**
 * Extracts basic page metadata (title, description, icon, image) from raw HTML
 * using lightweight regex matching, without relying on a DOM/HTML parser.
 */
export const parseMetadata = (html: string, url: string): UrlMetadata => {
	const title =
		matchMetaContent(html, [
			/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i,
			/<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:title["']/i,
		]) ?? matchMetaContent(html, [/<title[^>]*>([^<]*)<\/title>/i]);

	const description = matchMetaContent(html, [
		/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i,
		/<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:description["']/i,
		/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i,
		/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i,
	]);

	const image = matchMetaContent(html, [
		/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)["']/i,
		/<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:image["']/i,
	]);

	const icon = matchMetaContent(html, [
		/<link[^>]+rel=["'](?:shortcut icon|icon|apple-touch-icon)["'][^>]+href=["']([^"']*)["']/i,
		/<link[^>]+href=["']([^"']*)["'][^>]+rel=["'](?:shortcut icon|icon|apple-touch-icon)["']/i,
	]);

	return {
		title,
		description,
		image: resolveUrl(image, url),
		icon: resolveUrl(icon, url),
		url,
	};
};

export interface MetadataBlock extends UrlMetadata {
	template: string;
}

export const METADATA_BLOCK_LANGUAGE = "metadata-links";

const BLOCK_FIELDS: (keyof MetadataBlock)[] = [
	"template",
	"title",
	"description",
	"image",
	"icon",
	"url",
];

const escapeFieldValue = (value: string): string => value.replace(/\r?\n/g, " ").trim();

/**
 * Serializes a single metadata entry into the body of a `metadata-links` code block
 * (without the surrounding fences).
 */
export const serializeMetadataBlockBody = (data: MetadataBlock): string =>
	BLOCK_FIELDS.filter((field) => data[field])
		.map((field) => `${field}: ${escapeFieldValue(String(data[field]))}`)
		.join("\n");

/**
 * Serializes a list of metadata entries into one fenced `metadata-links` code block per entry.
 */
export const serializeMetadataBlocks = (data: MetadataBlock[]): string =>
	data
		.map(
			(entry) =>
				`\`\`\`${METADATA_BLOCK_LANGUAGE}\n${serializeMetadataBlockBody(entry)}\n\`\`\``
		)
		.join("\n\n");

/**
 * Parses the body of a `metadata-links` code block (as received by
 * `registerMarkdownCodeBlockProcessor`, i.e. without the fences) into structured metadata.
 */
export const parseMetadataBlockBody = (source: string): MetadataBlock => {
	const result: Record<string, string> = {};

	for (const line of source.split("\n")) {
		const separatorIndex = line.indexOf(":");
		if (separatorIndex === -1) continue;

		const key = line.slice(0, separatorIndex).trim();
		const value = line.slice(separatorIndex + 1).trim();
		if (key && value) result[key] = value;
	}

	return {
		template: result.template || "",
		title: result.title,
		description: result.description,
		image: result.image,
		icon: result.icon,
		url: result.url,
	};
};

/**
 * Extracts the URLs referenced by `url:` fields inside every `metadata-links`
 * code block found in the given text.
 */
export const extractMetadataBlockUrls = (text: string): string[] => {
	const blockRegex = new RegExp(
		"```" + METADATA_BLOCK_LANGUAGE + "\\n([\\s\\S]*?)```",
		"g"
	);
	const urls: string[] = [];

	for (const match of text.matchAll(blockRegex)) {
		const { url } = parseMetadataBlockBody(match[1]);
		if (url) urls.push(url);
	}

	return urls;
};
