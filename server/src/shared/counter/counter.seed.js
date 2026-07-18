import counterRepository from './counter.repository.js';

const counters = [
  {
    module: 'user',
    prefix: 'USR',
  },
  {
    module: 'category',
    prefix: 'CAT',
  },
  {
    module: 'unit',
    prefix: 'UNT',
  },
  {
    module: 'ingredient',
    prefix: 'ING',
  },
  {
    module: 'supplier',
    prefix: 'SUP',
  },
  {
    module: 'menu',
    prefix: 'MEN',
  },
  {
    module: 'recipe',
    prefix: 'REC',
  },
  {
    module: 'purchase',
    prefix: 'PUR',
  },
];

const seedCounters = async () => {
  for (const counter of counters) {
    const exists = await counterRepository.findByModule(counter.module);

    if (exists) continue;

    await counterRepository.create(counter);
  }

  console.log('Counter seed completed');
};

export default seedCounters;