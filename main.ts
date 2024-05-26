import { App, Editor, MarkdownView, Notice, Plugin, PluginSettingTab, Setting, requestUrl } from 'obsidian';
import metadata from "metadata-scraper";
// Remember to rename these classes and interfaces!

interface MetadataLinksSettings {
	render: string;
}

const DEFAULT_SETTINGS: MetadataLinksSettings = {
	render: 'html',
}

export default class MetadataLinks extends Plugin {
	settings: MetadataLinksSettings;

	async onload() {
		await this.loadSettings();
		this.settings
		// This creates an icon in the left ribbon.
		this.addRibbonIcon('dice', 'Metadata links', (evt: MouseEvent) => {

			new Notice('This is a notice!');
			const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);

			if (markdownView) {
				const editor = markdownView.editor;
				this.mapUrls(editor, this.settings);
			}
		});


		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				this.mapUrls(editor, this.settings);
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new MetadataLinksSettingTab(this.app, this));
	}

	onunload() {
		console.log("unloading plugin");
	}

	isValidURL(url: string): boolean {
		const urlRegex = /^(https?:\/\/)?([a-zA-Z\d-]+\.)+[a-zA-Z]{2,6}(\/[\w .-]*)*(\?[\w=&%.-]*)?(#[\w-]*)?$/;
		return urlRegex.test(url);
	}

	getUrls(text: string): string[] {
		const urls = text.match(/(https?:\/\/[^\s]+)/g) || [];
		return urls.filter(url => this.isValidURL(url));
	}



	async mapUrls(editor: Editor, { render }: MetadataLinksSettings): Promise<void> {
		const text = editor.somethingSelected()
			? editor.getSelection().trim()
			: false;

		if (text) {
			const urls = this.getUrls(text)
			try {
				const results = await Promise.allSettled(urls.map(url => requestUrl(url).then(({ text }) => ({ html: text, url })))).then(results => results.map(result => result.status === 'fulfilled' ? result.value : result.reason));
				const data = await Promise.allSettled(results.map(({ html, url }) => metadata({ html, url }).then(({ title, description, icon, image, url }) => ({ title, description, icon, image, url })))).then(results => results.map(result => result.status === 'fulfilled' ? result.value : result.reason));
				new Notice(`Found ${data.length} metadata links`);
				const previousSelection = text + "\n\n";
				const plain = data.map(({ title, description, url }) => `- [${title}](${url}): ${description}`).join("\n\n");
				const html = data
					.map(
						({
							title,
							description,
							image,
							url,
						}) => `<div style="position: relative;"><a href="${url}" target="_blank" style="border: 1px solid var(--background-modifier-border); margin: 20px 0; border-radius: 3px; width: 100%; display: flex; text-decoration: none !important; background-color: var(--background-primary);"><div style="height: 100px; width: 35%; min-width: 120px; overflow: hidden; border-right: 1px solid var(--background-modifier-border);"><div style="background-image: url(${image}); background-position: center center; background-size: cover; background-repeat: no-repeat; padding-bottom: 100px; background-color: var(--background-secondary);"></div></div><div style="padding: 4px; width: 75%; overflow: hidden;"><h5 style="font-family: sans-serif; font-size: 16px; margin: 0 0 4px 0; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; color: var(--text-normal);">${(
							title || ""
						)
							.replace(/\s{3,}/g, " ")
							.trim()}</h5><p style="font-family: sans-serif; font-size: 14px; margin: 0; color: var(--text-muted); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${(
							description || ""
						)
							.replace(/\s{3,}/g, " ")
							.trim()}</p><p style="font-family: sans-serif; font-size: 14px; margin: 0; color: var(--text-faint); display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;">${url}</p></div></a></div>
`
					)
					.join("\n\n");
				editor.replaceSelection(previousSelection + (render === 'html' ? html : plain) + "\n\n");
				new Notice("Converted URLs to metadata links");
			} catch (error) {
				new Notice("Error converting URLs to metadata links");
			}

		} else {
			new Notice("Select almost a URL to convert");
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
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
			.setName('Choose how to render metadata links')
			.setDesc('By default, metadata links are rendered as HTML')
			.addText(text => text
				.setPlaceholder('html || markdown')
				.setValue(this.plugin.settings.render)
				.onChange(async (value) => {
					this.plugin.settings.render = value;
					await this.plugin.saveSettings();
				}));

	}
}
