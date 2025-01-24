import React from "react";
import { AuthContext, tokenExpireError } from "@/authContext";
import MkdSDK from "@/utils/MkdSDK";
import { useForm } from "react-hook-form";
import { useSearchParams, Link } from "react-router-dom";
import { GlobalContext, showToast } from "@/globalContext";
import { clearSearchParams, parseSearchParams } from "@/utils/utils";
import PaginationBar from "@/components/PaginationBar";
import Button from "@/components/Button";
import PaginationHeader from "@/components/PaginationHeader";
import { ID_PREFIX, NOTIFICATION_STATUS, NOTIFICATION_TYPE } from "@/utils/constants";
import SwitchBulkMode from "@/components/SwitchBulkMode";
import moment from "moment";
import TreeSDK from "@/utils/TreeSDK";

let sdk = new MkdSDK();
let treeSdk = new TreeSDK();

const columns = [
  {
    header: "ID",
    accessor: "id",
    isSorted: true,
    isSortedDesc: true,
    idPrefix: ID_PREFIX.NOTIFICATION,
  },
  {
    header: "Host ID",
    accessor: "host_id",
    isSorted: true,
    isSortedDesc: true,
    idPrefix: ID_PREFIX.HOST,
  },
  {
    header: "Account Holder Name",
    accessor: "account_name",
    isSorted: true,
    isSortedDesc: true,
  },
  {
    header: "Routing number",
    accessor: "routing_number",
    isSorted: true,
    isSortedDesc: true,
  },
  {
    header: "Account Number",
    accessor: "account_number",
    isSorted: true,
    isSortedDesc: true,
  },
  {
    header: "Host Email",
    nested: "user",
    accessor: "email",
    isSorted: true,
    isSortedDesc: true,
  },
  // {
  //   header: "Actions",
  //   accessor: "",
  // },
];

