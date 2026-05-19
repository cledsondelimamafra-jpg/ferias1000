sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
    "use strict";

    return Controller.extend("ferias1000.controller.Main", {
        onInit: function () {
            console.log("Controller Iniciado! Tentando carregar modelo...");
            
            var oData = {
                novoDoc: { tipo: "Teste de Renderização" },
                documentos: [ {tipo: "RG"}, {tipo: "Passaporte"} ]
            };
            
            var oModel = new JSONModel(oData);
            
            // Forçamos o modelo no Core, não apenas na View
            this.getView().setModel(oModel, "view");
            
            console.log("Modelo 'view' atribuído com sucesso!");
        }
    });
});
