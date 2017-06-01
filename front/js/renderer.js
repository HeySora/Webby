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

const {remote, ipcRenderer} = require('electron');

let $d = $(document),
	$w = $(window),
	$s = $('#sidebar'),
	$elems = $('#elements'),
	$p = $('#preview'),
	$npModal = $('#new-project-modal'),
	$ppModal = $('#project-properties-modal');

const ElementType = {
	PARAGRAPH: 0,
	DIV: 1
};

const Locales = {
	Fr: {
		Elements: [
			'Paragraphe',
			'Bloc'
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

	delete() {
		projectInfos.elements.splice(this._position, 1);
		for (let i = this._position; i < projectInfos.elements.length; i++) {
			projectInfos.elements[i].position--;
		}
		remote.getGlobal('webbyData').projectInfos = projectInfos;

		updateElements();
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
		if (element != null) {
			element.val(v);
		}
	});

	$ppModal.foundation('open');
}

$npModal.children('form').submit(ev => {
	$npModal.foundation('close');

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

	clearElements();

	$npModal.find('input[type!="submit"],select').each((i, v) => {
		let $v = $(v);
		let indexes = $v.attr('name').substr(8).split('-');
		let varToFill = 'projectInfos';
		for (var i = 0; i < indexes.length; i++) {
			varToFill += '.' + indexes[i];
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
		for (var i = 0; i < indexes.length; i++) {
			varToFill += '.' + indexes[i];
		}
		eval(varToFill + ' = "' + $v.val() + '"');
		$v.val('');
	});
	remote.getGlobal('webbyData').projectInfos = projectInfos;

	ev.preventDefault();
});

ipcRenderer.on('project-loaded', (ev, infos) => {
	projectInfos = infos;
	let jsonElements = projectInfos.elements;
	projectInfos.elements = [];
	clearElements();
	$.each(jsonElements, (i,v) => {
		new Element(v._type, v._name, v._text, v._sizes, v._properties);
	});
});

function typeToLocale(type, lang = 'fr') {
	return Locales.Fr.Elements[type];
}

function addElement(elem) {
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
	$newElem.appendTo('#elements');
}

function updateElements() {
	clearElements();
	$.each(projectInfos.elements, (i,v) => {
		addElement(v);
	});
}

function clearElements() {
	$('#elements > *').remove();
}

$('#add-paragraph').click(ev => {
	new Element(ElementType.PARAGRAPH, 'Nom');
	ev.preventDefault();
});

$('.delete-element').click(function(ev) {
	let id = $(this).closest('[id^="element-"]').attr('id').substr(8);
	projectInfos.elements[id].delete();
});

$('[data-toggle]').click(function() {
	$('#' + $(this).attr('data-toggle')).toggleClass('visible');
});


$(() => {
	new Element(ElementType.PARAGRAPH, 'Nom');
	new Element(ElementType.DIV, 'Test', 'coucou');
	new Element(ElementType.DIV, 'Test', 'coucou');
	new Element(ElementType.DIV, 'Test', 'coucou');
	new Element(ElementType.DIV, 'Test', 'coucou');

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
			} else {
				for (let i = ev.newIndex + 1; i <= ev.oldIndex; i++) {
					projectInfos.elements[i].position++;
				}
			}

			remote.getGlobal('webbyData').projectInfos = projectInfos;
		}
	});

	$(document).foundation();
});