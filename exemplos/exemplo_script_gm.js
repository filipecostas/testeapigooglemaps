//posição inicial como Av. Paulista
var latitude = -23.5588622;
var longitude = -46.65902449999999;

//Localização de agências na mooca
//var latitude = -23.550295;
//var longitude = -46.588390;

var dragOn = true;

//variaveis do mapa
var map;
var marcadorUsuario;
var marcadorPontos = new Array();
var zoom = 17;

//Caixa de informações
var myOptions = {
         disableAutoPan: false
         ,maxWidth: 0
         ,pixelOffset: new google.maps.Size(-100, -200)
         ,zIndex: null
         ,boxStyle: { 
           background: 'url("/_arquivosestaticos/Itau/img/marcadorCinza.png") no-repeat scroll 0 0 transparent'
           ,opacity: 0.95
           /*,width: "280px"*/
          }
         ,closeBoxMargin: "12px 10px 2px 2px"
         ,closeBoxURL: "/_arquivosestaticos/Itau/img/btnFecharInfo.png"
         ,infoBoxClearance: new google.maps.Size(1, 1)
         ,isHidden: false
         ,pane: "floatPane"
         ,enableEventPropagation: false
 };

 var infoBox = new InfoBox(myOptions);

$(document).ready(function() {

		$.ajaxSetup({
		error:function(x,e){
			if(x.status==0){
			alert('You are offline!!\n Please Check Your Network.');
			}else if(x.status==404){
			alert('Requested URL not found.');
			}else if(x.status==500){
			alert('Internel Server Error.');
			}else if(e=='parsererror'){
			alert('Error.\nParsing JSON Request failed.');
			}else if(e=='timeout'){
			alert('Request Time out.');
			}else {
			alert('Unknow Error.\n'+x.responseText);
			}
			}	
		});

	//insere eventos nos elementos
	$('input[name=filtroCaixas]').change(validaFiltro);
	$('input[name=filtroItau]').change(validaFiltro);
	$('input[name=filtroUniclass]').change(validaFiltro);
	$('input[name=filtroPers]').change(validaFiltro);
	$('input[name=filtroEmpresas]').change(validaFiltro);	
	$('input[name=filtroDisp]').change(validaFiltro);
	
	$('#local_search').keypress();
	
	//$('.setaDown a').click(mostraFiltro);
	//$('.setaUp a').click(escondeFiltro);
	
	$('.setaDown a').click(function(){	
		if(($('.setaDown a').text().indexOf("Exibir")) != -1){
			mostraFiltro();
		}else{
			escondeFiltro();
		}
	});
	
	$('.setaUp').hide();

	
	$('#localizadorThumb').one('click', function(){
		setTimeout(geoLocalizar, 800)
	});
	
	//tamanha da coluna esquerda + 10px padding
	//$('.contentSelectSearch').height(196);
	
	resizeMap();
	$(window).resize(resizeMap);
	
		$('input[name=filtroCaixas]').click(function() {
			buscarAgenciasProximas(true);
		});
		$('input[name=filtroItau]').click(function() {
			buscarAgenciasProximas(true);
		});
		$('input[name=filtroPers]').click(function() {
			buscarAgenciasProximas(true);
		});
		$('input[name=filtroEmpresas]').click(function() {
			buscarAgenciasProximas(true);
		});
		$('input[name=filtroDisp]').click(function() {
			buscarAgenciasProximas(true);
		});
});

var resizeMap = function() {
	var height = $(window).height() - $('#header').height();
	$('#itau_mapa').css('height', height);
};

