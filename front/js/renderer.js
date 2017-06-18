// Implémentation de méthodes supplémentaires
Array.prototype.move = function (old_index, new_index) {
    if (new_index >= this.length) {
        let k = new_index - this.length;
        while ((k--) + 1) {
            this.push(undefined);
        }
    }
    this.splice(new_index, 0, this.splice(old_index, 1)[0]);
    return this;
};

String.prototype.replaceAll = function(search, replacement) {
    return this.replace(new RegExp(search, 'g'), replacement);
};

String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

jQuery.fn.tagName = function() {
    return this.prop('tagName').toLowerCase();
}

jQuery.fn.getCursorPosition = function() {
    let el = $(this).get(0);
    let pos = 0;
    if('selectionStart' in el) {
        pos = el.selectionStart;
    } else if('selection' in document) {
        el.focus();
        let sel = document.selection.createRange();
        let selLength = document.selection.createRange().text.length;
        sel.moveStart('character', -el.value.length);
        pos = sel.text.length - selLength;
    }
    return pos;
}

jQuery.fn.hasAttr = function(attrName) {
    let attr = this.attr(attrName);
    return (typeof attr !== typeof undefined && attr !== false);
}

function getSelectionText(elem) {
    let text = '';
    let activeEl = elem ? elem : document.activeElement;
    let activeElTagName = activeEl ? activeEl.tagName.toLowerCase() : null;
    if (
      (activeElTagName == 'textarea') &&
      (typeof activeEl.selectionStart == 'number')
    ) {
        text = activeEl.value.slice(activeEl.selectionStart, activeEl.selectionEnd);
    } else if (window.getSelection) {
        text = window.getSelection().toString();
    }
    return text;
}

function getLength(tab) {
    return Array.isArray(tab) ? tab.length : Object.keys(tab).length;
}

// Convertit un élément interne en élément lisible par l'utilisateur
function typeToLocale(type, lang = 'fr') {
    return Locales[lang.capitalizeFirstLetter()].Elements[type];
}

function onArrowClick(ev) {
    let id = $(this).closest('[id^="element-"]').attr('id').substr(8);

    let instance = projectInfos.elements[id];



    ev.preventDefault();
}
// Ajout d'un élément
function addElement(instance, addTags = true) {
    // Clonage de la template d'élément de sidebar
    let $newElem = $('#template-element').clone(true);
    $newElem.find('.fa-arrows-v').click(onArrowClick);

    // Changement des IDs/Classes
    $newElem.attr('id', `element-${instance.position}`);
    $newElem.find('.dropdown-pane').attr('id', instance.position + '-dropdown-properties');
    $newElem.find('[data-toggle]').attr('data-toggle', instance.position + '-dropdown-properties');

    // Contenu de l'élément
    if (instance.text != null && instance.text !== '') {
        $newElem.find('strong').html(instance.name + ' &middot; ' + typeToLocale(instance.type));
        $newElem.find('em').html($(`<span>${instance.text.replaceAll('<br />', '   ')}</span>`).text());
    } else {
        if (instance instanceof SpecialElement) {
            $newElem.find('strong').html(`<u>Fin de</u> ${instance.name}`);
            $newElem.find('em').html(typeToLocale(instance.type));
            $newElem.find('[data-toggle$="dropdown-properties"]').remove();
        } else {
            $newElem.find('strong').html(instance.name);
            $newElem.find('em').html(typeToLocale(instance.type));
        }
    }

    // Ajout d'éléments dans l'aperçu
    if (addTags) {
        if (instance instanceof SpecialElement) {
            let oldHTML = $p.html();
            console.log(instance.oldPosition);
            console.log(Tags[instance.type]);
            let newHTML = oldHTML.replace(
                new RegExp(`<${Tags[instance.type]}(.+?)id="elem-${instance.oldPosition}"(.+)>(.*)</${Tags[instance.type]}>`, 'i'),
                `<${Tags[instance.type]}$1id="elem-${instance.oldPosition}"$2>$3`
            );
            console.log([oldHTML, newHTML]);
            if (oldHTML != newHTML) {
                $p.html(newHTML + `</${Tags[instance.type]}>`);
            } else {
                alert('La fin d\'un élément ne peut se situer avant le début !');
            }
        } else if (instance instanceof DataElement) {
            $p.append(DataFunctions[instance.type](instance));
        } else {
            let $newTag = $(`<${Tags[instance.type]}>`).attr('id', `elem-${instance.position}`).html(instance.text);
            $.each(instance.properties, (i,v) => {
                if (v === 'default') {
                    return;
                }
                $newTag.css(i, (isNaN(Number(v))) ? v : `${v}px`);
            });
            if (instance.js.event != '' && instance.js.action != '') {
                $newTag.on(instance.js.event, () => {
                    switch (instance.js.action) {
                        case 'message':
                            alert(instance.js.text != null ? instance.js.text : '(Veuillez définir un message.)');
                            break;
                    }
                });
            }

            if (instance instanceof BlockElement) {
                let sizes = instance.sizes;
                $newTag
                .addClass(`small-${sizes[0]}`)
                .addClass(`medium-${sizes[1]}`)
                .addClass(`large-${sizes[2]}`);
            } else {
                $newTag.addClass('small-12');
            }

            $newTag.addClass('columns');

            $newTag.appendTo('#preview');
        }
    }

    $newElem.appendTo('#elements');

    return $newElem;
}

// Mise à jour de l'élément de l'aperçu
function updateHTMLElement(instance) {
    if (instance instanceof DataElement) {
        $(`#elem-${instance.position}`).replaceWith(DataFunctions[instance.type](instance));
    } else {
        let $elem = $(`#elem-${instance.position}`);
        $elem.html(instance.text);
        $.each(instance.properties, (i,v) => {
            if (v === 'default') {
                $elem.css(i, '');
            } else {
                $elem.css(i, isNaN(Number(v)) ? v : `${v}px`);
            }
        });
    }
}

