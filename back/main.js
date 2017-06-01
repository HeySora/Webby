const electron = require('electron')
const {app, Menu, BrowserWindow, dialog, ipcMain} = electron;
const path = require('path');
const url = require('url');
const fs = require('fs');

global.webbyData = {projectInfos: null};

let lastFileName = '';

const template = [
    {
        label: 'Fichier',
        submenu: [
            {
                label: 'Nouveau projet',
                click() {
                    mwContents.executeJavaScript('newProject();', true).catch(error => {
                        console.log(error);
                    });
                }
            },
            {
                label: 'Ouvrir',
                click() {
                    let fileNames = dialog.showOpenDialog(mainWindow, {
                        title: 'Ouvrir un projet',
                        filters: [
                            {
                                name: 'Projet Webby',
                                extensions: ['json']
                            }
                        ],
                        properties: ['openFile']
                    });

                    if (fileNames != null && fileNames.length > 0) {
                        fs.readFile(fileNames[0], (err, data) => {
                            if (err) throw err;
                            global.webbyData.projectInfos = JSON.parse(data);
                            mwContents.send('project-loaded', global.webbyData.projectInfos);
                        });
                    }
                }
            },
            {
                label: 'Enregistrer',
                click() {
                    if (lastFileName == '') {
                        lastFileName = dialog.showSaveDialog(mainWindow, {
                            title: 'Sauvegarder le projet',
                            filters: [
                                {
                                    name: 'Projet Webby',
                                    extensions: ['json']
                                }
                            ]
                        });
                    }

                    fs.writeFile(lastFileName, JSON.stringify(global.webbyData.projectInfos), {
                        flag: fs.constants.O_WRONLY + fs.constants.O_CREAT + fs.constants.O_TRUNC
                    }, err => {
                        if (err) throw err;
                    });
                }
            },
            {
                label: 'Enregistrer sous...',
                click() {
                    let fileName = dialog.showSaveDialog(mainWindow, {
                        title: 'Sauvegarder le projet',
                        filters: [
                            {
                                name: 'Projet Webby',
                                extensions: ['json']
                            }
                        ]
                    });

                    if (fileName != null && fileName !== '') {
                        lastFileName = fileName;
                        fs.writeFile(fileName, JSON.stringify(global.webbyData.projectInfos), {
                            flag: fs.constants.O_WRONLY + fs.constants.O_CREAT + fs.constants.O_TRUNC
                        }, err => {
                            if (err) throw err;
                        });
                    }
                }
            },
            {
                label: 'Propriétés',
                click() {
                    mwContents.executeJavaScript('showProjectProperties();', true).catch(error => {
                        console.log(error);
                    });
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


let mainWindow, mwContents, newProjectWindow;

function createWindow () {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        center: true,
        minWidth: 800,
        minHeight: 600,
        title: 'Webby',
        icon: 'back/icon.ico',
        show: false
    });

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, '../front/index.html'),
        protocol: 'file:',
        slashes: true
    }));

    mwContents = mainWindow.webContents;

    mwContents.openDevTools();

    mainWindow.once('ready-to-show', () => {
        mainWindow.show()
    })

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
