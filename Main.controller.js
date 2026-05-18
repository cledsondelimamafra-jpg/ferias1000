sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Image"
], function (Controller, JSONModel, MessageToast, MessageBox, Dialog, Button, Image) {
    "use strict";

    return Controller.extend("ferias1000.controller.Main", {

        onInit: function () {
            // Cria e injeta o JSONModel dinamicamente no escopo da View
            var oModel = new JSONModel({
                local: { cidade: "Aguardando destino...", coordenadas: "--, --" },
                clima: { temp: "--" },
                lugares: [],
                documentos: [],
                reservas: [],
                passagens: []
            });
            this.getView().setModel(oModel, "view");

            // Restaura dados do localStorage de forma segura
            try {
                oModel.setProperty("/documentos", JSON.parse(localStorage.getItem("ferias1000_documentos")) || []);
                oModel.setProperty("/reservas", JSON.parse(localStorage.getItem("ferias1000_reservas")) || []);
                oModel.setProperty("/passagens", JSON.parse(localStorage.getItem("ferias1000_passagens")) || []);
            } catch (e) {
                console.error("Erro ao ler localStorage", e);
            }

            this._sCurrentFileBase64 = "";
            this._oMapaInstance = null;
            this._oMarcadorInstance = null;

            // Delegar carregamento do mapa Leaflet com segurança
            var oHtmlMapa = this.getView().byId("htmlMapa");
            if (oHtmlMapa) {
                oHtmlMapa.addEventDelegate({
                    onAfterRendering: function () {
                        this._inicializarMapaLeaflet();
                    }.bind(this)
                });
            }
        },

        _inicializarMapaLeaflet: function () {
            if (typeof window.L === "undefined") {
                setTimeout(this._inicializarMapaLeaflet.bind(this), 500);
                return;
            }
            if (this._oMapaInstance) { return; }

            try {
                this._oMapaInstance = window.L.map('mapa_container').setView([-14.2350, -51.9253], 4);
                window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap'
                }).addTo(this._oMapaInstance);

                setTimeout(function() {
                    if (this._oMapaInstance) { this._oMapaInstance.invalidateSize(); }
                }.bind(this), 400);

                var that = this;
                this._oMapaInstance.on('click', function(e) {
                    that._buscarDadosPorCoordenadas(e.latlng.lat, e.latlng.lng);
                });
            } catch (e) {
                console.error("Erro ao iniciar Leaflet: ", e);
            }
        },

        onIniciarComandoVoz: function () {
            var that = this;
            var oBtnMic = this.getView().byId("btnMicrofone");
            var oTxtStatus = this.getView().byId("txtStatusVoz");
            
            var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                MessageToast.show("Reconhecimento de voz não suportado neste navegador.");
                return;
            }

            var recognition = new SpeechRecognition();
            recognition.lang = 'pt-BR';
            
            recognition.onstart = function() {
                if(oBtnMic) { oBtnMic.setType("Negative").setText("Ouvindo..."); }
                if(oTxtStatus) { oTxtStatus.setText("Fale o destino agora..."); }
            };

            recognition.onerror = function() {
                if(oBtnMic) { oBtnMic.setType("Emphasized").setText("Falar Destino"); }
                if(oTxtStatus) { oTxtStatus.setText("Falha ao capturar áudio."); }
            };

            recognition.onresult = function(event) {
                if(oBtnMic) { oBtnMic.setType("Emphasized").setText("Falar Destino"); }
                var sTextoDitado = event.results[0][0].transcript;
                if(oTxtStatus) { oTxtStatus.setText("Pesquisando: '" + sTextoDitado + "'"); }
                
                jQuery.ajax({
                    url: "https://nominatim.openstreetmap.org/search?format=json&q=" + encodeURIComponent(sTextoDitado) + "&limit=1",
                    type: "GET",
                    success: function (data) {
                        if (data && data.length > 0) {
                            var fLat = parseFloat(data[0].lat);
                            var fLon = parseFloat(data[0].lon);
                            var sNomeOficial = data[0].display_name.split(',')[0];
                            that._atualizarDadosInterface(fLat, fLon, sNomeOficial);
                        } else {
                            MessageToast.show("Destino não encontrado.");
                        }
                    },
                    error: function() {
                        MessageToast.show("Erro ao conectar no servidor de mapas.");
                    }
                });
            };
            recognition.start();
        },

        _atualizarDadosInterface: function(fLat, fLon, sNomeLocal) {
            var oViewModel = this.getView().getModel("view");
            if (!oViewModel) { return; }

            var iTempMock = (fLat > -23.5 && fLat < 23.5) ? Math.floor(Math.random() * (31 - 23)) + 23 : Math.floor(Math.random() * (22 - 14)) + 14;
            
            oViewModel.setProperty("/clima/temp", iTempMock + "°C");
            oViewModel.setProperty("/local/cidade", sNomeLocal);
            oViewModel.setProperty("/local/coordenadas", fLat.toFixed(4) + ", " + fLon.toFixed(4));
            
            oViewModel.setProperty("/lugares", [
                { name: "Centro Histórico de " + sNomeLocal, category: "Pontos Turísticos", icon: "sap-icon://photo-vitae" },
                { name: "Tour Gastronómico Local", category: "Restaurantes", icon: "sap-icon://badge" },
                { name: "Feira de Artesanato", category: "Cultura Local", icon: "sap-icon://cart" }
            ]);

            if (this._oMapaInstance) {
                try {
                    this._oMapaInstance.setView([fLat, fLon], 12);
                    if (this._oMarcadorInstance) {
                        this._oMarcadorInstance.setLatLng([fLat, fLon]);
                    } else {
                        this._oMarcadorInstance = window.L.marker([fLat, fLon]).addTo(this._oMapaInstance);
                    }
                    this._oMarcadorInstance.bindPopup("<b>" + sNomeLocal + "</b>").openPopup();
                } catch(err) {
                    console.error("Erro ao mover mapa: ", err);
                }
            }
        },

        _buscarDadosPorCoordenadas: function(fLat, fLon) {
            var that = this;
            jQuery.ajax({
                url: "https://nominatim.openstreetmap.org/reverse?format=json&lat=" + fLat + "&lon=" + fLon,
                type: "GET",
                success: function(data) {
                    var sLocal = "Destino Selecionado";
                    if (data && data.address) {
                        sLocal = data.address.city || data.address.town || data.address.village || data.address.state || "Ponto Customizado";
                    }
                    that._atualizarDadosInterface(fLat, fLon, sLocal);
                },
                error: function() {
                    that._atualizarDadosInterface(fLat, fLon, "Ponto no Mapa");
                }
            });
        }
    });
});
