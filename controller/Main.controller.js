sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("ferias1000.controller.Main", {
        onInit: function () {
            // Inicializa o modelo com dados vazios para evitar erros
            var oData = {
                documentos: [],
                reservas: [],
                passagens: []
            };
            this.getView().setModel(new JSONModel(oData), "view");
        },

        onAfterRendering: function () {
            // Garante que o mapa seja carregado apenas se o container existir
            if (!this._oMap && document.getElementById("map")) {
                this._oMap = L.map("map").setView([-14.2350, -51.9253], 4);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this._oMap);
            }
        },

        // Função de voz simples e segura
        onFalarDestino: function () {
            var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                var recognition = new SpeechRecognition();
                recognition.lang = 'pt-BR';
                recognition.onresult = function(event) {
                    var cidade = event.results[0][0].transcript;
                    MessageToast.show("Você disse: " + cidade);
                };
                recognition.start();
            } else {
                MessageToast.show("Seu navegador não suporta comando de voz.");
            }
        }
    });
});
