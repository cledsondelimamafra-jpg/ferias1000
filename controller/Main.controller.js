sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("ferias1000.controller.Main", {

        onInit: function () {
            console.log("Main Controller operacional - Iniciando leitura das abas.");
            this._aMapMarkers = [];

            // 1. Tenta recuperar dados de cada chave do localStorage de forma independente
            var sDocumentosSalvos = localStorage.getItem("ferias1000_documentos");
            var sReservasSalvas = localStorage.getItem("ferias1000_reservas");
            var sPassagensSalvas = localStorage.getItem("ferias1000_passagens");

            // 2. Prepara a estrutura com os dados recuperados ou arrays vazios
            var oData = {
                local: { cidade: "Aguardando...", statusVoz: "Aguardando comando..." },
                clima: { temp: "--" },
                lugares: [],
                documentos: sDocumentosSalvos ? JSON.parse(sDocumentosSalvos) : [],
                reservas: sReservasSalvas ? JSON.parse(sReservasSalvas) : [],
                passagens: sPassagensSalvas ? JSON.parse(sPassagensSalvas) : []
            };

            // 3. Define o modelo na View com TwoWay binding ativo por padrão
            var oModel = new JSONModel(oData);
            oModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
            this.getView().setModel(oModel, "view");

            // Configuração do Speech Recognition nativo
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
            var oMapDomRef = this.getView().byId("map") ? this.getView().byId("map").getDomRef() : null;
            if (!oMapDomRef) { oMapDomRef = document.getElementById("map"); }

            if (oMapDomRef && !this._oMap) {
                this._oMap = L.map(oMapDomRef).setView([-14.2350, -51.9253], 4);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap'
                }).addTo(this._oMap);
                
                setTimeout(function() { this._oMap.invalidateSize(); }.bind(this), 400);
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
                setTimeout(function() { this._oMap.invalidateSize(); }.bind(this), 200);
            }
        },

        onFalarDestino: function () {
            if (this._oRecognition) {
                this._oRecognition.start();
                this.getView().getModel("view").setProperty("/local/statusVoz", "Ouvindo... Fale agora!");
            }
        },

        _onSpeechResult: function (oEvent) {
            var sCidade = oEvent.results[0][0].transcript.trim();
            if (sCidade.endsWith('.')) { sCidade = sCidade.slice(0, -1); }

            var oModel = this.getView().getModel("view");
            if (oModel) {
                oModel.setProperty("/local/cidade", sCidade);
                oModel.setProperty("/local/statusVoz", "Buscando por: '" + sCidade + "'");
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

                        this._oMap.setView([lat, lon], 13);
                        this._limparMarcadores();

                        var oMainMarker = L.marker([lat, lon]).addTo(this._oMap)
                            .bindPopup("<b>" + sCidade + "</b><br>Destino Ativo.").openPopup();
                        this._aMapMarkers.push(oMainMarker);

                        this._buscarClimaReal(lat, lon);
                        this._buscarPontosTuristicosAPI(lat, lon);
                    } else {
                        MessageToast.show("Cidade não localizada.");
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
                        oModel.setProperty("/clima/temp", weatherData.current_weather.temperature + " °C");
                    }
                }.bind(this));
        },

        _buscarPontosTuristicosAPI: function (lat, lon) {
            var oModel = this.getView().getModel("view");
            var sOverpassUrl = "https://overpass-api.de/api/interpreter?data=[out:json];node(around:8000," + lat + "," + lon + ")[tourism];out 15;";

            fetch(sOverpassUrl)
                .then(function (res) { return res.json(); })
                .then(function (data) {
                    var aLugaresMapeados = [];
                    if (data && data.elements && data.elements.length > 0) {
                        data.elements.forEach(function (elemento) {
                            if (elemento.tags && elemento.tags.name) {
                                var sCategoria = elemento.tags.tourism || "Atração Cultural";
                                if (sCategoria === "attraction") { sCategoria = "Ponto Turístico"; }
                                else if (sCategoria === "museum") { sCategoria = "Museu Histórico"; }
                                else if (sCategoria === "viewpoint") { sCategoria = "Mirante"; }

                                aLugaresMapeados.push({
                                    nome: elemento.tags.name,
                                    lat: elemento.lat,
                                    lng: elemento.lon,
                                    desc: sCategoria.toUpperCase()
                                });
                            }
                        });
                    }

                    if (aLugaresMapeados.length < 7) {
                        var names = ["Praça Central", "Monumento Histórico", "Igreja Matriz", "Mercado Público", "Parque Municipal"];
                        for (var i = 0; i < (7 - aLugaresMapeados.length); i++) {
                            aLugaresMapeados.push({ nome: names[i] || "Atração Local", lat: lat + (i * 0.003), lng: lon + (i * 0.003), desc: "PONTO TURÍSTICO" });
                        }
                    }

                    var aResultados = aLugaresMapeados.slice(0, 7);
                    oModel.setProperty("/lugares", aResultados);

                    aResultados.forEach(function (ponto) {
                        var oPino = L.marker([ponto.lat, ponto.lng]).addTo(this._oMap)
                            .bindPopup("<b>" + ponto.nome + "</b><br>" + ponto.desc);
                        this._aMapMarkers.push(oPino);
                    }.bind(this));
                }.bind(this))
                .catch(function () {
                    var fallback = [{ nome: "Ponto Turístico Central", lat: lat, lng: lon, desc: "VISITA OBRIGATÓRIA" }];
                    oModel.setProperty("/lugares", fallback);
                }.bind(this));
        },

        _limparMarcadores: function () {
            this._aMapMarkers.forEach(function (m) { this._oMap.removeLayer(m); }.bind(this));
            this._aMapMarkers = [];
        },

        onUploadArquivo: function (oEvent) {
            var oFileUploader = oEvent.getSource();
            var oFile = oEvent.getParameter("files")[0];
            var oBindingContext = oFileUploader.getBindingContext("view");

            if (!oFile) { return; }

            var oReader = new FileReader();
            oReader.onload = function (e) {
                var sBase64Result = e.target.result;
                var oModel = oBindingContext.getModel();
                var sPath = oBindingContext.getPath();

                oModel.setProperty(sPath + "/arquivoBase64", sBase64Result);
                oModel.setProperty(sPath + "/arquivoNome", oFile.name);
                MessageToast.show("Arquivo processado. Clique em 'Salvar' nesta aba para persistir.");
            };
            oReader.readAsDataURL(oFile);
        },

        onVisualizarArquivo: function (oEvent) {
            var oItem = oEvent.getSource().getBindingContext("view").getObject();
            var sDataUrl = oItem.arquivoBase64;

            if (sDataUrl) {
                var newWindow = window.open();
                if (newWindow) {
                    newWindow.document.write("<title>Visualizador - Férias 1000</title>");
                    if (sDataUrl.startsWith("data:application/pdf")) {
                        newWindow.document.write("<iframe width='100%' height='100%' style='border:none;' src='" + sDataUrl + "'></iframe>");
                    } else {
                        newWindow.document.write("<body style='margin:0; display:flex; justify-content:center; align-items:center; background:#222;'><img style='max-width:100%; max-height:100vh;' src='" + sDataUrl + "'/></body>");
                    }
                    newWindow.document.close();
                } else {
                    MessageToast.show("Por favor, desative o bloqueador de pop-ups.");
                }
            } else {
                MessageToast.show("Nenhum arquivo anexado.");
            }
        },

        /**
         * SALVAMENTOS INDIVIDUAIS POR ABA
         */
        onSalvarDocumentos: function () {
            var oModel = this.getView().getModel("view");
            if (oModel) {
                oModel.updateBindings(true); // Força atualização do estado das inputs
                var aDocumentos = oModel.getProperty("/documentos") || [];
                localStorage.setItem("ferias1000_documentos", JSON.stringify(aDocumentos));
                console.log("LocalStorage Atualizado (Documentos):", aDocumentos);
                MessageToast.show("Documentos salvos com sucesso!");
            }
        },

        onSalvarReservas: function () {
            var oModel = this.getView().getModel("view");
            if (oModel) {
                oModel.updateBindings(true);
                var aReservas = oModel.getProperty("/reservas") || [];
                localStorage.setItem("ferias1000_reservas", JSON.stringify(aReservas));
                console.log("LocalStorage Atualizado (Reservas):", aReservas);
                MessageToast.show("Reservas salvas com sucesso!");
            }
        },

        onSalvarPassagens: function () {
            var oModel = this.getView().getModel("view");
            if (oModel) {
                oModel.updateBindings(true);
                var aPassagens = oModel.getProperty("/passagens") || [];
                localStorage.setItem("ferias1000_passagens", JSON.stringify(aPassagens));
                console.log("LocalStorage Atualizado (Passagens):", aPassagens);
                MessageToast.show("Passagens salvas com sucesso!");
            }
        },

        /* GERENCIAMENTO DE LINHAS */
        onAdicionarDocumento: function () {
            var oModel = this.getView().getModel("view");
            var aLista = oModel.getProperty("/documentos") || [];
            aLista.push({ tipo: "", status: "", arquivoNome: "", arquivoBase64: "" });
            oModel.setProperty("/documentos", aLista);
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
        },

        onAdicionarReserva: function () {
            var oModel = this.getView().getModel("view");
            var aLista = oModel.getProperty("/reservas") || [];
            aLista.push({ hotel: "", periodo: "", arquivoNome: "", arquivoBase64: "" });
            oModel.setProperty("/reservas", aLista);
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
        },

        onAdicionarPassagem: function () {
            var oModel = this.getView().getModel("view");
            var aLista = oModel.getProperty("/passagens") || [];
            aLista.push({ voo: "", info: "", arquivoNome: "", arquivoBase64: "" });
            oModel.setProperty("/passagens", aLista);
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
        }
    });
});
