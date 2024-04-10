import { User } from '../types';

export type GetUserResponse = {
  user: User;
};

export function getUser(): Promise<GetUserResponse> {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ user: { name: 'Anton' }}), 1500);
  });
}
