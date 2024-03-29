sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History",
    "../model/formatter",
    "sap/ui/core/Core",
    "sap/m/Dialog",
    'sap/m/MessageToast',
    "sap/m/MessageBox",
    'sap/m/DialogType',
    "sap/m/Label",
	"sap/m/Input",
    "sap/m/Button",
    "sap/m/ButtonType",
    "./Worklist.controller",

], function (BaseController, JSONModel, History, formatter, Core, Dialog, MessageToast, MessageBox, DialogType, Label, Input, Button, ButtonType, wklCont) {
    "use strict";

    return BaseController.extend("zorder.request.zorderrequest.controller.Object", {

        formatter: formatter,
        wklCont: new wklCont(this),

        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

        /**
         * Called when the worklist controller is instantiated.
         * @public
         */
        onInit : function () {
            this._aValidKeys=[
                "Items",
                "attach"
            ];
            var dataActiveTab = {
                keyActive:"Items"
            }
            var modelTabActive = new JSONModel(dataActiveTab);
            sap.ui.getCore().setModel(modelTabActive, "ActiveTabModel");
            var oViewModel = new JSONModel({
                    busy : true,
                    delay : 0
                });
            
            var e=new JSONModel({
                busy:false,
                delay:0,
                lineItemListTitle:this.getResourceBundle().getText("detailLineItemTableHeading"),
                currency:"MXN",
                totalOrderAmount:0,
                selectedTab:""
            });
            this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
            this.setModel(e,"detailView");
            this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this))
            this.setModel(oViewModel, "objectView");
            var userData = new sap.ushell.services.UserInfo();
            this.UserID=userData.getUser().getId();
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
            var argument =  oEvent.getParameter("arguments");
           
            this._sObjectId=argument.objectId;
            if(this.getModel("appView").getProperty("/layout")!=="MidColumnFullScreen"){
                this.getModel("appView").setProperty("/layout","TwoColumnsMidExpanded")
            }
            this.loadDetail(this._sObjectId);
            var i=argument["?query"];
            if(i&&this._aValidKeys.indexOf(i.tab)>=0){
                this.getView().getModel("detailView").setProperty("/selectedTab",i.tab);
                this.getRouter().getTargets().display(i.tab)
            }else{
                this.getRouter().navTo("object",{objectId:this._sObjectId,query:{tab:"Items"}},true)
            }
        },
        _onMetadataLoaded:function(){
            var e=this.getView().getBusyIndicatorDelay(),
                t=this.getModel("detailView"),
                i=this.byId("list"),
                o=i.getBusyIndicatorDelay();
            t.setProperty("/delay",0);
            t.setProperty("/lineItemTableDelay",0);
            i.attachEventOnce("updateFinished",function(){t.setProperty("/lineItemTableDelay",o)});
            t.setProperty("/busy",true);
            t.setProperty("/delay",e)
        },
       /* Loading the data from the model into the view. */
        /**
         * @date 2022-11-29
         * @param {any} detailId
         * @returns {any}
         */
        loadDetail: function(detailId){
            var that = this;
            var i18n = this.getView().getModel("i18n").getResourceBundle();
            var oViewModel = this.getModel("objectView");
            oViewModel.setProperty("/busy", false);
            var dataDetail = sap.ui.getCore().getModel("OderDetail").getData();
            //this.byId("pageTitle").setText(i18n.getText("expandTitle", [dataDetail.Banfn]))
            //this.byId("pageTitle").setText(i18n.getText("expandTitle", [dataDetail.Banfn, dataDetail.Txz01, dataDetail.Bnfpo]))
            //this.byId("snappedTitle").setText(i18n.getText("expandTitle", [dataDetail.Banfn, dataDetail.Txz01, dataDetail.Bnfpo]))
            oViewModel.setData(dataDetail);
            var itemList = sap.ui.getCore().getModel("ListdetailModel").getData();
            var auxModel = new sap.ui.model.json.JSONModel(itemList);
            this.getView().setModel(auxModel,"ListdetailModel");
        },
        onCloseDetailPress:function(){
            this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen",false);
            this.getOwnerComponent().oListSelector.clearMasterListSelection();
            this.getRouter().navTo("worklist")
        },

       /* Toggling the full screen mode. */
        /**
         * @date 2022-11-29
         * @returns {any}
         */
        toggleFullScreen:function(){
            var e=this.getModel("appView").getProperty("/actionButtonsInfo/midColumn/fullScreen");
            this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen",!e);
            if(!e){
                this.getModel("appView").setProperty("/previousLayout",this.getModel("appView").getProperty("/layout"));
                this.getModel("appView").setProperty("/layout","MidColumnFullScreen")
            }else{
                this.getModel("appView").setProperty("/layout",this.getModel("appView").getProperty("/previousLayout"))
            }
        },

        /* The above code is a function that is called when a tab is selected. */
        /**
         * @date 2022-11-29
         * @param {any} oEvent
         * @returns {any}
         */
        onTabSelect: async function(oEvent){
            var selectedOrder  =  sap.ui.getCore().getModel("OderDetail");
            if(!selectedOrder){
                MessageToast.show("Seleccione  una solicitud de pedido");
                return;
            }
            sap.ui.core.BusyIndicator.show()
            var tab = oEvent.getSource().getSelectedKey();
            sap.ui.getCore().getModel("ActiveTabModel").setProperty("/keyActive", tab);
            var dataOrder  =  sap.ui.getCore().getModel("OderDetail").getData();
            var modelo = this.getGenericModel();
            if(tab==="attach"){
                
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
                            Icon:  this.getIcon(atachments.results[index].ObjType),
                            Name: atachments.results[index].Name
                        }
                        data.push(elemnt)
                   }
                   
                } 
                var auxModel = new sap.ui.model.json.JSONModel(data); 
                this.getView().setModel(auxModel,"ListAttachModel");
            }
            else if(tab==="text"){
                var entidad = "/TextosSolpedSet";
                var texts;
                var arrFilter=[];
                arrFilter.push(new sap.ui.model.Filter("Banfn", sap.ui.model.FilterOperator.EQ, dataOrder.Banfn.toString())); 
                await this.getEntityV2(modelo,entidad, arrFilter).then(value=>{
                    texts = value.results;
                }).catch((e)=>{
                    sap.ui.core.BusyIndicator.hide();
                });
                var auxOrderModel = new sap.ui.model.json.JSONModel(texts); 
                this.getView().setModel(auxOrderModel,"ListTextModel");
            }
            else if(tab == "approvers"){
                var entidad = "/release_strategy_reqSet";
                var texts;
                var arrFilter=[];
                arrFilter.push(new sap.ui.model.Filter("Banfn", sap.ui.model.FilterOperator.EQ, dataOrder.Banfn.toString())); 
                await this.getEntityV2(modelo,entidad, arrFilter).then(value=>{
                    texts = value.results;
                    if (texts.length > 0) {
                        for (let index = 0; index < texts.length; index++) {
                           
                            var Relstrtx = "Denominación de estrategia: " + texts[index].RelStrTx +"<br>";
                            var CodLib = "Código liberación: " + texts[index].RelCode +"<br>";
                            var approve = texts[index].Libero === "true"? "<strong style=\"color:green;\">Si</strong>Si":"<strong style=\"color:#B71542;\">No</strong>";
                            var element = "Denominación grupo de liberación: " + texts[index].RelGrpTx +" <br>"+ Relstrtx + CodLib +"Liberó: " + approve;
                            texts[index].text= element;
                        }
                    }

                }).catch((e)=>{
                    sap.ui.core.BusyIndicator.hide();
                });
                var auxOrderModel = new sap.ui.model.json.JSONModel(texts); 
                this.getView().setModel(auxOrderModel,"approversNodel");
            }
            sap.ui.core.BusyIndicator.hide()
        },
       /* A function that returns an icon based on the file type. */
        /**
         * @date 2022-11-29
         * @param {any} type
         * @returns {any}
         */
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
                case "MSG":
                    icon = "sap-icon://email";
                    break;
                case "EML":
                    icon = "sap-icon://email";
                    break;    
                case "ZIP":
                    icon = "sap-icon://attachment-zip-file";
                    break;        
                case "RAR":
                    icon = "sap-icon://attachment-zip-file";
                    break;            
                default:
                    icon = "sap-icon://document";
                    break;
            }
            return icon;
        },
       /* Downloading the file. */
        /**
         * @date 2022-11-29
         * @param {any} oEvent
         * @returns {any}
         */
        handleSelectionAttach: function(oEvent){
            sap.ui.core.BusyIndicator.show();
            var dataRow =oEvent.getSource().getSelectedItem().getBindingContext("ListAttachModel").getObject();
            var dtValue = new Date();
            //var fileName = "Document_" + String(dtValue.getDate()) + String(dtValue.getMonth()+1) + String(dtValue.getFullYear()) + String(dtValue.getHours()) + String(dtValue.getMinutes());
            var fileName = dataRow.Name;
            debugger
            //this.onViewerPDF(dataRow.File,fileName)
            this.downloadFile(dataRow.File, fileName, dataRow.ObjType)
            sap.ui.core.BusyIndicator.hide();
        },
        /* Creating a new window and writing the pdf to it. */
        /**
         * @date 2022-11-29
         * @param {any} pdf
         * @param {any} namePdf
         * @returns {any}
         */
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
        
        /* Creating a new element, setting the href attribute to the data, setting the download
        attribute to the name of the file, and then appending the element to the body of the
        document. */
        /**
         * @param {any} data
         * @param {any} nombre
         * @param {any} type
         * @returns {any}
         */
        downloadFile: function (data, nombre, type) {
		
			var element = document.createElement('a');
            var objectType = this.getMimeType(type)
            switch (type) {
                case "MSG":
                    nombre += "." + type.toLowerCase(); 
                    break;
                case "EML":
                    nombre += "." + type.toLowerCase(); 
                    break;
                case "ZIP":
                    nombre += "." + type.toLowerCase(); 
                    break;
                case "RAR":
                    nombre += "." + type.toLowerCase(); 
                    break;        
                default:
                    break;
            };
			element.setAttribute('href', 'data:'+ objectType +';base64,' + data);
			element.setAttribute('download', (nombre ? nombre : "Documento"));
			element.style.display = 'none';
			document.body.appendChild(element);
			element.click();
			document.body.removeChild(element)
		},
       /* Getting the mime type of the file. */
        /**
         * @date 2022-11-29
         * @param {any} type
         * @returns {any}
         */
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
                case "MSG":
                    objType = "application/vnd.ms-outlook";
                    break;          
                case "EML":
                    objType = "application/octet-stream";
                    break;                 
                case "ZIP":
                    objType = "application/zip";
                    break;                       
                case "RAR":
                    objType = "application/rar";
                    break;    
                default:
                    objType = "application/pdf";
                    break;

                    
            }
            return objType    
        },
       /* The above code is creating a dialog box with two buttons. */
        /**
         * @date 2022-11-29
         * @param {any} option
         * @returns {any}
         */
        onPressAction: function(option){
            var ModelOrder  =  sap.ui.getCore().getModel("OderDetail");
            if(!ModelOrder){
                MessageToast.show("Seleccione  una solicitud de pedido");
                return;
            }
            var title=option=== 1? "Aprobar Solicitud": "Rechazar Solicitud"
            if(this.oSubmitDialog){
                this.oSubmitDialog.destroy(); 
                this.oSubmitDialog = undefined; 
            } 
            Core.byId("submissionNoteSolPed")? Core.byId("submissionNoteSolPed").setValue(""): "";
            if (!this.oSubmitDialog) {
				this.oSubmitDialog = new Dialog({
					type: DialogType.Message,
					title: title,
					content: [
						new Label({
							text: "¿Desea "+ title+"?",
							labelFor: "submissionNoteSolPed"
						}),
						new sap.m.TextArea("submissionNoteSolPed", {
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
							var sText = Core.byId("submissionNoteSolPed").getValue() !== ""? Core.byId("submissionNoteSolPed").getValue(): ".";
                            this.onSendDialogApprobe(option, sText)
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
        /* The above code is sending a request to the backend to approve or reject a request. */
        /**
         * @date 2022-11-29
         * @param {any} option
         * @param {any} message
         * @returns {any}
         */
        onSendDialogApprobe: function(option, message){
            
            var that = this;
            var title = option === 1? "Solicitud Aprobada": "Solicitud Rechazada"
            sap.ui.core.BusyIndicator.show();
            var orderdata = this.getView().getModel("objectView").getData();
            var WiId = orderdata.WiId;
            var genericModel = this.getGenericModel();
            var user = this.UserID ==="DEFAULT_USER" || this.UserID ==="" ? "EXT_OMAR" :  this.UserID ;
            var entidad = "/ApprovalSet(WiId='"+WiId+"',Uname='"+ user +"',Approved="+option+",Rmessage='"+message.trim().replace(/ /g,"%20")+"')";  
            genericModel.read(entidad, {
                success: function(oData, response) {
                    sap.ui.core.BusyIndicator.hide();
                    var data = response.data  
                    if(data.Type === "S"){
                        var mensage =  data.Message !== "" ? data.Message : "Operación realizada con exito";
                        MessageBox.success(mensage, {
                            icon: MessageBox.Icon.SUCCESS,
                            title: title,
                            onClose: function(){
                                var ordermodel =  sap.ui.getCore().getModel("OderDetail");
                                ordermodel.setData({modelData:{}});
                                ordermodel.updateBindings(true);
                                var modeldetail = that.getView().getModel("ListdetailModel");
                                modeldetail.setData({modelData:{}});
                                modeldetail.updateBindings(true);
                                that.onCloseDetailPress();
                                that.getRouter().navTo("worklist")
                            }
                        });
                    }else{
                        var mensage =  data.Message !== "" ? data.Message : "Error al realizar la operación";
                        MessageBox.error(mensage, {
                            icon: MessageBox.Icon.ERROR,
                            title: title,
                            onClose: function(){
                                var ordermodel =sap.ui.getCore().getModel("OderDetail");
                                ordermodel.setData({modelData:{}});
                                ordermodel.updateBindings(true);
                                var modeldetail = that.getView().getModel("ListdetailModel");
                                modeldetail.setData({modelData:{}});
                                modeldetail.updateBindings(true);
                                that.onCloseDetailPress();
                                that.getRouter().navTo("worklist")
                            }
                        });
                    }   
                },
                error: function(oData, response) {
                    sap.ui.core.BusyIndicator.hide();
                    MessageBox.error("Error al ejecutar la operación");
                }
            });
        },
        /* The above code is a function that is called when a user selects a row in the table. The
        function gets the data from the row that was selected and then sets the data to a model
        called ItemDetail. The function then navigates to the itemDetail view. */
        /**
         * @date 2022-11-29
         * @param {any} oEvent
         * @returns {any}
         */
        handleSelectionChange: function(oEvent){
            var dataRow = oEvent.getParameters().listItem.getBindingContext("ListdetailModel").getObject();
            var auxModel = new sap.ui.model.json.JSONModel(dataRow);
            sap.ui.getCore().setModel(auxModel, "ItemDetail");
            this.getRouter().navTo("itemDetail",{objectId:dataRow.Banfn,itemId:dataRow.Bnfpo},true)
        }

    });

});
