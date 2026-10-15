/** Serializes captures across async work, focus changes, and sheet animations. */
export class ScanSession {
  private generation = 0;
  private running = false;
  private sheetOpen = false;
  private closing = false;

  start(): number | null {
    if (this.running || this.sheetOpen || this.closing) return null;
    this.running = true;
    return ++this.generation;
  }
  isCurrent(token: number): boolean { return token === this.generation; }
  invalidate(): void { this.generation++; }
  finish(): void { this.running = false; }
  openSheet(): void { this.sheetOpen = true; }
  closeSheet(): boolean {
    if (!this.sheetOpen || this.closing) return false;
    this.sheetOpen = false;
    this.closing = true;
    return true;
  }
  finishClosing(): void { this.closing = false; }
}
