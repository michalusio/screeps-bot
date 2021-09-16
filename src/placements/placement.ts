export interface Placement {
  isPlaced(room: Room): boolean;
  place(room: Room): void;
}
