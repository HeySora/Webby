# Webby

Webby is an application that allows any user to easily create a website. It has been made to be usable by any beginner user.

It's made with [Electron](https://electron.atom.io).

### To-do

* More languages (Currently french only)
* More elements (tables, forms, ...)

### Download / Installation Instructions

1. Grab the latest release [here](https://github.com/HeySora/Webby/releases).
2. Just run it!

### Compilation Instructions

1. `git clone https://github.com/HeySora/Webby.git && cd Webby` *(Clone the repository in a "Webby" folder, and go into it)*
2. `npm i` *(Install dependencies)*
3. `npm run dist` *(Run the build process)*

Compiled program will go in the `dist/` folder. By default, on Windows, it will create a portable .exe. You can also create an installer by opening the [package.json](package.json) file and changing `"target": "portable"` to `"target": "nsis"`.

### How to contribute

1. Fork this repo and clone it in your PC.
2. `npm i` *(Install dependencies)*
3. Edit/add whatever you want *(use `npm start` to run the program)*
4. Submit a Pull Request

### License

[GNU Affero General Public License v3 (AGPL-3.0)](LICENSE.md)

Copyright © 2017 HeySora & Zwahlenlo