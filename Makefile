.PHONY: build cert run

NAMESPACE=wheel-of-misfortune

build:
	@podman build --file Containerfile --target development --tag localhost/${NAMESPACE}

cert:
	@mkdir -p certs
	@openssl req -x509 -newkey rsa:2048 -nodes -sha256 -days 365 \
		-keyout certs/dev-key.pem \
		-out certs/dev-cert.pem \
		-subj '/CN=host.containers.internal' \
		-addext 'subjectAltName=DNS:host.containers.internal,DNS:localhost,IP:127.0.0.1,IP:::1'

run:
	@podman run -it --rm -p 5173:5173 -v ./:/app localhost/${NAMESPACE}:latest
