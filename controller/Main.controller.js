sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("ferias1000.controller.Main", {
        onInit: function () {
            // Inicializa o modelo básico da aplicação
            var oModel = new JSONModel({
                local: {
                    cidade: "Aguardando comando...",
                    coordenadas: "- / -"
                },
                clima: {
                    temp: "-- °C"
                },
                lugares: []
            });
            this.getView().setModel(oModel, "view");
        },

        onIniciarComandoVoz: function () {
            MessageToast.show("Microfone ativado! Fale o seu destino.");
            // O código de reconhecimento de voz entrará aqui
        }
    });
});
