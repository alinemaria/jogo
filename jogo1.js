var tela;
var cv;

var imgs = [];
var mapas = [];
var imgs_by_arq = {};

var socket = null;
var _socket_conectado = false;
var _socket_recebido = null;

var arquivos_carregados = 0;

var carregou = function(arqs) { };
var processa = function() { };

var teclado = { left:false, right:false, up:false, down:false, space:false };



function inicializa(carregou_func, processa_func)
{
    carregou = carregou_func;
    processa = processa_func;
    
    tela = document.getElementById("tela");
    cv = tela.getContext("2d");

    window.addEventListener("keydown", on_keydown);
    window.addEventListener("keyup", on_keyup);

    document.body.style.margin = "0";
    document.body.style.backgroundColor = "black";
    tela.style.position = "absolute";
    tela.style.left = "50%";
    tela.style.top = "50%";
    tela.style.transform = "translate(-50%,-50%)";    
}

function pronto()
{
    //setInterval( processa, 75 );
    processa();    
}

function carrega_imagem(arq)
{
    var img = new Image();
    img.onload = function ()
    {
        imgs.push( img );
        
        arquivos_carregados++;
        carregou( arquivos_carregados );
    };

    imgs_by_arq[arq] = img;
    img.src = arq;
}

function carrega_mapa(arq)
{
    var x = new XMLHttpRequest();
    x.onreadystatechange = function()
    {
        if (x.readyState == 4 && x.status == 200)
        {
            var mdata = x.responseXML;
            carregou_mapa( mdata );
            
            arquivos_carregados++;
            carregou( arquivos_carregados );
        }
    };

    x.open("GET", arq, true);
    x.send();
}

function carregou_mapa(mdata)
{
    var tag_map = mdata.getElementsByTagName("map")[0];
    
    var mapa = {};
    mapa.w = parseInt( tag_map.getAttribute("width") );
    mapa.h = parseInt( tag_map.getAttribute("height") );
    mapa.tw = parseInt( tag_map.getAttribute("tilewidth") );
    mapa.th = parseInt( tag_map.getAttribute("tileheight") );
    mapa.grid = [];
    
    var tiles = mdata.getElementsByTagName("tile");
    for (var i = 0; i < tiles.length; i++)
    {
        var gid = parseInt( tiles[i].getAttribute("gid") ) - 1;
        mapa.grid.push( gid );
    }

    mapa.tileset_w = null;
    mapa.tileset_h = null;
    
    mapas.push( mapa );    
}


function desenha_mapa()
{
    var m = mapas[0];
    var mapa_img = imgs[0];
    
    if (m.tileset_w == null) m.tileset_w = mapa_img.width;
    if (m.tileset_h == null) m.tileset_h = mapa_img.height;
    
    for (var ty = 0; ty < m.h; ty++)
    {
        for (var tx = 0; tx < m.w; tx++)
        {
            var k = ty*m.w + tx;
            var gid = m.grid[k];

            var px = tx*m.tw;
            var py = ty*m.th;

            var srcx = (gid * m.tw) % m.tileset_w;
            var srcy = Math.floor( (gid * m.tw) / m.tileset_w ) * m.th;

            cv.drawImage( mapa_img, srcx,srcy,m.tw,m.th, px,py,m.tw,m.th );
        }
    }    
}

function desenha_imagem(img, x, y)
{
    var m = mapas[0];
    var px = x * m.tw;
    var py = y * m.th;

    cv.drawImage( imgs_by_arq[img], px, py );
}

function on_keydown(e)
{
    if ( e.keyCode == 37 ) teclado.left = true;
    else if ( e.keyCode == 39 ) teclado.right = true;
    else if ( e.keyCode == 38 ) teclado.up = true;
    else if ( e.keyCode == 40 ) teclado.down = true;
    else if ( e.keyCode == 32 ) teclado.space = true;
    
    processa();
}

function on_keyup(e)
{
    if ( e.keyCode == 37 ) teclado.left = false;
    else if ( e.keyCode == 39 ) teclado.right = false;
    else if ( e.keyCode == 38 ) teclado.up = false;
    else if ( e.keyCode == 40 ) teclado.down = false;
    else if ( e.keyCode == 32 ) teclado.space = false;

    processa();
}

function mapa_get_tile(tx, ty)
{
    tx = parseInt( tx );
    ty = parseInt( ty );
    
    var m = mapas[0];
    if (tx < 0 || ty < 0 || tx >= m.w || ty >= m.h) return -1;
    
    var k = ty*m.w + tx;
    return m.grid[k];
}

function mapa_set_tile(tx, ty, img)
{
    tx = parseInt( tx );
    ty = parseInt( ty );
    
    var m = mapas[0];
    if (tx < 0 || ty < 0 || tx >= m.w || ty >= m.h) return;
    
    var k = ty*m.w + tx;
    m.grid[k] = img;
}




function socket_conecta(ip_servidor)
{
    var porta = "8000";
    var url = "ws://" + ip_servidor + ":" + porta;
    
    socket = new WebSocket( url );
    socket.onopen = conectou;
    socket.onmessage = recebeu;
    socket.onclose = desconectou;
}

function conectou()
{
    console.log( "Conectado" );
    _socket_conectado = true;
}
            
function desconectou()
{
    console.log( "Desconectado" );
    _socket_desconectado = false;
}

function recebeu(evt)
{
    _socket_recebido = evt.data;                
    processa();
}

function socket_conectado()
{
    return _socket_conectado;
}

function socket_recebeu()
{
    return _socket_recebido != null;
}

function socket_recebido()
{
    var s = _socket_recebido;
    _socket_recebido = null;
    
    return s;
}

function socket_envia(cmd)
{
    if (socket == null) return;
    socket.send(cmd);
}
