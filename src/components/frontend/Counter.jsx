import React from "react";
import { useEffect } from "react";
import { useState } from "react";

const Counter = ({ register, setValue, name, initialValue, maxCount, minCount }) => {
  const [counter, setCounter] = useState(Number(initialValue) || 0);

  useEffect(() => {
    setValue(name, counter);
  }, [counter]);

  useEffect(() => {
    setCounter(initialValue || 0);
  }, [initialValue]);

  return (
    <div className="p-2 flex gap-[10px] items-center font-semibold">
      <button
        type="button"
        className={"border-2 rounded-md px-3 text-2xl" + (counter > (minCount || 0) ? " border-black" : " border-[#D0D5DD]")}
        onClick={() =>
          setCounter((prev) => {
            if (prev == (minCount || 0)) return prev;
            return prev - 1;
          })
        }
      >
        -
      </button>
      <span>{counter}</span>
      <button
        type="button"
        className={"border-2 text-2xl rounded-md px-3" + (counter >= maxCount ? " border-[#D0D5DD]" : " border-black")}
        onClick={() =>
          setCounter((prev) => {
            if (prev + 1 > Number(maxCount)) return prev;
            return prev + 1;
          })
        }
      >
        +
      </button>
      <input
        type="hidden"
        {...register(name)}
      />
    </div>
  );
};

export default Counter;
