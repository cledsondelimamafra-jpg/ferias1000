sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("ferias1000.controller.Main", {
        onInit: function () {
            var oData = {
                documentos: JSON.parse(localStorage.getItem("ferias1000_documentos") || "[]"),
                local: { cidade: "Aguardando...", statusVoz: "Aguardando..." }
            };
            this.getView().setModel(new JSONModel(oData), "view");

            // Reconhecimento de Voz
            var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                this._oRecognition = new SpeechRecognition();
                this._oRecognition.lang = 'pt-BR';
                this._oRecognition.onresult = function(event) {
                    var sCidade = event.results[0][0].transcript;
                    this.getView().getModel("view").setProperty("/local/cidade", sCidade);
                    this.getView().getModel("view").setProperty("/local/statusVoz", "Cidade: " + sCidade);
                    // Aqui entra a lógica do mapa que você já tinha
                }.bind(this);
            }
        },

        onFalarDestino: function() {
            if (this._oRecognition) {
                this._oRecognition.start();
                this.getView().getModel("view").setProperty("/local/statusVoz", "Ouvindo...");
            }
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
            MessageToast.show("Documentos salvos!");
        },

        onAdicionarDocumento: function () {
            var aDocs = this.getView().getModel("view").getProperty("/documentos");
            aDocs.push({ tipo: "", status: "", arquivoBase64: "" });
            this.getView().getModel("view").setProperty("/documentos", aDocs);
        }
    });
});
