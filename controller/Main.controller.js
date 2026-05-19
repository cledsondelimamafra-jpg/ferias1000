sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
    "use strict";

    return Controller.extend("ferias1000.controller.Main", {
        onInit: function () {
            var oModel = new JSONModel({
                documentos: JSON.parse(localStorage.getItem("ferias1000_documentos") || "[]")
            });
            this.getView().setModel(oModel, "view");
        },

        onAfterRendering: function () {
            this.initMap();
        },

        initMap: function () {
            if (!this._oMap) {
                var oMapDom = document.getElementById("map");
                if (oMapDom) {
                    this._oMap = L.map(oMapDom).setView([-14.2350, -51.9253], 4);
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this._oMap);
                }
            }
        },

        onSalvarDocumentos: function () {
            var aDocs = this.getView().getModel("view").getProperty("/documentos");
            localStorage.setItem("ferias1000_documentos", JSON.stringify(aDocs));
            sap.m.MessageToast.show("Documentos salvos!");
        },

        onAdicionarDocumento: function () {
            var aDocs = this.getView().getModel("view").getProperty("/documentos");
            aDocs.push({ tipo: "", status: "", arquivoBase64: "" });
            this.getView().getModel("view").setProperty("/documentos", aDocs);
        }
    });
});
