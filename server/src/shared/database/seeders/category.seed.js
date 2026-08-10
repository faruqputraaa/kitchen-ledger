import categoryRepository from '#modules/category/category.repository';
import counterService from '#shared/counter/counter.service';

const categories = [
  { name: 'Bahan Baku', code: 'BHN' },
  { name: 'Bumbu & Rempah', code: 'BMR' },
  { name: 'Sayur & Buah', code: 'SYB' },
  { name: 'Daging & Telur', code: 'DGT' },
  { name: 'Susuan & Olahan', code: 'SUS' },
  { name: 'Tepak & Sereal', code: 'TPS' },
  { name: 'Minuman', code: 'MNM' },
  { name: 'Lainnya', code: 'LNY' },
];

export const seedCategories = async () => {
  console.log('seedCategories START');
  for (const data of categories) {
    const existing = await categoryRepository.findOne({
      code: data.code,
      isDeleted: false,
    });

    if (existing) {
      console.log(`Category ${data.code} already exists`);
      continue;
    }

    const code = await counterService.generate('category');

    await categoryRepository.create({
      code,
      name: data.name,
      description: '',
      status: 'ACTIVE',
    });
    console.log(`Category ${data.code} created with code ${code}`);
  }

  console.log('Categories seeded');
};