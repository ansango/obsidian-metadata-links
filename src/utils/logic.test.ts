import { describe, expect, test } from "bun:test";
import {
	extractHtmlUrls,
	extractMarkdownUrls,
	generateHtml,
	generateMarkDown,
	getUrls,
	isValidURL,
	parseMetadata,
} from "./logic";

describe("isValidURL", () => {
	test("accepts http/https URLs", () => {
		expect(isValidURL("https://example.com")).toBe(true);
		expect(isValidURL("http://example.com/path?query=1")).toBe(true);
	});

	test("rejects non-URL text", () => {
		expect(isValidURL("not a url")).toBe(false);
	});
});

describe("getUrls", () => {
	test("extracts only valid URLs from text", () => {
		const text = "Check https://example.com and also not-a-url and http://foo.bar/baz";
		expect(getUrls(text)).toEqual(["https://example.com", "http://foo.bar/baz"]);
	});

	test("returns an empty array when there are no URLs", () => {
		expect(getUrls("no links here")).toEqual([]);
	});
});

describe("generateMarkDown", () => {
	test("formats metadata as a markdown list item", () => {
		const result = generateMarkDown([
			{ title: "Title", description: "Desc", url: "https://example.com" },
		]);
		expect(result).toEqual(["- [Title](https://example.com): Desc"]);
	});
});

describe("generateHtml", () => {
	test("includes the url, title and description in the generated markup", () => {
		const [html] = generateHtml([
			{ title: "Title", description: "Desc", url: "https://example.com", image: "img.png" },
		]);
		expect(html).toContain("https://example.com");
		expect(html).toContain("Title");
		expect(html).toContain("Desc");
	});
});

describe("extractMarkdownUrls", () => {
	test("extracts the URL from a markdown link", () => {
		expect(extractMarkdownUrls("- [Title](https://example.com): Desc")).toEqual([
			"https://example.com",
		]);
	});
});

describe("extractHtmlUrls", () => {
	test("extracts the URL from an href attribute", () => {
		expect(extractHtmlUrls('<a href="https://example.com">link</a>')).toEqual([
			"https://example.com",
		]);
	});
});

describe("parseMetadata", () => {
	test("extracts title, description and image from Open Graph tags", () => {
		const html = `
			<html><head>
				<title>Fallback Title</title>
				<meta property="og:title" content="OG Title" />
				<meta property="og:description" content="OG Description" />
				<meta property="og:image" content="/img.png" />
				<link rel="icon" href="/favicon.ico" />
			</head></html>
		`;
		const result = parseMetadata(html, "https://example.com/page");
		expect(result.title).toBe("OG Title");
		expect(result.description).toBe("OG Description");
		expect(result.image).toBe("https://example.com/img.png");
		expect(result.icon).toBe("https://example.com/favicon.ico");
		expect(result.url).toBe("https://example.com/page");
	});

	test("falls back to <title> and meta description when Open Graph tags are missing", () => {
		const html = `
			<html><head>
				<title>Plain Title</title>
				<meta name="description" content="Plain Description" />
			</head></html>
		`;
		const result = parseMetadata(html, "https://example.com");
		expect(result.title).toBe("Plain Title");
		expect(result.description).toBe("Plain Description");
	});

	test("returns undefined fields when nothing matches", () => {
		const result = parseMetadata("<html><head></head></html>", "https://example.com");
		expect(result.title).toBeUndefined();
		expect(result.description).toBeUndefined();
		expect(result.image).toBeUndefined();
		expect(result.icon).toBeUndefined();
	});
});
