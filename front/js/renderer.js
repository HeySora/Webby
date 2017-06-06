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

// Déclaration des enums
const ElementType = {
	// todo img ul ol li hr
	P: 0,
	DIV: 1,
	A: 2,
	ADDRESS: 3,
	ARTICLE: 4,
	ASIDE: 5,
	BLOCKQUOTE: 6,
	FOOTER: 7,
	H1: 8,
	H2: 9,
	H3: 10,
	H4: 11,
	H5: 12,
	H6: 13,
	HEADER: 14,
	MAIN: 15,
	NAV: 16,
	SECTION: 17,
};

const Tags = [
	'p',
	'div',
	'a',
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
];

const Locales = {
	Fr: {
		Elements: [
			'Paragraphe',
			'Bloc',
			'Hyperlien',
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
			'Section'
		]
	}
}

// Classe Element, au centre de tout
class Element {
	constructor(type, name, text, sizes, properties) {
		// Déclaration des propriétés
		this._type = type;
		this._name = name;
		this._text = text != null ? text : '';
		this._position = projectInfos.elements.length;
		this._sizes = sizes != null ? sizes : [12, 12, 12];
		this._properties = properties != null ? properties : {
			color: 'default',
			backgroundColor: 'transparent',
			fontFamily: 'sans-serif'
		};

		projectInfos.elements.push(this);
		// Mise à jour de la variable globale à chaque modification de projectInfos
		remote.getGlobal('webbyData').projectInfos = projectInfos;

		// Création de l'élément HTML dans l'aperçu
		addElement(this);
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

	get text() {
		return this._text;
	}
	set text(text) {
		this._text = text;
	}

	get position() {
		return this._position;
	}
	set position(position) {
		this._position = position;
	}

	get sizes() {
		return this._sizes;
	}
	set sizes(sizes) {
		this._sizes = sizes;
	}

	get properties() {
		return this._properties;
	}
	set properties(properties) {
		this._properties = properties;
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
	$epModal.find('[type="hidden"]').val(id);

	// Application des propriétés dans les champs de texte
	$.each(projectInfos.elements[id], (i,v) => {
		let element = $epModal.find(`[name="element-${i.substr(1)}"]`);

		if (element != null && element.length > 0) {
			switch (element.tagName()) { // Comportement différent selon le type de champ
				case 'textarea':
					element.val(v.replaceAll('<br />', '\n'));
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
		}
		switch ($v.tagName()) {
			case 'textarea':
				$v.val($v.val().replaceAll('\r\n', '<br />').replaceAll('\n', '<br />'));
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
ipcRenderer.on('project-loaded', (ev, infos) => {
	// Effacement des éléments, sans changer la variable globale (sa valeur est déjà correcte)
	clearElements(true, false);

	// Remplacement du JSON par des vraies instances d'Element
	projectInfos = infos;
	let jsonElements = projectInfos.elements;
	projectInfos.elements = [];
	$.each(jsonElements, (i,v) => {
		new Element(v._type, v._name, v._text, v._sizes, v._properties);
	});
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
	if (elem.text !== '') {
		$newElem.find('strong').html(elem.name + ' &middot; ' + typeToLocale(elem.type));
		$newElem.find('em').html(elem.text.replaceAll('<br />', ' '));
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
	new Element(ElementType[newTag.toUpperCase()], 'Nom', 'Texte');
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
	new Element(ElementType.P, 'Nom', 'bb');
	new Element(ElementType.DIV, 'Nom', 'bb');
	new Element(ElementType.A, 'Nom', 'bb');
	new Element(ElementType.ADDRESS, 'Nom', 'bb');
	new Element(ElementType.ARTICLE, 'Nom', 'bb');
	new Element(ElementType.ASIDE, 'Nom', 'bb');
	new Element(ElementType.BLOCKQUOTE, 'Nom', 'bb');
	new Element(ElementType.FOOTER, 'Nom', 'bb');
	new Element(ElementType.H1, 'Nom', 'bb');
	new Element(ElementType.H2, 'Nom', 'bb');
	new Element(ElementType.H3, 'Nom', 'bb');
	new Element(ElementType.H4, 'Nom', 'bb');
	new Element(ElementType.H5, 'Nom', 'bb');
	new Element(ElementType.H6, 'Nom', 'bb');
	new Element(ElementType.HEADER, 'Nom', 'bb');
	new Element(ElementType.MAIN, 'Nom', 'bb');
	new Element(ElementType.NAV, 'Nom', 'bb');
	new Element(ElementType.SECTION, 'Nom', 'bb');

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