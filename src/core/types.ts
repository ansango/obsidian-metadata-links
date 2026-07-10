import { DEFAULT_TEMPLATE_ID } from "../templates";

export interface MetadataLinksSettings {
	defaultTemplate: string;
	replaceOnRender: boolean;
}

export const DEFAULT_SETTINGS: MetadataLinksSettings = {
	defaultTemplate: DEFAULT_TEMPLATE_ID,
	replaceOnRender: false,
};
