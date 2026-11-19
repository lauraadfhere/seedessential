import type { ReactNode } from "react";
import { TemplateHero } from "@/components/deep-ui";

/**
 * Inner-page title band. Uses the platform template hero (forest band)
 * — distinct from the marketing home hero, which stays in page.tsx.
 */
export function PageHero({
  title,
  text,
  children,
  eyebrow: _eyebrow,
}: {
  eyebrow?: string;
  title: string;
  text: string;
  children?: ReactNode;
}) {
  return <TemplateHero title={title} text={text} actions={children} />;
}
