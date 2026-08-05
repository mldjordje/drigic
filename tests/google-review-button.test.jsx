import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import GoogleReviewButton from "@/components/common/GoogleReviewButton";
import LocaleProvider from "@/components/common/LocaleProvider";
import Testimonials from "@/components/homes/home-5/Testimonials";
import { GOOGLE_PLACE_ID, GOOGLE_REVIEW_URL } from "@/lib/googleReview";

describe("GoogleReviewButton", () => {
  it("links to the Google write-review form for the clinic place id", () => {
    render(<GoogleReviewButton label="OCENI NAS NA GOOGLE-U" />);

    const link = screen.getByRole("link", {
      name: /OCENI NAS NA GOOGLE-U/i,
    });

    expect(link).toHaveAttribute("href", GOOGLE_REVIEW_URL);
    expect(GOOGLE_REVIEW_URL).toContain(GOOGLE_PLACE_ID);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});

describe("Testimonials section", () => {
  it("shows only the Google review CTA, with no invented patient quotes", () => {
    const { container } = render(
      <LocaleProvider initialLocale="sr">
        <Testimonials />
      </LocaleProvider>
    );

    expect(screen.getByText("Utisci pacijenata")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Ostavi recenziju na Google-u/i })
    ).toHaveAttribute("href", GOOGLE_REVIEW_URL);
    expect(container.querySelectorAll(".testi-box")).toHaveLength(0);
    expect(container.querySelector("script")).toBeNull();
  });
});
