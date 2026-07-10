import { Editor, MarkdownView, Notice, Plugin } from "obsidian";
import { registerMetadataLinksRenderer } from "./renderer";
import { getMetadataUrls } from "./network";
import { MetadataLinksSettingTab } from "./settings-tab";
import { TEMPLATES } from "../templates";
import { DEFAULT_SETTINGS, type MetadataLinksSettings } from "./types";
import {
	extractMetadataBlockUrls,
	getUrls,
	serializeMetadataBlocks,
	type MetadataBlock,
} from "../utils/logic";

const isTextSelection = (editor: Editor) =>
	editor.somethingSelected() ? editor.getSelection() : false;

export default class MetadataLinksPlugin extends Plugin {
	settings: MetadataLinksSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new MetadataLinksSettingTab(this.app, this));
		registerMetadataLinksRenderer(this);

		this.addRibbonIcon("link", "Get Metadata Links", () => {
			const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (markdownView) {
				void this.mapUrls(markdownView.editor, this.settings.defaultTemplate);
			}
		});

		this.addRibbonIcon("unlink", "Undo Metadata links", () => {
			const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (markdownView) {
				this.unMapUrls(markdownView.editor);
			}
		});

		for (const template of TEMPLATES) {
			this.addCommand({
				id: `convert-selection-${template.id}`,
				name: `Convert selection (${template.label})`,
				editorCallback: (editor: Editor) => {
					void this.mapUrls(editor, template.id);
				},
			});
		}

		this.addCommand({
			id: "undo-selection",
			name: "Undo selection",
			editorCallback: (editor: Editor) => {
				this.unMapUrls(editor);
			},
		});

		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu, editor) => {
				if (!isTextSelection(editor)) return;

				for (const template of TEMPLATES) {
					menu.addItem((item) => {
						item
							.setTitle(`Convert selection to metadata link (${template.label})`)
							.setIcon("link")
							.onClick(() => {
								void this.mapUrls(editor, template.id);
							});
					});
				}

				menu.addItem((item) => {
					item
						.setTitle("Undo metadata links in selection")
						.setIcon("unlink")
						.onClick(() => {
							this.unMapUrls(editor);
						});
				});
			})
		);
	}

	unMapUrls(editor: Editor): void {
		const text = isTextSelection(editor);
		if (!text) {
			new Notice("Select almost a metadata link to convert");
			return;
		}

		const urls = extractMetadataBlockUrls(text);
		if (urls.length === 0) {
			new Notice("No metadata links found in selection");
			return;
		}

		editor.replaceSelection(urls.join("\n"));
		new Notice("Converted metadata links to URLs");
	}

	async mapUrls(editor: Editor, templateId: string) {
		const text = isTextSelection(editor);
		if (!text) {
			new Notice("Select almost a URL to convert");
			return;
		}

		try {
			const urls = getUrls(text);
			const data = await getMetadataUrls(urls);
			new Notice(`Found ${data.length} metadata links`);

			const blocks: MetadataBlock[] = data.map((entry) => ({
				...entry,
				template: templateId,
			}));
			const content = serializeMetadataBlocks(blocks);
			const previous = this.settings.replaceOnRender ? "" : text + "\n\n";
			editor.replaceSelection(previous + content);
			new Notice("Converted URLs to metadata links");
		} catch {
			new Notice("Error converting URLs to metadata links");
		}
	}

	async loadSettings() {
		const loaded = (await this.loadData()) as Partial<MetadataLinksSettings> | null;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, loaded);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
