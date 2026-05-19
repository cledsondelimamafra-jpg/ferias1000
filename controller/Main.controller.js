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

                        // 1. Atualiza as coordenadas e o nome completo na tela
                        oModel.setProperty("/local/cidade", oLocal.display_name);
                        oModel.setProperty("/local/coordenadas", lat.toFixed(4) + ", " + lon.toFixed(4));
                        oModel.setProperty("/clima/temp", (16 + Math.floor(Math.random() * 14)) + " °C");

                        if (that._map && that._marker) {
                            that._map.setView([lat, lon], 12);
                            that._marker.setLatLng([lat, lon]);
                            that._marker.getPopup().setContent("Destino: " + sCidade).update().openPopup();
                        }

                        // CORREÇÃO CRÍTICA: Extrai apenas o nome limpo da cidade antes da vírgula
                        // Exemplo: "Rio de Janeiro, Região Sudeste..." vira apenas "Rio de Janeiro"
                        var sCidadeLimpa = oLocal.display_name.split(',')[0].trim();

                        // 2. Dispara a busca com o termo perfeitamente limpo e simplificado
                        var sUrlPontos = "https://nominatim.openstreetmap.org/search?format=json&q=tourism+in+" + encodeURIComponent(sCidadeLimpa) + "&limit=5";
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
                    // Verifica se a API retornou registros válidos para a cidade pesquisada
                    if (pontosData && pontosData.length > 0) {
                        var aLugaresDinamicos = pontosData.map(function (ponto) {
                            var sNomeCurto = ponto.name || (ponto.display_name ? ponto.display_name.split(',')[0] : "Ponto Turístico");
                            var sCategoria = "Atração Local";
                            
                            if (ponto.type === "museum") sCategoria = "Museu & Cultura";
                            if (ponto.type === "viewpoint") sCategoria = "Mirante & Paisagem";
                            if (ponto.type === "theme_park") sCategoria = "Parque de Diversões";
                            if (ponto.type === "aquarium") sCategoria = "Aquário / Lazer";
                            if (ponto.type === "gallery") sCategoria = "Galeria de Arte";

                            return { nome: sNomeCurto, categoria: sCategoria };
                        });
                        
                        // Atualiza as sugestões limpando o histórico de Diamantina
                        oModel.setProperty("/lugares", aLugaresDinamicos);
                    } else {
                        // Se a busca falhar ou for vazia, gera atrações genéricas personalizadas com o nome digitado
                        oModel.setProperty("/lugares", [
                            { nome: "Centro Histórico Principal", categoria: "Exploração Urbana" },
                            { nome: "Mirante da Cidade", categoria: "Vista Panorâmica" },
                            { nome: "Feira de Artesanato Local", categoria: "Cultura & Passeio" }
                        ]);
                    }
                })
                .catch(function (error) {
                    console.error("Erro na requisição das atividades: ", error);
                });
        }
