import counterService from '#shared/counter/counter.service';

import unitRepository from '#modules/unit/unit.repository';

// baseFactor = konversi ke base unit dimensinya
// MASS base = gram, VOLUME base = ml, COUNT base = pcs
const units = [
  { name: 'Kilogram', symbol: 'kg', dimension: 'MASS', baseFactor: 1000 },
  { name: 'Gram', symbol: 'g', dimension: 'MASS', baseFactor: 1 },
  { name: 'Liter', symbol: 'L', dimension: 'VOLUME', baseFactor: 1000 },
  { name: 'Milliliter', symbol: 'ml', dimension: 'VOLUME', baseFactor: 1 },
  { name: 'Piece', symbol: 'pcs', dimension: 'COUNT', baseFactor: 1 },
  { name: 'Bottle', symbol: 'bottle', dimension: 'COUNT', baseFactor: 1 },
  { name: 'Pack', symbol: 'pack', dimension: 'COUNT', baseFactor: 1 },
  { name: 'Tablespoon', symbol: 'tbsp', dimension: 'VOLUME', baseFactor: 15 },
  { name: 'Teaspoon', symbol: 'tsp', dimension: 'VOLUME', baseFactor: 5 },
];

export const seedUnits = async () => {
  for (const data of units) {
    const existing = await unitRepository.findOne({
      symbol: data.symbol,
      isDeleted: false,
    });

    if (existing) {
      // update dimension + baseFactor unit lama
      await unitRepository.update(existing._id, {
        dimension: data.dimension,
        baseFactor: data.baseFactor,
      });

      continue;
    }

    const code = await counterService.generate('unit');

    await unitRepository.create({
      code,
      name: data.name,
      symbol: data.symbol,
      dimension: data.dimension,
      baseFactor: data.baseFactor,
    });
  }

  console.log('Units seeded');
};
