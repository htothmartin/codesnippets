import os
import sys
import time
from datetime import datetime, timezone

from flask import Flask, jsonify, request, Response
from flask_cors import CORS
from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError

from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST

app = Flask(__name__)
CORS(app)

#prometheus
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP Requests', ['method', 'endpoint', 'status'])
REQUEST_LATENCY = Histogram('http_request_duration_seconds', 'HTTP Request Duration', ['method', 'endpoint'])

@app.before_request
def start_timer():
    request.start_time = time.time()

@app.after_request
def record_metrics(response):
    if hasattr(request, 'start_time'):
        resp_time = time.time() - request.start_time
        
        REQUEST_LATENCY.labels(request.method, request.path).observe(resp_time)
        REQUEST_COUNT.labels(request.method, request.path, response.status_code).inc()
    
    return response

@app.route('/metrics')
def metrics():
    return Response(generate_latest(), mimetype=CONTENT_TYPE_LATEST)

mongo_uri = os.environ.get('MONGO_URI')


client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)

if os.environ.get('FLASK_ENV') != 'testing': 
    try:
        client.admin.command("ping")
        print(f"Database connection successfully established.")
    except Exception as e:
        print(f"CRITICAL ERROR: Could not connect to MongoDB. Error: {e}")
        sys.exit(1) 

db = client.codesnippet
snippets_collection = db.snippets_collection

@app.route('/health')
def health():
    return jsonify({"status": "UP", "db": "CONNECTED"}), 200

@app.route('/api/snippets', methods=['POST'])
def create_snippet():
    data = request.get_json()

    if not data or 'title' not in data or 'code' not in data:
        return jsonify({"error": "Missing title or code"}), 400
    
    new_snippet = {
        "title": data['title'],
        "code": data['code'],
        "created_at": datetime.now(timezone.utc)
    }

    try:
        result = snippets_collection.insert_one(new_snippet)
        return jsonify({
            "message": "Snippet saved succesfully",
            "id": str(result.inserted_id)
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/snippets', methods=['GET'])
def get_snippets():
    try:
        snippets_cursor = snippets_collection.find().sort("created_at", -1)
        snippets = []

        for snippet in snippets_cursor:
            snippet["_id"] = str(snippet['_id'])
            snippets.append(snippet)
        
        return jsonify(snippets), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)