import React, { useState } from "react";
import { AuthContext, tokenExpireError } from "@/authContext";
import MkdSDK from "@/utils/MkdSDK";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router-dom";
import { GlobalContext, showToast } from "@/globalContext";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { clearSearchParams, parseSearchParams } from "@/utils/utils";
import PaginationBar from "@/components/PaginationBar";
import AddButton from "@/components/AddButton";
import Button from "@/components/Button";
import Table from "@/components/Table";
import PaginationHeader from "@/components/PaginationHeader";
import ReactHtmlTableToExcel from "react-html-table-to-excel";
import { ID_PREFIX } from "@/utils/constants";
import { adminColumns, applySetting } from "@/utils/adminPortalColumns";
import TreeSDK from "@/utils/TreeSDK";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import HostAddAddonsModal from "@/components/HostAddAddonsModal";

let sdk = new MkdSDK();
let treeSdk = new TreeSDK();

const HostAddOnListPage = () => {
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
  const [searchParams, setSearchParams] = useSearchParams(localStorage.getItem("admin_addon_filter") ?? "");
  const [addOnModal, setAddOnModal] = useState(false);
  const [editAddOnModal, setEditAddOnModal] = useState(false);
  
  const [spaceCategories, setSpaceCategories] = React.useState([]);

  const schema = yup.object({
    name: yup.string(),
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
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
    data.id = data.id?.replace(ID_PREFIX.ADDON_CATEGORY, "");

    try {
      let filter = ["ergo_add_on.deleted_at,is"];
      if (data.id) {
        filter.push(`ergo_add_on.id,eq,${data.id}`);
      }
      if (data.name) {
        filter.push(`name,cs,${data.name}`);
      }
      if (data.space_id) {
        filter.push(`space_id,eq,${data.space_id}`);
      }
      filter.push(`creator_id,eq,${localStorage.getItem('user')}`)

      let result = await treeSdk.getPaginate("add_on", {
        filter,
        join: ["spaces|space_id"],
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
    globalDispatch({ type: "STOP_LOADING" });
  }

  async function fetchSpaceCategories() {
    try {
      let filter = ["deleted_at,is"];
      const result = await treeSdk.getList("spaces", {
        filter,
        join: [],
      });
      if (Array.isArray(result.list)) {
        setSpaceCategories(result.list);
      }
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      showToast(globalDispatch, err.message, 4000, "ERROR");
    }
  }


  React.useEffect(() => {
    globalDispatch({
      type: "SETPATH",
      payload: {
        path: "add_on",
      },
    });

    (async function () {
      await fetchColumnOrder();
      await fetchSpaceCategories();
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
    globalDispatch({ type: "START_LOADING" });
    sdk.setTable("settings");
    const payload = { key_name: "host_addon_categories_column_order" };
    try {
      const result = await sdk.callRestAPI({ limit: 1, page: 1, payload }, "PAGINATE");
      if (Array.isArray(result.list) && result.list.length > 0) {
        setTableColumns(applySetting(result.list[0].optional_data ?? [], adminColumns.host_addon_categories));
      }
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      showToast(globalDispatch, err.message, 4000, "ERROR");
    }
  }

  return (
    <div className="mt-10">
     <div className="flex justify-between mb-4">
          <h4 className="text-2xl font-medium">Host Customized Add-ons</h4>
          <button
          onClick={()=>setAddOnModal(true)}
          className="ml-5 mb-1 flex items-center rounded  !bg-gradient-to-r from-[#33D4B7] to-[#0D9895] px-6 py-2 text-sm font-semibold text-white outline-none focus:outline-none"
      >
        <PlusCircleIcon className="h-6 w-6" />
        <span className="ml-2">Add add-on</span>
      </button>
      </div>

      <PaginationHeader
        currentPage={currentPage}
        pageSize={pageSize}
        totalNumber={dataTotal}
        updatePageSize={updatePageSize}
      />


      <div className="overflow-x-auto rounded">
        <div className="overflow-x-auto border-b border-gray-200 shadow ">
          <Table
            columns={tableColumns}
            rows={data}
            tableType={"Add_on"}
            table1="add_on"
            type="host"
            profile={true}
            deleteMessage="Are you sure you want to delete this add-on?"
            deleteTitle="Confirm Delete"
            onSort={onSort}
            showDelete={true}
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

{addOnModal &&
      <HostAddAddonsModal setAddOnModal={setAddOnModal} getData={getData}/>
    }
    </div>
  );
};

export default HostAddOnListPage;
