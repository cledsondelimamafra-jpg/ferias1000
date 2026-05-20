sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, JSONModel, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("ferias1000.controller.Main", {

        onInit: function () {
            // Define o modelo inicial (Documentos vazios ou carregados)
            const oData = {
                clima: { temp: "--", desc: "Selecione no mapa" },
                local: { cidade: "Aguardando clique...", pais: "" },
                lugares: [],
                documentos: this._carregarDocsLocalStorage(), // Esta função já está correto
                docSelecionado: {} // Novo campo para o diálogo de visualização
            };
            this.getView().setModel(new JSONModel(oData), "view");
            this._tempFotoBase64 = "";
        },

        onAfterRendering: function () {
            // Inicializa o mapa se não existir (Obrigatório para o Mapa carregar)
            if (!this._map) {
                const oMapDom = document.querySelector('[id$="map"]');
                if (oMapDom) {
                    this._map = L.map(oMapDom).setView([-15, -47], 4);
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '&copy; OpenStreetMap'
                    }).addTo(this._map);

                    // Adiciona o clique no mapa
                    this._map.on('click', (e) => {
                        this._onMapClick(e.latlng.lat, e.latlng.lng);
                    });
                }
            }
        },

        // --- LÓGICA DE EXPLORAÇÃO (MAPA/CLIMA/LUGARES) - MANTENHA SUAS OUTRAS FUNÇÕES AQUI ---
        _onMapClick: function (lat, lon) {
            // Chame suas funções de busca aqui (Nominnatim, OpenWeather, OpenTripMap)
            // ...
        },

        // --- LÓGICA DA CARTEIRA DE DOCUMENTOS (CORREÇÃO DE SALVAMENTO E VISUALIZAÇÃO) ---
        onFileUpload: function (oEvent) {
            const file = oEvent.getParameter("files")[0];
            const reader = new FileReader();
            reader.onload = (e) => { this._tempFotoBase64 = e.target.result; };
            reader.readAsDataURL(file);
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

            // Pega o array atual e cria uma NOVA referência (imutable pattern) - ISTO É O QUE CONSERTOU O SALVAMENTO
            const aDocs = oModel.getProperty("/documentos");
            const aDocsAtualizado = [...aDocs, oNovoDoc];

            // Atualiza o modelo e o localStorage
            oModel.setProperty("/documentos", aDocsAtualizado);
            localStorage.setItem("ferias1000_docs", JSON.stringify(aDocsAtualizado));

            this._limparCamposDoc();
            MessageToast.show("Documento arquivado!");
        },

        // --- NOVA FUNÇÃO PARA VISUALIZAR DOCUMENTO ---
        onVerDocumento: function (oEvent) {
            // Pega o documento clicado na lista
            const oDoc = oEvent.getSource().getBindingContext("view").getObject();
            
            // Define o documento no modelo para o diálogo poder usá-lo
            this.getView().getModel("view").setProperty("/docSelecionado", oDoc);

            if (!this._oDocDialog) {
                // Cria o diálogo se ele ainda não existir
                this._oDocDialog = new sap.m.Dialog({
                    title: "{view>/docSelecionado/tipo}",
                    content: [
                        new sap.m.Image({
                            src: "{view>/docSelecionado/foto}", // A foto Base64 salva
                            width: "100%",
                            densityAware: false
                        })
                    ],
                    beginButton: new sap.m.Button({
                        text: "Fechar",
                        type: "Reject",
                        press: () => this._oDocDialog.close()
                    })
                });
                // Importante: conecta o diálogo à View para herdar o modelo
                this.getView().addDependent(this._oDocDialog);
            }
            // Abre o diálogo
            this._oDocDialog.open();
        },

        onDeletarDoc: function (oEvent) {
            const oItem = oEvent.getSource().getBindingContext("view").getObject();
            MessageBox.confirm("Excluir este documento?", {
                onClose: (sAction) => {
                    if (sAction === "OK") {
                        let aDocs = this.getView().getModel("view").getProperty("/documentos");
                        aDocs = aDocs.filter(d => d.id !== oItem.id);
                        this.getView().getModel("view").setProperty("/documentos", aDocs);
                        localStorage.setItem("ferias1000_docs", JSON.stringify(aDocs));
                        MessageToast.show("Documento excluído.");
                    }
                }
            });
        },

        // --- FUNÇÕES AUXILIARES QUE JÁ ESTAVAM CORRETAS ---
        _calcularStatus: function (dValidade) {
            // ... (mantenha sua lógica de cálculo de status) ...
            return { estado: "Success", color: "#2b7d2b" }; // Exemplo simples
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
        }
    });
});
