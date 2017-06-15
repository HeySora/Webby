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
	$ecModal = $('#element-children-modal'),
	$epModal = $('#element-properties-modal'),
	$ejModal = $('#element-js-modal');

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
		let imgChange;
		let $alt = $epModal.find('[name="element-img-alt"]');
		let $src = $epModal.find('[name="element-img-src"]');
		let $image = $('<img>').attr('id', `elem-${instance.position}`);

		$image.attr('src',$src.val()).attr('alt',$alt.val());

		return $image;
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
			textAlign: 'default'
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
	constructor(type, name, sizes, properties, showElementProperties, js, children) {
		super(type, name, properties, showElementProperties, js);
		this._class = 'BlockElement';
		this._sizes = sizes != null ? sizes : [12, 12, 12];
		this._children = children != null ? children : [];
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

$('.element-children').click(function() { // Enfants de l'élément
	let id = $(this).closest('[id^="element-"]').attr('id').substr(8);
	let instance = projectInfos.elements[id];

	if (instance.class !== 'BlockElement') {
		return;
	}

	$ecModal.find('[type="hidden"]').val(id);

	$.each(instance.children, (i,v) => {
		$ecModal.find(`#element-children-${v[0]}`).prop('checked', v[1]);
	});

	$(`#element-children-${instance.position}`)
	.prop('checked', false)
	.parent().css('display', 'none');

	for (let i = 0; i < projectInfos.elements.length; i++) {
		if (!$(`#elem-${i}`).is('#preview > *')) {
			$.each(instance.children, (i,v) => {
				if (v[1] == i && !v[2]) {
					$(`#element-children-${i}`)
					.prop('checked', false)
					.parent().css('display', 'none');
					return false;
				}
			})
		}
	}


	$ecModal.foundation('open');
});

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
				for (let i = 0; i < instance.data.length - 1; i++) {
					$('#add-ul-element').click();
				}
				break;
			case ElementType.OL:
				for (let i = 0; i < instance.data.length - 1; i++) {
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

	$epModal.find('input[type="submit"]').val('Modifier !');

	// Récupération de l'ID, pour savoir quel élément modifier.
	let id = $epModal.find('[type="hidden"]').val();

	let instance = projectInfos.elements[id];

	if (instance instanceof DataElement) {
		instance.data = [];
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
				instance = new BlockElement(v._type, v._name, v._sizes, v._properties, false, v._js, v._children);
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

// Convertit un élément interne en élément lisible par l'utilisateur
function typeToLocale(type, lang = 'fr') {
	return Locales[lang.capitalizeFirstLetter()].Elements[type];
}

// Ajout d'un élément
function addElement(instance, addTags = true) {
	// Clonage de la template d'élément de sidebar
	let $newElem = $('#template-element').clone(true);

	if (instance.class === 'BlockElement') {
		$newElem.find('.element-children').css('display', '');
	}

	// Mise à jour des checkboxes
	//updateCheckboxes();

	// Changement des IDs/Classes
	$newElem.attr('id', `element-${instance.position}`);
	$newElem.find('.dropdown-pane').attr('id', instance.position + '-dropdown-properties');
	$newElem.find('[data-toggle]').attr('data-toggle', instance.position + '-dropdown-properties');

	// Contenu de l'élément
	if (instance.text != null && instance.text !== '') {
		$newElem.find('strong').html(instance.name + ' &middot; ' + typeToLocale(instance.type));
		$newElem.find('em').html($(`<span>${instance.text.replaceAll('<br />', '   ')}</span>`).text());
	} else {
		$newElem.find('strong').html(instance.name);
		$newElem.find('em').html(typeToLocale(instance.type));
	}

	// Ajout d'éléments dans l'aperçu
	if (addTags) {
		if (instance instanceof DataElement) {
			$p.append(DataFunctions[instance.type](instance));
		} else {
			let $newTag = $(`<${Tags[instance.type]}>`).attr('id', `elem-${instance.position}`).html(instance.text);
			$.each(instance.properties, (i,v) => {
				if (v === 'default') {
					return;
				}
				$newTag.css(i, v);
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
			$newTag.appendTo('#preview');
		}
	}

	$newElem.appendTo('#elements');

	$ecModal.find('#element-children-container').append(
		$('<div></div>').append(
			$('<input type="checkbox" />')
			.attr('id', `element-children-${instance.position}`)
			.attr('name', `element-children-${instance.position}`)
		).append(
			$('<label></label>')
			.attr('for', `element-children-${instance.position}`)
			.html(`${instance.name} &middot; ${typeToLocale(instance.type)}`)
		)
	);

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
				$elem.css(i, v);
			}
		});
	}
}

// Mise à jour de l'affichage de tous les éléments de la sidebar (+ preview si demandé)
function updateElements(updateTags = false) {
	clearElements();
	if (updateTags) {
		deleteHTMLElements();
	}
	$.each(projectInfos.elements, (i,v) => {
		addElement(v, updateTags);
	});

	$.each(projectInfos.elements, (i,v) => {
		$.each(v.children, (i2,v2) => {
			if (v2[1]) {
				$(`#elem-${v2[0]}`).detach().appendTo(`#elem-${i}`);
			}
		});
	})
}

function updateCheckboxes() {
	$ecModal.find('#element-children-container').children().remove();

	let $cc = $ecModal.find('#element-children-container');
	$.each(projectInfos.elements, (i,v) => {
		$cc.append(
			$('<div></div>').append(
				$('<input type="checkbox" />')
				.attr('id', `element-children-${v.position}`)
				.attr('name', `element-children-${v.position}`)
			).append(
				$('<label></label>')
				.attr('for', `element-children-${v.position}`)
				.html(`${v.name} &middot; ${typeToLocale(v.type)}`)
			)
		);
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

	// Retrait des cases à cocher
	$ecModal.find('#element-children-container').children().remove();
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

// Lors du clic sur le bouton e"+"
$s.find('[id^="add-"]').click(function(ev) {
	let newTag = $(this).attr('id').substr(4);
	let type = ElementType[newTag.toUpperCase()];
	let instance = eval('(function() { return new ' + ElementClass[type] + '(type, "Nom") })()');

	projectInfos.elements.push(instance);

	if (ElementClass[type] === 'BlockElement') {
		for (let i = 0; i < projectInfos.elements.length; i++) {
			instance.children[i] = [i, false];
		}
	}

	let $newElem = addElement(instance);
	remote.getGlobal('webbyData').projectInfos = projectInfos;
	$epModal.find('input[type="submit"]').val('Créer !');
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

function addUlElement(ev) {
	let $list = $(this).closest('.accordion-content').find('ul');
	let $newElem = $(ulElementString($list.children().length));
	$newElem.find('.remove-ul-element').click(removeUlElement);
	$newElem.appendTo($list);

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

$('#add-ul-element').click(addUlElement);

$('.remove-ul-element').click(removeUlElement);

function addOlElement(ev) {
	let $list = $(this).closest('.accordion-content').find('ol');
	let $newElem = $(olElementString($list.children().length));
	$newElem.find('.remove-ol-element').click(removeOlElement);
	$newElem.appendTo($list);

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

$ecModal.children('form').submit(ev => {
	$ecModal.foundation('close');

	// Récupération de l'ID, pour savoir quel élément modifier.
	let id = $ecModal.find('[type="hidden"]').val();

	let instance = projectInfos.elements[id];

	if (instance.class !== 'BlockElement') {
		return;
	}

	$.each(instance.children, (i,v) => {
		let $checkbox = $ecModal.find(`#element-children-${i}`);
		$.each(instance.children, (i2,v2) => {
			console.log([i2, v2]);
			if (v2[0] == i) {
				instance.children[i2][1] = $checkbox.prop('checked');
				return false;
			}
		});
		if ($checkbox.parent().css('display') === 'none') {
			$checkbox.parent().css('display', '');
		}
		$checkbox.prop('checked', false);
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

			let ret = false;
			$.each(instance.children, (i,v) => {
				if (v[1]) {
					ret = true;
					return false;
				}
			})

			if (ret) {
				alert('Il est impossible de déplacer un élément contenant des enfants.');
				return true;
			}

			if (!$(`#elem-${instance.position}`).is('#preview > *')) {
				alert('Il est impossible de déplacer un élément enfant. Veuillez le retirer de son parent pour pouvoir le modifier.');
				return;
			}

			instance.position = ev.newIndex;

			projectInfos.elements.move(ev.oldIndex, ev.newIndex);

			if (ev.newIndex > ev.oldIndex) {
				for (let i = ev.newIndex - 1; i >= ev.oldIndex; i--) {
					projectInfos.elements[i].position--;

					$.each(instance.children, (i,v) => {
						if (v[0] == i) {
							instance.children[i][0]--;
						}
					});
				}

				let $movedElem = $(`#elem-${ev.oldIndex}`).insertAfter(`#elem-${ev.newIndex}`).attr('id', `elem-${ev.newIndex}-a`);
				for (let i = ev.oldIndex + 1; i <= ev.newIndex; i++) {
					$(`#elem-${i}`).attr('id', `elem-${i-1}`);
				}
				$movedElem.attr('id', `elem-${ev.newIndex}`);
			} else {
				for (let i = ev.newIndex + 1; i <= ev.oldIndex; i++) {
					projectInfos.elements[i].position++;

					$.each(instance.children, (i,v) => {
						if (v[0] == i) {
							instance.children[i][0]++;
						}
					});
				}

				let $movedElem;
				let succeed = false;
				for (let i = ev.newIndex; i >= 0; i--) {
					try {
						$movedElem = $(`#elem-${ev.oldIndex}`).insertBefore(`#elem-${ev.newIndex}`).attr('id', `elem-${ev.newIndex}-a`);
						succeed = true;
						break;
					} catch (ex) {}
				}
				if (!succeed) {
					alert("L'élément choisi est déjà au tout début !");
				}
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