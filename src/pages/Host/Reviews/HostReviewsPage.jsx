import moment from "moment";
import React from "react";
import { useContext } from "react";
import { useEffect } from "react";
import { useState } from "react";

import { Link } from "react-router-dom";
import StarIcon from "@/components/frontend/icons/StarIcon";
import PaginationBar from "@/components/PaginationBar";
import PaginationHeader from "@/components/PaginationHeader";
import { GlobalContext } from "@/globalContext";
import useDelayUnmount from "@/hooks/useDelayUnmount";
import { callCustomAPI } from "@/utils/callCustomAPI";
import CustomSelect from "@/components/frontend/CustomSelect";

const columns = [
  {
    header: "ID",
    accessor: "id",
  },
  {
    header: "BOOKING DATE",
    accessor: "booking_start_time",
  },
  {
    header: "SPACE",
    accessor: "name",
  },
  {
    header: "GUEST",
    accessor: "host_full_name",
  },
  {
    header: "RATING",
    accessor: "rating",
  },
  {
    header: "STATUS",
    accessor: "status",
    mapping: ["Under Review", "Posted", "Declined"],
  },
  {
    header: "ACTION",
    accessor: "",
  },
];

export default function HostReviewsPage() {
  const [type, setType] = useState(0);
  const [viewReviewPopup, setViewReviewPopup] = useState(false);
  const showViewReviewPopup = useDelayUnmount(viewReviewPopup, 100);

  const [viewReviewData, setViewReviewData] = useState({});

  const [pageSize, setPageSize] = useState(10);
  const [pageCount, setPageCount] = useState(0);
  const [dataTotal, setDataTotal] = useState(0);
  const [currentPage, setPage] = useState(0);
  const [canPreviousPage, setCanPreviousPage] = useState(false);
  const [canNextPage, setCanNextPage] = useState(false);
  const [rows, setRows] = useState([]);
  const [direction, setDirection] = useState("DESC");

  const { dispatch: globalDispatch } = useContext(GlobalContext);

  async function getData(pageNum, pageSize) {
    globalDispatch({ type: "START_LOADING" });

    const user_id = localStorage.getItem("user");
    const where = [`ergo_booking.host_id = ${user_id}`, `ergo_review.given_by = ${type == 1 ? "'host'" : "'customer'"}`];
    try {
      const result = await callCustomAPI(
        "review-hashtag",
        "post",
        {
          where,
          page: pageNum,
          limit: pageSize,
          user: "host",
          sortId: "post_date",
          direction: "DESC",
        },
        "PAGINATE",
      );

      const { list, total, limit, num_pages, page } = result;
      setRows(list);
      setPageSize(limit);
      setPageCount(num_pages);
      setPage(page);
      setDataTotal(total);
      setCanPreviousPage(page > 1);
      setCanNextPage(page + 1 <= num_pages);
    } catch (err) {
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          heading: "Operation failed",
          message: err.message,
        },
      });
    }
    globalDispatch({ type: "STOP_LOADING" });
  }

  function updatePageSize(limit) {
    (async function () {
      setPageSize(limit);
      await getData(0, limit);
    })();
  }
  function previousPage() {
    (async function () {
      await getData(currentPage - 1 > 0 ? currentPage - 1 : 0, pageSize);
    })();
  }

  function nextPage() {
    (async function () {
      await getData(currentPage + 1 <= pageCount ? currentPage + 1 : 0, pageSize);
    })();
  }

  useEffect(() => {
    getData(1, 10);
  }, [type]);

  const sortByDate = (a, b) => {
    if (direction == "DESC") {
      return new Date(b.update_at) - new Date(a.update_at);
    }
    return new Date(a.update_at) - new Date(b.update_at);
  };

  return (
    <div data-tour="customer_review" className="pt-[44px] min-h-screen">
      <div className="flex flex-wrap justify-between mb-[16px] items-start">
        <div className="md:w-[unset] w-full mb-4 flex">
          <button
            className={`${type == 0 ? "bg-[#F2F4F7] border" : ""} py-[8px] md:px-[12px] px-12 flex-grow rounded-sm mr-[16px] `}
            onClick={() => setType(0)}
          >
            Received
          </button>
          <button
            className={`${type == 1 ? "bg-[#F2F4F7] border" : ""} py-[8px] md:px-[12px] px-12 flex-grow rounded-sm`}
            onClick={() => setType(1)}
          >
            Given
          </button>
        </div>
        <CustomSelect
          options={[
            { label: "By Date: Newest First", value: "DESC" },
            { label: "By Date: Oldest First", value: "ASC" },
          ]}
          onChange={setDirection}
          accessor="label"
          valueAccessor="value"
          className="md:max-w-[200px] flex-grow"
          listOptionClassName={"pl-4"}
        />
      </div>
      <div className="snap-scroll">
        <PaginationHeader
          currentPage={currentPage}
          pageSize={pageSize}
          totalNumber={dataTotal}
          updatePageSize={updatePageSize}
          noBorder
        />
      </div>
      <div className="snap-scroll">
        <table className="min-w-full divide-y divide-gray-200 bg-white mt-1">
          <thead className="bg-[#F9FAFB] border-t border-b border-[#EAECF0] cursor-pointer">
            <tr className="cursor-pointer">
              {columns.map((column, index) => (
                <th
                  key={index}
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer whitespace-nowrap"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rows.sort(sortByDate).map((row, i) => {
              return (
                <tr
                  className="py-4 text-sm"
                  key={i}
                >
                  {columns.map((cell, index) => {
                    if (cell.accessor === "") {
                      return (
                        <td
                          key={index}
                          className="px-6 py-6 whitespace-nowrap gap-3"
                        >
                          <button
                            className="pr-4 bg-gradient-to-r from-[#33D4B7] to-[#0D9895] bg-clip-text text-transparent font-bold"
                            onClick={() => {
                              setViewReviewData(row);
                              setViewReviewPopup(true);
                            }}
                          >
                            View
                          </button>
                        </td>
                      );
                    }
                    if (cell.accessor.includes("rating")) {
                      return (
                        <td
                          key={index}
                          className="px-6 py-4 whitespace-nowrap"
                        >
                          <span className="flex items-center gap-2">
                            <StarIcon />
                            {(Number(type == 0 ? row.space_rating : row.customer_rating) || 0).toFixed(1)}
                          </span>
                        </td>
                      );
                    }
                    if (cell.accessor == "booking_start_time") {
                      return (
                        <td
                          key={index}
                          className="px-6 py-4 whitespace-nowrap"
                        >
                          {moment(row[cell.accessor]).format("MM/DD/YY")}
                        </td>
                      );
                    }
                    if (cell.accessor == "host_full_name") {
                      return (
                        <td
                          key={index}
                          className="px-6 py-4 whitespace-nowrap"
                        >
                          {row[`customer_first_name`] + " " + row[`customer_last_name`]}
                        </td>
                      );
                    }
                    if (cell.mapping) {
                      return (
                        <td
                          key={index}
                          className="px-6 py-4 whitespace-nowrap"
                        >
                          <span className={`${row[cell.accessor] === 1 ? "text-black" : "text-[#98A2B3]"} rounded-full bg-[#F9FAFB] border border-[#EAECF0] py-[2px] px-[10px]`}>
                            {" "}
                            {cell.mapping[row[cell.accessor]]}
                          </span>
                        </td>
                      );
                    }
                    return (
                      <td
                        key={index}
                        className="px-6 py-4 whitespace-nowrap"
                      >
                        {row[cell.accessor]}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="snap-scroll">
        <PaginationBar
          currentPage={currentPage}
          totalNumber={dataTotal}
          pageCount={pageCount}
          pageSize={pageSize}
          canPreviousPage={canPreviousPage}
          canNextPage={canNextPage}
          updatePageSize={updatePageSize}
          previousPage={previousPage}
          nextPage={nextPage}
          className="px-1 items-center"
        />
      </div>

      {showViewReviewPopup && (
        <div
          className="popup-container flex items-center justify-center normal-case"
          onClick={() => setViewReviewPopup(false)}
        >
          <div
            className={`${viewReviewPopup ? "pop-in" : "pop-out"} bg-white p-5 md:px-5 px-3 rounded-lg w-[510px] max-w-[80%]`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-[18px]">
              <h3 className="text-2xl font-semibold">Review details</h3>
              <button
                type="button"
                onClick={() => setViewReviewPopup(false)}
                className="p-1 border hover:bg-gray-200 active:bg-gray-300 duration-100 px-3 text-2xl font-normal rounded-full"
              >
                &#x2715;
              </button>{" "}
            </div>
            <hr className="mb-4" />
            <p className="mb-[8px]">
              Review posted on: <span> {moment(viewReviewData.booking_start_time ?? "11/11/11").format("MM/DD/YY")}</span>
            </p>
            <p className="mb-[8px]">
              Space: <span>{viewReviewData.name ?? ""}</span>
            </p>
            <p className="mb-[16px]">
              Booking: <span> #{viewReviewData.booking_id ?? ""}</span>{" "}
              <Link
                to={`/account/my-bookings/${viewReviewData.booking_id}`}
                className="text-sm font-semibold underline"
              >
                (View details)
              </Link>
            </p>
            <h4 className="text-xl font-semibold mb-[8px]">Rating</h4>
            <div className="flex gap-6 mb-[24px]">
              {[1, 2, 3, 4, 5].map((val) => (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill={(type == 1 ? viewReviewData.customer_rating : viewReviewData.space_rating) >= val ? "#FEC84B" : "none"}
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M14.1614 16.3677L13.7068 16.1595C13.6543 16.274 13.5845 16.3632 13.4966 16.4344C13.4273 16.4905 13.3479 16.524 13.2431 16.5331C13.1667 16.5398 13.0863 16.5237 12.9876 16.4582L12.9877 16.4581L12.9771 16.4515L8.82711 13.8473L8.56135 13.6805L8.29559 13.8473L4.14559 16.4515L4.1455 16.4513L4.13509 16.4582C4.03641 16.5237 3.956 16.5398 3.87959 16.5331C3.7748 16.524 3.69535 16.4905 3.6261 16.4344C3.53833 16.3633 3.46858 16.2743 3.41616 16.16C3.38464 16.0908 3.36936 15.9998 3.39942 15.8638C3.39945 15.8636 3.39948 15.8635 3.39951 15.8634L4.49931 10.9424L4.56306 10.6572L4.34582 10.4617L0.675047 7.15819C0.576587 7.06488 0.531828 6.97672 0.514002 6.89047L0.514006 6.89047L0.513604 6.88857C0.490262 6.7778 0.497009 6.67532 0.533413 6.57104C0.576075 6.44883 0.633362 6.3661 0.698165 6.30703C0.737553 6.27113 0.815759 6.22473 0.972179 6.19965L5.8068 5.75835L6.11051 5.73062L6.22487 5.44791L8.09987 0.812492L8.10059 0.810696C8.1474 0.693678 8.20855 0.628401 8.27973 0.586111L8.28045 0.585682C8.38637 0.522513 8.4778 0.5 8.56135 0.5C8.64484 0.5 8.73672 0.522488 8.84348 0.585824C8.91401 0.627946 8.97513 0.693252 9.02211 0.810696L9.02283 0.81249L10.8978 5.44791L11.0122 5.73062L11.3159 5.75835L16.1505 6.19965C16.3069 6.22473 16.3851 6.27113 16.4245 6.30703C16.4893 6.3661 16.5466 6.44883 16.5893 6.57105C16.6258 6.67572 16.6328 6.7786 16.6099 6.88955C16.5915 6.97634 16.5462 7.06483 16.4477 7.15818L12.7769 10.4617L12.5596 10.6572L12.6234 10.9424L13.7232 15.8634C13.7232 15.8635 13.7232 15.8636 13.7233 15.8637C13.7534 15.9999 13.738 16.0909 13.7065 16.1602L14.1614 16.3677ZM14.1614 16.3677C14.2447 16.1851 14.2613 15.9809 14.2113 15.7552L2.96135 16.3677C3.04468 16.5497 3.16135 16.7014 3.31135 16.8229C3.46135 16.9444 3.63635 17.0139 3.83635 17.0312C4.03635 17.0486 4.22802 16.9965 4.41135 16.875L8.56135 14.2708L12.7113 16.875C12.8947 16.9965 13.0864 17.0486 13.2864 17.0312C13.4864 17.0139 13.6614 16.9444 13.8113 16.8229C13.9613 16.7014 14.078 16.5497 14.1614 16.3677Z"
                    stroke={(type == 1 ? viewReviewData.customer_rating : viewReviewData.space_rating) >= val ? "#FEC84B" : "#98A2B3"}
                  />
                </svg>
              ))}
            </div>
            {viewReviewData.host_rating && (
              <>
                <h4 className="text-xl font-semibold mb-[8px]">Host rating</h4>
                <div className="flex gap-6 mb-[24px]">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill={viewReviewData.host_rating >= val ? "#FEC84B" : "none"}
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M14.1614 16.3677L13.7068 16.1595C13.6543 16.274 13.5845 16.3632 13.4966 16.4344C13.4273 16.4905 13.3479 16.524 13.2431 16.5331C13.1667 16.5398 13.0863 16.5237 12.9876 16.4582L12.9877 16.4581L12.9771 16.4515L8.82711 13.8473L8.56135 13.6805L8.29559 13.8473L4.14559 16.4515L4.1455 16.4513L4.13509 16.4582C4.03641 16.5237 3.956 16.5398 3.87959 16.5331C3.7748 16.524 3.69535 16.4905 3.6261 16.4344C3.53833 16.3633 3.46858 16.2743 3.41616 16.16C3.38464 16.0908 3.36936 15.9998 3.39942 15.8638C3.39945 15.8636 3.39948 15.8635 3.39951 15.8634L4.49931 10.9424L4.56306 10.6572L4.34582 10.4617L0.675047 7.15819C0.576587 7.06488 0.531828 6.97672 0.514002 6.89047L0.514006 6.89047L0.513604 6.88857C0.490262 6.7778 0.497009 6.67532 0.533413 6.57104C0.576075 6.44883 0.633362 6.3661 0.698165 6.30703C0.737553 6.27113 0.815759 6.22473 0.972179 6.19965L5.8068 5.75835L6.11051 5.73062L6.22487 5.44791L8.09987 0.812492L8.10059 0.810696C8.1474 0.693678 8.20855 0.628401 8.27973 0.586111L8.28045 0.585682C8.38637 0.522513 8.4778 0.5 8.56135 0.5C8.64484 0.5 8.73672 0.522488 8.84348 0.585824C8.91401 0.627946 8.97513 0.693252 9.02211 0.810696L9.02283 0.81249L10.8978 5.44791L11.0122 5.73062L11.3159 5.75835L16.1505 6.19965C16.3069 6.22473 16.3851 6.27113 16.4245 6.30703C16.4893 6.3661 16.5466 6.44883 16.5893 6.57105C16.6258 6.67572 16.6328 6.7786 16.6099 6.88955C16.5915 6.97634 16.5462 7.06483 16.4477 7.15818L12.7769 10.4617L12.5596 10.6572L12.6234 10.9424L13.7232 15.8634C13.7232 15.8635 13.7232 15.8636 13.7233 15.8637C13.7534 15.9999 13.738 16.0909 13.7065 16.1602L14.1614 16.3677ZM14.1614 16.3677C14.2447 16.1851 14.2613 15.9809 14.2113 15.7552L2.96135 16.3677C3.04468 16.5497 3.16135 16.7014 3.31135 16.8229C3.46135 16.9444 3.63635 17.0139 3.83635 17.0312C4.03635 17.0486 4.22802 16.9965 4.41135 16.875L8.56135 14.2708L12.7113 16.875C12.8947 16.9965 13.0864 17.0486 13.2864 17.0312C13.4864 17.0139 13.6614 16.9444 13.8113 16.8229C13.9613 16.7014 14.078 16.5497 14.1614 16.3677Z"
                        stroke={viewReviewData.host_rating >= val ? "#FEC84B" : "#98A2B3"}
                      />
                    </svg>
                  ))}
                </div>
              </>
            )}
            <h4 className="text-xl font-semibold mb-[8px]">Hashtags</h4>
            <div className="lg:flex hidden gap-[12px] whitespace-nowrap mb-[16px]">
              {viewReviewData.hashtags ? (
                viewReviewData.hashtags.split(",").map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[14px] bg-[#F2F4F7] rounded-[3px] pt-[2px] px-[8px] pb-[3px] text-[#667085]"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <></>
              )}
            </div>
            <h4 className="text-xl font-semibold mb-[8px]">Comments</h4>
            <p className="mb-2">{viewReviewData.comment ?? ""}</p>
            <button
              className="tracking-wide outline-none focus:outline-none rounded py-2 border-2 border-[#98A2B3] mt-4 w-full"
              onClick={() => setViewReviewPopup(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
