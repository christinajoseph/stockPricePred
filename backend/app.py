from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import joblib
import numpy as np
import os

# --- 1. Initialize Flask App ---
app = Flask(__name__)
# Enable Cross-Origin Resource Sharing (CORS) to allow requests from our React frontend
CORS(app) 

# --- 2. Load Models and Required Objects ---
# Load the machine learning models, scaler, and feature list when the app starts.
# This is more efficient than loading them for every request.
MODELS_DIR = 'models'
try:
    rf_model = joblib.load(os.path.join(MODELS_DIR, 'random_forest_model.pkl'))
    mlp_model = joblib.load(os.path.join(MODELS_DIR, 'mlp_model.pkl'))
    scaler = joblib.load(os.path.join(MODELS_DIR, 'scaler.pkl'))
    model_features = joblib.load(os.path.join(MODELS_DIR, 'features.pkl'))
    print("Models loaded successfully.")
except FileNotFoundError:
    print("Error: Model files not found. Please run train_model.py first.")
    rf_model = mlp_model = scaler = model_features = None


# --- 3. Mock Database / Data ---
# In a real app, this data would come from a MySQL or SQLite database.
# This data structure matches the mock data used in your React App.js.
HISTORICAL_DATA = [
  {'id': 1, 'date': '2023-01-01', 'price': 100, 'commodity': 'Wheat', 'location': 'North Farm'},
  {'id': 2, 'date': '2023-01-08', 'price': 105, 'commodity': 'Wheat', 'location': 'North Farm'},
  {'id': 3, 'date': '2023-01-15', 'price': 110, 'commodity': 'Wheat', 'location': 'North Farm'},
  {'id': 4, 'date': '2023-01-01', 'price': 200, 'commodity': 'Corn', 'location': 'South Farm'},
  {'id': 5, 'date': '2023-01-08', 'price': 202, 'commodity': 'Corn', 'location': 'South Farm'},
  {'id': 6, 'date': '2023-01-15', 'price': 198, 'commodity': 'Corn', 'location': 'South Farm'},
  {'id': 7, 'date': '2023-01-01', 'price': 150, 'commodity': 'Soybeans', 'location': 'East Farm'},
  {'id': 8, 'date': '2023-01-08', 'price': 155, 'commodity': 'Soybeans', 'location': 'East Farm'},
]


# --- 4. API Routes ---

@app.route('/')
def index():
    """A simple welcome route to check if the server is running."""
    return "Welcome to the Stock Price Tracker Backend!"

@app.route('/api/prices/history', methods=['GET'])
def get_historical_prices():
    """
    API endpoint to get historical price data.
    In a real app, you would add query parameters to filter by commodity, location, etc.
    e.g., /api/prices/history?commodity=Wheat
    """
    commodity_filter = request.args.get('commodity')
    location_filter = request.args.get('location')
    
    filtered_data = HISTORICAL_DATA
    if commodity_filter and commodity_filter != 'All':
        filtered_data = [d for d in filtered_data if d['commodity'] == commodity_filter]
    if location_filter and location_filter != 'All':
         filtered_data = [d for d in filtered_data if d['location'] == location_filter]

    return jsonify(filtered_data)

@app.route('/api/prices/live', methods=['GET'])
def get_live_prices():
    """
    API endpoint to simulate fetching live prices.
    This just returns the latest entry from our mock data for each commodity.
    """
    live_prices = {
        'Wheat': {'price': 112, 'change': '+1.8%'},
        'Corn': {'price': 205, 'change': '-0.5%'},
        'Soybeans': {'price': 158, 'change': '+2.1%'}
    }
    return jsonify(live_prices)

@app.route('/api/predict', methods=['POST'])
def predict():
    """
    API endpoint for making price predictions.
    It expects a JSON payload with features for the prediction.
    """
    if not all([rf_model, mlp_model, scaler, model_features]):
        return jsonify({"error": "Models are not loaded. Cannot make predictions."}), 500

    # Get the JSON data sent from the frontend
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid input"}), 400

    # Example input: {'date': '2024-07-15', 'commodity': 'Wheat', 'location': 'North Farm'}
    try:
        # --- Feature Engineering for Prediction ---
        # Create a DataFrame from the input data
        future_date = pd.to_datetime(data['date'])
        input_df = pd.DataFrame([{
            'day_of_year': future_date.dayofyear,
            'year': future_date.year,
            'commodity_Corn': 1 if data['commodity'] == 'Corn' else 0,
            'commodity_Soybeans': 1 if data['commodity'] == 'Soybeans' else 0,
            'location_North Farm': 1 if data['location'] == 'North Farm' else 0,
            'location_South Farm': 1 if data['location'] == 'South Farm' else 0,
        }])

        # Align columns with the model's training features
        # This ensures all required columns are present and in the correct order
        input_df = input_df.reindex(columns=model_features, fill_value=0)

        # --- Make Prediction ---
        # Use Random Forest for the main prediction
        predicted_price = rf_model.predict(input_df)[0]
        
        # Use MLP for another perspective or as part of an ensemble
        # input_scaled = scaler.transform(input_df)
        # mlp_prediction = mlp_model.predict(input_scaled)[0]

        # --- Create a Confidence Interval ---
        # For a Random Forest, we can use the predictions of individual trees
        # to estimate a prediction interval.
        individual_tree_preds = [tree.predict(input_df)[0] for tree in rf_model.estimators_]
        confidence_min = np.percentile(individual_tree_preds, 5)  # 90% confidence
        confidence_max = np.percentile(individual_tree_preds, 95)
        
        # Prepare the response
        response = {
            'predictedPrice': round(predicted_price, 2),
            'confidenceMin': round(confidence_min, 2),
            'confidenceMax': round(confidence_max, 2),
            'commodity': data['commodity'],
            'location': data['location'],
            'date': data['date']
        }
        return jsonify(response)

    except Exception as e:
        return jsonify({"error": str(e)}), 500