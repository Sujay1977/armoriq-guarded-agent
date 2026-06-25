
import { z } from 'zod';
import { UserRepository } from '../../repositories/userRepository.js';

const userRepository = new UserRepository();

export const userProfileTool = {
  name: 'userProfile',
  description: 'Retrieve user profile by userId',
  schema: z.object({
    userId: z.string().uuid()
  }),
  execute: async ({ userId }) => {
    const user = await userRepository.getUserById(userId);
    if (!user) throw new Error('User not found');
    return {
      id: user.id,
      email: user.email,
      role: user.role
    };
  }
};