function updateBody() {
    $p.parent().css({
        background: `${projectInfos.bodyProperties.color} url('${projectInfos.bodyProperties.image}') no-repeat center center fixed`,
        backgroundSize: 'cover'
    });
}

// Mise à jour de l'affichage de tous les éléments de la sidebar (+ preview si demandé)
function updateElements(updateTags = false) {
    updateBody();
    clearElements();
    if (updateTags) {
        deleteHTMLElements();
    }
    $.each(projectInfos.elements, (i,v) => {
        addElement(v, updateTags);
    });
}

// Suppression des éléments HTML
function deleteHTMLElements() {
    $('[id^="elem-"]').remove();
}

// Suppression des éléments
function clearElements(trueDelete = false, updateGlobal = true) {
    if (trueDelete) {
        $.each(projectInfos.elements, (i,v) => {
            v.delete(false, false);
        });
        projectInfos.elements = [];
        if (updateGlobal) {
            remote.getGlobal('webbyData').projectInfos = projectInfos;
        }
    }
    $('#elements > *').remove();
}

function pelle(str) {
    let $area = $('[name="element-text"]');
    let area = $area[0];
    let position = $area.getCursorPosition();
    let oldText = $area.val();
    let text = getSelectionText(area);

    if (text != '') {
        $area.val(oldText.substr(0, position) + str + text + str + oldText.substr(position+ text.length));
        area.focus();
    } else {
        $area.val(oldText.substr(0, position) + str + 'texte' + str + oldText.substr(position));
        area.focus();
        area.selectionStart = position + str.length;
        area.selectionEnd = area.selectionStart + 5;
    }
}

function addUlElement(ev) {
    let $list = $(this).closest('.accordion-content').find('ul');
    let $newElem = $(ulElementString($list.children().length));
    $newElem.find('.remove-ul-element').click(removeUlElement);
    $newElem.appendTo($list);
    $newElem.find('input').focus();

    ev.preventDefault();
}

function ulElementString(id) {
    return `<li><div class="input-group"><input type="text" class="input-group-field" name="element-data-${id != null ? id : 0}" /><a href="#" class="input-group-button button remove-ul-element"><i class="fa fa-times"></i></a></div></li>`
}

function removeUlElement(ev) {
    let $parent = $(this).parent();
    let id = $parent.children('input').attr('name').substr(13);
    let $list = $parent.closest('.accordion-content').find('ul');

    if ($list.children('li').length <= 1) {
        return;
    }

    $list.children('li').eq(id).remove();

    $list.children().each((i,v) => {
        if (i < id) {
            return true;
        }

        $(v).find('[name^="element-data-"]').attr('name', `element-data-${i}`);
    });

    ev.preventDefault();
}
function addOlElement(ev) {
    let $list = $(this).closest('.accordion-content').find('ol');
    let $newElem = $(olElementString($list.children().length));
    $newElem.find('.remove-ol-element').click(removeOlElement);
    $newElem.appendTo($list);
    $newElem.find('input').focus();

    ev.preventDefault();
}

function olElementString(id) {
    return `<li><div class="input-group"><input type="text" class="input-group-field" name="element-data-${id != null ? id : 0}" /><a href="#" class="input-group-button button remove-ol-element"><i class="fa fa-times"></i></a></div></li>`
}

function removeOlElement(ev) {
    let $parent = $(this).parent();
    let id = $parent.children('input').attr('name').substr(13);
    let $list = $parent.closest('.accordion-content').find('ol');

    if ($list.children('li').length <= 1) {
        return;
    }

    $list.children('li').eq(id).remove();

    $list.children().each((i,v) => {
        if (i < id) {
            return true;
        }

        $(v).find('[name^="element-data-"]').attr('name', `element-data-${i}`);
    });

    ev.preventDefault();
}

// Importation des modules
const {remote, ipcRenderer} = require('electron');
const beautify = require('js-beautify').html;

// Déclaration des variables globales
let $d = $(document),
    $w = $(window),
    $s = $('#sidebar'),
    $elems = $('#elements'),
    $p = $('#preview'),
    $o = $('#overlay'),
    $npModal = $('#new-project-modal'),
    $ppModal = $('#project-properties-modal'),
    $epModal = $('#element-properties-modal'),
    $ejModal = $('#element-js-modal'),
    $bpModal = $('#body-properties-modal');

// Déclaration des enums
const ElementType = {
    // todo hr
    P: 0,
    DIV: 1,
    ADDRESS: 2,
    ARTICLE: 3,
    ASIDE: 4,
    BLOCKQUOTE: 5,
    FOOTER: 6,
    H1: 7,
    H2: 8,
    H3: 9,
    H4: 10,
    H5: 11,
    H6: 12,
    HEADER: 13,
    MAIN: 14,
    NAV: 15,
    SECTION: 16,
    UL: 17,
    OL: 18,
    IMG: 19,
};

const ElementClass = {
    [ElementType.P]: 'InlineElement',
    [ElementType.DIV]: 'BlockElement',
    [ElementType.ADDRESS]: 'InlineElement',
    [ElementType.ARTICLE]: 'BlockElement',
    [ElementType.ASIDE]: 'BlockElement',
    [ElementType.BLOCKQUOTE]: 'InlineElement',
    [ElementType.FOOTER]: 'BlockElement',
    [ElementType.H1]: 'InlineElement',
    [ElementType.H2]: 'InlineElement',
    [ElementType.H3]: 'InlineElement',
    [ElementType.H4]: 'InlineElement',
    [ElementType.H5]: 'InlineElement',
    [ElementType.H6]: 'InlineElement',
    [ElementType.HEADER]: 'BlockElement',
    [ElementType.MAIN]: 'BlockElement',
    [ElementType.NAV]: 'BlockElement',
    [ElementType.SECTION]: 'BlockElement',
    [ElementType.UL]: 'DataElement',
    [ElementType.OL]: 'DataElement',
    [ElementType.IMG]: 'DataElement',
};

