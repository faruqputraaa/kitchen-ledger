import IngredientPriceHistory from './ingredientPriceHistory.model.js';

class IngredientPriceHistoryRepository {
  async create(data, session = null) {
    const [history] = await IngredientPriceHistory.create([data], {
      session,
    });
    return history;
  }

  async findMany(filter = {}, options = {}) {
    return IngredientPriceHistory.find(filter)
      .sort(options.sort || { date: -1 }) // Default: Terbaru duluan
      .skip(options.skip)
      .limit(options.limit);
  }
}

export default new IngredientPriceHistoryRepository();
