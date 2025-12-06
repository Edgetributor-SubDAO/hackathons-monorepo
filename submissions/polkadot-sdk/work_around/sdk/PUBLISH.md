# Publishing the SDK to PyPI

This guide will help you publish the SDK to PyPI so others can install it with `pip install polkadot-contract-sdk`.

## Prerequisites

1. **PyPI Account**: Create an account at https://pypi.org/account/register/
2. **TestPyPI Account** (recommended for testing): Create an account at https://test.pypi.org/account/register/
3. **Install build tools**:
   ```bash
   pip install --upgrade build twine
   ```

## Step 1: Update Package Information

Before publishing, update the following files with your information:

1. **setup.py**: Update `author`, `author_email`, and `url`
2. **pyproject.toml**: Update `authors`, `email`, and all `project.urls` with your GitHub repository
3. **README.md**: Make sure it's complete and accurate

## Step 2: Build the Package

From the `sdk/` directory:

```bash
cd sdk

# Clean previous builds
rm -rf dist/ build/ *.egg-info sdk.egg-info

# Build the package
python -m build
```

This creates:
- `dist/polkadot-contract-sdk-1.0.0.tar.gz` (source distribution)
- `dist/polkadot_contract_sdk-1.0.0-py3-none-any.whl` (wheel)

## Step 3: Test on TestPyPI (Recommended)

First, test publishing to TestPyPI:

```bash
# Upload to TestPyPI
python -m twine upload --repository testpypi dist/*

# You'll be prompted for:
# - Username: your TestPyPI username
# - Password: your TestPyPI password (or API token)
```

Then test installing from TestPyPI:

```bash
pip install --index-url https://test.pypi.org/simple/ polkadot-contract-sdk
```

## Step 4: Publish to PyPI

Once you've tested on TestPyPI, publish to the real PyPI:

```bash
# Upload to PyPI
python -m twine upload dist/*

# You'll be prompted for:
# - Username: your PyPI username
# - Password: your PyPI password (or API token)
```

## Step 5: Verify Installation

After publishing, verify it works:

```bash
# Uninstall local version first
pip uninstall polkadot-contract-sdk -y

# Install from PyPI
pip install polkadot-contract-sdk

# Test the commands
sdk-deploy-contract --help
sdk-interact --help
```

## Using API Tokens (Recommended)

Instead of using your password, use API tokens for better security:

1. Go to https://pypi.org/manage/account/
2. Scroll to "API tokens"
3. Create a new token
4. Use the token as your password when uploading

For TestPyPI: https://test.pypi.org/manage/account/

## Updating the Package

When you want to release a new version:

1. Update the version number in:
   - `setup.py` (version="X.Y.Z")
   - `pyproject.toml` (version = "X.Y.Z")
   - `sdk/__init__.py` (__version__ = "X.Y.Z")

2. Rebuild and upload:
   ```bash
   cd sdk
   rm -rf dist/ build/ *.egg-info sdk.egg-info
   python -m build
   python -m twine upload dist/*
   ```

## Version Numbering

Follow semantic versioning:
- **MAJOR.MINOR.PATCH** (e.g., 1.0.0)
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

## Troubleshooting

### "File already exists" error
- The version number is already published. Increment the version number.

### "Invalid distribution" error
- Make sure you're in the `sdk/` directory
- Check that all required files are present (README.md, LICENSE, etc.)

### Authentication errors
- Double-check your username and password/token
- Make sure you're using the correct credentials for TestPyPI vs PyPI

### "No module named 'sdk'" error
- Make sure `setup.py` is in the `sdk/` directory
- Verify the package structure is correct

