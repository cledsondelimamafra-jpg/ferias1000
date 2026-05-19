sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Image",
    "sap/m/ScrollContainer"
], function (Controller, MessageToast, MessageBox, Dialog, Button, Image, ScrollContainer) {
    "use strict";

    return Controller.extend("ferias1000.controller.Main", {

        onInit: function () {
            var oModel = this.getView().getModel("view");
            if (oModel) {
                // Instancia caminhos padrões para evitar falhas de renderização no XML
                oModel.setProperty("/local", { cidade: "Aguardando seleção..." });
                oModel.setProperty("/clima", { temp: "--" });
                oModel.setProperty("/lugares", []);
                
                oModel.setProperty("/documentos", JSON.parse(localStorage.getItem("ferias1000_docs")) || []);
                oModel.setProperty("/reservas", JSON.parse(localStorage.getItem("ferias1000_reservas")) || []);
                oModel.setProperty("/passagens", JSON.parse(localStorage.getItem("ferias1000_passagens")) || []);
            }

            // Escuta a renderização para ajustar o mapa Leaflet
            this.getView().addEventDelegate({
                onAfterShow: function () {
                    this._inicializarMapaLeaflet();
                    this._capturarLocalizacaoAtual();
                }.bind(this)
            });

            this._sCurrentFileBase64 = "";
        },

        _inicializarMapaLeaflet: function () {
            if (!window.map && window.L) {
                // Define coordenadas padrão iniciais (Brasil)
                window.map = window.L.map('map').setView([-14.235, -51.9253], 4);
                window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors'
                }).addTo(window.map);

                window.map.on('click', this._onMapClick.bind(this));
            }
            
            // Força o recálculo do contêiner do mapa para preencher o espaço cinza residual
            setTimeout(function() {
                if (window.map) {
                    window.map.invalidateSize();
                }
            }, 600);
        },

        _capturarLocalizacaoAtual: function () {
            var that = this;
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    function (position) {
                        var fLat = position.coords.latitude;
                        var fLon = position.coords.longitude;

                        if (window.map) {
                            window.map.setView([fLat, fLon], 12);
                            if (window.currentMarker) {
                                window.currentMarker.setLatLng([fLat, fLon]);
                            } else if (window.L) {
                                window.currentMarker = window.L.marker([fLat, fLon]).addTo(window.map);
                            }
                        }

                        jQuery.ajax({
                            url: "https://nominatim.openstreetmap.org/reverse?format=json&lat=" + fLat + "&lon=" + fLon,
                            type: "GET",
                            success: function (data) {
                                var sCidade = data && data.address ? (data.address.city || data.address.town || data.address.suburb || "Minha Localização") : "Minha Localização";
                                that._atualizarClimaELugares(fLat, sCidade);
                            },
                            error: function() {
                                that._atualizarClimaELugares(fLat, "Localização Atual");
                            }
                        });
                    },
                    function () {
                        if (window.map) { window.map.invalidateSize(); }
                    }
                );
            }
        },

        _onMapClick: function (e) {
            var fLat = e.latlng.lat;
            var fLon = e.latlng.lng;

            if (window.map && window.L) {
                if (window.currentMarker) {
                    window.currentMarker.setLatLng([fLat, fLon]);
                } else {
                    window.currentMarker = window.L.marker([fLat, fLon]).addTo(window.map);
                }
            }
            this._atualizarClimaELugares(fLat, "Lat: " + fLat.toFixed(3) + " | Lng: " + fLon.toFixed(3));
        },

        _atualizarClimaELugares: function(fLat, sNomeLocal) {
            var oViewModel = this.getView().getModel("view");
            if (!oViewModel) return;

            // Simulação matemática de temperatura coerente baseada na latitude
            var iTempMock = fLat > -23.5 && fLat < 23.5 ? Math.floor(Math.random() * (32 - 24)) + 24 : Math.floor(Math.random() * (22 - 13)) + 13;
            
            oViewModel.setProperty("/clima/temp", iTempMock + "°C");
            oViewModel.setProperty("/local/cidade", sNomeLocal);
            oViewModel.setProperty("/lugares", [
                { name: "Ponto Turístico Recomendado", category: "Lazer e Passeios", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=80" },
                { name: "Centro Comercial / Gastronomia", category: "Alimentação", image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=80" }
            ]);
        },

        onFileChange: function(oEvent) {
            var oFile = oEvent.getParameter("files")[0];
            if (!oFile) {
                this._sCurrentFileBase64 = "";
                return;
            }

            var oReader = new FileReader();
            oReader.onload = function(e) {
                this._sCurrentFileBase64 = e.target.result;
                MessageToast.show("Arquivo convertido e anexado.");
            }.bind(this);
            oReader.readAsDataURL(oFile);
        },

        onSalvarDoc: function () {
            var oView = this.getView();
            var oViewModel = oView.getModel("view");
            var sTipo = oView.byId("inputTipoDoc").getValue();
            var sValidade = oView.byId("inputValidadeDoc").getValue();

            if (!sTipo || !sValidade) {
                MessageToast.show("Preencha o tipo e a data de validade.");
                return;
            }

            var aItems = oViewModel.getProperty("/documentos") || [];
            aItems.push({
                id: "doc_" + new Date().getTime(),
                tipo: sTipo,
                validadeFormatada: sValidade.split("-").reverse().join("/"),
                fileData: this._sCurrentFileBase64 || "",
                estado: "Success"
            });

            oViewModel.setProperty("/documentos", aItems);
            localStorage.setItem("ferias1000_docs", JSON.stringify(aItems));
            
            oView.byId("inputTipoDoc").setValue("");
            oView.byId("inputValidadeDoc").setValue("");
            oView.byId("fileDoc").clear();
            this._sCurrentFileBase64 = "";
            MessageToast.show("Documento arquivado!");
        },

        onSalvarReserva: function () {
            var oView = this.getView();
            var oViewModel = oView.getModel("view");
            var sPlat = oView.byId("selectPlataforma").getSelectedKey();
            var sNome = oView.byId("inputReservaNome").getValue();
            var sData = oView.byId("inputCheckin").getValue();

            if (!sNome || !sData) {
                MessageToast.show("Preencha o nome da acomodação.");
                return;
            }

            var aItems = oViewModel.getProperty("/reservas") || [];
            aItems.push({
                id: "res_" + new Date().getTime(),
                tipo: sPlat,
                nome: sNome,
                data: sData.split("-").reverse().join("/"),
                fileData: this._sCurrentFileBase64 || ""
            });

            oViewModel.setProperty("/reservas", aItems);
            localStorage.setItem("ferias1000_reservas", JSON.stringify(aItems));

            oView.byId("inputReservaNome").setValue("");
            oView.byId("fileReserva").clear();
            this._sCurrentFileBase64 = "";
            MessageToast.show("Reserva salva!");
        },

        onSalvarPassagem: function () {
            var oView = this.getView();
            var oViewModel = oView.getModel("view");
            var sPass = oView.byId("inputPassageiro").getValue();
            var sVoo = oView.byId("inputVoo").getValue();

            if (!sPass || !sVoo) {
                MessageToast.show("Insira o passageiro e o transporte.");
                return;
            }

            var aItems = oViewModel.getProperty("/passagens") || [];
            aItems.push({
                id: "pas_" + new Date().getTime(),
                passageiro: sPass,
                voo: sVoo,
                fileData: this._sCurrentFileBase64 || ""
            });

            oViewModel.setProperty("/passagens", aItems);
            localStorage.setItem("ferias1000_passagens", JSON.stringify(aItems));

            oView.byId("inputPassageiro").setValue("");
            oView.byId("inputVoo").setValue("");
            oView.byId("filePassagem").clear();
            this._sCurrentFileBase64 = "";
            MessageToast.show("Passagem integrada!");
        },

        onVerItem: function(oEvent) {
            var oItem = oEvent.getSource().getBindingContext("view").getObject();
            var sTitle = oItem.tipo || oItem.passageiro || "Visualizador";
            
            if (oItem.fileData && (oItem.fileData.startsWith("data:image") || oItem.fileData.startsWith("data:application"))) {
                var oDialog = new Dialog({
                    title: sTitle,
                    contentWidth: "95%",
                    contentHeight: "auto",
                    content: new Image({
                        src: oItem.fileData,
                        width: "100%"
                    }),
                    endButton: new Button({
                        text: "Fechar",
                        press: function () {
                            oDialog.close();
                        }
                    }),
                    afterClose: function() {
                        oDialog.destroy();
                    }
                });
                oDialog.open();
            } else {
                MessageBox.information(
                    "Informações do Registro:\n\n" + 
                    "Identificação: " + (oItem.tipo || oItem.passageiro) + "\n" +
                    "Detalhes: " + (oItem.nome || oItem.voo || "N/A") + "\n" +
                    "Data: " + (oItem.validadeFormatada || oItem.data || "N/A"),
                    { title: "Detalhamento Segurado PWA" }
                );
            }
        },

        onDeletarItem: function(oEvent) {
            var oButton = oEvent.getSource();
            var oContext = oButton.getBindingContext("view");
            var oItem = oContext.getObject();
            var sPath = oContext.getPath();
            var that = this;
            
            MessageBox.confirm("Remover permanentemente o registro de '" + (oItem.tipo || oItem.passageiro) + "'?", {
                title: "Confirmar Exclusão",
                onClose: function(sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        var oViewModel = that.getView().getModel("view");
                        var sListaNo = sPath.split("/")[1]; 
                        var aListaAtual = oViewModel.getProperty("/" + sListaNo) || [];
                        
                        var aListaFiltrada = aListaAtual.filter(function(item) {
                            return item.id !== oItem.id;
                        });

                        oViewModel.setProperty("/" + sListaNo, aListaFiltrada);
                        
                        var sStorageKey = "ferias1000_docs";
                        if (sListaNo === "reservas") sStorageKey = "ferias1000_reservas";
                        if (sListaNo === "passagens") sStorageKey = "ferias1000_passagens";
                        
                        localStorage.setItem(sStorageKey, JSON.stringify(aListaFiltrada));
                        MessageToast.show("Item removido.");
                    }
                }
            });
        },

        // ==========================================
        // ENTRADA DE COMANDO DE VOZ INTEGRADA
        // ==========================================
        onIniciarComandoVoz: function () {
            var oView = this.getView();
            var oBtnMic = oView.byId("btnMicrofone");
            var oTxtStatus = oView.byId("txtStatusVoz");
            var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            var that = this;
            
            if (!SpeechRecognition) {
                MessageToast.show("API de Voz inacessível.");
                return;
            }

            var recognition = new SpeechRecognition();
            recognition.lang = 'pt-BR';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            recognition.onstart = function() {
                if (oBtnMic) {
                    oBtnMic.setType("Negative").setText("Ouvindo...");
                }
            };

            recognition.onerror = function() {
                if (oBtnMic) {
                    oBtnMic.setType("Emphasized").setText("Falar Destino");
                }
                if (oTxtStatus) {
                    oTxtStatus.setText("Falha ao capturar áudio.");
                }
            };

            recognition.onresult = function(event) {
                if (oBtnMic) {
                    oBtnMic.setType("Emphasized").setText("Falar Destino");
                }
                
                var sTexto = event.results[0][0].transcript;
                sTexto = sTexto.replace(/\.$/, ""); // Tratamento para remover pontos finais automáticos
                
                if (oTxtStatus) {
                    oTxtStatus.setText("Buscando por: '" + sTexto + "'");
                }
                
                jQuery.ajax({
                    url: "https://nominatim.openstreetmap.org/search?format=json&q=" + encodeURIComponent(sTexto) + "&limit=1",
                    type: "GET",
                    success: function (data) {
                        if (data && data.length > 0) {
                            var fLat = parseFloat(data[0].lat);
                            var fLon = parseFloat(data[0].lon);
                            
                            // Extrai apenas o primeiro nome do local para evitar strings gigantes na UI
                            var sNome = data[0].display_name.split(',')[0];
                            
                            if (window.map) {
                                window.map.setView([fLat, fLon], 11);
                                if (window.currentMarker) {
                                    window.currentMarker.setLatLng([fLat, fLon]);
                                } else if (window.L) {
                                    window.currentMarker = window.L.marker([fLat, fLon]).addTo(window.map);
                                }
                            }
                            // Atualiza a temperatura fictícia coerente e os dados locais no modelo
                            that._atualizarClimaELugares(fLat, sNome);
                        } else {
                            MessageToast.show("Destino não encontrado no mapa.");
                        }
                    },
                    error: function() {
                        MessageToast.error("Erro de conectividade na API de Mapas.");
                    }
                });
            };

            recognition.start();
        }
    });
});
