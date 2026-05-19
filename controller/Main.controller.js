sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("ferias1000.controller.Main", {

        onInit: function () {
            // Inicialização do modelo com dados vazios ou recuperados do LocalStorage
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

        // Função genérica de salvamento para qualquer aba
        _persistirDados: function (sKey, sPath, sMensagem) {
            var oModel = this.getView().getModel("view");
            oModel.updateBindings(true); // Garante que campos de input sejam lidos
            var aDados = oModel.getProperty(sPath) || [];
            localStorage.setItem(sKey, JSON.stringify(aDados));
            MessageToast.show(sMensagem);
        },

        onSalvarDocumentos: function () {
            this._persistirDados("ferias1000_documentos", "/documentos", "Documentos salvos!");
        },

        onSalvarReservas: function () {
            this._persistirDados("ferias1000_reservas", "/reservas", "Reservas salvas!");
        },

        onSalvarPassagens: function () {
            this._persistirDados("ferias1000_passagens", "/passagens", "Passagens salvas!");
        },

        // Funções para adicionar linhas nas tabelas
        onAdicionarDocumento: function () {
            var oModel = this.getView().getModel("view");
            var a = oModel.getProperty("/documentos");
            a.push({ tipo: "", status: "", arquivoNome: "", arquivoBase64: "" });
            oModel.setProperty("/documentos", a);
        },

        onAdicionarReserva: function () {
            var oModel = this.getView().getModel("view");
            var a = oModel.getProperty("/reservas");
            a.push({ hotel: "", periodo: "", arquivoNome: "", arquivoBase64: "" });
            oModel.setProperty("/reservas", a);
        },

        onAdicionarPassagem: function () {
            var oModel = this.getView().getModel("view");
            var a = oModel.getProperty("/passagens");
            a.push({ voo: "", info: "", arquivoNome: "", arquivoBase64: "" });
            oModel.setProperty("/passagens", a);
        },

        // Função de upload (mantida para você processar os arquivos)
        onUploadArquivo: function (oEvent) {
            var oFile = oEvent.getParameter("files")[0];
            var oContext = oEvent.getSource().getBindingContext("view");
            if (oFile) {
                var oReader = new FileReader();
                oReader.onload = function (e) {
                    oContext.getModel().setProperty(oContext.getPath() + "/arquivoBase64", e.target.result);
                    oContext.getModel().setProperty(oContext.getPath() + "/arquivoNome", oFile.name);
                    MessageToast.show("Arquivo anexado!");
                };
                oReader.readAsDataURL(oFile);
            }
        }
    });
});
