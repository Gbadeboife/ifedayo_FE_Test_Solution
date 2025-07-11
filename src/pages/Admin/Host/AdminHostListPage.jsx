import React from "react";
import { AuthContext, tokenExpireError } from "@/authContext";
import MkdSDK from "@/utils/MkdSDK";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { GlobalContext, showToast } from "@/globalContext";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { clearSearchParams, parseSearchParams } from "@/utils/utils";
import PaginationBar from "@/components/PaginationBar";
import Button from "@/components/Button";
import AddButton from "@/components/AddButton";
import Table from "@/components/Table";
import PaginationHeader from "@/components/PaginationHeader";
import { DownloadTableExcel } from 'react-export-table-to-excel';
import { useRef } from 'react';
import { ID_PREFIX, IMAGE_STATUS } from "@/utils/constants";
import { adminColumns, applySetting } from "@/utils/adminPortalColumns";
import ProfileImagePreviewModal from "../User/ProfileImagePreviewModal";
import RejectProfileImageModal from "../User/RejectProfileImageModal";

let sdk = new MkdSDK();

const AdminHostListPage = () => {
  const { dispatch: globalDispatch, state } = React.useContext(GlobalContext);
  const { dispatch } = React.useContext(AuthContext);
  const [tableColumns, setTableColumns] = React.useState([]);
  const [data, setCurrentTableData] = React.useState([]);
  const [pageSize, setPageSize] = React.useState(10);
  const [pageCount, setPageCount] = React.useState(0);
  const [dataTotal, setDataTotal] = React.useState(0);
  const [currentPage, setPage] = React.useState(0);
  const [canPreviousPage, setCanPreviousPage] = React.useState(false);
  const [canNextPage, setCanNextPage] = React.useState(false);
  const [searchParams, setSearchParams] = useSearchParams(localStorage.getItem("admin_host_filter") ?? "");
  const navigate = useNavigate();

  const [activePicture, setActivePicture] = React.useState("");
  const [pictureModal, setPictureModal] = React.useState(false);
  const [activeRow, setActiveRow] = React.useState({});

  const schema = yup.object({
    id: yup.string(),
    email: yup.string(),
  });

  const {
    reset,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: parseSearchParams(searchParams),
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

  function nextPage() {
    (async function () {
      await getData(currentPage + 1 <= pageCount ? currentPage + 1 : 0, pageSize);
    })();
  }

  async function getData(pageNum, limitNum) {
    const data = parseSearchParams(searchParams);
    data.id = data.id?.replace(ID_PREFIX.HOST, "");

    try {
      const result = await sdk.callRawAPI(
        "/v2/api/custom/ergo/user/PAGINATEHOST",
        {
          where: [data ? `${data.id ? `ergo_user.id = '${data.id}'` : "1"} AND ${data.email ? `ergo_user.email LIKE '%${data.email}%'` : "1"}` : "role = 'host'", "ergo_user.deleted_at IS NULL"],
          page: pageNum,
          sortId: "create_at",
          direction: "DESC",
          limit: limitNum,
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
    searchParams.set("email", data.email);
    searchParams.set("id", data.id);
    setSearchParams(searchParams);
    localStorage.setItem("admin_host_filter", searchParams.toString());
    getData(0, pageSize);
  };

  React.useEffect(() => {
    globalDispatch({
      type: "SETPATH",
      payload: {
        path: "host",
      },
    });

    (async function () {
      await fetchColumnOrder();
      await getData(0, pageSize);
    })();
  }, []);

  React.useEffect(() => {
    if (state.deleted) {
      globalDispatch({
        type: "DELETED",
        payload: {
          deleted: false,
        },
      });
      getData(currentPage, pageSize);
    }
  }, [state.deleted]);

  async function fetchColumnOrder() {
    sdk.setTable("settings");
    const payload = { key_name: "admin_host_column_order" };
    try {
      const result = await sdk.callRestAPI({ limit: 1, page: 1, payload }, "PAGINATE");
      if (Array.isArray(result.list) && result.list.length > 0) {
        setTableColumns(applySetting(result.list[0].optional_data ?? [], adminColumns.admin_host));
      }
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      showToast(globalDispatch, err.message, 4000, "ERROR");
    }
  }

  async function approveImage(id) {
    sdk.setTable("user");
    try {
      await sdk.callRestAPI({ id, is_photo_approved: IMAGE_STATUS.APPROVED }, "PUT");
      await getData(1, pageSize);
      showToast(globalDispatch, "Successful");
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
        <div className="flex justify-between">
          <h4 className="text-2xl font-medium">Hosts</h4>
          <AddButton
            link={"/admin/add-host"}
            text="Add New host"
          />
        </div>
        <div className="filter-form-holder mt-2 flex flex-wrap">
          <div className="mb-4 w-full pr-2 md:w-1/3">
            <label className="mb-2 block text-sm font-bold text-gray-700">ID</label>
            <input
              type="text"
              {...register("id")}
              className="  focus:shadow-outline  mb-3 w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none"
            />
            <p className="text-xs italic text-red-500">{errors.id?.message}</p>
          </div>
          <div className="mb-4 w-full pr-2 md:w-1/3">
            <label className="mb-2 block text-sm font-bold text-gray-700">Email</label>
            <input
              type="email"
              {...register("email")}
              className="  focus:shadow-outline  mb-3 w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none"
            />
            <p className="text-xs italic text-red-500">{errors.email?.message}</p>
          </div>
        </div>
        <Button text="Search" />
        <button
          className="font-inter ml-2 cursor-pointer rounded-md border border-[#33D4B7] bg-gradient-to-r from-[#33D4B7] to-[#0D9895] bg-clip-text px-[66px] py-[10px] text-transparent"
          type="reset"
          onClick={() => {
            reset({ id: "", email: "" });
            clearSearchParams(searchParams, setSearchParams);
            localStorage.removeItem("admin_host_filter");
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
          to="/admin/column_order/host"
          className="ml-5 mb-1 mr-3 flex items-center  rounded !bg-gradient-to-r from-[#33D4B7] to-[#0D9895] px-6 py-2 text-sm font-semibold text-white outline-none focus:outline-none"
        >
          Change Column Order
        </Link>
        <DownloadTableExcel
          filename="host_list"
          sheet="host_list"
          currentTableRef={tableRef.current}
        >
          <button className="export-btn">Export to xls</button>
        </DownloadTableExcel>
      </div>

      <div className="overflow-x-auto normal-case">
        <div className="overflow-x-auto border-b border-gray-200 shadow ">
          <Table
            ref={tableRef}
            className="min-w-full divide-y divide-gray-200 border border-t-0 bg-white"
            id="table-to-xls"
          >
            <thead className="cursor-pointer bg-gray-50">
              <tr className="cursor-pointer">
                {tableColumns.map((column, index) => (
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
                    {tableColumns.map((cell, index) => {
                      if (cell.accessor.split(",").length > 1) {
                        return (
                          <td
                            key={index}
                            className="whitespace-nowrap px-6 py-4"
                          >
                            {cell.accessor.split(",").map((accessor, i) => (
                              <span
                                key={i}
                                className={`mr-2 ${cell?.multiline ? "mb-1 block" : ""}`}
                              >
                                {row[accessor.trim()]}
                              </span>
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
                            {row.photo ? (
                              <button
                                className="ml-2 border-r border-gray-200 px-1 pr-4 text-[#667085]"
                                onClick={() => {
                                  setActivePicture(row.photo);
                                  setPictureModal(true);
                                }}
                              >
                                View Picture
                              </button>
                            ) : (
                              <span className="ml-2 border-r border-gray-200 px-1 pr-4 text-[#667085]">No Photo</span>
                            )}

                            <button
                              className="ml-2 border-gray-200 px-1 pr-4 text-[#667085]"
                              onClick={() => {
                                navigate(`/admin/view-host/${row.id}`, {
                                  state: row,
                                });
                              }}
                            >
                              View Profile
                            </button>
                          </td>
                        );
                      }
                      if (cell.statusMapping) {
                        return (
                          <td
                            key={index}
                            className="whitespace-nowrap px-6 py-4"
                          >
                            <span className={`${row[cell.accessor] === 1 ? "text-black" : "text-[#98A2B3]"} rounded-full border border-[#EAECF0] bg-[#F9FAFB] py-[2px] px-[10px]`}>
                              {" "}
                              {cell.statusMapping[row[cell.accessor]]}
                            </span>
                          </td>
                        );
                      }

                      if (cell.accessor == "num_properties") {
                        return (
                          <td
                            key={index}
                            className="whitespace-nowrap px-6 py-4 normal-case "
                          >
                            <button
                              className="border-r border-gray-200 bg-gradient-to-r from-[#33D4B7] to-[#0D9895] bg-clip-text pr-2 font-bold text-transparent"
                              onClick={() => {
                                navigate(`/admin/property_spaces?host_id=${row.id}`);
                              }}
                            >
                              View
                            </button>
                          </td>
                        );
                      }
                      if (cell.accessor.includes("payout") || cell.amountField) {
                        return (
                          <td
                            key={index}
                            className="whitespace-nowrap px-6 py-4 normal-case "
                          >
                            <span className="ml-2">&#36;{(row[cell.accessor] ? row[cell.accessor] : 0).toFixed(2)}</span>
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
          </Table>
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
      <ProfileImagePreviewModal
        modalOpen={pictureModal}
        modalImage={activePicture}
        closeModal={() => setPictureModal(false)}
      />
      <RejectProfileImageModal
        modalOpen={activeRow.id != undefined}
        closeModal={() => setActiveRow({})}
        data={activeRow}
        onSuccess={() => getData(currentPage, pageSize)}
      />
    </>
  );
};

export default AdminHostListPage;
