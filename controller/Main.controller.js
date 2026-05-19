sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("ferias1000.controller.Main", {

        onInit: function () {
            console.log("Main Controller operacional - Correção das abas aplicada.");
            
            // Banco de dados mockado para pontos turísticos
            this._oPontosTuristicosMock = {
                "belém": [
                    { nome: "Estação das Docas", lat: -1.4483, lng: -48.5042, desc: "Gastronomia e cultura à beira da baía." },
                    { nome: "Mercado Ver-o-Peso", lat: -1.4518, lng: -48.5037, desc: "Mercado público histórico e símbolo cultural." },
                    { nome: "Mangal das Garças", lat: -1.4642, lng: -48.5049, desc: "Parque ecológico com avizário e mirante." }
                ],
                "niterói": [
                    { nome: "MAC Niterói", lat: -22.9078, lng: -43.1259, desc: "Museu de Arte Contemporânea projetado por Niemeyer." },
                    { nome: "Parque da Cidade", lat: -22.9366, lng: -43.0844, desc: "Vista panorâmica incrível de Niterói e do Rio." },
                    { nome: "Fortaleza de Santa Cruz", lat: -22.9255, lng: -43.1319, desc: "Sítio histórico militar na entrada da baía." }
                ],
                "rio de janeiro": [
                    { nome: "Cristo Redentor", lat: -22.9519, lng: -43.2105, desc: "Uma das sete maravilhas do mundo moderno." },
                    { nome: "Pão de Açúcar", lat: -22.9492, lng: -43.1545, desc: "Teleférico com vista panorâmica deslumbrante." }
                ]
            };

            this._aMapMarkers = [];

            // Povoando as abas extras com dados padrão para exibição inicial imediata
            var oModel = this.getView().getModel("view");
            if (oModel) {
                oModel.setProperty("/documentos", [
                    { tipo: "Passaporte Nacional", status: "Válido até 12/2031" },
                    { tipo: "Apólice de Seguro Viagem", status: "Ativo - Cobertura Global" },
                    { tipo: "Comprovante de Vacinação", status: "Emitido via ConecteSUS" }
                ]);

                oModel.setProperty("/reservas", [
                    { hotel: "Hotel Grand Vista - Quarto Casal Premium", periodo: "05 noites - Confirmado" }
                ]);

                oModel.setProperty("/passagens", [
                    { voo: "LATAM LA3412 (GIG -> BEL)", info: "Assento 12C - Embarque às 14:20" }
                ]);
            }

            // Ativação do Microfone
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

        /**
         * Chaveamento lógico de visibilidade de abas (IconTabBar)
         */
        onTabSelect: function (oEvent) {
            var sSelectedKey = oEvent.getParameter("key");
            
            this.getView().byId("panelExplorar").setVisible(sSelectedKey === "explorar");
            this.getView().byId("panelDocumentos").setVisible(sSelectedKey === "documentos");
            this.getView().byId("panelReservas").setVisible(sSelectedKey === "reservas");
            this.getView().byId("panelPassagens").setVisible(sSelectedKey === "passagens");
            this.getView().byId("panelManual").setVisible(sSelectedKey === "manual");

            // Recalcula o tamanho físico do container do Leaflet ao voltar para a aba principal
            if (sSelectedKey === "explorar" && this._oMap) {
                setTimeout(function() {
                    this._oMap.invalidateSize();
                }.bind(this), 200);
            }
        },

        onFalarDestino: function () {
            if (this._oRecognition) {
                this._oRecognition.start();
                MessageToast.show("Ouvindo... Fale o destino!");
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
            var aLugares = this._oPontosTuristicosMock[sChave] || [
                { nome: "Ponto Turístico Central", lat: centerLat + 0.004, lng: centerLng - 0.003, desc: "Região de interesse em " + sCidade },
                { nome: "Mirante da Região", lat: centerLat - 0.003, lng: centerLng + 0.005, desc: "Bela área com vista panorâmica." }
            ];

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
        }
    });
});
