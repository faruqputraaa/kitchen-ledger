import bcrypt from 'bcrypt';

import env from '#config/env';
import userService from '#modules/user/user.service';
import { USER_ROLE } from '#modules/user/user.constants';
import counterService from '#shared/counter/counter.service';

export const seedSuperAdmin = async () => {
  const email = env.superAdmin?.email;
  const password = env.superAdmin?.password;
  const name = env.superAdmin?.name || 'Super Admin';

  if (!email || !password) {
    console.log(
      'SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD not set, skip superadmin seed'
    );
    return;
  }

  const existing =
    await userService.findByEmail(email);

  if (existing) {
    console.log('Super Admin already exists');
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
    role: USER_ROLE.SUPER_ADMIN,
    tenantId: null, // Super admin has no tenant
  });

  console.log('Super Admin seeded');
};