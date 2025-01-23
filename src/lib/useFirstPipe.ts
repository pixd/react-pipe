// import { useMemo } from 'react';
//
// import { PIPE, BasePipe } from './types';
// import { createPipe } from './useBasePipe';
//
// export function useFirst<
//   TValue extends any = any,
// >(pipe: BasePipe<TValue>) {
//   return useMemo(() => {
//
//
//
//     return {
//       type: PIPE,
//       connections: 0,
//       connect(onStream, onTerminate) {
//         const downstreamConnection = createDownstreamConnection(onStream, onTerminate);
//         downstreamConnections.push(downstreamConnection);
//         this.connections ++;
//       },
//     };
//   }, [pipe]);
// }

export function useFirstPipe() {}
