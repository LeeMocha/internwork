sap.ui.define([
    "internwork/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
],
function (Controller, JSONModel, Filter, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("internwork.controller.Detail", {
        onInit: function () {
            this.getRouter().getRoute("Detail").attachMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent){

            var oArgs = oEvent.getParameter("arguments");
            this.Uuid = oArgs.Uuid;
            this.flag = true;
            console.log(oArgs.Uuid)

            this._getData();
        },

        _getData: function() {
            var oCompanyModel = this.getOwnerComponent().getModel();

            if(this.Uuid){           
                var aFilter = [];
                aFilter.push(new Filter("Uuid", "EQ", this.Uuid));

                this._getODataRead(oCompanyModel, "/Company", aFilter).done(function(aGetData){

                    this.setModel(new JSONModel([{ Butxt : aGetData[0].Buname }]), "buModel");
                    this.setModel(new JSONModel({isCreate: false}), "oModel");
                    this.setModel(new JSONModel(aGetData[0]), "viewModel");
                    
                }.bind(this)).fail(function(){
                    MessageBox.information("Read Fail");
                }).always(function(){

                });

            } else {
                var today = new Date();
                this.createDate = today.getFullYear() + '-' + (today.getMonth() + 1).toString().padStart(2, '0') + '-' + today.getDate().toString().padStart(2, '0');
                var oBuModel = this.getOwnerComponent().getModel("Buseo");
                var oData = oCompanyModel.getData();

                this._getODataRead(oBuModel, "/Buseo").done(function(aGetData){

                    this.setModel(new JSONModel([{Bukey:'', Butxt: '필수 선택'}, ...aGetData]), "buModel")
                    this.setModel(new JSONModel({isCreate: true}), "oModel");
                    this.setModel(new JSONModel({...oData, Hiredate : this.createDate, Maintel : 'M', Inyn : 'N', Buname : '필수 선택'}), "viewModel");

                }.bind(this)).fail(function(){
                    MessageBox.information("Read Fail");
                }).always(function(){

                });
            }

        },

        validationCheck : function(getData){
            if (!getData.Name || getData.Name.length === 0) {
                MessageToast.show("성함을 적어주시기 바랍니다.");
                return true;
            }
            if (getData.Buname === '필수 선택') {
                MessageToast.show("부서명을 선택해 주시기 바랍니다.");
                return true;
            }
            if (!getData.Email || !getData.Email.includes('@')) {
                MessageToast.show("유효한 Email 형식이 아닙니다.");
                return true;
            }

            return false;
        },

        onSave: function(oEvent){

            var oMainModel = this.getOwnerComponent().getModel();
            var getModel = this.getModel("viewModel").getData();
            var allCehck = this.validationCheck(getModel);

            if(this.Uuid && this.flag){
                var oBuModel = this.getOwnerComponent().getModel("Buseo");
                this.setModel(new JSONModel({isCreate: true}), "oModel");
                this._getODataRead(oBuModel, "/Buseo").done(function(aGetData){
                    this.setModel(new JSONModel([{Bukey:'', Butxt: '필수 선택'}, ...aGetData]), "buModel")
                }.bind(this)).fail(function(){
                    MessageBox.information("Read Fail");
                }).always(function(){

                });
                this.flag = false;
            }else {
                if(allCehck){
                    oEvent.preventDefault();
                    return;
                } else {
                    if(this.flag){
                        console.log(getModel.Inyn);
                        this._getODataCreate(oMainModel, "/Company", {
                            ...getModel,
                            Inyn : getModel.Inyn
                        }).done(function(aReturn){
                            MessageBox.alert('정상적으로 저장되었습니다.', {onClose : ()=>this.navTo("Main", {})})               
                        }.bind(this)).fail(function(){
                            // chk = false;
                        }).always(function(){
                            
                        });
                    } else {
                        var param = "/Company(guid'" + this.Uuid + "')";
                        // Entity 에서 해당 레코드에 접근 할 수 있게 해주는 쿼리스트링
                        // Money(guid'5daefeff-bb86-1edf-88c8-6c9e001f00aa') => 해당 값은 Service URL 에서 확인 가능함

                        this._getODataUpdate(oMainModel, param, getModel).done(function(aReturn){
                        // 해당 _getODataUpdate 메서드는 BaseController에 정의된 메서드
                        
                        MessageBox.alert('정상적으로 저장되었습니다.', {onClose : ()=>this.navTo("Main", {})})
                        
                        }.bind(this)).fail(function(){
                            // chk = false;
                        }).always(function(){
            
                        });
                    }
                }
            }
        },

        onReset : function(){
            if(this.Uuid){
                if(this.flag){
                    MessageBox.confirm('Main으로 돌아가시겠습니까?',{
                        actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                        onClose: oAction => {
                            if (oAction === MessageBox.Action.YES) {
                                this.navTo("Main", {});
                            }
                        }
                    });
                } else {
                    this._getData();
                    this.flag = true;
                }
            } else {
                var newData = new JSONModel({
                    Name : '',
                    Hiredate : this.createDate,
                    Buname : '필수 선택',
                    Email : '',
                    Mobile : '',
                    Tel : '',
                    Inyn : 'N',
                    Maintel : 'M'
                })
                this.getView().setModel(newData, "viewModel");
            }
        },
        
        radioSelect: function(rEvent){
            var Maintel = rEvent.mParameters.selectedIndex === 0 ? 'M' : 'I'

            this.getView().setModel(new JSONModel({
                ...this.getView().getModel('viewModel').getData(),
                Maintel : Maintel,
            }), "viewModel")
        },

        checkBoxSelect: function(cEvent){
            var Inyn = cEvent.getSource().getSelected() ? 'Y' : 'N'

            this.getView().setModel(new JSONModel({
                ...this.getView().getModel('viewModel').getData(),
                Inyn : Inyn,
            }), "viewModel")

        }

    });
});