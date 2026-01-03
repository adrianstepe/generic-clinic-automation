import http.server
import socketserver

PORT = 8080
DIRECTORY = "."

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"✅ Demo Assets Server running at http://localhost:{PORT}")
    print(f"👉 Mock Stripe: http://localhost:{PORT}/stripe-checkout.html")
    print(f"👉 Mock Email: http://localhost:{PORT}/email-confirmation.html")
    httpd.serve_forever()
