import http.server
import socketserver
import webbrowser

PORT = 5500

Handler = http.server.SimpleHTTPRequestHandler
httpd = socketserver.TCPServer(("", PORT), Handler)

print(f"Serving at http://localhost:{PORT}")
webbrowser.open(f"http://localhost:{PORT}")
httpd.serve_forever()
