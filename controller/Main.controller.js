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

        // --- LÓGICA DE PERSISTÊNCIA E GRAVAÇÃO ---
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
                validade: oDatePicker.getValue(),
                validadeFormatada: sValidadeRaw.toLocaleDateString('pt-BR'),
                foto: this._tempFotoBase64,
                estado: oStatus.estado,
                estadoColor: oStatus.color
            };

            // Pega o array atual e cria uma NOVA referência (imutable pattern)
            const aDocs = oModel.getProperty("/documentos");
            const aDocsAtualizado = [...aDocs, oNovoDoc];

            // Atualiza o modelo e o localStorage
            oModel.setProperty("/documentos", aDocsAtualizado);
            localStorage.setItem("ferias1000_docs", JSON.stringify(aDocsAtualizado));

            this._limparCamposDoc();
            MessageToast.show("Documento arquivado com sucesso!");
        },

        _carregarDocsLocalStorage: function () {
            const sData = localStorage.getItem("ferias1000_docs");
            return sData ? JSON.parse(sData) : [];
        },

        _limparCamposDoc: function () {
            this.byId("inputTipo").setValue("");
            this.byId("inputValidade").setValue("");
            // O FileUploader precisa do método clear()
            if (this.byId("fileUploader")) {
                this.byId("fileUploader").clear();
            }
            this._tempFotoBase64 = "";
        },

        // --- MANTENHA SUAS OUTRAS FUNÇÕES ABAIXO ---
        // (onAfterRendering, _onMapClick, _buscarCidade, _buscarClima, _buscarLugares, onFileUpload, onVerDocumento, onDeletarDoc, _calcularStatus)
        // ... cole o restante do seu código original aqui ...
    });
});
