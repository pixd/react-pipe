import { User } from '../types';

export type GetFriendsParams = {
  userId: number;
};

export type GetFriendsResponse = {
  friends: User[];
};

export function getFriends(params: GetFriendsParams): Promise<GetFriendsResponse> {
  return new Promise((resolve) => {
    setTimeout(() => resolve({
      friends: [
        { id: 74, name: 'Max' },
        { id: 12, name: 'Victor' },
      ],
    }), 2500);
  });
}
