sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, JSONModel, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("ferias1000.controller.Main", {

        onInit: function () {
            const oData = {
                clima: { temp: "--", desc: "Selecione no mapa" },
                local: { cidade: "Aguardando clique...", pais: "" },
                lugares: [],
                documentos: this._carregarDocsLocalStorage(),
                docSelecionado: {}
            };
            this.getView().setModel(new JSONModel(oData), "view");
            this._tempFotoBase64 = "";
        },

        onSalvarDoc: function () {
            const oView = this.getView();
            const oModel = oView.getModel("view");
            const sTipo = this.byId("inputTipo").getValue();
            const oDatePicker = this.byId("inputValidade");
            const sValidadeRaw = oDatePicker.getDateValue();

            if (!sTipo || !sValidadeRaw || !this._tempFotoBase64) {
                MessageBox.error("Preencha o tipo, a validade e selecione uma foto.");
                return;
            }

            const oStatus = this._calcularStatus(sValidadeRaw);
            const oNovoDoc = {
                id: Date.now(),
                tipo: sTipo,
                validadeFormatada: sValidadeRaw.toLocaleDateString('pt-BR'),
                foto: this._tempFotoBase64,
                estado: oStatus.estado,
                estadoColor: oStatus.color
            };

            const aDocs = oModel.getProperty("/documentos");
            const aDocsAtualizado = [...aDocs, oNovoDoc];

            oModel.setProperty("/documentos", aDocsAtualizado);
            localStorage.setItem("ferias1000_docs", JSON.stringify(aDocsAtualizado));

            this._limparCamposDoc();
            MessageToast.show("Documento arquivado!");
        },

        _calcularStatus: function (dValidade) {
            const hoje = new Date();
            const diff = Math.ceil((dValidade - hoje) / (1000 * 60 * 60 * 24));
            if (diff < 0) return { estado: "Error", color: "#e30000" };
            if (diff <= 90) return { estado: "Warning", color: "#ff8c00" };
            return { estado: "Success", color: "#2b7d2b" };
        },

        _carregarDocsLocalStorage: function () {
            const sData = localStorage.getItem("ferias1000_docs");
            return sData ? JSON.parse(sData) : [];
        },

        _limparCamposDoc: function () {
            this.byId("inputTipo").setValue("");
            this.byId("inputValidade").setValue("");
            if (this.byId("fileUploader")) this.byId("fileUploader").clear();
            this._tempFotoBase64 = "";
        },

        onFileUpload: function (oEvent) {
            const file = oEvent.getParameter("files")[0];
            const reader = new FileReader();
            reader.onload = (e) => { this._tempFotoBase64 = e.target.result; };
            reader.readAsDataURL(file);
        },

        onDeletarDoc: function (oEvent) {
            const oItem = oEvent.getSource().getBindingContext("view").getObject();
            let aDocs = this.getView().getModel("view").getProperty("/documentos");
            aDocs = aDocs.filter(d => d.id !== oItem.id);
            this.getView().getModel("view").setProperty("/documentos", aDocs);
            localStorage.setItem("ferias1000_docs", JSON.stringify(aDocs));
        }
    });
});
