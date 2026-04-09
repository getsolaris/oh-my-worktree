# oml clone

Clone a repository and initialize oml configuration.

## Usage

```
oml clone <url> [path]
```

## Options

| Flag | Alias | Description |
|------|-------|-------------|
| `--template` | `-t` | Apply a named template after cloning |
| `--init-config` | | Initialize oml config after cloning (default: true) |

## Examples

### Clone a repository

```bash
oml clone https://github.com/user/repo.git
```

### Clone to a specific directory

```bash
oml clone https://github.com/user/repo.git ~/projects/my-repo
```

### Clone and apply a template

```bash
oml clone https://github.com/user/repo.git --template frontend
```

### Clone with SSH

```bash
oml clone git@github.com:user/repo.git
```

### Clone without initializing config

```bash
oml clone https://github.com/user/repo.git --no-init-config
```
