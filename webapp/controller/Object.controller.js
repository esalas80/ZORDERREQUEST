sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History",
    "../model/formatter"
], function (BaseController, JSONModel, History, formatter) {
    "use strict";

    return BaseController.extend("zorder.request.zorderrequest.controller.Object", {

        formatter: formatter,

        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

        /**
         * Called when the worklist controller is instantiated.
         * @public
         */
        onInit : function () {
            // Model used to manipulate control states. The chosen values make sure,
            // detail page shows busy indication immediately so there is no break in
            // between the busy indication for loading the view's meta data
            var oViewModel = new JSONModel({
                    busy : true,
                    delay : 0
                });
            this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
            var e=new JSONModel({
                busy:false,
                delay:0,
                lineItemListTitle:this.getResourceBundle().getText("detailLineItemTableHeading"),
                currency:"MXN",
                totalOrderAmount:0,
                selectedTab:""
            });
            this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched,this);
            this.setModel(e,"detailView");
            this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this))
            this.setModel(oViewModel, "objectView");
        },
        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */


        /**
         * Event handler  for navigating back.
         * It there is a history entry we go one step back in the browser history
         * If not, it will replace the current entry of the browser history with the worklist route.
         * @public
         */
        onNavBack : function() {
            var sPreviousHash = History.getInstance().getPreviousHash();
            if (sPreviousHash !== undefined) {
                // eslint-disable-next-line sap-no-history-manipulation
                history.go(-1);
            } else {
                this.getRouter().navTo("worklist", {}, true);
            }
        },

        /* =========================================================== */
        /* internal methods                                            */
        /* =========================================================== */

        /**
         * Binds the view to the object path.
         * @function
         * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
         * @private
         */
        _onObjectMatched : function (oEvent) {
            var sObjectId =  oEvent.getParameter("arguments").objectId;
           
            this._sObjectId=sObjectId;
            if(this.getModel("appView").getProperty("/layout")!=="MidColumnFullScreen"){
                this.getModel("appView").setProperty("/layout","TwoColumnsMidExpanded")
            }
            this.getModel().metadataLoaded().then(function(){
                var e=this.getModel().createKey("Orders",{OrderID:this._sObjectId});
                this.loadDetail(sObjectId);
            }.bind(this));
            this.loadDetail(sObjectId);
        },
        _onMetadataLoaded:function(){
            // var e=this.getView().getBusyIndicatorDelay(),
            //     t=this.getModel("detailView"),
            //     i=this.byId("list"),
            //     o=i.getBusyIndicatorDelay();
            // t.setProperty("/delay",0);
            // t.setProperty("/lineItemTableDelay",0);
            // i.attachEventOnce("updateFinished",function(){t.setProperty("/lineItemTableDelay",o)});
            // t.setProperty("/busy",true);
            // t.setProperty("/delay",e)
        },
        loadDetail: function(detailId){
            debugger
            var that = this;
            var i18n = this.getView().getModel("i18n").getResourceBundle();
            var oViewModel = this.getModel("objectView");
            oViewModel.setProperty("/busy", false);
            var dataDetail = sap.ui.getCore().getModel("OderDetail").getData();
            this.byId("pageTitle").setText(i18n.getText("expandTitle", [dataDetail.Banfn, dataDetail.Txz01, dataDetail.Bnfpo]))
            this.byId("snappedTitle").setText(i18n.getText("expandTitle", [dataDetail.Banfn, dataDetail.Txz01, dataDetail.Bnfpo]))
            oViewModel.setData(dataDetail);
            console.log(dataDetail)
        },
        onCloseDetailPress:function(){
            this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen",false);
            this.getOwnerComponent().oListSelector.clearMasterListSelection();
            this.getRouter().navTo("master")
        },

    });

});
