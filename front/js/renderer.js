// Implémentation de méthodes supplémentaires
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

// Importation des modules
const {remote, ipcRenderer} = require('electron');

// Déclaration des variables globales
let $d = $(document),
	$w = $(window),
	$s = $('#sidebar'),
	$elems = $('#elements'),
	$p = $('#preview'),
	$npModal = $('#new-project-modal'),
	$ppModal = $('#project-properties-modal'),
	$epModal = $('#element-properties-modal');
	$ejModal = $('#element-js-modal');

// Déclaration des enums
const ElementType = {
	// todo img ul ol li hr
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
};

const ElementClass = {
	0: 'InlineElement',
	1: 'BlockElement',
	2: 'InlineElement',
	3: 'BlockElement',
	4: 'BlockElement',
	5: 'InlineElement',
	6: 'BlockElement',
	7: 'InlineElement',
	8: 'InlineElement',
	9: 'InlineElement',
	10: 'InlineElement',
	11: 'InlineElement',
	12: 'InlineElement',
	13: 'BlockElement',
	14: 'BlockElement',
	15: 'BlockElement',
	16: 'BlockElement',
	17: 'DataElement',
};

const Tags = [
	'p',
	'div',
	'address',
	'article',
	'aside',
	'blockquote',
	'footer',
	'h1',
	'h2',
	'h3',
	'h4',
	'h5',
	'h6',
	'header',
	'main',
	'nav',
	'section',
	'ul',
];

const Locales = {
	Fr: {
		Elements: [
			'Paragraphe',
			'Bloc',
			'Adresse',
			'Article',
			'Contenu annexe',
			'Citation',
			'Pied de page',
			'Titre',
			'Sous-titre',
			'Titre 3',
			'Titre 4',
			'Titre 5',
			'Titre 6',
			'En-tête',
			'Contenu principal',
			'Navigation',
			'Section',
			'Liste non-ordonnée'
		]
	}
}

