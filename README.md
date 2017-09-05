# npmlinkr

`npmlinkr` is a utility to make using `npm link` easier during the development process.

## Installation

```bash
npm install -g npmlinkr
```

## Usage

```
\module_or_common_dir $ npmlinkr <command>
```

## Commands

### parse

This will parse the current directory. If the current directory is a module (contains a `package.json`), it will scan the `node_modules` directory and find all the symbolic links. These should be the directories that have been `npm link`ed to the current directory. If the current directory isn't a module, it will try to parse each child directory in the same way. 

Modules that have been `npm link`ed will be saved to a `links` array in the `package.json` file.

### link

This will run `npm link` for each of the modules listed in the module's `package.json` `links` array. If the current directory is not a module, it will run the linking process for each of the child directories.

### install

This will run `npm install` and then `link`.

### install_links

This will run `npm link` and then `link`