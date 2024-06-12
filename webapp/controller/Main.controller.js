sap.ui.define([
    "internwork/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    'sap/ui/export/library',
	'sap/ui/export/Spreadsheet',
    'sap/ui/core/Fragment',
    'sap/m/Token',
],
function (Controller, JSONModel, Filter, FilterOperator, MessageBox, MessageToast, exportLibrary, Spreadsheet, Fragment, Token) {
    "use strict";

    var EdmType = exportLibrary.EdmType;

    return Controller.extend("internwork.controller.Main", {
        onInit: function () {
            this.getRouter().getRoute("Main").attachMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function(){
            this._getData();
            this.onSearchInit();
        },

        onCreate: function(){
            this.navTo("Detail", {});
        },

        _getData: function() {
            var today = new Date();
            var oMainModel = this.getOwnerComponent().getModel();
            var oBuModel = this.getOwnerComponent().getModel("Buseo");

            this.setModel(new JSONModel({
                Keyword : '',
                Buname : [],
                Hiredate : today.getFullYear() + '-' + (today.getMonth()+1) + '-' + today.getDate(),
            }), 'searchModel')

            this._getODataRead(oMainModel, "/Company").done(function(aGetData){

                this.setModel(new JSONModel(aGetData), "companyModel");
                this.setModel(new JSONModel({dataLength : aGetData.length}), "oModel");
                
            }.bind(this)).fail(function(){
                MessageBox.information("Read Fail");
            }).always(function(){

            });

            this._getODataRead(oBuModel, "/Buseo").done(function(aGetData){

                this.setModel(new JSONModel(aGetData), "buModel")
                
            }.bind(this)).fail(function(){
                MessageBox.information("Read Fail");
            }).always(function(){

            });
        },

        onMove : function(dEvent) {
            var getData = this.getModel("companyModel").getData();
            // getData 까지 하지 않으면 Model 객체만 나옴
            var index = dEvent.getSource().getParent().getParent().getIndex();
            // 클릭한 Event 객체에서 해당 Model 배열의 인덱스를 꺼내오는 과정
            var oRowData = getData[index];
            console.log(getData);

            this.navTo("Detail", { Uuid : oRowData.Uuid });
        },

        onDelete : function() {

            var oMainModel = this.getOwnerComponent().getModel();
            var getData = this.getModel("companyModel").getData();
            const aIndices = this.byId("table").getSelectedIndices();

            if(aIndices.length > 0){
                MessageBox.confirm("정말로 삭제하시겠습니까?", {
                    actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                    onClose: oAction => {
                        if (oAction === MessageBox.Action.YES) {
                            aIndices.map(index => {
                                var dataUuid = getData[index].Uuid;
                                var param = "/Company(guid'" + dataUuid + "')";
                
                                console.log(dataUuid);
                                
                                this._getODataDelete(oMainModel, param).done(function(aReturn){
                
                                    this.onSearch();
                                    MessageBox.alert('정상적으로 삭제되었습니다.')
                                }.bind(this)).fail(function(){
                                    // chk = false;
                                }).always(function(){
                    
                                });     
                            })
                        }
                    }
                })
            } else {
                MessageToast.show('선택된 데이터가 없습니다.');
            }
        },

        onSearch : function() {
            var oMainModel = this.getOwnerComponent().getModel();
            var searchData = this.getView().getModel('searchModel').getData();
            var aFilter = [];

            // Name 필드에 대한 필터 생성
            var oNameFilter = new Filter("Name", "Contains", searchData.Keyword);

            // Email 필드에 대한 필터 생성
            var oEmailFilter = new Filter("Email", "Contains", searchData.Keyword);

            // Name 또는 Email 필드에 키워드가 포함되는 조건의 복합 필터 생성
            var oCombinedFilter = new Filter({
                filters: [oNameFilter, oEmailFilter],
                and: false // false로 설정하여 OR 조건 적용
            });
            
            aFilter.push(oCombinedFilter)

            console.log(searchData)
            // Buname 필터 추가
            if (searchData.Buname && searchData.Buname.length > 0) {
                var aBunameFilters = searchData.Buname.map(function(sBuname) {
                    return new Filter("Buname", "EQ", sBuname);
                });
                var oBunameFilter = new Filter({
                    filters: aBunameFilters,
                    and: false // OR 조건으로 필터 결합
                });
                aFilter.push(oBunameFilter);
            }


            aFilter.push(new Filter("Hiredate", "LE", searchData.Hiredate));
            

            this._getODataRead(oMainModel, "/Company", aFilter).done(function(aGetData){

                console.log(aGetData)

                this.setModel(new JSONModel(aGetData), "companyModel");
                this.setModel(new JSONModel({dataLength : aGetData.length}), 'oModel');

            }.bind(this)).fail(function(){
                MessageBox.information("Read Fail");
            }).always(function(){

            });


        },

        buseoChange : function(cEvent) {
            var searchValue = cEvent.mParameters.selectedItem.getText();
            console.log(searchValue);
            this.getView().setModel(new JSONModel({
                ...this.getView().getModel('searchModel').getData(),
                Buname : searchValue,
            }), "searchModel")
        },

        onSearchInit : function(){
            this._getData();

            var oMultiInput = this.byId("multiInput");
            if (oMultiInput) {
                oMultiInput.setTokens([]);
            }
            
            var oSearchModel = this.getView().getModel("searchModel");
            if (oSearchModel) {
                oSearchModel.setProperty("/Buname", []);
            }
        },

        onExport : function () {
            var aCols, oRowBinding, oSettings, oSheet, oTable;

			if (!this._oTable) {
				this._oTable = this.byId('exportTable');
			}

			oTable = this._oTable;
			oRowBinding = oTable.getBinding('items');
			aCols = this.createColumnConfig();

			oSettings = {
				workbook: {
					columns: aCols,
					hierarchyLevel: 'Level'
				},
				dataSource: oRowBinding,
				fileName: 'internwork.xlsx',
				worker: false // We need to disable worker because we are using a MockServer as OData Service
			};

			oSheet = new Spreadsheet(oSettings);
			oSheet.build().finally(function() {
				oSheet.destroy();
			});
        },

        createColumnConfig: function() {
			var aCols = [];
            var labels = ['성명', '부서명', '휴대전화', '내선전화', '이메일', '입사일', '구분'];
            var properties = ['Name', 'Buname', 'Mobile', 'Phone', 'Email', 'Hiredate', 'isIntern'];
            
            labels.map((label ,index)=>{
                aCols.push({
                    label: label,
                    property: properties[index],
                    type: EdmType.String,
                });
            })
                
			return aCols;
		},

        handleValueHelp: function(oEvent) {
            var sInputValue = oEvent.getSource().getValue();

            // 프래그먼트를 로드하고 Dialog를 생성
            if (!this._pValueHelpDialog) {
                this._pValueHelpDialog = Fragment.load({
                    id: this.getView().getId(),
                    name: "internwork.view.Dialog",
                    controller: this
                }).then(function(oDialog){
                    this.getView().addDependent(oDialog);
                    return oDialog;
                }.bind(this));
            }

            this._pValueHelpDialog.then(function(oDialog) {
                // 모델을 설정하고 Dialog 열기
                oDialog.setModel(this.getView().getModel("buModel"), "buModel");
                oDialog.open(sInputValue);
            }.bind(this));
        },

        _handleValueHelpSearch: function(oEvent) {
            var sValue = oEvent.getParameter("value");
            var oFilter = new Filter("Butxt", FilterOperator.Contains, sValue);
            oEvent.getSource().getBinding("items").filter([oFilter]);
        },

        _handleValueHelpClose: function(oEvent) {
            var aSelectedItems = oEvent.getParameter("selectedItems");
            if (aSelectedItems) {
                var aTokens = aSelectedItems.map(oItem => {
                    return new Token({
                        key: oItem.getBindingContext("buModel").getProperty("Bukey"),
                        text: oItem.getBindingContext("buModel").getProperty("Butxt")
                    });
                });
                var oMultiInput = this.byId("multiInput");
                oMultiInput.setTokens(aTokens);

                var oSearchModel = this.getView().getModel("searchModel");
                var aBuname = aSelectedItems.map(function(oItem) {
                    return oItem.getBindingContext("buModel").getProperty("Butxt");
                });
                oSearchModel.setProperty("/Buname", aBuname);
            }
            oEvent.getSource().getBinding("items").filter([]);
        },

        navToUpload: function(){
            console.log("************진입했냐")
            this.navTo("Upload", {});
        },

        _applyFinter: function(){

        },

        multiInputChange : function(){

        }

    });
});
