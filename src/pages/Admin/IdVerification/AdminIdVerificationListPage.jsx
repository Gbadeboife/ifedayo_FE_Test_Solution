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
import Button from "@/components/Button";
import PaginationHeader from "@/components/PaginationHeader";
import AddButton from "@/components/AddButton";
import CsvDownloadButton from "react-json-to-csv";
import { ID_PREFIX } from "@/utils/constants";
import { adminColumns, applySetting } from "@/utils/adminPortalColumns";
import { callCustomAPI } from "@/utils/callCustomAPI";
import DeclineVerificationModal from "./DeclineVerificationModal";

let sdk = new MkdSDK();

const AdminIdVerificationListPage = () => {
  const { dispatch } = React.useContext(AuthContext);
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const [tableColumns, setTableColumns] = React.useState([]);
  const [data, setCurrentTableData] = React.useState([]);
  const [pageSize, setPageSize] = React.useState(10);
  const [pageCount, setPageCount] = React.useState(0);
  const [dataTotal, setDataTotal] = React.useState(0);
  const [currentPage, setPage] = React.useState(0);
  const [canPreviousPage, setCanPreviousPage] = React.useState(false);
  const [canNextPage, setCanNextPage] = React.useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  // TODO: find a better way to do this
  const [searchParams2] = useSearchParams(localStorage.getItem("admin_idv_filter") ?? "");

  const navigate = useNavigate();
  const [activeRow, setActiveRow] = React.useState({});

  const schema = yup.object({
    status: yup.string(),
    email: yup.string(),
  });
  const {
    reset,
    register,
    handleSubmit,
    setError,
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

  const selectStatus = [
    { key: "", value: "All" },
    { key: "0", value: "Pending" },
    { key: "1", value: "Verified" },
    { key: "2", value: "Declined" },
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

    data.id = data.id?.replace(ID_PREFIX.ID_VERIFICATION, "");
    data.user_id = data.user_id?.replace(ID_PREFIX.USER, "");

    try {
      sdk.setTable("id_verification");

      const result = await callCustomAPI(
        "id-verification",
        "post",
        {
          where: [
            data
              ? `${data.user_id ? `ergo_user.id = ${data.user_id}` : "1"} AND ${data.id ? `ergo_id_verification.id = ${data.id}` : "1"} AND ${
                  data.email ? `ergo_user.email LIKE '%${data.email}%'` : "1"
                } AND ${![null, undefined].includes(data.status) ? `ergo_id_verification.status = ${data.status}` : "1"} AND ${
                  data.type ? `ergo_id_verification.type LIKE '%${data.type}%'` : "1"
                } AND ${data.dob ? `dob = ${data.dob}` : "1"} AND ${data.first_name ? `first_name LIKE '%${data.first_name}%'` : "1"} AND ${
                  data.last_name ? `last_name LIKE '%${data.last_name}%'` : "1"
                } AND ${data.role ? `role = ${data.role}` : "1"}`
              : 1,
          ],
          page: pageNum,
          limit: limitNum,
          sortId: "update_at",
          direction: "DESC",
        },
        "PAGINATE",
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

  const changeVerificationStatus = async (data, status) => {
    try {
      sdk.setTable("id_verification");
      const result = await sdk.callRestAPI(
        {
          id: data.id,
          status: status,
        },
        "PUT",
      );

      if (!result.error) {
        showToast(globalDispatch, "Successful");
        await getData(currentPage, pageSize);
      } else {
        if (result.validation) {
          const keys = Object.keys(result.validation);
          for (let i = 0; i < keys.length; i++) {
            const field = keys[i];
            showToast(globalDispatch, result.validation[field], 4000, "ERROR");
          }
        }
      }
    } catch (error) {
      tokenExpireError(dispatch, error.message);
      showToast(globalDispatch, error.message, 4000, "ERROR");
    }
  };

  const onSubmit = (data) => {
    console.log("submitting", data);
    searchParams.set("email", data.email);
    searchParams.set("status", data.status);
    searchParams.set("user_id", data.user_id);
    searchParams.set("id", data.id);
    setSearchParams(searchParams);
    localStorage.setItem("admin_idv_filter", searchParams.toString());
    getData(1, pageSize);
  };

  React.useEffect(() => {
    globalDispatch({
      type: "SETPATH",
      payload: {
        path: "id_verification",
      },
    });

    (async function () {
      await fetchColumnOrder();
      await getData(1, pageSize);
    })();
  }, []);

  async function fetchColumnOrder() {
    sdk.setTable("settings");
    const payload = { key_name: "admin_id_verification_column_order" };
    try {
      const result = await sdk.callRestAPI({ limit: 1, page: 1, payload }, "PAGINATE");
      if (Array.isArray(result.list) && result.list.length > 0) {
        setTableColumns(applySetting(result.list[0].optional_data ?? [], adminColumns.admin_id_verification));
      }
    } catch (err) {
      showToast(globalDispatch, err.message, 4000, "ERROR");
    }
  }

  async function sendApproveEmail(data) {
    try {
      const tmpl = await sdk.getEmailTemplate("id-verification-approved");
      const body = tmpl.html?.replace(new RegExp("{{{type}}}", "g"), data.type).replace(new RegExp("{{{first_name}}}", "g"), data.first_name);

      await sdk.sendEmail(data.email, tmpl.subject, body);
    } catch (err) {
      console.log("err", err);
    }
  }

  return (
    <>
      <form
        className="rounded rounded-b-none border border-b-0 bg-white p-5 "
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="flex justify-between">
          <h4 className="text-2xl font-medium">ID Verification</h4>
          <AddButton
            link={"/admin/add-id_verification"}
            text="Add new ID verification"
          />
        </div>
        <div className="filter-form-holder mt-10 flex max-w-2xl flex-wrap">
          <div className="mb-4 w-full pr-2 pl-2 md:w-1/2">
            <label
              className="mb-2 block text-sm font-bold text-gray-700"
              htmlFor="type"
            >
              ID
            </label>
            <input
              type="text"
              placeholder="ID"
              {...register("id")}
              className={`focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.id?.message ? "border-red-500" : ""}`}
            />
            <p className="text-xs italic text-red-500">{errors.id?.message}</p>
          </div>
          <div className="mb-4 w-full pr-2 pl-2 md:w-1/2">
            <label
              className="mb-2 block text-sm font-bold text-gray-700"
              htmlFor="type"
            >
              User ID
            </label>
            <input
              type="text"
              placeholder="User ID"
              {...register("user_id")}
              className={`"shadow   focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.user_id?.message ? "border-red-500" : ""}`}
            />
            <p className="text-xs italic text-red-500">{errors.user_id?.message}</p>
          </div>
          <div className="mb-4 w-full pr-2 pl-2 md:w-1/2">
            <label
              className="mb-2 block text-sm font-bold text-gray-700"
              htmlFor="type"
            >
              Email
            </label>
            <input
              type="email"
              placeholder="Email"
              {...register("email")}
              className={`"shadow   focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.type?.message ? "border-red-500" : ""}`}
            />
            <p className="text-xs italic text-red-500">{errors.type?.message}</p>
          </div>
          <div className="mb-4 w-1/2 pr-2 pl-2">
            <label className="mb-2 block text-sm font-bold text-gray-700">Status</label>
            <select
              className="mb-3 w-full cursor-pointer rounded border bg-white py-2 px-3 leading-tight text-gray-700 focus:outline-none"
              {...register("status")}
            >
              {selectStatus.map((option) => (
                <option
                  name="status"
                  value={option.key}
                  key={option.key}
                  defaultValue={0}
                >
                  {option.value}
                </option>
              ))}
            </select>
            <p className="text-xs italic text-red-500"></p>
          </div>
        </div>
        <Button text="Search" />
        <button
          className="font-inter ml-2 cursor-pointer rounded-md border border-[#33D4B7] bg-gradient-to-r from-[#33D4B7] to-[#0D9895] bg-clip-text px-[66px] py-[10px] text-transparent"
          type="reset"
          onClick={() => {
            reset({ email: "", status: "", id: "", type: "", user_id: "" });
            clearSearchParams(searchParams, setSearchParams);
            clearSearchParams(searchParams2, setSearchParams);
            localStorage.removeItem("admin_idv_filter");
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
          to="/admin/column_order/id_verification"
          className="ml-5 mb-1 mr-3 flex items-center  rounded !bg-gradient-to-r from-[#33D4B7] to-[#0D9895] px-6 py-2 text-sm font-semibold text-white outline-none focus:outline-none"
        >
          Change Column Order
        </Link>
        <CsvDownloadButton
          id="test-table-xls-button"
          className="ml-5 mb-1 mr-3 flex items-center  rounded !bg-gradient-to-r from-[#33D4B7] to-[#0D9895] px-6 py-2 text-sm font-semibold text-white outline-none focus:outline-none"
          filename="id_verification"
          data={data}
        />
      </div>

      <div className="overflow-x-auto  rounded bg-white p-5 shadow">
        <div className="overflow-x-auto border-b border-gray-200 ">
          <table
            className="min-w-full divide-y divide-gray-200"
            id="table-to-xls"
          >
            <thead className="bg-gray-50">
              <tr>
                {tableColumns.map((column, index) => (
                  <th
                    key={index}
                    scope="col"
                    className="cursor-pointer whitespace-nowrap px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    onClick={() => onSort(column.accessor)}
                  >
                    {column.header}
                    <span>{column.isSorted ? (column.isSortedDesc ? " ▼" : " ▲") : ""}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {data.map((row, i) => {
                return (
                  <tr
                    key={i}
                    className="text-sm"
                  >
                    {tableColumns.map((cell, index) => {
                      if (cell.accessor == "") {
                        return (
                          <td
                            key={index}
                            className="h-[68px] max-h-[68px] whitespace-nowrap px-6 py-4"
                          >
                            <div>
                              {row.status != 1 && (
                                <button
                                  className="bg-gradient-to-r from-[#33D4B7] to-[#0D9895] bg-clip-text pr-2 font-semibold text-transparent "
                                  onClick={() => {
                                    changeVerificationStatus(row, 1);
                                    sendApproveEmail(row);
                                  }}
                                >
                                  Approve
                                </button>
                              )}
                              {row.status != 2 && (
                                <button
                                  className="ml-2 pr-2 font-semibold text-[#667085]"
                                  onClick={() => setActiveRow(row)}
                                >
                                  Decline
                                </button>
                              )}
                            </div>
                          </td>
                        );
                      }
                      if (cell.accessor == "image_front") {
                        return (
                          <td
                            key={index}
                            className="max-h-[68px] whitespace-nowrap px-6"
                          >
                            <div>
                              <img
                                src={row[cell.accessor]}
                                className="h-16"
                                alt="image"
                              />
                            </div>
                          </td>
                        );
                      }
                      if (cell.accessor == "image_back") {
                        return (
                          <td
                            key={index}
                            className="max-h-[68px] whitespace-nowrap px-6"
                          >
                            <div className="block">
                              {row[cell.accessor] != null && (
                                <img
                                  src={row[cell.accessor]}
                                  className="h-16"
                                  alt="image"
                                />
                              )}
                            </div>
                          </td>
                        );
                      }
                      if (cell.mapping) {
                        return (
                          <td
                            key={index}
                            className="max-h-[68px] whitespace-nowrap px-6 py-4"
                          >
                            <span className={`${row[cell.accessor] === 1 ? "text-black" : "text-[#98A2B3]"} rounded-full border border-[#EAECF0] bg-[#F9FAFB] py-[2px] px-[10px]`}>
                              {" "}
                              {cell.mapping[row[cell.accessor]]}
                            </span>
                          </td>
                        );
                      }
                      if (cell.accessor.includes("email")) {
                        return (
                          <td
                            key={index}
                            className="max-h-[68px] whitespace-nowrap px-6 py-4 normal-case"
                          >
                            {row[cell.accessor]}
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
                          className="max-h-[68px] whitespace-nowrap px-6 py-4"
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
      <DeclineVerificationModal
        modalOpen={activeRow.id != undefined}
        closeModal={() => setActiveRow({})}
        data={activeRow}
        onSuccess={() => getData(currentPage, pageSize)}
      />
    </>
  );
};

export default AdminIdVerificationListPage;
