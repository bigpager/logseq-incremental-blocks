import "@logseq/libs";

import React, { useEffect, useRef, useState } from "react";
import * as ReactDOM from "react-dom/client";
import App from "./App";
import Beta from "./beta";
import "./index.css";

import { logseq as PL } from "../package.json";

// @ts-expect-error
const css = (t, ...args) => String.raw(t, ...args);

const pluginId = PL.id;

function main() {
  console.info(`#${pluginId}: MAIN`);

  // Element is in index.html
  const root = ReactDOM.createRoot(document.getElementById("app")!);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  function createModel() {
    return {
    };
  }

  logseq.provideModel(createModel());
  logseq.setMainUIInlineStyle({
    zIndex: 11,
  });

  const openIconName = "template-plugin-open";

  logseq.provideStyle(css`
    .${openIconName} {
      opacity: 0.55;
      font-size: 20px;
      margin-top: 4px;
    }

    .${openIconName}:hover {
      opacity: 0.9;
    }

    #ib-popover {
      position: fixed;
    }
  `);

  logseq.App.registerUIItem("toolbar", {
    key: openIconName,
    template: `
      <a id="${pluginId}" data-on-click="toggleMain" data-rect class="button">
        <i class="ti ti-brain" style="font-size: 20px"></i>
      </a>
    `
  });

  logseq.Editor.registerSlashCommand('Turn into incremental block',
    async ({ uuid }: { uuid: string }) => {
      const block = await logseq.Editor.getBlock(uuid);
      if (!block) return;
      console.log(block);

      let props = new Map<string, any>([
        ['ib-a', block.properties?.ibA ?? 1.0],
        ['ib-b', block.properties?.ibB ?? 1.0],
      ]);
      console.log(props);
      props.set('ib-sample', 
        block.properties?.ibSample ?? new Beta(props.get('ib-a'), props.get('ib-b')).sample());
      for (let [prop, val] of props) {
        await logseq.Editor.upsertBlockProperty(block.uuid, prop, val);
      }
    }
  );

  logseq.provideStyle(`
    .ib__container {
      display: flex;
    }

    .ib__container > div {
      display: flex;
      padding-left: 4px;
      padding-right: 4px;
    }
  `)

  logseq.App.onMacroRendererSlotted(async ({ slot, payload }) => {
    const [type] = payload.arguments
    if (!type?.startsWith(':ib')) return;
    const props = await logseq.Editor.getBlockProperties(payload.uuid);

    let sampleHtml = '';
    const sample = parseFloat(props['ibSample']);
    if (Beta.isValidSample(sample)) {
      sampleHtml = `
        <div class="border px-px">
          <span>${(sample*100).toFixed(2)}</span>
        </div>
      `;
    }

    let priorityHtml = '';
    const beta = Beta.fromProps(props);
    if (beta) {
      const mean = (beta.mean*100).toFixed(2);
      const std = (beta.std()*100).toFixed(1);
      priorityHtml = `<span>${mean} (± ${std})</span>`;
    } else {
      priorityHtml = '<span class="text-red-800">Not set</span>';
    }
    priorityHtml = `
    <div class="border flex space-x-1">
      <span class="font-semibold text-indigo-700">P</span>${priorityHtml}
    </div>
    `;

    let scheduleHtml = '';
    const due = props['ibDue'];

    logseq.provideUI({
      key: `ib__${slot}`,
      slot,
      reset: true,
      template: `
      <button
        class="ib__container rounded-lg border text-sm flex" 
        data-on-click="togglePopover" 
        data-on-focusout="hidePopover"
        data-block-uuid="${payload.uuid}"
        data-slot-id="${slot}"
      >
        ${sampleHtml}
        ${priorityHtml}
      </button>`
    });
  });
}

logseq.ready(main).catch(console.error);