export default function AdminPayoutMethodListPage() {
  const { dispatch } = React.useContext(AuthContext);
  const { state: globalState, dispatch: globalDispatch } = React.useContext(GlobalContext);
  const [tableColumns, setTableColumns] = React.useState(columns);
  const [data, setCurrentTableData] = React.useState([]);
  const [pageSize, setPageSize] = React.useState(10);
  const [pageCount, setPageCount] = React.useState(0);
  const [dataTotal, setDataTotal] = React.useState(0);
  const [currentPage, setPage] = React.useState(0);
  const [canPreviousPage, setCanPreviousPage] = React.useState(false);
  const [canNextPage, setCanNextPage] = React.useState(false);
  const [bulkMode, setBulkMode] = React.useState(false);
  const [bulkSelected, setBulkSelected] = React.useState([]);
  const [bulkStatus, setBulkStatus] = React.useState("");
  const [searchParams, setSearchParams] = useSearchParams(localStorage.getItem("admin_payout_method_filter") ?? "");

  const {
    reset,
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    defaultValues: parseSearchParams(searchParams),
  });

  function onSort(accessor) {
    const columns = tableColumns;
    const index = columns.findIndex((column) => column.accessor === accessor);
    const column = columns[index];
    column.isSortedDesc = !column.isSortedDesc;
    columns.splice(index, 1, column);
    setTableColumns(() => [...columns]);
    const sortedList = selector(data, column.isSortedDesc, accessor);
    setCurrentTableData(sortedList);
  }
  function selector(users, isSortedDesc, accessor) {
    if (accessor?.split(",").length > 1) {
      accessor = accessor.split(",")[0];
    }

    return users.sort((a, b) => {
      if (isSortedDesc) {
        if (isNaN(a[accessor])) {
          return a[accessor]?.toLowerCase() < b[accessor]?.toLowerCase() ? 1 : -1;
        } else {
          return a[accessor] < b[accessor] ? 1 : -1;
        }
      }
      if (!isSortedDesc) {
        if (isNaN(a[accessor])) {
          return a[accessor]?.toLowerCase() < b[accessor]?.toLowerCase() ? -1 : 1;
        } else {
          return a[accessor] < b[accessor] ? -1 : 1;
        }
      }
    });
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

  async function getData(pageNum, limitNum) {
    const data = parseSearchParams(searchParams);
    data.id = data.id?.replace(ID_PREFIX.PAYMENT_METHOD, "");
    data.host_id = data.host_id?.replace(ID_PREFIX.HOST, "");

    try {
      let filter = [];
      if (data.id) {
        filter.push(`ergo_payout_method.id,eq,${data.id}`);
      }
      if (data.host_id) {
        filter.push(`ergo_payout_method.host_id,eq,${data.host_id}`);
      }
      if (data.account_number) {
        filter.push(`ergo_payout_method.account_number,cs,${data.account_number}`);
      }
      if (data.account_name) {
        filter.push(`ergo_payout_method.account_name,cs,${data.account_name}`);
      }
      if (data.routing_number) {
        filter.push(`ergo_payout_method.routing_number,cs,${data.routing_number}`);
      }
      if (data.host_email) {
        filter.push(`ergo_user.email,cs,${data.host_email}`);
      }

      console.log("filter", filter);

      let result = await treeSdk.getPaginate("payout_method", {
        filter,
        join: ["user|host_id"],
        page: pageNum || 1,
        size: limitNum,
        order: "update_at",
      });
      console.log("res", result);

      const { list, total, limit, num_pages, page } = result;

      const sortedList = selector(list, false);
      setCurrentTableData(sortedList);
      setPageSize(limit);
      setPageCount(num_pages);
      setPage(page);
      setDataTotal(total);
      setCanPreviousPage(page > 1);
      setCanNextPage(page + 1 <= num_pages);
    } catch (error) {
      tokenExpireError(dispatch, error.message);
      showToast(globalDispatch, error.message, 4000, "ERROR");
    }
  }

  const onSubmit = (data) => {
    searchParams.set("id", data.id);
    searchParams.set("host_id", data.host_id);
    searchParams.set("account_name", data.account_name);
    searchParams.set("account_number", data.account_number);
    searchParams.set("routing_number", data.routing_number);
    searchParams.set("host_email", data.host_email);
    setSearchParams(searchParams);
    localStorage.setItem("admin_payout_method_filter", searchParams.toString());

    getData(1, pageSize);
  };

  React.useEffect(() => {
    globalDispatch({
      type: "SETPATH",
      payload: {
        path: "payout_method",
      },
    });
    getData(1, pageSize);
  }, []);

  return (
    <>
      <form
        className="rounded rounded-b-none border border-b-0 bg-white p-5"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="max-w-5xl">
          <div className="flex justify-between">
            <h4 className="text-2xl font-medium">Payout methods</h4>
          </div>
          <div className="filter-form-holder mt-10 flex flex-wrap">
            <div className="mb-4 w-full pr-2 pl-2 md:w-1/3">
              <label
                className="mb-2 block text-sm font-bold text-gray-700"
                htmlFor="id"
              >
                ID
              </label>
              <input
                {...register("id")}
                className={`focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.id?.message ? "border-red-500" : ""}`}
              />
              <p className="text-xs italic text-red-500">{errors.id?.message}</p>
            </div>
            <div className="mb-4 w-full pr-2 pl-2 md:w-1/3">
              <label
                className="mb-2 block text-sm font-bold text-gray-700"
                htmlFor="host_id"
              >
                Host ID
              </label>
              <input
                {...register("host_id")}
                className={`focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.host_id?.message ? "border-red-500" : ""}`}
              />
              <p className="text-xs italic text-red-500">{errors.host_id?.message}</p>
            </div>

            <div className="mb-4 w-full pr-2 pl-2 md:w-1/3">
              <label
                className="mb-2 block text-sm font-bold text-gray-700"
                htmlFor="host_email"
              >
                Host Email
              </label>
              <input
                {...register("host_email")}
                className={`focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.host_email?.message ? "border-red-500" : ""}`}
              />
              <p className="text-xs italic text-red-500">{errors.host_email?.message}</p>
            </div>
            <div className="mb-4 w-full pr-2 pl-2 md:w-1/3">
              <label
                className="mb-2 block text-sm font-bold text-gray-700"
                htmlFor="account_name"
              >
                Account Holder Name
              </label>
              <input
                {...register("account_name")}
                className={`focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.account_name?.message ? "border-red-500" : ""}`}
              />
              <p className="text-xs italic text-red-500">{errors.account_name?.message}</p>
            </div>
            <div className="mb-4 w-full pr-2 pl-2 md:w-1/3">
              <label
                className="mb-2 block text-sm font-bold text-gray-700"
                htmlFor="account_number"
              >
                Account Number
              </label>
              <input
                {...register("account_number")}
                className={`focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.account_number?.message ? "border-red-500" : ""}`}
              />
              <p className="text-xs italic text-red-500">{errors.account_number?.message}</p>
            </div>
            <div className="mb-4 w-full pr-2 pl-2 md:w-1/3">
              <label
                className="mb-2 block text-sm font-bold text-gray-700"
                htmlFor="routing_number"
              >
                Routing Number
              </label>
              <input
                {...register("routing_number")}
                className={`focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.routing_number?.message ? "border-red-500" : ""}`}
              />
              <p className="text-xs italic text-red-500">{errors.routing_number?.message}</p>
            </div>
          </div>
          <Button text="Search" />
          <button
            className="font-inter ml-2 cursor-pointer rounded-md border border-[#33D4B7] bg-gradient-to-r from-[#33D4B7] to-[#0D9895] bg-clip-text px-[66px] py-[10px] text-transparent"
            type="reset"
            onClick={() => {
              reset({ id: "", host_id: "", host_email: "", account_name: "", account_number: "", routing_number: "" });
              localStorage.removeItem("admin_payout_method_filter");
              clearSearchParams(searchParams, setSearchParams);
              getData(currentPage, pageSize);
            }}
          >
            Reset
          </button>
        </div>
      </form>

      <PaginationHeader
        currentPage={currentPage}
        pageSize={pageSize}
        totalNumber={dataTotal}
        updatePageSize={updatePageSize}
      />

      <div className="hidden justify-end bg-white px-6 pt-4">
        <SwitchBulkMode
          enabled={bulkMode}
          setEnabled={setBulkMode}
        />
      </div>

      {false && (
        <div className="flex items-center justify-between bg-white py-4 pl-2 pr-6 font-medium text-[#667085]">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              name="bulk-mode"
              id=""
              onClick={() => {
                if (bulkSelected.length != data.length) {
                  setBulkSelected(data.map((row) => row.id));
                } else {
                  setBulkSelected([]);
                }
              }}
              checked={bulkSelected.length == data.length && data.length > 0}
              onChange={() => {}}
            />
            Select All
          </label>
          {bulkSelected.length > 0 ? (
            <div className="flex items-start gap-4">
              <select
                className="mb-3 rounded border bg-white py-2 px-3 leading-tight text-gray-700 focus:outline-none"
                onChange={(e) => setBulkStatus(e.target.value)}
              >
                <option
                  value=""
                  className="none"
                >
                  NONE
                </option>
                {statusMapping.map((option, idx) => (
                  <option
                    name="status"
                    value={idx}
                    key={idx}
                  >
                    {option}
                  </option>
                ))}
              </select>
              <button
                className="whitespace-nowrap rounded-md !bg-gradient-to-r from-[#33D4B7] to-[#0D9895] px-6 py-2 text-sm font-semibold text-white"
                onClick={bulkChangeStatus}
              >
                Bulk Save
              </button>
            </div>
          ) : null}
        </div>
      )}

      <div className="overflow-x-auto">
        <div className="overflow-x-auto border-b border-gray-200 shadow ">
          <table className="min-w-full divide-y divide-gray-200 border border-t-0 bg-white">
            <thead className="cursor-pointer bg-gray-50">
              <tr className="cursor-pointer">
                {false && (
                  <th
                    scope="col"
                    className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  ></th>
                )}
                {columns.map((column, index) => (
                  <th
                    key={index}
                    scope="col"
                    className="cursor-pointer whitespace-nowrap px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    onClick={() => onSort(column.accessor)}
                  >
                    {column.header}
                    {column.isSorted}
                    <span>{column.isSorted ? (column.isSortedDesc ? " ▼" : " ▲") : ""}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((row, i) => {
                return (
                  <tr
                    className="py-2 text-sm"
                    key={i}
                  >
                    {false && (
                      <td className="whitespace-nowrap px-2 py-2">
                        <input
                          type="checkbox"
                          name="bulk-mode"
                          id=""
                          onClick={() => {
                            if (bulkSelected.includes(row.id)) {
                              setBulkSelected((prev) => {
                                let copy = [...prev];
                                copy.splice(
                                  prev.findIndex((id) => id == row.id),
                                  1,
                                );
                                return copy;
                              });
                            } else {
                              setBulkSelected((prev) => [...prev, row.id]);
                            }
                          }}
                          checked={bulkSelected.includes(row.id)}
                          onChange={() => {}}
                        />
                      </td>
                    )}
                    {tableColumns.map((cell, index) => {
                      if (cell.format) {
                        return (
                          <td
                            key={index}
                            className="whitespace-nowrap px-6 py-4"
                          >
                            {cell.format(row[cell.accessor])}
                          </td>
                        );
                      }
                      if (cell.accessor == "") {
                        return (
                          <td
                            key={index}
                            className="gap-3 whitespace-nowrap px-6 py-4"
                          ></td>
                        );
                      }
                      if (cell.mapping) {
                        return (
                          <td
                            key={index}
                            className="whitespace-nowrap px-6 py-4"
                          >
                            {cell.mapping[row[cell.accessor] ?? 0]}
                          </td>
                        );
                      }

                      if (cell.idPrefix) {
                        return (
                          <td
                            key={index}
                            className="whitespace-nowrap px-6 py-4 normal-case"
                          >
                            {cell.idPrefix + row[cell.accessor]}
                          </td>
                        );
                      }

                      if (cell.nested) {
                        return (
                          <td
                            key={index}
                            className="whitespace-nowrap px-6 py-4 normal-case"
                          >
                            {row[cell.nested][cell.accessor]}
                          </td>
                        );
                      }

                      return (
                        <td
                          key={index}
                          className="whitespace-nowrap px-6 py-4"
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
      </div>
      <PaginationBar
        currentPage={currentPage}
        pageCount={pageCount}
        pageSize={pageSize}
        totalNumber={dataTotal}
        canPreviousPage={canPreviousPage}
        canNextPage={canNextPage}
        updatePageSize={updatePageSize}
        previousPage={previousPage}
        nextPage={nextPage}
      />
    </>
  );
}
