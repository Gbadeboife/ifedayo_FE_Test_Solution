import React, { useEffect, useRef } from "react";
import { useState } from "react";
import { createSearchParams, Link, useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import PaginationBar from "@/components/PaginationBar";
import PaginationHeader from "@/components/PaginationHeader";
import useDelayUnmount from "@/hooks/useDelayUnmount";
import CustomSelect from "@/components/frontend/CustomSelect";
import { useContext } from "react";
import { GlobalContext } from "@/globalContext";
import { callCustomAPI } from "@/utils/callCustomAPI";
import { formatDate, isSameDay, monthsMapping } from "@/utils/date-time-utils";
import { useForm } from "react-hook-form";
import { formatDate2, isValidDate, parseSearchParams } from "@/utils/utils";
import DatePicker from "@/components/frontend/DatePicker";
import DownloadIcon from "@/components/frontend/icons/DownloadIcon";
import moment from "moment";
import CsvDownloadButton from "react-json-to-csv";
import DatePickerV2 from "@/components/frontend/DatePickerV2";

const columns = [
  {
    header: "BOOKING DATE",
    accessor: "booking_start_time",
  },
  {
    header: "SPACE",
    accessor: "space",
  },
  {
    header: "PAYMENT METHOD",
    accessor: "payment_method",
  },
  {
    header: "AMOUNT",
    accessor: "amount",
  },
  {
    header: "RECEIPT",
    accessor: "receipt",
  },
  {
    header: "ACTION",
    accessor: "",
  },
];
const HostPaymentsPage = () => {
  const [viewPaymentPopup, setViewPaymentPopup] = useState(false);
  const showViewPaymentPopup = useDelayUnmount(viewPaymentPopup, 300);
  const role = localStorage.getItem("role");
  const [searchParams, setSearchParams] = useSearchParams();
  const [pageSize, setPageSize] = useState(10);
  const [pageCount, setPageCount] = useState(0);
  const [dataTotal, setDataTotal] = useState(0);
  const [currentPage, setPage] = useState(0);
  const [canPreviousPage, setCanPreviousPage] = useState(false);
  const [canNextPage, setCanNextPage] = useState(false);
  const [direction, setDirection] = useState("DESC");
  const [rows, setRows] = useState([]);
  const [mySpaces, setMySpaces] = useState([]);
  const { dispatch: globalDispatch } = useContext(GlobalContext);
  const [selectedPayment, setSelectedPayment] = useState({});

  const initialSearchDate = useRef(new Date());
  const [fromDate, setFromDate] = useState(initialSearchDate.current);
  const [toDate, setToDate] = useState(initialSearchDate.current);

  const { handleSubmit, register, reset, setValue, control, dirtyFields } = useForm({
    defaultValues: (() => {
      const params = parseSearchParams(searchParams);
      return {
        from: "",
        to: "",
      }
    })(),
  });


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

  async function getData(pageNum, pageSize) {
    globalDispatch({ type: "START_LOADING" });
    const data = parseSearchParams(searchParams);
    const user_id = localStorage.getItem("user");

    var start = data?.from;
    var end = data?.to;

    const where = [
      `${role == "host" ? `ergo_booking.host_id = ${user_id}` : `ergo_booking.customer_id = ${user_id}`}
         AND ${data.space_id ? `ergo_property_spaces.id = ${data.space_id}` : "1"}
       AND ergo_booking.status = 3 ${start ? `AND ergo_booking.booking_start_time BETWEEN '${start}' AND '${end}'` : ""}`,
    ];
    try {
      const result = await callCustomAPI(
        "booking",
        "post",
        {
          where,
          page: pageNum,
          limit: pageSize,
          sortId: "update_at",
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

  async function fetchMySpaces() {
    let user_id = localStorage.getItem("user");
    let where = [`ergo_property.host_id = ${user_id}`];
    try {
      const result = await callCustomAPI("popular", "post", { page: 1, limit: 1000, user_id, where, all: true, sortId: "update_at", direction: "DESC" }, "PAGINATE");
      if (Array.isArray(result.list)) {
        setMySpaces(result.list);
      }
    } catch (err) {
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          heading: "Operation failed",
          message: err.message,
        },
      });
    }
  }

  const onSubmit = async (data) => {
    console.log(data)
    const formatFrom = formatDate2(data.from)
    const formatTo = formatDate2(data.to)

    searchParams.set("from", data.from ? formatFrom : "");
    searchParams.set("to", data.to ? formatTo : new Date().toISOString().split("T")[0]);
    searchParams.set("status", data.status);
    searchParams.set("space_id", data.space_id);
    setSearchParams(searchParams);
    getData(1, pageSize);
  };

  useEffect(() => {
    getData(1, pageSize);
    fetchMySpaces();
  }, []);

  const sortByDate = (a, b) => {
    if (direction == "DESC") {
      return new Date(b.update_at) - new Date(a.update_at);
    }
    return new Date(a.update_at) - new Date(b.update_at);
  };

  function handlePrint() {
    var myWindow = window.open("", "PRINT", "height=400,width=600");

    myWindow.document.write("<html><head><title>" + document.title + "</title>");
    myWindow.document.write("</head><body >");
    myWindow.document.write("<h1>" + document.title + "</h1>");
    myWindow.document.write(document.getElementById("receipt").innerHTML);
    myWindow.document.write("</body></html>");

    myWindow.document.close(); // necessary for IE >= 10
    myWindow.focus(); // necessary for IE >= 10*/

    myWindow.print();
    // myWindow.close();
  }

  return (
    <div className="pt-[44px] min-h-screen">
      <div className="">
      <div className="flex justify-between items-center mb-0 sm:mb-[21px] flex-wrap">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="sm:flex gap-[12px] items-center w-full flex-wrap md:mb-0 mb-4"
        >

          <div className="z-10 min-w-[190px] rounded-md bg-white h-fit">
            <DatePickerV2
              reset={() => resetField("from", { keepDirty: false, keepTouched: false })}
              setValue={(val) => setValue("from", val, { shouldDirty: true })}
              control={control}
              name="from"
              labelClassName="justify-between flex-grow flex-row-reverse"
              placeholder="Start"
              type="space"
              min={new Date("2001-01-01")}
            />
          </div>

          <div className="z-10 min-w-[190px] rounded-md bg-white h-fit">
            <DatePickerV2
              reset={() => resetField("to", { keepDirty: false, keepTouched: false })}
              setValue={(val) => setValue("to", val, { shouldDirty: true })}
              control={control}
              name="to"
              labelClassName="justify-between flex-grow flex-row-reverse"
              placeholder="End"
              type="space"
              min={new Date("2001-01-01")}
            />
          </div>

          <CustomSelect
            options={mySpaces}
            name="space_id"
            accessor="name"
            valueAccessor="id"
            register={register}
            setValue={setValue}
            formMode
            defaultValue={{ name: "All Spaces", value: "" }}
            className="min-w-[200px] mb- sm:mb-0"
            defaultOptionClassName="text-[#667085]"
          />
          <div className="flex items-center gap-6">
            <button
              type="submit"
              className="sm:mt-0 sm:mb-0 border-black border h-fit p-2 px-6 w-fit rounded-md"
            >
              Search
            </button>
            <div className="grid justify-start sm:flex sm:justify-end my-4">
              <CsvDownloadButton
                id="test-table-xls-button"
                filename="payout"
                data={rows}
                className="border-black border p-2 px-6 rounded-md flex gap-2"
              >
                <DownloadIcon /> Export CSV
              </CsvDownloadButton>
            </div>
          </div>

        </form>
      </div>
      <div className="flex justify-between mb-[16px] items-center">
        <h2 className="text-2xl">
          Total Paid Out: <strong>${rows.reduce((acc, curr) => acc + (curr.total + curr.addon_cost), 0).toFixed(2)}</strong>
        </h2>
        <CustomSelect
          options={[
            { label: "By Date: Newest First", value: "DESC" },
            { label: "By Date: Oldest First", value: "ASC" },
          ]}
          onChange={setDirection}
          accessor="label"
          valueAccessor="value"
          className="min-w-[200px]"
        />
      </div>
      </div>
      <PaginationHeader
        currentPage={currentPage}
        pageSize={pageSize}
        totalNumber={dataTotal}
        updatePageSize={updatePageSize}
        noBorder
      />
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
                              setSelectedPayment(row);
                              setViewPaymentPopup(true);
                            }}
                          >
                            View
                          </button>
                        </td>
                      );
                    }
                    if (cell.accessor == "booking_start_time") {
                      var date = new Date(row[cell.accessor]);
                      return (
                        <td
                          key={index}
                          className="px-6 py-4 whitespace-nowrap"
                        >
                          {monthsMapping[date.getMonth()] + " " + date.getDate() + "/" + date.getFullYear()}
                        </td>
                      );
                    }
                    if (cell.accessor == "space") {
                      var date = new Date(row[cell.accessor]);
                      return (
                        <td
                          key={index}
                          className="px-6 py-4 whitespace-nowrap"
                        >
                          {row.property_name + " " + row.space_category}
                        </td>
                      );
                    }
                    if (cell.accessor == "amount") {
                      var date = new Date(row[cell.accessor]);
                      return (
                        <td
                          key={index}
                          className="px-6 py-4 whitespace-nowrap"
                        >
                          {"$" + (row.total + row.addon_cost).toFixed(2)}
                        </td>
                      );
                    }
                    if (cell.accessor == "receipt") {
                      return (
                        <td
                          key={index}
                          className="px-6 py-4 whitespace-nowrap"
                        >
                          {row.id}
                        </td>
                      );
                    }
                    if (cell.accessor == "payment_method") {
                      return (
                        <td
                          key={index}
                          className="px-6 py-4 whitespace-nowrap"
                        >
                          Credit Card
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
      />

      {showViewPaymentPopup && (
        <div
          className="popup-container flex items-center justify-center normal-case"
          onClick={() => setViewPaymentPopup(false)}
        >
          <div
            className={`${viewPaymentPopup ? "pop-in" : "pop-out"} bg-white p-5 md:px-5 px-3 rounded-lg w-[510px] max-w-[80%]`}
            onClick={(e) => e.stopPropagation()}
            id="receipt"
          >
            <div className="flex justify-between items-center mb-[18px]">
              <h3 className="text-2xl font-semibold mb-[8px]">Payment details</h3>
              <button
                type="button"
                onClick={() => setViewPaymentPopup(false)}
                className="p-1 border hover:bg-gray-200 duration-300 px-3 text-2xl font-normal rounded-full"
              >
                &#x2715;
              </button>
            </div>
            <hr className="mb-4" />
            <p className="mb-[8px]">
              Booking Started on: <span>{formatDate(selectedPayment.booking_start_time)}</span>
            </p>
            <p className="mb-[8px]">
              Space name: <span>{selectedPayment.property_name}</span>
            </p>
            <p className="mb-[16px]">
              Booking: <span> #{selectedPayment.id}</span>{" "}
              <Link
                to={"/account/my-bookings/" + selectedPayment.id}
                className="text-sm font-semibold underline"
              >
                (View booking details)
              </Link>
            </p>
            <p className="mb-[16px]">
              Space: <span> #{selectedPayment.property_space_id}</span>{" "}
              <Link
                to={"/property/" + selectedPayment.property_space_id}
                className="text-sm font-semibold underline"
              >
                (View booking details)
              </Link>
            </p>
            <p className="mb-[8px]">
              Total cost: <span>${selectedPayment.total?.toFixed(2)}</span>
            </p>
            <p className="mb-[8px]">
              Total addon cost: <span>${selectedPayment.addon_cost?.toFixed(2)}</span>
            </p>
            <button
              onClick={handlePrint}
              className="pr-4 bg-gradient-to-r from-[#33D4B7] to-[#0D9895] bg-clip-text text-transparent font-bold focus:outline-none"
            >
              Print receipt
            </button>
            <button
              className="tracking-wide outline-none focus:outline-none rounded py-2 border-2 border-[#98A2B3] mt-4 w-full"
              onClick={() => setViewPaymentPopup(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HostPaymentsPage;
