sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("ferias1000.controller.Main", {
        onInit: function () {
            // Recupera dados salvos ou cria lista vazia
            var aDocs = JSON.parse(localStorage.getItem("docs_salvos") || "[]");
            
            var oData = {
                novoDoc: { tipo: "" },
                documentos: aDocs
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
                
                // Atualiza o modelo na tela
                oModel.setProperty("/documentos", aDocs);
                oModel.setProperty("/novoDoc/tipo", "");
                
                MessageToast.show("Documento salvo!");
            } else {
                MessageToast.show("Por favor, digite um nome.");
            }
        }
    });
});
