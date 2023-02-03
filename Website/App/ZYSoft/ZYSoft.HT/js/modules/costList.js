var table = {};
//accountId = '250116'
var self = (vm = new Vue({
  el: "#app",
  data() {
    var curDate = new dayjs();
    return {
      from: "cost",
      form: {
        startDate: curDate.startOf("year"),
        endDate: curDate.endOf("year"),
        accountId: accountId,
        contractNo: "",
        manager: "",
        custManager: "",
        custName: "",
        projectNo: "",
        projectId: "",
        custId: "",
      },
      maxHeight: 0,
      offset: {
        top: 0,
        left: 0,
      },
      index: -1,
    };
  },
  computed: {},
  watch: {},
  methods: {
    closeBaseDataDialog(row) {
      layer.close(self.index);
    },
    openBaseDataDialog(type, title, success, filter) {
      openDialog({
        title: title,
        url: "./modal/Dialog.aspx?filter=" + filter,
        offset: [self.offset.top, self.offset.left],
        onSuccess: function (layero, index) {
          self.index = index;
          var iframeWin = window[layero.find("iframe")[0]["name"]];
          iframeWin.init({
            layer,
            dialogType: type,
            accountId: self.form.accountId,
          });
        },
        onBtnYesClick: function (index, layero) {
          var iframeWin = window[layero.find("iframe")[0]["name"]];
          var row = iframeWin.getSelect();
          if (row.length <= 0) {
            layer.msg("请先选择", { icon: 5 });
          } else if (!row) {
            layer.msg("最多只能选择一个", { icon: 5 });
          } else {
            success && success(row);
            layer.close(index);
          }
        },
      });
    },
    doQuery() {
      openDialog({
        url: "./modalFilter/ModalFilter.aspx",
        onSuccess: function (layero, index) {
          layer.setTop(layero);
          self.offset.top = $(layero).offset().top - 80;
          self.offset.left = $(layero).offset().left + 40;
          var iframeWin = window[layero.find("iframe")[0]["name"]];
          iframeWin.init({ layer, parent: self });
        },
        onBtnYesClick: function (index, layero) {
          var iframeWin = window[layero.find("iframe")[0]["name"]];
          var row = iframeWin.getSelect();
          if (row.length <= 0) {
            layer.msg("请先选择", { icon: 5 });
          } else if (!row) {
            layer.msg("最多只能选择一个", { icon: 5 });
          } else {
            var r = row[0];
            r = Object.assign(
              {},
              {
                SelectApi: "getcostlist",
              },
              self.form,
              r
            );
            table.setData(
              "./BudgetHandler.ashx",
              Object.assign(
                {},
                {
                  SelectApi: "getcostlist",
                },
                r
              ),
              "POST"
            );
            layer.close(index);
          }
        },
      });
    },
    doAdd() {
      if ($.isFunction(top.CreateTab)) {
        top.CreateTab(
          "App/ZYSoft/ZYSoft.HT/CostFormPage.aspx?" +
          utils.obj2Url({
            state: "add",
            v: new Date() * 1,
          }),
          "成本表",
          "Budget" + new Date() * 1
        );
      }
    },
    doRefresh() {
      table.setData(
        "./BudgetHandler.ashx",
        Object.assign(
          {},
          {
            SelectApi: "getcostlist",
          },
          self.form,
          {
            startDate: self.form.startDate == "" ? "" : dayjs(self.form.startDate).format("YYYY-MM-DD"),
            endDate: self.form.endDate == "" ? "" : dayjs(self.form.endDate).format("YYYY-MM-DD"),
          }
        ),
        "POST"
      );
    },
    doDelete() {
      if (table.getSelectedData().length <= 0) {
        return layer.msg("尚未选择要删除的行", {
          zIndex: new Date() * 1,
          icon: 5,
        });
      }
      var ids = table
        .getSelectedData()
        .map(function (row) {
          return row.FID;
        })
        .join(",");
      layer.confirm(
        "确定要删除选中的行吗?",
        { icon: 3, title: "提示" },
        function (index) {
          $.ajax({
            type: "POST",
            url: "./BudgetHandler.ashx",
            async: true,
            data: {
              SelectApi: "deletecost",
              ids: ids,
            },
            dataType: "json",
            success: function (result) {
              if (result.state == "success") {
                self.doRefresh();
              }
              layer.msg(result.msg, {
                icon: result.state == "success" ? 1 : 5,
              });
              layer.close(index);
            },
            error: function () {
              layer.close(index);
              layer.msg("删除实际成本单发生错误!", { icon: 5 });
            },
          });
        }
      );
    },
    doExport() {
      if (table.getData().length <= 0) {
        return layer.msg("没有可以导出的数据", {
          zIndex: new Date() * 1,
          icon: 5,
        });
      }
      layer.confirm(
        "确定要导出列表吗?",
        { icon: 3, title: "提示" },
        function (index) {
          layer.close(index);
          table.download(
            "xlsx",
            "实际成本统计表" + dayjs().format("YYYY-MM-DD") + ".xlsx",
            {
              sheetName: "实际成本统计表",
            }
          );
        }
      );
    },
    initGrid(callback) {
      var maxHeight =
        $(window).height() -
        $("#header").height() -
        $("#toolbarContainer").height() -
        $("#title").height() +
        5;
      var postion = tableConf.findIndex(function (f) {
        return f.field == "FManager";
      });
      if (this.form.accountId == "230114") {
        tableConf[postion].title = "苏腾项目经理";
      } else if (this.form.accountId == "250116") {
        tableConf[postion].title = "华腾项目经理";
      }
      table = new Tabulator("#grid", {
        locale: true,
        langs: langs,
        height: maxHeight,
        selectable: 999,
        columnHeaderVertAlign: "bottom",
        columns: [
          {
            formatter: function (cell, formatterParams, onRendered) {
              return "<el-tooltip  effect='dark' content='点击查看详情' placement='right-end'><i class='el-icon-document'/></el-tooltip>";
            },
            title: "操作",
            width: 80,
            headerHozAlign: "center",
            hozAlign: "center",
            headerSort: false,
            download: false,
            cellClick: function (e, cell) {
              self.onClickDetail(cell.getRow().getData());
            },
          },
        ].concat(tableConf),
        ajaxResponse: function (url, params, response) {
          if (response.state == "success") {
            var t = response.data.map(function (m, i) {
              m.FCreateDate = dayjs(m.FCreateDate).format("YYYY-MM-DD");

              m.FContractDate =
                m.FContractDate == "" || m.FContractDate == null
                  ? ""
                  : dayjs(m.FContractDate).format("YYYY-MM-DD");

              m.FEndDate =
                m.FEndDate == "" || m.FEndDate == null
                  ? ""
                  : dayjs(m.FEndDate).format("YYYY-MM-DD");


              m.FCost = numeral(m.FCost).format('0,0.00')
              m.FSum = numeral(m.FSum).format('0,0.00')
              m.FAddSum = numeral(m.FAddSum).format('0,0.00')
              m.FTotalSum = numeral(m.FTotalSum).format('0,0.00')
              return m;
            });

            return t;
          } else {
            layer.msg("没有查询到数据", { icon: 5 });
            return [];
          }
        },
      });

      table.on("tableBuilt", function () {
        callback && callback(table);
      });
    },
    onClickDetail(item) {
      var FAccountID = item.FAccountID,
        FProjectID = item.FProjectID,
        FID = item.FID;
      if ($.isFunction(top.CreateTab)) {
        top.CreateTab(
          "App/ZYSoft/ZYSoft.HT/CostFormPage.aspx?" +
          utils.obj2Url({
            accountId: FAccountID,
            projectId: FProjectID,
            id: FID,
            state: "read",
            v: new Date() * 1,
          }),
          "成本表",
          "Budget" + FID
        );
      }
    },
  },
  mounted() {
    this.initGrid(function () {
      window.onresize = function () {
        table.setHeight(
          $(window).height() -
          $("#header").height() -
          $("#toolbarContainer").height() -
          $("#title").height() +
          5
        );
      };
      table.setData(
        "./BudgetHandler.ashx",
        Object.assign(
          {},
          {
            SelectApi: "getcostlist",
          },
          self.form,
          {
            startDate: dayjs(self.form.startDate).format("YYYY-MM-DD"),
            endDate: dayjs(self.form.endDate).format("YYYY-MM-DD"),
          }
        ),
        "POST"
      );
    });
  },
}));
