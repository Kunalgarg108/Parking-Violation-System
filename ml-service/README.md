# ML Models Directory

## Purpose

This folder is designated for storing trained machine learning model artifacts that will support future real-time inference in the Parking Intelligence System. Models trained during the batch analytics pipeline can be serialized here for use by a future prediction service.

## Expected Model Files

| File | Description |
|------|-------------|
| `parking_activity_classifier.pkl` | Activity classification model for categorizing parking violation patterns |
| `parking_severity_regressor.pkl` | Severity regression model (XGBRegressor) for predicting violation severity scores |
| `h3_encoder.pkl` | H3 spatial encoder for transforming geographic coordinates into spatial features |
| `feature_list.pkl` | Feature list used by models to ensure consistent input feature ordering |

## Important: V1 Scope

**These files are NOT used in V1.** The V1 implementation is entirely CSV-based. All analytics outputs are produced as static CSV files by the batch processing pipeline. No model loading, no FastAPI endpoints, no inference pipeline, and no real-time prediction functionality exists in V1.

This directory is created as a placeholder to establish the project structure for future ML service development.
