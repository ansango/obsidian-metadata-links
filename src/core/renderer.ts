import type { Plugin } from "obsidian";
import { getTemplate } from "../templates";
import { METADATA_BLOCK_LANGUAGE, parseMetadataBlockBody } from "../utils/logic";

export const registerMetadataLinksRenderer = (plugin: Plugin): void => {
	plugin.registerMarkdownCodeBlockProcessor(METADATA_BLOCK_LANGUAGE, (source, el) => {
		const data = parseMetadataBlockBody(source);
		const template = getTemplate(data.template);
		el.appendChild(template.render(data));
	});
};
