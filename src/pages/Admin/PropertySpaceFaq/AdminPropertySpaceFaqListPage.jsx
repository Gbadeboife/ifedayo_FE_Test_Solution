import React from "react";
import { AuthContext, tokenExpireError } from "@/authContext";
import MkdSDK from "@/utils/MkdSDK";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { GlobalContext, showToast } from "@/globalContext";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { parseSearchParams, clearSearchParams } from "@/utils/utils";
import PaginationBar from "@/components/PaginationBar";
import AddButton from "@/components/AddButton";
import Button from "@/components/Button";
import Table from "@/components/Table";
import PaginationHeader from "@/components/PaginationHeader";
import { DownloadTableExcel } from 'react-export-table-to-excel';
import { useRef } from 'react';
import { ID_PREFIX } from "@/utils/constants";
import { adminColumns, applySetting } from "@/utils/adminPortalColumns";
import TreeSDK from "@/utils/TreeSDK";

let sdk = new MkdSDK();
let treeSdk = new TreeSDK();

const AdminPropertySpaceFaqListPage = () => {
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
  const [searchParams, setSearchParams] = useSearchParams();
  // TODO: find a better way to do this
  const [searchParams2] = useSearchParams(localStorage.getItem("admin_psf_filter") ?? "");

  const schema = yup.object({
    id: yup.string(),
    property_space_id: yup.string(),
    question: yup.string(),
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
    data.id = data.id?.replace(ID_PREFIX.PROPERTY_SPACE_FAQS, "");
    data.property_space_id = data.property_space_id?.replace(ID_PREFIX.PROPERTY_SPACE, "");

    try {
      let filter = ["deleted_at,is"];
      if (data.id) {
        filter.push(`id,eq,${data.id}`);
      }
      if (data.question) {
        filter.push(`question,cs,${data.question}`);
      }
      if (data.property_space_id) {
        filter.push(`property_space_id,eq,${data.property_space_id}`);
      }

      let result = await treeSdk.getPaginate("property_space_faq", {
        filter,
        join: [],
        page: pageNum || 1,
        size: limitNum,
        order: "update_at",
      });
      const { list, total, limit, num_pages, page } = result;

      console.log("result ", result);

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
    searchParams.set("property_space_id", data.property_space_id);
    searchParams.set("question", data.question);

    setSearchParams(searchParams);
    localStorage.setItem("admin_psf_filter", searchParams.toString());

    getData(1, pageSize);
  };

  React.useEffect(() => {
    globalDispatch({
      type: "SETPATH",
      payload: {
        path: "property_spaces_faq",
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

  async function fetchColumnOrder() {
    sdk.setTable("settings");
    const payload = { key_name: "admin_property_spaces_faq_column_order" };
    try {
      const result = await sdk.callRestAPI({ limit: 1, page: 1, payload }, "PAGINATE");
      if (Array.isArray(result.list) && result.list.length > 0) {
        setTableColumns(applySetting(result.list[0].optional_data ?? [], adminColumns.admin_property_space_faqs));
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
        className="rounded rounded-b-none bg-white p-5 shadow"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="flex justify-between">
          <h4 className="text-2xl font-medium">Property Spaces Faq Search</h4>
          <AddButton
            link={"/admin/add-property_spaces_faq"}
            text="Add new Property Space Faq"
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
              type="text"
              placeholder="ID"
              {...register("id")}
              className={`"shadow   focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.id?.message ? "border-red-500" : ""}`}
            />
            <p className="text-xs italic text-red-500">{errors.id?.message}</p>
          </div>

          <div className="mb-4 w-full pr-2 pl-2 md:w-1/3">
            <label
              className="mb-2 block text-sm font-bold text-gray-700"
              htmlFor="property_spaces_id"
            >
              Property Space
            </label>
            <input
              type="number"
              placeholder="Property Space ID"
              {...register("property_space_id")}
              className={`"shadow   focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.property_space_id?.message ? "border-red-500" : ""}`}
            />
            <p className="text-xs italic text-red-500">{errors.property_space_id?.message}</p>
          </div>
          <div className="mb-4 w-full pr-2 pl-2 md:w-1/2">
            <label
              className="mb-2 block text-sm font-bold text-gray-700"
              htmlFor="question"
            >
              question
            </label>
            <input
              type="text"
              placeholder="Question"
              {...register("question")}
              className={`"shadow   focus:shadow-outline w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none ${errors.question?.message ? "border-red-500" : ""}`}
            />
            <p className="text-xs italic text-red-500">{errors.question?.message}</p>
          </div>
        </div>
        <Button text="Search" />
        <button
          className="font-inter ml-2 cursor-pointer rounded-md border border-[#33D4B7] bg-gradient-to-r from-[#33D4B7] to-[#0D9895] bg-clip-text px-[66px] py-[10px] text-transparent"
          type="reset"
          onClick={() => {
            reset({ id: "", property_space_id: "", question: "" });
            localStorage.removeItem("admin_psf_filter");
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
          to="/admin/column_order/property_spaces_faq"
          className="ml-5 mb-1 mr-3 flex items-center  rounded !bg-gradient-to-r from-[#33D4B7] to-[#0D9895] px-6 py-2 text-sm font-semibold text-white outline-none focus:outline-none"
        >
          Change Column Order
        </Link>{" "}
        <DownloadTableExcel
          filename="property_space_faq_list"
          sheet="property_space_faq_list"
          currentTableRef={tableRef.current}
        >
          <button className="export-btn">Export to xls</button>
        </DownloadTableExcel>
      </div>

      <div className="overflow-x-auto rounded">
        <div className="overflow-x-auto border-b border-gray-200 shadow ">
          <Table
            ref={tableRef}
            columns={tableColumns}
            rows={data}
            profile={true}
            tableType={"property_spaces_faq"}
            table1="property_space_faq"
            deleteMessage="Are you sure you want to delete this Property Space FAQ?"
            deleteTitle="Confirm Delete"
            onSort={onSort}
            id="table-to-xls"
          />
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

export default AdminPropertySpaceFaqListPage;
