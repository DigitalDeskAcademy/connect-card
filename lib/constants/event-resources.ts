/**
 * Common Resource Presets for Volunteer Events
 *
 * Predefined common resources that churches typically need for events.
 * Staff can add these quickly without typing.
 */
export const COMMON_RESOURCES = [
  { name: "Folding Chairs", defaultQuantity: 50 },
  { name: "Round Tables", defaultQuantity: 10 },
  { name: "Rectangular Tables", defaultQuantity: 5 },
  { name: "Projector", defaultQuantity: 1 },
  { name: "Projector Screen", defaultQuantity: 1 },
  { name: "Microphone (Wireless)", defaultQuantity: 2 },
  { name: "Microphone (Wired)", defaultQuantity: 2 },
  { name: "Sound System", defaultQuantity: 1 },
  { name: "Extension Cords", defaultQuantity: 5 },
  { name: "Power Strips", defaultQuantity: 5 },
  { name: "Tablecloths", defaultQuantity: 10 },
  { name: "Name Tags", defaultQuantity: 50 },
  { name: "Sign-in Table", defaultQuantity: 1 },
  { name: "Welcome Banner", defaultQuantity: 1 },
  { name: "Coffee Maker", defaultQuantity: 1 },
  { name: "Water Dispenser", defaultQuantity: 1 },
  { name: "Snack Table Supplies", defaultQuantity: 1 },
  { name: "First Aid Kit", defaultQuantity: 1 },
  { name: "Cleaning Supplies", defaultQuantity: 1 },
  { name: "Trash Bags", defaultQuantity: 20 },
] as const;

export type CommonResource = (typeof COMMON_RESOURCES)[number];
