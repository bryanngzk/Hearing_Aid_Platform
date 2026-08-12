export const conditionClass = {
  Excellent: 'condition-excellent',
  'Very Good': 'condition-very-good',
  Good: 'condition-good',
  Acceptable: 'condition-acceptable',
  Refurbished: 'condition-refurbished',
};

export const products = [
  {
    id: 1,
    brand: 'Phonak',
    model: 'Naida Link Marvel Hearing Aids',
    condition: 'Excellent',
    image: '/img/products/1.jpg',
    description: 'A powerful behind-the-ear hearing aid built for severe to profound hearing loss, with Bluetooth streaming and rechargeable battery.',
  },
  {
    id: 2,
    brand: 'Phonak',
    model: 'Naida Lumity Hearing Aids',
    condition: 'Very Good',
    image: '/img/products/2.jpg',
    description: 'Latest-generation power hearing aid with enhanced speech clarity in noisy environments and all-day rechargeable battery life.',
  },
  {
    id: 3,
    brand: 'Phonak',
    model: 'Sky Lumity Hearing Aids',
    condition: 'Good',
    image: '/img/products/3.jpg',
    description: 'Paediatric-friendly hearing aid designed for growing ears, with a durable build and connectivity for remote adjustments.',
  },
  {
    id: 4,
    brand: 'Phonak',
    model: 'Slim Lumity Hearing Aids',
    condition: 'Refurbished',
    image: '/img/products/4.jpg',
    description: 'A discreet, slim receiver-in-canal hearing aid offering natural sound quality in a compact, low-profile design.',
  },
  {
    id: 5,
    brand: 'Oticon',
    model: 'Real Miniature RITE',
    condition: 'Excellent',
    image: '/img/products/1.jpg',
    description: 'A miniature receiver-in-the-ear hearing aid delivering a full 360-degree soundscape for a more natural listening experience.',
  },
  {
    id: 6,
    brand: 'Siemens',
    model: 'Signia Pure Charge&Go',
    condition: 'Acceptable',
    image: '/img/products/2.jpg',
    description: 'A rechargeable receiver-in-canal hearing aid combining reliable amplification with simple, hassle-free daily charging.',
  },
  {
    id: 7,
    brand: 'Hansaton',
    model: 'Scena 7 BTE',
    condition: 'Good',
    image: '/img/products/3.jpg',
    description: 'A robust behind-the-ear hearing aid suited for moderate to severe hearing loss, with clear sound processing.',
  },
  {
    id: 8,
    brand: 'Oticon',
    model: 'More Sound Amplifier',
    condition: 'Very Good',
    image: '/img/products/4.jpg',
    description: 'A sound amplifier that supports the brain in making sense of sound, with a wide dynamic range for balanced hearing.',
  },
];

export function getProductById(id) {
  return products.find((product) => String(product.id) === String(id));
}
