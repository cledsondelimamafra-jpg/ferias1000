sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast" // Adicionado para exibir mensagens na tela
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("ferias1000.controller.Main", {
        
        onInit: function () {
            // Inicializamos o modelo com as três tabelas que você precisa
            var oData = {
                documentos: JSON.parse(localStorage.getItem("ferias1000_documentos") || "[]"),
                reservas: JSON.parse(localStorage.getItem("ferias1000_reservas") || "[]"),
                passagens: JSON.parse(localStorage.getItem("ferias1000_passagens") || "[]"),
                local: { cidade: "Aguardando..." }
            };
            this.getView().setModel(new JSONModel(oData), "view");
        },

        onAfterRendering: function () {
            // Mapa
            if (!this._oMap && document.getElementById("map")) {
                this._oMap = L.map("map").setView([-14.2350, -51.9253], 4);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this._oMap);
            }
        },

        // Função do Microfone (Voz)
        onFalarDestino: function () {
            var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                var recognition = new SpeechRecognition();
                recognition.lang = 'pt-BR';
                recognition.onresult = function(event) {
                    var sCidade = event.results[0][0].transcript;
                    this.getView().getModel("view").setProperty("/local/cidade", sCidade);
                    MessageToast.show("Destino: " + sCidade);
                }.bind(this);
                recognition.start();
            } else {
                MessageToast.show("Seu navegador não suporta voz.");
            }
        },

        // Função genérica de salvamento (evita duplicação de código)
        onSalvar: function (sKey, sPath, sMsg) {
            var aData = this.getView().getModel("view").getProperty(sPath);
            localStorage.setItem(sKey, JSON.stringify(aData));
            MessageToast.show(sMsg);
        },

        // Atalhos para os botões das abas
        onSalvarDocumentos: function () { this.onSalvar("ferias1000_documentos", "/documentos", "Documentos salvos!"); },
        onSalvarReservas: function () { this.onSalvar("ferias1000_reservas", "/reservas", "Reservas salvas!"); },
        onSalvarPassagens: function () { this.onSalvar("ferias1000_passagens", "/passagens", "Passagens salvas!"); }
    });
});
