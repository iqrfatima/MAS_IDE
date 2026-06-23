export function getLanguage(
  filename: string
) {
  if (filename.endsWith(".py"))
    return "python";

  if (
    filename.endsWith(".js") ||
    filename.endsWith(".jsx")
  )
    return "javascript";

  if (
    filename.endsWith(".ts") ||
    filename.endsWith(".tsx")
  )
    return "typescript";

  if (filename.endsWith(".html"))
    return "html";

  if (filename.endsWith(".css"))
    return "css";

  if (filename.endsWith(".json"))
    return "json";

  if (filename.endsWith(".md"))
    return "markdown";

  return "plaintext";
}