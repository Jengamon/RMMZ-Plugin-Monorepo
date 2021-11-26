# A Plugin of the Monorepo

Duplicate this folder for every plugin you want to make.

`_header.txt` contains the header of the file, where you can put
the MZ metacomment.

`src/` and `types/` contain the TypeScript files of the plugin.
Make sure that there is a file called `src/index.ts`, as that is the
main file that will be built.

Remember to go into `package.json` and change for each plugin:
- "name" - the internal code name for the plugin
- "main" - tells Rollup where to put the final plugin
- "access_name" - set to be able to access exports. Must be a JS-valid identifier.