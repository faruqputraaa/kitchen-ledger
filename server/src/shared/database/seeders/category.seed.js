import categoryRepository from '#modules/category/category.repository';
import counterService from '#shared/counter/counter.service';

const categories = [
  { name: 'Bahan Baku' },
  { name: 'Bumbu & Rempah' },
  { name: 'Sayur & Buah' },
  { name: 'Daging & Telur' },
  { name: 'Susuan & Olahan' },
  { name: 'Tepak & Sereal' },
  { name: 'Minuman' },
  { name: 'Lainnya' },
];

export const seedCategories = async () => {
  console.log('seedCategories START');

  for (const data of categories) {
    const existing = await categoryRepository.findOne({
      name: data.name,
      isDeleted: false,
    });

    if (existing) {
      console.log(`Category "${data.name}" already exists`);
      continue;
    }

    const code = await counterService.generate('category');

    await categoryRepository.create({
      code,
      name: data.name,
      description: '',
      status: 'ACTIVE',
      isSystem: true,
      tenantId: null,
    });

    console.log(`Category "${data.name}" created with code ${code}`);
  }

  console.log('Categories seeded');
};
