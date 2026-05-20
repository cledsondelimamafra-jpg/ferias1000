sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("ferias1000.controller.Main", {
        onInit: function () {
            // Tenta carregar os dados salvos
            var sSavedData = localStorage.getItem("docs_salvos");
            var aDocs = sSavedData ? JSON.parse(sSavedData) : [];
            
            var oData = {
                novoDoc: { tipo: "" },
                documentos: aDocs
            };
            
            // Cria o modelo e define na view
            var oModel = new JSONModel(oData);
            this.getView().setModel(oModel, "view");
        },

        onSalvarDocs: function () {
            var oModel = this.getView().getModel("view");
            var oNovo = oModel.getProperty("/novoDoc");
            var aDocs = oModel.getProperty("/documentos") || [];

            if (oNovo.tipo && oNovo.tipo.trim() !== "") {
                aDocs.push({ tipo: oNovo.tipo });
                
                // Salva no localStorage e atualiza o modelo
                localStorage.setItem("docs_salvos", JSON.stringify(aDocs));
                oModel.setProperty("/documentos", aDocs);
                oModel.setProperty("/novoDoc/tipo", "");
                
                MessageToast.show("Documento salvo com sucesso!");
            } else {
                MessageToast.show("O campo de documento não pode estar vazio.");
            }
        }
    });
});
