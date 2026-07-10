import { App, PluginSettingTab, Setting } from "obsidian";
import { TEMPLATES } from "../templates";
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
			.setName("Default template")
			.setDesc("Template used when converting a selection from the command palette.")
			.addDropdown((dropdown) => {
				for (const template of TEMPLATES) {
					dropdown.addOption(template.id, template.label);
				}
				dropdown.setValue(this.plugin.settings.defaultTemplate).onChange(async (value) => {
					this.plugin.settings.defaultTemplate = value;
					await this.plugin.saveSettings();
				});
			});

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

		new Setting(containerEl).setName("Available templates").setHeading();

		const list = containerEl.createEl("ul", { cls: "metadata-links-settings-templates" });
		for (const template of TEMPLATES) {
			const item = list.createEl("li");
			item.createEl("strong", { text: template.label });
			item.createSpan({ text: ` — ${template.description}` });
		}
	}
}
