import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { organizationGraph } from "@/lib/seo/organization";
import { buildLlmsFullTxt, buildLlmsTxt, KEY_PAGES } from "@/lib/seo/llms";
import { CRAWLERS, identifyCrawler, isAiReferrer } from "@/lib/analytics/crawlers";
import { SERVICE_CATEGORY_SPECS } from "@/lib/services/category-map";
import { publicCategoryCatalog } from "@/lib/seo/catalog";

/**
 * These invariants are what keeps the graph from quietly decaying. The one
 * that matters most is the duplicate-identity check: a second business node
 * with its own id and its own name is one clinic claiming to be two, and it
 * shipped to production once already.
 */

function walkNodes(value, visit) {
  if (Array.isArray(value)) {
    value.forEach((entry) => walkNodes(entry, visit));
    return;
  }
  if (!value || typeof value !== "object") {
    return;
  }
  if (value["@type"]) {
    visit(value);
  }
  Object.values(value).forEach((entry) => walkNodes(entry, visit));
}

function collectReferences(value, found = []) {
  if (Array.isArray(value)) {
    value.forEach((entry) => collectReferences(entry, found));
    return found;
  }
  if (!value || typeof value !== "object") {
    return found;
  }
  const keys = Object.keys(value);
  if (keys.length === 1 && keys[0] === "@id") {
    found.push(value["@id"]);
  }
  Object.values(value).forEach((entry) => collectReferences(entry, found));
  return found;
}

const graph = organizationGraph();

describe("organization graph", () => {
  it("declares every node with a type and an id", () => {
    walkNodes(graph["@graph"], (node) => {
      expect(node["@type"]).toBeTruthy();
    });
    graph["@graph"].forEach((node) => {
      expect(node["@id"]).toMatch(/^https:\/\//);
    });
  });

  it("never binds one id to two types or two names", () => {
    const seen = new Map();
    walkNodes(graph["@graph"], (node) => {
      if (!node["@id"]) return;
      const signature = JSON.stringify([node["@type"], node.name ?? null]);
      const previous = seen.get(node["@id"]);
      if (previous) {
        expect(previous).toBe(signature);
      } else {
        seen.set(node["@id"], signature);
      }
    });
  });

  it("resolves every reference to a node declared somewhere in the graph", () => {
    const declared = new Set();
    walkNodes(graph["@graph"], (node) => {
      if (node["@id"]) declared.add(node["@id"]);
    });
    collectReferences(graph["@graph"]).forEach((id) => {
      expect(declared.has(id)).toBe(true);
    });
  });

  it("uses absolute urls only", () => {
    walkNodes(graph["@graph"], (node) => {
      if (typeof node.url === "string") {
        expect(node.url).toMatch(/^https?:\/\//);
      }
    });
  });

  it("publishes a dialable E.164 phone number", () => {
    const org = graph["@graph"][0];
    expect(org.telephone).toMatch(/^\+[1-9]\d{7,14}$/);
  });

  it("publishes only non-empty http profiles in sameAs", () => {
    const org = graph["@graph"][0];
    expect(Array.isArray(org.sameAs)).toBe(true);
    expect(org.sameAs.length).toBeGreaterThan(0);
    org.sameAs.forEach((profile) => expect(profile).toMatch(/^https?:\/\//));
  });

  it("offers every catalog category exactly once", () => {
    const offers = graph["@graph"][0].hasOfferCatalog.itemListElement;
    expect(offers).toHaveLength(SERVICE_CATEGORY_SPECS.length);
    const ids = offers.map((entry) => entry.item.itemOffered["@id"]);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("no second business identity", () => {
  const ROOT = process.cwd();
  const BUSINESS_TYPES = ["LocalBusiness", "MedicalClinic", "MedicalOrganization"];
  // The clinic is declared here and nowhere else.
  const ALLOWED = [path.join("lib", "seo", "organization.js")];

  function sourceFiles(dir, found = []) {
    readdirSync(dir).forEach((entry) => {
      if (entry === "node_modules" || entry.startsWith(".")) return;
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) {
        sourceFiles(full, found);
      } else if (/\.jsx?$/.test(entry)) {
        found.push(full);
      }
    });
    return found;
  }

  it("declares a business node in exactly one module", () => {
    const offenders = [...sourceFiles(path.join(ROOT, "app")), ...sourceFiles(path.join(ROOT, "lib"))]
      .filter((file) => !ALLOWED.some((allowed) => file.endsWith(allowed)))
      .filter((file) => {
        const source = readFileSync(file, "utf8");
        return BUSINESS_TYPES.some((type) => source.includes(`"@type": ["${type}`) || source.includes(`"@type": "${type}"`));
      })
      .map((file) => path.relative(ROOT, file));

    expect(offenders).toEqual([]);
  });
});

describe("llms.txt", () => {
  const short = buildLlmsTxt();
  const full = buildLlmsFullTxt();

  it("names every treatment category under its public name", () => {
    publicCategoryCatalog().forEach((category) => {
      expect(short).toContain(category.name);
      expect(short).toContain(category.path);
    });
  });

  // Treatment names and their ids must match the public pages, where the
  // prescription drug name does not appear. The FAQ section is quoted from
  // /faq verbatim and keeps whatever wording that page shows, because markup
  // that differs from the visible text is the worse failure.
  it("names the wrinkle treatment the way its page does", () => {
    expect(short).not.toMatch(/botoks|botox/i);
    expect(short).toContain("Tretman mimičnih bora");
    const treatmentsSection = full.slice(
      full.indexOf("## Tretmani u detalje"),
      full.indexOf("## Česta pitanja")
    );
    expect(treatmentsSection).not.toMatch(/botoks|botox/i);
  });

  it("names every key page", () => {
    KEY_PAGES.forEach((page) => expect(short).toContain(page.path));
  });

  it("states the claim limits", () => {
    expect(short).toContain("Ograničenja tvrdnji");
    expect(full).toContain("Ograničenja tvrdnji");
    expect(short).toContain("garancija");
  });

  it("leaves out identifiers the client has not supplied", () => {
    expect(short).not.toMatch(/PIB:\s*$/m);
    expect(short).not.toMatch(/Matični broj:\s*$/m);
  });
});

describe("crawler registry", () => {
  it("has unique ids and tokens", () => {
    expect(new Set(CRAWLERS.map((c) => c.id)).size).toBe(CRAWLERS.length);
    expect(new Set(CRAWLERS.map((c) => c.token)).size).toBe(CRAWLERS.length);
  });

  it("matches the longest token first", () => {
    expect(identifyCrawler("Mozilla/5.0 (compatible; Applebot-Extended/1.0)").id).toBe(
      "applebot-extended"
    );
    expect(identifyCrawler("Mozilla/5.0 (compatible; Applebot/0.1)").id).toBe("applebot");
    expect(identifyCrawler("ChatGPT-User/1.0").kind).toBe("live");
    expect(identifyCrawler("GPTBot/1.2").kind).toBe("index");
    expect(identifyCrawler("Mozilla/5.0")).toBeNull();
  });

  it("counts assistants as AI referrers and plain search engines as not", () => {
    expect(isAiReferrer("https://chatgpt.com/", null)).toBe(true);
    expect(isAiReferrer(null, "chatgpt.com")).toBe(true);
    expect(isAiReferrer("https://www.google.com/search?q=fileri+nis", null)).toBe(false);
    expect(isAiReferrer("", null)).toBe(false);
  });
});
