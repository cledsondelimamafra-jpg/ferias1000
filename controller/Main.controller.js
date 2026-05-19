sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("ferias1000.controller.Main", {

        onInit: function () {
            // Inicializa lendo do LocalStorage
            var aDocsSalvos = JSON.parse(localStorage.getItem("ferias1000_documentos") || "[]");
            
            var oModel = new JSONModel({
                documentos: aDocsSalvos,
                novoDoc: { tipo: "", data: "", arquivo: "" } // Campos para o formulário
            });
            this.getView().setModel(oModel, "view");
        },

        onSalvarDocumentos: function () {
            var oModel = this.getView().getModel("view");
            var oNovoDoc = oModel.getProperty("/novoDoc");
            var aDocs = oModel.getProperty("/documentos");

            // Validação simples
            if (!oNovoDoc.tipo) {
                MessageToast.show("Por favor, preencha o tipo de documento.");
                return;
            }

            // Adiciona ao array e salva
            aDocs.push({ ...oNovoDoc });
            localStorage.setItem("ferias1000_documentos", JSON.stringify(aDocs));
            
            // Atualiza o modelo na tela
            oModel.setProperty("/documentos", aDocs);
            oModel.setProperty("/novoDoc", { tipo: "", data: "", arquivo: "" }); // Limpa campos
            
            MessageToast.show("Documento salvo!");
        }
    });
});