// Peuvent retourner un objet jQuery ou un string !
const DataFunctions = {
    [ElementType.UL]: (instance) => {
        let $list = $('<ul></ul>').attr('id', `elem-${instance.position}`);

        $.each(instance.data, (i,v) => {
            $list.append($('<li></li>').html(v));
        });

        return $list;
    },
    [ElementType.OL]: (instance) => {
        let $list = $('<ol></ol>').attr('id', `elem-${instance.position}`);
        $.each(instance.data, (i,v) => {
            $list.append($('<li></li>').html(v));
        });

        return $list;
    },
    [ElementType.IMG]: (instance) => {
        return $('<img />')
        .attr('id', `elem-${instance.position}`)
        .attr('src', instance.data.src)
        .attr('alt', instance.data.alt);
    }
};

const Tags = {
    [ElementType.P]: 'p',
    [ElementType.DIV]: 'div',
    [ElementType.ADDRESS]: 'address',
    [ElementType.ARTICLE]: 'article',
    [ElementType.ASIDE]: 'aside',
    [ElementType.BLOCKQUOTE]: 'blockquote',
    [ElementType.FOOTER]: 'footer',
    [ElementType.H1]: 'h1',
    [ElementType.H2]: 'h2',
    [ElementType.H3]: 'h3',
    [ElementType.H4]: 'h4',
    [ElementType.H5]: 'h5',
    [ElementType.H6]: 'h6',
    [ElementType.HEADER]: 'header',
    [ElementType.MAIN]: 'main',
    [ElementType.NAV]: 'nav',
    [ElementType.SECTION]: 'section',
    [ElementType.UL]: 'ul',
    [ElementType.OL]: 'ol',
    [ElementType.IMG]: 'img'
};

const Locales = {
    Fr: {
        Elements: {
            [ElementType.P]: 'Paragraphe',
            [ElementType.DIV]: 'Bloc',
            [ElementType.ADDRESS]: 'Adresse',
            [ElementType.ARTICLE]: 'Article',
            [ElementType.ASIDE]: 'Contenu annexe',
            [ElementType.BLOCKQUOTE]: 'Citation',
            [ElementType.FOOTER]: 'Pied de page',
            [ElementType.H1]: 'Titre',
            [ElementType.H2]: 'Sous-titre',
            [ElementType.H3]: 'Titre 3',
            [ElementType.H4]: 'Titre 4',
            [ElementType.H5]: 'Titre 5',
            [ElementType.H6]: 'Titre 6',
            [ElementType.HEADER]: 'En-tête',
            [ElementType.MAIN]: 'Contenu principal',
            [ElementType.NAV]: 'Navigation',
            [ElementType.SECTION]: 'Section',
            [ElementType.UL]: 'Liste non-ordonnée',
            [ElementType.OL]: 'Liste ordonnée',
            [ElementType.IMG]: 'Image',
        }
    }
}

// Classe Element, au centre de tout
class Element {
    constructor(type, name, properties, showElementProperties = true, js) {
        // Déclaration des propriétés
        this._type = type;
        this._name = name;
        this._position = projectInfos.elements.length;
        this._properties = properties != null ? properties : {
            color: 'default',
            backgroundColor: 'transparent',
            fontFamily: 'sans-serif',
            textAlign: 'default',
            border: '',
            borderRadius: '0',
            letterSpacing: '0',
            textShadow: 'none',
            margin: ''
        };
        this._js = js != null ? js : {
            event: '',
            action: '',
            text: ''
        };
    }

    // Suppression d'un élément
    delete(update = true, deleteElement = true) {
        if (deleteElement) { // Retirer l'instance du tableau projectInfos.elements
            projectInfos.elements.splice(this._position, 1);
        }

        // Supprimer l'élément HTML de l'aperçu
        $(`#elem-${this._position}`).remove();

        // Mettre à jour toutes les positions des éléments situés après celui-ci
        for (let i = this._position; i <= projectInfos.elements.length; i++) {
            if (i < projectInfos.elements.length) {
                projectInfos.elements[i].position--;
            }
            $(`#elem-${i}`).attr('id', `elem-${i-1}`);
        }

        remote.getGlobal('webbyData').projectInfos = projectInfos;

        if (update) { // Mettre à jour la liste des éléments dans la sidebar
            updateElements();
        }
    }

    // Getters & Setters
    get type() {
        return this._type;
    }
    set type(type) {
        this._type = type;
    }

    get name() {
        return this._name;
    }
    set name(name) {
        this._name = name;
    }

    get position() {
        return this._position;
    }
    set position(position) {
        this._position = position;
    }

    get properties() {
        return this._properties;
    }
    set properties(properties) {
        this._properties = properties;
    }

    get js() {
        return this._js;
    }
    set js(js) {
        this._js = js;
    }

    get class() {
        return this._class;
    }
    set class(newClass) {
        this._class = newClass;
    }
}

class InlineElement extends Element {
    constructor(type, name, text, properties, showElementProperties, js) {
        super(type, name, properties, showElementProperties, js);
        this._class = 'InlineElement';
        this._text = text != null ? text : '';
    }

    get text() {
        return this._text;
    }
    set text(text) {
        this._text = text;
    }
}

class DataElement extends Element {
    constructor(type, name, data, properties,showElementProperties, js) {
        super(type, name, properties, showElementProperties, js);
        this._class = 'DataElement';
        this._data = data != null ? data : {};
    }

    get data() {
        return this._data;
    }
    set data(data) {
        this._data = data;
    }
}

