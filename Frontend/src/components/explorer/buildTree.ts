export function buildTree(paths: string[]) {
  const root: any = {};

  paths.forEach((path) => {
    const parts = path.split("/");

    let current = root;

    parts.forEach((part, index) => {
      if (!current[part]) {
        current[part] =
          index === parts.length - 1 ? null : {};
      }

      current = current[part];
    });
  });

  return root;
}