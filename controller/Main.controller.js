sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("ferias1000.controller.Main", {
        onInit: function () {
            // Modelo de dados inicializado
            var oData = {
                documentos: JSON.parse(localStorage.getItem("ferias1000_documentos") || "[]"),
                reservas: JSON.parse(localStorage.getItem("ferias1000_reservas") || "[]"),
                passagens: JSON.parse(localStorage.getItem("ferias1000_passagens") || "[]"),
                local: { cidade: "Aguardando...", statusVoz: "Pronto" },
                clima: { temp: "--" }
            };
            this.getView().setModel(new JSONModel(oData), "view");
        },

        onAfterRendering: function () {
            // Inicia o mapa apenas após a renderização da tela
            if (!this._oMap) {
                var oMapDom = document.getElementById("map");
                if (oMapDom) {
                    this._oMap = L.map(oMapDom).setView([-14.2350, -51.9253], 4);
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this._oMap);
                }
            }
        },

        onFalarDestino: function () {
            var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                var oRecognition = new SpeechRecognition();
                oRecognition.lang = 'pt-BR';
                oRecognition.onresult = function (event) {
                    var sCidade = event.results[0][0].transcript;
                    this.getView().getModel("view").setProperty("/local/cidade", sCidade);
                    MessageToast.show("Destino: " + sCidade);
                }.bind(this);
                oRecognition.start();
            } else {
                MessageToast.show("Navegador não suporta voz.");
            }
        },

        // Métodos de Persistência (Salvar)
        onSalvarDocumentos: function () { this._persistir("ferias1000_documentos", "/documentos", "Documentos salvos!"); },
        onSalvarReservas: function () { this._persistir("ferias1000_reservas", "/reservas", "Reservas salvas!"); },
        onSalvarPassagens: function () { this._persistir("ferias1000_passagens", "/passagens", "Passagens salvas!"); },

        _persistir: function (sKey, sPath, sMsg) {
            var aData = this.getView().getModel("view").getProperty(sPath);
            localStorage.setItem(sKey, JSON.stringify(aData));
            MessageToast.show(sMsg);
        },

        // Métodos de Adição de Linhas
        onAdicionarDocumento: function () { this._adicionarLinha("/documentos", { tipo: "", status: "" }); },
        onAdicionarReserva: function () { this._adicionarLinha("/reservas", { hotel: "", periodo: "" }); },
        onAdicionarPassagem: function () { this._adicionarLinha("/passagens", { voo: "", info: "" }); },

        _adicionarLinha: function (sPath, oTemplate) {
            var aData = this.getView().getModel("view").getProperty(sPath);
            aData.push(oTemplate);
            this.getView().getModel("view").setProperty(sPath, aData);
        }
    });
});
