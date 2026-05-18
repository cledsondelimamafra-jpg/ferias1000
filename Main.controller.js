_inicializarMapaLeaflet: function () {
            // 1. Se a biblioteca Leaflet ainda não foi carregada globalmente, espera mais um pouco
            if (typeof window.L === "undefined") {
                setTimeout(this._inicializarMapaLeaflet.bind(this), 300);
                return;
            }
            
            // 2. Se o mapa já foi criado antes, não faz nada para não duplicar
            if (this._oMapaInstance) { return; }

            // 3. Cledson: Aqui está o segredo! Verificamos se a DIV do mapa já apareceu fisicamente na tela
            var oContainerHtml = document.getElementById("mapa_container");
            if (!oContainerHtml) {
                // Se a DIV ainda não foi renderizada pelo SAPUI5, aguarda 200ms e tenta novamente
                setTimeout(this._inicializarMapaLeaflet.bind(this), 200);
                return;
            }

            try {
                // 4. Se a DIV existe, inicializa o mapa Leaflet com segurança
                this._oMapaInstance = window.L.map('mapa_container').setView([-14.2350, -51.9253], 4);
                window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap'
                }).addTo(this._oMapaInstance);

                // Força o Leaflet a recalcular o tamanho e se desenhar corretamente
                setTimeout(function() {
                    if (this._oMapaInstance) { this._oMapaInstance.invalidateSize(); }
                }.bind(this), 400);

                var that = this;
                this._oMapaInstance.on('click', function(e) {
                    that._buscarDadosPorCoordenadas(e.latlng.lat, e.latlng.lng);
                });
            } catch (e) {
                console.error("Erro ao iniciar o mapa Leaflet: ", e);
            }
        },
