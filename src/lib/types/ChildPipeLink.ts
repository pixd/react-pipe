import { ParentRelease } from './ParentRelease';
import { ParentTerminate } from './ParentTerminate';

export type ChildPipeLink<
  TValue extends any = any,
> = {
  selfIndex: number;
  onRelease: ParentRelease<TValue>;
  onTerminate: ParentTerminate;
};
