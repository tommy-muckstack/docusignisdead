export const RCOLORS = ["#4C00FF", "#0C7C59", "#C2410C", "#0E7490", "#BE185D", "#7C3AED"];
export const rcolor = (order: number) => RCOLORS[(order - 1) % RCOLORS.length]!;
