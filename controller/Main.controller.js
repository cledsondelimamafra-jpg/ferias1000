_buscarCidadeAPI: function (sCidade) {
            var oModel = this.getView().getModel("view");
            var that = this;

            // 1. Busca as coordenadas principais da cidade falada
            var sUrlCidade = "https://nominatim.openstreetmap.org/search?format=json&q=" + encodeURIComponent(sCidade);

            fetch(sUrlCidade, { headers: { 'Accept': 'application/json' } })
            .then(function (response) { return response.json(); })
            .then(function (data) {
                if (data && data.length > 0) {
                    var oLocal = data[0];
                    var lat = parseFloat(oLocal.lat);
                    var lon = parseFloat(oLocal.lon);

                    // Atualiza os dados principais na tela do SAPUI5
                    oModel.setProperty("/local/cidade", oLocal.display_name);
                    oModel.setProperty("/local/coordenadas", lat.toFixed(4) + ", " + lon.toFixed(4));
                    oModel.setProperty("/clima/temp", (16 + Math.floor(Math.random() * 14)) + " °C");

                    // Move dinamicamente o mapa e o marcador para as novas coordenadas reais
                    if (that._map && that._marker) {
                        that._map.setView([lat, lon], 12);
                        that._marker.setLatLng([lat, lon]);
                        that._marker.getPopup().setContent("Destino: " + sCidade).update().openPopup();
                    }

                    // 2. BUSCA DINÂMICA DE ATIVIDADES: Procura pontos turísticos reais perto dessas coordenadas
                    var sUrlPontos = "https://nominatim.openstreetmap.org/search?format=json&q=tourism+in+" + encodeURIComponent(sCidade) + "&limit=5";
                    
                    return fetch(sUrlPontos, { headers: { 'Accept': 'application/json' } });
                } else {
                    MessageToast.show("Cidade não encontrada no mapa.");
                    return null;
                }
            })
            .then(function (response) { 
                return response ? response.json() : null; 
            })
            .then(function (pontosData) {
                if (pontosData && pontosData.length > 0) {
                    // Mapeia os pontos turísticos retornados pela API real
                    var aLugaresDinamicos = pontosData.map(function(ponto) {
                        // Limpa o nome para não ficar gigantesco na lista
                        var sNomeCurto = ponto.name || ponto.display_name.split(',')[0];
                        
                        // Define uma categoria amigável baseada no tipo retornado
                        var sCategoria = "Ponto Turístico";
                        if (ponto.type === "museum") sCategoria = "Museu & Cultura";
                        if (ponto.type === "viewpoint") sCategoria = "Mirante & Paisagem";
                        if (ponto.type === "hotel") sCategoria = "Hospedagem";
                        if (ponto.type === "attraction") sCategoria = "Atração Local";

                        return {
                            nome: sNomeCurto,
                            categoria: sCategoria
                        };
                    });

                    // Alimenta a lista do XML com os dados vivos obtidos
                    oModel.setProperty("/lugares", aLugaresDinamicos);
                } else {
                    // Fallback amigável caso a cidade seja muito pequena e não tenha pontos mapeados
                    oModel.setProperty("/lugares", [
                        { nome: "Centro da Cidade", categoria: "Exploração Urbana" },
                        { nome: "Praça Central", category: "Passeio Local" }
                    ]);
                }
            })
            .catch(function (error) {
                console.error("Erro na busca: ", error);
                MessageToast.show("Erro ao conectar com o serviço de informações.");
            });
        }
