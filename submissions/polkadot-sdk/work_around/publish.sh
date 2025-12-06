#!/bin/bash
# Script to publish the SDK to PyPI

set -e

echo "🧹 Cleaning previous builds..."
rm -rf dist/ build/ *.egg-info sdk/*.egg-info

echo "📦 Building package..."
python3 -m build

echo ""
echo "📤 Ready to upload!"
echo ""
echo "To upload to TestPyPI (recommended first):"
echo "  python3 -m twine upload --repository testpypi dist/*"
echo ""
echo "To upload to PyPI:"
echo "  python3 -m twine upload dist/*"
echo ""
read -p "Upload to PyPI now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    python3 -m twine upload dist/*
    echo ""
    echo "✅ Published successfully!"
    echo ""
    echo "Test installation with:"
    echo "  pip install polkadot-contract-sdk"
fi

