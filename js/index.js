let data = {};
let search_list = {};
let corresp_chang = {};
let corresp_pop = {};
const dec_bat = {
    "General": [0.38, 0.46],
    "E--1": [0.38, 0.46],
    "E-0": [0.38, 0.46],
    "E-1": [0.38, 0.46],
    "E-2": [0.38, 0.46],
    "E-3": [0.38, 0.46],
};
let chemin_courant = [];
let hash = window.location.hash.substring(1);

const clearButton = document.querySelector('#bt_clear_search');
const inputSearch = document.querySelector('#input_search');
const champ_from = document.getElementById('from');
const champ_to = document.getElementById('to');
const div_carte = document.getElementById('div_carte')
const div_search = document.getElementById('d_input')
const panneau_search = document.getElementById('panneau_search')
const change_button = document.getElementById('bt_change')
let dessin_svg = null;
let is_dragging = false;
let prev_hash = '';
let deplacement_temp = 0;
let panneau_open = 'none';
let index_search = 0;
let firstline = true;
let coef_margins = 0.3;

function send_post(params) {
    const http = new XMLHttpRequest();
    http.open('POST', '', true);
    
    http.setRequestHeader('Content-type', 'application/json');
    http.onreadystatechange = function() {
        if(http.readyState === 4 && http.status === 200) {
            // alert(http.responseText);
        }
    }
    http.send(params);
}

if (hash === '') {
    hash = 'General'
}

document.getElementById('main_explication').style.display = 'none'
// localStorage.setItem('previouslyVisited', false);
if (localStorage.getItem('previouslyVisited') !== 'true') {
    send_post('{"FirstCo": true}')
    show_expli();
    localStorage.setItem('previouslyVisited', 'true');
  }

fetch("data/points.json")
    .then(function (response) {
        return response.json();
    })
    .then(function (ret) {
        data = ret;
    })

fetch("data/search.json")
    .then(function (response) {
        return response.json();
    })
    .then(function (ret_search) {
        search_list = ret_search;
    })

fetch("data/corresp_chang.json")
    .then(function (response) {
        return response.json();
    })
    .then(function (ret_cor) {
        corresp_chang = ret_cor;
    })
fetch("data/corresp_pop.json")
    .then(function (response) {
        return response.json();
    })
    .then(function (ret_cor) {
        corresp_pop = ret_cor;
    })

if (hash.startsWith('Change')) {
    params = hash.split('?')
    dec = corresp_chang[params[2]]
    reload(params[1], chemin_courant, dec);
} else {
    reload(hash, chemin_courant)
}

if (champ_from.value !== "" && champ_to.value !== ""){
    go_func()
}



function return_to_map() {
    window.location.hash = "General";
}

function show_error(status, txt) {
    let rnd = Math.random()
    let api = 'cat'
    if (rnd < 0.33) {
        api = 'dog'
    } else if (rnd < 0.60) {
        api = 'garden'
    }
    div_carte.innerHTML = `<img src=\"https://http.${api}/${status}.jpg\" alt=\"Error ${status}: ${txt}\" style="max-width: 90%; max-height: 90vh; margin: auto; display: block;"></img>`
    setTimeout(return_to_map, 6000)
}

