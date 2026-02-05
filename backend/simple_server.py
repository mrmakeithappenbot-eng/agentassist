#!/usr/bin/env python3
"""
Simple HTTP server for AgentAssist (no dependencies required)
This is a minimal implementation that works without pip
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import urllib.parse

class AgentAssistHandler(BaseHTTPRequestHandler):
    
    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests"""
        if self.path == '/':
            self.send_json({'app': 'AgentAssist API', 'status': 'operational', 'message': 'Backend running! Install full dependencies for complete features.'})
        elif self.path == '/health':
            self.send_json({'status': 'healthy'})
        elif self.path.startswith('/api/crm/status'):
            self.send_json({'connected': True, 'provider': 'boldtrail', 'message': 'Mock connection - install dependencies for real API'})
        else:
            self.send_error(404)
    
    def do_POST(self):
        """Handle POST requests"""
        if self.path == '/api/crm/connect':
            # Read request body
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                post_data = self.rfile.read(content_length)
            
            self.send_json({
                'success': True,
                'message': 'Connected to BoldTrail (mock)',
                'connection_id': 'mock-connection-123',
                'note': 'This is a simplified server. Install Python dependencies for full functionality.'
            })
        else:
            self.send_error(404)
    
    def send_json(self, data):
        """Send JSON response"""
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
    
    def log_message(self, format, *args):
        """Custom logging"""
        print(f"[{self.log_date_time_string()}] {format % args}")

def run_server(port=8000):
    """Start the server"""
    server_address = ('', port)
    httpd = HTTPServer(server_address, AgentAssistHandler)
    
    print("=" * 60)
    print("AgentAssist Simple Backend Server")
    print("=" * 60)
    print()
    print(f"✓ Server running at: http://localhost:{port}")
    print(f"✓ API status: http://localhost:{port}/")
    print(f"✓ Health check: http://localhost:{port}/health")
    print()
    print("⚠️  NOTE: This is a simplified server without dependencies.")
    print("   For full BoldTrail integration, you need to:")
    print("   1. Install Python on Windows (not WSL)")
    print("   2. Run setup.bat from Windows Command Prompt")
    print("   3. Start the full backend server")
    print()
    print("   The frontend will work, but data will be mock/demo only.")
    print()
    print("Press Ctrl+C to stop")
    print("=" * 60)
    print()
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\nServer stopped.")

if __name__ == '__main__':
    run_server()
