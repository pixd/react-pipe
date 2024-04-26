import { User } from '../types';

export type GetFriendsParams = {
  userId: number;
};

export type GetFriendsResponse = {
  params: GetFriendsParams;
  friends: User[];
};

export function getFriends(params: GetFriendsParams): Promise<GetFriendsResponse> {
  return new Promise((resolve) => {
    setTimeout(() => resolve({
      params,
      friends: [
        { id: 74, name: 'Max' },
        { id: 12, name: 'Victor' },
      ],
    }), 2500);
  });
}

// export function getFriends(params: GetFriendsParams): Promise<GetFriendsResponse> {
//   return new Promise((resolve, reject) => {
//     setTimeout(() => reject(new Error()), 2500);
//   });
// }
