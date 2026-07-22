import RecipeCostHistory from './recipeCostHistory.model.js';

class RecipeCostHistoryRepository {
  async upsertMany(snapshots) {
    const ops = snapshots.map((s) => ({
      updateOne: {
        filter: { recipe: s.recipe, date: s.date },
        update: { $set: { foodCost: s.foodCost } },
        upsert: true,
      },
    }));

    if (ops.length > 0) {
      await RecipeCostHistory.bulkWrite(ops);
    }
  }

  async findMany(filter = {}, options = {}) {
    return RecipeCostHistory.find(filter)
      .sort(options.sort || { date: 1 }) // Default: lama ke baru untuk chart
      .skip(options.skip)
      .limit(options.limit);
  }
}

export default new RecipeCostHistoryRepository();