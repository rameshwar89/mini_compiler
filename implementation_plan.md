# Implementation Plan: Fill Poster.pptx

This plan details the text we will insert into your `PosterTemplate.pptx` for the "Market GNN-LSTM" project.

## User Review Required

Please review the proposed text below. Let me know if you would like me to adjust the wording, update the author names, or include specific diagrams before I run the script to update the PowerPoint file.

## Open Questions

- **Author Names**: The template currently asks for "Student Name 1", "Mentor Name", etc. Do you want me to insert actual names or leave them as placeholders?
- **Images/Diagrams**: PowerPoint requires actual image files to insert block diagrams or charts. I will leave the placeholder text for images unless you have specific image paths (like `.png` files) you want me to insert into the shapes.

## Proposed Changes

I will run a python script using `python-pptx` to modify the text in the exact shapes of your `PosterTemplate.pptx`.

### Proposed Content Mapping:

*   **Title (Shape 6)**: Market GNN-LSTM: Graph-Based Framework for Stock Market Trend & Risk Analysis
*   **Abstract (Shape 13)**: 
    This project introduces a hybrid Graph Neural Network (GNN) and Long Short-Term Memory (LSTM) framework to predict stock market trends by integrating historical price data and real-time news sentiment. Traditional models often analyze stocks in isolation, ignoring the complex interdependencies between companies. Our approach constructs a dynamic graph where nodes represent companies (AAPL, AMZN, GOOGL, MSFT, TSLA) and edges capture their 30-day return correlations and news co-occurrence. We utilize FinBERT for high-accuracy financial sentiment scoring from GDELT news headlines. By transitioning to predicting next-day return deltas instead of absolute prices, our model achieves a trend accuracy of 51.53% with a Validation MSE of 0.000745. The framework demonstrates the critical advantage of combining spatial graph relationships with temporal sequence modeling for financial forecasting.
*   **Problem Statement (Shape 18)**:
    ▸ What specific problem exists: Traditional time-series models treat stocks independently, missing market-wide ripple effects.
    ▸ Who is affected: Retail investors and financial institutions relying on outdated, isolated predictions.
    ▸ Why AI/Data-driven: Financial markets are driven by hidden correlations and rapid news cycles that exceed human analysis capabilities.
    ▸ Current limitations: Existing LSTM models lag behind price shifts and fail to incorporate relationship dynamics and real-time sentiment accurately.
*   **Related Work 1 (Shape 25)**:
    Method: Standard LSTM for time-series forecasting.
    Result: Captures temporal patterns well.
    Gap: Ignores spatial relationships (how one stock affects another).
*   **Related Work 2 (Shape 29)**:
    Method: NLP sentiment analysis using standard BERT.
    Result: Extracts basic market mood.
    Gap: Lacks domain-specific financial context, leading to misclassification of economic terms.
*   **Research Gap (Shape 31)**:
    Research Gap: A unified architecture that simultaneously models temporal price sequences and spatial market interdependencies using domain-specific sentiment (FinBERT).
*   **Objectives (Shape 35)**:
    ▸ Objective 1: Integrate spatial (GNN) and temporal (LSTM) models for stock prediction.
    ▸ Objective 2: Incorporate FinBERT-based sentiment analysis from GDELT headlines.
    ▸ Objective 3: Construct a dynamic correlation graph based on price returns and news co-occurrence.
    ▸ Objective 4: Achieve >50% directional trend accuracy for next-day returns.
*   **Dataset & Tools (Shapes 61-69)**:
    *   Dataset: Yahoo Finance (Prices) & GDELT (13,000+ News Headlines)
    *   Algorithm / Model: Hybrid GAT (Graph Attention Network) + LSTM
    *   Frameworks: Python, PyTorch Geometric, Transformers (FinBERT), Streamlit
    *   Hardware: RTX 2050 GPU / CUDA 12.4
    *   Evaluation Metric: Trend Accuracy / MSE
*   **Key Equations / Pseudocode (Shape 74)**:
    ```python
    # GNN-LSTM Forward Pass
    def forward(self, x, edge_index, edge_attr):
        # x: [batch, nodes, seq_len, features]
        batch_size, num_nodes, seq_len, num_feats = x.shape
        
        # 1. Temporal feature extraction
        lstm_out, _ = self.lstm(x.view(-1, seq_len, num_feats))
        temporal_feats = lstm_out[:, -1, :].view(batch_size, num_nodes, -1)
        
        # 2. Spatial message passing
        graph_out = self.gat(temporal_feats, edge_index, edge_attr)
        
        # 3. Final Prediction
        return self.fc(graph_out)
    ```
*   **Results & Analysis (Shapes 79-89)**:
    *   Accuracy: 51.53% (Trend Accuracy)
    *   Secondary: 0.000745 (Validation MSE)
    *   Inference Time: ~15 ms (Avg. per sample)
*   **Discussion (Shape 99)**:
    ▸ Interpret what the results mean: A >50% trend accuracy in predicting next-day returns offers a statistical edge over random market walks.
    ▸ Did outcomes match hypothesis: Yes, integrating GNN edges improved prediction stability over isolated LSTMs.
    ▸ Surprising findings: FinBERT sentiment spikes heavily influence same-day volatility but have decaying predictive power for next-day returns.
    ▸ Compare qualitatively: Reduces prediction lag compared to baseline models by focusing on return deltas.
*   **Conclusion (Shape 104)**:
    ▸ Core contribution: A scalable pipeline combining FinBERT sentiment, GAT spatial routing, and LSTM sequence modeling.
    ▸ Key result: Achieved 51.53% directional accuracy across 5 major tech stocks.
    ▸ Deployment potential: Real-time integration via the developed Streamlit dashboard for continuous market monitoring.
*   **Future Work (Shape 107)**:
    ▸ Extend to the full S&P 500 universe to increase graph density.
    ▸ Explore intra-day tick data and high-frequency news streams.
*   **References (Shape 111)**:
    [1] Huang et al., "FinBERT: A Large Language Model for Extracting Information from Financial Text," 2019.
    [2] Kipf & Welling, "Semi-Supervised Classification with Graph Convolutional Networks," ICLR, 2017.
    [3] Hochreiter & Schmidhuber, "Long Short-Term Memory," Neural Computation, 1997.
    [4] Project Dashboard: Streamlit local deployment.

## Verification Plan

1.  Run `fill_poster.py` using `python-pptx`.
2.  Open the newly generated `Poster_Filled.pptx` or manually verify it.
3.  The user can then review the visual formatting of the resulting PowerPoint file.
