export interface MetadataLinksSettings {
	render: string;
	replaceOnRender: boolean;
}

export const DEFAULT_SETTINGS: MetadataLinksSettings = {
	render: "html",
	replaceOnRender: false,
};
