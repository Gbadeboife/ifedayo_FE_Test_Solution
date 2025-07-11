import React from "react";
import { AuthContext, tokenExpireError } from "@/authContext";
import MkdSDK from "@/utils/MkdSDK";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { GlobalContext, showToast } from "@/globalContext";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { clearSearchParams, parseSearchParams } from "@/utils/utils";
import PaginationBar from "@/components/PaginationBar";
import AddButton from "@/components/AddButton";
import Button from "@/components/Button";
import PaginationHeader from "@/components/PaginationHeader";
import Icon from "@/components/Icons";
import { DownloadTableExcel } from 'react-export-table-to-excel';
import { useRef } from 'react';
import { ID_PREFIX } from "@/utils/constants";
import { adminColumns, applySetting } from "@/utils/adminPortalColumns";

let sdk = new MkdSDK();

const AdminReviewListPage = () => {
  const { dispatch } = React.useContext(AuthContext);
  const { state: globalState, dispatch: globalDispatch } = React.useContext(GlobalContext);
  const [tableColumns, setTableColumns] = React.useState([]);
  const [data, setCurrentTableData] = React.useState([]);
  const [pageSize, setPageSize] = React.useState(10);
  const [pageCount, setPageCount] = React.useState(0);
  const [dataTotal, setDataTotal] = React.useState(0);
  const [currentPage, setPage] = React.useState(0);
  const [canPreviousPage, setCanPreviousPage] = React.useState(false);
  const [canNextPage, setCanNextPage] = React.useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  // TODO: find a better way to do this
  const [searchParams2] = useSearchParams(localStorage.getItem("admin_customer_review_filter") ?? "");

  const schema = yup.object({
    id: yup.string(),
    customer_first_name: yup.string(),
    customer_last_name: yup.string(),
    rating: yup.string(),
    type: yup.string(),
  });
  const {
    reset,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: (() => {
      let fromSearch = parseSearchParams(searchParams);
      if (Object.keys(fromSearch).length > 0) {
        return fromSearch;
      }
      return parseSearchParams(searchParams2);
    })(),
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

  const rating = [
    { key: "", value: "All" },
    { key: "1", value: "1" },
    { key: "2", value: "2" },
    { key: "3", value: "3" },
    { key: "4", value: "4" },
    { key: "5", value: "5" },
  ];

  const type = [
    { key: "", value: "All" },
    { key: "0", value: "Given" },
    { key: "1", value: "Received" },
  ];

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
    let data = parseSearchParams(searchParams);
    data = Object.keys(data).length < 1 ? parseSearchParams(searchParams2) : data;
    data.id = data.id?.replace(ID_PREFIX.REVIEWS, "");

    if (data && (data.type != undefined || data.type != null)) {
      data.type = data.type == 0 ? "customer" : "host";
    }
    try {
      sdk.setTable("review");
      const result = await sdk.callRawAPI(
        "/v2/api/custom/ergo/review/PAGINATE",
        {
          where: [
            data
              ? `${data.id ? `ergo_review.id = '${data.id}'` : "1"} AND ${data.customer_first_name ? `customer.first_name LIKE '%${data.customer_first_name}%'` : "1"} AND ${
                  data.customer_last_name ? `customer.last_name LIKE '%${data.customer_last_name}%'` : "1"
                } AND ${data.rating ? `customer_rating = ${data.rating}` : "1"} AND ${data.type ? `given_by = '${data.type}'` : "1"} AND ${
                  data.status ? `ergo_review.status = ${data.status}` : "1"
                } AND ${data.property_spaces_id ? `ergo_review.property_spaces_id = ${data.property_spaces_id}` : "1"}`
              : 1,
          ],
          page: pageNum,
          limit: limitNum,
          sortId: "update_at",
          direction: "DESC",
          user: "customer",
        },
        "POST",
      );

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
    searchParams.set("customer_first_name", data.customer_first_name);
    searchParams.set("customer_last_name", data.customer_last_name);
    searchParams.set("rating", data.rating);
    searchParams.set("type", data.type);
    searchParams.set("status", data.status);

    setSearchParams(searchParams);
    localStorage.setItem("admin_customer_review_filter", searchParams.toString());

    getData(1, pageSize);
  };

  React.useEffect(() => {
    globalDispatch({
      type: "SETPATH",
      payload: {
        path: "review",
      },
    });

    (async function () {
      await fetchColumnOrder();
      getData(1, pageSize);
    })();
  }, []);

  React.useEffect(() => {
    if (!globalState.showReview) {
      getData(1, 10);
    }
  }, [globalState.showReview]);

  async function fetchColumnOrder() {
    sdk.setTable("settings");
    const payload = { key_name: "admin_customer_review_column_order" };
    try {
      const result = await sdk.callRestAPI({ limit: 1, page: 1, payload }, "PAGINATE");
      if (Array.isArray(result.list) && result.list.length > 0) {
        setTableColumns(applySetting(result.list[0].optional_data ?? [], adminColumns.admin_customer_reviews));
      }
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      showToast(globalDispatch, err.message, 4000, "ERROR");
    }
  }

  const tableRef = useRef(null);

  return (
    <>
      <form
        className="rounded rounded-b-none border border-b-0 bg-white p-5"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="flex justify-between  ">
          <h4 className="text-2xl font-medium">Review</h4>
          <AddButton
            link={"/admin/add-review"}
            text="Add new Review"
          />
        </div>
        <div className="border-b border-gray-200 text-center text-sm font-medium text-gray-500">
          <ul className="-mb-px flex flex-wrap">
            <li className="mr-2">
              <button
                onClick={() => navigate("/admin/review")}
                className="inline-block rounded-t-lg border-b-2 border-transparent p-4 hover:border-gray-300 hover:text-gray-600"
              >
                Hosts
              </button>
            </li>
            <li className="mr-2">
              <button
                onClick={() => navigate("/admin/review/customer")}
                className="inline-block rounded-t-lg border-b-2 border-[#111827] p-4 font-bold text-[#111827]"
              >
                Guests
              </button>
            </li>
          </ul>
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
              placeholder="ID"
              {...register("id")}
              className={`"shadow   focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.id?.message ? "border-red-500" : ""}`}
            />
            <p className="text-xs italic text-red-500">{errors.id?.message}</p>
          </div>

          <div className="mb-4 w-full pr-2 pl-2 md:w-1/3">
            <label
              className="mb-2 block text-sm font-bold text-gray-700"
              htmlFor="customer_last_name"
            >
              Last name
            </label>
            <input
              placeholder="Last name"
              {...register("customer_last_name")}
              className={`"shadow   focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.customer_last_name?.message ? "border-red-500" : ""}`}
            />
            <p className="text-xs italic text-red-500">{errors.customer_last_name?.message}</p>
          </div>
          <div className="mb-4 w-full pr-2 pl-2 md:w-1/3">
            <label
              className="mb-2 block text-sm font-bold text-gray-700"
              htmlFor="customer_first_name"
            >
              First name
            </label>
            <input
              placeholder="First name"
              {...register("customer_first_name")}
              className={`"shadow   focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.customer_first_name?.message ? "border-red-500" : ""}`}
            />
            <p className="text-xs italic text-red-500">{errors.customer_first_name?.message}</p>
          </div>

          <div className="mb-4 w-full pr-2 pl-2 md:w-1/3">
            <label
              className="mb-2 block text-sm font-bold text-gray-700"
              htmlFor="space_rating"
            >
              Rating
            </label>
            <select
              className="mb-3 w-full cursor-pointer rounded border bg-white py-2 px-3 leading-tight text-gray-700 focus:outline-none"
              {...register("rating")}
            >
              {rating.map((option) => (
                <option
                  name="status"
                  value={option.key}
                  key={option.key}
                >
                  {option.value}
                </option>
              ))}
            </select>
            <p className="text-xs italic text-red-500">{errors.rating?.message}</p>
          </div>

          <div className="mb-4 w-full pr-2 pl-2 md:w-1/3">
            <label
              className="mb-2 block text-sm font-bold text-gray-700"
              htmlFor="space_rating"
            >
              Type
            </label>
            <select
              className="mb-3 w-full rounded border bg-white py-2 px-3 leading-tight text-gray-700 focus:outline-none"
              {...register("type")}
            >
              {type.map((option) => (
                <option
                  name="status"
                  value={option.key}
                  key={option.key}
                >
                  {option.value}
                </option>
              ))}
            </select>
            <p className="text-xs italic text-red-500">{errors.type?.message}</p>
          </div>

          <div className="mb-4 w-full pr-2 pl-2 md:w-1/3">
            <label
              className="mb-2 block text-sm font-bold text-gray-700"
              htmlFor="status"
            >
              Status
            </label>
            <select
              className="mb-3 w-full cursor-pointer rounded border bg-white py-2 px-3 leading-tight text-gray-700 focus:outline-none"
              {...register("status")}
            >
              <option value="">ALL</option>
              {["Under Review", "Posted", "Declined"].map((option, idx) => (
                <option
                  name="status"
                  value={idx}
                  key={option}
                >
                  {option}
                </option>
              ))}
            </select>
            <p className="text-xs italic text-red-500">{errors.status?.message}</p>
          </div>
        </div>
        <Button text="Search" />
        <button
          className="font-inter ml-2 cursor-pointer rounded-md border border-[#33D4B7] bg-gradient-to-r from-[#33D4B7] to-[#0D9895] bg-clip-text px-[66px] py-[10px] text-transparent"
          type="reset"
          onClick={() => {
            reset({ id: "", customer_first_name: "", customer_last_name: "", status: "", type: "", rating: "", property_spaces_id: "" });
            localStorage.removeItem("admin_customer_review_filter");
            clearSearchParams(searchParams, setSearchParams);
            clearSearchParams(searchParams2, setSearchParams);
            getData(currentPage, pageSize);
          }}
        >
          Reset
        </button>
      </form>
      <PaginationHeader
        currentPage={currentPage}
        pageSize={pageSize}
        totalNumber={dataTotal}
        updatePageSize={updatePageSize}
      />
      <div className="flex justify-end bg-white py-3 pt-5">
        <Link
          to="/admin/column_order/customer_review"
          className="ml-5 mb-1 mr-3 flex items-center  rounded !bg-gradient-to-r from-[#33D4B7] to-[#0D9895] px-6 py-2 text-sm font-semibold text-white outline-none focus:outline-none"
        >
          Change Column Order
        </Link>{" "}
        <DownloadTableExcel
          filename="customer_review_list"
          sheet="customer_review_list"
          currentTableRef={tableRef.current}
        >
          <button className="ml-5 mb-1 mr-3 flex items-center  rounded !bg-gradient-to-r from-[#33D4B7] to-[#0D9895] px-6 py-2 text-sm font-semibold text-white outline-none focus:outline-none">
            Export to xls
          </button>
        </DownloadTableExcel>
      </div>

      <div className="overflow-x-auto">
        <div className="overflow-x-auto border-b border-gray-200 ">
          <table
            className="min-w-full divide-y divide-gray-200 border border-t-0 bg-white"
            id="table-to-xls"
            ref={tableRef}
          >
            <thead className="cursor-pointer bg-gray-50">
              <tr className="cursor-pointer">
                {tableColumns.map((column, index) => (
                  <th
                    key={index}
                    scope="col"
                    className="cursor-pointer px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    onClick={() => onSort(column.accessor)}
                  >
                    {column.header}
                    <span>{column.isSorted ? (column.isSortedDesc ? " ▼" : " ▲") : ""}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((row, i) => {
                return (
                  <tr
                    className="py-2"
                    key={i}
                  >
                    {tableColumns.map((cell, index) => {
                      if (cell.accessor.split(",").length > 1) {
                        return (
                          <td
                            key={index}
                            className="whitespace-nowrap px-6 py-4"
                          >
                            {cell.accessor.split(",").map((accessor) => (
                              <span className={`mr-2 ${cell?.multiline ? "mb-1 block" : ""}`}>{row[accessor.trim()]}</span>
                            ))}
                          </td>
                        );
                      }
                      if (cell.accessor === "") {
                        return (
                          <td
                            key={index}
                            className="gap-3 whitespace-nowrap px-6 py-4"
                          >
                            <button
                              className="bg-gradient-to-r from-[#33D4B7] to-[#0D9895] bg-clip-text pr-4 font-bold text-transparent"
                              onClick={() =>
                                globalDispatch({
                                  type: "SHOW_REVIEW",
                                  payload: {
                                    showReview: true,
                                    review: row,
                                  },
                                })
                              }
                            >
                              View
                            </button>
                          </td>
                        );
                      }
                      if (cell.accessor === "rating") {
                        return (
                          <td
                            key={index}
                            className="whitespace-nowrap px-6 py-4"
                          >
                            <span className="flex items-center">
                              <Icon
                                type="star"
                                className="mr-2 fill-[#0D9895]"
                              />
                              {row[cell.accessor]}
                            </span>
                          </td>
                        );
                      }
                      if (cell.mapping) {
                        return (
                          <td
                            key={index}
                            className="whitespace-nowrap px-6 py-4"
                          >
                            {cell.mapping[row[cell.accessor]]}
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
};

export default AdminReviewListPage;
