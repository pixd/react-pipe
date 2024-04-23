export function deepCopy(data: any, circleHack: any[][] = []): any {
  const circleHackDataIndex = circleHack.findIndex((circleHackData) => circleHackData[0] === data);
  if (circleHackDataIndex >= 0) {
    return circleHack[circleHackDataIndex][1];
  }
  else if (data == null) {
    return data;
  }
  else if (Array.isArray(data)) {
    const nextData: typeof data = [];
    const nextCircleHack = [...circleHack, [data, nextData]];

    data.forEach((member, index) => {
      nextData[index] = deepCopy(member, nextCircleHack)
    });

    return nextData;
  }
  else if (typeof data === 'function') {
    return '[[FUNCTION]]';
  }
  else if (typeof data === 'object') {
    const nextData: typeof data = {};
    const nextCircleHack = [...circleHack, [data, nextData]];

    [...Object.getOwnPropertyNames(data), ...Object.getOwnPropertySymbols(data)].forEach((key) => {
      nextData[key] = deepCopy(data[key], nextCircleHack);
    });

    return nextData;
  }
  else {
    return data;
  }
}
