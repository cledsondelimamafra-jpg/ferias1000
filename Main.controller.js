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

        onAfterRendering: function () {
            if (!this._map) {
                const oMapDom = document.querySelector('[id$="map"]');
                if (oMapDom) {
                    this._map = L.map(oMapDom).setView([-15, -47], 4);
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '&copy; OSM'
                    }).addTo(this._map);

                    this._map.on('click', (e) => {
                        this._onMapClick(e.latlng.lat, e.latlng.lng);
                    });
                }
            }
        },

        // --- LÓGICA DE EXPLORAÇÃO (MAPA/CLIMA/LUGARES) ---
        _onMapClick: function (lat, lon) {
            this._buscarCidade(lat, lon);
            this._buscarClima(lat, lon);
            this._buscarLugares(lat, lon);
        },

        _buscarCidade: function (lat, lon) {
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
                .then(r => r.json()).then(d => {
                    const local = d.address;
                    this.getView().getModel("view").setProperty("/local/cidade", local.city || local.town || local.village || "Desconhecido");
                    this.getView().getModel("view").setProperty("/local/pais", local.country);
                });
        },

        _buscarClima: function (lat, lon) {
            const key = "acc3120a7a5cdbff08e94710972ada23";
            fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=pt_br&appid=${key}`)
                .then(r => r.json()).then(d => {
                    this.getView().getModel("view").setProperty("/clima/temp", Math.round(d.main.temp) + "°C");
                    this.getView().getModel("view").setProperty("/clima/desc", d.weather[0].description);
                });
        },

        _buscarLugares: function (lat, lon) {
            const key = "5ae2e3f221c38a28845f05b64cf3101dbe3efa692c5b1d31e96dc24b";
            const urlBase = "https://api.opentripmap.com/0.1/en/places";
            fetch(`${urlBase}/radius?radius=15000&lon=${lon}&lat=${lat}&format=json&apikey=${key}`)
                .then(r => r.json()).then(data => {
                    const top = data.filter(i => i.name).sort((a, b) => b.rate - a.rate).slice(0, 6);
                    const promessas = top.map(l => fetch(`${urlBase}/xid/${l.xid}?apikey=${key}`).then(r => r.json()));
                    return Promise.all(promessas);
                }).then(detalhes => {
                    const formatados = detalhes.map(d => ({
                        name: d.name,
                        category: d.kinds ? d.kinds.split(',')[0].replace(/_/g, ' ') : "Turismo",
                        image: d.preview ? d.preview.source : "https://images.unsplash.com/photo-1500835595327-8317d296a51d?w=200"
                    }));
                    this.getView().getModel("view").setProperty("/lugares", formatados);
                });
        },

        // --- LÓGICA DA CARTEIRA DE DOCUMENTOS ---
        onFileUpload: function (oEvent) {
            const file = oEvent.getParameter("files")[0];
            const reader = new FileReader();
            reader.onload = (e) => { this._tempFotoBase64 = e.target.result; };
            reader.readAsDataURL(file);
        },

        onSalvarDoc: function () {
            const sTipo = this.byId("inputTipo").getValue();
            const sValidade = this.byId("inputValidade").getValue();
            const sValidadeRaw = this.byId("inputValidade").getDateValue();

            if (!sTipo || !sValidade || !this._tempFotoBase64) {
                MessageBox.error("Preencha o tipo, a validade e selecione uma foto.");
                return;
            }

            const oStatus = this._calcularStatus(sValidadeRaw);
            const oNovoDoc = {
                id: Date.now(),
                tipo: sTipo,
                validade: sValidade,
                validadeFormatada: new Date(sValidadeRaw).toLocaleDateString('pt-BR'),
                foto: this._tempFotoBase64,
                estado: oStatus.estado,
                estadoColor: oStatus.color
            };

            const aDocs = this.getView().getModel("view").getProperty("/documentos");
            aDocs.push(oNovoDoc);
            this.getView().getModel("view").setProperty("/documentos", aDocs);
            localStorage.setItem("ferias1000_docs", JSON.stringify(aDocs));

            this._limparCamposDoc();
            MessageToast.show("Documento arquivado!");
        },

        onVerDocumento: function (oEvent) {
            const oDoc = oEvent.getSource().getBindingContext("view").getObject();
            this.getView().getModel("view").setProperty("/docSelecionado", oDoc);

            if (!this._oDocDialog) {
                this._oDocDialog = new sap.m.Dialog({
                    title: "{view>/docSelecionado/tipo}",
                    content: [ new sap.m.Image({ src: "{view>/docSelecionado/foto}", width: "100%" }) ],
                    beginButton: new sap.m.Button({ text: "Fechar", press: () => this._oDocDialog.close() })
                });
                this.getView().addDependent(this._oDocDialog);
            }
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
                    }
                }
            });
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
            this.byId("fileUploader").clear();
            this._tempFotoBase64 = "";
        }
    });
});