class BlockElement extends Element {
    constructor(type, name, sizes, properties, showElementProperties, js, children, linkedPosition) {
        super(type, name, properties, showElementProperties, js);
        this._class = 'BlockElement';
        this._sizes = sizes != null ? sizes : [12, 12, 12];
        this._children = children != null ? children : [];
        this._linkedPosition = linkedPosition;
    }

    get type() {
        return super.type;
    }
    set type(type) {
        super.type = type;
        projectInfos.elements[this._linkedPosition].type = type;
    }

    get name() {
        return super.name;
    }
    set name(name) {
        super.name = name;
        projectInfos.elements[this._linkedPosition].name = name;
    }

    get position() {
        return super.position;
    }
    set position(position) {
        super.position = position;
        projectInfos.elements[this._linkedPosition].position = position;
    }

    get properties() {
        return super.properties;
    }
    set properties(properties) {
        super.properties = properties;
        projectInfos.elements[this._linkedPosition].properties = properties;
    }

    get js() {
        return super.js;
    }
    set js(js) {
        super.js = js;
        projectInfos.elements[this._linkedPosition].js = js;
    }

    get class() {
        return super.class;
    }
    set class(newClass) {
        super.class = newClass;
        projectInfos.elements[this._linkedPosition].class = newClass;
    }

    get sizes() {
        return this._sizes;
    }
    set sizes(sizes) {
        this._sizes = sizes;
    }

    get children() {
        return this._children;
    }
    set children(children) {
        this._children = children;
    }

    get linkedPosition() {
        return this._linkedPosition;
    }
    set linkedPosition(linkedPosition) {
        this._linkedPosition = linkedPosition;
    }
}

alog = (data) => {
    console.log(JSON.parse(JSON.stringify(data)));
}

class SpecialElement extends Element {
    constructor(linkedInstance) {
        super(
            linkedInstance.type,
            linkedInstance.name,
            linkedInstance.properties,
            linkedInstance.showElementProperties,
            linkedInstance.js
        );
        this._oldPosition = linkedInstance._position;
        linkedInstance.linkedPosition = this._position;
    }

    get oldPosition() {
        return this._oldPosition;
    }
    set oldPosition(oldPosition) {
        this._oldPosition = oldPosition;
    }
}

// Informations du projet en cours
let projectInfos = {
    name: '',
    metadatas: {
        title: '',
        description: '',
        url: '',
        lang: '',
        img: '',
        ogType: '',
        ogTypeParams: {}
    },
    bodyProperties: {
        color: '',
        image: ''
    },
    elements: []
};

remote.getGlobal('webbyData').projectInfos = projectInfos;

// Mise à jour de la hauteur de la div des éléments (dans la sidebar) pour concorder avec la hauteur de l'écran
function resize() {
    $elems.height( $s.innerHeight() - $('#sidebar-title').outerHeight() - 32 );
}
$w.resize(resize);
resize();

exportPreview = () => {
    let $export = $p.clone();

    //$export.children('p,address,blockquote,h1,h2,h3,h4,h5,h6,ul,ol,img').addClass('small-12').addClass('columns');

    return beautify(`<!DOCTYPE html>
<html lang="${projectInfos.metadatas.lang}" dir="ltr" prefix="og: http://ogp.me/ns#">
    <head>
        <meta charset="utf-8" />
        <meta http-equiv="x-ua-compatible" content="ie=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        <title>${projectInfos.metadatas.title || projectInfos.name}</title>
        <meta name="description" content="${projectInfos.metadatas.description}" />
        <meta property="og:title" content="${projectInfos.metadatas.title || projectInfos.name}" />
        <meta property="og:type" content="${projectInfos.metadatas.ogType}" />
        <meta property="og:url" content="${projectInfos.metadatas.url}" />
        <meta property="og:image" content="${projectInfos.metadatas.img}" />
        <meta property="og:description" content="${projectInfos.metadatas.description}" />
        <meta property="og:locale" content="${projectInfos.metadatas.lang}" />

        <link rel="stylesheet" href="https://webby.heysora.net/foundation.min.css" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto+Condensed:400,400i,700,700i%7CRoboto:400,400i,700,700i" />  

        <style>
            *, h1, h2, h3 {
                font-family: "Roboto", "Helvetica Neue", Helvetica, Arial, sans-serif;
            }

            h4, h5, h6 {
                font-family: "Roboto Condensed", "Helvetica Neue", Helvetica, Arial, sans-serif;
            }

            html, body {
                min-height: 100%;
            }

            body {
                background: ${projectInfos.bodyProperties.color} url('${projectInfos.bodyProperties.image}') no-repeat center center fixed;
                -webkit-background-size: cover;
                -moz-background-size: cover;
                -ms-background-size: cover;
                -o-background-size: cover;
                background-size: cover;
                word-wrap: break-word;
            }
        </style>
    </head>
    <body>
        <div class="row">
            ${$export.html()}
        </div>

        <script src="https://code.jquery.com/jquery-3.1.1.min.js" integrity="sha256-hVVnYaiADRTO2PzUGmuLJr8BLUSjGIZsDYGmIJLv2b8= sha384-3ceskX3iaEnIogmQchP8opvBy3Mi7Ce34nWjpBIwVTHfGYWQS9jwHDVRnpKKHJg7 sha512-U6K1YLIFUWcvuw5ucmMtT9HH4t0uz3M366qrF5y4vnyH6dgDzndlcGvH/Lz5k8NFh80SN95aJ5rqGZEdaQZ7ZQ==" crossorigin="anonymous"></script>

        <script src="https://webby.heysora.net/what-input.js" integrity="sha256-KMqcTylJ68ulQkRhXvNWbHigbDNg0P/GsbejTZUC3X4= sha384-oZFMpwhLrPDLzzJZlB/BGvNJ55D7GMcNOl23buKTT6kac6JkWmIZi3FP5n9odgjj sha512-lWxwvEBkyl6ST2DRCc2ZgacLNKmy7R+DAg6R8Eu9KLa7szpig6zN+V0b1GL/N1yyckFyWcvYB4dAi9DmetY2Cw==" crossorigin="anonymous"></script>
        <script src="https://webby.heysora.net/foundation.min.js" integrity="sha256-V428304adQn81KybT4/uZv8uNrchI8tI0rieKxppNc8= sha384-DPq7BHHDDUCTgkwE8wngcz64YwRe/Ype7H4iAjMDCpsy/Pns9RtFYcm1npfqhxAZ sha512-tn0JNwfTLwZqzwNuiPlp4M1Q2mFyZ2jaq3u7NlvjW+5CsrtHDDJC/1ofnTBOKungbnQMaX30F6STfqKuXW33qA==" crossorigin="anonymous"></script>
    </body>
</html>`, {
        indent_level: 1,
        max_preserve_newlines: 5,
        space_in_paren: true,
        space_in_empty_paren: true,
        jslint_happy: true,
        keep_array_indentation: true,
        wrap_line_length: 40,
        e4x: true,
        comma_first: true,
        space_before_conditional: true
    });
}

