fnde = {
    flag : false,     
    init : function () {
        document.addEventListener("deviceready", fnde.onDeviceReady, false);
    },
    orientation: function () {
      return (window.innerHeight > window.innerWidth); //portrait;            
    },
    onDeviceReady: function() {
        cordova.plugins.certificates.trustUnsecureCerts(true)
         
        $("#progresso").hide();
        $("#detalhar").hide();
        if (!fnde.utils.isEmpty(fnde.utils.get('cpf'))) {
            $("#cpf").val(fnde.utils.get('cpf'))
            fnde.buscarPessoa();
        }
        $("#cpf").focus();
        $( "#cpf" ).keydown(function( event ) {
            if ( event.which == 13 ) {
                event.preventDefault();
            }
        });
        $("#consultar").click(function() {
            fnde.buscarPessoa();
        })
        $("#exec-detalhar").click(function() {
            fnde.detalharPagamentos();
        })                 
        
        window.onresize = function(){  fnde.onChangeOrientation(); }
        
        navigator.splashscreen.hide();
    },
    onChangeOrientation: function() {
           if (fnde.flag) {
                fnde.detalharPagamentos()
            }
    },
    buscarPessoa: function() {
                    $("#progresso").hide();
                    $("#detalhar").hide();
                    fnde.flag = false;
                    cpf = $("#cpf").val()
                    if (cpf.length === 11) {
                            $("#progresso").show();
                            $("#progresso").html('<br /><div class="progress"><div class="progress-bar" style="width: 25%;"></div></div>');
                            $.get( "https://www.fnde.gov.br/digef/rs/spba/publica/pessoa/1/10/"+cpf, function( data ) {
                                $("#progresso").html('<br /><div class="progress"><div class="progress-bar" style="width: 50%;"></div></div>');
                                pessoas = data.pessoas[0]                                
                                if (pessoas != null) {
                                    fnde.utils.set('cpf',$("#cpf").val())
                                    fnde.utils.set(''+$("#cpf").val(),'true')
                                    fnde.utils.set('pessoas',pessoas)
                                    $("#conteudo").html('<h5>'+pessoas.nome+'</h5> Procurando pagamentos...')
                                    fnde.buscarPagamentos(pessoas.hash)
                                } else {
                                    if (fnde.utils.get($("#cpf").val()) == 'true') {
                                        fnde.buscarPessoa();
                                    } else {
                                        $("#progresso").html('<br /><div class="progress"><div class="progress-bar" style="width: 100%;"></div></div>');
                                        $("#conteudo").html('<h5>Nenhum registro encontrado</h5>Tente novamente! <br />Este resultado pode ser devido a uma falha de comunicação com o FNDE.');
                                    }
                                }
                        }).fail(function() {
                                fnde.utils.alert("Erro de comunicação.")
                        });
                    } else {
                        $("#conteudo").html('<h5>Dados incompletos</h5>');
                        $("#cpf").focus();
                    }
    },
    buscarPagamentos: function(hash) {
             $("#progresso").html('<br /><div class="progress"><div class="progress-bar" style="width: 75%;"></div></div>');
             $.get( "https://www.fnde.gov.br/digef/rs/spba/publica/pagamento/"+hash, function( data ) {
                     $("#progresso").html('<br /><div class="progress"><div class="progress-bar" style="width: 100%;"></div></div>');                     
                     pagamentos = JSON.stringify(data)                     
                     pagamentos = pagamentos.split('pagamentos":[');        
                     pagamentos_new = '[';            
                     for (xy = 1; xy < pagamentos.length; xy++ ) {                  
                        pagamentos_xy = pagamentos[xy]
                        pagamentos_xy = pagamentos_xy.split(']');
                        pagamentos_xy = pagamentos_xy[0]
                        pagamentos_new += pagamentos_xy;
                        if ((pagamentos.length > 2) && (xy < (pagamentos.length-1))) {
                            pagamentos_new += ','  
                        } else {
                            pagamentos_new += ']';
                        }
                     }
                     fnde.utils.set('pagamentos',pagamentos_new)
                     fnde.utils.set('_dados',data)
                     if (!fnde.utils.isEmpty(data.nome)) {
                         $("#conteudo").html('<h5>'+data.nome+'</h5><hr><h5>R$ '+fnde.utils.vireReais(data.total)+'</h5>')
                         $("#detalhar").show();
                     } else {
                         $("#conteudo").html('<h5>Nenhum registro encontrado</h5>');                         
                     }
             }).fail(function() {
                   fnde.utils.buscarPagamentos(hash);
             });

    },
    detalharPagamentos: function() {
        $("#detalhar").hide();
        $("#progresso").hide();
        dados = fnde.utils.get('_dados');
        html = '<h5>'+dados.nome+'</h5><hr><h5>R$ '+fnde.utils.vireReais(dados.total)+'</h5>';
        pagamentos = fnde.utils.get('pagamentos')
        v = JSON.parse(pagamentos)
        if (v.length>0) {
            fnde.flag = true;            
            try {                                
                if (fnde.orientation()) {
                    html += '<table align="center" style="text-align:center;">';
                    html += '<tr><td style="font-weight: bold;">Ref.</td><td style="font-weight: bold;">Valor</td></tr>'
                    for (x = 0;x < v.length;x++) {
                            html += '<tr>';
                            html += '<td style="font-weight: bold;">';
                            html += v[x].referencia;
                            html += '</td>';
                            html += '<td>';
                            html += 'R$ '+fnde.utils.vireReais(v[x].valor);
                            html += '</td>';
                            html += '</tr>';
                    }
                    html += "</table>"
                    html += "<br />Gire a tela para obter mais informações"
                } else {
                    html += '<table align="center" style="text-align:center;">';
                    html += '<tr><td style="font-weight: bold;">Ref.</td><td style="font-weight: bold;">Valor</td><td style="font-weight: bold;">Pagamento</td><td style="font-weight: bold;">OP</td></tr>'
                    for (x = 0;x < v.length;x++) {
                            html += '<tr>';
                            html += '<td style="font-weight: bold;">';
                            html += v[x].referencia;
                            html += '</td>';
                            html += '<td>';
                            html += 'R$ '+fnde.utils.vireReais(v[x].valor);
                            html += '</td>';
                            html += '<td>';
                            html += v[x].data;
                            html += '</td>';
                            html += '<td>';
                            html += v[x].ordermBancaria;
                            html += '</td>';
                            html += '</tr>';                                       
                    }                    
                    html += "</table>"
                    html += "<br />"
                }
            } catch (e) { }
            $("#conteudo").html(html)
        } else {
            html += "Nenhum pagamento encontrado."
            $("#conteudo").html(html)
        }
    }
}

fnde.utils = {
    isEmpty: function ( el ) {
        return !$.trim(el);
    },
    alert: function (msg) {
        try {
            if (cordova.platformId == 'browser') {
                window.alert(msg);   
            } else {
                navigator.notification.alert(
                    msg,  // message
                    null,         // callback
                    'Alerta',            // title
                    'OK'                  // buttonName
                );
            }  
        } catch (e) { }

    },
    get: function(x) {
        x = window.localStorage.getItem( x );
        return JSON.parse(x);
    },
    set: function(x,y) {
        y = JSON.stringify(y);
        window.localStorage.setItem(x, y);
    },
    del: function(x) {
        window.localStorage.removeItem(x);
    },
    porVirgula: function (x) {
        return x.toString().replace(/\./g,',')
    },
    fixButton: function(button) {
        if (cordova.platformId == 'browser') {
            if (button == 1) {
                button = 2
            } else {
                button = 1
            }
        }
        return button
    },
    vireReais: function (valor) {
        try  {
            k = valor.toString().replace(/\,/g,'.').replace(/\.00$/g,',00');
        } catch (e) {
            k = valor
        }
        return k;
      }
}

$(document).ready(fnde.init); //inicia o app