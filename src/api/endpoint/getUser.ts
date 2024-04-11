import { User } from '../types';

export type GetUserResponse = {
  user: User;
};

export function getUser(): Promise<GetUserResponse> {
  return new Promise((resolve) => {
    setTimeout(() => resolve({
      user: { id: 10, name: 'Anton' },
    }), 2500);
  });
}
