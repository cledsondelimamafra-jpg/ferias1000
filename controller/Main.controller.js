sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], function (Controller, MessageToast) {
    "use strict";
    return Controller.extend("ferias1000.controller.Main", {
        onInit: function () {
            var oModel = new sap.ui.model.json.JSONModel({
                documentos: JSON.parse(localStorage.getItem("ferias1000_docs")) || [],
                reservas: []
            });
            this.getView().setModel(oModel, "view");
        },

        onSalvarDoc: function () {
            var oView = this.getView();
            var oModel = oView.getModel("view");
            var sTipo = oView.byId("inputTipoDoc").getValue();
            var sData = oView.byId("inputValidadeDoc").getValue();

            if (!sTipo || !sData) {
                MessageToast.show("Preencha os campos!");
                return;
            }

            var aDocs = oModel.getProperty("/documentos");
            aDocs.push({ tipo: sTipo, validadeFormatada: sData });
            
            oModel.setProperty("/documentos", aDocs);
            localStorage.setItem("ferias1000_docs", JSON.stringify(aDocs));
            
            oView.byId("inputTipoDoc").setValue("");
            MessageToast.show("Salvo!");
        }
    });
});
