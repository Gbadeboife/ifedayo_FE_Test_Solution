import React from "react";
import Icon from "./Icons";
const PaginationBar = ({ currentPage, pageSize, canPreviousPage, canNextPage, previousPage, nextPage, totalNumber, className }) => {
  return (
    <>
      <div className={`flex justify-between px-6 text-[#667085] font-medium py-2 items-center text-sm ${className ?? ""}`}>
        <div className="md:mt-2">
          <span>
            Showing{" "}
            <strong>
              {totalNumber < 1 ? 0 : currentPage > 1 ? (currentPage - 1) * pageSize + 1 : currentPage} - {currentPage * pageSize < totalNumber ? currentPage * pageSize : totalNumber} of {totalNumber}
            </strong>{" "}
          </span>
        </div>
        {/*  */}
        <div className="flex">
          <button
            type="button"
            onClick={previousPage}
            disabled={!canPreviousPage}
            className="disabled:opacity-50 font-semibold text-sm md:px-5 px-3 py-2.5 text-center inline-flex items-center md:mr-2 md:mb-2"
          >
            <Icon
              type="arrow"
              variant="narrow-left"
              className="stroke-[#667085] h-4 w-4"
            />{" "}
            <span className="ml-2">Prev</span>
          </button>

          <button
            type="button"
            onClick={nextPage}
            disabled={!canNextPage}
            className="disabled:opacity-50 font-semibold text-sm md:px-5 px-3 py-2.5 text-center inline-flex items-center mr-2 md:mb-2"
          >
            <span className="mr-2">Next</span>
            <Icon
              type="arrow"
              variant="narrow-right"
              className="stroke-[#667085]  h-4 w-4"
            />
          </button>
        </div>
      </div>
    </>
  );
};

export default PaginationBar;