function reload(bat, chemin, dec=null) {
    if (bat === 'CIH') {
        window.location.href = '/cih';
    } else {
        let xmlhttp = new XMLHttpRequest();
        xmlhttp.open("GET", '/tuiles/' + bat + '.svg');
        xmlhttp.send();
        xmlhttp.onload = function () {
            if (xmlhttp.status !== 200) {
                show_error(xmlhttp.status, xmlhttp.statusText)

            } else {
                let text_tuile = xmlhttp.response;
                text_tuile = text_tuile.replace('</svg>', '');
                text_tuile = text_tuile.replace(/id=".*"/g, 'class="svglines" xmlns:xlink="http://www.w3.org/1999/xlink"');
                let text_svg_lines = '';
                let width = text_tuile.split('width=')[1].split('"')[1].split('mm')[0];
                let height = text_tuile.split('height=')[1].split('"')[1].split('mm')[0];
                let passage = 0;
                let pt_width = -1;
                let pt_height = -1;
                let prec_angle = -1;
                let prec_is_court = false;
                let lignes = Array();
                if (dec != null) {
                    pt_width = dec[0];
                    pt_height = dec[1];
                }
                if (bat in data) {
                    let i;
                    for (i = 0; i < chemin.length - 1; i++) {
                        if (data[bat][chemin[i + 1]] && data[bat][chemin[i]]) {
                            if (passage === 0) {
                                if (pt_height === -1) {
                                    pt_width = data[bat][chemin[i]][0];
                                    pt_height = data[bat][chemin[i]][1];
                                }
                            }
                            let dist = Math.sqrt((data[bat][chemin[i]][0] * width - data[bat][chemin[i + 1]][0] * width) ** 2 + (data[bat][chemin[i]][1] * height - data[bat][chemin[i + 1]][1] * height) ** 2);
                            let curr_x1 = data[bat][chemin[i]][0] * width;
                            let curr_y1 = data[bat][chemin[i]][1] * height;
                            let curr_x2 = data[bat][chemin[i + 1]][0] * width;
                            let curr_y2 = data[bat][chemin[i + 1]][1] * height;
                            let angle = Math.atan((curr_y1 - curr_y2)/(curr_x1 - curr_x2)) * 180 / Math.PI;
                            if (prec_angle !== angle) {
                                if (dist < 10) {
                                    prec_is_court = true;
                                    text_svg_lines += '<line x1="'+curr_x1+'px" y1="'+curr_y1+'px" x2="'+curr_x2+'px" y2="'+curr_y2+'px" class="line_way_court"/>';
                                } else {
                                    prec_is_court = false;
                                    text_svg_lines += '<line x1="'+curr_x1+'px" y1="'+curr_y1+'px" x2="'+curr_x2+'px" y2="'+curr_y2+'px" class="line_way"/>';
                                }
                            } else {
                                if (prec_is_court) {
                                    prec_is_court = false;
                                    text_svg_lines += '<line x1="'+curr_x1+'px" y1="'+curr_y1+'px" x2="'+curr_x2+'px" y2="'+curr_y2+'px" class="line_way"/>';
                                     
                                } else {
                                    text_svg_lines += '<line x1="'+curr_x1+'px" y1="'+curr_y1+'px" x2="'+curr_x2+'px" y2="'+curr_y2+'px" class="line_way_without"/>';
                                }
                            }
                            prec_angle = angle;
                            passage++;
                        }
                    }
                    for (i = 0; i < lignes.length - 1; i++) {
                        let curr_x1 = lignes[i][0];
                        let curr_y1 = lignes[i][1];
                        let curr_x2 = lignes[i + 1][0];
                        let curr_y2 = lignes[i + 1][1];
                        text_svg_lines += '<line x1="'+curr_x1+'px" y1="'+curr_y1+'px" x2="'+curr_x2+'px" y2="'+curr_y2+'px" class="line_way_court"/>';
                    }
                }

                let decalage_sur_ligne_short = 0;
                let descale = false;
                
                let long_queue = 2;
                let epaisseur_fleche = 2.2;
                let epaisseur_queue = 1;
                let long_fleche_totale = 3;
                let d = `m ${long_fleche_totale} ${epaisseur_fleche} l -${long_fleche_totale - long_queue} -${epaisseur_fleche / 2} l 0 ${(epaisseur_fleche - epaisseur_queue) / 2} l -${long_queue} 0 l 0 ${epaisseur_queue} l ${long_queue} 0 l 0 ${(epaisseur_fleche - epaisseur_queue) / 2} z`;
                var text_def = '<defs><marker id="markerArrow_short" markerWidth="' + long_fleche_totale * 2 + '" markerHeight="' + epaisseur_fleche * 2 + '" refX="' + -decalage_sur_ligne_short + '" refY="' + epaisseur_fleche +'" orient="auto"> <path d="'+ d + '" class="marker_fleche"/>  </marker><marker id="marker_end" markerWidth="' + 2 + '" markerHeight="' + 2 + '" refX="0" refY="0" orient="auto"> <circle cx="5" cy="5" r="2.5" stroke="black" stroke-width="3" fill="red" /></marker></defs>'
                // var text_def = '<defs><marker id="markerArrow" markerWidth="' + longeur_fleche * 2 + '" markerHeight="' + epaisseur_fleche * 2 + '" refX="' + -decalage_sur_ligne + '" refY="' + epaisseur_fleche / 2 + '" orient="auto"> <path d="M0 0 L' + longeur_fleche + ' ' + epaisseur_fleche / 2 + ' L0 ' + epaisseur_fleche + ' z" class="marker_fleche"/> </marker><marker id="markerArrow_short" markerWidth="' + longeur_fleche_short * 2 + '" markerHeight="' + epaisseur_fleche_short * 2 + '" refX="' + -decalage_sur_ligne_short + '" refY="' + epaisseur_fleche_short / 2 + '" orient="auto"> <path d="M0 0 L' + longeur_fleche_short + ' ' + epaisseur_fleche_short / 2 + ' L0 ' + epaisseur_fleche_short + ' z" class="marker_fleche"/> </marker></defs>'
                div_carte.innerHTML = text_tuile + text_def + text_svg_lines + '</svg>'
                dessin_svg = document.querySelector('.svglines');
                if (pt_height === -1) {
                    pt_width = dec_bat[bat][0];
                    pt_height = dec_bat[bat][1];
                    descale = true;
                }

                let rect_carte = dessin_svg.getBoundingClientRect();
                let difx = pt_width * rect_carte.width - document.documentElement.clientWidth * 0.5;
                let dify = pt_height * rect_carte.height - document.documentElement.clientHeight * 0.5;
                set_left_carte(-difx);
                set_top_carte(-dify);
                if (descale) {
                    set_scale_carte(-0.8, pt_width * rect_carte.width, pt_height * rect_carte.height, document.documentElement.clientWidth * 0.5, document.documentElement.clientHeight * 0.5);
                }
            }
        }
    }
}

