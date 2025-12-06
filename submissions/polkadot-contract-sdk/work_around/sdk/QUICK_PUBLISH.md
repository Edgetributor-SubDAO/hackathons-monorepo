# Quick Publish Guide

## Prerequisites

1. Create PyPI account: https://pypi.org/account/register/
2. Install build tools:
   ```bash
   pip install --upgrade build twine
   ```

## Update Your Information

Before publishing, update these files with your details:

1. **setup.py**: Change `author`, `author_email`, `url`
2. **pyproject.toml**: Update `authors`, `email`, and `project.urls`
3. **README.md**: Make sure it's complete

## Publish Steps

From the `sdk/` directory:

```bash
cd sdk

# 1. Clean previous builds
rm -rf dist/ build/ *.egg-info polkadot_contract_sdk.egg-info

# 2. Build the package
python3 -m build

# 3. Upload to PyPI (or TestPyPI first for testing)
python3 -m twine upload dist/*
```

Or use the publish script:

```bash
cd sdk
./publish.sh
```

## After Publishing

Users can install with:

```bash
pip install polkadot-contract-sdk
```

Then use:

```bash
sdk-deploy-contract main.py
sdk-interact
```

## Updating Versions

When releasing a new version, update:

1. `setup.py` - `version="X.Y.Z"`
2. `pyproject.toml` - `version = "X.Y.Z"`
3. `polkadot_contract_sdk/__init__.py` - `__version__ = "X.Y.Z"`

Then rebuild and upload again.

