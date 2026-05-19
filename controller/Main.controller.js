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
                MessageToast.show("Reconhecimento de voz não suportado.");
                return;
            }

            var recognition = new SpeechRecognition();
            recognition.lang = 'pt-BR';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            recognition.onstart = function () {
                MessageToast.show("Microfone ativado! Fale o destino...");
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

                        // Atualiza as coordenadas e cidade
                        oModel.setProperty("/local/cidade", oLocal.display_name);
                        oModel.setProperty("/local/coordenadas", lat.toFixed(4) + ", " + lon.toFixed(4));
                        oModel.setProperty("/clima/temp", (16 + Math.floor(Math.random() * 14)) + " °C");

                        if (that._map && that._marker) {
                            that._map.setView([lat, lon], 12);
                            that._marker.setLatLng([lat, lon]);
                            that._marker.getPopup().setContent("Destino: " + sCidade).update().openPopup();
                        }

                        // Dispara chamada para buscar atrações turísticas daquela cidade específica
                        var sUrlPontos = "https://nominatim.openstreetmap.org/search?format=json&q=tourism+in+" + encodeURIComponent(sCidade) + "&limit=5";
                        return fetch(sUrlPontos, { headers: { 'Accept': 'application/json' } });
                    } else {
                        MessageToast.show("Cidade não encontrada.");
                        return null;
                    }
                })
                .then(function (responsePontos) {
                    return responsePontos ? responsePontos.json() : null;
                })
                .then(function (pontosData) {
                    if (pontosData && pontosData.length > 0) {
                        var aLugaresDinamicos = pontosData.map(function (ponto) {
                            // Pega o nome do ponto turístico ou o primeiro fragmento do endereço longo
                            var sNomeCurto = ponto.name || (ponto.display_name ? ponto.display_name.split(',')[0] : "Ponto Turístico");
                            var sCategoria = "Atração Local";
                            
                            if (ponto.type === "museum") sCategoria = "Museu & Cultura";
                            if (ponto.type === "viewpoint") sCategoria = "Mirante & Paisagem";
                            if (ponto.type === "theme_park") sCategoria = "Parque de Diversões";
                            if (ponto.type === "aquarium") sCategoria = "Aquário / Lazer";

                            return { nome: sNomeCurto, categoria: sCategoria };
                        });
                        
                        // Atualiza a tabela dinamicamente eliminando os dados de Diamantina anterior
                        oModel.setProperty("/lugares", aLugaresDinamicos);
                    } else {
                        // Caso a API não retorne pontos específicos, monta opções padrão para a localidade
                        oModel.setProperty("/lugares", [
                            { nome: "Centro da Cidade", categoria: "Exploração Urbana" },
                            { nome: "Praça Principal", categoria: "Passeio Turístico" }
                        ]);
                    }
                })
                .catch(function (error) {
                    console.error("Erro na requisição das atividades: ", error);
                });
        }
    });
});
