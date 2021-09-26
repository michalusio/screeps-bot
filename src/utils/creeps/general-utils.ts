export function getByIdOrNew<T>(id: Id<T> | undefined, getNew: () => T | undefined): T | undefined {
  return (id ? Game.getObjectById(id) : undefined) ?? getNew();
}

export function fillBody(upTo: number, sequence: BodyPartConstant[], energy: number): BodyPartConstant[] {
  let remaining = energy;
  const result: BodyPartConstant[] = [];
  while (remaining > 0 && result.length < upTo) {
    for (const part of sequence) {
      const partCost = BODYPART_COST[part];
      if (partCost > remaining || result.length >= upTo) {
        return result;
      }
      result.push(part);
      remaining -= partCost;
    }
  }
  return result;
}
