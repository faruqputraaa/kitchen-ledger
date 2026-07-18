import bcrypt from 'bcrypt';

import env from '#config/env';
import userService from '#modules/user/user.service';
import { USER_ROLE } from '#modules/user/user.constants';
import counterService from '#shared/counter/counter.service';

export const seedOwner = async () => {
  const email = env.owner?.email;
  const password = env.owner?.password;
  const name = env.owner?.name || 'Owner';

  if (!email || !password) {
    console.log(
      'OWNER_EMAIL / OWNER_PASSWORD not set, skip owner seed'
    );
    return;
  }

  const existing =
    await userService.findByEmail(email);

  if (existing) {
    console.log('Owner already exists');
    return;
  }

  const hashedPassword = await bcrypt.hash(
    password,
    12
  );

  const code =
    await counterService.generate('user');

  await userService.createOwner({
    code,
    name,
    email,
    password: hashedPassword,
    role: USER_ROLE.OWNER,
  });

  console.log('Owner seeded');
};
