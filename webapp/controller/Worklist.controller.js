sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "../model/formatter",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/Sorter",
    "sap/ui/model/FilterOperator",
    "sap/m/Dialog",
    'sap/m/MessageToast',
    'sap/m/DialogType',
    "sap/m/Label",
	"sap/m/Input",
    "sap/m/Button",
    "sap/m/ButtonType",
    "./DialogApprob",
    "sap/ui/Device",
    "sap/ui/core/Core"
], function (BaseController, JSONModel, formatter, MessageBox, Fragment, Filter, sorter, FilterOperator, Dialog, MessageToast, DialogType, Label, Input, Button, ButtonType, DialogApprob, Device, Core) {
    "use strict";

    return BaseController.extend("zorder.request.zorderrequest.controller.Worklist", {

        formatter: formatter,

        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

        /**
         * Called when the worklist controller is instantiated.
         * @public
         */
        onInit : function () {
            var oViewModel;
            var eList = this.byId("list"),
                t=this._createViewModel(),
                i=eList.getBusyIndicatorDelay();
            // Model used to manipulate control states
            oViewModel = new JSONModel({
                worklistTableTitle : this.getResourceBundle().getText("worklistTableTitle"),
                shareSendEmailSubject: this.getResourceBundle().getText("shareSendEmailWorklistSubject"),
                shareSendEmailMessage: this.getResourceBundle().getText("shareSendEmailWorklistMessage", [location.href]),
                tableNoDataText : this.getResourceBundle().getText("tableNoDataText")
            });
            this.setModel(oViewModel, "worklistView");
            this._oList = eList;
            // keeps the filter and search state
            this._oListFilterState = {
                aFilter : [],
                aSearch : []
            };
            var userData = new sap.ushell.services.UserInfo();
            this.UserID=userData.getUser().getId();
           this.onGetInitialData();
            var oDeviceModel = new JSONModel(Device);
			oDeviceModel.setDefaultBindingMode("OneWay");
			this.getView().setModel(oDeviceModel, "device");
            this.setModel(t,"masterView");
            eList.attachEventOnce("updateFinished",function(){
                t.setProperty("/delay",i)
            });
            this.getView().addEventDelegate({
                onBeforeFirstShow:function(){
                    this.getOwnerComponent().oListSelector.setBoundMasterList(eList)
                }.bind(this)
            });
            this.getRouter().getRoute("worklist").attachPatternMatched(this._onMasterMatched,this);
            this.getRouter().attachBypassed(this.onBypassed,this);
        },
        onGetInitialData: async function(){
            var oList = this.byId("list");
            var arrFilter=[];
            var user = this.UserID ==="DEFAULT_USER" || this.UserID ==="" ? "EXT_OMAR" :  this.UserID ;
            arrFilter.push(new sap.ui.model.Filter("Uname", sap.ui.model.FilterOperator.EQ, user));
            var modelo = this.getGenericModel();
            var entidad = "/headerSet"
            var dataList = await  this.getEntityV2(modelo,entidad, arrFilter)
            var auxModel = new sap.ui.model.json.JSONModel(dataList.results);
            oList.setModel(auxModel,"ListModel");
        },
       
        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */

        /**
         * Triggered by the table's 'updateFinished' event: after new table
         * data is available, this handler method updates the table counter.
         * This should only happen if the update was successful, which is
         * why this handler is attached to 'updateFinished' and not to the
         * table's list binding's 'dataReceived' method.
         * @param {sap.ui.base.Event} oEvent the update finished event
         * @public
         */
        onUpdateFinished : function (oEvent) {
            // update the worklist's object counter after the table update
            var sTitle,
                oTable = oEvent.getSource(),
                iTotalItems = oEvent.getParameter("total");
            // only update the counter if the length is final and
            // the table is not empty
            if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
                sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
            } else {
                sTitle = this.getResourceBundle().getText("worklistTableTitle");
            }
            this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);
        },

        /**
         * Event handler when a table item gets pressed
         * @param {sap.ui.base.Event} oEvent the table selectionChange event
         * @public
         */
        onPress : function (oEvent) {
            // The source is the list item that got pressed
            this._showObject(oEvent.getSource());
        },

        /**
         * Event handler for navigating back.
         * Navigate back in the browser history
         * @public
         */
        onNavBack : function() {
            // eslint-disable-next-line sap-no-history-manipulation
            history.go(-1);
        },

        onUpdateFinished : function (oEvent) {
            // update the list object counter after new data is loaded
            this._updateListItemCount(oEvent.getParameter("total"));
        },
         /**
         * Sets the item count on the list header
         * @param {integer} iTotalItems the total number of items in the list
         * @private
         */
          _updateListItemCount: function (iTotalItems) {
            var sTitle;
            // only update the counter if the length is final
            if (this._oList.getBinding("items").isLengthFinal()) {
                sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
                this.getModel("worklistView").setProperty("/title", sTitle);
            }
        },
        onSearch : function (oEvent) {
            if (oEvent.getParameters().refreshButtonPressed) {
                return;
            }

            var sQuery = oEvent.getParameter("query");
            var cFilter = [];
            if (sQuery) {
                cFilter.push(new sap.ui.model.Filter("Banfn", sap.ui.model.FilterOperator.Contains, sQuery));                                   
            } 
            this._applySearch(cFilter);

        },

        /**
         * Event handler for refresh event. Keeps filter, sort
         * and group settings and refreshes the list binding.
         * @public
         */
        onRefresh : function () {
            var oTable = this.byId("list");
            oTable.getBinding("items").refresh();
        },

        /* =========================================================== */
        /* internal methods                                            */
        /* =========================================================== */

        /**
         * Shows the selected item on the object page
         * @param {sap.m.ObjectListItem} oItem selected Item
         * @private
         */
        _showObject : function (oItem) {
            sap.ui.core.BusyIndicator.hide();
            this.getRouter().navTo("object", {
                objectId: oItem.Banfn
            });
        },

        /**
         * Internal helper method to apply both filter and search state together on the list binding
         * @param {sap.ui.model.Filter[]} aTableSearchState An array of filters for the search
         * @private
         */
        _applySearch: function(aFilters) {
           
            this._oList.getBinding("items").filter(aFilters, "Application");
        },
        onSelectionChange:async  function (oEvent) {
            sap.ui.core.BusyIndicator.show();
            var t=oEvent.getSource(),
                i=oEvent.getParameter("selected");
            var tab = sap.ui.getCore().getModel("ActiveTabModel")? sap.ui.getCore().getModel("ActiveTabModel").getProperty("/keyActive") : "attach";
            //if(tab==="attach") this.getView().byId("iconTabBar").setSelectedKey("Items");
            var object =oEvent.getSource().getSelectedItem().getBindingContext("ListModel").getObject();    
            var nroOrden = object.Banfn;
            var arrFilter=[];
            arrFilter.push(new sap.ui.model.Filter("Banfn", sap.ui.model.FilterOperator.EQ, nroOrden)); 
            var modelo = this.getGenericModel();
            var entidad = "/Req_DetailSet"
            var detailData = await this.getEntityV2(modelo,entidad, arrFilter)
            var auxModel = new sap.ui.model.json.JSONModel(detailData.results);
            var orderModel = new sap.ui.model.json.JSONModel(object);
            sap.ui.getCore().setModel(auxModel,"ListdetailModel");
            sap.ui.getCore().setModel(orderModel, "OderDetail");
            
            if(!(t.getMode()==="MultiSelect"&&!i)){
                this._showDetail(nroOrden)
            }

            sap.ui.core.BusyIndicator.hide();
            
        },
        _createViewModel:function(){
            return new JSONModel({
                isFilterBarVisible:false,
                filterBarLabel:"",
                delay:0,
                titleCount:0,
                noDataText:this.getResourceBundle().getText("masterListNoDataText")
            })
        },
        _onMasterMatched:function(){
            this.getModel("appView").setProperty("/layout","OneColumn")
        },
        _showDetail:function(e){
            var t=!Device.system.phone;
            this.getModel("appView").setProperty("/layout","TwoColumnsMidExpanded");
            this.getRouter().navTo("object",{objectId:e},t)
        },
        handleSelectionChange: function(oEvent){
            sap.ui.core.BusyIndicator.show();
            var dataRow = oEvent.getParameters().listItem.getBindingContext("ListdetailModel").getObject();
            var auxModel = new sap.ui.model.json.JSONModel(dataRow);
            sap.ui.getCore().setModel(auxModel, "OderDetail");
            this._showObject(dataRow);
        }
    });
});
