#!/usr/bin/env python3
"""
Setup script for the SDK
"""

from setuptools import setup, find_packages
import os

# Get the directory where setup.py is located
setup_dir = os.path.dirname(os.path.abspath(__file__))
readme_path = os.path.join(setup_dir, "README.md")

long_description = ""
if os.path.exists(readme_path):
    with open(readme_path, "r", encoding="utf-8") as fh:
        long_description = fh.read()

setup(
    name="polkadot-contract-sdk",
    version="1.0.0",
    author="Your Name",
    author_email="your.email@example.com",
    description="SDK for deploying and interacting with smart contracts on Polkadot/Kusama networks",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/yourusername/polkadot-contract-sdk",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "Topic :: Blockchain",
    ],
    python_requires=">=3.8",
    install_requires=[
        "web3>=6.0.0",
        "py-solc-x>=1.1.1",
        "python-dotenv>=1.0.0",
    ],
    entry_points={
        "console_scripts": [
            "sdk-deploy-contract=sdk.cli:deploy_command",
            "sdk-interact=sdk.cli:interact_command",
        ],
    },
    include_package_data=True,
    zip_safe=False,
)

