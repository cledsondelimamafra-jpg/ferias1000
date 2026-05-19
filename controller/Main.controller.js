sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("ferias1000.controller.Main", {
        
        onInit: function () {
            // 1. Criamos os dados iniciais
            var oData = {
                novoDoc: { 
                    tipo: "" 
                },
                documentos: JSON.parse(localStorage.getItem("docs_salvos") || "[]")
            };

            // 2. Criamos o modelo
            var oModel = new JSONModel(oData);

            // 3. Atribuímos o modelo à View com o nome "view"
            // Isso é o que permite o "{view>/...}" no XML funcionar
            this.getView().setModel(oModel, "view");
        },

        onSalvarDocs: function () {
            var oModel = this.getView().getModel("view");
            var oNovo = oModel.getProperty("/novoDoc");
            var aDocs = oModel.getProperty("/documentos");

            if (oNovo.tipo && oNovo.tipo.trim() !== "") {
                // Adiciona o item à lista local
                aDocs.push({ tipo: oNovo.tipo });
                
                // Salva no navegador
                localStorage.setItem("docs_salvos", JSON.stringify(aDocs));
                
                // Atualiza o modelo na tela
                oModel.setProperty("/documentos", aDocs);
                oModel.setProperty("/novoDoc/tipo", "");
                
                MessageToast.show("Documento salvo!");
            } else {
                MessageToast.show("Digite um nome para o documento.");
            }
        }
    });
});
