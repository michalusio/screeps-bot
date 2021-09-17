export interface Placement {
  name: string;
  isPlaced(room: Room): boolean;
  place(room: Room): void;
}
