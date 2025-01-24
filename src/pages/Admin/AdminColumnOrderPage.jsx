import PencilIcon from "@/components/frontend/icons/PencilIcon";
import Icon from "@/components/Icons";
import { GlobalContext } from "@/globalContext";
import MkdSDK from "@/utils/MkdSDK";
import { parseJsonSafely } from "@/utils/utils";
import React, { useEffect, useState } from "react";
import { useContext } from "react";
import { useNavigate, useParams } from "react-router";

const AdminColumnOrderPage = () => {
  const { sectionId } = useParams();
  const { dispatch: globalDispatch } = useContext(GlobalContext);
  const [columns, setColumns] = useState([]);
  const [settingId, setSettingId] = useState(null);
  const navigate = useNavigate();
  const sdk = new MkdSDK();

  const sortByOrderNumber = (a, b) => {
    return a.orderNumber - b.orderNumber;
  };

  async function fetchSetting() {
    sdk.setTable("settings");
    const payload = { key_name: `admin_${sectionId}_column_order` };
    try {
      const result = await sdk.callRestAPI({ limit: 1, page: 1, payload }, "PAGINATE");
      if (Array.isArray(result.list) && result.list.length > 0) {
        setColumns(parseJsonSafely(result.list[0].optional_data, []));
        console.log(parseJsonSafely(result.list[0].optional_data, []));
        setSettingId(result.list[0].id);
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

  const saveOrder = async () => {
    sdk.setTable("settings");
    try {
      await sdk.callRestAPI(
        {
          id: settingId,
          optional_data: JSON.stringify(columns),
        },
        "PUT",
      );
      navigate(-1);
    } catch (err) {
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          heading: "Operation failed",
          message: err.message,
        },
      });
    }
  };

  const changeOrder = (idx, newOrder) => {
    if (newOrder < 1) return;
    setColumns((prev) => {
      const copy = [...prev];
      // find max orderNumber
      let maxOrderNum = prev.reduce((acc, curr) => {
        if (curr.orderNumber > acc) return curr.orderNumber;
        return acc;
      }, 0);

      // find column with newOrder
      prev.forEach((col, j) => {
        if (col.orderNumber == newOrder) {
          copy[j].orderNumber = prev[idx].orderNumber;
        }
      });

      if (newOrder >= maxOrderNum) {
        copy[prev.length - 1].orderNumber = prev[idx].orderNumber;
        copy[idx].orderNumber = maxOrderNum;
        return copy;
      }
      copy[idx].orderNumber = newOrder;
      return copy;
    });
  };

  const changeShouldDisplay = (idx, newValue) => {
    setColumns((prev) => {
      let copy = [...prev];
      copy[idx].shouldShow = newValue;
      return copy;
    });
  };

  useEffect(() => {
    globalDispatch({
      type: "SETPATH",
      payload: {
        path: sectionId,
      },
    });
    fetchSetting();
  }, []);

  return (
    <div className="p-5 font-normal">
      <div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mr-2 mb-2 inline-flex items-center py-2.5 pr-5 text-center text-sm font-semibold"
        >
          <Icon
            type="arrow"
            variant="narrow-left"
            className="h-4 w-4 stroke-[#667085]"
          />{" "}
          <span className="ml-2">Back</span>
        </button>
      </div>
      <h1 className="mb-20 text-4xl font-semibold">{sectionId.replace(/([-_]\w)/g, (g) => " " + g[1].toUpperCase())}</h1>
      <table className="mb-8 w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th>Column Name</th>
            <th>Order Number</th>
            <th>Should Display</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {columns.sort(sortByOrderNumber).map((col, idx) => (
            <tr
              className="text-center"
              key={col.orderNumber}
            >
              <td className="py-4">{col.header}</td>
              <td className="hover-show-edit py-4">
                <input
                  type="number"
                  className="remove-arrow w-[80px] focus:outline-none"
                  defaultValue={col.orderNumber}
                />
                <span>{col.orderNumber}</span>{" "}
                <button
                  onClick={(e) => e.currentTarget.parentElement.classList.add("edit-mode")}
                  className="edit-btn ml-2"
                >
                  <PencilIcon />
                </button>
                <button
                  onClick={(e) => {
                    let newOrder = e.target.parentElement.querySelector("input").value;
                    changeOrder(idx, newOrder);
                    e.target.parentElement.classList.remove("edit-mode");
                  }}
                  className="save-btn absolute ml-5 mb-1 mr-3 flex items-center  rounded !bg-gradient-to-r from-[#33D4B7] to-[#0D9895] px-4 py-1 text-xs font-semibold text-white outline-none focus:outline-none"
                >
                  {" "}
                  Change
                </button>
              </td>
              <td className="py-4">
                <span>{col.shouldShow ? "Yes" : "No"}</span>
                <input
                  type="checkbox"
                  className="remove-arrow w-[80px] focus:outline-none"
                  checked={col.shouldShow}
                  onChange={(e) => changeShouldDisplay(idx, e.target.checked)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-end">
        <button
          onClick={saveOrder}
          className="ml-5 mb-1 mr-3 flex items-center  rounded !bg-gradient-to-r from-[#33D4B7] to-[#0D9895] px-6 py-2 text-sm font-semibold text-white outline-none focus:outline-none"
        >
          Save Order
        </button>
      </div>
    </div>
  );
};

export default AdminColumnOrderPage;
