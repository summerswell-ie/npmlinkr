const fs    = require( 'fs' );
const path  = require( 'path' );
const child = require( 'child_process' );

const _npmlinkr = {
  basePath : `${process.cwd()}`,

  /**
   * _readdirSymLinks
   */
  _readdirSymLinks : function( dir ) {
    return fs.readdirSync( dir )
             .filter( one_module => ( fs.lstatSync( path.join( dir, one_module ) ).isSymbolicLink() ) );
  },

  _fileExists : function( fileName ) {
    try {
      return fs.lstatSync( fileName ).isFile();
    } catch( err ) {      
      return false;
    }
  },

  /**
   * _hasPackageFile
   */
  _hasPackageFile : function( dir ) {
    return _npmlinkr._fileExists( path.join( dir, 'package.json' ) );
  },

  /**
   * _getLinkedModules
   */
  _getLinkedModules : function( pathToCheck ) {
    var modules = [];
    console.log( `* Checking modules in: ${pathToCheck}` );
    
    const module_path = path.join( pathToCheck, 'node_modules' );
    if ( fs.existsSync( module_path ) ) {
      try {
        const node_modules = _npmlinkr._readdirSymLinks( module_path );        
        Object.assign( modules, node_modules );        
      } catch ( err ) {
        console.error( err );
      }
    }
    return modules;
  },

  /**
   * _saveLinksToPackageFile
   */
  _saveLinksToPackageFile : function( packageFilename, moduleLinks ) {
    console.log( `* Saving 'links' in ${packageFilename} ` );
    var packageFile = require( packageFilename );
    packageFile.links = moduleLinks;
    fs.writeFileSync( packageFilename, JSON.stringify( packageFile, null, 2 ) );
  },


  /**
   * _parseOneModule
   */
  _parseOneModule : function( modulePath ) {
    const linkedModules = _npmlinkr._getLinkedModules( modulePath );    
    console.log( `* Found links: ${linkedModules}` );
    if ( linkedModules.length > 0 ) {
      const packageFilename = path.join( modulePath, 'package.json' );
      _npmlinkr._saveLinksToPackageFile( packageFilename, linkedModules );
    }
  },

  /**
   * _parseRecursive
   */
  _parseRecursive : function( baseDir ) {
    console.log( '* Parse recursive' );
    console.log( '*' );

    const modulesInDir = fs.readdirSync( baseDir )
                           .filter( one_entry => ( fs.lstatSync( one_entry ).isDirectory() && !one_entry.startsWith( '.' ) ) )
                           .map( one_entry => path.join( baseDir, one_entry ) );

    modulesInDir.forEach( one_dir => {
      console.log( `* Checking ${one_dir}` );
      
      if ( _npmlinkr._hasPackageFile( one_dir ) ) {
        _npmlinkr._parseOneModule( one_dir );
      } else {
        console.error( `* ${one_dir} doesn't seem to be a module` );
      }
      console.log( '*' );
    });

    console.log( `* Parsed links for ${modulesInDir.length} modules` );
    
  },

  /**
   * parse
   */
  parse : function() {
    const packageFilename = path.join( _npmlinkr.basePath, 'package.json' );
  
    if ( _npmlinkr._fileExists( packageFilename ) ) {
      _npmlinkr._parseOneModule( _npmlinkr.basePath );        
    } else {
      _npmlinkr._parseRecursive( _npmlinkr.basePath );  
    }
  },

  /**
   * _linkOneModule
   */
  _linkOneModule : function( modulePath ) {
    const packageFilename = path.join( modulePath, 'package.json' );
    const packageFile = require( packageFilename );
    if ( ( 'links' in packageFile ) && ( packageFile.links.length > 0 ) ) {
      console.log( `* Found links: ${packageFile.links}` );

      const moduleLibDir = path.join( modulePath, 'lib' );
      const lib_modules = fs.existsSync( moduleLibDir ) ? fs.readdirSync( moduleLibDir ) : [];

      packageFile.links.forEach( module_link => {

        // *** Check whether this exists in the ./lib directory
        if ( lib_modules.indexOf( module_link ) > -1 ) {
          console.log( `* Found LIB: ${module_link}` );
          module_link = path.join( moduleLibDir, module_link );
        };
        
        console.log( `* Running npm link for: ${module_link}` );
        console.log( '*' );
        child.execSync( `npm link ${module_link} `, { cwd: modulePath, encoding: 'utf8', stdio:[0,1,2] } ); 
        console.log( '*' );  
      });


    } else {
      console.log( '* No Links found' );
    }    
  },

  /**
   * _linkRecursive
   */
  _linkRecursive : function( baseDir ) {
    console.log( '* Link recursive' );
    console.log( '*' );

    const modulesInDir = fs.readdirSync( baseDir )
                           .filter( one_entry => ( fs.lstatSync( one_entry ).isDirectory() && !one_entry.startsWith( '.' ) ) )
                           .map( one_entry => path.join( baseDir, one_entry ) );

    
    modulesInDir.forEach( one_moduleDir => {
      console.log( `* Linking module: ${one_moduleDir}` );
      console.log( '*' );
      if ( _npmlinkr._hasPackageFile( one_moduleDir ) ) {
        _npmlinkr._linkOneModule( one_moduleDir );
      } else {
        console.log( `* ${one_moduleDir} doesn't seem to be a module.` );      
      }
      console.log( '*' );
    });
  
  },

  /**
   * link
   */
  link : function() {
    if ( _npmlinkr._hasPackageFile( _npmlinkr.basePath ) ) {      
      _npmlinkr._linkOneModule( _npmlinkr.basePath );
    } else {
      _npmlinkr._linkRecursive( _npmlinkr.basePath );      
    }

  },

  /**
   * _installOneModule
   */
  _installOneModule : function( modulePath ) {
    console.log( `* Installing module: ${modulePath}` );
    console.log( '*' );
    child.execSync( 'npm install', { cwd: modulePath, encoding: 'utf8', stdio:[0,1,2] } ); 
    _npmlinkr._linkOneModule( modulePath );
    console.log( '*' );    
  },

  /**
   * _installOnlyOneModule
   */
  _installOnlyOneModule : function( modulePath ) {
    console.log( `* Installing module: ${modulePath}` );
    console.log( '*' );
    child.execSync( 'npm install', { cwd: modulePath, encoding: 'utf8', stdio:[0,1,2] } );     
    console.log( '*' );    
  },

/**
   * 
   */
  _installOnlyRecursive : function( baseDir ) {
    console.log( '* Install Recursive' );
    console.log( '*' );  
    const modulesInDir = fs.readdirSync( baseDir )
                           .filter( one_entry => ( fs.lstatSync( one_entry ).isDirectory() && !one_entry.startsWith( '.' ) ) )
                           .map( one_entry => path.join( baseDir, one_entry ) );

    modulesInDir.forEach( one_moduleDir => {
      console.log( `* Installing module: ${one_moduleDir}` );
      console.log( '*' );
      if ( _npmlinkr._hasPackageFile( one_moduleDir ) ) {
        _npmlinkr._installOnlyOneModule( one_moduleDir );       
      } else {
        console.log( `* ${one_moduleDir} doesn't seem to be a module.` );      
      }
    } );

    console.log( '*' );  
  },

  /**
   * 
   */
  _installRecursive : function( baseDir ) {
    console.log( '* Install Recursive' );
    console.log( '*' );  
    const modulesInDir = fs.readdirSync( baseDir )
                           .filter( one_entry => ( fs.lstatSync( one_entry ).isDirectory() && !one_entry.startsWith( '.' ) ) )
                           .map( one_entry => path.join( baseDir, one_entry ) );

    modulesInDir.forEach( one_moduleDir => {
      console.log( `* Installing module: ${one_moduleDir}` );
      console.log( '*' );
      if ( _npmlinkr._hasPackageFile( one_moduleDir ) ) {
        _npmlinkr._installOneModule( one_moduleDir );
        _npmlinkr._linkOneModule( one_moduleDir );
      } else {
        console.log( `* ${one_moduleDir} doesn't seem to be a module.` );      
      }
    } );

    console.log( '*' );  
  },

  /**
   * install
   */
  install : function() {
    if ( _npmlinkr._hasPackageFile( _npmlinkr.basePath ) ) {
      _npmlinkr._installOneModule( _npmlinkr.basePath );
    } else {
      _npmlinkr._installRecursive( _npmlinkr.basePath );      
    }
  },

  /**
   * installLinksOneModule
   */
  _installLinksOneModule : function( modulePath ) {
    console.log( `* Installing linkable module: ${modulePath}` );
    console.log( '*' );
    child.execSync( 'npm link', { cwd: modulePath, encoding: 'utf8', stdio:[0,1,2] } ); 
    _npmlinkr._linkOneModule( modulePath );
    console.log( '*' ); 
  },

  /**
   * _linkOnlyOneModule
   */
  _linkOnlyOneModule : function( modulePath ) {
    console.log( `* Link module: ${modulePath}` );
    console.log( '*' );
    child.execSync( 'npm link', { cwd: modulePath, encoding: 'utf8', stdio:[0,1,2] } );     
    console.log( '*' ); 
  },

  /**
   * _installLinksRecursive
   */
  _installLinksRecursive : function( baseDir ) {
    console.log( '* Install Linksable Recursive' );
    console.log( '*' );  
    const modulesInDir = fs.readdirSync( baseDir )
                           .filter( one_entry => ( fs.lstatSync( one_entry ).isDirectory() && !one_entry.startsWith( '.' ) ) )
                           .map( one_entry => path.join( baseDir, one_entry ) );

    modulesInDir.forEach( one_moduleDir => {
      console.log( `* Installing and creating link for module: ${one_moduleDir}` );
      console.log( '*' );
      if ( _npmlinkr._hasPackageFile( one_moduleDir ) ) {
        _npmlinkr._installLinksOneModule( one_moduleDir );        
      } else {
        console.log( `* ${one_moduleDir} doesn't seem to be a module.` );      
      }
    } );

    console.log( '*' ); 
  },

  _linkOnlyRecursive : function( baseDir ) {
    console.log( '* Link Modules Recursively' );
    console.log( '*' );  
    const modulesInDir = fs.readdirSync( baseDir )
                           .filter( one_entry => ( fs.lstatSync( one_entry ).isDirectory() && !one_entry.startsWith( '.' ) ) )
                           .map( one_entry => path.join( baseDir, one_entry ) );

    modulesInDir.forEach( one_moduleDir => {
      console.log( `* Linking module: ${one_moduleDir}` );
      console.log( '*' );
      if ( _npmlinkr._hasPackageFile( one_moduleDir ) ) {
        _npmlinkr._linkOnlyOneModule( one_moduleDir );        
      } else {
        console.log( `* ${one_moduleDir} doesn't seem to be a module.` );      
      }
    } );

    console.log( '*' ); 
  },

  /**
   * install_links
   */
  install_links : function() {
    if ( _npmlinkr._hasPackageFile( _npmlinkr.basePath ) ) {
      _npmlinkr._installLinksOneModule( _npmlinkr.basePath );
    } else {
      _npmlinkr._installLinksRecursive( _npmlinkr.basePath );
    }
  },

  link_only : function() {
    if ( _npmlinkr._hasPackageFile( _npmlinkr.basePath ) ) {
      _npmlinkr._linkOnlyOneModule( _npmlinkr.basePath );
    } else {
      _npmlinkr._linkOnlyRecursive( _npmlinkr.basePath );      
    }  
  },

  install_only : function() {
    if ( _npmlinkr._hasPackageFile( _npmlinkr.basePath ) ) {
      _npmlinkr._installOnlyOneModule( _npmlinkr.basePath );
    } else {
      _npmlinkr._installOnlyRecursive( _npmlinkr.basePath );      
    }  
  }

};

module.exports = _npmlinkr;