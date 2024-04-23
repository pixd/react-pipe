import { Adjunct } from './Adjunct';
import { ChildPipeLink } from './ChildPipeLink';
import { ReleaseLink } from './ReleaseLink';
import { StreamGroup } from './StreamGroup';

export type PipeState<
  TAdjuncts extends (null | Adjunct)[] = (null | Adjunct)[],
> = {
  streamGroups: Record<symbol, StreamGroup<TAdjuncts>>,
  releaseLinks: ReleaseLink[],
  childPipeLinks: ChildPipeLink[],
  operative: boolean,
}
