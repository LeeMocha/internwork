sap.ui.define([
    "internwork/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
],
function (Controller, JSONModel, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("internwork.controller.Upload", {

        onInit: function () {
            this.localModel = new JSONModel();
            this.getView().setModel(this.localModel, "localModel");
        },

        onUpload: function (e) {
            this._import(e.getParameter("files") && e.getParameter("files")[0]);
        },

        _import: function (file) {
            var that = this;
            var excelData = {};
            if (file && window.FileReader) {
                var reader = new FileReader();
                reader.onload = function (e) {
                    var data = e.target.result;
                    var workbook = XLSX.read(data, {
                        type: 'binary'
                    });
                    workbook.SheetNames.forEach(function (sheetName) {
                        excelData = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
                        console.log(excelData)
                    });
                    that.localModel.setData(excelData);
                    that.localModel.refresh(true);
                };
                reader.onerror = function (ex) {
                    console.log(ex);
                };
                reader.readAsBinaryString(file);
            }
        },

        onSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("query");
            this._applyFilter(sQuery);
        },

        onLiveChange: function (oEvent) {
            var sQuery = oEvent.getParameter("newValue");
            this._applyFilter(sQuery);
        },

        _applyFilter: function (sQuery) {
            var aFilters = [];
            if (sQuery && sQuery.length > 0) {
                aFilters = [
                    new Filter("성명", FilterOperator.Contains, sQuery),
                    new Filter("부서명", FilterOperator.Contains, sQuery),
                    new Filter("휴대전화", FilterOperator.Contains, sQuery),
                    new Filter("내선전화", FilterOperator.Contains, sQuery),
                    new Filter("이메일", FilterOperator.Contains, sQuery),
                    new Filter("입사일", FilterOperator.Contains, sQuery),
                    new Filter("구분", FilterOperator.Contains, sQuery)
                ];
                var oFilter = new Filter({
                    filters: aFilters,
                    and: false
                });
            } else {
                oFilter = null;
            }

            var oTable = this.byId("uploadTable");
            var oBinding = oTable.getBinding("items");

            oBinding.filter(oFilter);
        }
    })
})