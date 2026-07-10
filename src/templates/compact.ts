import type { CardTemplate } from "./types";

export const compactTemplate: CardTemplate = {
	id: "compact",
	label: "Compact",
	description: "Single-line title linking to the URL, no image or description.",
	render(data) {
		const container = activeDocument.createElement("div");
		container.className = "metadata-links";

		const link = container.createEl("a", {
			cls: "metadata-links-compact",
			href: data.url,
			text: data.title || data.url || "",
		});
		link.setAttribute("target", "_blank");
		link.setAttribute("rel", "noopener");

		return container;
	},
};