var criarMap = function() {

	//cria o mapa
	var opcoes = {
        zoom: zoom,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
	map = new google.maps.Map(document.getElementById('itau_mapa'), opcoes);

    map.setZoom(zoom);
    map.setCenter(new google.maps.LatLng(latitude, longitude));
	
	google.maps.event.addListener(map, 'dragend', function() {
		if(dragOn) {
			//Ao terminar de arrastar, atualiza lat e lng para o novo centro do mapa e busca as agencias proximas
			latitude = map.getCenter().lat();
			longitude = map.getCenter().lng();
			buscarAgenciasProximas(false); 
		}
	});
}

var inserePontoMarcador = function (map, latitude, longitude, titulo, conteudo, imagem) {
    var marcador = new google.maps.Marker({
        position: new google.maps.LatLng(latitude, longitude),
        map: map,
        icon: imagem,
        title: titulo
    });

//    if (imagem)
//        marcador.icon = imagem;

    return marcador;
}

var inserePonto = function(map, latitude, longitude, titulo, conteudo, imagem, buscaPorAgencia) {
    var marcador = new google.maps.Marker({
        position: new google.maps.LatLng(latitude, longitude),
        map: map,
        icon: imagem,
        title: titulo
    });

//    if (imagem)
//        marcador.icon = imagem;

    google.maps.event.addListener(marcador, 'click', function() {
        infoBox.setContent(conteudo);
        infoBox.open(map, marcador);
    });

    if (buscaPorAgencia) {
        infoBox.setContent(conteudo);
        infoBox.open(map, marcador);
    }

    return marcador;
}

var insereAgencias = function (agencias, buscaPorAgencia) {

    for (var i = 0; i < agencias.length; i++) {

        if (agencias[i]) {

            var agencia = agencias[i];

            var titulo = '';
            var endereco = '';
			var cep = '';
			var cidade = '';
			var ddd = '';
			var telefone = '';
			var maskTel = '';
			var fax = '';	
			var maskFax = '';		
            var funcionamento = '';
            var mensagem = '';
            var atendimento = '<p class="pTel"><strong>Atendimento:</strong></p><ul class="pTel">';
            var mostrarAtendimento = false;

            if (agencia.Id != '' && agencia.Id != undefined)
                titulo = agencia.Id + ' - ' + agencia.Nome;
            else
                titulo = agencia.Nome;

            if (agencia.Endereco != '' && agencia.Endereco != undefined)
                endereco = agencia.Endereco;

            if (agencia.Cep != '' && agencia.Cep != undefined) {
                cep = agencia.Bairro + ' | ' + 'CEP: '  + agencia.Cep;
			}

            if (agencia.Cidade != '' && agencia.Cidade != undefined) {
                cidade = agencia.Cidade + ' - ' + agencia.Uf;
			}
			
            if (agencia.Telefone != '' && agencia.Telefone != undefined) {
                telefone = agencia.Telefone;	
				ddd = agencia.DDD				
				if(telefone.length == 8){
			    maskTel = '<strong>Telefone:</strong> ' + '(' + ddd.substring(2,4) + ') ' + telefone.substring(0,4) + "-" + telefone.substring(4,8);
				}else{
			    maskTel = '<strong>Telefone:</strong> ' + '(' + ddd.substring(2,4) + ') ' + telefone.substring(0,5) + "-" + telefone.substring(5,9);
				};
            }

            if (agencia.Fax != '' && agencia.Fax != undefined) {
                fax = agencia.Fax;						
				ddd = agencia.DDD				
				if(fax.length == 8){
			    maskFax = '<strong>Fax:</strong> ' + '(' + ddd.substring(2,4) + ') ' + fax.substring(0,4) + "-" + fax.substring(4,8);
				}else{
			    maskFax = '<strong>Fax:</strong> ' + '(' + ddd.substring(2,4) + ') ' + fax.substring(0,5) + "-" + fax.substring(5,9);
				};			
            }
			
            if (agencia.Abertura != '' && agencia.Fechamento != undefined && agencia.Fechamento != '' && agencia.Fechamento != undefined) {
                funcionamento = "<strong>Funcionamento:</strong> " + agencia.Abertura + " às " + agencia.Fechamento;
            }

            if (agencia.Mensagem != '' && agencia.Mensagem != undefined) {
                mensagem = agencia.Mensagem;
            }

            if (agencia.Segmento == 'UBB') {
                atendimento = atendimento + '<li>Uniclass</li>';
                mostrarAtendimento = true;
            }

            if (agencia.AtendePJ == true) {
                atendimento = atendimento + '<li>Empresas</li>';
                mostrarAtendimento = true;
            }

            if (agencia.CaixaEletronico != null) {
                atendimento = atendimento + '<li>Caixa Eletrônico</li>';
                if (agencia.CaixaEletronico.PossuiDispensador == true) {
                    atendimento = atendimento + '<li>Dispensador de Cheques</li>';
                }

                mostrarAtendimento = true;
            }

            var info =
				'<div style="height: 137px; margin-top: 8px; padding: 10px; width: 200px;">' +
					'<p class="pTitulo">' + titulo + '</p>' +
					'<p class="pTel">' + endereco + '<bp>' +
					'<p class="pTel">' + cep + '</p>' +
					'<p class="pTel">' + cidade + '</p>' +
					'<p class="pTel">' + maskTel + '</p>' +
					'<p class="pTel">' + maskFax + '</p>' +
					'<p class="pTel">' + funcionamento + '</p>';

            if (mensagem != '') {
                info = info + '<p class="pTel">' + mensagem + '</p>';
            }

            if (mostrarAtendimento)
                info = info + '</ul>' + atendimento;

            info = info + '</div>';

            var image = agencia.Imagem;

            if (image == "buscaItau.png") {
                image = "/_arquivosestaticos/Itau/img/logo-search-itau-trans.png";
            }
            else if (image == "buscaPers.png") {
                image = "/_arquivosestaticos/Itau/img/logo-search-pers-trans.png";
            }

            marcadorPontos[marcadorPontos.length] = inserePonto(map, agencias[i].Latitude, agencias[i].Longitude, agencias[i].Nome, info, image, buscaPorAgencia);
        }
    }
}

var insereCaixas = function(caixas) {

    for (var i = 0; i < caixas.length; i++) {
	
        if (caixas[i]) {
			
			var caixa = caixas[i];
		
			var titulo;
			var endereco;
			var telefone;
				
			titulo = caixa.Nome;
			
			if(caixa.Endereco != '' && caixa.Endereco != undefined)
				endereco = caixa.Endereco + ' - ' + caixa.Bairro;
		
            var info =
				'<div id="dvInfoWindow" style="height: 137px; margin-top: 8px; padding: 10px; width: 200px;">' +
					'<p class="pTitulo">' + titulo + '</p>' +
					'<p class="pEndereco">' + endereco + '</p>';
			
			var image = "/_arquivosestaticos/Itau/img/logo-search-caixas-trans.png";
			
			if(caixa.PossuiDispensador == true) {
				info = info + "<p>*Possui dispensador de cheques</p>";
				image = "/_arquivosestaticos/Itau/img/logo-search-cheques-trans.png";
			}
			info = info + '</div>';
						
            marcadorPontos[marcadorPontos.length] = inserePonto(map, caixa.Latitude, caixa.Longitude, caixa.Nome, info, image, false);
        }
    }
}

var removerPontos = function() {
    for (var i = 0; i < this.marcadorPontos.length; i++) {
        if (marcadorPontos[i])
            this.marcadorPontos[i].setMap(null);
    }
};

var centralizarMap = function(ponto, removerMarcador) {
	var latLng;

	if (ponto)
		latLng = ponto;
	else
		latLng = new google.maps.LatLng(latitude, longitude);
	
	if(!removerMarcador && marcadorUsuario) {
		marcadorUsuario.setPosition(latLng);
		marcadorUsuario.setMap(map);
	}
	else {
		if(marcadorUsuario)
			marcadorUsuario.setMap(null);
	}
	
	map.setCenter(latLng);
	map.setZoom(zoom);
};

//Procura as agências próximas
//mostrarMsg: define se a mensagem de que nenhuma agencia foi encontrada deve ou não ser exibida. No caso do dragend, nenhuma mensagem deve ser mostrada.
var buscarAgenciasProximas = function(mostrarMsg) {
	dragOn = true;
	if(validaFiltro() == false)
		return;

	var filtroCaixas = $('input[name=filtroCaixas]:checked').length > 0 ? true : false;
	var filtroDisp = $('input[name=filtroDisp]:checked').length > 0 ? true : false;
	var filtroItau = $('input[name=filtroItau]:checked').length > 0 ? true : false;
	var filtroUniclass = $('input[name=filtroUniclass]:checked').length > 0 ? true : false;
	var filtroPers = $('input[name=filtroPers]:checked').length > 0 ? true : false;
	var filtroEmpresas = $('input[name=filtroEmpresas]:checked').length > 0 ? true : false;
	
    $.ajax({
		url: 'http://ww16.itau.com.br/ws/BuscadorAgencias.asmx/BuscaAgencias?' +
				'lati=' + latitude + 
				'&longi=' + longitude + 
				'&filtroCaixas=' + filtroCaixas +
				'&filtroDisp=' + filtroDisp + 
				'&filtroItau=' + filtroItau + 
				'&filtroUniclass=' + filtroUniclass + 
				'&filtroPers=' + filtroPers +
				'&filtroEmpresas=' + filtroEmpresas,
        cache: false,
        dataType: 'jsonp',
        crossDomain: true,
        timeout: 5000,
        success: function(ret) {
			try {				
				//Recebe Objeto com uma lista de agências na posição 0 e uma lista de caixas eletrônicos na posição 1
				var agencias = ret.d[0];
				var caixas = ret.d[1];
				
				//Remove pontos da busca anterior				
				removerPontos();
				
				//insere agências no mapa
				if (agencias != null)
				    insereAgencias(agencias, false);
					
				//insere caixas eletrônicos no mapa
				if (caixas != null)
					insereCaixas(caixas);
					
				if(agencias == null && caixas == null) {
					if(mostrarMsg) {
						mostrarErro('Nenhuma agência ou caixa eletrônico próximo foi encontrado.');
					}
				}
			}
			catch (exception) {
				if(mostrarMsg)
					mostrarErro('Ocorreu um erro ao buscar as agências próximas.');
			}
        },
        error: function(e) {
			if(mostrarMsg)
				mostrarErro('Ocorreu um erro ao buscar as agências próximas.');
        }
    });
}

//Abre box
var AbrirBox = function(){
	$('#contentCaixaExterior').css('display','block');
}

var FecharBox = function(){
	$('#contentCaixaExterior').css('display','none');
}

//Busca agência por número
var buscaAgencia = function(numero) {

		dragOn = false;
		
		$('.alert').hide();
		$('.suggestSearch').empty();
		$('.suggestSearch').hide('normal');
		
	    $.ajax({
		url: 'http://ww16.itau.com.br/ws/BuscadorAgencias.asmx/BuscaAgenciaPorNumero?' + 'numero=' + numero,
        cache: false,
        dataType: 'jsonp',
        crossDomain: true,
        success: function(ret) {
			try {
				var agencia = ret.d;
				if (agencia != null) {
					
					//Posição inválida
					/*if(agencia.Latitude == 0) {
						mostrarErro('Agência não encontrada.');
						return;
					}*/

				    if (agencia.Longitude === 0 || agencia.Latitude === 0) {
				        var geo = new google.maps.Geocoder();
				        geo.geocode(
                            {
                                'address': agencia.Endereco + ', ' + agencia.Cidade
                            },
                            function (response, status) {
                                if (status == google.maps.GeocoderStatus.OK) {
                                    if (response.length > 1) {
                                        agencia.Latitude = 0;
                                    }
                                    else {
                                        agencia.Longitude = response[0].geometry.location.lng();
                                        agencia.Latitude = response[0].geometry.location.lat();
                                    }

                                    if (agencia.Latitude === 0) {
                                        mostrarErro('Agência não encontrada');
                                        return;
                                    }

                                    //Remove pontos da busca anterior				
                                    removerPontos();

                                    //insere a agencia encontrada
                                    insereAgencias([agencia], true);

                                    var latLng = new google.maps.LatLng(agencia.Latitude, agencia.Longitude);

                                    //O Marcador de localização do usuário não deve ser mostrado
                                    var removerBuscador = true;

                                    centralizarMap(latLng, removerBuscador);
                                }
                            }
                        );
				    } else {

				        //Remove pontos da busca anterior				
				        removerPontos();

				        //insere a agencia encontrada
				        insereAgencias([agencia], true);

				        var latLng = new google.maps.LatLng(agencia.Latitude, agencia.Longitude);

				        //O Marcador de localização do usuário não deve ser mostrado
				        var removerBuscador = true;

				        centralizarMap(latLng, removerBuscador);
				    }
				}
				else {
					mostrarErro('Agência não encontrada.');
				}
			}
			catch (exception) {
				mostrarErro('Ocorreu um erro ao localizar a agência.');
			}
        },
        error: function(e) {
            mostrarErro('Ocorreu um erro ao localizar a agência.');
        }
    });
}

var buscaEndereco = function(form) {

	$('.alert').hide();
	$('.suggestSearch').empty();
	$('.suggestSearch').hide('normal');
	
    var geocoder = new google.maps.Geocoder();
	var address = $('#local_search').val();

	//if (!isNumber(address, ' ') && !isNumber(address, ',') && !isNumber(address, '-'))
	//	address += ', 10';
	
    geocoder.geocode({ 'address': address, 'region': 'br'}, function(response, status) {
        if (status == google.maps.GeocoderStatus.OK) {
			
			 if (response.length > 1) {
				//encontrou mais de um endereço na busca
				vcQuisDizer(response);				
			 }
			 else {
				//encontrou apenas um endereço na busca
				latitude = response[0].geometry.location.lat();
				longitude = response[0].geometry.location.lng();
				
				if (!marcadorUsuario)  {
					//Insere usuário no mapa
				    //marcadorUsuario = inserePonto(map, latitude, longitude, '', '', new google.maps.MarkerImage('/_arquivosestaticos/Itau/img/user_markAzul.png', new google.maps.Size(133, 96), new 	google.maps.Point(0, 0), new google.maps.Point(80, 96)));
				    marcadorUsuario = inserePontoMarcador(map, latitude, longitude, '', '', new google.maps.MarkerImage('/_arquivosestaticos/Itau/img/user_markAzul.png', new google.maps.Size(133, 96), new google.maps.Point(0, 0), new google.maps.Point(80, 96)));
				}
				
				//Buscar agências
				centralizarMap();
				buscarAgenciasProximas(true);
			}
        }
		//não encontrou nenhum resultado 
        else 
            mostrarErro('Não foi possível encontrar o endereço.');
    });
}

var vcQuisDizer = function(data) {
	
	escondeFiltro();
	ajustarCaixa();
	
	$('.suggestSearch').append('<p class="tit">Você quis dizer:</p> <ul>');
	
	for (var i = 0; i < data.length; i++) {
	
		$('.suggestSearch ul').append('<li><a id="opcaoEnd'+ i +'" href="#">' + data[i].formatted_address +'</a></li>');
		
		$('#opcaoEnd'+i).click(function (event) {
			var i = event.currentTarget.id.substring(8);
			
			latitude = data[i].geometry.location.lat();
			longitude = data[i].geometry.location.lng();
			
			//Limpa e esconde a caixa de busca por endereço
			$('.suggestSearch').stop(true, true).slideUp('normal');
			$('.suggestSearch').empty();
			
			centralizarMap();
			buscarAgenciasProximas(true);
			
			centralizarCaixa();
		});
	}
	
	$('suggestSearch ul').next('</ul>');
	
	
	$('.suggestSearch').stop(true, true).slideDown('normal');
}

//centraliza caixa de busca
var centralizarCaixa = function() {
	$('.contentLocalizador').stop(true, true).animate({
		top: '70%'
	}, 500);
}

//ajusta caixa de busca para caber os filtros e você 
var ajustarCaixa = function() {
	$('.contentLocalizador').stop(true, true).animate({
		top: '25%'
	}, 500);
}

/*var mostraFiltro = function() {
	$('.setaDown').hide();
	$('.contentSelectSearch').stop(true, true).slideDown();
	ajustarCaixa();
	
	//Fecha caixa de endereços, se estiver aberta
	$('.suggestSearch').hide('normal');
	$('.suggestSearch').empty();
}

var escondeFiltro = function() {
	$('.contentSelectSearch').stop(true, true).slideUp();
	$('.setaDown').show();
	centralizarCaixa();
}*/

var mostraFiltro = function() {
	$('.setaDown a').text("Fechar filtros");
	$('.contentSelectSearch').stop(true, true).slideDown();
	ajustarCaixa();
	
	//Fecha caixa de endereços, se estiver aberta
	$('.suggestSearch').hide('normal');
	$('.suggestSearch').empty();
}

var escondeFiltro = function() {
	$('.contentSelectSearch').stop(true, true).slideUp();
	$('.setaDown a').text("Exibir filtros");
	centralizarCaixa();
}

function isNumber(val, del) {
	var arr = val.split(del);
	for (var i = 0; i < arr.length; i++)
		if (!isNaN(arr[i].replace(/\s/g, ""))) 
			return true;
			
	return false;
}

var trataEnter = function(form, evento) {
	var keyCode = 0;
	
	if(evento)
		keyCode = evento.keyCode;
		
    if (keyCode == 13) {
		//var valor = form.local_search.value;
		var valor = $('#local_search').val();		
		
		valor = $.trim(valor);
				
		//busca por CEP: 4 digitos, somente numeros
		if(valor.length == 4 && !isNaN(valor))
			buscaAgencia(valor); //Busca agencia pelo endereco
		else
			//busca por endereco
			buscaEndereco(form); //Busca endedereco pelo nro da agencia
	}

    return true;
}

var validaFiltro = function() {	

	var filtroCaixas = $('input[name=filtroCaixas]:checked').length > 0 ? true : false;
	var filtroDisp = $('input[name=filtroDisp]:checked').length > 0 ? true : false;
	var filtroItau = $('input[name=filtroItau]:checked').length > 0 ? true : false;
	var filtroUniclass = $('input[name=filtroUniclass]:checked').length > 0 ? true : false;
	var filtroPers = $('input[name=filtroPers]:checked').length > 0 ? true : false;
	var filtroEmpresas = $('input[name=filtroEmpresas]:checked').length > 0 ? true : false;
	
	//se todos os checkboxs do filtro estiverem desmarcados, desabilita caixa de busca e exibe mensagem de erro.
	if(!filtroCaixas && !filtroDisp && !filtroItau && !filtroUniclass && !filtroPers && !filtroEmpresas) {
		$('#local_search').prop('disabled', true);
		$('#alert').empty();
		$('#alert').append('<p>Ao menos uma opção precisa estar selecionada</p>');
		//$('.alert').text('Ao menos uma opção precisa estar selecionada');
		$('.alert').show();
		
		return false;
	}
	else {
		$('#local_search').prop('disabled', false);
		$('.alert').hide();
	}
	
	return true;
}

var mostrarErro = function (text) {
	var msgErro = "<p>" + text + "</p>";
	//$('alert').text(text);
	$('#alert').empty();
	$('#alert').append(msgErro);
	$('.alert').show();
}

var geoLocalizar = function() {
			
	criarMap();

	//Buscar agências
	centralizarMap();
	buscarAgenciasProximas(true);
	
	//verifica se o browser suportar geolocalização
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(
			function(position) {
					
				//Insere usuário no mapa
				if(!marcadorUsuario)
					//marcadorUsuario = inserePonto(map, latitude, longitude, '', '', new google.maps.MarkerImage('/_arquivosestaticos/Itau/img/user_markAzul.png', new google.maps.Size(133, 96), new 	google.maps.Point(0, 0), new google.maps.Point(80, 96)));
				    marcadorUsuario = inserePontoMarcador(map, latitude, longitude, '', '', new google.maps.MarkerImage('/_arquivosestaticos/Itau/img/user_markAzul.png', new google.maps.Size(133, 96), new google.maps.Point(0, 0), new google.maps.Point(80, 96)));
				    
				//centraliza o mapa na posição do dispositivo
				latitude = position.coords.latitude;
				longitude = position.coords.longitude;
				centralizarMap();
				buscarAgenciasProximas(true);
			},
			function(errorCode) {
				//ocorreu um erro ao tentar obter a localização do dispositivo. Centraliza mapa na Av. Paulista.

				centralizarMap();
				buscarAgenciasProximas(true);
			}
		);
	}
	else {
		
		$('.contentLocalizador').stop(true, true).animate({
			top: '50%'
		}, 500);
	
		$('.suggestSearch').append('<p class="tit">Digite aqui o endereço ou CEP onde você deseja localizar agências e caixas do Itaú. Se preferir, digite o número da agência.</p><ul>');
		$('.suggestSearch').show('normal');
	}
};