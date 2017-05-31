const {remote, ipcRenderer} = require('electron');

let $d = $(document),
	$w = $(window),
	$s = $('#sidebar'),
	$elems = $('#elements'),
	$p = $('#preview'),
	$npModal = $('#new-project-modal'),
	$ppModal = $('#project-properties-modal');

$(document).foundation();

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
	elements: {}
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
		elements: {}
	};

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
});