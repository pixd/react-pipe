import { useEffect, useMemo } from 'react';
import { useStore } from 'react-redux';
import { AnyAction as DeprecatedAnyAction, Store } from 'redux';

export type AnyAction = DeprecatedAnyAction;

export const PIPE_STORE_KEY = '@@pipes-store';

export type ChannelHooksStoreRootState<TAction extends AnyAction = AnyAction> = {
  [key in typeof PIPE_STORE_KEY]: ChannelHooksStoreState<TAction>;
};

export type ChannelHooksStoreState<TAction extends AnyAction = AnyAction> = {
  action: TAction;
};

export function pipesReducer(state = { action: null }, action: AnyAction) {
  return {
    ...state,
    action,
  };
}

export function actionSelector<TAction extends AnyAction>(state: ChannelHooksStoreRootState<TAction>): TAction {
  return state[PIPE_STORE_KEY].action;
}

export function unpackPipe<TPipe extends AnyPipe>(pipe: TPipe): TPipe['value']  {
  return pipe.value;
}

export function unpackPipes<
  TPipes extends [] | [AnyPipe] | [AnyPipe, AnyPipe] | [AnyPipe, AnyPipe, AnyPipe] | [AnyPipe, AnyPipe, AnyPipe, AnyPipe] | [AnyPipe, AnyPipe, AnyPipe, AnyPipe, AnyPipe] | [AnyPipe, AnyPipe, AnyPipe, AnyPipe, AnyPipe, AnyPipe] | [AnyPipe, AnyPipe, AnyPipe, AnyPipe, AnyPipe, AnyPipe, AnyPipe] | [AnyPipe, AnyPipe, AnyPipe, AnyPipe, AnyPipe, AnyPipe, AnyPipe, AnyPipe] | [AnyPipe, AnyPipe, AnyPipe, AnyPipe, AnyPipe, AnyPipe, AnyPipe, AnyPipe, AnyPipe] | [AnyPipe, AnyPipe, AnyPipe, AnyPipe, AnyPipe, AnyPipe, AnyPipe, AnyPipe, AnyPipe, AnyPipe] | AnyPipe[],
>(pipes: TPipes): UnpackedPipes<TPipes> {
  return pipes.map((pipe) => unpackPipe(pipe)) as UnpackedPipes<TPipes>;
}

export function checkPipeHolders(pipes: AnyPipe[]): boolean {
  return pipes.every((pipe) => pipe.resolved);
}

export type BasePipe<TValue extends any, TRunArgs extends any[]> = {
  resolved: boolean;
  value: null | TValue;
  run: (...args: TRunArgs) => void;
  terminate: () => void;
  link: (pipe: AnyPipe) => void;
};

type AnyPipe = BasePipe<any, any[]>;

export type ActionPipe<TAction extends AnyAction = AnyAction> = BasePipe<TAction, []>;

function createActionPipe<
  TAction extends AnyAction,
>(
  store: Store<ChannelHooksStoreRootState<TAction>>,
  actionType: TAction['type'],
  pipeHolders?: AnyPipe[],
): ActionPipe<TAction> {
  let active: boolean = true;
  let unsubscribe: null | (() => void) = null;
  const pipes: AnyPipe[] = [];

  function runPipes() {
    pipes.forEach((pipe) => pipe.run());
  }

  const pipe: ActionPipe<TAction> = {
    resolved: false,
    value: null,
    run() {
      if (active && checkPipeHolders(pipeHolders ?? [])) {
        active = false;

        const resolve = (action: TAction) => {
          this.value = action;
          this.resolved = true;
          runPipes();
          this.resolved = false;
        };

        unsubscribe = store.subscribe(() => {
          const action = actionSelector<TAction>(store.getState());

          if (action.type === actionType) {
            unsubscribe?.();
            unsubscribe = null;

            resolve(action);
          }
        });
      }
    },
    terminate() {
      active = false;
      this.resolved = false;
      unsubscribe?.();
    },
    link(pipe) {
      pipes.push(pipe);
    },
  };

  pipeHolders?.forEach((pipeHolder) => pipeHolder.link(pipe));

  return pipe;
}

export function useAction<
  TAction extends AnyAction,
>(
  actionType: TAction['type'],
  pipeHolders?: AnyPipe[],
): ActionPipe<TAction> {
  const store = useStore<ChannelHooksStoreRootState<TAction>>();

  const pipe = useMemo(() => {
    console.log('Action pipe creating');
    const pipe = createActionPipe(store, actionType, pipeHolders);
    pipe.run();
    return pipe;
  }, []); // eslint-disable-line

  useEffect(() => {
    console.log('Action pipe terminating');

    return () => pipe.terminate();
  }, []); // eslint-disable-line

  return pipe;
}

