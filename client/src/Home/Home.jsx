
  import React, { useState, useEffect } from "react";
import './home.css'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  BarChart3, 
  PieChart, 
  Edit, 
  Trash2, 
  Plus,
  Target,
  Clock,
  Activity
} from "lucide-react";

export default function StockPortfolioTracker() {
  const [transactions, setTransactions] = useState([]);
  const [formData, setFormData] = useState({
    id: "",
    stockName: "",
    quantity: "",
    buyPrice: "",
    sellPrice: "",
    buyDate: "",
    sellDate: "",
    investedAmount: "",
    returnAmount: ""
  });
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [filterStock, setFilterStock] = useState("");
  const [sortBy, setSortBy] = useState("buyDate");


    const fetchTransactions = async () => {
  const res = await fetch("http://localhost:5000/api/transactions");
  const data = await res.json();
  setTransactions(data);
};

useEffect(() => {
  fetchTransactions();
}, []);

  // Utility functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short", 
      year: "numeric"
    });
  };

  const calculateMetrics = (transaction) => {
    // Use invested/return amounts if available, otherwise calculate from buy/sell prices
    const investment = transaction.investedAmount || (transaction.buyPrice * transaction.quantity);
    const returns = transaction.returnAmount || (transaction.sellPrice * transaction.quantity);
    const profitLoss = returns - investment;
    const profitLossPercentage = (profitLoss / investment) * 100;
    
    const buyDate = new Date(transaction.buyDate);
    const sellDate = new Date(transaction.sellDate);
    const holdingDays = Math.ceil((sellDate - buyDate) / (1000 * 60 * 60 * 24));
    
    return {
      investment,
      returns,
      profitLoss,
      profitLossPercentage,
      holdingDays
    };
  };

  // Portfolio analytics
  const getPortfolioAnalytics = () => {
    if (transactions.length === 0) {
      return {
        totalInvestment: 0,
        totalReturns: 0,
        netProfitLoss: 0,
        netProfitLossPercentage: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        avgHoldingPeriod: 0,
        bestTrade: null,
        worstTrade: null,
        totalTrades: 0
      };
    }

    let totalInvestment = 0;
    let totalReturns = 0;
    let totalHoldingDays = 0;
    let winCount = 0;
    let loseCount = 0;
    let bestTrade = null;
    let worstTrade = null;
    let bestProfitLoss = -Infinity;
    let worstProfitLoss = Infinity;

    transactions.forEach(transaction => {
      const metrics = calculateMetrics(transaction);
      totalInvestment += metrics.investment;
      totalReturns += metrics.returns;
      totalHoldingDays += metrics.holdingDays;

      if (metrics.profitLoss > 0) winCount++;
      else if (metrics.profitLoss < 0) loseCount++;

      if (metrics.profitLoss > bestProfitLoss) {
        bestProfitLoss = metrics.profitLoss;
        bestTrade = { ...transaction, metrics };
      }

      if (metrics.profitLoss < worstProfitLoss) {
        worstProfitLoss = metrics.profitLoss;
        worstTrade = { ...transaction, metrics };
      }
    });

    const netProfitLoss = totalReturns - totalInvestment;
    const netProfitLossPercentage = totalInvestment > 0 ? (netProfitLoss / totalInvestment) * 100 : 0;
    const winRate = transactions.length > 0 ? (winCount / transactions.length) * 100 : 0;
    const avgHoldingPeriod = transactions.length > 0 ? totalHoldingDays / transactions.length : 0;

    return {
      totalInvestment,
      totalReturns,
      netProfitLoss,
      netProfitLossPercentage,
      winningTrades: winCount,
      losingTrades: loseCount,
      winRate,
      avgHoldingPeriod,
      bestTrade,
      worstTrade,
      totalTrades: transactions.length
    };
  };

  // Advanced average investment calculation
  const calculateAdvancedAverageInvestment = () => {
    if (transactions.length === 0) return 0;

    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    let totalRupeeDays = 0;
    const investedDaysSet = new Set();

    transactions.forEach(transaction => {
      const buyDate = new Date(transaction.buyDate);
      const sellDate = new Date(transaction.sellDate);
      const investment = transaction.investedAmount || (transaction.buyPrice * transaction.quantity);
      
      const holdingDays = Math.floor((sellDate - buyDate) / MS_PER_DAY);
      totalRupeeDays += investment * holdingDays;

      // Track unique days when capital was deployed
      let currentDate = new Date(buyDate);
      while (currentDate < sellDate) {
        investedDaysSet.add(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    return investedDaysSet.size > 0 ? totalRupeeDays / investedDaysSet.size : 0;
  };

  // Form handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

 
const handleFormSubmit = async () => {
  const newTransaction = {
    stockName: formData.stockName,
    quantity: parseFloat(formData.quantity),
    buyPrice: parseFloat(formData.buyPrice),
    sellPrice: parseFloat(formData.sellPrice),
    buyDate: formData.buyDate,
    sellDate: formData.sellDate,
    investedAmount: parseFloat(formData.investedAmount) || undefined,
    returnAmount: parseFloat(formData.returnAmount) || undefined
  };

  if (formData.id) {
    // If editing → Update (PUT)
    await fetch(`http://localhost:5000/api/transactions/${formData.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTransaction)
    });
  } else {
    // If new → Create (POST)
    await fetch("http://localhost:5000/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTransaction)
    });
  }

  // Refresh after API call
  fetchTransactions();
  resetForm();
};

  const resetForm = () => {
    setFormData({
      id: "",
      stockName: "",
      quantity: "",
      buyPrice: "",
      sellPrice: "",
      buyDate: "",
      sellDate: "",
      investedAmount: "",
      returnAmount: ""
    });
    setIsFormVisible(false);
  };

  const handleEdit = (transaction) => {
    setFormData({
      ...transaction,
      id: transaction._id,
      investedAmount: transaction.investedAmount || "",
      returnAmount: transaction.returnAmount || ""
    });
    setIsFormVisible(true);
  };

  const handleDelete = async (id) => {
  const confirmDelete = window.confirm("Are you sure you want to delete this transaction?");
  if (!confirmDelete) return;

  await fetch(`http://localhost:5000/api/transactions/${id}`, {
    method: "DELETE"
  });

  fetchTransactions();
};



  // Filter and sort transactions
  const getFilteredAndSortedTransactions = () => {
    let filtered = transactions;
    
    if (filterStock) {
      filtered = transactions.filter(t => 
        t.stockName.toLowerCase().includes(filterStock.toLowerCase())
      );
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'stockName':
          return a.stockName.localeCompare(b.stockName);
        case 'profitLoss':
          return calculateMetrics(b).profitLoss - calculateMetrics(a).profitLoss;
        case 'buyDate':
        default:
          return new Date(b.buyDate) - new Date(a.buyDate);
      }
    });
  };

  const analytics = getPortfolioAnalytics();
  const filteredTransactions = getFilteredAndSortedTransactions();
  const avgDailyInvestment = calculateAdvancedAverageInvestment();

  return (
    <div className="app-container">
      <div className="dashboard">
        {/* Header Section */}
        <div className="header-section">
          <div className="header-title">
            <div className="header-icon">
              <BarChart3 className="icon-lg text-white" />
            </div>
            <h1 className="title">Stock Portfolio Tracker</h1>
          </div>
          <p className="subtitle">
            Comprehensive analysis of your trading performance
          </p>
        </div>

        {/* Key Metrics Dashboard */}
        <div className="metrics-grid">
          <div className="metric-card border-blue">
            <div className="metric-content">
              <div>
                <p className="metric-label">Total Investment</p>
                <p className="metric-value">
                  {formatCurrency(analytics.totalInvestment)}
                </p>
                <p className="metric-sub">
                  {analytics.totalTrades} transactions
                </p>
              </div>
              <div className="metric-icon bg-blue">
                <DollarSign className="icon-md text-blue" />
              </div>
            </div>
          </div>

          <div className="metric-card border-green">
            <div className="metric-content">
              <div>
                <p className="metric-label">Total Returns</p>
                <p className="metric-value">
                  {formatCurrency(analytics.totalReturns)}
                </p>
                <p className="metric-sub text-green">After selling</p>
              </div>
              <div className="metric-icon bg-green">
                <TrendingUp className="icon-md text-green" />
              </div>
            </div>
          </div>

          <div
            className={`metric-card ${
              analytics.netProfitLoss >= 0 ? "border-emerald" : "border-red"
            }`}
          >
            <div className="metric-content">
              <div>
                <p className="metric-label">Net P&L</p>
                <p
                  className={`metric-value ${
                    analytics.netProfitLoss >= 0 ? "text-emerald" : "text-red"
                  }`}
                >
                  {analytics.netProfitLoss >= 0 ? "+" : ""}
                  {formatCurrency(Math.abs(analytics.netProfitLoss))}
                </p>
                <p
                  className={`metric-sub ${
                    analytics.netProfitLoss >= 0 ? "text-emerald" : "text-red"
                  }`}
                >
                  {analytics.netProfitLoss >= 0 ? "+" : ""}
                  {analytics.netProfitLossPercentage.toFixed(2)}%
                </p>
              </div>
              <div
                className={`metric-icon ${
                  analytics.netProfitLoss >= 0 ? "bg-emerald" : "bg-red"
                }`}
              >
                {analytics.netProfitLoss >= 0 ? (
                  <TrendingUp className="icon-md text-emerald" />
                ) : (
                  <TrendingDown className="icon-md text-red" />
                )}
              </div>
            </div>
          </div>

          <div className="metric-card border-purple">
            <div className="metric-content">
              <div>
                <p className="metric-label">Success Rate</p>
                <p className="metric-value text-purple">
                  {analytics.winRate.toFixed(1)}%
                </p>
                <p className="metric-sub">
                  {analytics.winningTrades}W • {analytics.losingTrades}L
                </p>
              </div>
              <div className="metric-icon bg-purple">
                <Target className="icon-md text-purple" />
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Analytics */}
        <div className="analytics-grid">
          <div className="analytics-card">
            <div className="analytics-header">
              <Clock className="icon-sm text-indigo" />
              <h3 className="analytics-title">Time Analysis</h3>
            </div>
            <div className="analytics-content">
              <div className="analytics-row">
                <span>Avg. Holding Period</span>
                <span>
                  {Math.round(analytics.avgHoldingPeriod)} days
                </span>
              </div>
              <div className="analytics-row">
                <span>Avg. Daily Investment</span>
                <span>{formatCurrency(avgDailyInvestment)}</span>
              </div>
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-header">
              <Activity className="icon-sm text-green" />
              <h3 className="analytics-title">Best Performance</h3>
            </div>
            {analytics.bestTrade ? (
              <div className="analytics-content">
                <div className="analytics-row">
                  <span>Stock</span>
                  <span>{analytics.bestTrade.stockName}</span>
                </div>
                <div className="analytics-row">
                  <span>Profit</span>
                  <span className="text-green">
                    +{formatCurrency(analytics.bestTrade.metrics.profitLoss)}
                  </span>
                </div>
                <div className="analytics-row">
                  <span>Return</span>
                  <span className="text-green">
                    +{analytics.bestTrade.metrics.profitLossPercentage.toFixed(
                      2
                    )}
                    %
                  </span>
                </div>
              </div>
            ) : (
              <p className="no-data">No data available</p>
            )}
          </div>

          <div className="analytics-card">
            <div className="analytics-header">
              <TrendingDown className="icon-sm text-red" />
              <h3 className="analytics-title">Worst Performance</h3>
            </div>
            {analytics.worstTrade ? (
              <div className="analytics-content">
                <div className="analytics-row">
                  <span>Stock</span>
                  <span>{analytics.worstTrade.stockName}</span>
                </div>
                <div className="analytics-row">
                  <span>Loss</span>
                  <span className="text-red">
                    {formatCurrency(analytics.worstTrade.metrics.profitLoss)}
                  </span>
                </div>
                <div className="analytics-row">
                  <span>Return</span>
                  <span className="text-red">
                    {analytics.worstTrade.metrics.profitLossPercentage.toFixed(
                      2
                    )}
                    %
                  </span>
                </div>
              </div>
            ) : (
              <p className="no-data">No data available</p>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="controls">
          <button
            onClick={() => setIsFormVisible(!isFormVisible)}
            className="btn-primary"
          >
            <Plus className="icon-sm" />
            Add New Transaction
          </button>

          <div className="controls-right">
            <input
              type="text"
              placeholder="Filter by stock name..."
              value={filterStock}
              onChange={(e) => setFilterStock(e.target.value)}
              className="input"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input"
            >
              <option value="buyDate">Sort by Date</option>
              <option value="stockName">Sort by Stock</option>
              <option value="profitLoss">Sort by P&L</option>
            </select>
          </div>
        </div>

        {/* Transaction Form */}
        {isFormVisible && (
          <div className="form-card">
            <h2 className="form-title">
              {formData.id ? "Edit Transaction" : "Add New Transaction"}
            </h2>
            <div className="form-grid">
              <div>
                <label className="form-label">Stock Name</label>
                <input
                  type="text"
                  name="stockName"
                  value={formData.stockName}
                  onChange={handleInputChange}
                  placeholder="e.g., RELIANCE"
                  className="input"
                />
              </div>

              <div>
                <label className="form-label">Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  placeholder="10"
                  className="input"
                />
              </div>

              <div>
                <label className="form-label">Buy Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  name="buyPrice"
                  value={formData.buyPrice}
                  onChange={handleInputChange}
                  placeholder="2400.50"
                  className="input"
                />
              </div>

              <div>
                <label className="form-label">Sell Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  name="sellPrice"
                  value={formData.sellPrice}
                  onChange={handleInputChange}
                  placeholder="2600.75"
                  className="input"
                />
              </div>

              <div>
                <label className="form-label">Invested Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  name="investedAmount"
                  value={formData.investedAmount}
                  onChange={handleInputChange}
                  placeholder="24005.00 (optional)"
                  className="input"
                />
              </div>

              <div>
                <label className="form-label">Return Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  name="returnAmount"
                  value={formData.returnAmount}
                  onChange={handleInputChange}
                  placeholder="26007.50 (optional)"
                  className="input"
                />
              </div>

              <div>
                <label className="form-label">Buy Date</label>
                <input
                  type="date"
                  name="buyDate"
                  value={formData.buyDate}
                  onChange={handleInputChange}
                  className="input"
                />
              </div>

              <div>
                <label className="form-label">Sell Date</label>
                <input
                  type="date"
                  name="sellDate"
                  value={formData.sellDate}
                  onChange={handleInputChange}
                  className="input"
                />
              </div>
            </div>

            <div className="form-actions">
              <button onClick={handleFormSubmit} className="btn-blue">
                {formData.id ? "Update" : "Add"} Transaction
              </button>
              <button onClick={resetForm} className="btn-gray">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Transactions Table */}
        <div className="table-card">
          <div className="table-header">
            <h2 className="table-title">Transaction History</h2>
            <p className="table-sub">
              {filteredTransactions.length} transactions
            </p>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="table-empty">
              <BarChart3 className="icon-xl text-gray" />
              <h3>No transactions found</h3>
              <p>
                {filterStock
                  ? `No transactions found for "${filterStock}"`
                  : "Add your first transaction to get started!"}
              </p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Stock</th>
                    <th>Qty</th>
                    <th>Buy Price</th>
                    <th>Sell Price</th>
                    <th>Investment</th>
                    <th>Returns</th>
                    <th>P&L</th>
                    <th>P&L %</th>
                    <th>Hold Days</th>
                    <th>Period</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => {
                    const metrics = calculateMetrics(transaction);
                    return (
                      <tr key={transaction._id}>
                        <td>{transaction.stockName}</td>
                        <td>{transaction.quantity}</td>
                        <td>₹{transaction.buyPrice?.toLocaleString()}</td>
                        <td>₹{transaction.sellPrice?.toLocaleString()}</td>
                        <td>{formatCurrency(metrics.investment)}</td>
                        <td>{formatCurrency(metrics.returns)}</td>
                        <td className={metrics.profitLoss >= 0 ? "text-green" : "text-red"}>
                          {metrics.profitLoss >= 0 ? "+" : ""}
                          {formatCurrency(Math.abs(metrics.profitLoss))}
                        </td>
                        <td className={metrics.profitLoss >= 0 ? "text-green" : "text-red"}>
                          {metrics.profitLoss >= 0 ? "+" : ""}
                          {metrics.profitLossPercentage.toFixed(2)}%
                        </td>
                        <td>
                          <div className="hold-days">
                            <Calendar className="icon-xs" />
                            <span>{metrics.holdingDays}</span>
                          </div>
                        </td>
                        <td>
                          <div>{formatDate(transaction.buyDate)}</div>
                          <div>{formatDate(transaction.sellDate)}</div>
                        </td>
                        <td>
                          <div className="table-actions">
                            <button
                              onClick={() => handleEdit(transaction)}
                              className="action-btn text-blue"
                              title="Edit Transaction"
                            >
                              <Edit className="icon-xs" />
                            </button>
                            <button
                              onClick={() => handleDelete(transaction._id)}
                              className="action-btn text-red"
                              title="Delete Transaction"
                            >
                              <Trash2 className="icon-xs" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};