// Ouvertures d'assistants
newProject = () => { // Assistant nouveau projet
    $npModal.foundation('open');
}

showProjectProperties = () => { // Assistant propriétés du projet
    $ppModal.find('[name="project-name"]').val(projectInfos.name);

    // Mise à jour des champs dynamiquement
    $.each(projectInfos.metadatas, (i, v) => {
        let element = $ppModal.find(`[name="project-metadatas-${i}"]`);
        if (element != null && element.length > 0) {
            switch (element.tagName()) {
                case 'input':
                case 'textarea':
                    element.val(v);
                    break;
                case 'select':
                    element.children(`[value="${v}"]`).prop('selected', true);
                    break;
            }
        }
    });

    $ppModal.foundation('open');
}

showBodyProperties = () => {
    // Mise à jour des champs dynamiquement
    $.each(projectInfos.bodyProperties, (i, v) => {
        let element = $bpModal.find(`[name="project-bodyProperties-${i}"]`);
        console.log(`[name="project-bodyProperties-${i}"]`);
        console.log(element.length);
        console.log(v);
        if (element != null && element.length > 0) {
            switch (element.tagName()) {
                case 'input':
                case 'textarea':
                    element.val(v);
                    break;
                case 'select':
                    element.children(`[value="${v}"]`).prop('selected', true);
                    break;
            }
        }
    });

    $bpModal.foundation('open')
}

$('.element-properties').click(function() { // Propriétés de l'élément
    // Définition d'un input caché, utilisé pour appliquer les propriétés au bon élément
    let id = $(this).closest('[id^="element-"]').attr('id').substr(8);
    let instance = projectInfos.elements[id];
    $epModal.find('[type="hidden"]').val(id);

    $epModal.find('#sizes').css('display', '');
    $epModal.find('#text').css('display', '');
    $epModal.find('[id^="data-"]').css('display', '');
    $epModal.find('#style').css('display', '');

    if (instance instanceof DataElement) {
        $epModal.find('#sizes').css('display', 'none');
        $epModal.find('#text').css('display', 'none');

        $epModal.find(`#data-${Tags[instance.type]}`).css('display', 'block');

        // Préparation des assistants personnalisés
        switch (instance.type) {
            case ElementType.UL:
                for (let i = 0; i < getLength(instance.data) - 1; i++) {
                    $('#add-ul-element').click();
                }
                break;
            case ElementType.OL:
                for (let i = 0; i < getLength(instance.data) - 1; i++) {
                    $('#add-ol-element').click();
                }
                break;
            case ElementType.IMG:
                    $epModal.find('#style').css('display', 'none');
                break;
        }
    } else if (instance instanceof InlineElement) {
        $epModal.find('#sizes').css('display', 'none');
    } else if (instance instanceof BlockElement) {
        $epModal.find('#text').css('display', 'none');
    }

    // Application des propriétés dans les champs de texte
    $.each(projectInfos.elements[id], (i,v) => {
        let element = $epModal.find(`[name="element-${i.substr(1)}"]`);
        if (element != null && element.length > 0) {
            switch (element.tagName()) { // Comportement différent selon le type de champ
                case 'textarea':
                    element.val(v
                        .replaceAll('<br />', '\n')
                        .replaceAll(/\/{2}(.+?)\/{2}/,'\\//$1//')
                        .replaceAll(/<em>(.+?)<\/em>/,'//$1//')
                        .replaceAll(/_{2}(.+?)_{2}/,'\\__$1__')
                        .replaceAll(/<u>(.+?)<\/u>/,'__$1__')
                        .replaceAll(/~(.+?)~/,'\\~$1~')
                        .replaceAll(/<s>(.+?)<\/s>/,'~$1~')
                        .replaceAll(/\*{2}(.+?)\*{2}/,'\\**$1**')
                        .replaceAll(/<strong>(.+?)<\/strong>/,'**$1**')
                        .replaceAll(/<a href="(.+?)" target="_blank">(.+?)<\/a>/, '[$2]($1)')
                    );
                    break;
                case 'input':
                    element.val(v);
                    break;
                case 'select':
                    element.children(`[value="${v}"]`).prop('selected', true);
                    break;
            }
        } else if (typeof v === 'object') {
            $.each(v, (i2,v2) => {
                let element2 = $epModal.find(`[name="element-${i.substr(1)}-${i2}"]`);

                if (element2 != null && element2.length > 0) {
                    switch (element2.tagName()) {
                        case 'input':
                        case 'textarea':
                            element2.val(v2);
                            break;
                        case 'select':
                            element2.children(`[value="${v2}"]`).prop('selected', true)
                            break;
                    }
                }
            });
        }
    });

    $epModal.foundation('open');
});

