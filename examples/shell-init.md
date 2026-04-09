# oml shell-init

Print shell integration code for `oml switch`. Required for automatic directory switching.

## Usage

```
oml shell-init [shell]
```

Supported shells: `bash`, `zsh`, `fish`

## Options

| Flag | Alias | Description |
|------|-------|-------------|
| `--completions` | | Generate shell completions (`bash`, `zsh`, `fish`) |

## Examples

### Set up zsh integration

Add to your `~/.zshrc`:

```bash
eval "$(oml shell-init zsh)"
```

### Set up bash integration

Add to your `~/.bashrc`:

```bash
eval "$(oml shell-init bash)"
```

### Set up fish integration

Add to your `~/.config/fish/config.fish`:

```fish
oml shell-init fish | source
```

### Generate zsh completions

```bash
oml shell-init --completions zsh > ~/.zsh/completions/_oml
```

### Generate bash completions

```bash
oml shell-init --completions bash > /etc/bash_completion.d/oml
```

### Generate fish completions

```bash
oml shell-init --completions fish > ~/.config/fish/completions/oml.fish
```
