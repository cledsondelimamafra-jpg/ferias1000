sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("ferias1000.controller.Main", {
        // Inicialização básica que não quebra o carregamento
        onInit: function () {
            var oData = {
                documentos: [],
                reservas: [],
                passagens: []
            };
            this.getView().setModel(new JSONModel(oData), "view");
        },

        // Função de voz que não depende de outras lógicas complexas
        onFalarDestino: function () {
            var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                var recognition = new SpeechRecognition();
                recognition.lang = 'pt-BR';
                recognition.onresult = function(event) {
                    var cidade = event.results[0][0].transcript;
                    MessageToast.show("Destino: " + cidade);
                };
                recognition.start();
            } else {
                MessageToast.show("Navegador não suporta comando de voz.");
            }
        },

        // Inicialização do mapa após a renderização para evitar erro de container
        onAfterRendering: function () {
            if (!this._oMap && document.getElementById("map")) {
                this._oMap = L.map("map").setView([-14.2350, -51.9253], 4);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this._oMap);
            }
        }
    });
});
