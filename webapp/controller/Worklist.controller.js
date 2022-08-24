sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "../model/formatter",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/Sorter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Core",
    "sap/m/Dialog",
    'sap/m/MessageToast',
    'sap/m/DialogType',
    "sap/m/Label",
	"sap/m/Input",
    "sap/m/Button",
    "sap/m/ButtonType",
    "./DialogApprob",
    "sap/ui/Device"
], function (BaseController, JSONModel, formatter, MessageBox, Fragment, Filter, sorter, FilterOperator, Core, Dialog, MessageToast, DialogType, Label, Input, Button, ButtonType, DialogApprob, Device) {
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
            // var tab = this.getView().byId("iconTabBar").getSelectedKey()
            // if(tab==="attach") this.getView().byId("iconTabBar").setSelectedKey("Items");
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
        },
        onTabSelect: async function(oEvent){
            var itemselected =this.byId("list").getSelectedItems();
            if(itemselected.length === 0){
                MessageToast.show("Seleccione  una solicitud de pedido");
                return;
            }
            sap.ui.core.BusyIndicator.show()
            var tab = oEvent.getSource().getSelectedKey();
            if(tab==="attach"){
                var dataOrder  =  sap.ui.getCore().getModel("selectedOrder").getData();
                var modelo = this.getGenericModel();
                var entidad = "/get_attachSet"
                var arrFilter=[];
                arrFilter.push(new sap.ui.model.Filter("Banfn", sap.ui.model.FilterOperator.EQ, dataOrder.Banfn)); 
                var atachments = await this.getEntityV2(modelo,entidad, arrFilter) 
                var data=[];
                if(atachments.results.length > 0){
                    
                   for (let index = 0; index < atachments.results.length; index++) {
                        var elemnt ={
                            Banfn: atachments.results[index].Banfn,
                            ObjName: atachments.results[index].ObjName,
                            ObjType: atachments.results[index].ObjType,
                            File: atachments.results[index].File,
                            Icon:  this.getIcon(atachments.results[index].ObjType)
                        }
                        data.push(elemnt)
                   }
                   
                } 
                var auxModel = new sap.ui.model.json.JSONModel(data); 
                this.getView().setModel(auxModel,"ListAttachModel");
            }
            sap.ui.core.BusyIndicator.hide()
        },
        getIcon:function(type){
            var icon="sap-icon://document"
            switch (type) {
                case "JPG":
                    icon = "sap-icon://attachment-photo";
                    break;
                case "PNG":
                    icon = "sap-icon://picture";
                    break;
                case "PDF":
                    icon = "sap-icon://pdf-attachment";
                    break; 
                case "DOC":
                    icon = "sap-icon://doc-attachment";
                    break;        
                case "DOCX":
                    icon = "sap-icon://doc-attachment";
                    break;
                case "TXT":
                    icon = "sap-icon://attachment-text-file";
                    break;
                case "XLS":
                    icon = "sap-icon://excel-attachment";
                    break;  
                case "XLSX":
                    icon = "sap-icon://excel-attachment";
                    break;              
                case "CSV":
                    icon = "sap-icon://excel-attachment";
                    break;
                default:
                    icon = "sap-icon://document";
                    break;
            }
            return icon;
        },
        handleSelectionAttach: function(oEvent){
            sap.ui.core.BusyIndicator.show();
            var dataRow = oEvent.getSource().getBindingContext("ListAttachModel").getObject();
            var dtValue = new Date();
            var fileName = "Document_" + String(dtValue.getDate()) + String(dtValue.getMonth()+1) + String(dtValue.getFullYear()) + String(dtValue.getHours()) + String(dtValue.getMinutes());
            //this.onViewerPDF(dataRow.File,fileName)
            this.downloadFile(dataRow.File, fileName, dataRow.ObjType)
            sap.ui.core.BusyIndicator.hide();
        },
        onViewerPDF: function(pdf, namePdf) {
            var objbuilder;

            objbuilder += ('<object width="100%" height="100%" data="data:application/pdf;base64,');
            objbuilder += (pdf);
            objbuilder += ('" type="application/pdf" class="internal">');
            objbuilder += ('<embed src="data:application/pdf;base64,');
            objbuilder += (pdf);
            objbuilder += ('" type="application/pdf" />');
            objbuilder += ('</object>');

            var win = window.open("#", "_blank");
            var title = namePdf

            win.document.write('<html><title>' + title +
                '</title><body style="margin-top:0px; margin-left: 0px; margin-right: 0px; margin-bottom: 0px;">');
            win.document.write(objbuilder);
            win.document.write('</body></html>');
        },
        downloadFile: function (data, nombre, type) {
			//data = Xstring del servicio que contienen el pdf
			var element = document.createElement('a');
            var objectType = this.getMimeType(type)
			element.setAttribute('href', 'data:'+ objectType +';base64,' + data);
			element.setAttribute('download', (nombre ? nombre : "Documento"));
			element.style.display = 'none';
			document.body.appendChild(element);
			element.click();
			document.body.removeChild(element)
		},
        getMimeType: function(type){
            var objType=""
            switch (type) {
                case "JPG":
                    objType = "image/jpeg";
                    break;
                case "PNG":
                    objType = "image/png";
                    break;
                case "PDF":
                    objType = "application/pdf";
                    break; 
                case "DOC":
                    objType = "application/msword";
                    break;        
                case "DOCX":
                    objType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                    break;
                case "TXT":
                    objType = "text/plain";
                    break;
                case "XLS":
                    objType = "application/vnd.ms-excel";
                    break;  
                case "XLSX":
                    objType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                    break; 
                case "CSV":
                    objType = "text/csv";
                    break;           
                default:
                    objType = "application/pdf";
                    break;
            }
            return objType    
        },
        onPressAction: function(option){
            var itemselected =this.byId("list").getSelectedItems();
            if(itemselected.length === 0){
                MessageToast.show("Seleccione  una solicitud de pedido");
                return;
            }
            var title=option=== 1? "Aprovar Solicitud": "Rechazar Solicitud"
            if(this.oSubmitDialog){
                this.oSubmitDialog.destroy(); 
                this.oSubmitDialog = undefined; 
            } 
            Core.byId("submissionNote")? Core.byId("submissionNote").setValue(""): "";
            if (!this.oSubmitDialog) {
				this.oSubmitDialog = new Dialog({
					type: DialogType.Message,
					title: title,
					content: [
						new Label({
							text: "¿Desea "+ title+"?",
							labelFor: "submissionNote"
						}),
						new sap.m.TextArea("submissionNote", {
							width: "100%",
                            type: "Text",
							placeholder: "Agregar Nota (No requerido)",
                            maxLength: 150
						})
					],
                    beginButton: new Button({
						type: ButtonType.Emphasized,
						text: "Enviar",
						press: function () {
							var sText = Core.byId("submissionNote").getValue();
							//MessageToast.show("Comentario es: " + sText);
                            this.onSendDialogApprobe(option)
							this.oSubmitDialog.close();
						}.bind(this)
					}),
					endButton: new Button({
						text: "Cancelar",
						press: function () {
							this.oSubmitDialog.close();
						}.bind(this)
					})
				});
			}
			this.oSubmitDialog.open();
        },
        onSendDialogApprobe: function(option){
            var that = this;
            var title = option === 1? "Solicitud Aprobada": "Solicitud Rechazada"
            sap.ui.core.BusyIndicator.show();
            var orderdata = this.getView().getModel("orderModel").getData();
            var WiId = orderdata.WiId;
            var genericModel = this.getGenericModel();
            var user = this.UserID ==="DEFAULT_USER" || this.UserID ==="" ? "EXT_OMAR" :  this.UserID ;
            var entidad = "/ApprovalSet(WiId='"+WiId+"',Uname='"+ user +"',Approved="+option+")";            
            genericModel.read(entidad, {
                success: function(oData, response) {
                    sap.ui.core.BusyIndicator.hide();
                    var data = response.data
                        //Type(E)= "Error", Type(S)= Succes
                        //Message = Mensage Personalizado
                        
                    if(data.Type === "S"){
                        var mensage =  data.Message !== "" ? data.Message : "Operación realizada con exito";
                        MessageBox.success(mensage, {
                            icon: MessageBox.Icon.SUCCESS,
                            title: title,
                            onClose: function(){
                                that.onGetInitialData();
                                var ordermodel = that.getView().getModel("orderModel");
                                ordermodel.setData({modelData:{}});
                                ordermodel.updateBindings(true);
                                var modeldetail = that.getView().getModel("ListdetailModel");
                                modeldetail.setData({modelData:{}});
                                modeldetail.updateBindings(true);
                                var tab = that.getView().byId("iconTabBar").getSelectedKey()
                                if(tab==="attach") that.getView().byId("iconTabBar").setSelectedKey("Items");
                            }
                        });
                    }else{
                        var mensage =  data.Message !== "" ? data.Message : "Error al realizar la operación";
                        MessageBox.error(mensage, {
                            icon: MessageBox.Icon.ERROR,
                            title: title,
                            onClose: function(){
                                that.onGetInitialData();
                                var ordermodel = that.getView().getModel("orderModel");
                                ordermodel.setData({modelData:{}});
                                ordermodel.updateBindings(true);
                                var modeldetail = that.getView().getModel("ListdetailModel");
                                modeldetail.setData({modelData:{}});
                                modeldetail.updateBindings(true);
                                var tab = that.getView().byId("iconTabBar").getSelectedKey()
                                if(tab==="attach") that.getView().byId("iconTabBar").setSelectedKey("Items");
                            }
                        });
                    }   
                },
                error: function(oData, response) {
                    sap.ui.core.BusyIndicator.hide();
                    MessageBox.error("Error al ejecutar la operación");
                }
            });
        }
    });
});
