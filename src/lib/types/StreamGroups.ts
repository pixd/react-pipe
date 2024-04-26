import { Adjunct } from './Adjunct';
import { StreamGroup } from './StreamGroup';

export type StreamGroups<
  TAdjuncts extends Adjunct[] = Adjunct[],
> = Record<symbol, StreamGroup<TAdjuncts>>;
