sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("ferias1000.controller.Main", {

        onInit: function () {
            // Inicializa o modelo com os dados do LocalStorage
            var oData = {
                documentos: JSON.parse(localStorage.getItem("ferias1000_documentos") || "[]"),
                reservas: JSON.parse(localStorage.getItem("ferias1000_reservas") || "[]"),
                passagens: JSON.parse(localStorage.getItem("ferias1000_passagens") || "[]"),
                novoDoc: { tipo: "", data: "", arquivo: "" },
                local: { cidade: "Aguardando...", statusVoz: "Pronto" }
            };
            this.getView().setModel(new JSONModel(oData), "view");
        },

        onAfterRendering: function () {
            // Inicialização segura do mapa
            if (!this._oMap && document.getElementById("map")) {
                this._oMap = L.map("map").setView([-14.2350, -51.9253], 4);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this._oMap);
            }
        },

        // --- VOZ ---
        onFalarDestino: function () {
            var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                var oRec = new SpeechRecognition();
                oRec.lang = 'pt-BR';
                oRec.onresult = function(event) {
                    var sCidade = event.results[0][0].transcript;
                    this.getView().getModel("view").setProperty("/local/cidade", sCidade);
                    MessageToast.show("Destino: " + sCidade);
                }.bind(this);
                oRec.start();
            } else {
                MessageToast.show("Navegador não suporta comando de voz.");
            }
        },

        // --- PERSISTÊNCIA (SALVAR) ---
        onSalvarDocumentos: function () {
            var oModel = this.getView().getModel("view");
            var aDocs = oModel.getProperty("/documentos");
            var oNovo = oModel.getProperty("/novoDoc");

            if (oNovo.tipo) {
                aDocs.push({ ...oNovo });
                localStorage.setItem("ferias1000_documentos", JSON.stringify(aDocs));
                oModel.setProperty("/documentos", aDocs);
                oModel.setProperty("/novoDoc", { tipo: "", data: "", arquivo: "" });
                MessageToast.show("Documento salvo!");
            } else {
                MessageToast.show("Preencha o tipo de documento.");
            }
        },

        // Métodos de exclusão/limpeza
        onLimparDocumentos: function () {
            localStorage.removeItem("ferias1000_documentos");
            this.getView().getModel("view").setProperty("/documentos", []);
            MessageToast.show("Dados limpos!");
        }
    });
});
