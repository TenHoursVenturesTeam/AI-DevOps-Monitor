import json
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import pickle
import os

# Training data: [cpu%, memory%, restarts, health%] -> crash in 10 min (1) or not (0)
X_train = np.array([
    [90, 95, 8, 10], [85, 90, 6, 20], [80, 88, 5, 30], [75, 85, 4, 40],
    [70, 80, 3, 55], [60, 75, 2, 65], [50, 70, 1, 75], [40, 60, 0, 85],
    [30, 50, 0, 90], [20, 40, 0, 95], [10, 30, 0, 98], [15, 35, 0, 96],
    [92, 96, 10, 5], [88, 92, 7, 15], [65, 82, 4, 50],
])
y_train = np.array([1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1])

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X_train)

model = RandomForestClassifier(n_estimators=50, random_state=42)
model.fit(X_scaled, y_train)

def predict_crash(cpu, memory, restarts, health):
    features = np.array([[cpu, memory, restarts, health]])
    features_scaled = scaler.transform(features)
    prob = model.predict_proba(features_scaled)[0][1]
    will_crash = model.predict(features_scaled)[0]
    
    time_to_crash = None
    if will_crash and prob > 0.8:
        time_to_crash = max(3, int(10 - (prob - 0.8) * 30))
    elif will_crash:
        time_to_crash = int(15 - prob * 10)

    return {
        "crash_probability": round(float(prob) * 100, 1),
        "will_crash": bool(will_crash),
        "time_to_crash_minutes": time_to_crash,
        "risk_level": "critical" if prob > 0.8 else "high" if prob > 0.6 else "medium" if prob > 0.3 else "low"
    }

# Save model
with open('model.pkl', 'wb') as f:
    pickle.dump({'model': model, 'scaler': scaler}, f)
print("Model trained and saved!")

# Test predictions
containers = [
    {"name": "web-app", "cpu": 12, "memory": 45, "restarts": 0, "health": 98},
    {"name": "api-server", "cpu": 28, "memory": 62, "restarts": 1, "health": 95},
    {"name": "cache-worker", "cpu": 45, "memory": 90, "restarts": 3, "health": 65},
    {"name": "payment-service", "cpu": 88, "memory": 92, "restarts": 7, "health": 10},
]

print("\n=== AI Crash Predictions ===")
for c in containers:
    result = predict_crash(c["cpu"], c["memory"], c["restarts"], c["health"])
    print(f"{c['name']:20} | Risk: {result['risk_level']:8} | Crash Prob: {result['crash_probability']}%"
          + (f" | Crash in: {result['time_to_crash_minutes']} min" if result['time_to_crash_minutes'] else ""))
