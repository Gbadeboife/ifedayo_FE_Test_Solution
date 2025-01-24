import React from "react";
import { AuthContext, tokenExpireError } from "@/authContext";
import MkdSDK from "@/utils/MkdSDK";
import { useForm } from "react-hook-form";
import { useSearchParams, Link } from "react-router-dom";
import { GlobalContext, showToast } from "@/globalContext";
import { clearSearchParams, notificationTime, parseSearchParams } from "@/utils/utils";
import PaginationBar from "@/components/PaginationBar";
import Button from "@/components/Button";
import PaginationHeader from "@/components/PaginationHeader";
import { ID_PREFIX, NOTIFICATION_STATUS, NOTIFICATION_TYPE } from "@/utils/constants";
import SwitchBulkMode from "@/components/SwitchBulkMode";
import moment from "moment";
import TreeSDK from "@/utils/TreeSDK";
import { LoadingButton } from "@/components/frontend";

let sdk = new MkdSDK();
let treeSdk = new TreeSDK();

const statusMapping = ["Not Viewed", "Viewed"];
const typeMapping = ["New Space Added", "New Property Space Images Added", "Profile Picture Changed", "Property Space Edited", "New Review Added", "New Payout", "New Id Verification Submitted"];

const columns = [
  {
    header: "ID",
    accessor: "id",
    isSorted: true,
    isSortedDesc: true,
    idPrefix: ID_PREFIX.NOTIFICATION,
  },
  {
    header: "User ID",
    accessor: "user_id",
    isSorted: true,
    isSortedDesc: true,
    idPrefix: ID_PREFIX.USER,
  },
  {
    header: "Type",
    accessor: "type",
    isSorted: true,
    isSortedDesc: true,
    mapping: typeMapping,
  },
  {
    header: "Message",
    accessor: "message",
    isSorted: true,
    isSortedDesc: true,
  },
  {
    header: "Notification Time",
    accessor: "notification_time",
    isSorted: true,
    isSortedDesc: true,
  },
  {
    header: "Email",
    nested: "user",
    accessor: "email",
    isSorted: true,
    isSortedDesc: true,
  },
  {
    header: "Status",
    accessor: "status",
    isSorted: true,
    isSortedDesc: true,
    mapping: statusMapping,
  },
  {
    header: "Actions",
    accessor: "",
  },
];

