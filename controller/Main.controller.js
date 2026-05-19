sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("ferias1000.controller.Main", {

        onInit: function () {
            // Inicializa o modelo com os dados do LocalStorage ou arrays vazios
            var oData = {
                documentos: JSON.parse(localStorage.getItem("ferias1000_documentos") || "[]"),
                reservas: JSON.parse(localStorage.getItem("ferias1000_reservas") || "[]"),
                passagens: JSON.parse(localStorage.getItem("ferias1000_passagens") || "[]"),
                local: { cidade: "Aguardando...", statusVoz: "Pronto" }
            };
            this.getView().setModel(new JSONModel(oData), "view");
        },

        onAfterRendering: function () {
            // Garante a inicialização segura do mapa
            if (!this._oMap && document.getElementById("map")) {
                this._oMap = L.map("map").setView([-14.2350, -51.9253], 4);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this._oMap);
            }
        },

        // --- FUNCIONALIDADE DE VOZ ---
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

        // --- MÉTODOS DE SALVAMENTO (PERSISTÊNCIA) ---
        onSalvarDocumentos: function () { this._salvar("ferias1000_documentos", "/documentos", "Documentos salvos!"); },
        onSalvarReservas: function () { this._salvar("ferias1000_reservas", "/reservas", "Reservas salvas!"); },
        onSalvarPassagens: function () { this._salvar("ferias1000_passagens", "/passagens", "Passagens salvas!"); },

        _salvar: function (sKey, sPath, sMensagem) {
            var aData = this.getView().getModel("view").getProperty(sPath);
            localStorage.setItem(sKey, JSON.stringify(aData));
            MessageToast.show(sMensagem);
        },

        // --- MÉTODOS DE ADIÇÃO DE LINHAS NAS TABELAS ---
        onAdicionarDocumento: function () { this._adicionarLinha("/documentos", { tipo: "", data: "", arquivo: "" }); },
        onAdicionarReserva: function () { this._adicionarLinha("/reservas", { hotel: "", periodo: "" }); },
        onAdicionarPassagem: function () { this._adicionarLinha("/passagens", { voo: "", trecho: "" }); },

        _adicionarLinha: function (sPath, oTemplate) {
            var oModel = this.getView().getModel("view");
            var aItems = oModel.getProperty(sPath) || [];
            aItems.push(oTemplate);
            oModel.setProperty(sPath, aItems);
        }
    });
});
