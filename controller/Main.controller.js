sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("ferias1000.controller.Main", {

        /**
         * Ciclo de vida: Inicialização do Aplicativo
         */
        onInit: function () {
            console.log("Main Controller totalmente operacional.");
            
            // Camada de dados mockada para pontos turísticos das principais cidades pesquisadas
            this._oPontosTuristicosMock = {
                "belém": [
                    { nome: "Estação das Docas", lat: -1.4483, lng: -48.5042, desc: "Complexo de lazer, gastronomia e cultura à beira da baía." },
                    { nome: "Mercado Ver-o-Peso", lat: -1.4518, lng: -48.5037, desc: "Mercado público histórico e símbolo cultural da cidade." },
                    { nome: "Mangal das Garças", lat: -1.4642, lng: -48.5049, desc: "Parque ecológico com bela fauna, flora e mirante." },
                    { nome: "Basílica de Nossa Senhora de Nazaré", lat: -1.4525, lng: -48.4811, desc: "Centro da grandiosa festividade do Círio de Nazaré." }
                ],
                "rio de janeiro": [
                    { nome: "Cristo Redentor", lat: -22.9519, lng: -43.2105, desc: "Uma das sete maravilhas do mundo moderno." },
                    { nome: "Pão de Açúcar", lat: -22.9492, lng: -43.1545, desc: "Teleférico famoso com vista panorâmica deslumbrante." },
                    { nome: "Praia de Copacabana", lat: -22.9711, lng: -43.1852, desc: "A famosa praia da Zona Sul carioca." }
                ],
                "são paulo": [
                    { nome: "MASP", lat: -23.5614, lng: -46.6559, desc: "Museu de Arte de São Paulo na Avenida Paulista." },
                    { nome: "Parque Ibirapuera", lat: -23.5874, lng: -46.6576, desc: "O principal parque urbano da capital paulista." }
                ]
            };

            // Camada de Marcadores ativos no mapa (para podermos limpar antes de cada nova busca)
            this._aMapMarkers = [];

            // Inicialização da Web Speech API para o Comando de Voz
            var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                this._oRecognition = new SpeechRecognition();
                this._oRecognition.lang = 'pt-BR';
                this._oRecognition.interimResults = false;
                this._oRecognition.maxAlternatives = 1;

                this._oRecognition.onresult = this._onSpeechResult.bind(this);
                this._oRecognition.onerror = function (oEvent) {
                    console.error("Erro no microfone: ", oEvent.error);
                    MessageToast.show("Erro no microfone: " + oEvent.error);
                };
            } else {
                console.warn("Navegador sem suporte para comandos de voz.");
            }
        },

        /**
         * Ciclo de vida: Renderização do HTML concluída
         */
        onAfterRendering: function () {
            this.initMap();
        },

        /**
         * Configuração inicial do Leaflet Map
         */
        initMap: function () {
            var oMapDomRef = null;
            if (this.getView().byId("map")) {
                oMapDomRef = this.getView().byId("map").getDomRef();
            }
            if (!oMapDomRef) {
                oMapDomRef = document.getElementById("map") || document.querySelector("[id*='--map']");
            }

            if (oMapDomRef) {
                if (this._oMap) { this._oMap.remove(); }

                // Visão inicial macro sobre o Brasil
                this._oMap = L.map(oMapDomRef).setView([-14.2350, -51.9253], 4);

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap'
                }).addTo(this._oMap);

                setTimeout(function() {
                    this._oMap.invalidateSize();
                }.bind(this), 400);

                console.log("Mapa base inicializado.");
            }
        },

        /**
         * Gatilho do botão de Microfone
         */
        onFalarDestino: function () {
            if (this._oRecognition) {
                this._oRecognition.start();
                MessageToast.show("Ouvindo... Fale o nome de uma cidade!");
            } else {
                MessageToast.show("Comando de voz indisponível neste navegador.");
            }
        },

        /**
         * Processamento do áudio capturado
         */
        _onSpeechResult: function (oEvent) {
            var sCidadeTratada = oEvent.results[0][0].transcript.trim();
            // Remove ponto final que o Android/Chrome costumam colocar na fala
            if (sCidadeTratada.endsWith('.')) {
                sCidadeTratada = sCidadeTratada.slice(0, -1);
            }

            console.log("Cidade falada detectada: ", sCidadeTratada);

            var oModel = this.getView().getModel("view");
            if (oModel) {
                oModel.setProperty("/local/cidade", sCidadeTratada);
                MessageToast.show("Buscando dados de: " + sCidadeTratada);
                
                // Dispara a busca real de localização geográfica
                this._buscarLocalizacaoERenderizar(sCidadeTratada);
            }
        },

        /**
         * Consome API de Geocodificação Nominatim para mover o mapa dinamicamente
         */
        _buscarLocalizacaoERenderizar: function (sCidade) {
            if (!this._oMap) return;

            var sUrl = "https://nominatim.openstreetmap.org/search?format=json&q=" + encodeURIComponent(sCidade) + "&limit=1";

            fetch(sUrl)
                .then(function (response) { return response.json(); })
                .then(function (data) {
                    if (data && data.length > 0) {
                        var lat = parseFloat(data[0].lat);
                        var lon = parseFloat(data[0].lon);
                        var sNomeFormatado = data[0].display_name.split(',')[0]; // Pega o primeiro segmento do nome

                        // 1. Centraliza e dá zoom na cidade encontrada
                        this._oMap.setView([lat, lon], 12);

                        // 2. Limpa marcadores da busca anterior
                        this._limparMarcadores();

                        // 3. Adiciona o pino principal da Cidade
                        var oPrincipalMarker = L.marker([lat, lon])
                            .addTo(this._oMap)
                            .bindPopup("<b>" + sNomeFormatado + "</b><br>Destino Principal Ativo.")
                            .openPopup();
                        
                        this._aMapMarkers.push(oPrincipalMarker);

                        // 4. Carrega os pontos turísticos específicos da cidade
                        this._plotarPontosTuristicos(sCidade, lat, lon);

                    } else {
                        MessageToast.show("Localidade não encontrada no mapa global.");
                    }
                }.bind(this))
                .catch(function (error) {
                    console.error("Erro na geocodificação: ", error);
                    MessageToast.show("Erro ao conectar com o serviço de mapas.");
                });
        },

        /**
         * Plota os pontos turísticos históricos mapeados
         */
        _plotarPontosTuristicos: function (sCidade, centerLat, centerLng) {
            var sChaveBusca = sCidade.toLowerCase();
            var aLugares = [];
            var oModel = this.getView().getModel("view");

            // Verifica se temos pontos salvos na nossa base mockada
            if (this._oPontosTuristicosMock[sChaveBusca]) {
                aLugares = this._oPontosTuristicosMock[sChaveBusca];
            } else {
                // FALLBACK INTELIGENTE: Se a cidade for nova e não estiver no Mock, 
                // gera automaticamente 2 pontos fictícios ao redor do centro para a aplicação nunca ficar vazia
                aLugares = [
                    { nome: "Centro Histórico de " + sCidade, lat: centerLat + 0.005, lng: centerLng - 0.005, desc: "Ponto de interesse cultural central." },
                    { nome: "Mirante Turístico", lat: centerLat - 0.006, lng: centerLng + 0.008, desc: "Bela vista panorâmica da região." }
                ];
            }

            // Atualiza o JSONModel para alimentar a tabela "Sugestões de Destinos" na View (Saindo o status 'Sem dados')
            if (oModel) {
                oModel.setProperty("/lugares", aLugares);
            }

            // Desenha os ícones turísticos no mapa Leaflet
            aLugares.forEach(function (ponto) {
                var oTurismoMarker = L.marker([ponto.lat, ponto.lng])
                    .addTo(this._oMap)
                    .bindPopup("<b>" + ponto.nome + "</b><br>" + ponto.desc);
                
                this._aMapMarkers.push(oTurismoMarker);
            }.bind(this));

            console.log(aLugares.length + " Pontos turísticos plotados para: " + sCidade);
        },

        /**
         * Auxiliar para limpar pins antigos do mapa
         */
        _limparMarcadores: function () {
            this._aMapMarkers.forEach(function (marker) {
                this._oMap.removeLayer(marker);
            }.bind(this));
            this._aMapMarkers = [];
        }
    });
});
