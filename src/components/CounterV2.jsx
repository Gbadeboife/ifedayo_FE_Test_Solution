import React from "react";
import { useController } from "react-hook-form";

export default function CounterV2({ setValue, name, maxCount, minCount, control }) {
  const { field, fieldState, formState } = useController({ control, name });

  return (
    <div className="flex items-center gap-[10px] p-2 font-semibold">
      <button
        type="button"
        className={"rounded-md border-2 border-black px-3 text-2xl disabled:border-[#D0D5DD]"}
        onClick={() => setValue(Number(field.value) - 1)}
        disabled={Number(field.value) <= (minCount || 0)}
        onBlur={field.onBlur}
      >
        -
      </button>
      <span>{field.value}</span>
      <button
        type="button"
        className={"rounded-md border-2 border-black px-3 text-2xl disabled:border-[#D0D5DD]"}
        onClick={() => setValue(Number(field.value) + 1)}
        disabled={Number(field.value) >= maxCount}
        onBlur={field.onBlur}
      >
        +
      </button>
    </div>
  );
}
