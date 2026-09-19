import Counter from './counter.model.js';

class CounterRepository {
  async findByModule(module, tenantId = null) {
    return Counter.findOne({ module, tenantId });
  }

  async create(payload) {
    return Counter.create(payload);
  }

  async increment(module, tenantIdOrSession = null, maybeSession = null) {
    let tenantId = null;
    let session = null;
    // Handle overloads: increment(module), increment(module, session), increment(module, tenantId), increment(module, tenantId, session)
    if (tenantIdOrSession) {
      if (typeof tenantIdOrSession === 'object' && tenantIdOrSession.constructor?.name === 'ClientSession') {
        session = tenantIdOrSession;
      } else if (typeof tenantIdOrSession === 'string' || (typeof tenantIdOrSession === 'object' && tenantIdOrSession._id)) {
        tenantId = tenantIdOrSession;
        if (maybeSession) session = maybeSession;
      }
    }

    // Ensure counter doc exists for this tenant
    const filter = { module, tenantId };
    // For shared modules (category, unit, user) tenantId is null - reuse global counter
    const query = Counter.findOneAndUpdate(
      filter,
      { $inc: { sequence: 1 } },
      { new: true, upsert: false }
    );

    if (session) query.session(session);

    let counter = await query;
    if (!counter) {
      // Fallback: try to create from template (copy prefix/padding from global if exists)
      const template = await Counter.findOne({ module, tenantId: null });
      if (template) {
        counter = await Counter.findOneAndUpdate(
          filter,
          {
            $setOnInsert: { prefix: template.prefix, padding: template.padding, isDateBased: template.isDateBased, resetPolicy: template.resetPolicy },
            $inc: { sequence: 1 },
          },
          { new: true, upsert: true }
        );
        if (session) counter = await Counter.findOneAndUpdate(filter, { $inc: { sequence: 1 } }, { new: true, session });
        // Simpler: just ensure exists then increment
        if (!counter || counter.sequence === 0) {
          counter = await Counter.findOne(filter);
        }
      } else {
        throw new Error(`Counter configuration for "${module}" not found`);
      }
    }

    return counter;
  }
}

export default new CounterRepository();