// Validation des assistants
$npModal.children('form').submit(ev => { // Nouveau projet
    $o.css('display', 'none');
    $npModal.foundation('close');

    // Suppression forcée de tous les éléments
    clearElements(true);

    // Réinitialisation des informations
    projectInfos = {
        name: '',
        metadatas: {
            title: '',
            description: '',
            url: '',
            lang: '',
            img: '',
            ogType: '',
            ogTypeParams: {}
        },
        bodyProperties: {
            color: '',
            image: ''
        },
        elements: []
    };

    // Remplissage des informations avec les nouvelles
    $npModal.find('input[type!="submit"],select').each((i, v) => {
        let $v = $(v);
        let indexes = $v.attr('name').substr(8).split('-');
        let varToFill = 'projectInfos';
        for (let i = 0; i < indexes.length; i++) {
            let v = indexes[i];
            if (isNaN(Number(v))) {
                varToFill += `.${v}`;
            } else {
                varToFill += `[${v}]`
            }
        }
        eval(varToFill + ' = "' + $v.val() + '"');
        $v.val('');
    });
    remote.getGlobal('webbyData').projectInfos = projectInfos;

    // Annuler le rechargement de la page, dû au bouton submit
    ev.preventDefault();
});

$ppModal.children('form').submit(ev => { // Enregistrement des propriétés du projet
    $ppModal.foundation('close');

    // Rempliissage des informations par les nouvelles
    $ppModal.find('input[type!="submit"],select').each((i, v) => {
        let $v = $(v);
        let indexes = $v.attr('name').substr(8).split('-');
        let varToFill = 'projectInfos';
        for (let i = 0; i < indexes.length; i++) {
            let v = indexes[i];
            if (isNaN(Number(v))) {
                varToFill += `.${v}`;
            } else {
                varToFill += `[${v}]`
            }
        }
        eval(varToFill + ' = "' + $v.val() + '"');
        $v.val('');
    });
    remote.getGlobal('webbyData').projectInfos = projectInfos;

    ev.preventDefault();
});

$bpModal.children('form').submit(ev => { // Propriétés body
    $bpModal.foundation('close');

    // Remplissage des informations avec les nouvelles
    $bpModal.find('input[type!="submit"],select').each((i, v) => {
        let $v = $(v);
        let indexes = $v.attr('name').substr(8).split('-');
        let varToFill = 'projectInfos';
        for (let i = 0; i < indexes.length; i++) {
            let v = indexes[i];
            if (isNaN(Number(v))) {
                varToFill += `.${v}`;
            } else {
                varToFill += `[${v}]`
            }
        }
        eval(varToFill + ' = "' + $v.val() + '"');
        $v.val('');
    });
    remote.getGlobal('webbyData').projectInfos = projectInfos;

    updateBody();

    // Annuler le rechargement de la page, dû au bouton submit
    ev.preventDefault();
});

$epModal.children('form').submit(ev => { // Modification des propriétés de l'élément
    $epModal.foundation('close');

    $epModal.find('input[type="submit"]').val('Modifier !');

    // Récupération de l'ID, pour savoir quel élément modifier.
    let id = $epModal.find('[type="hidden"]').val();

    let instance = projectInfos.elements[id];

    if (instance instanceof DataElement) {
        instance.data = {};
    }

    // Remplissage des informations par les nouvelles
    $epModal.find('input[type!="submit"][type!="hidden"],select,textarea').each((i,v) => {
        let $v = $(v);

        if (instance instanceof DataElement && $v.closest('[id^="data-"]').length > 0 && $v.closest(`#data-${Tags[instance.type]}`).length < 1) {
            return true;
        }

        let indexes = $v.attr('name').substr(8).split('-');
        let varToFill = `projectInfos.elements[${id}]`;
        for (let i = 0; i < indexes.length; i++) {
            let v = indexes[i];
            if (isNaN(Number(v))) {
                varToFill += `.${v}`;
            } else {
                varToFill += `[${v}]`
            }
            if (!eval('(function() { return (' + varToFill + ' != null); })()') && !(instance instanceof DataElement && varToFill.includes('.data'))) {
                return true;
            }
        }

        switch ($v.tagName()) {
            case 'textarea':
                $v.val($v.val()
                    .replaceAll('\r\n', '<br />')
                    .replaceAll('\n', '<br />')
                    .replaceAll(/\[(.+?)\]\((.+?)\)/,'<a href="$2" target="_blank">$1</a>')
                    .replaceAll(/(https?):\/{2}/, '$1:§§')
                    .replaceAll(/\*{2}(.+?)\*{2}/,'<strong>$1</strong>')
                    .replaceAll(/\/{2}(.+?)\/{2}/,'<em>$1</em>')
                    .replaceAll(/\\<em>(.+?)<\/em>/,'//$1//')
                    .replaceAll(/\\<strong>(.+?)<\/strong>/,'**$1**')
                    .replaceAll(/_{2}(.+?)_{2}/,'<u>$1</u>')
                    .replaceAll(/\\<u>(.+?)<\/u>/,'__$1__')
                    .replaceAll(/~(.+?)~/,'<s>$1</s>')
                    .replaceAll(/\\<s>(.+?)<\/s>/,'~$1~')
                    .replaceAll(/(https?):§{2}/, '$1://')
                );
                // no break
            case 'input':
                eval(varToFill + ' = `' + $v.val().replace('`', '\\`') + '`');
                $v.val('');
                break;
            case 'select':
                eval(varToFill + ' = "' + $v.find(":selected").val() + '"');
                $v.find(":selected").prop('selected', false);
                break;
        }
    });

    // Reset les assistants personnalisés
    $('#data-ul').find('ul:not(.accordion)').children().remove();
    let $ulList = $('#data-ul').find('.accordion-content').find('ul');
    let $ulNewElem = $(ulElementString($ulList.children().length));
    $ulNewElem.find('.remove-ul-element').click(removeUlElement);
    $ulNewElem.appendTo($ulList);

    $('#data-ol').find('ol:not(.accordion)').children().remove();
    let $olList = $('#data-ol').find('.accordion-content').find('ol');
    let $olNewElem = $(olElementString($olList.children().length));
    $olNewElem.find('.remove-ol-element').click(removeOlElement);
    $olNewElem.appendTo($olList);

    // Mise à jour de l'affichage dans la sidebar + aperçu
    updateElements(true);

    remote.getGlobal('webbyData').projectInfos = projectInfos;
    ev.preventDefault();
});

