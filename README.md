# Obsidian Metadata Links

**Obsidian Metadata Links** is a plugin for Obsidian that fetches metadata (title, description, image, icon) for the URLs in your selection and stores it as a `metadata-links` code block, which is then rendered as a card in Reading view and Live Preview.

## Features

- **Convert selection**: select one or more URLs and convert them into `metadata-links` code blocks holding their fetched metadata.
- **Multiple templates**: choose how each link is rendered — currently `Card` (image, title, description, URL) and `Compact` (single-line title linking to the URL). Pick the template per-conversion from the editor context menu, or set a default used by the command palette.
- **Undo**: convert `metadata-links` code blocks in a selection back into plain URLs.
- **Settings**: choose the default template, whether conversions replace or append to the selection, and see the list of available templates.

### The `metadata-links` code block

Converting a URL inserts a block like this into your note:

````
```metadata-links
template: card
title: Example Site
description: This is a description
image: https://example.com/img.png
icon: https://example.com/favicon.ico
url: https://example.com
```
````

The plugin renders this block into the corresponding template. Editing the fields by hand and switching the `template` value re-renders it with a different template.

## Installation

1. **Clone the Repository**:
   Clone this repository into the `plugins` folder of your Obsidian vault.
   ```sh
   git clone https://github.com/ansango/obsidian-metadata-links.git
   ```

2. **Build the Plugin**:
   Navigate to the cloned repository directory and run the build command.
   ```sh
   cd obsidian-metadata-links
   bun install
   bun run build
   ```

3. **Enable the Plugin**:
   Open Obsidian and go to `Settings` > `Community plugins`. You should see "Metadata Links" in the list. Enable it to start using the plugin.

## Usage

1. **Convert a selection**:
   Highlight one or more URLs in a note, right-click and choose "Convert selection to metadata link" with the template you want, or run "Convert selection (Card/Compact)" from the command palette.

2. **Undo a conversion**:
   Select the `metadata-links` code block(s) you want to revert, then use "Undo metadata links in selection" from the context menu or the "Undo selection" command.

3. **Choose a template per link**:
   If a page doesn't expose much metadata (no image/description), pick the `Compact` template instead of `Card` from the context menu.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Obsidian](https://obsidian.md/) for providing an excellent platform for note-taking and knowledge management.
- [Obsidian Plugin API](https://publish.obsidian.md/api/) for enabling plugin development.

For any questions or support, please open an issue in the repository.
