.PHONY: build run

NAMESPACE=wheel-of-misfortune

build:
	@podman build --file Containerfile --target development --tag localhost/${NAMESPACE}

run:
	@podman run -it --rm -p 5173:5173 -v ./:/app localhost/${NAMESPACE}:latest