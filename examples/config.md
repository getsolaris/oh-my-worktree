# oml config

Manage oh-my-lemontree configuration.

Configuration is stored at `~/.config/oh-my-lemontree/config.json` (XDG-compliant).

## Usage

```
oml config [flags]
```

## Options

| Flag | Alias | Description |
|------|-------|-------------|
| `--init` | | Create default config file |
| `--show` | `-s` | Print current config as JSON |
| `--edit` | `-e` | Open config in `$EDITOR` |
| `--path` | | Print the config file path |
| `--validate` | | Validate config against schema |
| `--profiles` | | List available config profiles |
| `--profile` | | Profile name (for activation or deletion) |
| `--activate` | | Activate the specified profile |
| `--delete` | | Delete the specified profile |

## Examples

### Create a default config file

```bash
oml config --init
```

### Show current configuration

```bash
oml config --show
```

### Open config in your editor

```bash
oml config --edit
```

### Print the config file path

```bash
oml config --path
```

### Validate your config

```bash
oml config --validate
```

### List available profiles

```bash
oml config --profiles
```

### Activate a profile

```bash
oml config --profile work --activate
```

### Delete a profile

```bash
oml config --profile old-setup --delete
```
