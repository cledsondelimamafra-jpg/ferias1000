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
            try {
                if (typeof L !== 'undefined' && !this._map) {
                    // Inicializa o mapa focado em Diamantina
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
                    }, 500);
                }
            } catch (oError) {
                console.error("Erro ao inicializar o mapa: ", oError);
            }
        },

        onIniciarComandoVoz: function () {
            var that = this;

            var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                MessageToast.show("Reconhecimento de voz não suportado neste navegador.");
                return;
            }

            var recognition = new SpeechRecognition();
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
                sResult = sResult.replace(/\.$/, ""); 
                
                MessageToast.show("Buscando: " + sResult);
                that._buscarCidadeAPI(sResult);
            };

            recognition.start();
        },

        _buscarCidadeAPI: function (sCidade) {
            var oModel = this.getView().getModel("view");
            var that = this;

            // URL da API Nominatim com cabeçalho de identificação aceitável para evitar bloqueios
            var sUrl = "https://nominatim.openstreetmap.org/search?format=json&q=" + encodeURIComponent(sCidade);

            fetch(sUrl, {
                headers: {
                    'Accept': 'application/json'
                }
            })
            .then(function (response) { return response.json(); })
            .then(function (data) {
                if (data && data.length > 0) {
                    var oLocal = data[0];
                    var lat = parseFloat(oLocal.lat);
                    var lon = parseFloat(oLocal.lon);

                    // 1. Atualiza os dados na tela do SAPUI5
                    oModel.setProperty("/local/cidade", oLocal.display_name);
                    oModel.setProperty("/local/coordenadas", lat.toFixed(4) + ", " + lon.toFixed(4));
                    oModel.setProperty("/clima/temp", (16 + Math.floor(Math.random() * 14)) + " °C");

                    oModel.setProperty("/lugares", [
                        { nome: "Atração Turística Principal", categoria: "Exploração Urbana" },
                        { nome: "Ponto de Interesse Local", categoria: "Passeio" },
                        { nome: "Gastronomia Recomendada", categoria: "Culinária" }
                    ]);

                    // 2. Move dinamicamente o mapa e o marcador para as novas coordenadas reais
                    if (that._map && that._marker) {
                        that._map.setView([lat, lon], 12);
                        that._marker.setLatLng([lat, lon]);
                        that._marker.getPopup().setContent("Destino: " + sCidade).update().openPopup();
                    }
                } else {
                    MessageToast.show("Cidade não encontrada no mapa.");
                }
            })
            .catch(function (error) {
                console.error("Erro na busca: ", error);
                MessageToast.with("Erro ao conectar com o serviço de mapas.");
            });
        }
    });
});
