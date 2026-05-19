sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("ferias1000.controller.Main", {
        onInit: function () {
            // Inicializa com dados ou vazio
            var oData = {
                novoDoc: { tipo: "" },
                documentos: JSON.parse(localStorage.getItem("docs_salvos") || "[]")
            };
            var oModel = new JSONModel(oData);
            this.getView().setModel(oModel, "view");
        },

        onSalvarDocs: function () {
            var oModel = this.getView().getModel("view");
            var oNovo = oModel.getProperty("/novoDoc");
            var aDocs = oModel.getProperty("/documentos");

            if (oNovo.tipo && oNovo.tipo.trim() !== "") {
                aDocs.push({ tipo: oNovo.tipo });
                localStorage.setItem("docs_salvos", JSON.stringify(aDocs));
                oModel.setProperty("/documentos", aDocs);
                oModel.setProperty("/novoDoc/tipo", "");
                MessageToast.show("Documento salvo!");
            }
        }
    });
});
