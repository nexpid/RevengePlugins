# Local building

## Prerequisites

- [node](https://nodejs.org) >=20
- [pnpm](https://pnpm.io) >=9
- bash (its superior)

## Steps

- Clone this repository,

```sh
git clone https://github.com/nexpid/RevengePlugins --branch feat/improve-workspace
cd RevengePlugins
```

- install dependencies,

```sh
pnpm i
```

- build plugins in dev mode,

```sh
pnpm dev
```

- serve!

```sh
pnpm serve
```

Now, look for the IP labelled as **Ethernet** or starting with **192.168.** and install plugins on your phone with this format:

```txt
http://<ip>:8787/<plugin-id>
```

> [!TIP]
> If you're hosting RevengePlugins on-device using Termux, use `localhost` as the IP.

Bnnuy
