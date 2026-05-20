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
        },

        onSalvarDoc: function () {
            const oView = this.getView();
            const oModel = oView.getModel("view");
            const sTipo = this.byId("inputTipo").getValue();
            const oDatePicker = this.byId("inputValidade");
            const sValidadeRaw = oDatePicker.getDateValue();

            if (!sTipo || !sValidadeRaw || !this._tempFotoBase64) {
                MessageBox.error("Verifique se preencheu o tipo, data e escolheu uma foto.");
                return;
            }

            const oNovoDoc = {
                id: Date.now(),
                tipo: sTipo,
                validadeFormatada: sValidadeRaw.toLocaleDateString('pt-BR'),
                foto: this._tempFotoBase64,
                estado: "Success"
            };

            const aDocs = oModel.getProperty("/documentos") || [];
            const aDocsAtualizado = [...aDocs, oNovoDoc];

            oModel.setProperty("/documentos", aDocsAtualizado);
            localStorage.setItem("ferias1000_docs", JSON.stringify(aDocsAtualizado));

            this.byId("inputTipo").setValue("");
            this.byId("inputValidade").setValue("");
            this.byId("fileUploader").clear();
            this._tempFotoBase64 = "";

            MessageToast.show("Salvo com sucesso!");
        },

        onFileUpload: function (oEvent) {
            const file = oEvent.getParameter("files")[0];
            const reader = new FileReader();
            reader.onload = (e) => { this._tempFotoBase64 = e.target.result; };
            reader.readAsDataURL(file);
        },

        onVerDocumento: function (oEvent) {
            const oDoc = oEvent.getSource().getBindingContext("view").getObject();
            this.getView().getModel("view").setProperty("/docSelecionado", oDoc);

            if (!this._oDialog) {
                this._oDialog = new sap.m.Dialog({
                    title: "Visualizar Documento",
                    content: new sap.m.Image({ src: "{view>/docSelecionado/foto}", width: "100%" }),
                    endButton: new sap.m.Button({ text: "Fechar", press: () => this._oDialog.close() })
                });
                this.getView().addDependent(this._oDialog);
            }
            this._oDialog.open();
        },

        onDeletarDoc: function (oEvent) {
            const oItem = oEvent.getSource().getBindingContext("view").getObject();
            let aDocs = this.getView().getModel("view").getProperty("/documentos");
            aDocs = aDocs.filter(d => d.id !== oItem.id);
            this.getView().getModel("view").setProperty("/documentos", aDocs);
            localStorage.setItem("ferias1000_docs", JSON.stringify(aDocs));
        },

        _carregarDocsLocalStorage: function () {
            const sData = localStorage.getItem("ferias1000_docs");
            return sData ? JSON.parse(sData) : [];
        }
    });
});
