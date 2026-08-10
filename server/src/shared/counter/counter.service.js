import NotFoundError from '#errors/NotFoundError';

import counterRepository from './counter.repository.js';

class CounterService {
  async generate(module, session = null) {
    const counter = await counterRepository.increment(module, session);

    if (!counter) {
      throw new NotFoundError(`Counter configuration for "${module}" not found`);
    }

    const number = String(counter.sequence).padStart(counter.padding, '0');

    return `${counter.prefix}-${number}`;
  }
}

export default new CounterService();
