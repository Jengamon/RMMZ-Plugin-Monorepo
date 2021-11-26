# RMMZ Plugins Monorepo Template - Yarn Edition

Inspired (and ripping some stuff from) https://github.com/xuyanwen2012/rmmz-plugins-starter.

This is a monorepo to create some plugins!

Compared to our inspiration:
- We use Yarn 3 in Zero-Installs mode, cuz node_modules/ can then be banished to the shadow realm.
- The repo is automatically setup to properly do the Typescript-PnP-Yarn dance for VSCode, and should be trivial to setup for vim/nvim (just run `yarn dlx @yarnpkg/sdks vim`).
This helps with package detection and thus code completion.
- We use https://github.com/niokasgami/Rpg-Maker-MZ-Typescript to get Typescript support for RMMZ internals. 

This is my first time setting up Rollup (I've used Parcel a lot more), so please forgive me if the setup is suboptimal.

## How to do stuff

So there are only 2 commands at the top level of the monorepo:
- build
- lint
- setup

To setup the monorepo, run 

```sh
yarn install
yarn setup
```

Then, whenever you want to produce your plugins, simply run

```sh
yarn build
```

And all the plugins should be produced in the `dist` folder.

To check your plugins using `eslint`, run `yarn lint`.

That's all for the top level.