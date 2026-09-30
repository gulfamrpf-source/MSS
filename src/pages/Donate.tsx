import React, { useState, useEffect } from 'react';
import { Heart, CreditCard, CheckCircle2, AlertCircle, Loader2, Globe } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function Donate() {
  const [amount, setAmount] = useState<number>(500);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [currency, setCurrency] = useState<string>('INR');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'failed'>('idle');
  const [transactionId, setTransactionId] = useState('');
  const [razorpayKeyId, setRazorpayKeyId] = useState('');

  const currencies = [
    { code: 'INR', symbol: '₹', amounts: [100, 500, 1000, 5000] },
    { code: 'USD', symbol: '$', amounts: [10, 50, 100, 500] },
    { code: 'EUR', symbol: '€', amounts: [10, 50, 100, 500] },
    { code: 'GBP', symbol: '£', amounts: [10, 50, 100, 500] },
    { code: 'AUD', symbol: 'A$', amounts: [15, 50, 150, 500] },
    { code: 'CAD', symbol: 'C$', amounts: [15, 50, 150, 500] },
    { code: 'SGD', symbol: 'S$', amounts: [15, 50, 150, 500] },
    { code: 'AED', symbol: 'د.إ', amounts: [50, 200, 500, 1000] }
  ];

  const currentCurrency = currencies.find(c => c.code === currency) || currencies[0];
  const predefinedAmounts = currentCurrency.amounts;

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    // Fetch key ID from backend
    fetch('/api/payment-config')
      .then(res => res.json())
      .then(data => {
        if (data.keyId) setRazorpayKeyId(data.keyId);
      })
      .catch(err => console.error("Error fetching payment config:", err));

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleAmountClick = (val: number) => {
    setAmount(val);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomAmount(e.target.value);
    setAmount(0);
  };

  const finalAmount = amount || parseInt(customAmount) || 0;

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (finalAmount < 1) {
      alert("Please enter a valid amount greater than 0");
      return;
    }
    if (!razorpayKeyId) {
      if (window.confirm("Payment gateway is not configured yet. Do you want to record this as a Test/Offline Donation?")) {
        setIsProcessing(true);
        setStatus('idle');
        try {
          const fakePaymentId = 'pay_offline_' + Date.now();
          await addDoc(collection(db, 'donations'), {
            donorName: name,
            donorEmail: email,
            donorPhone: phone,
            amount: finalAmount,
            currency: currency,
            paymentId: fakePaymentId,
            orderId: 'order_offline_' + Date.now(),
            status: 'successful',
            timestamp: serverTimestamp()
          });
          setTransactionId(fakePaymentId);
          setStatus('success');
        } catch(e: any) {
          alert('Error: ' + e.message);
          setStatus('failed');
        } finally {
          setIsProcessing(false);
        }
      }
      return;
    }

    setIsProcessing(true);
    setStatus('idle');

    try {
      // 1. Create order on server
      const orderResponse = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: finalAmount, currency: currency })
      });
      
      const order = await orderResponse.json();
      
      if (!orderResponse.ok) {
        throw new Error(order.error || 'Failed to create order');
      }

      // 2. Open Razorpay Checkout
      const options = {
        key: razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: "Manav Samanta Sangthan",
        description: "Donation towards social welfare",
        order_id: order.id,
        handler: async function (response: any) {
          try {
            // 3. Verify payment on server
            const verifyResponse = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response)
            });
            
            const verifyResult = await verifyResponse.json();
            
            if (verifyResult.success) {
              setTransactionId(response.razorpay_payment_id);
              setStatus('success');
              
              // 4. Save to Firestore
              await addDoc(collection(db, 'donations'), {
                donorName: name,
                donorEmail: email,
                donorPhone: phone,
                amount: finalAmount,
                currency: currency,
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                status: 'successful',
                timestamp: serverTimestamp()
              });
            } else {
              setStatus('failed');
              // Save failed attempt
              await addDoc(collection(db, 'donations'), {
                donorName: name,
                donorEmail: email,
                donorPhone: phone,
                amount: finalAmount,
                currency: currency,
                orderId: order.id,
                status: 'failed',
                timestamp: serverTimestamp()
              });
            }
          } catch (err) {
            console.error("Verification error:", err);
            setStatus('failed');
          }
        },
        prefill: {
          name: name,
          email: email,
          contact: phone
        },
        theme: {
          color: "#10b981"
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', async function (response: any) {
        setStatus('failed');
        try {
           await addDoc(collection(db, 'donations'), {
                donorName: name,
                donorEmail: email,
                donorPhone: phone,
                amount: finalAmount,
                currency: currency,
                orderId: order.id,
                errorReason: response.error.description,
                status: 'failed',
                timestamp: serverTimestamp()
              });
        } catch (e) {
          console.error("Error saving failed donation", e);
        }
      });
      rzp.open();
      
    } catch (error) {
      console.error("Payment initiation error:", error);
      alert("Failed to initiate payment. Please try again.");
      setStatus('failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen pt-24 pb-12 bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Thank You, {name}!</h2>
          <p className="text-slate-600 mb-6">Your generous donation of {currentCurrency.symbol}{finalAmount} has been received successfully.</p>
          <div className="bg-slate-50 p-4 rounded-xl text-sm text-left mb-6">
            <p className="text-slate-500 mb-1">Transaction ID</p>
            <p className="font-mono font-medium text-slate-800">{transactionId}</p>
          </div>
          <button 
            onClick={() => setStatus('idle')}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl transition-colors"
          >
            Make Another Donation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 bg-slate-50">
      <div className="max-w-3xl mx-auto px-4">
        
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-100 text-rose-600 mb-4">
            <Heart className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Support Our Cause</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Your contribution helps us continue our mission of providing equal opportunities, respect, and dignity to everyone in the society.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 md:p-8">
            <form onSubmit={handleDonate}>
              
              {/* Currency Selection */}
              <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">International Donations</h3>
                      <p className="text-xs text-slate-500">Select your preferred currency</p>
                    </div>
                  </div>
                  <select 
                    value={currency} 
                    onChange={(e) => {
                      const newCurr = e.target.value;
                      setCurrency(newCurr);
                      const currData = currencies.find(c => c.code === newCurr);
                      if (currData) {
                        setAmount(currData.amounts[1]);
                      }
                      setCustomAmount('');
                    }}
                    className="px-4 py-2.5 bg-white border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-700 min-w-[120px]"
                  >
                    {currencies.map(c => (
                      <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Amount Selection */}
              <div className="mb-8">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Select Amount ({currency})</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {predefinedAmounts.map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleAmountClick(val)}
                      className={`py-3 px-4 rounded-xl border-2 font-bold text-lg transition-colors ${
                        amount === val && !customAmount
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/50'
                      }`}
                    >
                      {currentCurrency.symbol}{val}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">{currentCurrency.symbol}</span>
                  <input
                    type="number"
                    placeholder="Enter custom amount"
                    value={customAmount}
                    onChange={handleCustomAmountChange}
                    min="1"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 outline-none transition-colors font-medium ${
                      customAmount ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200 bg-slate-50 focus:border-emerald-500 focus:bg-white'
                    }`}
                  />
                </div>
              </div>

              {/* Donor Details */}
              <div className="mb-8">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Your Details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                    <input 
                      type="text" 
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      placeholder="e.g. John Doe"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                      <input 
                        type="email" 
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number (with Country Code)</label>
                      <input 
                        type="tel" 
                        required
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        placeholder="+91 9876543210"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {status === 'failed' && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">Payment failed or was cancelled. Please try again or use a different payment method.</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isProcessing || finalAmount < 1}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-6 h-6" /> Donate {currentCurrency.symbol}{finalAmount || 0} Securely
                  </>
                )}
              </button>
              
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Secured by Razorpay. Supports International Cards, UPI & Net Banking.
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
