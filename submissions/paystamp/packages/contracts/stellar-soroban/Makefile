.PHONY: build test deploy-futurenet deploy-testnet clean

# Build configuration
TARGET = wasm32-unknown-unknown
CONTRACT_NAME = paystamp_soroban
WASM_FILE = target/$(TARGET)/release/$(CONTRACT_NAME).wasm

# Network configuration
FUTURENET_RPC = https://rpc-futurenet.stellar.org:443
TESTNET_RPC = https://soroban-testnet.stellar.org:443

build:
	@echo "🔨 Building Soroban contract..."
	cargo build --target $(TARGET) --release
	@echo "✅ Build complete: $(WASM_FILE)"

test:
	@echo "🧪 Running tests..."
	cargo test
	@echo "✅ Tests complete"

deploy-futurenet: build
	@echo "🚀 Deploying to Stellar Futurenet..."
	@if [ -z "$(SECRET_KEY)" ]; then \
		echo "❌ Error: SECRET_KEY environment variable not set"; \
		echo "Usage: make deploy-futurenet SECRET_KEY=<your_secret_key>"; \
		exit 1; \
	fi
	soroban contract deploy \
		--network futurenet \
		--source $(SECRET_KEY) \
		--wasm $(WASM_FILE)
	@echo "✅ Deployment complete"
	@echo "📝 Don't forget to:"
	@echo "   1. Save the contract ID to deployment-registry.json"
	@echo "   2. Initialize the contract: make init-futurenet CONTRACT_ID=<id> ADMIN=<admin_address>"

deploy-testnet: build
	@echo "🚀 Deploying to Stellar Testnet..."
	@if [ -z "$(SECRET_KEY)" ]; then \
		echo "❌ Error: SECRET_KEY environment variable not set"; \
		echo "Usage: make deploy-testnet SECRET_KEY=<your_secret_key>"; \
		exit 1; \
	fi
	soroban contract deploy \
		--network testnet \
		--source $(SECRET_KEY) \
		--wasm $(WASM_FILE)
	@echo "✅ Deployment complete"

init-futurenet:
	@if [ -z "$(CONTRACT_ID)" ] || [ -z "$(ADMIN)" ]; then \
		echo "❌ Error: CONTRACT_ID and ADMIN required"; \
		echo "Usage: make init-futurenet CONTRACT_ID=<id> ADMIN=<admin_address>"; \
		exit 1; \
	fi
	@echo "🔧 Initializing contract on Futurenet..."
	soroban contract invoke \
		--network futurenet \
		--id $(CONTRACT_ID) \
		-- initialize \
		--admin $(ADMIN)
	@echo "✅ Contract initialized"

init-testnet:
	@if [ -z "$(CONTRACT_ID)" ] || [ -z "$(ADMIN)" ]; then \
		echo "❌ Error: CONTRACT_ID and ADMIN required"; \
		echo "Usage: make init-testnet CONTRACT_ID=<id> ADMIN=<admin_address>"; \
		exit 1; \
	fi
	@echo "🔧 Initializing contract on Testnet..."
	soroban contract invoke \
		--network testnet \
		--id $(CONTRACT_ID) \
		-- initialize \
		--admin $(ADMIN)
	@echo "✅ Contract initialized"

register-service-futurenet:
	@if [ -z "$(CONTRACT_ID)" ] || [ -z "$(SERVICE_ID)" ] || [ -z "$(MIN_AMOUNT)" ] || [ -z "$(MAX_AMOUNT)" ] || [ -z "$(CURRENCY)" ]; then \
		echo "❌ Error: All parameters required"; \
		echo "Usage: make register-service-futurenet CONTRACT_ID=<id> SERVICE_ID=<service> MIN_AMOUNT=<min> MAX_AMOUNT=<max> CURRENCY=<currency>"; \
		exit 1; \
	fi
	@echo "📝 Registering service on Futurenet..."
	soroban contract invoke \
		--network futurenet \
		--id $(CONTRACT_ID) \
		-- register_service \
		--service_id $(SERVICE_ID) \
		--min_amount $(MIN_AMOUNT) \
		--max_amount $(MAX_AMOUNT) \
		--currency $(CURRENCY)
	@echo "✅ Service registered"

clean:
	@echo "🧹 Cleaning build artifacts..."
	cargo clean
	@echo "✅ Clean complete"

help:
	@echo "PayStamp Soroban Contract - Makefile Commands"
	@echo ""
	@echo "Build:"
	@echo "  make build              - Build the contract"
	@echo "  make test               - Run tests"
	@echo ""
	@echo "Deploy:"
	@echo "  make deploy-futurenet SECRET_KEY=<key>  - Deploy to Futurenet"
	@echo "  make deploy-testnet SECRET_KEY=<key>    - Deploy to Testnet"
	@echo ""
	@echo "Initialize:"
	@echo "  make init-futurenet CONTRACT_ID=<id> ADMIN=<admin>  - Initialize on Futurenet"
	@echo "  make init-testnet CONTRACT_ID=<id> ADMIN=<admin>    - Initialize on Testnet"
	@echo ""
	@echo "Service Management:"
	@echo "  make register-service-futurenet CONTRACT_ID=<id> SERVICE_ID=<svc> MIN_AMOUNT=<min> MAX_AMOUNT=<max> CURRENCY=<curr>"
	@echo ""
	@echo "Other:"
	@echo "  make clean              - Clean build artifacts"
	@echo "  make help               - Show this help"