export default function AdminNotificationPage() {
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
  const [searchParams, setSearchParams] = useSearchParams(localStorage.getItem("admin_notification_filter") ?? "");
  const [bulkLoading, setBulkLoading] = React.useState(false);

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
    data.id = data.id?.replace(ID_PREFIX.NOTIFICATION, "");

    sdk.setTable("notification");

    try {
      let filter = [];
      if (data.id) {
        filter.push(`ergo_notification.id,eq,${data.id}`);
      }
      if (data.status) {
        filter.push(`ergo_notification.status,eq,${data.status}`);
      }
      if (data.create_at) {
        filter.push(`ergo_notification.create_at,eq,'${data.create_at}'`);
      }
      if (data.type) {
        filter.push(`ergo_notification.type,eq,${data.type}`);
      }
      if (data.email) {
        filter.push(`ergo_user.email,cs,${data.email}`);
      }
console.log("filter",filter)
      let result = await treeSdk.getPaginate("notification", {
        filter,
        join: ["user"],
        page: pageNum || 1,
        size: limitNum,
        order: "update_at",
      });

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
    searchParams.set("status", data.status);
    searchParams.set("create_at", data.create_at);
    searchParams.set("type", data.type);
    searchParams.set("email", data.email);
    setSearchParams(searchParams);
    localStorage.setItem("admin_notification_filter", searchParams.toString());

    getData(1, pageSize);
  };

  React.useEffect(() => {
    globalDispatch({
      type: "SETPATH",
      payload: {
        path: "notification",
      },
    });
    getData(1, pageSize);
  }, []);

  async function bulkChangeStatus() {
    if (bulkStatus == "") return;
    setBulkLoading(true)
    sdk.setTable("notification");
    try {
      await Promise.all(bulkSelected.map((id) => sdk.callRestAPI({ id: Number(id), status: bulkStatus }, "PUT")));

      const actualChangeCount = data.reduce((acc, curr) => (curr.status != Number(bulkStatus) && bulkSelected.includes(curr.id) ? acc + 1 : acc), 0);
      if (Number(bulkStatus) == NOTIFICATION_STATUS.NOT_ADDRESSED) {
        globalDispatch({ type: "SET_NOTIFICATION_COUNT", payload: globalState.adminNotificationCount + actualChangeCount });
      } else {
        globalDispatch({ type: "SET_NOTIFICATION_COUNT", payload: globalState.adminNotificationCount - actualChangeCount });
      }
      showToast(globalDispatch, "Successful");
      setBulkStatus("");
      setBulkSelected([]);
      document.querySelector(".none").value = "";
      getData(1, pageSize);
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      showToast(globalDispatch, err.message, 4000, "ERROR");
    }
    setBulkLoading(false)
  }

  async function markAsAddressed(id) {
    sdk.setTable("notification");
    try {
      await sdk.callRestAPI({ id, status: NOTIFICATION_STATUS.ADDRESSED }, "PUT");
      globalDispatch({ type: "SET_NOTIFICATION_COUNT", payload: globalState.adminNotificationCount > 0 ? globalState.adminNotificationCount - 1 : 0 });
      showToast(globalDispatch, "Successful");
      getData(1, pageSize);
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      showToast(globalDispatch, err.message, 4000, "ERROR");
    }
  }

  async function markAsUnAddressed(id) {
    sdk.setTable("notification");
    try {
      await sdk.callRestAPI({ id, status: NOTIFICATION_STATUS.NOT_ADDRESSED }, "PUT");
      globalDispatch({ type: "SET_NOTIFICATION_COUNT", payload: globalState.adminNotificationCount + 1 });
      showToast(globalDispatch, "Successful");
      getData(1, pageSize);
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      showToast(globalDispatch, err.message, 4000, "ERROR");
    }
  }

  function getActionRoute(type, actor_id, user_id) {
    switch (type) {
      case NOTIFICATION_TYPE.EDIT_PROPERTY_SPACE:
      case NOTIFICATION_TYPE.CREATE_SPACE:
        return `/admin/property_spaces?id=${actor_id}`;
      case NOTIFICATION_TYPE.CREATE_PROPERTY_SPACE_IMAGE:
        return `/admin/property_spaces_images?id=${actor_id}`;
      case NOTIFICATION_TYPE.EDIT_USER_PICTURE:
        return `/admin/user?id=${actor_id}`;
      case NOTIFICATION_TYPE.ADD_PAYOUT:
        return `/admin/payout?id=${actor_id}`;
      case NOTIFICATION_TYPE.ADD_REVIEW:
        return `/admin/review?id=${actor_id}`;
      case NOTIFICATION_TYPE.NEW_ID_VERIFICATION:
        return `/admin/id_verification?id=${actor_id}`;
      default:
        return "";
    }
  }

  return (
    <>
      <form
        className="rounded rounded-b-none border border-b-0 bg-white p-5"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="max-w-5xl">
          <div className="flex justify-between">
            <h4 className="text-2xl font-medium">Notification</h4>
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
                htmlFor="email"
              >
                Email
              </label>
              <input
                {...register("email")}
                className={`focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.email?.message ? "border-red-500" : ""}`}
              />
              <p className="text-xs italic text-red-500">{errors.email?.message}</p>
            </div>

            <div className="mb-4 w-full pr-2 pl-2 md:w-1/3">
              <label
                className="mb-2 block text-sm font-bold text-gray-700"
                htmlFor="status"
              >
                Status
              </label>
              <select
                className="none mb-3 w-full rounded border bg-white py-2 px-3 leading-tight text-gray-700 focus:outline-none"
                {...register("status")}
              >
                <option value="">ALL</option>
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
              <p className="text-xs italic text-red-500">{errors.status?.message}</p>
            </div>
            <div className="mb-4 w-full pr-2 pl-2 md:w-1/3">
              <label
                className="mb-2 block text-sm font-bold text-gray-700"
                htmlFor="type"
              >
                Type
              </label>
              <select
                className="none mb-3 w-full rounded border bg-white py-2 px-3 leading-tight text-gray-700 focus:outline-none"
                {...register("type")}
              >
                <option value="">ALL</option>
                {typeMapping.map((option, idx) => (
                  <option
                    name="type"
                    value={idx}
                    key={idx}
                  >
                    {option}
                  </option>
                ))}
              </select>
              <p className="text-xs italic text-red-500">{errors.type?.message}</p>
            </div>
            <div className="mb-4 w-full pr-2 pl-2 md:w-1/3">
              <label
                className="mb-2 block text-sm font-bold text-gray-700"
                htmlFor="create_at"
              >
                Date Added
              </label>
              <input
                type={"date"}
                {...register("create_at")}
                className="none mb-3 w-full rounded border bg-white py-2 px-3 leading-tight text-gray-700 focus:outline-none"
              />
              <p className="text-xs italic text-red-500">{errors.create_at?.message}</p>
            </div>
          </div>
          <Button text="Search" />
          <button
            className="font-inter ml-2 cursor-pointer rounded-md border border-[#33D4B7] bg-gradient-to-r from-[#33D4B7] to-[#0D9895] bg-clip-text px-[66px] py-[10px] text-transparent"
            type="reset"
            onClick={() => {
              reset({ id: "", status: "", type: "", create_at: "" });
              localStorage.removeItem("admin_notification_filter");
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

      <div className="flex justify-end bg-white px-6 pt-4">
        <SwitchBulkMode
          enabled={bulkMode}
          setEnabled={setBulkMode}
        />
      </div>

      {bulkMode && (
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
              onChange={() => { }}
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
              <LoadingButton
                type="button"
                loading={bulkLoading}
                className="rounded-md !bg-gradient-to-r from-[#33D4B7] to-[#0D9895] px-6 py-2 text-sm font-semibold text-white"
                onClick={() => bulkChangeStatus()}
              >
                Bulk Save
              </LoadingButton>
            </div>
          ) : null}
        </div>
      )}

      <div className="overflow-x-auto">
        <div className="overflow-x-auto border-b border-gray-200 shadow ">
          <table className="min-w-full divide-y divide-gray-200 border border-t-0 bg-white">
            <thead className="cursor-pointer bg-gray-50">
              <tr className="cursor-pointer">
                {bulkMode && (
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
                    {bulkMode && (
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
                              setBulkStatus()
                            } else {
                              setBulkSelected((prev) => [...prev, row.id]);
                            }
                          }}
                          checked={bulkSelected.includes(row.id)}
                          onChange={() => { }}
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
                          >
                            {row.status == NOTIFICATION_STATUS.NOT_ADDRESSED ? (
                              <button
                                className="ml-2 w-fit border-r border-gray-200 px-1 pr-4 text-[#667085]"
                                onClick={() => markAsAddressed(row.id)}
                              >
                                Mark as Viewed
                              </button>
                            ) : (
                              <button
                                className="ml-2 w-fit border-r border-gray-200 px-1 pr-4 text-[#667085]"
                                onClick={() => markAsUnAddressed(row.id)}
                              >
                                Mark as not Viewed
                              </button>
                            )}

                            <button
                              className="ml-2 px-1 text-[#667085]"
                              onClick={async () => {
                                await markAsAddressed(row.id);
                                window.open(location.origin + getActionRoute(row.type, row.action_id, row.user_id), "_blank");
                              }}
                              target={"_blank"}
                            >
                              View
                            </button>
                          </td>
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
                      if (cell.accessor == "notification_time") {
                        return (
                          <td
                            key={index}
                            className="whitespace-nowrap px-6 py-4"
                          >
                            {notificationTime(row["notification_time"])}
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
