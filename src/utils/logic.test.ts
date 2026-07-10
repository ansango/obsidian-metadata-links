import { describe, expect, test } from "bun:test";
import {
	extractMetadataBlockUrls,
	getUrls,
	isValidURL,
	parseMetadata,
	parseMetadataBlockBody,
	serializeMetadataBlockBody,
	serializeMetadataBlocks,
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

describe("serializeMetadataBlockBody / parseMetadataBlockBody", () => {
	test("round-trips a metadata entry", () => {
		const entry = {
			template: "card",
			title: "My Site",
			description: "This is a description",
			image: "https://example.com/img.png",
			icon: "https://example.com/favicon.ico",
			url: "https://example.com",
		};

		const body = serializeMetadataBlockBody(entry);
		expect(body).toContain("template: card");
		expect(body).toContain("url: https://example.com");

		const parsed = parseMetadataBlockBody(body);
		expect(parsed).toEqual(entry);
	});

	test("omits empty fields when serializing", () => {
		const body = serializeMetadataBlockBody({ template: "compact", url: "https://example.com" });
		expect(body).not.toContain("description");
		expect(body).not.toContain("image");
	});

	test("ignores lines without a colon when parsing", () => {
		const parsed = parseMetadataBlockBody("title: Hello\nnot a valid line\nurl: https://example.com");
		expect(parsed.title).toBe("Hello");
		expect(parsed.url).toBe("https://example.com");
	});
});

describe("serializeMetadataBlocks", () => {
	test("wraps each entry in its own metadata-links fenced block", () => {
		const result = serializeMetadataBlocks([
			{ template: "card", title: "One", url: "https://one.com" },
			{ template: "compact", title: "Two", url: "https://two.com" },
		]);

		expect(result).toContain("```metadata-links\ntemplate: card");
		expect(result).toContain("```metadata-links\ntemplate: compact");
		expect(result.match(/```metadata-links/g)?.length).toBe(2);
	});
});

describe("extractMetadataBlockUrls", () => {
	test("extracts the url field from every metadata-links block in the text", () => {
		const text = [
			"```metadata-links",
			"template: card",
			"title: One",
			"url: https://one.com",
			"```",
			"",
			"```metadata-links",
			"template: compact",
			"url: https://two.com",
			"```",
		].join("\n");

		expect(extractMetadataBlockUrls(text)).toEqual([
			"https://one.com",
			"https://two.com",
		]);
	});

	test("returns an empty array when there are no metadata-links blocks", () => {
		expect(extractMetadataBlockUrls("just some text")).toEqual([]);
	});
});
