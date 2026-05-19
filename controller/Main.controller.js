sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("ferias1000.controller.Main", {

        onInit: function () {
            console.log("Main Controller operacional - Turismo Expandido e Funções CRUD Ativas.");
            
            // Base robusta contendo 7 pontos turísticos por cidade mapeada
            this._oPontosTuristicosMock = {
                "belém": [
                    { nome: "Estação das Docas", lat: -1.4483, lng: -48.5042, desc: "Complexo de gastronomia e cultura à beira da baía." },
                    { nome: "Mercado Ver-o-Peso", lat: -1.4518, lng: -48.5037, desc: "Mercado público histórico e maior feira ao ar livre da América Latina." },
                    { nome: "Mangal das Garças", lat: -1.4642, lng: -48.5049, desc: "Parque ecológico com avizário, borboletário e mirante do farol." },
                    { nome: "Basílica de Nossa Senhora de Nazaré", lat: -1.4525, lng: -48.4811, desc: "Santuário religioso central da grandiosa festa do Círio de Nazaré." },
                    { nome: "Forte do Presépio", lat: -1.4542, lng: -48.5052, desc: "Marco inicial da fundação da cidade de Belém fundada em 1616." },
                    { nome: "Theatro da Paz", lat: -1.4533, lng: -48.4947, desc: "Teatro histórico majestoso inspirado na Ópera de Scalla de Milão." },
                    { nome: "Parque da Residência", lat: -1.4475, lng: -48.4722, desc: "Antiga residência oficial dos governadores com orquidário e lazer." }
                ],
                "niterói": [
                    { nome: "MAC Niterói", lat: -22.9078, lng: -43.1259, desc: "Museu de Arte Contemporânea futurista projetado por Oscar Niemeyer." },
                    { nome: "Parque da Cidade", lat: -22.9366, lng: -43.0844, desc: "Mirante natural com rampa de voo livre e pôr do sol espetacular." },
                    { nome: "Fortaleza de Santa Cruz", lat: -22.9255, lng: -43.1319, desc: "Imponente monumento da arquitetura militar colonial brasileira." },
                    { nome: "Praia de Itacoatiara", lat: -22.9754, lng: -43.0336, desc: "Paraíso dos surfistas com mar cristalino e cercado por montanhas." },
                    { nome: "Costão de Itacoatiara", lat: -22.9772, lng: -43.0294, desc: "Trilha ecológica com vista panorâmica do topo da rocha." },
                    { nome: "Mercado de Peixe São Pedro", lat: -22.8872, lng: -43.1252, desc: "Ponto tradicional da gastronomia de frutos do mar da região." },
                    { nome: "Teatro Popular Oscar Niemeyer", lat: -22.8893, lng: -43.1317, desc: "Complexo cultural parte integrante do Caminho Niemeyer." }
                ],
                "rio de janeiro": [
                    { nome: "Cristo Redentor", lat: -22.9519, lng: -43.2105, desc: "Uma das sete maravilhas do mundo moderno no topo do Corcovado." },
                    { nome: "Pão de Açúcar", lat: -22.9492, lng: -43.1545, desc: "Famoso passeio de teleférico interligando a Praia Vermelha e a Urca." },
                    { nome: "Jardim Botânico", lat: -22.9674, lng: -43.2239, desc: "Instituição científica histórica com corredor imperial de palmeiras." },
                    { nome: "Estádio do Maracanã", lat: -22.9121, lng: -43.2302, desc: "Templo sagrado do futebol mundial e palco de finais de Copas." },
                    { nome: "Parque Lage", lat: -22.9598, lng: -43.2116, desc: "Casarão histórico com pátio interno e café aos pés do Corcovado." },
                    { nome: "Praia de Copacabana", lat: -22.9711, lng: -43.1852, desc: "A princesinha do mar famosa por seu calçadão de ondas pretas e brancas." },
                    { nome: "Museu do Amanhã", lat: -22.8938, lng: -43.1794, desc: "Museu de ciências aplicadas icônico localizado na Praça Mauá." }
                ]
            };

            this._aMapMarkers = [];

            // Inicializando arrays editáveis no JSONModel do componente
            var oModel = this.getView().getModel("view");
            if (oModel) {
                oModel.setProperty("/documentos", [
                    { tipo: "Passaporte Nacional", status: "Válido até 12/2031" },
                    { tipo: "Apólice de Seguro Viagem", status: "Ativo - Cobertura Global" }
                ]);

                oModel.setProperty("/reservas", [
                    { hotel: "Hotel Premium Conforto", periodo: "05 noites" }
                ]);

                oModel.setProperty("/passagens", [
                    { voo: "LATAM LA3412", info: "Assento 12C" }
                ]);
            }

            var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                this._oRecognition = new SpeechRecognition();
                this._oRecognition.lang = 'pt-BR';
                this._oRecognition.interimResults = false;
                this._oRecognition.maxAlternatives = 1;
                this._oRecognition.onresult = this._onSpeechResult.bind(this);
            }
        },

        onAfterRendering: function () {
            this.initMap();
        },

        initMap: function () {
            var oMapDomRef = null;
            if (this.getView().byId("map")) {
                oMapDomRef = this.getView().byId("map").getDomRef();
            }
            if (!oMapDomRef) {
                oMapDomRef = document.getElementById("map") || document.querySelector("[id*='--map']");
            }

            if (oMapDomRef && !this._oMap) {
                this._oMap = L.map(oMapDomRef).setView([-14.2350, -51.9253], 4);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap'
                }).addTo(this._oMap);
                
                setTimeout(function() {
                    this._oMap.invalidateSize();
                }.bind(this), 400);
            }
        },

        onTabSelect: function (oEvent) {
            var sSelectedKey = oEvent.getParameter("key");
            
            this.getView().byId("panelExplorar").setVisible(sSelectedKey === "explorar");
            this.getView().byId("panelDocumentos").setVisible(sSelectedKey === "documentos");
            this.getView().byId("panelReservas").setVisible(sSelectedKey === "reservas");
            this.getView().byId("panelPassagens").setVisible(sSelectedKey === "passagens");
            this.getView().byId("panelManual").setVisible(sSelectedKey === "manual");

            if (sSelectedKey === "explorar" && this._oMap) {
                setTimeout(function() {
                    this._oMap.invalidateSize();
                }.bind(this), 200);
            }
        },

        onFalarDestino: function () {
            if (this._oRecognition) {
                this._oRecognition.start();
                MessageToast.show("Ouvindo... Diga a cidade desejada!");
            }
        },

        _onSpeechResult: function (oEvent) {
            var sCidade = oEvent.results[0][0].transcript.trim();
            if (sCidade.endsWith('.')) { sCidade = sCidade.slice(0, -1); }

            var oModel = this.getView().getModel("view");
            if (oModel) {
                oModel.setProperty("/local/cidade", sCidade);
                this._buscarGeocodificacao(sCidade);
            }
        },

        _buscarGeocodificacao: function (sCidade) {
            var sUrl = "https://nominatim.openstreetmap.org/search?format=json&q=" + encodeURIComponent(sCidade) + "&limit=1";
            
            fetch(sUrl)
                .then(function (res) { return res.json(); })
                .then(function (data) {
                    if (data && data.length > 0) {
                        var lat = parseFloat(data[0].lat);
                        var lon = parseFloat(data[0].lon);

                        this._oMap.setView([lat, lon], 12);
                        this._limparMarcadores();

                        var oMainMarker = L.marker([lat, lon]).addTo(this._oMap)
                            .bindPopup("<b>" + sCidade + "</b><br>Destino Principal Ativo.").openPopup();
                        this._aMapMarkers.push(oMainMarker);

                        this._buscarClimaReal(lat, lon);
                        this._processarTurismo(sCidade, lat, lon);
                    }
                }.bind(this));
        },

        _buscarClimaReal: function (lat, lon) {
            var sWeatherUrl = "https://api.open-meteo.com/v1/forecast?latitude=" + lat + "&longitude=" + lon + "&current_weather=true";
            var oModel = this.getView().getModel("view");

            fetch(sWeatherUrl)
                .then(function (res) { return res.json(); })
                .then(function (weatherData) {
                    if (weatherData && weatherData.current_weather) {
                        var fTemp = weatherData.current_weather.temperature;
                        oModel.setProperty("/clima/temp", fTemp + " °C");
                    }
                }.bind(this))
                .catch(function () {
                    oModel.setProperty("/clima/temp", "Não disponível");
                });
        },

        _processarTurismo: function (sCidade, centerLat, centerLng) {
            var sChave = sCidade.toLowerCase();
            var aLugares = this._oPontosTuristicosMock[sChave];

            // Fallback dinâmico: Se não tiver no Mock, gera automaticamente 7 pontos ao redor para manter a volumetria
            if (!aLugares) {
                aLugares = [];
                for (var i = 1; i <= 7; i++) {
                    var offsetLat = (Math.sin(i) * 0.01).toFixed(4);
                    var offsetLng = (Math.cos(i) * 0.01).toFixed(4);
                    aLugares.push({
                        nome: "Atração Histórica " + i + " de " + sCidade,
                        lat: centerLat + parseFloat(offsetLat),
                        lng: centerLng + parseFloat(offsetLng),
                        desc: "Local turístico de interesse ecológico ou cultural preservado da região."
                    });
                }
            }

            var oModel = this.getView().getModel("view");
            if (oModel) {
                oModel.setProperty("/lugares", aLugares);
            }

            aLugares.forEach(function (ponto) {
                var oPino = L.marker([ponto.lat, ponto.lng]).addTo(this._oMap)
                    .bindPopup("<b>" + ponto.nome + "</b><br>" + ponto.desc);
                this._aMapMarkers.push(oPino);
            }.bind(this));
        },

        _limparMarcadores: function () {
            this._aMapMarkers.forEach(function (m) { this._oMap.removeLayer(m); }.bind(this));
            this._aMapMarkers = [];
        },

        /* ================================================================= */
        /* METODOS OPERACIONAIS (INCLUIR/EXCLUIR) PARA AS ABAS DE GERENCIAMENTO */
        /* ================================================================= */

        // 1. ABA DOCUMENTOS
        onAdicionarDocumento: function () {
            var oModel = this.getView().getModel("view");
            var aLista = oModel.getProperty("/documentos") || [];
            aLista.push({ tipo: "", status: "" });
            oModel.setProperty("/documentos", aLista);
            oModel.refresh(true);
        },

        onExcluirDocumento: function () {
            var oTable = this.getView().byId("tableDocumentos");
            var aSelectedItems = oTable.getSelectedItems();
            var oModel = this.getView().getModel("view");
            var aLista = oModel.getProperty("/documentos");

            for (var i = aSelectedItems.length - 1; i >= 0; i--) {
                var sPath = aSelectedItems[i].getBindingContextPath();
                var iIndex = parseInt(sPath.substring(sPath.lastIndexOf("/") + 1));
                aLista.splice(iIndex, 1);
            }
            oTable.removeSelections();
            oModel.setProperty("/documentos", aLista);
            MessageToast.show("Item removido com sucesso.");
        },

        // 2. ABA RESERVAS
        onAdicionarReserva: function () {
            var oModel = this.getView().getModel("view");
            var aLista = oModel.getProperty("/reservas") || [];
            aLista.push({ hotel: "", periodo: "" });
            oModel.setProperty("/reservas", aLista);
            oModel.refresh(true);
        },

        onExcluirReserva: function () {
            var oTable = this.getView().byId("tableReservas");
            var aSelectedItems = oTable.getSelectedItems();
            var oModel = this.getView().getModel("view");
            var aLista = oModel.getProperty("/reservas");

            for (var i = aSelectedItems.length - 1; i >= 0; i--) {
                var sPath = aSelectedItems[i].getBindingContextPath();
                var iIndex = parseInt(sPath.substring(sPath.lastIndexOf("/") + 1));
                aLista.splice(iIndex, 1);
            }
            oTable.removeSelections();
            oModel.setProperty("/reservas", aLista);
            MessageToast.show("Item removido com sucesso.");
        },

        // 3. ABA PASSAGENS
        onAdicionarPassagem: function () {
            var oModel = this.getView().getModel("view");
            var aLista = oModel.getProperty("/passagens") || [];
            aLista.push({ voo: "", info: "" });
            oModel.setProperty("/passagens", aLista);
            oModel.refresh(true);
        },

        onExcluirPassagem: function () {
            var oTable = this.getView().byId("tablePassagens");
            var aSelectedItems = oTable.getSelectedItems();
            var oModel = this.getView().getModel("view");
            var aLista = oModel.getProperty("/passagens");

            for (var i = aSelectedItems.length - 1; i >= 0; i--) {
                var sPath = aSelectedItems[i].getBindingContextPath();
                var iIndex = parseInt(sPath.substring(sPath.lastIndexOf("/") + 1));
                aLista.splice(iIndex, 1);
            }
            oTable.removeSelections();
            oModel.setProperty("/passagens", aLista);
            MessageToast.show("Item removido com sucesso.");
        }
    });
});