// Classe Element, au centre de tout
class Element {
	constructor(type, name, properties, showElementProperties = true) {
		// Déclaration des propriétés
		this._type = type;
		this._name = name;
		this._position = projectInfos.elements.length;
		this._properties = properties != null ? properties : {
			color: 'default',
			backgroundColor: 'transparent',
			fontFamily: 'sans-serif',
			textAlign: 'default'
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
}

class InlineElement extends Element {
	constructor(type, name, text, properties, showElementProperties) {
		super(type, name, properties, showElementProperties);
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

class DataElement extends InlineElement {
	constructor(type, name, text, properties, data, showElementProperties) {
		super(type, name, text, properties, showElementProperties);
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
	constructor(type, name, sizes, properties, showElementProperties) {
		super(type, name, properties, showElementProperties);
		this._class = 'BlockElement';
		this._sizes = sizes != null ? sizes : [12, 12, 12];
	}

	get sizes() {
		return this._sizes;
	}
	set sizes(sizes) {
		this._sizes = sizes;
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
	elements: []
};

remote.getGlobal('webbyData').projectInfos = projectInfos;

// Mise à jour de la hauteur de la div des éléments (dans la sidebar) pour concorder avec la hauteur de l'écran
function resize() {
	$elems.height( $s.innerHeight() - $('#sidebar-title').outerHeight() - 32 );
}
$w.resize(resize);
resize();

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

$('.element-properties').click(function() { // Propriétés de l'élément
	// Définition d'un input caché, utilisé pour appliquer les propriétés au bon élément
	let id = $(this).closest('[id^="element-"]').attr('id').substr(8);
	let instance = projectInfos.elements[id];
	$epModal.find('[type="hidden"]').val(id);

	$epModal.find('#sizes').css('display', '');
	$epModal.find('#text').css('display', '');
	$epModal.find('[id^="data-"]').css('display', '');

	if (instance instanceof InlineElement) {
		$epModal.find('#sizes').css('display', 'none');
	} else if (instance instanceof BlockElement) {
		$epModal.find('#text').css('display', 'none');
	}

	if (instance instanceof DataElement) {
		$epModal.find(`#data-${Tags[instance.type]}`).css('display', 'block');
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
						.replaceAll(/<em>{1}(.+?)<\/em>{1}/,'//$1//')
						.replaceAll(/_{2}(.+?)_{2}/,'\\__$1__')
						.replaceAll(/<u>{1}(.+?)<\/u>{1}/,'__$1__')
						.replaceAll(/~{1}(.+?)~{1}/,'\\~$1~')
						.replaceAll(/<s>{1}(.+?)<\/s>{1}/,'~$1~')
						.replaceAll(/\*{2}(.+?)\*{2}/,'\\**$1**')
						.replaceAll(/<strong>{1}(.+?)<\/strong>{1}/,'**$1**')
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
		elements: []
	};

	// Remplissage des informations avec les nouvelles
	$npModal.find('input[type!="submit"],select').each((i, v) => {
		let $v = $(v);
		let indexes = $v.attr('name').substr(8).split('-');
		let varToFill = 'projectInfos';
		for (let i = 0; i < indexes.length; i++) {
			let v = indexes[i];
			if (isNaN(parseInt(v))) {
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
			if (isNaN(parseInt(v))) {
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

$epModal.children('form').submit(ev => { // Modification des propriétés de l'élément
	$epModal.foundation('close');

	// Récupération de l'ID, pour savoir quel élément modifier.
	let id = $epModal.find('[type="hidden"]').val();

	let instance = projectInfos.elements[id];

	// Remplissage des informations par les nouvelles
	$epModal.find('input[type!="submit"][type!="hidden"],select,textarea').each((i,v) => {
		let $v = $(v);

		let indexes = $v.attr('name').substr(8).split('-');
		let varToFill = `projectInfos.elements[${id}]`;
		for (let i = 0; i < indexes.length; i++) {
			let v = indexes[i];
			if (isNaN(parseInt(v))) {
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
					.replaceAll(/~{1}(.+?)~{1}/,'<s>$1</s>')
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

	// Mise à jour de l'affichage dans la sidebar
	updateElements();

	// Mise à jour de l'élément de l'aperçu
	updateHTMLElement(projectInfos.elements[id]);

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
		if (v._class === 'InlineElement') {
			instance = new InlineElement(v._type, v._name, v._text, v._properties, false);
		} else {
			instance = new BlockElement(v._type, v._name, v._sizes, v._properties, false);
		}

		projectInfos.elements[projectInfos.elements.length] = instance;
		addElement(instance);
	});
	remote.getGlobal('webbyData').projectInfos = projectInfos;
});

// Convertit un élément interne en élément lisible par l'utilisateur
function typeToLocale(type, lang = 'fr') {
	return Locales[lang.capitalizeFirstLetter()].Elements[type];
}

// Ajout d'un élément
function addElement(elem, addTags = true) {
	// Clonage de la template d'élément de sidebar
	let $newElem = $('#template-element').clone(true);

	// Changement des IDs/Classes
	$newElem.attr('id', `element-${elem.position}`);
	$newElem.find('.dropdown-pane').attr('id', elem.position + '-dropdown-properties');
	$newElem.find('[data-toggle]').attr('data-toggle', elem.position + '-dropdown-properties');

	// Contenu de l'élément
	if (elem.text != null && elem.text !== '') {
		$newElem.find('strong').html(elem.name + ' &middot; ' + typeToLocale(elem.type));
		$newElem.find('em').html($(`<span>${elem.text.replaceAll('<br />', '   ')}</span>`).text());
	} else {
		$newElem.find('strong').html(elem.name);
		$newElem.find('em').html(typeToLocale(elem.type));
	}

	// Ajout d'éléments dans l'aperçu
	if (addTags) {
		let $newTag = $(`<${Tags[elem.type]}>`).attr('id', `elem-${elem.position}`).html(elem.text);
		$.each(elem.properties, (i,v) => {
			if (v === 'default') {
				return;
			}
			$newTag.css(i, v);
		});
		$newTag.appendTo('#preview');
	}

	$newElem.appendTo('#elements');

	return $newElem;
}

// Mise à jour de l'élément de l'aperçu
function updateHTMLElement(element) {
	let $elem = $(`#elem-${element.position}`);
	$elem.html(element.text);
	$.each(element.properties, (i,v) => {
		if (v === 'default') {
			$elem.css(i, '');
		} else {
			$elem.css(i, v);
		}
	});
}

// Mise à jour de l'affichage de tous les éléments de la sidebar
function updateElements() {
	clearElements();
	$.each(projectInfos.elements, (i,v) => {
		addElement(v, false);
	});
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
	let instance = eval('(function() { return new ' + ElementClass[type] + '(type, "Nom") })()');

	projectInfos.elements.push(instance);
	let $newElem = addElement(instance);
	remote.getGlobal('webbyData').projectInfos = projectInfos;

	$newElem.find('.element-properties').click();

	ev.preventDefault();
});

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

$('#add-ul-element').click(function(ev) {
	let $list = $(this).closest('.accordion-content').find('ul');
	let $newElem = $(`<li><div class="input-group"><input type="text" class="input-group-field" name="element-data-${$list.children().length}" /><a href="#" class="input-group-button button remove-ul-element"><i class="fa fa-times"></i></a></div></li>`);
	$newElem.find('.remove-ul-element').click(removeUlElement);
	$newElem.appendTo($list);

	ev.preventDefault();
});

function removeUlElement(ev) {
	let $parent = $(this).parent();
	let id = $parent.children('input').attr('name').substr(13);
	let $list = $parent.closest('.accordion-content').find('ul');
	$list.children('li').eq(id).remove();

	$list.children().each((i,v) => {
		if (i < id) {
			return true;
		}

		$(v).find('[name^="element-data-"]').attr('name', `element-data-${i}`);
	});
}

$('.remove-ul-element').click(removeUlElement);

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
	$($ejModal).foundation('open');
	$('.element-js-text').addClass('hidden');
});

$('.element-js-action').change(function() {

		if ($('.element-js-message').prop('selected'))
			{
				$('.element-js-text').removeClass('hidden');
			}
			else
			{
				$('.element-js-text').addClass('hidden');
			}

});

$ejModal.children('form').submit(ev => {
	$ejModal.foundation('close');
	$ejModal.find('input[type!="submit"],select,textarea').each((i, v) => {
		let $v = $(v);
		let indexes = $v.attr('name').substr(8).split('-');
		let varToFill = 'projectInfos';
		for (let i = 0; i < indexes.length; i++) {
			let v = indexes[i];
			if (isNaN(parseInt(v))) {
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
// Lors du scroll sur la liste d'éléments, mise à jour de la position des fenêtres flottantes
$elems.scroll(() => {
	$elems.find('[id$="dropdown-properties"]').css('margin-top', -$elems.scrollTop());
	let $lastDropdown = $elems.children(':last-child').find('[id$="dropdown-properties"]')
	$lastDropdown.css('margin-top', -($elems.scrollTop() + $lastDropdown.outerHeight() + 28));
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

			projectInfos.elements[ev.oldIndex].position = ev.newIndex;

			projectInfos.elements.move(ev.oldIndex, ev.newIndex);

			if (ev.newIndex > ev.oldIndex) {
				for (let i = ev.newIndex - 1; i >= 0; i--) {
					projectInfos.elements[i].position--;
				}

				let $movedElem = $(`#elem-${ev.oldIndex}`).insertAfter(`#elem-${ev.newIndex}`).attr('id', `elem-${ev.newIndex}-a`);
				for (let i = ev.oldIndex + 1; i <= ev.newIndex; i++) {
					$(`#elem-${i}`).attr('id', `elem-${i-1}`);
				}
				$movedElem.attr('id', `elem-${ev.newIndex}`);
			} else {
				for (let i = ev.newIndex + 1; i <= ev.oldIndex; i++) {
					projectInfos.elements[i].position++;
				}

				let $movedElem = $(`#elem-${ev.oldIndex}`).insertBefore(`#elem-${ev.newIndex}`).attr('id', `elem-${ev.newIndex}-a`);
				for (let i = ev.oldIndex - 1; i >= ev.newIndex; i--) {
					$(`#elem-${i}`).attr('id', `elem-${i+1}`);
				}
				$movedElem.attr('id', `elem-${ev.newIndex}`);
			}

			remote.getGlobal('webbyData').projectInfos = projectInfos;

			updateElements();
		}
	});

	// Initialisation de foundation
	$(document).foundation();
});