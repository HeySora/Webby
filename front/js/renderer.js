Array.prototype.move = function (old_index, new_index) {
    if (new_index >= this.length) {
        var k = new_index - this.length;
        while ((k--) + 1) {
            this.push(undefined);
        }
    }
    this.splice(new_index, 0, this.splice(old_index, 1)[0]);
    return this;
};

jQuery.fn.tagName = function() {
	return this.prop('tagName').toLowerCase();
}

const {remote, ipcRenderer} = require('electron');

let $d = $(document),
	$w = $(window),
	$s = $('#sidebar'),
	$elems = $('#elements'),
	$p = $('#preview'),
	$npModal = $('#new-project-modal'),
	$ppModal = $('#project-properties-modal'),
	$epModal = $('#element-properties-modal');

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

class Element {
	constructor(type, name, text, sizes, properties) {
		this._type = type;
		this._name = name;
		this._text = text != null ? text : '';
		this._position = projectInfos.elements.length;
		this._sizes = sizes != null ? sizes : [12, 12, 12];
		this._properties = properties != null ? properties : {};

		projectInfos.elements.push(this);
		remote.getGlobal('webbyData').projectInfos = projectInfos;

		addElement(this);
	}

	delete(update = true, deleteElement = true) {
		if (deleteElement) {
			projectInfos.elements.splice(this._position, 1);
		}

		$(`#elem-${this._position}`).remove();
		for (let i = this._position; i <= projectInfos.elements.length; i++) {
			if (i < projectInfos.elements.length) {
				projectInfos.elements[i].position--;
			}
			$(`#elem-${i}`).attr('id', `elem-${i-1}`);
		}
		remote.getGlobal('webbyData').projectInfos = projectInfos;

		if (update) {
			updateElements();
		}
	}

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

function resize() {
	$elems.height( $s.innerHeight() - $('#sidebar-title').outerHeight() - 32 );
}
$w.resize(resize);
resize();

newProject = () => {
	$npModal.foundation('open');
}

showProjectProperties = () => {
	$ppModal.find('[name="project-name"]').val(projectInfos.name);

	$.each(projectInfos.metadatas, (i, v) => {
		let element = $ppModal.find(`[name="project-metadatas-${i}"]`);
		if (element != null && element.length > 0) {
			switch (element.tagName()) {
				case 'input':
					element.val(v);
					break;
				case 'select':
					element.children(`[value="${v}"]`).prop('selected', true);
					break;
				case 'textarea':
					element.text(v);
					break;
			}
		}
	});

	$ppModal.foundation('open');
}

$('.element-properties').click(function() {
	let id = $(this).closest('[id^="element-"]').attr('id').substr(8);
	$epModal.find('[type="hidden"]').val(id);

	$.each(projectInfos.elements[id], (i,v) => {
		let element = $epModal.find(`[name="element-${i.substr(1)}"]`);
		if (element != null && element.length > 0) {
			switch (element.tagName()) {
				case 'input':
					element.val(v);
					break;
				case 'select':
					element.children(`[value="${v}"]`).prop('selected', true);
					break;
				case 'textarea':
					element.text(v);
					break;
			}
		} else if (typeof v === 'object' && Array.isArray(v)) {
			$.each(v, (i2,v2) => {
				let element2 = $epModal.find(`[name="element-${i.substr(1)}-${i2}"]`);
				if (element2 != null && element2.length > 0) {
					switch (element2.tagName()) {
						case 'input':
							element2.val(v2);
							break;
						case 'select':
							element2.children(`[value="${v2}"]`).prop('selected', true)
							break;
						case 'textarea':
							element2.text(v2);
							break;
					}
				}
			});
		}
	});

	$epModal.foundation('open');
});

$npModal.children('form').submit(ev => {
	$npModal.foundation('close');

	clearElements(true);

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

	ev.preventDefault();
});

$ppModal.children('form').submit(ev => {
	$ppModal.foundation('close');

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

$epModal.children('form').submit(ev => {
	$epModal.foundation('close');

	$epModal.find('input[type!="submit"][type!="hidden"],select,textarea').each((i,v) => {
		let $v = $(v);
		let indexes = $v.attr('name').substr(8).split('-');
		let varToFill = `projectInfos.elements[${$epModal.find('[type="hidden"]').val()}]`;
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
	updateElements();
	remote.getGlobal('webbyData').projectInfos = projectInfos;

	ev.preventDefault();
});

ipcRenderer.on('project-loaded', (ev, infos) => {
	clearElements(true, false);
	projectInfos = infos;
	let jsonElements = projectInfos.elements;
	projectInfos.elements = [];
	$.each(jsonElements, (i,v) => {
		new Element(v._type, v._name, v._text, v._sizes, v._properties);
	});
});

function typeToLocale(type, lang = 'fr') {
	return Locales.Fr.Elements[type];
}

function addElement(elem, addTags = true) {
	let $newElem = $('#template-element').clone(true);
	$newElem.attr('id', `element-${elem.position}`);

	$newElem.find('.dropdown-pane').attr('id', elem.position + '-dropdown-properties');
	$newElem.find('[data-toggle]').attr('data-toggle', elem.position + '-dropdown-properties');

	if (elem.text !== '') {
		$newElem.find('strong').html(elem.name + ' &middot; ' + typeToLocale(elem.type));
		$newElem.find('em').html(elem.text);
	} else {
		$newElem.find('strong').html(elem.name);
		$newElem.find('em').html(typeToLocale(elem.type));
	}

	if (addTags) {
		let $newTag = $(`<${Tags[elem.type]}>`).attr('id', `elem-${elem.position}`).text(elem.text);
		$newTag.appendTo('#preview');
	}
	$newElem.appendTo('#elements');
}

function updateElements() {
	clearElements();
	$.each(projectInfos.elements, (i,v) => {
		addElement(v, false);
	});
}

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

$('.delete-element').click(function(ev) {
	let id = $(this).closest('[id^="element-"]').attr('id').substr(8);
	projectInfos.elements[id].delete();
});

$('[data-toggle]').click(function() {
	$('#' + $(this).attr('data-toggle')).toggleClass('visible');
});

$s.find('[id^="add-"]').click(function(ev) {
	let newTag = $(this).attr('id').substr(4);
	new Element(ElementType[newTag.toUpperCase()], 'Nom', 'CXOUCOUTEXTE');
	ev.preventDefault();
});

$elems.scroll(() => {
	$elems.find('[id$="dropdown-properties"]').css('margin-top', -$elems.scrollTop());
	let $lastDropdown = $elems.children(':last-child').find('[id$="dropdown-properties"]')
	$lastDropdown.css('margin-top', -($elems.scrollTop() + $lastDropdown.outerHeight() + 28));
});

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

	$(document).foundation();
});