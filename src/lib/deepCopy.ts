export function deepCopy<TData extends any>(data: TData, circleHack: any[][] = []): TData {
  const circleHackDataIndex = circleHack.findIndex((circleHackData) => circleHackData[0] === data);
  if (circleHackDataIndex >= 0) {
    return circleHack[circleHackDataIndex][1];
  }
  else if (data == null) {
    return data;
  }
  else if (Array.isArray(data)) {
    const nextData = [] as TData;
    const nextCircleHack = [...circleHack, [data, nextData]];

    data.forEach((member, index) => {
      // @ts-ignore
      nextData[index] = deepCopy(member, nextCircleHack)
    });

    return nextData;
  }
  else if (typeof data === 'function') {
    // eslint-disable-next-line no-new-func
    return (() => {}) as TData;
  }
  else if (typeof data === 'object') {
    const nextData = {} as TData;
    const nextCircleHack = [...circleHack, [data, nextData]];

    [...Object.getOwnPropertyNames(data), ...Object.getOwnPropertySymbols(data)].forEach((key) => {
      // @ts-ignore
      nextData[key] = deepCopy(data[key], nextCircleHack);
    });

    return nextData;
  }
  else {
    return data;
  }
}
