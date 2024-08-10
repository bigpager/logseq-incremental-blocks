import { GLOBALS } from "../globals";
import IncrementalBlock from "../IncrementalBlock";
import React from "react";
import { Virtuoso } from "react-virtuoso";
import IbItem from "./IbItem";
import DatePicker from "react-datepicker";
import { addDays, todayMidnight } from "../utils";
import { queryDueIbs } from "../logseq/query";

const queue = GLOBALS.queue;

export default function Queue({ onLearn } : { onLearn: () => void }) {
  const [refreshing, setRefreshing] = React.useState<boolean>(false);
  const [iblocks, setIblocks] = React.useState<IncrementalBlock[]>([]);
  const [date, setDate] = React.useState<Date>(todayMidnight());
  const [showDatePicker, setShowDatePicker] = React.useState<boolean>(false);

  //@ts-ignore
  const [refs, setRefs] = React.useState<string[]>((logseq.settings?.subsetQueries ?? '').split(', ').filter((r) => !/^\s*$/.test(r)));
  const [selectedRefs, setSelectedRefs] = React.useState<string[]>(queue.refs);

  React.useEffect(() => {
    console.log('use effect');
    if (!queue.refreshed.completed) {
      setRefreshing(true);
      queue.refreshed.promise.then(() => {
        setIblocks(queue.ibs);
        setRefreshing(false);
      });
    } else {
      const minutesSinceLastRefresh = queue.minutesSinceLastRefresh();
      const minutesThreshold = logseq.settings?.queueTimer as number ?? 1.;
      if (minutesSinceLastRefresh != null && minutesSinceLastRefresh > minutesThreshold) {
        refresh();
      } else {
        setIblocks(queue.ibs)
      }
    }
  }, []);

  async function refresh(queueDate?: Date) {
    setRefreshing(true);
    console.log('refreshing...');
    queueDate = queueDate ?? date;
    // await new Promise(resolve => setTimeout(resolve, 2000));
    if (queueDate.getTime() == todayMidnight().getTime()) {
      await queue.refresh();
      setIblocks(queue.ibs);
    } else {
      const ibs = await queryDueIbs({ dueAt: queueDate, refs: queue.refs, includeOutdated: false });
      setIblocks(ibs);
    }
    setRefreshing(false);
    console.log('refreshed!');
  }

  async function loadQueueDate(date: Date) {
    setDate(date);
    refresh(date);
  }

  function toggleDatePicker() {
    const show = !showDatePicker;
    setShowDatePicker(show);
    if (!show) {
      const d = todayMidnight();
      setDate(d);
      refresh(d);
    }
  }

  function toggleRef(ref: string) {
    const index = selectedRefs.indexOf(ref);
    let newSelected = [...selectedRefs];
    if (index > -1) {
      newSelected.splice(index, 1);
    } else {
      newSelected = [...selectedRefs, ref];
    }
    setSelectedRefs(newSelected);
    queue.refs = newSelected;
    refresh();
  }

  async function removeRef(ref: string) {
    if (selectedRefs.includes(ref)) toggleRef(ref);
    const newRefs = [...refs];
    newRefs.splice(newRefs.indexOf(ref), 1);
    setRefs(newRefs);
    logseq.updateSettings({ subsetQueries: newRefs.join(', ') });
  }

  const refButtons = refs.map((r) => {
    const selected = selectedRefs.includes(r);
    const classes = selected ? 'bg-gray-200 ring-1 ring-offset-1 ring-gray-500' : '';
    return (
      <span 
        key={r}
        className={"inline-flex items-center text-xs px-2 py-1 me-2 font-medium text-gray-900 bg-gray-100 rounded hover:bg-gray-200 hover:text-gray-900" + classes}
      >
        <button 
          type="button" 
          onClick={() => toggleRef(r)} 
          className="inline-flex items-center text-xs bg-transparent rounded-sm hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-300"
        >
          {r}
        </button>
        <button type="button" onClick={() => removeRef(r)} className="inline-flex items-center p-1 ms-2 text-xs text-gray-400 bg-transparent rounded-sm hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-300">
          <svg className="w-2 h-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
          </svg>
        </button>
      </span>
    );
  });

  let queueView;
  if (iblocks.length > 0) {
    queueView = (
    <div className="mt-1">
      <Virtuoso
        style={{ height: '250px' }}
        totalCount={iblocks.length}
        itemContent={(i) => IbItem({ ib: iblocks[i] })}
      ></Virtuoso>
    </div>
    );
  } else {
    queueView = (
      <div className="text-neutral-500 flex justify-center">
        <span>Queue is empty.</span>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => e.preventDefault()}>
    <fieldset disabled={refreshing}>
    <div className={refreshing ? 'animate-pulse': ''}>

      <div className="flex justify-between mb-1">
        <button 
          className={`bg-blue-500 hover:bg-blue-400 text-white py-1 px-1 w-1/6 border-b-2 border-blue-700 hover:border-blue-500 rounded ${iblocks.length == 0 && "cursor-not-allowed"}`}
          disabled={iblocks.length == 0}
          onClick={onLearn}
        >
          Learn 
        </button>

        <div>
          <button 
            className="hover:bg-gray-100 border py-1 px-1 rounded" 
            onClick={toggleDatePicker}
          >
            📅
          </button>
          <button 
            className="hover:bg-gray-100 border py-1 px-1 rounded" 
            onClick={() => refresh()}
          >
            🔄
          </button>
        </div>
      </div>

      <div className="flex justify-around mb-1">
        {showDatePicker && <DatePicker
          className={"border" + (showDatePicker ? 'block' : 'hidden')}
          selected={date}
          onChange={(date) => !refreshing && date && loadQueueDate(date)}
          minDate={refreshing ? date : todayMidnight()}
          maxDate={refreshing ? date : undefined}
          monthsShown={1}
          dateFormat="dd/MM/yyyy"
          inline
        />}
      </div>

      <hr></hr>

    {/* {refreshing && 
      <div className="text-neutral-500 flex justify-center">
        <span>Refreshing queue...</span>
      </div>
    } */}

    {refButtons.length > 0 && <div className="p-2 space-y-1">
      {refButtons}
    </div>}

    {queueView}
    </div></fieldset></form>
  );
}