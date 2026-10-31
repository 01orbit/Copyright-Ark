// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { LanguageProvider } from "../i18n";
import type { Work } from "../market";
import { WorkLicensing } from "./WorkLicensing";

vi.mock("../hooks/useWorkRecords", () => ({
  useWorkRecords: () => ({
    offers: Array.from({ length: 19 }, (_, index) => ({
      offer: {
        id: BigInt(index + 1),
        price: index === 0 ? 500000000000000n : index === 1 ? 3000000000000000n : 1000000000000000n,
        duration: index === 0 ? 259200n : index === 1 ? 2592000n : 604800n,
        scope: `scope ${index + 1}`,
      },
      status: index < 10 ? 1 : 3,
    })),
    licenses: [{ license: { id: 1n, licensee: "0x1234567890123456789012345678901234567890", startsAt: 1n, endsAt: 2n }, status: 4 }],
    loading: false,
    error: false,
  }),
}));
vi.mock("./Offers", () => ({ OfferCard: () => <p>Selected offer terms</p> }));
vi.mock("./ui", async (importOriginal) => ({
  ...await importOriginal<typeof import("./ui")>(),
  FormSelect: ({ label, value, onChange, options }: {
    label: string; value: string; onChange: (value: string) => void;
    options: { value: string; label: string }[];
  }) => <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}>
    {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
  </select>,
}));

afterEach(() => vi.unstubAllGlobals());

it("prioritizes available offers, paginates compact rows, and opens terms only on request", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal("CSS", { escape: (value: string) => value });
  localStorage.clear();
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(() => root.render(<LanguageProvider><WorkLicensing work={{ id: 1n } as Work} /></LanguageProvider>));
    const available = host.querySelector('section[aria-label="Available offers"]')!;
    expect(host.querySelector("section")).toBe(available);
    expect(available.querySelectorAll("li")).toHaveLength(8);
    expect(available.textContent).toContain("#10");
    expect(host.querySelector("details")!.open).toBe(false);
    expect(document.body.textContent).not.toContain("Selected offer terms");
    const next = [...available.querySelectorAll("button")].find((button) => button.textContent === "Next")!;
    await act(() => next.click());
    expect(available.querySelectorAll("li")).toHaveLength(2);
    expect(available.textContent).toContain("Page 2 of 2");
    const review = [...available.querySelectorAll("button")].find((button) => button.textContent === "Review and accept")!;
    await act(() => review.click());
    expect(document.body.textContent).toContain("Selected offer terms");
  } finally {
    await act(() => root.unmount());
    host.remove();
  }
});

it("combines price and duration filters and resets pagination when filtering", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  localStorage.clear();
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(() => root.render(<LanguageProvider><WorkLicensing work={{ id: 1n } as Work} /></LanguageProvider>));
    const available = host.querySelector('section[aria-label="Available offers"]')!;
    const price = available.querySelector<HTMLSelectElement>('select[aria-label="Filter by price"]')!;
    const duration = available.querySelector<HTMLSelectElement>('select[aria-label="Filter by license duration"]')!;
    const select = async (input: HTMLSelectElement, value: string) => {
      await act(() => { input.value = value; input.dispatchEvent(new Event("change", { bubbles: true })); });
    };
    await act(() => [...available.querySelectorAll("button")].find((button) => button.textContent === "Next")!.click());
    await select(price, "low");
    expect(available.querySelectorAll("li")).toHaveLength(1);
    expect(available.textContent).toContain("Page 1 of 1");
    expect(available.textContent).toContain("#1");
    await select(duration, "2592000");
    expect(available.querySelectorAll("li")).toHaveLength(0);
    expect(available.textContent).toContain("No offers match these filters.");
    await select(price, "high");
    expect(available.querySelectorAll("li")).toHaveLength(1);
    expect(available.textContent).toContain("#2");
  } finally {
    await act(() => root.unmount());
    host.remove();
  }
});
