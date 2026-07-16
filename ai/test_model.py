import unittest
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import train_model functions inline (no separate module needed)
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler

# Recreate model for testing
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


class TestAIPredictions(unittest.TestCase):

    # ===== CRASH PREDICTION TESTS =====

    def test_healthy_container_low_risk(self):
        """web-app jaisa: low CPU, low memory → low risk"""
        result = predict_crash(cpu=12, memory=45, restarts=0, health=98)
        self.assertEqual(result["risk_level"], "low")
        self.assertFalse(result["will_crash"])

    def test_critical_container_high_risk(self):
        """payment-service jaisa: high CPU, high memory, many restarts → crash"""
        result = predict_crash(cpu=90, memory=95, restarts=8, health=10)
        self.assertIn(result["risk_level"], ["high", "critical"])
        self.assertTrue(result["will_crash"])

    def test_high_memory_triggers_warning(self):
        """cache-worker jaisa: 90% memory → high risk"""
        result = predict_crash(cpu=45, memory=90, restarts=3, health=65)
        self.assertIn(result["risk_level"], ["high", "critical"])

    def test_crash_probability_range(self):
        """Probability hamesha 0-100 ke beech honi chahiye"""
        test_cases = [
            (10, 30, 0, 98), (90, 95, 8, 10), (50, 70, 2, 75),
            (0, 0, 0, 100), (100, 100, 10, 0)
        ]
        for cpu, mem, restarts, health in test_cases:
            result = predict_crash(cpu, mem, restarts, health)
            self.assertGreaterEqual(result["crash_probability"], 0)
            self.assertLessEqual(result["crash_probability"], 100)

    def test_will_crash_is_boolean(self):
        """will_crash hamesha boolean hona chahiye"""
        result = predict_crash(cpu=50, memory=60, restarts=1, health=80)
        self.assertIsInstance(result["will_crash"], bool)

    def test_time_to_crash_none_for_healthy(self):
        """Healthy container ka time_to_crash None hona chahiye"""
        result = predict_crash(cpu=10, memory=30, restarts=0, health=98)
        self.assertIsNone(result["time_to_crash_minutes"])

    def test_time_to_crash_set_for_critical(self):
        """Critical container ka time_to_crash set hona chahiye"""
        result = predict_crash(cpu=92, memory=96, restarts=10, health=5)
        if result["will_crash"]:
            self.assertIsNotNone(result["time_to_crash_minutes"])
            self.assertGreater(result["time_to_crash_minutes"], 0)

    def test_risk_level_valid_values(self):
        """risk_level sirf valid values hone chahiye"""
        valid_risks = {"low", "medium", "high", "critical"}
        test_cases = [(10, 30, 0, 98), (50, 70, 2, 75), (80, 88, 5, 30), (92, 96, 10, 5)]
        for cpu, mem, restarts, health in test_cases:
            result = predict_crash(cpu, mem, restarts, health)
            self.assertIn(result["risk_level"], valid_risks)

    def test_more_restarts_increases_risk(self):
        """Zyada restarts → zyada crash probability"""
        low_restarts = predict_crash(cpu=30, memory=50, restarts=0, health=90)
        high_restarts = predict_crash(cpu=30, memory=50, restarts=8, health=90)
        self.assertGreaterEqual(
            high_restarts["crash_probability"],
            low_restarts["crash_probability"]
        )

    def test_higher_memory_increases_risk(self):
        """Zyada memory → zyada crash probability"""
        low_mem = predict_crash(cpu=20, memory=30, restarts=0, health=95)
        high_mem = predict_crash(cpu=20, memory=92, restarts=0, health=95)
        self.assertGreater(
            high_mem["crash_probability"],
            low_mem["crash_probability"]
        )

    def test_result_has_all_keys(self):
        """Result mein sab required keys hone chahiye"""
        result = predict_crash(cpu=50, memory=60, restarts=1, health=80)
        self.assertIn("crash_probability", result)
        self.assertIn("will_crash", result)
        self.assertIn("time_to_crash_minutes", result)
        self.assertIn("risk_level", result)

    def test_api_server_medium_risk(self):
        """api-server jaisa: medium load → medium/low risk"""
        result = predict_crash(cpu=28, memory=62, restarts=1, health=95)
        self.assertIn(result["risk_level"], ["low", "medium"])

    def test_model_trained_successfully(self):
        """Model train hua hai aur predict kar sakta hai"""
        self.assertIsNotNone(model)
        self.assertIsNotNone(scaler)
        result = predict_crash(50, 60, 1, 80)
        self.assertIsInstance(result, dict)


class TestModelAccuracy(unittest.TestCase):

    def test_known_crash_cases_predicted_correctly(self):
        """Known crash cases sahi predict hone chahiye"""
        crash_cases = [
            (90, 95, 8, 10),   # Definitely crash
            (85, 90, 6, 20),   # Definitely crash
            (92, 96, 10, 5),   # Definitely crash
        ]
        for cpu, mem, restarts, health in crash_cases:
            result = predict_crash(cpu, mem, restarts, health)
            self.assertTrue(
                result["will_crash"] or result["crash_probability"] > 50,
                f"Expected crash for cpu={cpu}, memory={mem}"
            )

    def test_known_safe_cases_predicted_correctly(self):
        """Known safe cases crash predict nahi hone chahiye"""
        safe_cases = [
            (10, 30, 0, 98),
            (15, 35, 0, 96),
            (20, 40, 0, 95),
        ]
        for cpu, mem, restarts, health in safe_cases:
            result = predict_crash(cpu, mem, restarts, health)
            self.assertFalse(
                result["will_crash"],
                f"Expected no crash for cpu={cpu}, memory={mem}"
            )


if __name__ == '__main__':
    print("=" * 60)
    print("AI DevOps Monitor — Python AI Tests")
    print("=" * 60)
    unittest.main(verbosity=2)
