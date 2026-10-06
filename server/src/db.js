// server/src/db.js
// In-memory data store strictly adhering to PS-05 PartsPal specifications.

export const db = {
  // Inventory parts with total and available counts, plus low-stock threshold for warnings
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
      name: 'Micro Servo 9g',
      category: 'Motors',
      total: 8,
      available: 8,
      lowStockThreshold: 2
    }
  ],

  // Kits: collections of parts issued as a bundle
  // Tested specifically: "line-follower kit with an Arduino, two IR sensors and a motor driver"
  kits: [
    {
      id: 'k1',
      name: 'Line-Follower Kit',
      items: [
        { partId: 'p1', qty: 1 }, // 1x Arduino Uno
        { partId: 'p2', qty: 2 }, // 2x IR Sensors
        { partId: 'p3', qty: 1 }  // 1x Motor Driver
      ]
    }
  ],

  // Track who has what (borrowed items, status: 'issued' | 'returned')
  issues: []
};
