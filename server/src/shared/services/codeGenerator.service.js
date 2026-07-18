import Counter from '../counter/counter.model.js';

class CodeGeneratorService {
  async generate(name) {
    const counter = await Counter.findOneAndUpdate(
      { _id: name },
      {
        $inc: {
          sequence: 1,
        },
      },
      {
        new: true,
        upsert: true,
      }
    );

    return `${counter.prefix}-${String(counter.sequence).padStart(6, '0')}`;
  }
}

export default new CodeGeneratorService();