function search(entree) {
    let entree_lower = entree
    if (entree_lower in search_list) {
        return search_list[entree_lower][0]
    } else {
        return entree
    }
}

function set_from(lieu) {
    champ_from.value = lieu
    if (champ_to.value !== '') {
        go_func()
    }
}

function set_to(lieu) {
    champ_to.value = lieu
    if (champ_from.value !== '') {
        go_func()
    }
}

function show_search_panel(stat) {
    panneau_search.style.display = "flex";
    div_search.display = 'none';
    panneau_open = stat;
    if (stat === 'to') {
        inputSearch.placeholder = 'Choisissez une destination';
    } else {
        inputSearch.placeholder = 'Choisissez un point de départ';
    }
    inputSearch.value = '';
    inputSearch.select();
    search_event();
}

function close_search_panel(statut) {
    div_search.display = 'block'
    panneau_search.style.display = "none"
    if (statut !== 'none') {
        if (panneau_open === 'from') {
            set_from(statut)
            
        } else if (panneau_open === 'to') {
            set_to(statut)
        }
    }
    panneau_open = 'none'
    inputSearch.blur()
}

function show_center_expli(text) {
    document.getElementById('histo').style.display = 'flex';
    document.getElementById('blanc').style.display = 'block';
    document.querySelector('#histo p').innerHTML = 'Anciennement : ' + text;
}
function del_center_expli() {
    document.getElementById('histo').style.display = 'none'
    document.getElementById('blanc').style.display = 'none'
}

let prev_chang = 0;

window.addEventListener('hashchange', () => {
    let params;
    if (window.location.hash) {
        if (!is_dragging) {
            prev_chang = 0
            hash = window.location.hash.substring(1);
            let dec = [0.5, 0.5]
            if (hash.startsWith('Change')) {
                params = hash.split('?')
                dec = corresp_chang[params[2]]
                window.location.hash = params[1]
                prev_chang = 1
                reload(params[1], chemin_courant, dec);
            }
            if (hash.startsWith('Pop?')) {
                params = hash.split('?')
                window.location.hash = params[1]
                show_center_expli(corresp_pop[params[2]])
                prev_chang = 1
                reload(params[1], chemin_courant, data[params[1]][params[2]]);

            }
            if (prev_chang === 0) {
                reload(hash, chemin_courant);
            } else {
                prev_chang += 1
            }
            if (prev_chang === 3) {
                prev_chang = 0;
            }

        } else {
            if (prev_hash !== '') {
                window.location.hash = prev_hash
            } else {
                window.location.hash = 'General'
            }
        }
    }
    prev_hash = window.location.hash
})

