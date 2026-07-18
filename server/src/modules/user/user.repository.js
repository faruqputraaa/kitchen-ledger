import User from './user.model.js';

class UserRepository {
  create(payload) {
    return User.create(payload);
  }

  findById(id) {
    return User.findById(id).select('-password');
  }

  findByCode(code) {
    return User.findOne({ code });
  }

  findByEmail(email) {
    return User.findOne({ email });
  }

  findByEmailWithPassword(email) {
    return User.findOne({ email });
  }

  findByGoogleId(googleId) {
    return User.findOne({ googleId });
  }

  update(id, payload) {
    return User.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });
  }

  delete(id) {
    return User.findByIdAndDelete(id);
  }
}

export default new UserRepository();
