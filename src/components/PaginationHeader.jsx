import React from "react";

const PaginationBar = ({ currentPage, pageSize, updatePageSize, totalNumber, noBorder }) => {
  return (
    <>
      <div className={"flex justify-between bg-white py-4 font-medium items-center text-[#667085] " + (noBorder ? "" : "border px-6")}>
        <div className="">
          <p className="text-sm mb-0">
            Showing{" "}
            <span>
              {totalNumber < 1 ? 0 : currentPage > 1 ? (currentPage - 1) * pageSize + 1 : currentPage}-{currentPage * pageSize < totalNumber ? currentPage * pageSize : totalNumber} of {totalNumber}
            </span>{" "}
          </p>
        </div>
        {/*  */}
        <div>
          <span className="mr-2 text-sm">Results per page:</span>
          <select
            className="md:mt-2 cursor-pointer border w-[53px] py-1 text-sm bg-white"
            value={pageSize}
            onChange={(e) => {
              updatePageSize(Number(e.target.value));
            }}
          >
            {[5, 10, 20, 30, 40, 50, "ALL"].map((pageSize) => (
              <option
                key={pageSize}
                value={pageSize == "ALL" ? 100000 : pageSize}
              >
                {pageSize}
              </option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
};

export default PaginationBar;
