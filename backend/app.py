from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import joblib
import numpy as np
import os
from flask_sqlalchemy import SQLAlchemy
import click

# --- 1. Initialize Flask App & Database ---
app = Flask(__name__)
CORS(app) 

# Database Configuration
# This sets up the path to our SQLite database file.
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'commodities.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize the database extension
db = SQLAlchemy(app)


# --- 2. Database Models ---
# We define our database table structure as a Python class.
# This 'PriceData' class corresponds to a 'price_data' table in the database.
class PriceData(db.Model):
    __tablename__ = 'price_data'
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.String(10), nullable=False) # Storing date as string for simplicity
    price = db.Column(db.Float, nullable=False)
    commodity = db.Column(db.String(50), nullable=False)
    location = db.Column(db.String(50), nullable=False)

    def to_dict(self):
        """Converts the model instance to a dictionary, which can be easily converted to JSON."""
        return {
            'id': self.id,
            'date': self.date,
            'price': self.price,
            'commodity': self.commodity,
            'location': self.location,
        }

# --- 3. Load ML Models ---
# This part remains the same.
MODELS_DIR = 'models'
try:
    rf_model = joblib.load(os.path.join(MODELS_DIR, 'random_forest_model.pkl'))
    mlp_model = joblib.load(os.path.join(MODELS_DIR, 'mlp_model.pkl'))
    scaler = joblib.load(os.path.join(MODELS_DIR, 'scaler.pkl'))
    model_features = joblib.load(os.path.join(MODELS_DIR, 'features.pkl'))
    print("Models loaded successfully.")
except FileNotFoundError:
    print("Warning: Model files not found. Prediction endpoint will not work. Run train_model.py.")
    rf_model = mlp_model = scaler = model_features = None


# --- 4. API Routes ---

@app.route('/')
def index():
    return "Welcome to the Stock Price Tracker Backend!"

@app.route('/api/prices/history', methods=['GET'])
def get_historical_prices():
    """
    API endpoint to get historical price data FROM THE DATABASE.
    """
    commodity_filter = request.args.get('commodity')
    location_filter = request.args.get('location')
    
    # Start with a query on the PriceData table
    query = PriceData.query

    if commodity_filter and commodity_filter != 'All':
        query = query.filter(PriceData.commodity == commodity_filter)
    if location_filter and location_filter != 'All':
        query = query.filter(PriceData.location == location_filter)

    # Execute the query and convert results to a list of dictionaries
    results = query.all()
    filtered_data = [row.to_dict() for row in results]

    return jsonify(filtered_data)

# The /api/predict route remains the same, no database interaction needed for it yet.
@app.route('/api/predict', methods=['POST'])
def predict():
    if not all([rf_model, mlp_model, scaler, model_features]):
        return jsonify({"error": "Models are not loaded. Cannot make predictions."}), 500

    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid input"}), 400

    try:
        future_date = pd.to_datetime(data['date'])
        input_df = pd.DataFrame([{
            'day_of_year': future_date.dayofyear,
            'year': future_date.year,
            'commodity_Corn': 1 if data['commodity'] == 'Corn' else 0,
            'commodity_Soybeans': 1 if data['commodity'] == 'Soybeans' else 0,
            'location_North Farm': 1 if data['location'] == 'North Farm' else 0,
            'location_South Farm': 1 if data['location'] == 'South Farm' else 0,
        }])
        input_df = input_df.reindex(columns=model_features, fill_value=0)

        predicted_price = rf_model.predict(input_df)[0]
        individual_tree_preds = [tree.predict(input_df)[0] for tree in rf_model.estimators_]
        confidence_min = np.percentile(individual_tree_preds, 5)
        confidence_max = np.percentile(individual_tree_preds, 95)
        
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


# --- 5. Database Initialization Command ---
# This creates a new command that you can run from your terminal to set up the DB.
@app.cli.command("init-db")
def init_db_command():
    """Clears existing data and creates new tables with Indian commodity data."""
    with app.app_context():
        db.drop_all() # Deletes all tables
        db.create_all() # Creates all tables based on db.Model classes

        # Seed the database with some initial, relevant data for Telangana
        # We will fetch live data later, but this gives us a starting point.
        initial_indian_data = [
          {'date': '2023-11-01', 'price': 2100, 'commodity': 'Rice', 'location': 'Bowenpally'},
          {'date': '2023-11-08', 'price': 2150, 'commodity': 'Rice', 'location': 'Bowenpally'},
          {'date': '2023-11-01', 'price': 1950, 'commodity': 'Maize', 'location': 'Gudimalkapur'},
          {'date': '2023-11-08', 'price': 1975, 'commodity': 'Maize', 'location': 'Gudimalkapur'},
          {'date': '2023-11-01', 'price': 7200, 'commodity': 'Cotton', 'location': 'Erragadda'},
          {'date': '2023-11-08', 'price': 7150, 'commodity': 'Cotton', 'location': 'Erragadda'},
          {'date': '2023-11-01', 'price': 9500, 'commodity': 'Red Gram', 'location': 'Bowenpally'},
          {'date': '2023-11-08', 'price': 9600, 'commodity': 'Red Gram', 'location': 'Bowenpally'},
        ]

        for item in initial_indian_data:
            new_price_data = PriceData(**item)
            db.session.add(new_price_data)
        
        db.session.commit()
        click.echo("Initialized and seeded the database with Telangana commodity data.")


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

