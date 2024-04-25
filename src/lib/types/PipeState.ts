import { Adjunct } from './Adjunct';
import { ChildPipeLink } from './ChildPipeLink';
import { StreamGroup } from './StreamGroup';

export type PipeState<
  TAdjuncts extends Adjunct[] = Adjunct[],
> = {
  streamGroups: Record<symbol, StreamGroup<TAdjuncts>>,
  childPipeLinks: ChildPipeLink[],
  operative: boolean,
}
