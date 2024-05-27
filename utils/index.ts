import metadata, { MetaData } from "metadata-scraper";
import { Editor, requestUrl } from "obsidian";

/**
 * Retrieves metadata for a list of URLs.
 * @param urls - An array of URLs to retrieve metadata from.
 * @returns A promise that resolves to an array of metadata objects for each URL.
 */
export const getMetadataUrls = async (urls: string[]) => {
	const promises = await Promise.allSettled(
		urls.map((url) =>
			requestUrl(url).then(({ text }) => ({ html: text, url }))
		)
	);

	const values = promises.map((result) =>
		result.status === "fulfilled" ? result.value : result.reason
	);

	const data = await Promise.allSettled(
		values.map(({ html, url }) =>
			metadata({ html, url }).then(
				({ title, description, icon, image, url }) => ({
					title,
					description,
					icon,
					image,
					url,
				})
			)
		)
	);

	return data.map((result) =>
		result.status === "fulfilled" ? result.value : result.reason
	);
};

/**
 * Generates HTML code for a list of metadata items.
 * @param data - An array of metadata items.
 * @returns The generated HTML code.
 */
export const generateHtml = (data: Partial<MetaData>[]) =>
	data.map(
		({
			title,
			description,
			image,
			url,
		}) => `<div style="position: relative;"><a href="${url}" target="_blank" style="border: 1px solid var(--background-modifier-border); margin: 20px 0; border-radius: 3px; width: 100%; display: flex; text-decoration: none !important; background-color: var(--background-primary);"><div style="height: 100%; width: 35%; min-width: 120px; overflow: hidden; border-right: 1px solid var(--background-modifier-border);"><div style="background-image: url(${image}); background-position: center center; background-size: cover; background-repeat: no-repeat; padding-bottom: 120px; background-color: var(--background-secondary);"></div></div><div style="padding: 8px; width: 75%; overflow: hidden;"><h5 style="font-family: sans-serif; font-size: 1.125rem; margin: 0 0 4px 0; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; color: var(--text-normal);">${(
			title || ""
		)
			.replace(/\s{3,}/g, " ")
			.trim()}</h5><p style="font-family: sans-serif; font-size: 1rem; margin: 0; color: var(--text-muted); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${(
			description || ""
		)
			.replace(/\s{3,}/g, " ")
			.trim()}</p><p style="font-family: sans-serif; font-size: 1rem; margin: 0; color: var(--text-faint); display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;">${url}</p></div></a></div>
`
	);

/**
 * Generates Markdown links based on the provided metadata.
 *
 * @param data - An array of partial metadata objects.
 * @returns An array of Markdown links in the format `- [title](url): description`.
 */
export const generateMarkDown = (data: Partial<MetaData>[]) =>
	data.map(
		({ title, description, url }) => `- [${title}](${url}): ${description}`
	);

/**
 * Checks if there is a text selection in the editor.
 *
 * @param editor - The editor instance.
 * @returns The selected text if there is a selection, otherwise false.
 */
export const isTextSelection = (editor: Editor) =>
	editor.somethingSelected() ? editor.getSelection() : false;

/**
 * Checks if a given string is a valid URL.
 *
 * @param url - The string to be checked.
 * @returns `true` if the string is a valid URL, `false` otherwise.
 */
export const isValidURL = (url: string): boolean =>
	/^(https?:\/\/)?([a-zA-Z\d-]+\.)+[a-zA-Z]{2,6}(\/[\w .-]*)*(\?[\w=&%.-]*)?(#[\w-]*)?$/.test(
		url
	);

/**
 * Retrieves all URLs from the given text.
 * @param text - The text to search for URLs.
 * @returns An array of valid URLs found in the text.
 */
export const getUrls = (text: string): string[] => {
	const urls = text.match(/(https?:\/\/[^\s]+)/g) || [];
	return urls.filter((url) => isValidURL(url));
};

/**
 * Replaces markdown links in the given text with the URLs they point to.
 * @param text - The input text containing markdown links.
 * @param editor - The editor instance where the replacement will be made.
 */
export const undoMarkdown = (text: string, editor: Editor) => {
	const regex = /\[.*?\]\((https?:\/\/[^\s\)]+)\)/g;
	const urls = [...text.matchAll(regex)].map((match) => match[1]) || [];
	editor.replaceSelection(urls.join("\n"));
};

/**
 * Replaces HTML links in the given text with their corresponding URLs.
 *
 * @param text - The text containing HTML links.
 * @param editor - The editor instance.
 */
export const undoHtml = (text: string, editor: Editor) => {
	const regex = /href="(https?:\/\/[^"]+)/g;
	const urls = [...text.matchAll(regex)].map((match) => match[1]) || [];
	editor.replaceSelection(urls.join("\n"));
};