function search_event() {
    document.getElementById('foot').scrollTop = 0
    let dict_sim = {};
    if (inputSearch.value !== '') {
        let item;
        for (item of Object.keys(search_list)) {
            let sim = similarity(item.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""), inputSearch.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
            let spl;
            for (spl of item.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(' ')) {
                let sim2 = similarity(spl, inputSearch.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
                if (sim2 > sim) {
                    sim = sim2
                }
            }

            if (sim > 0) {
                dict_sim[item] = sim
            }
        }
        document.getElementById('first').innerHTML = inputSearch.value;
        document.getElementById('first').style.display = 'block'
        let list_sim = sort(dict_sim)
        show_search(list_sim, inputSearch.value)
    } else {
        document.getElementById('foot').innerHTML = '<button onclick="close_search_panel(document.getElementById(\'first\').innerHTML);" id="first"><b><li></li></b></button><button onclick="close_search_panel(\'Vie scolaire lycée\');" id="search_0"><li>Vie scolaire lycée</li></button><button onclick="close_search_panel(\'Vie scolaire collège\');" id="search_1"><li>Vie scolaire collège</li></button><button onclick="close_search_panel(\'CDI Collège\');" id="search_2"><li>CDI Collège</li></button><button onclick="close_search_panel(\'CDI Lycée\');" id="search_3"><li>CDI Lycée</li></button><button onclick="close_search_panel(\'CPE\');" id="search_4"><li>CPE</li></button><button onclick="close_search_panel(\'Secrétaria\');" id="search_5"><li>Secrétariat</li></button><button onclick="close_search_panel(\'Amphithéâtre\');" id="search_6"><li>Amphithéatre</li></button><button onclick="close_search_panel(\'Entrée\');" id="search_7"><li>Entrée</li></button><button onclick="close_search_panel(\'Infirmerie\');" id="search_8"><li>Infirmerie</li></button><button onclick="close_search_panel(\'Foyer\');" id="search_9"><li>Foyer du lycée</li></button><button onclick="close_search_panel(\'Réfectoire\');" id="search_10"><li>Réfectoire</li></button><button onclick="close_search_panel(\'CIH\');" id="search_12"><li>CIH</li></button><button onclick="close_search_panel(\'Salle de musique\');" id="search_13"><li>Salle de musique</li></button><button onclick="close_search_panel(\'Salle des actes\');" id="search_14"><li>Salle des actes</li></button><button onclick="close_search_panel(\'Salle des arts\');" id="search_15"><li>Salle des arts</li></button><button onclick="close_search_panel(\'Gymnase\');" id="search_16"><li>Gymnase</li></button><button onclick="close_search_panel(\'Intendance\');" id="search_17"><li>Intendance</li></button><button onclick="close_search_panel(\'Salle des professeurs\');" id="search_18"><li>Salle des professeurs</li></button><p></p>'
        document.getElementById('first').style.display = 'none'
    }
}

function show_search(list, val) {
    let txt = ''
    firstline = true
    txt += '<button onclick="close_search_panel(document.getElementById(\'first\').textContent);" id="first"><b><li>' + val + '</li></b></button>'
    for (var i = 0, size = list.length; i < size; i++) {
        var it = list[i];
        if (it[1] > 50) {
            firstline = false
        }
        txt += '<button onclick="event.preventDefault();close_search_panel(\'' + it[0] + '\');" id="search_' + i + '"><li>' + it[0] + '</li></button>'

    }
    document.getElementById('foot').innerHTML = txt
    if (firstline) {
        document.getElementById('first').style.display = 'block'
    } else {
        document.getElementById('first').style.display = 'none'

    }
    if (document.getElementById('first').style.display === 'block') {
        document.getElementById('first').style.backgroundColor = "rgba(190, 205, 219, 0.6)"
        try {
            document.getElementById('search_' + index_search).style.backgroundColor = ""
        } catch (e) { }

    } else {
        document.getElementById('search_' + index_search).style.backgroundColor = "rgba(190, 205, 219, 0.6)"
        document.getElementById('first').style.backgroundColor = ""

    }
}

function go_func() {
    chemin_courant = findShortestPath(graph, search(champ_from.value), search(champ_to.value)).path
    Object.keys(data).forEach(function (key) {
        if (chemin_courant[0] in data[key]) {
            window.location.hash = key
        }
    });
    reload(hash, chemin_courant)
}

clearButton.addEventListener('click', () => {
    inputSearch.value = ''
    document.getElementById('first').style.display = 'none'
    inputSearch.select();
    inputSearch.focus();
    document.getElementById('foot').innerHTML = '<button onclick="close_search_panel(document.getElementById(\'first\').innerHTML);" id="first"><b><li></li></b></button><button onclick="close_search_panel(\'Vie scolaire lycée\');" id="search_0"><li>Vie scolaire lycée</li></button><button onclick="close_search_panel(\'Vie scolaire collège\');" id="search_1"><li>Vie scolaire collège</li></button><button onclick="close_search_panel(\'CDI Collège\');" id="search_2"><li>CDI Collège</li></button><button onclick="close_search_panel(\'CDI Lycée\');" id="search_3"><li>CDI Lycée</li></button><button onclick="close_search_panel(\'CPE\');" id="search_4"><li>CPE</li></button><button onclick="close_search_panel(\'Secrétaria\');" id="search_5"><li>Secrétariat</li></button><button onclick="close_search_panel(\'Amphithéâtre\');" id="search_6"><li>Amphithéatre</li></button><button onclick="close_search_panel(\'Entrée\');" id="search_7"><li>Entrée</li></button><button onclick="close_search_panel(\'Infirmerie\');" id="search_8"><li>Infirmerie</li></button><button onclick="close_search_panel(\'Foyer\');" id="search_9"><li>Foyer du lycée</li></button><button onclick="close_search_panel(\'Réfectoire\');" id="search_10"><li>Réfectoire</li></button><button onclick="close_search_panel(\'CIH\');" id="search_12"><li>CIH</li></button><button onclick="close_search_panel(\'Salle de musique\');" id="search_13"><li>Salle de musique</li></button><button onclick="close_search_panel(\'Salle des actes\');" id="search_14"><li>Salle des actes</li></button><button onclick="close_search_panel(\'Salle des arts\');" id="search_15"><li>Salle des arts</li></button><button onclick="close_search_panel(\'Gymnase\');" id="search_16"><li>Gymnase</li></button><button onclick="close_search_panel(\'Intendance\');" id="search_17"><li>Intendance</li></button><button onclick="close_search_panel(\'Salle des professeurs\');" id="search_18"><li>Salle des professeurs</li></button><p></p>'
    document.getElementById('first').style.display = 'none'
})
change_button.addEventListener('click', () => {
    let old_from = champ_from.value
    champ_from.value = champ_to.value
    champ_to.value = old_from
    go_func()
})

inputSearch.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        if (document.getElementById('first').style.display !== 'none') {
            close_search_panel(inputSearch.value)
        } else {
            if (inputSearch.value !== '') {
                close_search_panel(document.getElementById('search_' + index_search).textContent)
            } else {
                close_search_panel('')

            }
        }
    }
})


