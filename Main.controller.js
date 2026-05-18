sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("ferias1000.Main", {
        onInit: function () {
            var oModel = new JSONModel({
                local: { cidade: "Aguardando destino...", coordenadas: "--, --" },
                clima: { temp: "--" },
                lugares: [],
                documentos: [],
                reservas: [],
                passagens: []
            });
            this.getView().setModel(oModel, "view");
        }
    });
});