// Lors de l'importation d'un projet
ipcRenderer.on('project-loaded', (ev, elements) => {
    // Effacement des éléments, sans changer la variable globale (sa valeur est déjà correcte)
    clearElements(true, false);

    // Remplacement du JSON par des vraies instances d'Element
    projectInfos =  JSON.parse(JSON.stringify(remote.getGlobal('webbyData').projectInfos));
    $.each(elements, (i,v) => {
        let instance;
        switch (v._class) {
            case 'InlineElement':
                instance = new InlineElement(v._type, v._name, v._text, v._properties, false, v._js);
                break;
            case 'BlockElement':
                instance = new BlockElement(v._type, v._name, v._sizes, v._properties, false, v._js, v._children, v._linkedPosition);
                break;
            case 'DataElement':
                instance = new DataElement(v._type, v._name, v._data, v._properties, false, v._js);
                break;
        }

        projectInfos.elements[projectInfos.elements.length] = instance;
        addElement(instance);
    });
    remote.getGlobal('webbyData').projectInfos = projectInfos;

    updateElements();
});

$('.fa-arrows-v').click(onArrowClick);

// Lors du clic sur le bouton "Supprimer l'élément"
$('.delete-element').click(function(ev) {
    let id = $(this).closest('[id^="element-"]').attr('id').substr(8);
    projectInfos.elements[id].delete();
});

// Dropdown personnalisés
$('[data-toggle]').click(function() {
    $('#' + $(this).attr('data-toggle')).toggleClass('visible');
});

// Lors du clic sur le bouton "+"
$s.find('[id^="add-"]').click(function(ev) {
    let newTag = $(this).attr('id').substr(4);
    let type = ElementType[newTag.toUpperCase()];
    let className = ElementClass[type];

    let instance;
    let endInstance;

    instance = eval('(function() { return new ' + className + '(type, "Nom") })()');

    projectInfos.elements.push(instance);
    let $newElem = addElement(instance);

    if (className === 'BlockElement') {
        endInstance = new SpecialElement(instance);

        projectInfos.elements.push(endInstance);
        addElement(endInstance);
    }

    remote.getGlobal('webbyData').projectInfos = projectInfos;
    $epModal.find('input[type="submit"]').val('Créer !');
    $newElem.find('.element-properties').click();

    ev.preventDefault();
});

$('#add-ul-element').click(addUlElement);

$('.remove-ul-element').click(removeUlElement);

$('#add-ol-element').click(addOlElement);

$('.remove-ol-element').click(removeOlElement);

$('#button-bold').click(ev => {
    pelle('**');

    ev.preventDefault();
});

$('#button-italic').click(ev => {
    pelle('//');

    ev.preventDefault();
});

$('#button-underline').click(ev => {
    pelle('__');

    ev.preventDefault();
});

$('#button-strikethrough').click(ev => {
    pelle('~');

    ev.preventDefault();
});

$('.element-js').click(function() {
    let id = $(this).closest('[id^="element-"]').attr('id').substr(8);
    let instance = projectInfos.elements[id];
    $ejModal.find('[type="hidden"]').val(id);

    $.each(projectInfos.elements[id], (i,v) => {
        let element = $ejModal.find(`[name="element-${i.substr(1)}"]`);

        if (element != null && element.length > 0) {
            switch (element.tagName()) { // Comportement différent selon le type de champ
                case 'textarea':
                    element.val(v
                        .replaceAll('<br />', '\n')
                        .replaceAll(/\/{2}(.+?)\/{2}/,'\\//$1//')
                        .replaceAll(/<em>(.+?)<\/em>/,'//$1//')
                        .replaceAll(/_{2}(.+?)_{2}/,'\\__$1__')
                        .replaceAll(/<u>(.+?)<\/u>/,'__$1__')
                        .replaceAll(/~(.+?)~/,'\\~$1~')
                        .replaceAll(/<s>(.+?)<\/s>/,'~$1~')
                        .replaceAll(/\*{2}(.+?)\*{2}/,'\\**$1**')
                        .replaceAll(/<strong>(.+?)<\/strong>/,'**$1**')
                        .replaceAll(/<a href="(.+?)" target="_blank">(.+?)<\/a>/, '[$2]($1)')
                    );
                    break;
                case 'input':
                    element.val(v);
                    break;
                case 'select':
                    element.children(`[value="${v}"]`).prop('selected', true);
                    break;
            }
        } else if (typeof v === 'object') {
            $.each(v, (i2,v2) => {
                let element2 = $ejModal.find(`[name="element-${i.substr(1)}-${i2}"]`);

                if (element2 != null && element2.length > 0) {
                    switch (element2.tagName()) {
                        case 'input':
                        case 'textarea':
                            element2.val(v2);
                            break;
                        case 'select':
                            element2.children(`[value="${v2}"]`).prop('selected', true)
                            break;
                    }
                }
            });
        }
    });

    if (!$('.element-js-message').prop('selected')) {
        $('.element-js-text').addClass('hidden');
    } else {
        $('.element-js-text').removeClass('hidden');
    }

    $ejModal.foundation('open');
});

$('.element-js-action').change(function() {

    if ($('.element-js-message').prop('selected')) {
        $('.element-js-text').removeClass('hidden');
    } else {
        $('.element-js-text').addClass('hidden');
    }

});

