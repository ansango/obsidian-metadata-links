import { Editor, MarkdownView, Notice, Plugin } from "obsidian";
import {
	extractHtmlUrls,
	extractMarkdownUrls,
	generateHtml,
	generateMarkDown,
	getUrls,
} from "../utils/logic";
import { getMetadataUrls } from "./network";
import { MetadataLinksSettingTab } from "./settings-tab";
import { DEFAULT_SETTINGS, type MetadataLinksSettings } from "./types";

const isTextSelection = (editor: Editor) =>
	editor.somethingSelected() ? editor.getSelection() : false;

export default class MetadataLinksPlugin extends Plugin {
	settings: MetadataLinksSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new MetadataLinksSettingTab(this.app, this));

		this.addRibbonIcon("link", "Get Metadata Links", () => {
			const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (markdownView) {
				this.mapUrls(markdownView.editor, this.settings);
			}
		});

		this.addRibbonIcon("unlink", "Undo Metadata links", () => {
			const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (markdownView) {
				this.unMapUrls(markdownView.editor);
			}
		});

		this.addCommand({
			id: "metadata-links-convert",
			name: "Convert selection",
			editorCallback: (editor: Editor) => {
				void this.mapUrls(editor, this.settings);
			},
		});

		this.addCommand({
			id: "metadata-links-undo",
			name: "Undo selection",
			editorCallback: (editor: Editor) => {
				this.unMapUrls(editor);
			},
		});

		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu, editor) => {
				if (!isTextSelection(editor)) return;

				menu.addItem((item) => {
					item
						.setTitle("Convert selection to metadata links")
						.setIcon("link")
						.onClick(() => {
							void this.mapUrls(editor, this.settings);
						});
				});

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

		if (text.includes("[")) {
			editor.replaceSelection(extractMarkdownUrls(text).join("\n"));
		}

		if (text.includes("<a") && text.includes("href")) {
			editor.replaceSelection(extractHtmlUrls(text).join("\n"));
		}

		new Notice("Converted metadata links to URLs");
	}

	async mapUrls(editor: Editor, settings: MetadataLinksSettings) {
		const text = isTextSelection(editor);
		if (!text) {
			new Notice("Select almost a URL to convert");
			return;
		}

		try {
			const urls = getUrls(text);
			const data = await getMetadataUrls(urls);
			new Notice(`Found ${data.length} metadata links`);
			const markdown = generateMarkDown(data);
			const html = generateHtml(data);
			const previous = settings.replaceOnRender ? "" : text + "\n\n";
			const content = settings.render === "html" ? html : markdown;
			editor.replaceSelection(previous + content.join("\n"));
			new Notice("Converted URLs to metadata links");
		} catch (error) {
			new Notice("Error converting URLs to metadata links");
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
