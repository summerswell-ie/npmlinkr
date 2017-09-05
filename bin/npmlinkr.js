#!/usr/bin/env node
const npmlinkr_api = require( '../lib/index.js' );

console.log( '------------------' );
console.log( '//// npmlinkr ////' );
console.log( '------------------' );
console.log( `/ Directory: ${npmlinkr_api.basePath}` );

const [ app, script, command, ...rest ] = process.argv;

console.log( `/ Commmand: ${command}` );

if ( command in npmlinkr_api ) {
  npmlinkr_api[command].call( this, rest );
} else {
  console.error( '\\\\\ Command not found' );
}

