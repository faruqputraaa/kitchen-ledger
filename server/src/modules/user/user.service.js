import bcrypt from 'bcrypt';

import ConflictError from '#errors/ConflictError';

import counterService from '#shared/counter/counter.service';

import userRepository from './user.repository.js';

import { AUTH_PROVIDER } from './user.constants.js';

class UserService {
  async createLocalUser(payload) {
    const existingUser = await userRepository.findByEmail(
      payload.email
    );

    if (existingUser) {
      throw new ConflictError('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(
      payload.password,
      12
    );

    const code = await counterService.generate('user');

    return userRepository.create({
      code,

      name: payload.name,

      email: payload.email,

      password: hashedPassword,

      provider: AUTH_PROVIDER.LOCAL,
    });
  }

  async createGoogleUser(payload) {
    const code = await counterService.generate('user');

    return userRepository.create({
      code,

      name: payload.name,

      email: payload.email,

      googleId: payload.googleId,

      avatar: payload.avatar,

      provider: AUTH_PROVIDER.GOOGLE,
    });
  }
    async findByGoogleId(googleId) {
    return userRepository.findByGoogleId(
      googleId
    );
  }


  async findByEmail(email) {
    return userRepository.findByEmail(email);
  }

  async findByEmailWithPassword(email) {
  return userRepository.findByEmailWithPassword(email);
}

  async findById(id) {
    return userRepository.findById(id);
  }

  async updateLastLogin(id) {
    return userRepository.update(id, {
      lastLogin: new Date(),
    });
  }

  async findCurrentUser(id) {
  return userRepository.findById(id);
 }
}

export default new UserService();