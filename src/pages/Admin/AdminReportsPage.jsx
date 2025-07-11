import React from "react";
import { AuthContext, tokenExpireError } from "@/authContext";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { GlobalContext, showToast } from "@/globalContext";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import MkdSDK from "@/utils/MkdSDK";
import { callCustomAPI } from "@/utils/callCustomAPI";
import countries from "@/utils/countries.json";
import { DownloadTableExcel } from 'react-export-table-to-excel';
import { useRef } from 'react';
import { adminColumns, applySetting } from "@/utils/adminPortalColumns";

const monthMapping = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
let sdk = new MkdSDK();
const bookingStatusMapping = ["Pending", "Upcoming", "Ongoing", "Completed", "Declined", "Cancelled"];

const AdminReportsPage = () => {
  const { dispatch } = React.useContext(AuthContext);
  const [columns, setColumns] = React.useState([]);
  const [rows, setRows] = React.useState([]);
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const [bookingColumns, setBookingColumns] = React.useState([]);
  const [analyticColumns, setAnalyticColumns] = React.useState([]);
  const [heading, setHeading] = React.useState([]);
  const tableRef = useRef(null);

  const schema = yup.object({
    start_date: yup.string(),
    end_date: yup.string(),
    report_type: yup.string(),
    status: yup.string(),
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const reportType = watch("report_type");

  const onSubmit = (data) => {
    console.log("submitting", data);
    switch (data.report_type) {
      case "bookings":
        setHeading("Bookings");
        fetchBookingRows(data.start_date, data.end_date, data.status);
        setColumns(bookingColumns);
        break;
      case "analytics":
        setHeading("Analytics");
        fetchAnalyticRows(data.start_date, data.end_date);
        setColumns(analyticColumns);
        break;
      default:
        setHeading("");
        setColumns([]);
        setRows([]);
    }
  };

  async function fetchBookingRows(start, end, status) {
    const where = [
      `${start && end ? `ergo_booking.create_at BETWEEN '${start}' AND '${end} 23:59:59'` : "1"} AND ${status ? `ergo_booking.status = ${status}` : "1"}`,
      "ergo_booking.deleted_at IS NULL",
    ];
    console.log("where", where);
    try {
      const result = await callCustomAPI("booking", "post", { where, page: 1, limit: 100000 }, "PAGINATE");
      if (Array.isArray(result.list)) {
        setRows(result.list);
      }
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      showToast(globalDispatch, err.message, 4000, "ERROR");
    }
  }

  async function fetchAnalyticRows(start, end) {
    sdk.setTable("analytic_log");
    // TODO: need solution here
    // const payload = [`ergo_analytic_log.create_at BETWEEN '${start}' AND '${end} 23:59:59' AND hostname = '${window.location.origin + "/"}' `];
    try {
      const result = await sdk.callRestAPI({ payload: {} }, "GETALL");
      if (Array.isArray(result.list)) {
        setRows(result.list);
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
        path: "reports",
      },
    });
    fetchBookingColumnOrder();
    fetchAnalyticColumnOrder();
  }, []);

  async function fetchBookingColumnOrder() {
    sdk.setTable("settings");
    try {
      const result = await sdk.callRestAPI({ limit: 1, page: 1, payload: { key_name: "admin_booking_reports_column_order" } }, "PAGINATE");
      if (Array.isArray(result.list) && result.list.length > 0) {
        setBookingColumns(applySetting(result.list[0].optional_data ?? [], adminColumns.admin_booking_report));
      }
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      showToast(globalDispatch, err.message, 4000, "ERROR");
    }
  }

  async function fetchAnalyticColumnOrder() {
    sdk.setTable("settings");
    try {
      const result = await sdk.callRestAPI({ limit: 1, page: 1, payload: { key_name: "admin_analytics_column_order" } }, "PAGINATE");
      if (Array.isArray(result.list) && result.list.length > 0) {
        setAnalyticColumns(applySetting(result.list[0].optional_data ?? [], adminColumns.admin_analytics));
      }
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      showToast(globalDispatch, err.message, 4000, "ERROR");
    }
  }

  return (
    <>
      <form
        className="rounded rounded-b-none border border-b-0 bg-white p-5"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="flex justify-between">
          <h4 className="text-2xl font-medium">Reports</h4>
        </div>

        <div className="filter-form-holder mt-10 flex max-w-3xl flex-wrap">
          <div className="mb-4 w-full pr-2 pl-2 md:w-1/3">
            <label className="mb-2 block text-sm font-bold text-gray-700">Start date</label>
            <input
              type="date"
              placeholder="Start date"
              {...register("start_date")}
              className="mb-3  w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none"
            />
            <p className="text-xs italic text-red-500">{errors.start_date?.message}</p>
          </div>

          <div className="mb-4 w-full pr-2 pl-2 md:w-1/3">
            <label className="mb-2 block text-sm font-bold text-gray-700">End date</label>
            <input
              type="date"
              placeholder="End date"
              {...register("end_date")}
              className="mb-3  w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-none"
            />
            <p className="text-xs italic text-red-500">{errors.end_date?.message}</p>
          </div>

          <div className="mb-4 w-full pr-2 pl-2 md:w-1/3">
            <label className="mb-2 block text-sm font-bold text-gray-700">Report type</label>
            <select
              className="mb-3 w-full rounded border bg-white py-2 px-3 leading-tight text-gray-700 focus:outline-none"
              {...register("report_type")}
            >
              <option value="">- Select -</option>
              <option value="bookings">Bookings</option>
              {/* <option value="analytics">Analytics</option> */}
            </select>
            <p className="text-xs italic text-red-500">{errors.report_type?.message}</p>
          </div>
          {reportType == "bookings" && (
            <div className="mb-4 w-full pr-2 pl-2 md:w-1/3">
              <label className="mb-2 block text-sm font-bold text-gray-700">Booking Status</label>
              <select
                className="mb-3 w-full rounded border bg-white py-2 px-3 leading-tight text-gray-700 focus:outline-none"
                {...register("status")}
              >
                <option value="">- Select -</option>
                {bookingStatusMapping.map((val, i) => (
                  <option
                    key={val}
                    value={i}
                  >
                    {val}
                  </option>
                ))}
              </select>
              <p className="text-xs italic text-red-500">{errors.end_date?.message}</p>
            </div>
          )}
        </div>
        <button
          className="font-inter ml-2 cursor-pointer rounded-md border border-[#33D4B7] bg-gradient-to-r from-[#33D4B7] to-[#0D9895] bg-clip-text px-[66px] py-[10px] text-transparent"
          type="submit"
        >
          Generate Report
        </button>
      </form>
      <div className="flex justify-between bg-white p-5">
        <h1 className="text-3xl font-semibold">{heading}</h1>
        <div className="flex">
          <Link
            to={`/admin/column_order/${heading == "Bookings" ? "booking_reports" : "analytics"}`}
            className="ml-5 mb-1 mr-3 flex items-center  rounded !bg-gradient-to-r from-[#33D4B7] to-[#0D9895] px-6 py-2 text-sm font-semibold text-white outline-none focus:outline-none"
          >
            Change Column Order
          </Link>
          <DownloadTableExcel
            filename="admin_reports"
            sheet="admin_reports"
            currentTableRef={tableRef.current}
          >
            <button className="export-btn">Export to xls</button>
          </DownloadTableExcel>
        </div>
      </div>
      <div className="overflow-x-auto rounded bg-white shadow">
        <div className="overflow-x-auto border-b border-gray-200">
          <table
            className="min-w-full divide-y divide-gray-200 border border-t-0 bg-white"
            id="table-to-xls"
            ref={tableRef}
          >
            <thead className="cursor-pointer bg-gray-50">
              <tr className="cursor-pointer">
                {columns.map((column, index) => (
                  <th
                    key={index}
                    scope="col"
                    className="cursor-pointer whitespace-nowrap px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map((row, i) => {
                return (
                  <tr
                    className="py-2 text-sm"
                    key={i}
                  >
                    {columns.map((cell, index) => {
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
                      if (cell.formatDate) {
                        var date = new Date(row[cell.accessor]);
                        return (
                          <td
                            key={index}
                            className="whitespace-nowrap px-6 py-4"
                          >
                            {monthMapping[date.getMonth()] + " " + date.getDate() + "/" + date.getFullYear()}
                          </td>
                        );
                      }
                      if (cell.isCountry) {
                        return (
                          <td
                            key={index}
                            className="whitespace-nowrap px-6 py-4"
                          >
                            {countries.find((country) => country.code == row[cell.accessor])?.name}
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

                      if (cell.joinFields) {
                        let [field_1, field_2] = cell.accessor.split(",");
                        console.log(cell.accessor.split(","));
                        return (
                          <td
                            key={index}
                            className="whitespace-nowrap px-6 py-4 normal-case"
                          >
                            {row[field_1] + " " + row[field_2?.trim()]}
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
    </>
  );
};

export default AdminReportsPage;