function show_expli() {
    let stat = document.getElementById('main_explication').style.display;
    if (stat !== 'none') {
        document.getElementById('main_explication').style.display = 'none';
        document.getElementById("back_filter").style.display = "none";
    } else {
        let isTouchDevice = 'ontouchstart' in document.documentElement;
        if (isTouchDevice){
            document.getElementById('table_expli').innerHTML = `
                <tr>
                    <td valign="top">
                        <img src="/images/grab.png" class="img_expli" alt="Main">
                    </td>
                    <td valign="middle">
                        Faire glisser la carte avec <b>1</b> doigt pour la <b>déplacer</b>
                    </td>
                </tr>
                <tr>
                    <td valign="top">
                        <img src="/images/loupe.png" class="img_expli" alt="Loupe">
                    </td>
                    <td valign="middle">
                        Utilisez <b>2</b> doigts pour <b>zoomer/dézommer</b>
                    </td>
                </tr>
                <tr>    <td valign="top"><img src="/images/esc.png" class="img_expli" alt="Escalier" /></td>    <td valign="middle">Cliquez sur les <b>escaliers</b> pour changer d'étage</td></tr>
                <tr><td valign="top"><img src="/images/change_bat.png" class="img_expli" alt="Flèche" /></td><td valign="middle">Cliquez sur les <b>flèches</b> pour changer de batiment</td></tr>
                <tr><td valign="top"><img src="/images/anc.svg" class="img_expli" alt="Icone" /></td><td valign="middle">Cliquez pour voir des informations historiques</td></tr>
            `;
        }
        document.getElementById('main_explication').style.display = 'block'
        document.getElementById("back_filter").style.display = "block";
    }
}

