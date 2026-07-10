import type { CardTemplate } from "./types";

export const cardTemplate: CardTemplate = {
	id: "card",
	label: "Card",
	description: "Full card with image, title, description and URL.",
	render(data) {
		const container = activeDocument.createElement("div");
		container.className = "metadata-links";

		const link = container.createEl("a", {
			cls: "metadata-links-card",
			href: data.url,
		});
		link.setAttribute("target", "_blank");
		link.setAttribute("rel", "noopener");

		const image = link.createDiv({ cls: "metadata-links-card-image" });
		if (data.image) {
			image.style.backgroundImage = `url(${data.image})`;
		}

		const body = link.createDiv({ cls: "metadata-links-card-body" });
		body.createEl("h5", { cls: "metadata-links-card-title", text: data.title || "" });
		body.createEl("p", {
			cls: "metadata-links-card-description",
			text: data.description || "",
		});
		body.createEl("p", { cls: "metadata-links-card-url", text: data.url || "" });

		return container;
	},
};
