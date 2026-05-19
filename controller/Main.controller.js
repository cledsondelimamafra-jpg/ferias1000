sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("ferias1000.controller.Main", {

        onInit: function () {
            // 1. Carrega os dados salvos ou inicializa como array vazio
            var oData = {
                documentos: JSON.parse(localStorage.getItem("ferias1000_documentos") || "[]"),
                reservas: JSON.parse(localStorage.getItem("ferias1000_reservas") || "[]"),
                passagens: JSON.parse(localStorage.getItem("ferias1000_passagens") || "[]"),
                // Manter aqui seus outros dados de mapa/clima
                local: { cidade: "Belo Horizonte" } 
            };
            
            var oModel = new JSONModel(oData);
            this.getView().setModel(oModel, "view");
        },

        // --- MÉTODOS DE ADIÇÃO (Linhas nas Tabelas) ---
        onAdicionarDocumento: function () {
            this._adicionarItem("/documentos", { tipo: "", status: "" });
        },
        onAdicionarReserva: function () {
            this._adicionarItem("/reservas", { hotel: "", periodo: "" });
        },
        onAdicionarPassagem: function () {
            this._adicionarItem("/passagens", { voo: "", info: "" });
        },

        // --- MÉTODOS DE SALVAMENTO (LocalStorage) ---
        onSalvarDocumentos: function () {
            this._salvarNoLocal("ferias1000_documentos", "/documentos", "Documentos salvos!");
        },
        onSalvarReservas: function () {
            this._salvarNoLocal("ferias1000_reservas", "/reservas", "Reservas salvas!");
        },
        onSalvarPassagens: function () {
            this._salvarNoLocal("ferias1000_passagens", "/passagens", "Passagens salvas!");
        },

        // --- FUNÇÕES AUXILIARES (O "Cérebro" de tudo) ---
        _adicionarItem: function (sPath, oTemplate) {
            var oModel = this.getView().getModel("view");
            var aItems = oModel.getProperty(sPath) || [];
            aItems.push(oTemplate);
            oModel.setProperty(sPath, aItems);
        },

        _salvarNoLocal: function (sKey, sPath, sMensagem) {
            var oModel = this.getView().getModel("view");
            var aData = oModel.getProperty(sPath);
            localStorage.setItem(sKey, JSON.stringify(aData));
            MessageToast.show(sMensagem);
        }
    });
});