// Déplacement avec la main
div_carte.style.cursor = 'grab'
function set_drag_false() {
    is_dragging = false
    deplacement_temp = 0
}

let pos = { top: 0, left: 0, x: 0, y: 0 }

const mouseDownHandler = function (event_mousedown) {
    div_carte.style.cursor = 'grabbing';
    div_carte.style.userSelect = 'none';

    pos = {
        left: Number(dessin_svg.style.marginLeft.split('px')[0]),
        top: Number(dessin_svg.style.marginTop.split('px')[0]),
        x: event_mousedown.clientX,
        y: event_mousedown.clientY,
    };

    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
}

const mouseMoveHandler = function (event_mousemove) {
    const dx = event_mousemove.clientX - pos.x;
    const dy = event_mousemove.clientY - pos.y;

    // Si le decalage depasse un certain seuil
    set_left_carte(pos.left + dx)
    set_top_carte(pos.top + dy)
    deplacement_temp += Math.sqrt(dx ** 2 + dy ** 2)
    if (deplacement_temp > 100) {
        is_dragging = true
    }

}

const mouseUpHandler = function () {
    div_carte.style.cursor = 'grab';
    div_carte.style.removeProperty('user-select');
    setTimeout(set_drag_false, 400)
    document.removeEventListener('mousemove', mouseMoveHandler);
    document.removeEventListener('mouseup', mouseUpHandler);
}

div_carte.addEventListener('mousedown', mouseDownHandler)

// Action avec les doigts

var dist_old = -1;
var start_dec = true

window.addEventListener('touchmove', event => {
    event.preventDefault();
    if (event.touches.length === 2) {
        const [t1, t2] = event.touches;
        let inter_diffx = Math.abs(t1.clientX - t2.clientX) ** 2;
        let inter_diffy = Math.abs(t1.clientY - t2.clientY) ** 2;
        var curDiff = Math.sqrt(inter_diffx + inter_diffy);

        let meanx = (t1.clientX + t2.clientX) / 2
        let meany = (t1.clientY + t2.clientY) / 2
        let mx = (meanx - dessin_svg.getBoundingClientRect().left) / get_scale_carte()
        let my = (meany - dessin_svg.getBoundingClientRect().top) / get_scale_carte()
        let cx = meanx
        let cy = meany

        if (dist_old > 0) {
            let dif_zomm = Math.abs(curDiff - dist_old)
            if (curDiff > dist_old) {
                // zommer
                set_scale_carte(0.003 * dif_zomm, mx, my, cx, cy)
            } else if (curDiff < dist_old) {
                // dezoomer
                set_scale_carte(0.003 * -dif_zomm, mx, my, cx, cy)

            }

        }
        dist_old = curDiff;

    } else if (event.touches.length === 1) {
        const [t1_m] = event.touches;

        div_carte.style.cursor = 'grabbing';
        div_carte.style.userSelect = 'none';
        if (start_dec) {
            pos = {
                left: Number(dessin_svg.style.marginLeft.split('px')[0]),
                top: Number(dessin_svg.style.marginTop.split('px')[0]),
                x: t1_m.clientX,
                y: t1_m.clientY,
            };
            start_dec = false
        }
        const dx = t1_m.clientX - pos.x;
        const dy = t1_m.clientY - pos.y;

        set_left_carte(pos.left + dx)
        set_top_carte(pos.top + dy)
    }
    verify_margins()
});

window.addEventListener('touchend', ev => {
    dist_old = -1;
    start_dec = true
})

window.addEventListener('touchcancel', ev => {
    dist_old = -1;
    start_dec = true
})

// Zoom avec la mollette
window.addEventListener("wheel", event_wheel => {
    let mx = (event_wheel.clientX - dessin_svg.getBoundingClientRect().left) / get_scale_carte()
    let my = (event_wheel.clientY - dessin_svg.getBoundingClientRect().top) / get_scale_carte()
    set_scale_carte(0.001 * -event_wheel.deltaY, mx, my, event_wheel.clientX, event_wheel.clientY)
});

