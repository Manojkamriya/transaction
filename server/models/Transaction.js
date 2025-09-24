const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  stockName: { type: String, required: true },
  quantity: { type: Number, required: true },
  buyPrice: { type: Number, required: false },
  sellPrice: { type: Number, required: false },
  buyDate: { type: Date, required: true },
  sellDate: { type: Date, required: true },

 
  investedAmount: { type: Number, required: true }, 
  returnAmount: { type: Number, required: true }    

}, { timestamps: true });

module.exports = mongoose.model("Transaction", transactionSchema);
