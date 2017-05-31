const electron = require('electron')
const app = electron.app;
const Menu = electron.Menu
const BrowserWindow = electron.BrowserWindow;

const path = require('path');
const url = require('url');
let mainWindow;

const template = [
    {
        label: 'Fichier',
        submenu: [
            {
                label: 'Nouveau',
                click() {

                }
            },
            {
                label: 'Ouvrir',
                click() {

                }
            },
            {
                label: 'Enregistrer',
                click() {

                }
            },
            {
                label: 'Enregistrer sous...',
                click() {

                }
            },
            {
                label: 'Propriétés',
                click() {

                }
            },
            {
                type: 'separator',
                click() {

                }
            },
            {
                label: "Préférences de l'application",
                click() {

                }
            }
        ]
    },
    {
        label: 'Aide',
        submenu: [
            {
                label: 'Site Web',
                click() {

                }
            },
            {
                label: 'À propos...',
                click() {

                }
            }
        ]
    }
];

const webbyMenu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(webbyMenu);

function createWindow () {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        center: true,
        minWidth: 800,
        minHeight: 600,
        title: 'Webby',
        icon: 'back/icon.ico'
    });

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, '../front/index.html'),
        protocol: 'file:',
        slashes: true
    }));

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});
