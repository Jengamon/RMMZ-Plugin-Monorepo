# RMMZ Plugins Monorepo Template - Yarn Edition

Inspired (and ripping some stuff from) https://github.com/xuyanwen2012/rmmz-plugins-starter.

This is a monorepo to create some plugins!

Compared to our inspiration:
- We use Yarn 3 in Zero-Installs mode, cuz node_modules/ can then be banished to the shadow realm.

This is my first time setting up Rollup (I've used Parcel a lot more), so please forgive me if the setup is suboptimal.

## How to do stuff

So there are only 2 commands at the top level of the monorepo:
- build
- lint

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