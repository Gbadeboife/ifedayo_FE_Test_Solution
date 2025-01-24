import React from "react";
import { AuthContext, tokenExpireError } from "@/authContext";
import MkdSDK from "@/utils/MkdSDK";
import { GlobalContext, showToast } from "@/globalContext";
import AddButton from "@/components/AddButton";
import Table from "@/components/Table";
import { ID_PREFIX } from "@/utils/constants";
import TreeSDK from "@/utils/TreeSDK";

let sdk = new MkdSDK();
let treeSdk = new TreeSDK();

const columns = [
  {
    header: "ID",
    accessor: "id",
    idPrefix: ID_PREFIX.EMAIL,
  },
  {
    header: "Email Type",
    accessor: "slug",
  },
  {
    header: "Subject",
    accessor: "subject",
  },
  {
    header: "Tags",
    accessor: "tag",
  },

  {
    header: "Actions",
    accessor: "",
  },
];

const AdminEmailListPage = () => {
  const { dispatch } = React.useContext(AuthContext);
  const [data, setCurrentTableData] = React.useState([]);

  const { dispatch: globalDispatch } = React.useContext(GlobalContext);

  async function getData() {
    try {
      let filter = ["deleted_at,is"];
      const result = await treeSdk.getList("email", { join: [], filter, order: "update_at" });
      const { list } = result;
      setCurrentTableData(list);
    } catch (error) {
      tokenExpireError(dispatch, error.message);
      showToast(globalDispatch, error.message, 4000, "ERROR");
    }
  }

  React.useEffect(() => {
    globalDispatch({
      type: "SETPATH",
      payload: {
        path: "email",
      },
    });

    getData();
  }, []);

  return (
    <>
      <div className="overflow-x-auto  rounded bg-white p-5 shadow">
        <div className="mb-3 flex w-full justify-between text-center  ">
          <h4 className="text-2xl font-medium">Emails </h4>
          <AddButton
            link={"/admin/add-email"}
            text="Add new Email"
          />
        </div>
        <div className="overflow-x-auto border-b border-gray-200 shadow ">
          <Table
            columns={columns}
            rows={data}
            tableType={"email"}
            table1="email"
            emailActions
            deleteMessage="Are you sure you want to delete this Email?"
          />
        </div>
      </div>
    </>
  );
};

export default AdminEmailListPage;
