import React from "react";

interface ISelect {
  options: string[] | readonly string[] ,
  isSelected: (option: string) => boolean,
  selected: (option: string) => void,
  textBuilder?: (option: string) => string
}

export default function Select({ options, isSelected, selected, textBuilder }: ISelect) {
  const optionEls = options.map((option) => {
    return <option value={option} selected={isSelected(option)}>
      { textBuilder ? textBuilder(option) : option }
    </option>;
  });
  
  return (
  <select
    onChange={(e) => selected(e.target.value)}
    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full px-1 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white">
    { optionEls }
  </select>
  );
}