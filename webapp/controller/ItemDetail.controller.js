sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History",
    "../model/formatter",
    "sap/ui/core/Core",
], function(
	BaseController, JSONModel, History, formatter, Core) {
	"use strict";    
	return BaseController.extend("zorder.request.zorderrequest.controller.ItemDetail", {
        formatter: formatter,

        onInit : function () {
            
            this.getRouter().getRoute("itemDetail").attachPatternMatched(this._onObjectMatched, this);
            this.getRouter().getRoute("itemDetail").attachPatternMatched(this._onPatternMatch, this);
		},
        _onPatternMatch: function (oEvent) {
			this._supplier = oEvent.getParameter("arguments").supplier || this._supplier || "0";
			this._product = oEvent.getParameter("arguments").product || this._product || "0";

		},
        _onObjectMatched : function (oEvent) {
            var oViewModel = new JSONModel({
                busy : true,
                delay : 0
            });
            var argument =  oEvent.getParameter("arguments");
           
            this._sObjectId=argument.objectId  || this._sObjectId || "0"; 
            this._itemId=argument.itemId || this._itemId || "0"; 
            if(this.getModel("appView").getProperty("/layout")!=="EndColumnFullScreen"){
                this.getModel("appView").setProperty("/layout","ThreeColumnsEndExpanded")
            }
            this.loadDetail(this._sObjectId);
        },

        loadDetail:function(){
            var that = this;
            var i18n = this.getView().getModel("i18n").getResourceBundle();
            var itemList = sap.ui.getCore().getModel("ItemDetail").getData();
            var auxModel = new sap.ui.model.json.JSONModel(itemList);
            this.getView().setModel(auxModel,"ItemDetail");
            this.byId("pageTitleDetail").setText(i18n.getText("expandTitleDetail", [itemList.Banfn, itemList.Txz01, itemList.Bnfpo]))
            
        },
        onExit: function () {
			this.getRouter().getRoute("itemDetail").detachPatternMatched(this._onPatternMatch, this);
		},
        handleFullScreen: function () {
			var e=this.getModel("appView").getProperty("/actionButtonsInfo/endColumn/fullScreen");
            this.getModel("appView").setProperty("/actionButtonsInfo/endColumn/fullScreen",!e);
            if(!e){
                this.getModel("appView").setProperty("/previousLayout",this.getModel("appView").getProperty("/layout"));
                this.getModel("appView").setProperty("/layout","EndColumnFullScreen")
            }else{
                this.getModel("appView").setProperty("/layout",this.getModel("appView").getProperty("/previousLayout"))
            }
		},

		handleExitFullScreen: function () {
			this.getRouter().navTo("itemDetail", {objectId:this._sObjectId,itemId: this._itemId});
		},

		handleClose: function () {
            this.getModel("appView").setProperty("/actionButtonsInfo/endColumn/fullScreen",false);
            this.getRouter().navTo("object", {objectId:this._sObjectId});
		},

	});
});