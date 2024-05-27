import {
	App,
	Editor,
	MarkdownView,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";

import {
	generateHtml,
	generateMarkDown,
	getMetadataUrls,
	getUrls,
	isTextSelection,
	undoHtml,
	undoMarkdown,
} from "utils";
// Remember to rename these classes and interfaces!

interface MetadataLinksSettings {
	render: string;
	replaceOnRender: boolean;
}

const DEFAULT_SETTINGS: MetadataLinksSettings = {
	render: "html",
	replaceOnRender: false,
};

export default class MetadataLinks extends Plugin {
	settings: MetadataLinksSettings;

	async onload() {
		await this.loadSettings();
		this.settings;
		// This creates an icon in the left ribbon.
		this.addRibbonIcon("link", "Get Metadata Links", (evt: MouseEvent) => {
			const markdownView =
				this.app.workspace.getActiveViewOfType(MarkdownView);

			if (markdownView) {
				const editor = markdownView.editor;
				this.mapUrls(editor, this.settings);
			}
		});

		this.addRibbonIcon(
			"unlink",
			"Undo Metadata links",
			(evt: MouseEvent) => {
				const markdownView =
					this.app.workspace.getActiveViewOfType(MarkdownView);

				if (markdownView) {
					const editor = markdownView.editor;
					this.unMapUrls(editor);
				}
			}
		);

		this.addCommand({
			id: "metadata-links-convert",
			name: "Convert selection",
			editorCallback: (editor: Editor) => {
				this.mapUrls(editor, this.settings);
			},
		});

		this.addCommand({
			id: "metadata-links-undo",
			name: "Undo selection",
			editorCallback: (editor: Editor) => {
				this.unMapUrls(editor);
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new MetadataLinksSettingTab(this.app, this));
	}

	unMapUrls(editor: Editor): void {
		const text = isTextSelection(editor);
		if (!text) {
			new Notice("Select almost a metadata link to convert");
			return;
		}

		if (text.includes("[")) {
			undoMarkdown(text, editor);
		}

		if (text.includes("<a") && text.includes("href")) {
			undoHtml(text, editor);
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
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class MetadataLinksSettingTab extends PluginSettingTab {
	plugin: MetadataLinks;

	constructor(app: App, plugin: MetadataLinks) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		new Setting(containerEl)
			.setName("Choose how to render metadata links")
			.setDesc("By default, metadata links are rendered as HTML")
			.addText((text) =>
				text
					.setPlaceholder("html || markdown")
					.setValue(this.plugin.settings.render)
					.onChange(async (value) => {
						this.plugin.settings.render = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Replace on render")
			.setDesc(
				"By default, metadata links are appended not replacing the current selection"
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.replaceOnRender)
					.onChange(async (value) => {
						this.plugin.settings.replaceOnRender = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
