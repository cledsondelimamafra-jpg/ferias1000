sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel"
], function (UIComponent, JSONModel) {
    "use strict";

    return UIComponent.extend("ferias1000.Component", {
        metadata: {
            interfaces: ["sap.ui.core.IAsyncContentCreation"],
            manifest: "json"
        },

        init: function () {
            UIComponent.prototype.init.apply(this, arguments);

            // Tenta recuperar registros anteriores salvos no LocalStorage antes de gerar a estrutura limpa
            var sDocumentosSalvos = localStorage.getItem("ferias1000_documentos");
            var sReservasSalvas = localStorage.getItem("ferias1000_reservas");
            var sPassagensSalvas = localStorage.getItem("ferias1000_passagens");

            var oData = {
                local: { cidade: "Aguardando..." },
                clima: { temp: "--" },
                lugares: [],
                // Se houver dados no dispositivo converte a String JSON, se não, inicia lista limpa
                documentos: sDocumentosSalvos ? JSON.parse(sDocumentosSalvos) : [],
                reservas: sReservasSalvas ? JSON.parse(sReservasSalvas) : [],
                passagens: sPassagensSalvas ? JSON.parse(sPassagensSalvas) : []
            };

            var oModel = new JSONModel(oData);
            // Habilita TwoWay Binding agressivo para garantir atualização imediata em tempo de execução
            oModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
            this.setModel(oModel, "view");
        }
    });
});
