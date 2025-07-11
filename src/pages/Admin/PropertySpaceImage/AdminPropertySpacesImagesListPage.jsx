import React from "react";
import { AuthContext, tokenExpireError } from "@/authContext";
import MkdSDK from "@/utils/MkdSDK";
import { useForm } from "react-hook-form";
import { Link, useSearchParams, createSearchParams } from "react-router-dom";
import { GlobalContext, showToast } from "@/globalContext";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { clearSearchParams, parseSearchParams } from "@/utils/utils";
import PaginationBar from "@/components/PaginationBar";
import AddButton from "@/components/AddButton";
import Button from "@/components/Button";
import PaginationHeader from "@/components/PaginationHeader";
import { DownloadTableExcel } from 'react-export-table-to-excel';
import { useRef } from 'react';
import { ID_PREFIX, IMAGE_STATUS } from "@/utils/constants";
import { adminColumns, applySetting } from "@/utils/adminPortalColumns";
import SwitchBulkMode from "@/components/SwitchBulkMode";
import ImagePreviewPopup from "./ImagePreviewPopup";
import RejectImageModal from "./RejectImageModal";

let sdk = new MkdSDK();

const AdminPropertySpacesImagesListPage = () => {
  const { dispatch } = React.useContext(AuthContext);
  const { dispatch: globalDispatch, state } = React.useContext(GlobalContext);
  const [tableColumns, setTableColumns] = React.useState([]);
  const [data, setCurrentTableData] = React.useState([]);
  const [pageSize, setPageSize] = React.useState(10);
  const [pageCount, setPageCount] = React.useState(0);
  const [dataTotal, setDataTotal] = React.useState(0);
  const [currentPage, setPage] = React.useState(0);
  const [canPreviousPage, setCanPreviousPage] = React.useState(false);
  const [canNextPage, setCanNextPage] = React.useState(false);
  const [bulkMode, setBulkMode] = React.useState(true);
  const [bulkSelected, setBulkSelected] = React.useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  // TODO: find a better way to do this
  const [searchParams2] = useSearchParams(localStorage.getItem("admin_psi_filter") ?? "");
  const [modalImage, setModalImage] = React.useState(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [activeRow, setActiveRow] = React.useState({});

  const schema = yup.object({
    id: yup.string(),
    property_id: yup.string(),
    property_space_name: yup.string(),
    property_name: yup.string(),
    is_approved: yup.string(),
    host_email: yup.string(),
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
    data.id = data.id?.replace(ID_PREFIX.PROPERTY_SPACE_IMAGES, "");

    try {
      sdk.setTable("property_spaces");
      const result = await sdk.callRawAPI(
        "/v2/api/custom/ergo/property-space-images/PAGINATE",
        {
          where: [
            data
              ? `${data.id ? `ergo_property_spaces_images.id = ${data.id}` : "1"} AND ${data.property_space_name ? `ergo_spaces.category LIKE '%${data.property_space_name}%'` : "1"} AND ${data.property_name ? `ergo_property.name LIKE '%${data.property_name}%'` : "1"
              } AND ${data.property_spaces_id ? `property_spaces_id = ${data.property_spaces_id}` : "1"} AND ${data.is_approved != undefined ? `is_approved = ${data.is_approved}` : "1"} AND ${data.host_email ? `ergo_user.email LIKE '%${data.host_email}%'` : "1"
              }`
              : 1,
            "ergo_property_spaces_images.deleted_at IS NULL",
          ],
          page: pageNum,
          limit: limitNum,
          sortId: "update_at",
          direction: "DESC",
        },
        "POST",
      );

      const { list, total, limit, num_pages, page } = result;
      console.log("list", list);
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
    console.log("submitting", data);
    searchParams.set("id", data.id);
    searchParams.set("property_name", data.property_name);
    searchParams.set("property_space_name", data.property_space_name);
    searchParams.set("is_approved", data.is_approved);
    searchParams.set("host_email", data.host_email);
    searchParams.set("property_spaces_id", data.property_spaces_id);
    setSearchParams(searchParams);
    localStorage.setItem("admin_psi_filter", searchParams.toString());

    getData(1, pageSize);
  };

  const setDefaultImage = async (data) => {
    try {
      sdk.setTable("property_spaces");
      const result = await sdk.callRestAPI(
        {
          id: data.id,
          default_image_id: data.image_id,
        },
        "PUT",
      );

      if (result.error) throw new Error(result.message || "Error when setting default image");
      showToast(globalDispatch, "Successful");
      getData(1, 10);
    } catch (error) {
      tokenExpireError(dispatch, error.message);
      showToast(globalDispatch, error.message, 4000, "ERROR");
    }
  };

  React.useEffect(() => {
    globalDispatch({
      type: "SETPATH",
      payload: {
        path: "property_spaces_images",
      },
    });

    (async function () {
      await fetchColumnOrder();
      getData(1, pageSize);
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

  React.useEffect(() => {
    let timeout;
    if (!modalOpen) {
      timeout = setTimeout(() => {
        setModalImage(null);
      }, 200);
    }

    return () => clearTimeout(timeout);
  }, [modalOpen]);

  async function fetchColumnOrder() {
    sdk.setTable("settings");
    const payload = { key_name: "admin_property_spaces_images_column_order" };
    try {
      const result = await sdk.callRestAPI({ limit: 1, page: 1, payload }, "PAGINATE");
      if (Array.isArray(result.list) && result.list.length > 0) {
        setTableColumns(applySetting(result.list[0].optional_data ?? [], adminColumns.admin_property_space_images));
      }
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      showToast(globalDispatch, err.message, 4000, "ERROR");
    }
  }

  async function rejectImage(id) {
    sdk.setTable("property_spaces_images");
    try {
      await sdk.callRestAPI({ id, is_approved: IMAGE_STATUS.NOT_APPROVED }, "PUT");
      showToast(globalDispatch, "Successful");
      await getData(1, pageSize);
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      showToast(globalDispatch, err.message, 4000, "ERROR");
    }
  }

  async function approveImage(id) {
    sdk.setTable("property_spaces_images");
    try {
      await sdk.callRestAPI({ id, is_approved: IMAGE_STATUS.APPROVED }, "PUT");
      showToast(globalDispatch, "Successful");
      await getData(1, pageSize);
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      showToast(globalDispatch, err.message, 4000, "ERROR");
    }
  }

  async function bulkApprove() {
    sdk.setTable("property_spaces_images");
    try {
      await Promise.all(bulkSelected.map((id) => sdk.callRestAPI({ id, is_approved: IMAGE_STATUS.APPROVED }, "PUT")));
      showToast(globalDispatch, "Successful");
      await getData(1, pageSize);
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      showToast(globalDispatch, err.message, 4000, "ERROR");
    }
    setBulkSelected([]);
  }

  async function bulkReject() {
    sdk.setTable("property_spaces_images");
    try {
      await Promise.all(bulkSelected.map((id) => sdk.callRestAPI({ id, is_approved: IMAGE_STATUS.NOT_APPROVED }, "PUT")));
      showToast(globalDispatch, "Successful");
      await getData(1, pageSize);
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      showToast(globalDispatch, err.message, 4000, "ERROR");
    }
    setBulkSelected([]);
  }

  const tableRef = useRef(null);

  return (
    <>
      <form
        className="rounded rounded-b-none border border-b-0 bg-white p-5"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="flex justify-between">
          <h4 className="text-2xl font-medium">Property Spaces Images</h4>
          <AddButton
            link={"/admin/add-property_spaces_images"}
            text="Add New Property Space Image"
          />
        </div>
        <div className="filter-form-holder mt-10 flex max-w-3xl flex-wrap">
          <div className="mb-4 w-full pr-2 pl-2 md:w-1/2">
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
          <div className="mb-4 w-full pr-2 pl-2 md:w-1/2">
            <label
              className="mb-2 block text-sm font-bold text-gray-700"
              htmlFor="property_spaces_id"
            >
              Property Space ID
            </label>
            <input
              placeholder="Property Space ID"
              {...register("property_spaces_id")}
              className={`"shadow   focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.property_spaces_id?.message ? "border-red-500" : ""}`}
            />
            <p className="text-xs italic text-red-500">{errors.property_spaces_id?.message}</p>
          </div>
          <div className="mb-4 w-full pr-2 pl-2 md:w-1/2">
            <label
              className="mb-2 block text-sm font-bold text-gray-700"
              htmlFor="host_email"
            >
              Host Email
            </label>
            <input
              placeholder="Host Email"
              {...register("host_email")}
              className={`"shadow   focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.host_email?.message ? "border-red-500" : ""}`}
            />
            <p className="text-xs italic text-red-500">{errors.host_email?.message}</p>
          </div>

          <div className="mb-4 w-full pr-2 pl-2 md:w-1/2">
            <label
              className="mb-2 block text-sm font-bold text-gray-700"
              htmlFor="property_name"
            >
              Property
            </label>
            <input
              placeholder="Property Name"
              {...register("property_name")}
              className={`"shadow   focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.property_name?.message ? "border-red-500" : ""}`}
            />
            <p className="text-xs italic text-red-500">{errors.property_name?.message}</p>
          </div>

          <div className="mb-4 w-full pr-2 pl-2 md:w-1/2">
            <label
              className="mb-2 block text-sm font-bold text-gray-700"
              htmlFor="property_space_name"
            >
              Space
            </label>
            <input
              placeholder="Space"
              {...register("property_space_name")}
              className={`"shadow   focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.property_space_name?.message ? "border-red-500" : ""}`}
            />
            <p className="text-xs italic text-red-500">{errors.property_space_name?.message}</p>
          </div>
          <div className="mb-4 w-full pr-2 pl-2 md:w-1/2">
            <label
              className="mb-2 block text-sm font-bold text-gray-700"
              htmlFor="is_approved"
            >
              Status
            </label>
            <select
              {...register("is_approved")}
              className={`focus:shadow-outline w-full cursor-pointer rounded border bg-white py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none ${errors.is_approved?.message ? "border-red-500" : ""
                }`}
            >
              <option value="">ALL</option>
              <option value={IMAGE_STATUS.IN_REVIEW}>IN REVIEW</option>
              <option value={IMAGE_STATUS.APPROVED}>APPROVED</option>
              <option value={IMAGE_STATUS.NOT_APPROVED}>REJECTED</option>
            </select>
            <p className="text-xs italic text-red-500">{errors.is_approved?.message}</p>
          </div>
        </div>
        <Button text="Search" />
        <button
          className="font-inter ml-2 cursor-pointer rounded-md border border-[#33D4B7] bg-gradient-to-r from-[#33D4B7] to-[#0D9895] bg-clip-text px-[66px] py-[10px] text-transparent"
          type="reset"
          onClick={() => {
            reset({ is_approved: "", property_space_name: "", id: "", property_spaces_id: "", property_name: "", host_email: "" });
            localStorage.removeItem("admin_psi_filter");
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
          to="/admin/column_order/property_spaces_images"
          className="ml-5 mb-1 mr-3 flex items-center  rounded !bg-gradient-to-r from-[#33D4B7] to-[#0D9895] px-6 py-2 text-sm font-semibold text-white outline-none focus:outline-none"
        >
          Change Column Order
        </Link>{" "}
        <DownloadTableExcel
          filename="property_spaces_images_list"
          sheet="property_spaces_images_list"
          currentTableRef={tableRef.current}
        >
          <button className="ml-5 mb-1 mr-3 flex items-center  rounded !bg-gradient-to-r from-[#33D4B7] to-[#0D9895] px-6 py-2 text-sm font-semibold text-white outline-none focus:outline-none">
            Export to xls
          </button>
        </DownloadTableExcel>
      </div>

      <div className="flex justify-end bg-white px-6">
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
            <div className="flex gap-2">
              <button
                className="rounded-md !bg-gradient-to-r from-[#33D4B7] to-[#0D9895] px-6 py-2 text-sm font-semibold text-white duration-100 hover:bg-[var(--outline-color)]"
                onClick={bulkApprove}
              >
                Approve Selected
              </button>
              <button
                className="rounded-md !bg-gradient-to-r from-[#33D4B7] to-[#0D9895] px-6 py-2 text-sm font-semibold text-white duration-100 hover:bg-[var(--outline-color)]"
                onClick={bulkReject}
              >
                Reject Selected
              </button>
            </div>
          ) : null}
        </div>
      )}

      <div className="overflow-x-auto rounded bg-white">
        <div className="overflow-x-auto border-b border-gray-200 shadow ">
          <table
            className="min-w-full divide-y divide-gray-200 border border-t-0 bg-white"
            id="table-to-xls"
            ref={tableRef}
          >
            <thead className="cursor-pointer bg-gray-50">
              <tr className="cursor-pointer">
                {bulkMode && (
                  <th
                    scope="col"
                    className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  ></th>
                )}
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
                      if (cell.accessor.split(",").length > 1) {
                        return (
                          <td
                            key={index}
                            className="whitespace-nowrap px-6 py-4"
                          >
                            {cell.accessor.split(",").map((accessor) => (
                              <span className="mr-2">{row[accessor.trim()]}</span>
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
                            {row?.is_approved == IMAGE_STATUS.IN_REVIEW ? (
                              <>
                                <button
                                  className="ml-2 border-r border-gray-200 px-1 pr-4 text-[#667085]"
                                  onClick={() => setActiveRow(row)}
                                >
                                  Reject
                                </button>
                                <button
                                  className="ml-2 border-r border-gray-200 px-1 pr-4 text-[#667085]"
                                  onClick={() => approveImage(row.id)}
                                >
                                  Approve
                                </button>
                              </>
                            ) : row?.is_approved === IMAGE_STATUS.APPROVED ? (
                              <button
                                className="ml-2 border-r border-gray-200 px-1 pr-4 text-[#667085]"
                                onClick={() => setActiveRow(row)}
                              >
                                Reject
                              </button>
                            ) : (
                              <button
                                className="ml-2 border-r border-gray-200 px-1 pr-4 text-[#667085]"
                                onClick={() => approveImage(row.id)}
                              >
                                Approve
                              </button>
                            )}
                            <button
                              className="ml-2 border-r border-gray-200 px-1 pr-4 text-[#667085]"
                              onClick={() => {
                                globalDispatch({
                                  type: "SHOWMODAL",
                                  payload: {
                                    showModal: true,
                                    modalShowTitle: "Confirm Delete",
                                    modalShowMessage: "Are you sure you want to delete this property space image?",
                                    modalBtnText: "Delete",
                                    type: "BaasDelete",
                                    itemId: row.id,
                                    itemId2: row.photo_id,
                                    table1: "property_spaces_images",
                                  },
                                });
                              }}
                            >
                              Delete
                            </button>
                            {row?.default_image === 1 ? (
                              <span className="ml-2 px-1 text-[#667085]">(Default Image)</span>
                            ) : (
                              <button
                                className="ml-2 px-1 text-[#667085]"
                                onClick={() => setDefaultImage({ id: row.property_spaces_id, image_id: row.photo_id })}
                              >
                                Set As Default Image
                              </button>
                            )}
                          </td>
                        );
                      }
                      if (cell.accessor == "image" || cell.accessor == "photo_url") {
                        return (
                          <td
                            key={index}
                            className="max-h-[80px] whitespace-nowrap px-6 py-2"
                          >
                            <button
                              onClick={() => {
                                setModalImage(row[cell.accessor]);
                                setModalOpen(true);
                              }}
                            >
                              <img
                                src={row[cell.accessor]}
                                className="h-16 "
                                alt="image"
                              />
                            </button>
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

                      return (
                        <td
                          key={index}
                          className="whitespace-nowrap px-6 py-4 normal-case"
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
      <ImagePreviewPopup
        modalOpen={modalOpen}
        modalImage={modalImage}
        closeModal={() => setModalOpen(false)}
      />
      <RejectImageModal
        modalOpen={activeRow.id != undefined}
        closeModal={() => setActiveRow({})}
        data={activeRow}
        onSuccess={() => getData(currentPage, pageSize)}
      />
    </>
  );
};

export default AdminPropertySpacesImagesListPage;
