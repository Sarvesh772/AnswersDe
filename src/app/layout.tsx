import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AnswerDe — AI Doubt Solver",
  description:
    "Your friendly AI tutor for Class 10–12. Ask doubts in Hinglish and get step-by-step answers.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
