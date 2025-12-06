# Contributing to ChainRepute

Cross-chain reputation protocol unifying Stellar and Polkadot ecosystems.

## Prerequisites

- Node.js 18+
- Rust 1.91.1+ (for contracts)
- Stellar CLI (for Soroban)
- cargo-contract (for Ink!)
- Albedo wallet (Stellar)
- Talisman/SubWallet (Polkadot)

### Development Setup

### Development Setup

1. **Fork and Clone the Repository**

```bash
git clone https://github.com/ayuxy027/ChainRepute.git
cd ChainRepute
```

2. **Install Dependencies**

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

3. **Configure Environment**

Create a `.env` file in the root directory:

```bash
# Stellar Configuration
VITE_STELLAR_NETWORK=testnet
VITE_STELLAR_RPC=https://soroban-testnet.stellar.org
VITE_STELLAR_CONTRACT=CDUTJKXOOVPWI6BZZDJDUMZUDBLP2VRBYPLJGF35UK52LKWM6CZXHJNX

# Polkadot Configuration  
VITE_POLKADOT_RPC=wss://rpc1.paseo.popnetwork.xyz
VITE_POLKADOT_CONTRACT=<contract-address-after-deployment>

# Backend API
VITE_API_URL=http://localhost:3001
```

4. **Run the Development Servers**

```bash
# Terminal 1 - Start backend server
cd server
npm run dev

# Terminal 2 - Start frontend
npm run dev
```

The frontend will run on `http://localhost:5174` and the backend on `http://localhost:3001`.

## Project Structure

## Project Structure

Understanding the project structure will help you navigate the codebase:

```
ChainRepute/
├── src/                      # Frontend React application
│   ├── components/          # React components
│   │   ├── ReputationScanner.tsx
│   │   ├── ReputationSBT.tsx
│   │   └── ...
│   ├── pages/              # Page components
│   ├── services/           # API and blockchain services
│   └── wallet/             # Wallet context and integration
├── server/                  # Backend Express API
│   └── src/
│       ├── routes/         # API routes
│       ├── services/       # Business logic (AI, scanners)
│       └── types/          # TypeScript types
├── contracts/              # Smart contracts
│   ├── soroban-reputation/ # Stellar Soroban contracts (Rust)
│   ├── governance-sbt/     # Polkadot Ink! contracts (Rust)
│   └── ...
└── screenshots/            # Project screenshots

```

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue with:
- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Environment details (OS, browser, wallet version)

### Suggesting Features

We welcome feature suggestions! Please open an issue with:
- Clear description of the feature
- Use case and benefits
- Proposed implementation (optional)

### Contributing Code

1. **Find or Create an Issue**
   - Check existing issues or create a new one
   - Discuss your approach before starting work

2. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

3. **Make Your Changes**
   - Write clean, readable code
   - Follow the existing code style
   - Add comments for complex logic

4. **Test Your Changes**
   - Test frontend and backend functionality
   - Test with both Stellar (Albedo) and Polkadot (Talisman) wallets
   - Verify smart contract interactions work correctly

5. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature" 
   # or
   git commit -m "fix: resolve issue with..."
   ```

   Use conventional commit messages:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation
   - `style:` for formatting changes
   - `refactor:` for code refactoring
   - `test:` for adding tests
   - `chore:` for maintenance tasks

6. **Push and Create a Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```
   
   Then open a PR on GitHub with:
   - Clear description of changes
   - Link to related issue
   - Screenshots/videos (if UI changes)
   - Testing notes

## Development Guidelines

### Frontend Development

- **Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, Framer Motion
- Use functional components with hooks
- Keep components small and focused
- Use Tailwind CSS for styling
- Ensure responsive design (mobile-first)
- Handle loading and error states gracefully

### Backend Development

- **Tech Stack:** Node.js, Express, TypeScript
- Follow RESTful API conventions
- Add proper error handling
- Validate inputs
- Document API endpoints

### Smart Contract Development

#### Stellar Soroban Contracts (Rust)
```bash
# Build contract
stellar contract build --manifest-path contracts/soroban-reputation/Cargo.toml

# Test contract
cargo test --manifest-path contracts/soroban-reputation/Cargo.toml
```

#### Polkadot Ink! Contracts (Rust)
```bash
# Build contract
cargo contract build --manifest-path contracts/governance-sbt/Cargo.toml --release

# Test contract
cargo test --manifest-path contracts/governance-sbt/Cargo.toml
```

**Guidelines:**
- Follow Rust best practices
- Add comprehensive tests
- Document contract functions
- Consider gas optimization
- Ensure non-transferable SBT functionality

## Best Practices