export type TaskPipe<TValue extends any = any> = BasePipe<TValue, []>;

export type TaskPromisePipe<TValue extends any = any> = BasePipe<TValue, []> & {
  error: TaskPromiseErrorPipe;
};

export type TaskPromiseErrorPipe = BasePipe<Error, [Error]>;

function createTaskPipe(
  taskMethod: (...args: any[]) => any,
  pipeHolders?: AnyPipe[],
): TaskPromisePipe {
  let active: boolean = true;
  let completed: boolean = false;
  const pipes: AnyPipe[] = [];
  const errorPipes: AnyPipe[] = [];

  function runPipes() {
    pipes.forEach((pipe) => pipe.run());
  }

  function runErrorPipes() {
    errorPipes.forEach((pipe) => pipe.run());
  }

  const errorPipe: TaskPromiseErrorPipe = {
    resolved: false,
    value: null,
    run(error: Error) {
      this.value = error;
      this.resolved = true;
      runErrorPipes();
    },
    terminate() {
      this.resolved = false;
    },
    link(pipe) {
      errorPipes.push(pipe);
    },
  };

  const pipe: TaskPromisePipe = {
    resolved: false,
    value: null,
    error: errorPipe,
    run() {
      if (active && checkPipeHolders(pipeHolders ?? [])) {
        active = false;

        const resolve = (result: any) => {
          completed = true;
          this.value = result;
          this.resolved = true;
          runPipes();
        };

        const result = taskMethod(...unpackPipes(pipeHolders ?? []));

        if (result instanceof Promise) {
          result
            .then((result) => {
              if ( ! completed) {
                resolve(result);
              }
            })
            .catch((error) => {
              errorPipe.run(error);
            });
        }
        else {
          resolve(result);
        }
      }
    },
    terminate() {
      completed = true;
      this.resolved = false;
    },
    link(pipe) {
      pipes.push(pipe);
    },
  };

  pipeHolders?.forEach((pipeHolder) => pipeHolder.link(pipe));

  return pipe;
}

export function useTask<
  TResultValue extends any,
  TPipeHolders extends [] | [AnyPipe] | [AnyPipe, AnyPipe] | [AnyPipe, AnyPipe, AnyPipe] | [AnyPipe, AnyPipe, AnyPipe, AnyPipe] | [AnyPipe, AnyPipe, AnyPipe, AnyPipe, AnyPipe] | [AnyPipe, AnyPipe, AnyPipe, AnyPipe, AnyPipe, AnyPipe] | [AnyPipe, AnyPipe, AnyPipe, AnyPipe, AnyPipe, AnyPipe, AnyPipe] | [AnyPipe, AnyPipe, AnyPipe, AnyPipe, AnyPipe, AnyPipe, AnyPipe, AnyPipe] | [AnyPipe, AnyPipe, AnyPipe, AnyPipe, AnyPipe, AnyPipe, AnyPipe, AnyPipe, AnyPipe] | [AnyPipe, AnyPipe, AnyPipe, AnyPipe, AnyPipe, AnyPipe, AnyPipe, AnyPipe, AnyPipe, AnyPipe],
  TTaskMethod extends (...args: UnpackedPipes<TPipeHolders>) => TResultValue,
  TTaskPipe extends Promise<any> extends ReturnType<TTaskMethod>
    ? TaskPromisePipe<Exclude<ReturnType<TTaskMethod>, Promise<any>> | (Extract<ReturnType<TTaskMethod>, Promise<any>> extends Promise<infer TValue> ? TValue : never)>
    : TaskPipe<ReturnType<TTaskMethod>>,
>(
  taskMethod: TTaskMethod,
  pipeHolders?: TPipeHolders,
): TTaskPipe {
  const pipe = useMemo(() => {
    console.log('Task pipe creating');

    const pipe = createTaskPipe(taskMethod, pipeHolders);
    pipe.run();
    return pipe;
  }, []); // eslint-disable-line

  useEffect(() => {
    console.log('Task pipe terminating');

    return () => pipe.terminate();
  }, []); // eslint-disable-line

  return pipe as TTaskPipe;
}

type UnpackedPipes<TPipes extends any> = TPipes extends [BasePipe<infer TValue, any[]>, ...(infer TRestPipes)]
  ? [TValue, ...UnpackedPipes<TRestPipes>]
  : [];
