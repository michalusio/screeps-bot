// Min-Heap by Shray7: https://gist.github.com/shray7/2a3648e48767707a9a686f96030f7859
export class MinimumHeap<T> {
  public heap: T[] = [];

  constructor(private itemToPriority: (item: T) => number) {}

  public getMin(): T | undefined {
    return this.heap[0];
  }

  public insert(x: T): void {
    this.heap.push(x);
    if (this.heap.length > 1) {
      let currentIndex = this.heap.length - 1;

      while (
        currentIndex > 1 &&
        this.itemToPriority(this.heap[Math.floor(currentIndex / 2)]) > this.itemToPriority(this.heap[currentIndex])
      ) {
        this.swapIndex(Math.floor(currentIndex / 2), currentIndex);
        currentIndex = Math.floor(currentIndex / 2);
      }
    }
  }

  public remove(): void {
    const lastItem = this.heap[this.heap.length - 1];
    if (!lastItem) return;
    this.heap[0] = lastItem;
    this.heap.splice(this.heap.length - 1, 1);

    let parent = 0;
    let leftChildIndex = 2 * parent + 1;
    let rightChildIndex = 2 * parent + 2;
    let left = leftChildIndex > this.heap.length ? null : this.heap[leftChildIndex];
    let right = rightChildIndex > this.heap.length ? null : this.heap[rightChildIndex];
    do {
      // no children
      if (!left && !right) {
        return;
      }

      // 1 child
      else if (!right && left && this.itemToPriority(this.heap[parent]) > this.itemToPriority(left)) {
        this.swapIndex(parent, leftChildIndex);
        parent = leftChildIndex;
      }

      // 2 children
      else if (left && right) {
        if (left < right && this.itemToPriority(this.heap[parent]) > this.itemToPriority(left)) {
          this.swapIndex(parent, leftChildIndex);
          parent = leftChildIndex;
        } else if (left > right && this.itemToPriority(this.heap[parent]) > this.itemToPriority(right)) {
          this.swapIndex(parent, rightChildIndex);
          parent = rightChildIndex;
        }
      }

      leftChildIndex = 2 * parent + 1;
      rightChildIndex = 2 * parent + 2;
      left = leftChildIndex > this.heap.length ? null : this.heap[leftChildIndex];
      right = rightChildIndex > this.heap.length ? null : this.heap[rightChildIndex];
    } while (
      left &&
      right &&
      (this.itemToPriority(this.heap[parent]) > this.itemToPriority(left) ||
        this.itemToPriority(this.heap[parent]) > this.itemToPriority(right))
    );
  }

  private swapIndex(a: number, b: number): void {
    [this.heap[a], this.heap[b]] = [this.heap[b], this.heap[a]];
  }
}
