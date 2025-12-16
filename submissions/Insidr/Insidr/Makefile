# Makefile for Insidr - Private Cross-Chain Bridge

.PHONY: all build test mopro flutter flutter-run circuit clean help

# Default target
all: build

# Build everything (Rust + mopro bindings)
build: rust mopro
	@echo "Build complete!"

# Build Rust library
rust:
	@echo "Building Rust library..."
	cargo build --release

# Run all tests
test:
	@echo "Running all tests..."
	cargo build --release
	cargo test
# Build mopro Flutter bindings (interactive - requires manual input)

mopro:
	@echo "Running mopro build..."
	@echo "Select 'debug' mode and 'aarch64-linux-android' when prompted"
	mopro build
	mopro update

# Install Flutter dependencies
flutter:
	@echo "Installing Flutter dependencies..."
	cd flutter && flutter pub get

# Run Flutter app (requires device/emulator and PROJECT_ID)
flutter-run:
	@echo "Running Flutter app..."
	cd flutter && flutter run

# # Build Flutter APK
# flutter-apk:
# 	@echo "Building Flutter APK..."
# 	cd flutter && flutter build apk --dart-define=PROJECT_ID=$(PROJECT_ID)
# Compile Noir circuit
circuit:
	@echo "Compiling Noir circuit..."
	cd circuits && nargo compile
	@echo "Circuit compiled!"

# Generate proving artifacts (requires bb installed)
circuit-artifacts:
	@echo "Generating proving artifacts..."
	cd circuits && bb prove --write_vk \
		-b ./target/circuits.json \
		-w ./target/circuits.gz \
		-o ./target \
		--oracle_hash keccak \
		--output_format bytes_and_fields
	@echo "Artifacts generated!"

# Copy circuit assets to Flutter
copy-assets:
	@echo "Copying circuit assets to Flutter..."
	mkdir -p flutter/assets
	cp circuits/target/circuits.json flutter/assets/noir_multiplier2.json 2>/dev/null || true
	cp circuits/target/*.srs flutter/assets/noir_multiplier2.srs 2>/dev/null || true
	cp circuits/target/*.vk flutter/assets/noir_multiplier2.vk 2>/dev/null || true
	@chmod +x transfer.sh
	@./transfer.sh
	@echo "Assets copied!"

# Clean build artifacts
clean:
	@echo "Cleaning up..."
	cargo clean
	rm -rf build/
	rm -rf flutter/.dart_tool/
	rm -rf flutter/build/
	cd circuits && rm -rf target/ 2>/dev/null || true
	@echo "Clean complete!"
