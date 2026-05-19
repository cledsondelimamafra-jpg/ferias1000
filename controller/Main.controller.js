sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("ferias1000.controller.Main", {

        onInit: function () {
            // Inicialização com dados locais
            var oData = {
                documentos: JSON.parse(localStorage.getItem("ferias1000_documentos") || "[]"),
                reservas: JSON.parse(localStorage.getItem("ferias1000_reservas") || "[]"),
                passagens: JSON.parse(localStorage.getItem("ferias1000_passagens") || "[]"),
                local: { cidade: "Aguardando...", statusVoz: "Pronto" },
                clima: { temp: "--" },
                lugares: []
            };
            var oModel = new JSONModel(oData);
            this.getView().setModel(oModel, "view");
        },

        onAfterRendering: function () {
            // Garante que o mapa inicie após a renderização
            if (!this._oMap) {
                this.initMap();
            }
        },

        initMap: function () {
            var oMapDom = this.getView().byId("map") ? this.getView().byId("map").getDomRef() : document.getElementById("map");
            if (oMapDom && !this._oMap) {
                this._oMap = L.map(oMapDom).setView([-14.2350, -51.9253], 4);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap'
                }).addTo(this._oMap);
            }
        },

        // Função de salvamento unificada
        _salvarDados: function (sKey, sPath, sMensagem) {
            var oModel = this.getView().getModel("view");
            oModel.updateBindings(true);
            var aDados = oModel.getProperty(sPath) || [];
            localStorage.setItem(sKey, JSON.stringify(aDados));
            MessageToast.show(sMensagem);
        },

        onSalvarDocumentos: function () { this._salvarDados("ferias1000_documentos", "/documentos", "Documentos salvos!"); },
        onSalvarReservas: function () { this._salvarDados("ferias1000_reservas", "/reservas", "Reservas salvas!"); },
        onSalvarPassagens: function () { this._salvarDados("ferias1000_passagens", "/passagens", "Passagens salvas!"); },

        onAdicionarDocumento: function () {
            var a = this.getView().getModel("view").getProperty("/documentos");
            a.push({ tipo: "", status: "", arquivoBase64: "" });
            this.getView().getModel("view").setProperty("/documentos", a);
        },
        onAdicionarReserva: function () {
            var a = this.getView().getModel("view").getProperty("/reservas");
            a.push({ hotel: "", periodo: "", arquivoBase64: "" });
            this.getView().getModel("view").setProperty("/reservas", a);
        },
        onAdicionarPassagem: function () {
            var a = this.getView().getModel("view").getProperty("/passagens");
            a.push({ voo: "", info: "", arquivoBase64: "" });
            this.getView().getModel("view").setProperty("/passagens", a);
        }
    });
});