// Actions sur la carte
function set_scale_carte(valeur_add, t_origin_x, t_origin_y, clx, cly) {
    let mx2;
    let my2;
    if (panneau_open === 'none') {
        if (valeur_add + get_scale_carte() <= 3) {
            if (!(dessin_svg.getBoundingClientRect().width < div_carte.clientWidth + 100 && dessin_svg.getBoundingClientRect().height < div_carte.clientHeight + 100) || valeur_add > 0) {
                dessin_svg.style.transform = 'scale(' + (valeur_add + get_scale_carte()) + ')';

                mx2 = (clx - dessin_svg.getBoundingClientRect().left) / get_scale_carte()
                set_left_carte(Number(dessin_svg.style.marginLeft.split('px')[0]) + (mx2 - t_origin_x) * get_scale_carte())

                my2 = (cly - dessin_svg.getBoundingClientRect().top) / get_scale_carte()
                set_top_carte(Number(dessin_svg.style.marginTop.split('px')[0]) + (my2 - t_origin_y) * get_scale_carte())

            }
        }
        div_carte.scrollLeft = 0
        div_carte.scrollTop = 0
        verify_margins()
    }

}

function set_left_carte(margin_left) {
    if (panneau_open === 'none') {
        let width_screen = div_carte.clientWidth
        let marge_horizon = width_screen * coef_margins
        let rect_carte = dessin_svg.getBoundingClientRect()
        if ((rect_carte.left + rect_carte.width >= marge_horizon) && (rect_carte.left <= width_screen - marge_horizon)) {
            dessin_svg.style.marginLeft = margin_left + 'px';
        }
        verify_margins()
    }
}

function set_top_carte(margin_top) {
    if (panneau_open === 'none') {
        let height_screen = div_carte.clientHeight
        let marge_vert = height_screen * coef_margins
        let rect_carte = dessin_svg.getBoundingClientRect()
        if ((rect_carte.top + rect_carte.height >= marge_vert) && (rect_carte.top <= height_screen - marge_vert)) {
            dessin_svg.style.marginTop = margin_top + 'px';
        }
        verify_margins()
    }
}

function verify_margins() {
    if (panneau_open === 'none') {
        let marg_left = Number(dessin_svg.style.marginLeft.split('px')[0]);
        let marg_top = Number(dessin_svg.style.marginTop.split('px')[0]);
        let rect_carte = dessin_svg.getBoundingClientRect()

        let width_screen = div_carte.clientWidth
        let marge_horizon = width_screen * coef_margins

        let height_screen = div_carte.clientHeight
        let marge_vert = height_screen * coef_margins

        if (rect_carte.left + rect_carte.width < marge_horizon) {
            marg_left += marge_horizon - (rect_carte.left + rect_carte.width) + 1
            dessin_svg.style.marginLeft = marg_left + 'px';
        } else if (rect_carte.left > width_screen - marge_horizon) {
            marg_left -= rect_carte.left - (width_screen - marge_horizon) + 1
            dessin_svg.style.marginLeft = marg_left + 'px';
        }
        // =====================
        if (rect_carte.top + rect_carte.height < marge_vert) {
            marg_top += marge_vert - (rect_carte.top + rect_carte.height) + 1
            dessin_svg.style.marginTop = marg_top + 'px';
        } else if (rect_carte.top > height_screen - marge_vert) {
            marg_top -= rect_carte.top - (height_screen - marge_vert) + 1
            dessin_svg.style.marginTop = marg_top + 'px';
        }
    }
}

function get_scale_carte() {
    let sc = 1;
    if (dessin_svg.style.transform !== "") {
        sc = Number(dessin_svg.style.transform.split('scale(')[1].split(')')[0])
    } else {
        sc = 1
    }
    return sc
}

// dist texts
function levenshteinDistance(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    let matrix = [];

    // Initialize the matrix
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1, // insertion
                    matrix[i - 1][j] + 1 // deletion
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

function similarity(a, b) {
    let distance = levenshteinDistance(a, b);
    let maxLength = Math.max(a.length, b.length);
    return (1 - distance / maxLength) * 100;
}

function sort(dict) {
    let items_in = Object.keys(dict).map(function (key) {
        return [key, dict[key]];
    });

    items_in.sort(function (first, second) {
        return second[1] - first[1];
    });
    return items_in
}

// localStorage.setItem("previouslyVisited", "false");
