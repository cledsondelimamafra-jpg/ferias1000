sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("ferias1000.controller.Main", {
        _map: null,
        _marker: null,

        onInit: function () {
            // Inicializa o modelo dinâmico com Diamantina como ponto de partida
            var oModel = new JSONModel({
                local: {
                    cidade: "Diamantina, MG",
                    coordenadas: "-18.2443, -43.6011"
                },
                clima: {
                    temp: "22 °C"
                },
                lugares: [
                    { nome: "Centro Histórico", categoria: "Cultura & Passeio" },
                    { nome: "Cachoeira dos Cristais", categoria: "Ecoturismo" }
                ]
            });
            this.getView().setModel(oModel, "view");
        },

        onAfterRendering: function () {
            // Renderiza o mapa inicial na div
            try {
                if (typeof L !== 'undefined' && !this._map) {
                    this._map = L.map('mapaDestino').setView([-18.2443, -43.6011], 13);

                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '&copy; OpenStreetMap'
                    }).addTo(this._map);

                    this._marker = L.marker([-18.2443, -43.6011]).addTo(this._map)
                        .bindPopup('Ponto Inicial: Diamantina')
                        .openPopup();
                    
                    var oMap = this._map;
                    setTimeout(function() {
                        oMap.invalidateSize();
                    }, 400);
                }
            } catch (oError) {
                console.error("Erro ao inicializar o mapa: ", oError);
            }
        },

        onIniciarComandoVoz: function () {
            var oView = this.getView();
            var oModel = oView.getModel("view");
            var that = this;

            // Verifica se o navegador suporta reconhecimento de voz
            var SpeedRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeedRecognition) {
                MessageToast.show("Reconhecimento de voz não suportado neste navegador.");
                return;
            }

            var recognition = new SpeedRecognition();
            recognition.lang = 'pt-BR';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            recognition.onstart = function () {
                MessageToast.show("Microfone ativado! Fale a cidade de destino...");
            };

            recognition.onerror = function (event) {
                MessageToast.show("Erro no microfone: " + event.error);
            };

            recognition.onresult = function (event) {
                var sResult = event.results[0][0].transcript;
                // Remove pontos finais que o Google às vezes joga na transcrição
                sResult = sResult.replace(/\.$/, ""); 
                
                MessageToast.show("Buscando: " + sResult);
                
                // Dispara a busca geográfica real da cidade falada
                that._buscarCidadeAPI(sResult);
            };

            recognition.start();
        },

        _buscarCidadeAPI: function (sCidade) {
            var oModel = this.getView().getModel("view");
            var that = this;

            // API pública do OpenStreetMap para buscar latitude e longitude por texto
            var sUrl = "https://nominatim.openstreetmap.org/search?format=json&q=" + encodeURIComponent(sCidade);

            fetch(sUrl)
                .then(function (response) { return response.json(); })
                .then(function (data) {
                    if (data && data.length > 0) {
                        var oLocal = data[0];
                        var lat = parseFloat(oLocal.lat);
                        var lon = parseFloat(oLocal.lon);

                        // 1. Atualiza os textos da tela usando o modelo do SAPUI5
                        oModel.setProperty("/local/cidade", oLocal.display_name);
                        oModel.setProperty("/local/coordenadas", lat.toFixed(4) + ", " + lon.toFixed(4));
                        oModel.setProperty("/clima/temp", (18 + Math.floor(Math.random() * 12)) + " °C"); // Simula temperatura baseado na região

                        // Mock de novas atividades para a cidade encontrada
                        oModel.setProperty("/lugares", [
                            { nome: "Ponto Turístico Central", categoria: "Exploração Urbana" },
                            { nome: "Restaurante Local Recomendado", categoria: "Gastronomia" },
                            { nome: "Parque ou Praça Principal", categoria: "Lazer" }
                        ]);

                        // 2. Move dinamicamente o mapa e o marcador para as novas coordenadas!
                        if (that._map && that._marker) {
                            that._map.setView([lat, lon], 12);
                            that._marker.setLatLng([lat, lon]);
                            that._marker.getPopup().setContent("Destino: " + sCidade).update();
                        }
                    } else {
                        MessageToast.show("Cidade não encontrada no mapa geográfico.");
                    }
                })
                .catch(function (error) {
                    console.error("Erro na busca de coordenadas: ", error);
                    MessageToast.show("Erro ao conectar com o serviço de mapas.");
                });
        }
    });
});
