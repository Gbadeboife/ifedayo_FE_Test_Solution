import React from "react";
import { useState } from "react";

export default function AddonCounterV2({ data, register, name }) {
  const [counter, setCounter] = useState(1);
  return (
    <div className="flex justify-between mb-[12px]">
      <form className="checkbox-container mb-[12px]">
        <input
          type="checkbox"
          value={data.add_on_name}
          id={"cb" + data.id}
          {...register(name)}
        />
        <label htmlFor={"cb" + data.id}>{data.add_on_name}</label>
      </form>
      <div className="flex gap-[32px] items-center">
        {data.showCounter && (
          <div className="border border-[#475467] rounded-xl p-2 flex gap-[10px] items-center">
            <button
              className={"border rounded-full px-2" + (counter > 0 ? " border-[#475467]" : "")}
              onClick={() =>
                setCounter((prev) => {
                  if (prev == 0) return prev;
                  return prev - 1;
                })
              }
            >
              -
            </button>
            <span>{counter}</span>
            <button
              className={"border rounded-full px-2" + " border-[#475467]"}
              onClick={() => setCounter((prev) => prev + 1)}
            >
              +
            </button>
          </div>
        )}
        <p className="font-semibold text-[#344054]"> ${data.cost * counter}</p>
      </div>
    </div>
  );
}