$ejModal.children('form').submit(ev => {
    $ejModal.foundation('close');

    // Récupération de l'ID, pour savoir quel élément modifier.
    let id = $ejModal.find('[type="hidden"]').val();

    let instance = projectInfos.elements[id];

    $ejModal.find('input[type!="submit"][type!="hidden"],select,textarea').each((i,v) => {
        let $v = $(v);

        let indexes = $v.attr('name').substr(8).split('-');
        let varToFill = `projectInfos.elements[${id}]`;
        for (let i = 0; i < indexes.length; i++) {
            let v = indexes[i];
            if (isNaN(Number(v))) {
                varToFill += `.${v}`;
            } else {
                varToFill += `[${v}]`
            }
            if (!eval('(function() { return (' + varToFill + ' != null); })()') && !(instance instanceof DataElement && varToFill.includes('.data'))) {
                return true;
            }
        }
        switch ($v.tagName()) {
            case 'textarea':
                $v.val($v.val()
                    .replaceAll('\r\n', '<br />')
                    .replaceAll('\n', '<br />')
                    .replaceAll(/\[(.+?)\]\((.+?)\)/,'<a href="$2" target="_blank">$1</a>')
                    .replaceAll(/(https?):\/{2}/, '$1:§§')
                    .replaceAll(/\*{2}(.+?)\*{2}/,'<strong>$1</strong>')
                    .replaceAll(/\/{2}(.+?)\/{2}/,'<em>$1</em>')
                    .replaceAll(/\\<em>(.+?)<\/em>/,'//$1//')
                    .replaceAll(/\\<strong>(.+?)<\/strong>/,'**$1**')
                    .replaceAll(/_{2}(.+?)_{2}/,'<u>$1</u>')
                    .replaceAll(/\\<u>(.+?)<\/u>/,'__$1__')
                    .replaceAll(/~(.+?)~/,'<s>$1</s>')
                    .replaceAll(/\\<s>(.+?)<\/s>/,'~$1~')
                    .replaceAll(/(https?):§{2}/, '$1://')
                );
                // no break
            case 'input':
                eval(varToFill + ' = `' + $v.val().replace('`', '\\`') + '`');
                $v.val('');
                break;
            case 'select':
                eval(varToFill + ' = "' + $v.find(":selected").val() + '"');
                $v.find(":selected").prop('selected', false);
                break;
        }
    });

    updateElements(true);

    remote.getGlobal('webbyData').projectInfos = projectInfos;

    ev.preventDefault();
});

// Lors du scroll sur la liste d'éléments, mise à jour de la position des fenêtres flottantes
$elems.scroll(() => {
    $elems.find('[id$="dropdown-properties"]').css('margin-top', -$elems.scrollTop());
    let $lastDropdown = $elems.children(':last-child').find('[id$="dropdown-properties"]')
    $lastDropdown.css('margin-top', -($elems.scrollTop() + $lastDropdown.outerHeight() + 28));
});

$('#create-project').click(newProject);
$('#import-project').click(() => {
    if (ipcRenderer.sendSync('load-project', 'hey')) {
        $o.css('display', 'none');
    }
});

// Lorsque la page est prête
$(() => {

    // Création d'une liste réordrable
    Sortable.create(document.getElementById('elements'), {
        handle: '.fa-arrows-v',
        animation: 150,
        onEnd(ev) {
            if (ev.oldIndex == ev.newIndex) {
                return;
            }

            let instance = projectInfos.elements[ev.oldIndex];

            instance.position = ev.newIndex;
            if (instance instanceof SpecialElement) {
                projectInfos.elements[instance.oldPosition].linkedPosition = ev.newIndex;
            } else if (instance instanceof BlockElement) {
                projectInfos.elements[instance.linkedPosition].oldPosition = ev.newIndex;
            }

            projectInfos.elements.move(ev.oldIndex, ev.newIndex);

            if (ev.newIndex > ev.oldIndex) {
                for (let i = ev.newIndex - 1; i >= ev.oldIndex; i--) {
                    let curInstance = projectInfos.elements[i];
                    curInstance.position--;
                    if (curInstance instanceof SpecialElement) {
                        projectInfos.elements[curInstance.oldPosition].linkedPosition--;
                    } else if (curInstance instanceof BlockElement) {
                        projectInfos.elements[curInstance.linkedPosition].oldPosition--;
                    }
                }

                /*
                let $movedElem = $(`#elem-${ev.oldIndex}`).insertAfter(`#elem-${ev.newIndex}`).attr('id', `elem-${ev.newIndex}-a`);
                for (let i = ev.oldIndex + 1; i <= ev.newIndex; i++) {
                    $(`#elem-${i}`).attr('id', `elem-${i-1}`);
                }
                $movedElem.attr('id', `elem-${ev.newIndex}`);
                */
            } else {
                for (let i = ev.newIndex + 1; i <= ev.oldIndex; i++) {
                    let curInstance = projectInfos.elements[i];
                    curInstance.position++;
                    if (curInstance instanceof SpecialElement) {
                        projectInfos.elements[curInstance.oldPosition].linkedPosition++;
                    } else if (curInstance instanceof BlockElement) {
                        projectInfos.elements[curInstance.linkedPosition].oldPosition++;
                    }
                }

                /*
                let $movedElem = $(`#elem-${ev.oldIndex}`).insertBefore(`#elem-${ev.newIndex}`).attr('id', `elem-${ev.newIndex}-a`);
                for (let i = ev.oldIndex - 1; i >= ev.newIndex; i--) {
                    $(`#elem-${i}`).attr('id', `elem-${i+1}`);
                }
                $movedElem.attr('id', `elem-${ev.newIndex}`);
                */
            }

            remote.getGlobal('webbyData').projectInfos = projectInfos;

            updateElements(true);
        }
    });

    // Initialisation de foundation
    $(document).foundation();
});