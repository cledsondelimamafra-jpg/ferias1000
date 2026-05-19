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
            // Mantém o seu modelo original inicializado com Diamantina
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

        // GATILHO DO MICROFONE: Ativa quando você clica em "Falar Destino"
        onIniciarComandoVoz: function () {
            var that = this;
            
            // Verifica as APIs de voz suportadas pelos navegadores (Chrome, Edge, etc.)
            var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            
            if (!SpeechRecognition) {
                MessageToast.show("O reconhecimento de voz não é suportado neste navegador.");
                return;
            }

            var recognition = new SpeechRecognition();
            recognition.lang = 'pt-BR';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            // Feedback visual quando o navegador começa a ouvir
            recognition.onstart = function () {
                MessageToast.show("Microfone ativado! Fale o destino...");
            };

            // Tratamento caso dê algum erro de permissão ou silêncio
            recognition.onerror = function (event) {
                MessageToast.show("Erro no microfone: " + event.error);
            };

            // Captura o resultado da voz e envia para a sua função de busca
            recognition.onresult = function (event) {
                var sResultadoVoz = event.results[0][0].transcript;
                
                // Remove ponto final que alguns navegadores inserem automaticamente
                sResultadoVoz = sResultadoVoz.replace(/\.$/, ""); 
                
                MessageToast.show("Entendido: " + sResultadoVoz);
                
                // Executa a busca no mapa usando o texto que você acabou de falar
                that._buscarCidadeAPI(sResultadoVoz);
            };

            // Inicia a escuta do microfone
            recognition.start();
        },

        // FUNÇÃO DE BUSCA: Atualiza o mapa com o termo recebido
        _buscarCidadeAPI: function (sCidade) {
            var oModel = this.getView().getModel("view");
            var that = this;
            var sUrlCidade = "https://nominatim.openstreetmap.org/search?format=json&q=" + encodeURIComponent(sCidade);

            fetch(sUrlCidade, { headers: { 'Accept': 'application/json' } })
                .then(function (response) { 
                    return response.json(); 
                })
                .then(function (data) {
                    if (data && data.length > 0) {
                        var oLocal = data[0];
                        var lat = parseFloat(oLocal.lat);
                        var lon = parseFloat(oLocal.lon);

                        // Atualiza os dados de localidade na tela
                        oModel.setProperty("/local/cidade", oLocal.display_name);
                        oModel.setProperty("/local/coordenadas", lat.toFixed(4) + ", " + lon.toFixed(4));
                        oModel.setProperty("/clima/temp", (16 + Math.floor(Math.random() * 14)) + " °C");

                        // Move o mapa e o marcador para as coordenadas capturadas pela voz
                        if (that._map && that._marker) {
                            that._map.setView([lat, lon], 12);
                            that._marker.setLatLng([lat, lon]);
                            that._marker.getPopup().setContent("Destino: " + sCidade).update().openPopup();
                        }
                    } else {
                        MessageToast.show("Localidade não encontrada no mapa.");
                    }
                })
                .catch(function (error) {
                    console.error("Erro na busca da cidade: ", error);
                    MessageToast.show("Erro ao conectar com o serviço de mapas.");
                });
        }
    });
});
