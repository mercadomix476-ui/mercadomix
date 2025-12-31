import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import App from "../src/App";

test("renders the app without crashing", async () => {
  render(<App />);

  // Wait for the loading state to finish
  await waitFor(() => {
    expect(
      screen.getByRole("heading", { name: /Nexus Commerce/i })
    ).toBeInTheDocument();
  });
});