### Code Quality
- Write clean, readable, and maintainable code
- Use TypeScript types properly (avoid `any`)
- Add comments for complex logic
- Follow existing code patterns
- Keep functions small and focused
- Handle errors gracefully

### Testing
- Test all new features thoroughly
- Test with both Stellar and Polkadot networks
- Test wallet integrations (Albedo, Talisman, SubWallet)
- Verify cross-chain functionality
- Test on different browsers and devices

### Documentation
- Update README.md if needed
- Document new API endpoints
- Add JSDoc comments to functions
- Update inline code comments
- Document smart contract functions

### Git Practices
- Use descriptive commit messages
- Keep commits focused and atomic
- Don't commit sensitive information (API keys, private keys, etc.)
- Use `.gitignore` appropriately
- Rebase before creating PR to keep history clean

### Performance
- Optimize component re-renders
- Lazy load components when appropriate
- Optimize smart contract gas usage
- Minimize API calls
- Use proper caching strategies

## What NOT to Include

- ❌ API keys, private keys, or wallet seeds
- ❌ Environment files with sensitive data (`.env`)
- ❌ Large binary files
- ❌ `node_modules/` or `target/` directories
- ❌ Personal information that shouldn't be public
- ❌ Copyrighted material you don't have rights to
- ❌ Compiled contract artifacts (`.wasm`, `.contract` files) - these are generated

## Areas We Need Help With

We welcome contributions in the following areas:

### High Priority
- 🔴 Polkadot Ink! SBT contract deployment and integration
- 🔴 Enhanced AI scoring algorithm improvements
- 🔴 Additional blockchain network support
- 🔴 Comprehensive testing suite

### Medium Priority
- 🟡 UI/UX improvements and animations
- 🟡 Mobile responsiveness enhancements
- 🟡 Performance optimizations
- 🟡 Documentation improvements

### Low Priority
- 🟢 Additional wallet integrations
- 🟢 Internationalization (i18n)
- 🟢 Dark mode refinements
- 🟢 Accessibility improvements

## Pull Request Process

1. **Before Submitting:**
   - Ensure your code builds without errors
   - Test all functionality thoroughly
   - Update documentation as needed
   - Follow the code style guidelines

2. **PR Requirements:**
   - Clear title and description
   - Link to related issue
   - List of changes made
   - Screenshots/videos for UI changes
   - Confirmation that you've tested the changes

3. **Review Process:**
   - A team member will review your PR
   - Address any requested changes
   - Once approved, your PR will be merged

4. **After Merge:**
   - Delete your branch
   - Your contribution will be credited in CREDITS.md

## Troubleshooting

### Common Issues

**"Contract not found" errors:**
- Ensure you have the correct contract address in `.env`
- Verify you're connected to the correct network (testnet)
- Check that the contract is deployed

**Wallet connection issues:**
- Ensure wallet extension is installed and unlocked
- Check that you're on the correct network
- Try refreshing the page and reconnecting

**Build errors:**
- Delete `node_modules/` and `package-lock.json`, then run `npm install`
- For Rust contracts, try `cargo clean` then rebuild
- Ensure you have the correct versions of dependencies

**TypeScript errors:**
- Run `npm run type-check` to see all type errors
- Ensure all imports are correct
- Check that types are properly defined

### Getting Help

If you encounter issues:
1. Check the README.md for setup instructions
2. Search existing GitHub issues
3. Open a new issue with detailed information
4. Contact the team:
   - Ayush Yadav (@ayuxy027) - Head of Product
   - Sumeet Gond (@sumeetgond) - Backend & UI/UX
   - Vidip Ghosh (@vidipghosh) - Smart Contracts

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. By participating in this project, you agree to:

- Be respectful and considerate
- Welcome newcomers and help them get started
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards other contributors

Unacceptable behavior includes:
- Harassment or discriminatory language
- Trolling or insulting comments
- Personal or political attacks
- Publishing others' private information
- Any conduct inappropriate in a professional setting

## Recognition

All contributors will be acknowledged in:
- CREDITS.md file
- GitHub contributors list
- Project documentation

Significant contributions may be highlighted in:
- Release notes
- Social media announcements
- Project presentations

## Resources

### Documentation
- [Stellar Soroban Docs](https://soroban.stellar.org/)
- [Polkadot Ink! Docs](https://use.ink/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Docs](https://tailwindcss.com/)

### Community
- GitHub Issues: [ChainRepute Issues](https://github.com/ayuxy027/ChainRepute/issues)
- Live Demo: https://chainrepute.vercel.app/

---

**Thank you for contributing to ChainRepute! Together, we're building the future of cross-chain reputation. 🚀**

Questions or suggestions about this guide? Open an issue or reach out to the team!