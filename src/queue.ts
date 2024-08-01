import IncrementalBlock from "./IncrementalBlock";
import { queryDueIbs } from "./logseq/query";

class IbQueue {
  private _ibs: IncrementalBlock[] = [];

  public async refresh() {
    let ibs = await queryDueIbs();
    ibs = ibs.sort((a, b) => b.sample! - a.sample!);
    this._ibs = ibs;
  }

  public next() : IncrementalBlock | undefined {
    // Make sure ib has not been moved to another day
    let ib = this._ibs.shift();
    while (ib && !ib.dueToday()) {
      ib = this._ibs.shift();
    }
    return ib;
  }

  public add(ib: IncrementalBlock) {
    if (!ib.dueToday() || !ib.beta) return;
    const sample = ib.beta.sample({ seedToday: true });
    for (let i = 0; i < this.ibs.length; i++) {
      if (this.ibs[i].sample! < sample) {
        this.ibs.splice(i, 0, ib);
        break;
      }
    }
  }

  public remove(uuid: string) {
    for (let i = 0; i < this._ibs.length; i++) {
      if (this._ibs[i].uuid == uuid) {
        this._ibs.splice(i, 1);
      }
    }
  }

  public get current() : IncrementalBlock {
    return this._ibs[0];
  }

  public get ibs() {
    return this._ibs;
  }

  public get length() : number {
    return this._ibs.length;
  }
}

export default IbQueue;