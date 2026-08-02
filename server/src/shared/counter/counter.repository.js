import Counter from './counter.model.js';

class CounterRepository {
  async findByModule(module) {
    return Counter.findOne({ module });
  }

  async create(payload) {
    return Counter.create(payload);
  }

  async increment(module, session = null) {
    const query = Counter.findOneAndUpdate(
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

    if (session) {
      query.session(session);
    }

    return query;
  }
}

export default new CounterRepository();
