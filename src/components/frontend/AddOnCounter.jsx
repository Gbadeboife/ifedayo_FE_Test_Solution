import React from "react";
import { useState } from "react";

const AddOnCounter = ({ data, register, singleName }) => {
  const [counter, setCounter] = useState(1);
  console.log(singleName)


  return (
    <div className="flex justify-between mb-[12px]">
      <form className="checkbox-container">
        <input
          type="checkbox"
          className=""
          id={"cb" + data.id}
          value={data.cost}
          {...register(singleName ?? data.add_on_name)}
        />
        <label className="text-black" htmlFor={"cb" + data.id}>{data.add_on_name}</label>
      </form>

      <div className="flex gap-[32px] items-center">
        {data.showCounter && (
          <div className="border border-[#475467] rounded-xl p-2 flex gap-[10px] items-center text-white">
            <button
              className={"border rounded-full px-2 text-white" + (counter > 0 ? " border-[#475467]" : "")}
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
};

export default AddOnCounter;
