var dialog = {};
function init(opt) {
  var self = (dialog = new Vue({
    el: "#app",
    data() {
      return {
        queryForm: { keyword: "" },
        tableData: [],
        url: "",
        grid: {},
      };
    },
    methods: {
      initGrid() {
        this.grid = new Tabulator("#table", {
          locale: true,
          langs: {
            "zh-cn": {
              data: {
                loading: "加载中", //data loader text
                error: "错误", //data error text
              },
            },
          },
          index: "FID",
          columnHeaderVertAlign: "bottom",
          height: "345px",
          selectable: 999,
          columns: tableConf,
          ajaxURL: "../BudgetHandler.ashx",
          ajaxConfig: "POST",
          ajaxParams: {
            SelectApi: "getsalelist",
            accountId: opt.accountId,
            projectId: opt.projectId,
          },
          ajaxResponse: function (url, params, response) {
            if (response.state == "success") {
              return response.data.map(function (m, i) {
                m.FDate = dayjs(m.FDate).format("YYYY-MM-DD");
                return m;
              });
            } else {
              layer.msg("没有查询到数据", { icon: 5 });
              return [];
            }
          },
        });
      },

      clearFilter() {
        this.grid.clearFilter();
      },

      doFilter() {
        this.grid.setFilter([
          [
            { field: "code", type: "like", value: this.queryForm.keyword },
            { field: "name", type: "like", value: this.queryForm.keyword },
          ],
        ]);
      },
    },
    watch: {},
    mounted() {
      this.initGrid();
    },
  }));
}

function getSelect() {
  var rows = dialog.grid.getSelectedData();
  if (rows != void 0 && rows.length <= 0) {
    layer.msg("尚未选择数据！", { zIndex: new Date() * 1, icon: 5 });
    return [];
  } else {
    return rows;
  }
}
