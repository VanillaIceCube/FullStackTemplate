export const workspaceFixtures = [
  {
    id: 1,
    name: 'test_workspace_01',
    owner: 1,
    owner_details: { id: 1, username: 'owner', email: 'owner@example.com', display_name: 'owner' },
    collaborators_details: [
      { id: 2, username: 'collab', email: 'collab@example.com', display_name: 'collab' },
    ],
  },
  {
    id: 2,
    name: 'test_workspace_02',
    owner: 1,
    owner_details: { id: 1, username: 'owner', email: 'owner@example.com', display_name: 'owner' },
    collaborators_details: [],
  },
];

export const collectionFixtures = [
  { id: 10, name: 'test_collection_01' },
  { id: 11, name: 'test_collection_02' },
];

export const itemFixtures = [
  { id: 101, item: 'test_item_01', status: 'Not Started' },
  { id: 102, item: 'test_item_02', status: 'Complete' },
];
