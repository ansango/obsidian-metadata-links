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

/**
 * Generates HTML markup for a list of metadata items.
 */
export const generateHtml = (data: UrlMetadata[]): string[] =>
	data.map(({ title, description, image, url }) => {
		const cleanTitle = (title || "").replace(/\s{3,}/g, " ").trim();
		const cleanDescription = (description || "").replace(/\s{3,}/g, " ").trim();
		return `<div class="obsidian-meta-links"><a href="${url}" target="_blank" class="obsidian-meta-links-card"><div class="obsidian-meta-links-image" style="background-image: url(${image});"></div><div class="obsidian-meta-links-body"><h5 class="obsidian-meta-links-title">${cleanTitle}</h5><p class="obsidian-meta-links-description">${cleanDescription}</p><p class="obsidian-meta-links-url">${url}</p></div></a></div>
`;
	});

/**
 * Generates Markdown links based on the provided metadata.
 */
export const generateMarkDown = (data: UrlMetadata[]): string[] =>
	data.map(({ title, description, url }) => `- [${title}](${url}): ${description}`);

/**
 * Extracts the URLs pointed to by Markdown links in the given text.
 */
export const extractMarkdownUrls = (text: string): string[] => {
	const regex = /\[.*?\]\((https?:\/\/[^\s)]+)\)/g;
	return [...text.matchAll(regex)].map((match) => match[1]);
};

/**
 * Extracts the URLs referenced by `href` attributes in the given HTML text.
 */
export const extractHtmlUrls = (text: string): string[] => {
	const regex = /href="(https?:\/\/[^"]+)/g;
	return [...text.matchAll(regex)].map((match) => match[1]);
};
