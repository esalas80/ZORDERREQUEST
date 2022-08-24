sap.ui.define([], function () {
    "use strict";

    return {
        currencyValue:function(e){
            if(!e){return""}
            return parseFloat(e).toFixed(2)
        },
        calculateItemTotal:function(r,t,n){
            var u=new e({showMeasure:false});
            var i=r*t;
            return u.formatValue([i.toFixed(2),n],"string")
        },
        handleBinaryContent:function(e){
            if(e){
                var r="data:image/jpeg;base64,";
                var t=e.substr(104);
                return r+t
            }else{
                return"../images/Employee.png"
            }
        },
        deliveryText:function(e,r){
            var t=this.getModel("i18n").getResourceBundle();
            if(r===null){return"None"}
            if(e-r>0&&e-r<=432e6){
                return t.getText("formatterDeliveryUrgent")
            }else if(e<r){
                return t.getText("formatterDeliveryTooLate")
            }else{
                return t.getText("formatterDeliveryInTime")
            }
        },
        deliveryState:function(e,r){
            if(r===null){return"None"}
            if(e-r>0&&e-r<=432e6){
                return"Warning"
            }else if(e<r){
                return"Error"
            }else{
                return"Success"
            }
        },
        /**
         * Rounds the number unit value to 2 digits
         * @public
         * @param {string} sValue the number string to be rounded
         * @returns {string} sValue with 2 digits rounded
         */
        numberUnit : function (sValue) {
            if (!sValue) {
                return "";
            }
            return parseFloat(sValue).toFixed(2);
        }

    };

});