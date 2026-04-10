// Deterministic seed data for the sandbox. Kept outside scenario files so that
// every scenario shares the same shape of test records. Agents can reason
// about these IDs directly in flow assertions.

export const seedData = {
  todos: [
    { id: 't1', title: 'Buy milk', status: 'pending', tenantId: 'acme' },
    { id: 't2', title: 'Write tests', status: 'done', tenantId: 'acme' },
    { id: 't3', title: 'Ship v2.0.0', status: 'pending', tenantId: 'globex' },
  ],
  users: [
    { id: 'u1', name: 'Ada Lovelace', email: 'ada@example.com', role: 'admin' },
    { id: 'u2', name: 'Alan Turing', email: 'alan@example.com', role: 'member' },
  ],
  products: [
    { id: 'p1', name: 'Widget', price: 9.99 },
    { id: 'p2', name: 'Gizmo', price: 19.99 },
  ],
};
