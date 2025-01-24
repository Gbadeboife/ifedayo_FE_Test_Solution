import { empty } from "./utils";

export default function TreeSDK() {
  this._baseurl = "https://ergo.mkdlabs.com";
  this._project_id = "ergo";
  this._secret = "k5go4l548ch4qk5918x2uljuv8rqqp2as";
  this._table = "";

  const raw = this._project_id + ":" + this._secret;
  let base64Encode = btoa(raw);

  this.getHeader = function () {
    return {
      Authorization: "Bearer " + localStorage.getItem("token"),
      "x-project": base64Encode,
    };
  };

  this.baseUrl = function () {
    return this._baseurl;
  };

  this.getProjectId = function () {
    return this._project_id;
  };

  this.treeBaseUrl = function () {
    return this._baseurl + "/v4/api/records";
  };

  function getJoins(options = {}) {
    let hasJoin = options.hasOwnProperty("join");
    let joins = options.join;
    if (hasJoin && typeof joins == "string") joins = joins.split(",");

    let joinQuery = "";
    joins.forEach((join) => {
      joinQuery += `join=${join}&`;
    });

    return [hasJoin, joins, joinQuery];
  }

  function getOrdering(options) {
    let order = options.order ?? "id";
    let direction = options.direction ?? "desc";

    return `order=${order},${direction}&`;
  }

  function getFilters(options) {
    let hasFilter = options.hasOwnProperty("filter");
    let filters = options.filter;

    let filterQuery = "";
    if (hasFilter && Array.isArray(filters)) {
      filters.forEach((filter) => {
        filterQuery += `filter=${filter}&`;
      });
    }

    return [hasFilter, filters, filterQuery];
  }

  /*
    Returns  one entry
    @params table : string - name of table to fetch
    @params id : number - id to fetch 
    @params options : object - optional parameters
            options.join - Array or comma separated list of tables to join

     let res = await (new TreeSDK).getOne('author', 1 {
          join: ['book'],
        });

  */

  this.getOne = async function (table, id, options = {}) {
    if (empty(table) || empty(id)) throw new Error("table and id is required.");

    let [hasJoin, joins, joinQuery] = getJoins(options);
    const header = {
      "Content-Type": "application/json",
      "x-project": base64Encode,
      Authorization: "Bearer " + localStorage.getItem("token"),
    };

    const getResult = await fetch(this.treeBaseUrl() + `/${table}/${id}?${joinQuery}`, {
      method: "get",
      headers: header,
    });
    const json = await getResult.json();

    if (getResult.status === 401) {
      throw new Error(json.message);
    }

    if (getResult.status === 403) {
      throw new Error(json.message);
    }
    return json;
  };

  /*
    Returns one or more entries
    @params table : string - name of table to fetch
    @params ids : Array|string|number - array, comma separated list of ids or just a single id to fetch 
    @params options : object - optional parameters
            options.join - Array or comma separated list of tables to join

     let res = await (new TreeSDK).getMany('author', [1,2] {
          join: ['book'],
        });

  */
  this.getMany = async function (table, ids, options = {}) {
    if (empty(table) || empty(ids)) throw new Error("table and id is required.");

    let [hasJoin, joins, joinQuery] = getJoins(options);
    let id = Array.isArray(ids) ? ids.join(",") : ids;
    const header = {
      "Content-Type": "application/json",
      "x-project": base64Encode,
      Authorization: "Bearer " + localStorage.getItem("token"),
    };

    const getResult = await fetch(this.treeBaseUrl() + `/${table}/${id}?${joinQuery}`, {
      method: "get",
      headers: header,
    });
    const json = await getResult.json();

    if (getResult.status === 401) {
      throw new Error(json.message);
    }

    if (getResult.status === 403) {
      throw new Error(json.message);
    }
    return json;
  };

  /*
    Returns one or more entries with ordering and filters
    @params table : string - name of table to fetch
    @params options : object - optional parameters
            options.join - Array or comma separated list of tables to join
            options.filter - Array of filters
            options.order - field used to sort the result
            options.direction - direction of result asc|desc
            options.size - max number of entries
    Filter Options
    cs	contains string, sw	starts with, ew	ends with, eq equal, lt	less than
    le	less or equal, ge	greater or equal, gt	greater than, bt	between
    is	is null
    NB: Add n to negate - ngt --> Nit greater than
    let res = await (new TreeSDK).getList('author', {
      filter: ['id,gt,2'],
      join: ['book']
    });

  */
  this.getList = async function (table, options = {}) {
    if (empty(table)) throw new Error("table and id is required.");
    let [hasJoin, joins, joinQuery] = getJoins(options);
    let [hasFilter, filters, filterQuery] = getFilters(options);
    let orderQuery = getOrdering(options);
    let sizeQuery = options.hasOwnProperty("size") ? `size=${options.size}&` : "";
    const header = {
      "Content-Type": "application/json",
      "x-project": base64Encode,
      Authorization: "Bearer " + localStorage.getItem("token"),
      uid: localStorage.getItem("device-uid"),
    };

    const getResult = await fetch(this.treeBaseUrl() + `/${table}?${joinQuery}${orderQuery}${sizeQuery}${filterQuery}`, {
      method: "get",
      headers: header,
    });
    const json = await getResult.json();

    if (getResult.status === 401) {
      throw new Error(json.message);
    }

    if (getResult.status === 403) {
      throw new Error(json.message);
    }
    return json;
  };

  /*
    Returns a paginated list of entries
    @params table : string - name of table to fetch
    @params options : object - optional parameters
            options.join - Array or comma separated list of tables to join
            options.filter - 
            options.order - field used to sort the result
            options.direction - direction of result asc|desc
            options.page - page number
            options.size - max number of entries

    Filter Options
    cs	contains string, sw	starts with, ew	ends with, eq equal, lt	less than
    le	less or equal, ge	greater or equal, gt	greater than, bt	between
    is	is null
    NB: Add n to negate - ngt --> Nit greater than

   let res = await (new TreeSDK).getPaginate('author', {
          filter: ['id,gt,2'],
          join: ['book']
        });

  */
  this.getPaginate = async function (table, options = {}) {
    if (empty(table)) throw new Error("table and id is required.");

    let [hasJoin, joins, joinQuery] = getJoins(options);
    let [hasFilter, filters, filterQuery] = getFilters(options);
    let orderQuery = getOrdering(options);
    let size = options.size ?? 20;
    let pageQuery = options.hasOwnProperty("page") ? `page=${options.page},${size}&` : `page=1&`;
    const header = {
      "Content-Type": "application/json",
      "x-project": base64Encode,
      Authorization: "Bearer " + localStorage.getItem("token"),
      uid: localStorage.getItem("device-uid"),
    };
    const getResult = await fetch(this.treeBaseUrl() + `/${table}?${joinQuery}${orderQuery}${pageQuery}${filterQuery}`, {
      method: "get",
      headers: header,
    });
    const json = await getResult.json();

    if (getResult.status === 401) {
      throw new Error(json.message);
    }

    if (getResult.status === 403) {
      throw new Error(json.message);
    }
    return json;
  };

  /*
    Returns Creates a new entry
    @params table : string - name of table to fetch
    @params options : object - optional parameters

    
   let res = await (new TreeSDK).create('author', {
          name: 'author name',
          age: 23
        });
         

  */
  this.create = async function (table, payload, options = {}) {
    if (empty(table)) throw new Error("table and id is required.");

    const header = {
      "Content-Type": "application/json",
      "x-project": base64Encode,
      Authorization: "Bearer " + localStorage.getItem("token"),
    };
    const getResult = await fetch(this.treeBaseUrl() + `/${table}}`, {
      method: "post",
      headers: header,
      body: JSON.stringify(payload),
    });
    const json = await getResult.json();

    if (getResult.status === 401) {
      throw new Error(json.message);
    }

    if (getResult.status === 403) {
      throw new Error(json.message);
    }
    return json;
  };

  /*
    Returns Updates an entry
    @params table : string - name of table to update
    @params id : number - id of table entry to update
    @params payload  : object - key value pair for values to update
         
    let res = await (new TreeSDK).update('author', 2 {
          name: 'updated author name',
        });

  */
  this.update = async function (table, id, payload) {
    if (empty(table) || empty(id)) throw new Error("table and id is required.");

    const header = {
      "Content-Type": "application/json",
      "x-project": base64Encode,
      Authorization: "Bearer " + localStorage.getItem("token"),
    };
    const getResult = await fetch(this.treeBaseUrl() + `/${table}/${id}`, {
      method: "put",
      headers: header,
      body: JSON.stringify(payload),
    });
    const json = await getResult.json();

    if (getResult.status === 401) {
      throw new Error(json.message);
    }

    if (getResult.status === 403) {
      throw new Error(json.message);
    }
    return json;
  };

  /*
    Returns Delete an entry
    @params table : string - name of table to delete from
    @params id : number - id of table entry to delete

     let res = await (new TreeSDK).delete('author', 2);
  */
  this.delete = async function (table, id, payload) {
    if (empty(table) || empty(id)) throw new Error("table and id is required.");

    const header = {
      "Content-Type": "application/json",
      "x-project": base64Encode,
      Authorization: "Bearer " + localStorage.getItem("token"),
    };
    const getResult = await fetch(this.treeBaseUrl() + `/${table}/${id}`, {
      method: "delete",
      headers: header,
      body: JSON.stringify(payload),
    });
    const json = await getResult.json();

    if (getResult.status === 401) {
      throw new Error(json.message);
    }

    if (getResult.status === 403) {
      throw new Error(json.message);
    }
    return json;
  };

  this.callRawAPI = async function (uri, payload, method, signal) {
    const header = {
      "Content-Type": "application/json",
      "x-project": base64Encode,
      Authorization: "Bearer " + localStorage.getItem("token"),
      uid: localStorage.getItem("device-uid"),
    };

    const result = await fetch(this._baseurl + uri, {
      method: method,
      headers: header,
      body: JSON.stringify(payload),
      signal,
    });
    const jsonResult = await result.json();

    if (result.status === 401) {
      throw new Error(jsonResult.message);
    }

    if (result.status === 403) {
      throw new Error(jsonResult.message);
    }
    return jsonResult;
  };

  return this;
}
/*

cs	contains string
sw	starts with
ew	ends with
eq
    equal
Default when no operator is provided
lt	less than
le	less or equal
ge	greater or equal
gt	greater than
bt	between
in	in list
is	is null


*/
