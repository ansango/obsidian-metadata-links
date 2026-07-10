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
