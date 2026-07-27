export const getWorkspaceId = (path) => {
  // /workspace/:workspaceId/collection/:collectionId
  const collectionMatch = path.match(/^\/workspace\/([^/]+)\/collection\/[^/]+$/);
  if (collectionMatch) return collectionMatch[1]; // just workspaceId

  // /workspace/:workspaceId
  const workspaceMatch = path.match(/^\/workspace\/([^/]+)$/);
  if (workspaceMatch) return workspaceMatch[1]; // just workspaceId

  return null;
};

export const getParentPath = (path) => {
  //  collection <-- items
  //  /workspace/:workspaceId/collection/:collectionId
  const collectionPath = path.match(/^(\/workspace\/[^/]+)\/collection\/[^/]+$/);
  if (collectionPath) return `${collectionPath[1]}`;

  //  workspace <-- collections
  //  /workspace/:workspaceId
  const workspacePath = path.match(/^\/workspace\/[^/]+$/);
  if (workspacePath) return '/';
};

export const goBackToParent = (path, navigate) => {
  const target = getParentPath(path);
  navigate(target, { replace: true }); // replace prevents stacking history
};
