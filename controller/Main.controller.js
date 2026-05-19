sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("ferias1000.controller.Main", {
        
        // --- INICIALIZAÇÃO ---
        onInit: function () {
            var oData = {
                documentos: JSON.parse(localStorage.getItem("ferias1000_documentos") || "[]"),
                reservas: JSON.parse(localStorage.getItem("ferias1000_reservas") || "[]"),
                passagens: JSON.parse(localStorage.getItem("ferias1000_passagens") || "[]"),
                local: { cidade: "Aguardando...", statusVoz: "Pronto" }
            };
            var oModel = new JSONModel(oData);
            this.getView().setModel(oModel, "view");
        },

        // --- FUNÇÕES DE MAPA E VOZ (MODULAR) ---
        onAfterRendering: function () {
            this._initMap();
        },

        _initMap: function () {
            if (!this._oMap && document.getElementById("map")) {
                this._oMap = L.map("map").setView([-14.2350, -51.9253], 4);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this._oMap);
            }
        },

        onFalarDestino: function () {
            var oRec = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            oRec.lang = 'pt-BR';
            oRec.onresult = function(e) {
                var s = e.results[0][0].transcript;
                this.getView().getModel("view").setProperty("/local/cidade", s);
                MessageToast.show("Destino: " + s);
            }.bind(this);
            oRec.start();
        },

        // --- FUNÇÕES DE ABA (ISOLADAS) ---
        onSalvarDocumentos: function () { this._salvar("ferias1000_documentos", "/documentos"); },
        onSalvarReservas: function () { this._salvar("ferias1000_reservas", "/reservas"); },
        onSalvarPassagens: function () { this._salvar("ferias1000_passagens", "/passagens"); },

        _salvar: function (key, path) {
            var data = this.getView().getModel("view").getProperty(path);
            localStorage.setItem(key, JSON.stringify(data));
            MessageToast.show("Salvo em: " + key.split("_")[1]);
        }
    });
});
