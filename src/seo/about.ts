/** Use existing visible editorial content when optional CMS SEO is unavailable. */
export function summarizeAboutIntroduction(introduction: string): string {
    const text = introduction.replace(/\s+/g, " ").trim();
    const characters = Array.from(text);
    if (characters.length <= 160) return text;
    const prefix = characters.slice(0, 159).join("");
    const boundary = prefix.lastIndexOf(" ");
    return (boundary > 0 ? prefix.slice(0, boundary) : prefix) + "…";
}
