// server/src/db.js
// In-memory data store for PartsPal-1 with dynamic kits, defective management, and audit logging.

export const db = {
  // Inventory parts
  parts: [
    {
      id: 'p1',
      name: 'Arduino Uno',
      category: 'Microcontrollers',
      total: 5,
      available: 5,
      lowStockThreshold: 2
    },
    {
      id: 'p2',
      name: 'IR Sensor',
      category: 'Sensors',
      total: 10,
      available: 10,
      lowStockThreshold: 3
    },
    {
      id: 'p3',
      name: 'Motor Driver',
      category: 'Drivers',
      total: 4,
      available: 4,
      lowStockThreshold: 1
    },
    {
      id: 'p4',
      name: 'Wheels of Robotic Car (Pair)',
      category: 'Mechanical',
      total: 8,
      available: 8,
      lowStockThreshold: 2
    },
    {
      id: 'p5',
      name: 'Micro Servo 9g',
      category: 'Motors',
      total: 6,
      available: 6,
      lowStockThreshold: 2
    }
  ],

  // Kits: configurable bundles of parts
  kits: [
    {
      id: 'k1',
      name: 'Robotic Car Line-Follower Kit',
      items: [
        { partId: 'p1', qty: 1 }, // 1x Arduino Uno
        { partId: 'p2', qty: 2 }, // 2x IR Sensors
        { partId: 'p3', qty: 1 }  // 1x Motor Driver
      ]
    }
  ],

  // Checkout and return issue records
  issues: [],

  // Append-only audit logs
  auditLogs: []
};

export function logEvent(action, actor, targetId, details = {}) {
  const event = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    action,
    actor: actor || 'system',
    targetId,
    details
  };
  db.auditLogs.push(event);
  return event;
}
