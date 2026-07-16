from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
import os
from functools import wraps

app = Flask(__name__)

# Restricted CORS - only allow the backend server
allowed_origins = os.environ.get('CORS_ORIGINS', 'http://127.0.0.1:5002,http://localhost:5002').split(',')
CORS(app, origins=allowed_origins)

# API Key authentication
API_KEY = os.environ.get('AI_API_KEY')
if not API_KEY:
    import secrets
    API_KEY = secrets.token_hex(32)
    print(f"WARNING: AI_API_KEY not set. Generated temporary key: {API_KEY}")
    print("Set AI_API_KEY environment variable for production use.")


def require_api_key(f):
    """Decorator to require API key for protected endpoints."""
    @wraps(f)
    def decorated(*args, **kwargs):
        key = request.headers.get('X-API-Key')
        if not key or key != API_KEY:
            return jsonify({"error": "Unauthorized. Invalid or missing API key."}), 401
        return f(*args, **kwargs)
    return decorated


model_data = None
if os.path.exists('model.pkl'):
    with open('model.pkl', 'rb') as f:
        model_data = pickle.load(f)


def validate_metric(value, name, min_val=0, max_val=100):
    """Validate that a metric value is a number within expected range."""
    if not isinstance(value, (int, float)):
        raise ValueError(f"{name} must be a number, got {type(value).__name__}")
    if value < min_val or value > max_val:
        raise ValueError(f"{name} must be between {min_val} and {max_val}, got {value}")
    return float(value)


def predict(cpu, memory, restarts, health):
    if not model_data:
        # Fallback rule-based prediction
        prob = min((memory * 0.4 + cpu * 0.3 + restarts * 5 + (100 - health) * 0.2) / 100, 1.0)
        will_crash = prob > 0.6
        return {
            "crash_probability": round(prob * 100, 1),
            "will_crash": will_crash,
            "time_to_crash_minutes": int(10 - prob * 8) if will_crash else None,
            "risk_level": "critical" if prob > 0.8 else "high" if prob > 0.6 else "medium" if prob > 0.3 else "low"
        }
    
    features = np.array([[cpu, memory, restarts, health]])
    features_scaled = model_data['scaler'].transform(features)
    prob = model_data['model'].predict_proba(features_scaled)[0][1]
    will_crash = model_data['model'].predict(features_scaled)[0]
    time_to_crash = int(10 - prob * 7) if will_crash and prob > 0.6 else None
    
    return {
        "crash_probability": round(float(prob) * 100, 1),
        "will_crash": bool(will_crash),
        "time_to_crash_minutes": time_to_crash,
        "risk_level": "critical" if prob > 0.8 else "high" if prob > 0.6 else "medium" if prob > 0.3 else "low"
    }


@app.route('/predict', methods=['POST'])
@require_api_key
def predict_endpoint():
    data = request.json
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    try:
        cpu = validate_metric(data.get('cpu', 0), 'cpu')
        memory = validate_metric(data.get('memory', 0), 'memory')
        restarts = validate_metric(data.get('restarts', 0), 'restarts', min_val=0, max_val=1000)
        health = validate_metric(data.get('health', 100), 'health')
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    result = predict(cpu, memory, restarts, health)
    return jsonify(result)


@app.route('/predict/batch', methods=['POST'])
@require_api_key
def predict_batch():
    data = request.json
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    containers = data.get('containers', [])
    if not isinstance(containers, list) or len(containers) > 100:
        return jsonify({"error": "containers must be a list with max 100 items"}), 400

    results = []
    for c in containers:
        try:
            cpu = validate_metric(c.get('cpu', 0), 'cpu')
            memory = validate_metric(c.get('memory', 0), 'memory')
            restarts = validate_metric(c.get('restarts', 0), 'restarts', min_val=0, max_val=1000)
            health = validate_metric(c.get('health', 100), 'health')
            pred = predict(cpu, memory, restarts, health)
            results.append({"container": c.get('name', 'unknown'), "prediction": pred})
        except ValueError as e:
            results.append({"container": c.get('name', 'unknown'), "error": str(e)})

    return jsonify(results)


@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "model_loaded": model_data is not None})


if __name__ == '__main__':
    debug_mode = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    host = os.environ.get('FLASK_HOST', '127.0.0.1')  # Bind to localhost only by default
    port = int(os.environ.get('FLASK_PORT', 5001))
    
    print(f"AI Prediction Server running on http://{host}:{port}")
    print(f"Debug mode: {debug_mode}")
    app.run(host=host, port=port, debug=debug_mode)
