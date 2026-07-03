export function normalizeProjectName(projectName: string) {
  return projectName
    .trim() // remove leading/trailing spaces
    .toLowerCase() // lowercase
    .replace(/[^a-z0-9-]+/g, "-") // replace anything not a-z, 0-9, or dash with dash
    .replace(/^-+|-+$/g, ""); // remove leading/trailing dashes
}
