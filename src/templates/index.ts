import { cardTemplate } from "./card";
import { compactTemplate } from "./compact";
import type { CardTemplate } from "./types";

export const TEMPLATES: CardTemplate[] = [cardTemplate, compactTemplate];

export const DEFAULT_TEMPLATE_ID = cardTemplate.id;

export const getTemplate = (id: string): CardTemplate =>
	TEMPLATES.find((template) => template.id === id) || cardTemplate;

export type { CardTemplate };
