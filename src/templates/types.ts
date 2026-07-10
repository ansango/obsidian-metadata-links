import type { UrlMetadata } from "../utils/logic";

export interface CardTemplate {
	id: string;
	label: string;
	description: string;
	render(data: UrlMetadata): HTMLElement;
}
