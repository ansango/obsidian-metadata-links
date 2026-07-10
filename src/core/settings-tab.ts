import { App, PluginSettingTab, Setting } from "obsidian";
import type MetadataLinksPlugin from "./main";

export class MetadataLinksSettingTab extends PluginSettingTab {
	private plugin: MetadataLinksPlugin;

	constructor(app: App, plugin: MetadataLinksPlugin) {
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
