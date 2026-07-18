import AppError from './AppError.js';

class ValidationError extends AppError {
  constructor(errors) {
    super('Validation failed', 422);

    this.errors = errors;
  }
}

export default ValidationError;
