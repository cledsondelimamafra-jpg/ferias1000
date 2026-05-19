sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("ferias1000.controller.Main", {
        onInit: function () {
            var oData = {
                novoDoc: { tipo: "", data: "" },
                documentos: JSON.parse(localStorage.getItem("ferias1000_docs") || "[]")
            };
            this.getView().setModel(new JSONModel(oData), "view");
        },

        onSalvarDocs: function () {
            var oModel = this.getView().getModel("view");
            var oNovo = oModel.getProperty("/novoDoc");
            var aDocs = oModel.getProperty("/documentos");

            if (oNovo.tipo !== "") {
                aDocs.push({ ...oNovo }); // Adiciona o novo item
                localStorage.setItem("ferias1000_docs", JSON.stringify(aDocs)); // Salva
                oModel.setProperty("/documentos", aDocs); // Atualiza a tabela na tela
                oModel.setProperty("/novoDoc", { tipo: "", data: "" }); // Limpa o formulário
                MessageToast.show("Documento salvo!");
            } else {
                MessageToast.show("Preencha o campo de tipo.");
            }
        }
    });
});
