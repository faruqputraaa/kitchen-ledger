import Counter from './counter.model.js';

class CounterRepository {
  async findByModule(module) {
    return Counter.findOne({ module });
  }

  async create(payload) {
    return Counter.create(payload);
  }

  async increment(module) {
    return Counter.findOneAndUpdate(
      { module },
      {
        $inc: {
          sequence: 1,
        },
      },
      {
        new: true,
      }
    );
  }
}

export default new CounterRepository();