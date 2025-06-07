import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.neural_network import MLPRegressor
from sklearn.preprocessing import StandardScaler
import joblib
import os

# --- 1. Data Simulation ---
# In a real project, you would load your dataset here, e.g., from a CSV
# df = pd.read_csv('your_commodity_prices.csv')

print("Simulating agricultural commodity data...")

# Create a sample DataFrame
np.random.seed(42) # for reproducibility
dates = pd.to_datetime(pd.date_range(start='2022-01-01', end='2023-12-31'))
num_days = len(dates)
commodities = ['Wheat', 'Corn', 'Soybeans']
locations = ['North Farm', 'South Farm', 'East Farm']

data = []
for _ in range(1000): # Create 1000 data points
    date = pd.to_datetime(np.random.choice(dates))
    commodity = np.random.choice(commodities)
    location = np.random.choice(locations)
    
    # Simulate a base price and some seasonality + noise
    base_price = {'Wheat': 100, 'Corn': 200, 'Soybeans': 150}[commodity]
    seasonality = np.sin(2 * np.pi * date.dayofyear / 365.25) * 20
    noise = np.random.normal(0, 10)
    
    price = base_price + seasonality + noise
    if location == 'South Farm':
        price *= 1.1 # South Farm is slightly more expensive
    
    data.append([date, commodity, location, price])

df = pd.DataFrame(data, columns=['date', 'commodity', 'location', 'price'])

print("Data simulation complete.")
print(df.head())

# --- 2. Feature Engineering ---
# Convert categorical data to numerical data for the model
print("Performing feature engineering...")
df['day_of_year'] = df['date'].dt.dayofyear
df['year'] = df['date'].dt.year

# Create dummy variables for categorical features
df_dummies = pd.get_dummies(df, columns=['commodity', 'location'], drop_first=True)

# Define features (X) and target (y)
features = [col for col in df_dummies.columns if col not in ['date', 'price']]
X = df_dummies[features]
y = df_dummies['price']

print("Features for the model:", features)

# --- 3. Model Training ---
print("Splitting data and training models...")

# Split the data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Scale features for MLP
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)


# Initialize and train the Random Forest Regressor
rf_model = RandomForestRegressor(n_estimators=100, random_state=42, oob_score=True)
rf_model.fit(X_train, y_train)

# Initialize and train the MLP Regressor (Neural Network)
mlp_model = MLPRegressor(hidden_layer_sizes=(100, 50), max_iter=500, random_state=42, early_stopping=True)
mlp_model.fit(X_train_scaled, y_train)


print("\n--- Model Evaluation (Simplified) ---")
rf_score = rf_model.score(X_test, y_test)
mlp_score = mlp_model.score(X_test_scaled, y_test)
print(f"Random Forest R^2 Score on Test Set: {rf_score:.4f}")
print(f"MLP Regressor R^2 Score on Test Set: {mlp_score:.4f}")
print(f"Random Forest Out-of-Bag Score: {rf_model.oob_score_:.4f}")


# --- 4. Save the Models ---
print("\nSaving trained models to disk...")

# Create the 'models' directory if it doesn't exist
models_dir = 'models'
if not os.path.exists(models_dir):
    os.makedirs(models_dir)

# Save the Random Forest model, MLP model, and the scaler
joblib.dump(rf_model, os.path.join(models_dir, 'random_forest_model.pkl'))
joblib.dump(mlp_model, os.path.join(models_dir, 'mlp_model.pkl'))
joblib.dump(scaler, os.path.join(models_dir, 'scaler.pkl'))
joblib.dump(features, os.path.join(models_dir, 'features.pkl')) # Save the feature list

print("Models, scaler, and feature list saved successfully in 'models/' directory.")