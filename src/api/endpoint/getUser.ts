import { User } from '../types';

export type GetUserResponse = {
  params: null,
  user: User;
};

export function getUser(): Promise<GetUserResponse> {
  return new Promise((resolve) => {
    setTimeout(() => resolve({
      params: null,
      user: { id: id ++, name: 'Anton' },
    }), 2500);
  });
}

// export function getUser(): Promise<GetUserResponse> {
//   return new Promise((resolve, reject) => {
//     setTimeout(() => reject(new Error()), 2500);
//   });
// }

let id = 1;
